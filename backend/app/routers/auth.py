from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.academic import Department, Course
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.utils.id_generator import generate_student_id

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
        needs_list = profile.assistive_devices or []
        if profile.accommodation_needs:
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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Create User
    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    db.flush()  # populate new_user.id

    # Create default Accessibility Settings
    a11y = UserAccessibilitySettings(
        user_id=new_user.id,
    )
    db.add(a11y)

    # If student, create StudentProfile
    if payload.role == UserRole.STUDENT:
        # Match department if name provided
        dept = None
        if payload.department:
            dept = db.query(Department).filter(
                (Department.name.ilike(f"%{payload.department}%")) | (Department.code.ilike(f"%{payload.department}%"))
            ).first()

        # Match course if name provided
        course = None
        if payload.course:
            course = db.query(Course).filter(
                (Course.name.ilike(f"%{payload.course}%")) | (Course.code.ilike(f"%{payload.course}%"))
            ).first()

        # Parse semester
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

        student_id = generate_student_id(db, dept_code=dept.code if dept else "GEN", year=2026)

        profile = StudentProfile(
            user_id=new_user.id,
            student_id=student_id,
            full_name=payload.name.strip(),
            department_id=dept.id if dept else None,
            course_id=course.id if course else None,
            semester=semester_int,
            batch_year=2026,
            bio=payload.bio or "New UDAAN member.",
            profile_completion=70,
            cgpa=8.0,
            roll_number=f"{dept.code if dept else 'GEN'}-2026-{student_id.split('-')[-1]}",
        )
        db.add(profile)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email, "role": new_user.role.value})
    user_resp = build_user_response(new_user, db)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp,
    )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    if payload.role and user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Role mismatch: account is registered as '{user.role.value}', not '{payload.role.value}'.",
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    user_resp = build_user_response(user, db)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp,
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_user_response(user, db)


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
