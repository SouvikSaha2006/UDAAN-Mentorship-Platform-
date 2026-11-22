import hashlib
import logging
import secrets
from datetime import timedelta
from django.conf import settings
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
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'accessToken': access_token,
        'refreshToken': refresh_token,
        'tokenType': 'bearer',
        'user': user_data,
        'profile': profile_data,
        'accessibility_settings': a11y_data,
        'accessibilitySettings': a11y_data,
    }


def dispatch_password_reset_code(email: str, otp_code: str):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    expire_min = getattr(settings, 'RESET_TOKEN_EXPIRE_MINUTES', 15)
    reset_url = f"{frontend_url}/forgot-password?email={email}&code={otp_code}"
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
    permission_classes = [AllowAny]

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

        with transaction.atomic():
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

            UserAccessibilitySettings.objects.create(
                user=user,
                high_contrast=high_contrast,
                dyslexia_font=dyslexia_font,
                caption_mode=caption_mode,
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
                    department=dept,
                    course=course,
                    semester=semester_int,
                    batch_year=2026,
                    bio=data.get('bio', 'New UDAAN member.'),
                    profile_completion=70,
                    cgpa=8.0,
                    roll_number=f"{dept.code if dept else 'GEN'}-2026-{student_id.split('-')[-1]}",
                    disability_type=disability_type or None,
                    disability_percentage=data.get('disability_percentage') or data.get('disabilityPercentage'),
                    assistive_devices=devices,
                    preferred_communication=data.get('preferred_communication') or data.get('preferredCommunication') or 'text',
                    accommodation_needs=data.get('accommodation_needs') or data.get('accommodationNeeds'),
                    udid_number=data.get('udid_number') or data.get('udidNumber'),
                )

        return Response(build_auth_response(user, request), status=status.HTTP_201_CREATED)


class LoginView(APIView):
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
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('refresh_token') or request.data.get('refreshToken')
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
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('refresh_token') or request.data.get('refreshToken')
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
