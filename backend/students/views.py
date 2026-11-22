from rest_framework import status, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from accounts.models import User, UserRole
from academics.models import Department, Course
from academics.serializers import is_valid_uuid
from students.models import StudentProfile, UserAccessibilitySettings
from students.serializers import (
    StudentProfileSerializer,
    StudentMeSerializer,
    StudentPublicSerializer,
    AccessibilitySettingsSerializer,
)
from students.id_generator import generate_student_id
from accounts.permissions import IsAdminRole, CanViewStudentDirectory, IsProfileOwnerOrAdmin


def calculate_profile_completion(p: StudentProfile) -> int:
    score = 40
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


def revoke_all_user_tokens(user):
    tokens = OutstandingToken.objects.filter(user=user)
    for token in tokens:
        BlacklistedToken.objects.get_or_create(token=token)


class StudentMeView(APIView):
    """
    Feature 4: Full profile for current student and soft-deactivation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'student_profile', None)
        if not profile:
            if user.role == UserRole.STUDENT:
                sid = generate_student_id(dept_code="GEN", year=2026)
                profile = StudentProfile.objects.create(
                    user=user,
                    student_id=sid,
                    full_name=user.email.split('@')[0].capitalize(),
                    semester=1,
                    batch_year=2026,
                    profile_completion=50,
                )
            else:
                raise exceptions.NotFound("Student profile not found for this account.")

        profile.profile_completion = calculate_profile_completion(profile)
        profile.save()
        serializer = StudentMeSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save()
        revoke_all_user_tokens(user)
        return Response(
            {"ok": True, "message": "Account has been deactivated successfully."},
            status=status.HTTP_200_OK,
        )


class StudentPersonalView(APIView):
    """
    Feature 5: Update personal details.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile = getattr(request.user, 'student_profile', None)
        if not profile:
            raise exceptions.NotFound("Student profile not found.")

        data = request.data
        if 'fullName' in data or 'full_name' in data:
            profile.full_name = data.get('fullName') or data.get('full_name')
        if 'phone' in data:
            profile.phone = data.get('phone')
        if 'dateOfBirth' in data or 'date_of_birth' in data:
            profile.date_of_birth = data.get('dateOfBirth') or data.get('date_of_birth')
        if 'gender' in data:
            profile.gender = data.get('gender')
        if 'address' in data:
            profile.address = data.get('address')
        if 'guardianName' in data or 'guardian_name' in data:
            profile.guardian_name = data.get('guardianName') or data.get('guardian_name')
        if 'guardianPhone' in data or 'guardian_phone' in data:
            profile.guardian_phone = data.get('guardianPhone') or data.get('guardian_phone')
        if 'bio' in data:
            profile.bio = data.get('bio')
        if 'careerGoal' in data or 'career_goal' in data:
            profile.career_goal = data.get('careerGoal') or data.get('career_goal')
        if 'avatarUrl' in data or 'avatar_url' in data:
            profile.avatar_url = data.get('avatarUrl') or data.get('avatar_url')
        if 'avatarColor' in data or 'avatar_color' in data:
            profile.avatar_color = data.get('avatarColor') or data.get('avatar_color')

        profile.profile_completion = calculate_profile_completion(profile)
        profile.save()

        serializer = StudentMeSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentAcademicsView(APIView):
    """
    Feature 5: Update academic details with semester range validation.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile = getattr(request.user, 'student_profile', None)
        if not profile:
            raise exceptions.NotFound("Student profile not found.")

        data = request.data
        # Department resolution
        dept_val = data.get('department_id') or data.get('departmentId') or data.get('department')
        if dept_val:
            q = Q(id=dept_val) if is_valid_uuid(dept_val) else (Q(code=str(dept_val).upper()) | Q(name__icontains=str(dept_val)))
            dept = Department.objects.filter(q).first()
            if not dept:
                raise exceptions.NotFound(f"Department '{dept_val}' not found.")
            profile.department = dept

        # Course resolution
        course_val = data.get('course_id') or data.get('courseId') or data.get('course')
        course = None
        if course_val:
            q = Q(id=course_val) if is_valid_uuid(course_val) else (Q(code=str(course_val).upper()) | Q(name__icontains=str(course_val)))
            course = Course.objects.filter(q).first()
            if not course:
                raise exceptions.NotFound(f"Course '{course_val}' not found.")
            profile.course = course
        elif profile.course:
            course = profile.course

        # Semester validation
        if 'semester' in data and data['semester'] is not None:
            raw_sem = data['semester']
            sem_val = raw_sem if isinstance(raw_sem, int) else int(''.join(c for c in str(raw_sem) if c.isdigit()) or 1)
            max_sem = course.total_semesters if course else 12
            if sem_val < 1 or sem_val > max_sem:
                c_name = course.name if course else "assigned program"
                raise exceptions.ValidationError(
                    f"Invalid semester: {sem_val}. Must be between 1 and {max_sem} for {c_name}."
                )
            profile.semester = sem_val

        if 'batchYear' in data or 'batch_year' in data:
            profile.batch_year = int(data.get('batchYear') or data.get('batch_year'))
        if 'rollNumber' in data or 'roll_number' in data:
            profile.roll_number = data.get('rollNumber') or data.get('roll_number')

        profile.profile_completion = calculate_profile_completion(profile)
        profile.save()

        serializer = StudentMeSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentAccessibilityView(APIView):
    """
    Feature 5: GET / PUT / PATCH /api/v1/students/me/accessibility
    Persists both domain disability accommodations and UI toolbar preferences.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'student_profile', None)
        if not profile:
            raise exceptions.NotFound("Student profile not found.")
        a11y, _ = UserAccessibilitySettings.objects.get_or_create(user=user)

        return Response(
            {
                "ok": True,
                "profile": StudentMeSerializer(profile, context={'request': request}).data,
                "accessibilitySettings": AccessibilitySettingsSerializer(a11y).data,
                "accessibility_settings": AccessibilitySettingsSerializer(a11y).data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        user = request.user
        profile = getattr(user, 'student_profile', None)
        if not profile:
            raise exceptions.NotFound("Student profile not found.")

        data = request.data

        # 1. Domain accommodations in StudentProfile
        if 'disabilityType' in data or 'disability_type' in data:
            profile.disability_type = data.get('disabilityType') if 'disabilityType' in data else data.get('disability_type')
        if 'disabilityPercentage' in data or 'disability_percentage' in data:
            profile.disability_percentage = data.get('disabilityPercentage') if 'disabilityPercentage' in data else data.get('disability_percentage')

        devices = data.get('assistiveDevices') or data.get('assistive_devices') or data.get('accessibility_needs')
        if devices is not None:
            profile.assistive_devices = list(devices)

        if 'preferredCommunication' in data or 'preferred_communication' in data:
            profile.preferred_communication = data.get('preferredCommunication') if 'preferredCommunication' in data else data.get('preferred_communication')
        if 'accommodationNeeds' in data or 'accommodation_needs' in data:
            profile.accommodation_needs = data.get('accommodationNeeds') if 'accommodationNeeds' in data else data.get('accommodation_needs')
        if 'udidNumber' in data or 'udid_number' in data:
            profile.udid_number = data.get('udidNumber') if 'udidNumber' in data else data.get('udid_number')

        profile.profile_completion = calculate_profile_completion(profile)
        profile.save()

        # 2. UI Preferences in UserAccessibilitySettings
        a11y, _ = UserAccessibilitySettings.objects.get_or_create(user=user)

        field_mappings = {
            'fontScale': 'font_scale',
            'font_scale': 'font_scale',
            'darkMode': 'dark_mode',
            'dark_mode': 'dark_mode',
            'highContrast': 'high_contrast',
            'high_contrast': 'high_contrast',
            'highlightLinks': 'highlight_links',
            'highlight_links': 'highlight_links',
            'dyslexiaFont': 'dyslexia_font',
            'dyslexia_font': 'dyslexia_font',
            'readingMode': 'reading_mode',
            'reading_mode': 'reading_mode',
            'lineSpacing': 'line_spacing',
            'line_spacing': 'line_spacing',
            'largeControls': 'large_controls',
            'large_controls': 'large_controls',
            'reducedMotion': 'reduced_motion',
            'reduced_motion': 'reduced_motion',
            'focusEnhanced': 'focus_enhanced',
            'focus_enhanced': 'focus_enhanced',
            'writtenNotifications': 'written_notifications',
            'written_notifications': 'written_notifications',
            'captionMode': 'caption_mode',
            'caption_mode': 'caption_mode',
            'ttsRate': 'tts_rate',
            'tts_rate': 'tts_rate',
        }

        for in_key, model_attr in field_mappings.items():
            if in_key in data and data[in_key] is not None:
                setattr(a11y, model_attr, data[in_key])

        if 'preferences' in data and isinstance(data['preferences'], dict):
            a11y.preferences.update(data['preferences'])

        a11y.save()

        return Response(
            {
                "ok": True,
                "profile": StudentMeSerializer(profile, context={'request': request}).data,
                "accessibilitySettings": AccessibilitySettingsSerializer(a11y).data,
                "accessibility_settings": AccessibilitySettingsSerializer(a11y).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        return self.put(request)


class StudentListView(APIView):
    """
    Feature 4: Directory list for StudentManagementPage.jsx and mentors/faculty.
    """
    permission_classes = [CanViewStudentDirectory]

    def get(self, request):
        queryset = StudentProfile.objects.all().select_related('user', 'department', 'course').prefetch_related('user__accessibility_settings')
        search = request.query_params.get('search')
        if search:
            st = search.strip()
            queryset = queryset.filter(
                Q(full_name__icontains=st)
                | Q(student_id__icontains=st)
                | Q(roll_number__icontains=st)
                | Q(user__email__icontains=st)
            )

        dept_id = request.query_params.get('department_id')
        if dept_id:
            q = Q(department__id=dept_id) if is_valid_uuid(dept_id) else Q(department__code=str(dept_id).upper())
            queryset = queryset.filter(q)

        disability_type = request.query_params.get('disability_type')
        if disability_type:
            queryset = queryset.filter(disability_type__icontains=disability_type.strip())

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_bool = is_active.lower() in ['true', '1']
            queryset = queryset.filter(user__is_active=active_bool)

        serializer = StudentProfileSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentStatusView(APIView):
    """
    Feature 4: Admin activation/deactivation of student account.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, student_id):
        q = Q(student_id=student_id) if not is_valid_uuid(student_id) else (Q(student_id=student_id) | Q(id=student_id))
        profile = StudentProfile.objects.filter(q).select_related('user').first()
        if not profile:
            raise exceptions.NotFound(f"Student '{student_id}' not found.")

        data = request.data
        raw_active = data.get('isActive') if 'isActive' in data else data.get('is_active', True)
        if isinstance(raw_active, str):
            is_active = raw_active.lower() in ['true', '1']
        else:
            is_active = bool(raw_active)

        profile.user.is_active = is_active
        profile.user.save()
        profile.refresh_from_db()

        if not profile.user.is_active:
            revoke_all_user_tokens(profile.user)

        serializer = StudentProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentDetailView(APIView):
    """
    Feature 4: Privacy-filtered student profile for mentors/faculty.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        q = Q(student_id=student_id) if not is_valid_uuid(student_id) else (Q(student_id=student_id) | Q(id=student_id))
        profile = StudentProfile.objects.filter(q).select_related('user', 'department', 'course').first()
        if not profile:
            raise exceptions.NotFound(f"Student '{student_id}' not found.")

        # If user is owner or admin/support, return full profile; otherwise privacy-filtered public profile
        if request.user.id == profile.user.id or request.user.role in [UserRole.ADMIN, UserRole.SUPPORT]:
            serializer = StudentMeSerializer(profile, context={'request': request})
        else:
            serializer = StudentPublicSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentProfileLegacyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        student_id = request.query_params.get('student_id')
        if user_id:
            profile = StudentProfile.objects.filter(user__id=user_id).first()
        elif student_id:
            profile = StudentProfile.objects.filter(student_id=student_id).first()
        else:
            profile = getattr(request.user, 'student_profile', None)

        if not profile:
            raise exceptions.NotFound("Student profile not found.")

        serializer = StudentProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = getattr(request.user, 'student_profile', None)
        if not profile:
            raise exceptions.NotFound("Student profile not found.")

        data = request.data
        if 'fullName' in data or 'full_name' in data:
            profile.full_name = data.get('fullName') or data.get('full_name')
        if 'phone' in data:
            profile.phone = data.get('phone')
        if 'dateOfBirth' in data or 'date_of_birth' in data:
            profile.date_of_birth = data.get('dateOfBirth') or data.get('date_of_birth')
        if 'gender' in data:
            profile.gender = data.get('gender')
        if 'address' in data:
            profile.address = data.get('address')
        if 'guardianName' in data or 'guardian_name' in data:
            profile.guardian_name = data.get('guardianName') or data.get('guardian_name')
        if 'guardianPhone' in data or 'guardian_phone' in data:
            profile.guardian_phone = data.get('guardianPhone') or data.get('guardian_phone')
        if 'bio' in data:
            profile.bio = data.get('bio')
        if 'careerGoal' in data or 'career_goal' in data:
            profile.career_goal = data.get('careerGoal') or data.get('career_goal')

        if 'department_id' in data:
            dept = Department.objects.filter(id=data['department_id']).first()
            if dept:
                profile.department = dept
        if 'course_id' in data:
            course = Course.objects.filter(id=data['course_id']).first()
            if course:
                profile.course = course
        if 'semester' in data and data['semester'] is not None:
            profile.semester = int(data['semester'])

        profile.profile_completion = calculate_profile_completion(profile)
        profile.save()

        serializer = StudentProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AccessibilitySettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        target_user = request.user
        if user_id and str(user_id) != str(request.user.id):
            if request.user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
                raise exceptions.PermissionDenied("Access denied. You can only view your own accessibility settings.")
            target_user = get_object_or_404(User, id=user_id)

        settings_obj, _ = UserAccessibilitySettings.objects.get_or_create(user=target_user)
        return Response(AccessibilitySettingsSerializer(settings_obj).data, status=status.HTTP_200_OK)

    def put(self, request):
        user_id = request.query_params.get('user_id')
        target_user = request.user
        if user_id and str(user_id) != str(request.user.id):
            if request.user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
                raise exceptions.PermissionDenied("Access denied. You can only modify your own accessibility settings.")
            target_user = get_object_or_404(User, id=user_id)

        settings_obj, _ = UserAccessibilitySettings.objects.get_or_create(user=target_user)
        serializer = AccessibilitySettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
