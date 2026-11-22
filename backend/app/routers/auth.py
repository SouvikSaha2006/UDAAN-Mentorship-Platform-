from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.academic import Department, Course
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuthResponse,
    SessionHydrationResponse,
    RefreshTokenRequest,
    LogoutRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.schemas.accessibility import AccessibilitySettingsResponse
from app.schemas.student_profile import StudentProfileResponse
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    revoke_token,
    is_token_revoked,
    get_current_user,
    oauth2_scheme,
)
from app.utils.id_generator import generate_student_id
from app.routers.students import enrich_profile_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


def build_user_response(user: User, db: Session) -> UserResponse:
    profile = user.student_profile
    dept_name = None
    course_name = None
    semester_val = None
    roll_num = None
    cgpa_val = None
    comp_val = None
    career_val = None
    bio_val = None
    phone_val = None
    avatar_col = "from-royal-600 to-violet-600"
    needs_list = []
    student_id_val = None
    full_name_val = None

    if profile:
        full_name_val = profile.full_name
        phone_val = profile.phone
        student_id_val = profile.student_id
        semester_val = f"{profile.semester}th Semester" if profile.semester else None
        roll_num = profile.roll_number or profile.student_id
        cgpa_val = profile.cgpa
        comp_val = profile.profile_completion
        career_val = profile.career_goal
        bio_val = profile.bio
        avatar_col = profile.avatar_color or avatar_col
        needs_list = list(profile.assistive_devices or [])
        if profile.accommodation_needs and profile.accommodation_needs not in needs_list:
            needs_list.append(profile.accommodation_needs)
        if profile.department:
            dept_name = profile.department.name
        if profile.course:
            course_name = profile.course.name

    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        name=full_name_val or user.email.split("@")[0].title(),
        fullName=full_name_val or user.email.split("@")[0].title(),
        studentId=student_id_val,
        department=dept_name,
        course=course_name,
        semester=semester_val,
        rollNumber=roll_num,
        phone=phone_val,
        avatarColor=avatar_col,
        profileCompletion=comp_val or 75,
        cgpa=cgpa_val or 8.5,
        bio=bio_val,
        careerGoal=career_val,
        accessibilityNeeds=needs_list,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def build_auth_response(user: User, db: Session) -> AuthResponse:
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    user_resp = build_user_response(user, db)
    profile_resp = enrich_profile_response(user.student_profile) if user.student_profile else None
    a11y_resp = user.accessibility_settings

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        accessToken=access_token,
        refreshToken=refresh_token,
        tokenType="bearer",
        user=user_resp,
        profile=profile_resp,
        accessibility_settings=a11y_resp,
        accessibilitySettings=a11y_resp,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Feature 1: Student & Mentor Registration
    Inside a single atomic DB transaction:
    1. Creates User with bcrypt password_hash
    2. Generates unique student_id via Feature 6 atomic sequence
    3. Creates StudentProfile with all personal, academic, and disability/accommodation attributes
    4. Initializes default / personalized UserAccessibilitySettings
    5. Returns 201 Created with JWT tokens + user + profile + accessibility settings
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this institutional email already exists.",
        )

    # 1. Create User
    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # 2. Initialize Accessibility Settings
    # If student specified visual / cognitive needs during registration, apply them upfront
    high_contrast = False
    dyslexia_font = False
    caption_mode = True
    if payload.disability_type:
        dt_lower = payload.disability_type.lower()
        if "visual" in dt_lower or "vision" in dt_lower:
            high_contrast = True
        if "dyslexia" in dt_lower or "learning" in dt_lower:
            dyslexia_font = True
        if "hearing" in dt_lower:
            caption_mode = True

    a11y = UserAccessibilitySettings(
        user_id=new_user.id,
        high_contrast=high_contrast,
        dyslexia_font=dyslexia_font,
        caption_mode=caption_mode,
    )
    db.add(a11y)

    # 3. Create StudentProfile if role is student
    if payload.role == UserRole.STUDENT:
        dept = None
        if payload.department:
            dept = db.query(Department).filter(
                (Department.name.ilike(f"%{payload.department}%")) | (Department.code.ilike(f"%{payload.department}%"))
            ).first()

        course = None
        if payload.course:
            course = db.query(Course).filter(
                (Course.name.ilike(f"%{payload.course}%")) | (Course.code.ilike(f"%{payload.course}%"))
            ).first()

        semester_int = 1
        if payload.semester:
            if isinstance(payload.semester, int):
                semester_int = payload.semester
            elif isinstance(payload.semester, str):
                digits = "".join([c for c in payload.semester if c.isdigit()])
                if digits:
                    semester_int = int(digits)

        # Validate semester against course total_semesters
        if course and (semester_int < 1 or semester_int > course.total_semesters):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Semester {semester_int} is invalid for course {course.name}. Must be between 1 and {course.total_semesters}.",
            )

        # Feature 6: Concurrency-Safe Student ID Generation
        student_id = generate_student_id(db, dept_code=dept.code if dept else "GEN", year=2026)

        # Combine assistive devices and accessibility needs
        devices = list(payload.assistive_devices or [])
        if payload.accessibility_needs:
            for need in payload.accessibility_needs:
                if need not in devices:
                    devices.append(need)

        profile = StudentProfile(
            user_id=new_user.id,
            student_id=student_id,
            full_name=payload.name.strip(),
            phone=payload.phone,
            department_id=dept.id if dept else None,
            course_id=course.id if course else None,
            semester=semester_int,
            batch_year=2026,
            bio=payload.bio or "New UDAAN member.",
            profile_completion=70,
            cgpa=8.0,
            roll_number=f"{dept.code if dept else 'GEN'}-2026-{student_id.split('-')[-1]}",
            # Specially Abled Student Fields
            disability_type=payload.disability_type,
            disability_percentage=payload.disability_percentage,
            assistive_devices=devices,
            preferred_communication=payload.preferred_communication or "text",
            accommodation_needs=payload.accommodation_needs,
            udid_number=payload.udid_number,
        )
        db.add(profile)

    db.commit()
    db.refresh(new_user)

    return build_auth_response(new_user, db)


@router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Feature 2: Login with JWT generation and hydration of user + profile + accessibility settings
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator.",
        )

    if payload.role and user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Role mismatch: account is registered as '{user.role.value}', not '{payload.role.value}'.",
        )

    return build_auth_response(user, db)


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Feature 2: Refresh access token using a valid refresh token
    """
    if is_token_revoked(payload.refresh_token, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please sign in again.",
        )

    decoded = decode_token(payload.refresh_token)
    if decoded.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type. Expected refresh token.",
        )

    user_id = decoded.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    # Revoke old refresh token (token rotation)
    revoke_token(payload.refresh_token, db, user_id=user.id, token_type="refresh")

    return build_auth_response(user, db)


@router.post("/logout")
def logout_user(
    payload: Optional[LogoutRequest] = None,
    auth_header: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """
    Feature 2: Logout with refresh/access token revocation in database blacklist
    """
    # 1. Revoke refresh token if provided
    if payload and payload.refresh_token:
        revoke_token(payload.refresh_token, db, token_type="refresh")

    # 2. Revoke current access token if present
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1].strip()
        revoke_token(token, db, token_type="access")

    return {"ok": True, "message": "Signed out successfully. Tokens revoked."}


@router.get("/me", response_model=SessionHydrationResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Feature 2: Session Hydration for page reloads
    Returns { user, profile, accessibility_settings }
    """
    user_resp = build_user_response(user, db)
    profile_resp = enrich_profile_response(user.student_profile) if user.student_profile else None
    a11y_resp = user.accessibility_settings

    return SessionHydrationResponse(
        user=user_resp,
        profile=profile_resp,
        accessibility_settings=a11y_resp,
        accessibilitySettings=a11y_resp,
    )


@router.post("/forgot-password")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account matches this email address.",
        )
    return {
        "ok": True,
        "message": "Reset code dispatched.",
        "demo_code": "UDAAN-2026",
    }


@router.post("/reset-password")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    if payload.reset_code.strip().upper() != "UDAAN-2026":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Use UDAAN-2026.",
        )
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account matches this email address.",
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True, "message": "Password updated successfully."}
