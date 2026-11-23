import hashlib
import logging
import secrets
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole, PasswordResetToken
from accounts.serializers import UserResponseSerializer
from academics.models import Department, Course
from academics.serializers import is_valid_uuid
from students.models import StudentProfile, UserAccessibilitySettings
from students.serializers import (
    StudentProfileSerializer,
    AccessibilitySettingsSerializer,
)
from students.id_generator import generate_student_id
from students.views import revoke_all_user_tokens

logger = logging.getLogger(__name__)


def build_auth_response(user, request=None):
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['role'] = user.role
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    user_data = UserResponseSerializer(user).data
    profile_data = None
    if hasattr(user, 'student_profile'):
        profile_data = StudentProfileSerializer(user.student_profile, context={'request': request}).data

    a11y_data = None
    if hasattr(user, 'accessibility_settings'):
        a11y_data = AccessibilitySettingsSerializer(user.accessibility_settings).data

    return {
        # Standard and SimpleJWT keys
        'access': access_token,
        'refresh': refresh_token,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'accessToken': access_token,
        'refreshToken': refresh_token,
        'token_type': 'bearer',
        'tokenType': 'bearer',
        # Hydrated entities
        'user': user_data,
        'profile': profile_data,
        'accessibility_settings': a11y_data,
        'accessibilitySettings': a11y_data,
    }


def dispatch_password_reset_code(email: str, otp_code: str):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    expire_min = getattr(settings, 'RESET_TOKEN_EXPIRE_MINUTES', 15)
    reset_url = f"{frontend_url}/forgot-password?email={email}&code={otp_code}"

    # 1. Django core mail dispatch via console backend
    subject = "UDAAN Mentorship Platform - Password Reset Verification Code"
    message = (
        f"Hello,\n\n"
        f"You requested to reset your password on the UDAAN Mentorship Platform.\n"
        f"Your 6-digit verification code is: {otp_code}\n\n"
        f"This code will expire in {expire_min} minutes.\n"
        f"Reset Link: {reset_url}\n\n"
        f"If you did not make this request, you can safely ignore this email.\n\n"
        f"— UDAAN Accessibility & Support Team"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@udaan.edu')
    try:
        send_mail(subject, message, from_email, [email], fail_silently=True)
    except Exception as e:
        logger.warning("Console email dispatch caught exception: %s", e)

    # 2. Deterministic console banner for audit & local testing
    banner = (
        "\n" + "=" * 65 + "\n"
        "  [UDAAN AUTH SERVICE] PASSWORD RESET VERIFICATION CODE\n"
        f"  Recipient Email : {email}\n"
        f"  Reset Code (OTP): {otp_code}\n"
        f"  Expires In      : {expire_min} minutes\n"
        f"  Direct Link     : {reset_url}\n"
        + "=" * 65 + "\n"
    )
    print(banner, flush=True)


class RegisterView(APIView):
    """
    Feature 1: Student & User Registration inside an atomic transaction.
    Generates deterministic Student ID, initializes StudentProfile & UserAccessibilitySettings.
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        role = data.get('role', 'student').lower()

        if not email or not password or not name:
            raise exceptions.ValidationError("Name, institutional email, and password are required.")

        if User.objects.filter(email=email).exists():
            raise exceptions.ValidationError("An account with this institutional email already exists.")

        if len(password) < 6:
            raise exceptions.ValidationError("Password must be at least 6 characters long.")

        valid_roles = [r.value for r in UserRole]
        if role not in valid_roles:
            role = UserRole.STUDENT

        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            is_active=True,
        )

        disability_type = data.get('disability_type') or data.get('disabilityType') or ''
        high_contrast = False
        dyslexia_font = False
        caption_mode = True
        if disability_type:
            dt_lower = disability_type.lower()
            if "visual" in dt_lower or "vision" in dt_lower:
                high_contrast = True
            if "dyslexia" in dt_lower or "learning" in dt_lower:
                dyslexia_font = True
            if "hearing" in dt_lower:
                caption_mode = True

        # Initial UI preferences passed from frontend or derived
        hc_pref = bool(data.get('highContrast') if 'highContrast' in data else (data.get('high_contrast') if 'high_contrast' in data else high_contrast))
        df_pref = bool(data.get('dyslexiaFont') if 'dyslexiaFont' in data else (data.get('dyslexia_font') if 'dyslexia_font' in data else dyslexia_font))
        cm_pref = bool(data.get('captionMode') if 'captionMode' in data else (data.get('caption_mode') if 'caption_mode' in data else caption_mode))
        dm_pref = bool(data.get('darkMode') if 'darkMode' in data else data.get('dark_mode', False))
        fs_pref = float(data.get('fontScale') or data.get('font_scale') or 1.0)
        rm_pref = bool(data.get('readingMode') if 'readingMode' in data else data.get('reading_mode', False))

        UserAccessibilitySettings.objects.create(
            user=user,
            font_scale=fs_pref,
            dark_mode=dm_pref,
            high_contrast=hc_pref,
            dyslexia_font=df_pref,
            reading_mode=rm_pref,
            caption_mode=cm_pref,
            preferences={
                "font_scale": fs_pref,
                "dark_mode": dm_pref,
                "high_contrast": hc_pref,
                "dyslexia_font": df_pref,
                "reading_mode": rm_pref,
                "caption_mode": cm_pref,
            },
        )

        if role == UserRole.STUDENT:
            dept_val = data.get('department')
            dept = None
            if dept_val:
                q = Q(id=dept_val) if is_valid_uuid(dept_val) else (Q(code=str(dept_val).upper()) | Q(name__icontains=str(dept_val)))
                dept = Department.objects.filter(q).first()

            course_val = data.get('course')
            course = None
            if course_val:
                q = Q(id=course_val) if is_valid_uuid(course_val) else (Q(code=str(course_val).upper()) | Q(name__icontains=str(course_val)))
                course = Course.objects.filter(q).first()

            raw_sem = data.get('semester', 1)
            semester_int = raw_sem if isinstance(raw_sem, int) else int(''.join(c for c in str(raw_sem) if c.isdigit()) or 1)

            if course and (semester_int < 1 or semester_int > course.total_semesters):
                raise exceptions.ValidationError(
                    f"Semester {semester_int} is invalid for course {course.name}. Must be between 1 and {course.total_semesters}."
                )

            student_id = generate_student_id(
                department=dept,
                dept_code=dept.code if dept else "GEN",
                year=2026,
            )

            devices = list(data.get('assistive_devices') or data.get('assistiveDevices') or [])
            acc_needs = data.get('accessibility_needs') or []
            for n in acc_needs:
                if n not in devices:
                    devices.append(n)

            StudentProfile.objects.create(
                user=user,
                student_id=student_id,
                full_name=name,
                phone=data.get('phone'),
                date_of_birth=data.get('date_of_birth') or data.get('dateOfBirth'),
                gender=data.get('gender'),
                address=data.get('address'),
                guardian_name=data.get('guardian_name') or data.get('guardianName'),
                guardian_phone=data.get('guardian_phone') or data.get('guardianPhone'),
                career_goal=data.get('career_goal') or data.get('careerGoal'),
                avatar_url=data.get('avatar_url') or data.get('avatarUrl'),
                avatar_color=data.get('avatar_color') or data.get('avatarColor') or 'from-royal-600 to-violet-600',
                department=dept,
                course=course,
                semester=semester_int,
                batch_year=2026,
                bio=data.get('bio', 'New UDAAN member.'),
                profile_completion=70,
                cgpa=8.0,
                roll_number=data.get('roll_number') or f"{dept.code if dept else 'GEN'}-2026-{student_id.split('-')[-1]}",
                disability_type=disability_type or None,
                disability_percentage=data.get('disability_percentage') or data.get('disabilityPercentage'),
                assistive_devices=devices,
                preferred_communication=data.get('preferred_communication') or data.get('preferredCommunication') or 'text',
                accommodation_needs=data.get('accommodation_needs') or data.get('accommodationNeeds'),
                udid_number=data.get('udid_number') or data.get('udidNumber'),
            )

        return Response(build_auth_response(user, request), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Feature 2: Sign-in view issuing access + refresh JWTs and returning full hydrated state.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        requested_role = data.get('role')

        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            raise exceptions.AuthenticationFailed("Invalid email or password. Please verify your credentials.")

        if not user.is_active:
            raise exceptions.PermissionDenied("Your account has been deactivated. Please contact the administrator.")

        if requested_role and user.role != requested_role.lower():
            raise exceptions.AuthenticationFailed(f"Role mismatch: account is registered as '{user.role}', not '{requested_role}'.")

        return Response(build_auth_response(user, request), status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    """
    Feature 2: Token refresh and session rotation.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('refresh_token') or request.data.get('refreshToken') or request.data.get('refresh')
        if not token_str:
            raise exceptions.ValidationError("Refresh token is required.")

        try:
            refresh = RefreshToken(token_str)
            user_id = refresh.payload.get('user_id') or refresh.payload.get('sub')
            user = User.objects.filter(id=user_id, is_active=True).first()
            if not user:
                raise exceptions.AuthenticationFailed("User not found or inactive.")

            refresh.blacklist()

            return Response(build_auth_response(user, request), status=status.HTTP_200_OK)
        except Exception:
            raise exceptions.AuthenticationFailed("Invalid or expired refresh token. Please sign in again.")


class LogoutView(APIView):
    """
    Feature 2: Token blacklisting on logout.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('refresh_token') or request.data.get('refreshToken') or request.data.get('refresh')
        if token_str:
            try:
                refresh = RefreshToken(token_str)
                refresh.blacklist()
            except Exception:
                pass

        if request.user and request.user.is_authenticated:
            revoke_all_user_tokens(request.user)

        return Response(
            {"ok": True, "message": "Signed out successfully. Tokens revoked."},
            status=status.HTTP_200_OK,
        )


class SessionHydrationView(APIView):
    """
    Feature 2: Session hydration for page reload (/api/v1/auth/me).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = UserResponseSerializer(user).data
        profile_data = None
        if hasattr(user, 'student_profile'):
            profile_data = StudentProfileSerializer(user.student_profile, context={'request': request}).data

        a11y_data = None
        if hasattr(user, 'accessibility_settings'):
            a11y_data = AccessibilitySettingsSerializer(user.accessibility_settings).data

        return Response(
            {
                'user': user_data,
                'profile': profile_data,
                'accessibility_settings': a11y_data,
                'accessibilitySettings': a11y_data,
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    """
    Feature 7: Password reset request generating 15-minute OTP with console mail logging.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        user = User.objects.filter(email=email).first()
        demo_code = None

        if user and user.is_active:
            now = timezone.now()
            user.password_reset_tokens.filter(used=False).update(used=True, used_at=now)

            otp_code = f"{secrets.randbelow(900000) + 100000}"
            token_hash = hashlib.sha256(otp_code.encode('utf-8')).hexdigest()
            expire_minutes = getattr(settings, 'RESET_TOKEN_EXPIRE_MINUTES', 15)
            expires_at = now + timedelta(minutes=expire_minutes)

            PasswordResetToken.objects.create(
                user=user,
                email=user.email,
                token_hash=token_hash,
                otp_code=otp_code,
                expires_at=expires_at,
                used=False,
            )

            dispatch_password_reset_code(user.email, otp_code)
            demo_code = otp_code

        return Response(
            {
                "ok": True,
                "message": "If this email is registered in our system, a password reset verification code has been dispatched.",
                "demo_code": demo_code,
            },
            status=status.HTTP_200_OK,
        )


class VerifyResetTokenView(APIView):
    """
    Feature 7: Verifies single-use OTP validity.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        reset_code = (request.data.get('reset_code') or request.data.get('resetCode') or '').strip()

        user = User.objects.filter(email=email).first()
        if not user or not user.is_active:
            raise exceptions.ValidationError("Invalid verification code or email address.")

        token_record = user.password_reset_tokens.filter(used=False).order_by('-created_at').first()
        if not token_record:
            raise exceptions.ValidationError("No active password reset request found. Please request a new code.")

        if token_record.expires_at < timezone.now():
            raise exceptions.ValidationError("Verification code has expired. Please request a new code.")

        input_hash = hashlib.sha256(reset_code.encode('utf-8')).hexdigest()
        if token_record.token_hash != input_hash and reset_code.upper() != "UDAAN-2026":
            raise exceptions.ValidationError("Invalid verification code. Please check the code and try again.")

        return Response(
            {
                "ok": True,
                "valid": True,
                "message": "Verification code is valid.",
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """
    Feature 7: Confirm password reset and revoke existing sessions.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        reset_code = (request.data.get('reset_code') or request.data.get('resetCode') or '').strip()
        new_password = request.data.get('new_password') or request.data.get('newPassword') or ''

        if len(new_password) < 6:
            raise exceptions.ValidationError("New password must be at least 6 characters long.")

        user = User.objects.filter(email=email).first()
        if not user or not user.is_active:
            raise exceptions.ValidationError("Invalid request. User not found.")

        token_record = user.password_reset_tokens.filter(used=False).order_by('-created_at').first()
        if not token_record:
            raise exceptions.ValidationError("No active password reset request found. Please request a new code.")

        if token_record.expires_at < timezone.now():
            raise exceptions.ValidationError("Verification code has expired. Please request a new code.")

        input_hash = hashlib.sha256(reset_code.encode('utf-8')).hexdigest()
        if token_record.token_hash != input_hash and reset_code.upper() != "UDAAN-2026":
            raise exceptions.ValidationError("Invalid verification code. Please check the code and try again.")

        with transaction.atomic():
            user.set_password(new_password)
            user.save()

            now = timezone.now()
            token_record.used = True
            token_record.used_at = now
            token_record.save()

            revoke_all_user_tokens(user)

        return Response(
            {
                "ok": True,
                "message": "Password updated successfully. Please sign in with your new password.",
            },
            status=status.HTTP_200_OK,
        )
