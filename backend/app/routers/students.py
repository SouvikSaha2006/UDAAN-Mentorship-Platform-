from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User, UserRole
from app.models.academic import Department, Course
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.schemas.student_profile import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
    StudentPersonalUpdate,
    StudentAcademicsUpdate,
    StudentAccessibilityUpdate,
    StudentAccessibilityResponse,
    StudentStatusUpdate,
)
from app.schemas.accessibility import AccessibilitySettingsResponse
from app.utils.security import (
    get_current_user,
    require_admin,
    require_roles,
    revoke_all_user_tokens,
)
from app.utils.id_generator import generate_student_id

router = APIRouter(prefix="/students", tags=["Students"])


def calculate_profile_completion(p: StudentProfile) -> int:
    """
    Computes a realistic, dynamic profile completion percentage (0-100%).
    """
    score = 40  # Base registration score
    if p.phone and len(p.phone.strip()) >= 7:
        score += 10
    if p.bio and len(p.bio.strip()) >= 15:
        score += 15
    if p.career_goal and len(p.career_goal.strip()) >= 5:
        score += 15
    if p.disability_type or (p.assistive_devices and len(p.assistive_devices) > 0):
        score += 10
    if p.guardian_name or p.guardian_phone:
        score += 10
    return min(100, max(0, score))


def enrich_profile_response(
    p: StudentProfile,
    current_user: Optional[User] = None,
) -> StudentProfileResponse:
    """
    Constructs a StudentProfileResponse.
    Feature 4: Enforces privacy filtering for non-authorized viewers (mentors/faculty/peers).
    Sensitive fields (guardian contacts, address, udid_number, private accommodation_needs)
    are hidden unless the viewer is the student owner or an admin/support staff.
    """
    is_authorized = True
    if current_user:
        if current_user.id != p.user_id and current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
            is_authorized = False

    a11y_resp = None
    if p.user and p.user.accessibility_settings:
        s = p.user.accessibility_settings
        a11y_resp = AccessibilitySettingsResponse(
            id=s.id,
            userId=s.user_id,
            fontScale=s.font_scale,
            darkMode=s.dark_mode,
            highContrast=s.high_contrast,
            highlightLinks=s.highlight_links,
            dyslexiaFont=s.dyslexia_font,
            readingMode=s.reading_mode,
            lineSpacing=s.line_spacing,
            largeControls=s.large_controls,
            reducedMotion=s.reduced_motion,
            focusEnhanced=s.focus_enhanced,
            writtenNotifications=s.written_notifications,
            captionMode=s.caption_mode,
            ttsRate=s.tts_rate,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )

    return StudentProfileResponse(
        id=p.id,
        userId=p.user_id,
        studentId=p.student_id,
        fullName=p.full_name,
        phone=p.phone if is_authorized else None,
        dateOfBirth=p.date_of_birth if is_authorized else None,
        gender=p.gender,
        address=p.address if is_authorized else None,
        guardianName=p.guardian_name if is_authorized else None,
        guardianPhone=p.guardian_phone if is_authorized else None,
        bio=p.bio,
        avatarUrl=p.avatar_url,
        avatarColor=p.avatar_color,
        departmentId=p.department_id,
        departmentName=p.department.name if p.department else None,
        courseId=p.course_id,
        courseName=p.course.name if p.course else None,
        semester=p.semester,
        batchYear=p.batch_year,
        rollNumber=p.roll_number,
        cgpa=p.cgpa,
        profileCompletion=p.profile_completion,
        careerGoal=p.career_goal,
        disabilityType=p.disability_type,
        disabilityPercentage=p.disability_percentage,
        assistiveDevices=p.assistive_devices or [],
        preferredCommunication=p.preferred_communication,
        accommodationNeeds=p.accommodation_needs if is_authorized else None,
        udidNumber=p.udid_number if is_authorized else None,
        email=p.user.email if p.user else None,
        isActive=p.user.is_active if p.user else True,
        accessibilitySettings=a11y_resp,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


# ==============================================================================
# Feature 4 & 5: Student Profile CRUD & Details Management
# ==============================================================================

@router.get("/me", response_model=StudentProfileResponse)
def get_my_student_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 4: Returns full student profile, joined department/course/semester metadata,
    accessibility settings, and computed profile_completion score.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        if current_user.role == UserRole.STUDENT:
            # Create initialized profile if missing
            student_id = generate_student_id(db, dept_code="GEN", year=2026)
            profile = StudentProfile(
                user_id=current_user.id,
                student_id=student_id,
                full_name=current_user.email.split("@")[0].capitalize(),
                semester=1,
                batch_year=2026,
                profile_completion=50,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found for this account.",
            )

    # Compute and persist profile completion
    profile.profile_completion = calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)

    return enrich_profile_response(profile, current_user)


@router.delete("/me")
def deactivate_my_student_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 4: Soft-deactivate student account (is_active = False)
    while preserving relational integrity and revoking active sessions.
    """
    current_user.is_active = False
    revoke_all_user_tokens(current_user.id, db)
    db.commit()
    return {"ok": True, "message": "Account has been deactivated successfully."}


@router.patch("/me/personal", response_model=StudentProfileResponse)
def update_my_personal_details(
    payload: StudentPersonalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 5: Updates personal and guardian emergency contact fields.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.address is not None:
        profile.address = payload.address
    if payload.guardian_name is not None:
        profile.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        profile.guardian_phone = payload.guardian_phone
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.career_goal is not None:
        profile.career_goal = payload.career_goal
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.avatar_color is not None:
        profile.avatar_color = payload.avatar_color

    profile.profile_completion = calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)

    return enrich_profile_response(profile, current_user)


@router.patch("/me/academics", response_model=StudentProfileResponse)
def update_my_academic_details(
    payload: StudentAcademicsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 5: Updates department, course, and semester with server-side validation.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    # 1. Resolve department
    target_dept_id = profile.department_id
    if payload.department_id or payload.department:
        query_val = payload.department_id or payload.department
        dept = db.query(Department).filter(
            or_(
                Department.id == query_val,
                Department.name.ilike(f"%{query_val}%"),
                Department.code.ilike(f"%{query_val}%"),
            )
        ).first()
        if not dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department '{query_val}' not found.")
        profile.department_id = dept.id
        target_dept_id = dept.id

    # 2. Resolve course
    course = None
    if payload.course_id or payload.course:
        query_val = payload.course_id or payload.course
        course = db.query(Course).filter(
            or_(
                Course.id == query_val,
                Course.name.ilike(f"%{query_val}%"),
                Course.code.ilike(f"%{query_val}%"),
            )
        ).first()
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Course '{query_val}' not found.")
        profile.course_id = course.id
    elif profile.course_id:
        course = db.query(Course).filter(Course.id == profile.course_id).first()

    # 3. Validate semester range (1 <= semester <= course.total_semesters)
    if payload.semester is not None:
        sem_val = payload.semester if isinstance(payload.semester, int) else int("".join(c for c in payload.semester if c.isdigit()) or 1)
        max_sem = course.total_semesters if course else 12
        if sem_val < 1 or sem_val > max_sem:
            course_name = course.name if course else "assigned course"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid semester: {sem_val}. Must be between 1 and {max_sem} for {course_name}.",
            )
        profile.semester = sem_val

    if payload.batch_year is not None:
        profile.batch_year = payload.batch_year
    if payload.roll_number is not None:
        profile.roll_number = payload.roll_number

    profile.profile_completion = calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)

    return enrich_profile_response(profile, current_user)


@router.put("/me/accessibility", response_model=StudentAccessibilityResponse)
def update_my_accessibility_details(
    payload: StudentAccessibilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 5: Persists BOTH domain accommodation fields in StudentProfile
    AND UI toolbar preferences in UserAccessibilitySettings.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    # 1. Update StudentProfile domain accommodation fields
    if payload.disability_type is not None:
        profile.disability_type = payload.disability_type
    if payload.disability_percentage is not None:
        profile.disability_percentage = payload.disability_percentage

    # Support both assistive_devices and accessibility_needs
    devices = payload.assistive_devices or payload.accessibility_needs
    if devices is not None:
        profile.assistive_devices = list(devices)

    if payload.preferred_communication is not None:
        profile.preferred_communication = payload.preferred_communication
    if payload.accommodation_needs is not None:
        profile.accommodation_needs = payload.accommodation_needs
    if payload.udid_number is not None:
        profile.udid_number = payload.udid_number

    # 2. Update UserAccessibilitySettings UI toolbar preferences
    a11y = db.query(UserAccessibilitySettings).filter(
        UserAccessibilitySettings.user_id == current_user.id
    ).first()
    if not a11y:
        a11y = UserAccessibilitySettings(user_id=current_user.id)
        db.add(a11y)
        db.flush()

    if payload.font_scale is not None:
        a11y.font_scale = payload.font_scale
    if payload.dark_mode is not None:
        a11y.dark_mode = payload.dark_mode
    if payload.high_contrast is not None:
        a11y.high_contrast = payload.high_contrast
    if payload.highlight_links is not None:
        a11y.highlight_links = payload.highlight_links
    if payload.dyslexia_font is not None:
        a11y.dyslexia_font = payload.dyslexia_font
    if payload.reading_mode is not None:
        a11y.reading_mode = payload.reading_mode
    if payload.line_spacing is not None:
        a11y.line_spacing = payload.line_spacing
    if payload.large_controls is not None:
        a11y.large_controls = payload.large_controls
    if payload.reduced_motion is not None:
        a11y.reduced_motion = payload.reduced_motion
    if payload.focus_enhanced is not None:
        a11y.focus_enhanced = payload.focus_enhanced
    if payload.written_notifications is not None:
        a11y.written_notifications = payload.written_notifications
    if payload.caption_mode is not None:
        a11y.caption_mode = payload.caption_mode
    if payload.tts_rate is not None:
        a11y.tts_rate = payload.tts_rate

    profile.profile_completion = calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)
    db.refresh(a11y)

    a11y_resp = AccessibilitySettingsResponse(
        id=a11y.id,
        userId=a11y.user_id,
        fontScale=a11y.font_scale,
        darkMode=a11y.dark_mode,
        highContrast=a11y.high_contrast,
        highlightLinks=a11y.highlight_links,
        dyslexiaFont=a11y.dyslexia_font,
        readingMode=a11y.reading_mode,
        lineSpacing=a11y.line_spacing,
        largeControls=a11y.large_controls,
        reducedMotion=a11y.reduced_motion,
        focusEnhanced=a11y.focus_enhanced,
        writtenNotifications=a11y.written_notifications,
        captionMode=a11y.caption_mode,
        ttsRate=a11y.tts_rate,
        created_at=a11y.created_at,
        updated_at=a11y.updated_at,
    )

    return StudentAccessibilityResponse(
        ok=True,
        profile=enrich_profile_response(profile, current_user),
        accessibilitySettings=a11y_resp,
    )


# ==============================================================================
# Legacy / Profile General Endpoints
# ==============================================================================

@router.get("/profile", response_model=StudentProfileResponse)
def get_student_profile(
    user_id: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_user_id = current_user.id
    if user_id:
        target_user_id = user_id
    elif student_id:
        profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
        return enrich_profile_response(profile, current_user)

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user account.",
        )
    return enrich_profile_response(profile, current_user)


@router.put("/profile", response_model=StudentProfileResponse)
def update_student_profile(
    payload: StudentProfileUpdate,
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ownership check
    if user_id and user_id != current_user.id:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only modify your own student profile.",
            )
        target_user_id = user_id
    else:
        target_user_id = current_user.id

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    target_course_id = payload.course_id if payload.course_id is not None else profile.course_id
    course = None
    if target_course_id:
        course = db.query(Course).filter(Course.id == target_course_id).first()

    if payload.semester is not None:
        sem_val = payload.semester
        max_sem = course.total_semesters if course else 12
        if sem_val < 1 or sem_val > max_sem:
            course_label = course.name if course else "assigned program"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid semester: {sem_val}. Must be between 1 and {max_sem} for {course_label}.",
            )
        profile.semester = sem_val

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.address is not None:
        profile.address = payload.address
    if payload.guardian_name is not None:
        profile.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        profile.guardian_phone = payload.guardian_phone
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.avatar_color is not None:
        profile.avatar_color = payload.avatar_color

    if payload.department_id is not None:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        profile.department_id = dept.id
    if payload.course_id is not None:
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        profile.course_id = course.id
    if payload.batch_year is not None:
        profile.batch_year = payload.batch_year
    if payload.roll_number is not None:
        profile.roll_number = payload.roll_number
    if payload.cgpa is not None:
        profile.cgpa = payload.cgpa
    if payload.career_goal is not None:
        profile.career_goal = payload.career_goal

    if payload.disability_type is not None:
        profile.disability_type = payload.disability_type
    if payload.disability_percentage is not None:
        profile.disability_percentage = payload.disability_percentage
    if payload.assistive_devices is not None:
        profile.assistive_devices = payload.assistive_devices
    if payload.preferred_communication is not None:
        profile.preferred_communication = payload.preferred_communication
    if payload.accommodation_needs is not None:
        profile.accommodation_needs = payload.accommodation_needs
    if payload.udid_number is not None:
        profile.udid_number = payload.udid_number

    profile.profile_completion = calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)
    return enrich_profile_response(profile, current_user)


# ==============================================================================
# Admin & Public Student Directory Endpoints
# ==============================================================================

@router.get("", response_model=List[StudentProfileResponse])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, student_id, roll_number, or email"),
    department_id: Optional[str] = None,
    disability_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPPORT, UserRole.FACULTY, UserRole.MENTOR])),
    db: Session = Depends(get_db),
):
    """
    Feature 4: Directory endpoint for StudentManagementPage.jsx.
    Supports search, filtering by department/disability support needs, and active/inactive status.
    """
    query = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                StudentProfile.full_name.ilike(search_term),
                StudentProfile.student_id.ilike(search_term),
                StudentProfile.roll_number.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    if department_id:
        query = query.filter(StudentProfile.department_id == department_id)
    if disability_type:
        query = query.filter(StudentProfile.disability_type.ilike(f"%{disability_type}%"))
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    profiles = query.all()
    return [enrich_profile_response(p, current_user) for p in profiles]


@router.patch("/{student_id}/status", response_model=StudentProfileResponse)
def update_student_status(
    student_id: str,
    payload: StudentStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Feature 4: Admin-only endpoint to activate or deactivate student account.
    """
    profile = db.query(StudentProfile).filter(
        or_(StudentProfile.student_id == student_id, StudentProfile.id == student_id)
    ).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found.")

    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated user account not found.")

    user.is_active = payload.is_active
    if not payload.is_active:
        revoke_all_user_tokens(user.id, db)

    db.commit()
    db.refresh(user)
    db.refresh(profile)

    return enrich_profile_response(profile, current_user)


@router.get("/{student_id}", response_model=StudentProfileResponse)
def get_student_by_id(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 4: Privacy-filtered student profile for mentors/faculty.
    Exposes academic info, assistive communication preferences, and bio;
    hides sensitive guardian contacts and udid_number unless authorized.
    """
    profile = db.query(StudentProfile).filter(
        or_(StudentProfile.student_id == student_id, StudentProfile.id == student_id)
    ).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found.")

    return enrich_profile_response(profile, current_user)


@router.post("/profile", response_model=StudentProfileResponse, status_code=status.HTTP_201_CREATED)
def create_student_profile(
    payload: StudentProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify user exists
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check if profile already exists
    existing = db.query(StudentProfile).filter(StudentProfile.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student profile already exists for this user")

    # Validate course & semester
    course = None
    if payload.course_id:
        course = db.query(Course).filter(Course.id == payload.course_id).first()
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        if payload.semester < 1 or payload.semester > course.total_semesters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Semester {payload.semester} is invalid for course {course.name}. Must be between 1 and {course.total_semesters}.",
            )

    dept = db.query(Department).filter(Department.id == payload.department_id).first() if payload.department_id else None
    student_id = payload.student_id or generate_student_id(db, dept_code=dept.code if dept else "GEN", year=2026)

    profile = StudentProfile(
        user_id=payload.user_id,
        student_id=student_id,
        full_name=payload.full_name,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        address=payload.address,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        bio=payload.bio,
        avatar_url=payload.avatar_url,
        avatar_color=payload.avatar_color,
        department_id=payload.department_id,
        course_id=payload.course_id,
        semester=payload.semester,
        batch_year=payload.batch_year,
        roll_number=payload.roll_number,
        cgpa=payload.cgpa,
        profile_completion=payload.profile_completion,
        career_goal=payload.career_goal,
        disability_type=payload.disability_type,
        disability_percentage=payload.disability_percentage,
        assistive_devices=payload.assistive_devices,
        preferred_communication=payload.preferred_communication,
        accommodation_needs=payload.accommodation_needs,
        udid_number=payload.udid_number,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return enrich_profile_response(profile)
