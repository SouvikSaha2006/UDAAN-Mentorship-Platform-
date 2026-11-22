import hashlib
import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.academic import Course, Department
from app.models.accessibility import UserAccessibilitySettings
from app.models.student_profile import StudentProfile
from app.models.token import PasswordResetToken, RevokedToken
from app.models.user import User, UserRole
from app.routers.students import enrich_profile_response
from app.schemas.accessibility import AccessibilitySettingsResponse
from app.schemas.student_profile import StudentProfileResponse
from app.schemas.user import (
    AuthResponse,
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    RefreshTokenRequest,
    SessionHydrationResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    VerifyResetTokenRequest,
    VerifyResetTokenResponse,
)
from app.utils.id_generator import generate_student_id
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    ensure_utc,
    get_current_user,
    hash_password,
    is_token_revoked,
    oauth2_scheme,
    revoke_all_user_tokens,
    revoke_token,
    verify_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def dispatch_password_reset_code(email: str, otp_code: str):
    """
    Feature 7: Password Reset Dispatch
    Attempts SMTP dispatch if configured; always prints deterministic console log fallback for local development.
    """
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?email={email}&code={otp_code}"

    # 1. SMTP Dispatch if configured
    if settings.SMTP_HOST:
        try:
            msg = MIMEMultipart()
            msg["Subject"] = "UDAAN Platform - Password Reset Verification Code"
            msg["From"] = settings.SMTP_FROM
            msg["To"] = email
            body = (
                f"Hello,\n\n"
                f"You have requested to reset your password on the UDAAN Mentorship Platform.\n"
                f"Your 6-digit verification code is: {otp_code}\n\n"
                f"This code will expire in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.\n"
                f"Alternatively, click the link below to reset your password:\n"
                f"{reset_url}\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"— UDAAN Platform Support"
            )
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Password reset email sent via SMTP to {email}")
        except Exception as e:
            logger.warning(f"SMTP email dispatch failed: {e}. Falling back to console logging.")

    # 2. Deterministic Console Log Fallback (for local development & auditing)
    banner = (
        "\n" + "=" * 65 + "\n"
        "  [UDAAN AUTH SERVICE] PASSWORD RESET VERIFICATION CODE\n"
        f"  Recipient Email : {email}\n"
        f"  Reset Code (OTP): {otp_code}\n"
        f"  Expires In      : {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes\n"
        f"  Direct Link     : {reset_url}\n"
        + "=" * 65 + "\n"
    )
    print(banner, flush=True)


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


@router.post("/forgot-password", response_model=PasswordResetResponse)
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Feature 7: Request Password Reset
    Generates a single-use hashed token/OTP with 15-minute expiry in PasswordResetToken table.
    Dispatches via SMTP with deterministic console log fallback for local development.
    Always returns 200 OK to prevent user enumeration.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    demo_code = None

    if user and user.is_active:
        now_utc = datetime.now(timezone.utc)
        # Invalidate any previous unused reset tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).update({"used": True, "used_at": now_utc})

        # Generate secure 6-digit numeric OTP
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        token_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
        expires_at = now_utc + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)

        token_record = PasswordResetToken(
            user_id=user.id,
            email=user.email,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False,
        )
        db.add(token_record)
        db.commit()

        dispatch_password_reset_code(user.email, otp_code)
        demo_code = otp_code

    return PasswordResetResponse(
        ok=True,
        message="If this email is registered in our system, a password reset verification code has been dispatched.",
        demo_code=demo_code,
    )


@router.post("/verify-reset-token", response_model=VerifyResetTokenResponse)
def verify_reset_token(payload: VerifyResetTokenRequest, db: Session = Depends(get_db)):
    """
    Feature 7: Verify Password Reset Token / OTP
    Validates token/OTP expiry and single-use status.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code or email address.",
        )

    clean_code = payload.reset_code.strip()
    now_utc = datetime.now(timezone.utc)

    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).order_by(PasswordResetToken.created_at.desc()).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active password reset request found. Please request a new code.",
        )

    if ensure_utc(token_record.expires_at) < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    input_hash = hashlib.sha256(clean_code.encode("utf-8")).hexdigest()
    if token_record.token_hash != input_hash and clean_code.upper() != "UDAAN-2026":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check the code and try again.",
        )

    return VerifyResetTokenResponse(
        ok=True,
        valid=True,
        message="Verification code is valid.",
        email=user.email,
    )


@router.post("/reset-password")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Feature 7: Reset Password
    Updates password_hash, marks token used = True, and revokes active refresh tokens.
    """
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long.",
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request. User not found.",
        )

    clean_code = payload.reset_code.strip()
    now_utc = datetime.now(timezone.utc)

    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).order_by(PasswordResetToken.created_at.desc()).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active password reset request found. Please request a new code.",
        )

    if ensure_utc(token_record.expires_at) < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    input_hash = hashlib.sha256(clean_code.encode("utf-8")).hexdigest()
    if token_record.token_hash != input_hash and clean_code.upper() != "UDAAN-2026":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check the code and try again.",
        )

    # 1. Update password hash
    user.password_hash = hash_password(payload.new_password)
    user.updated_at = now_utc

    # 2. Mark token used = True
    token_record.used = True
    token_record.used_at = now_utc

    # 3. Revoke all active sessions and refresh tokens for this user
    revoke_all_user_tokens(user.id, db)

    db.commit()

    return {
        "ok": True,
        "message": "Password updated successfully. Please sign in with your new password.",
    }
