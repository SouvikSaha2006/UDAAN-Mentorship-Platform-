import concurrent.futures
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, UserRole, PasswordResetToken
from academics.models import Department, Course
from students.models import StudentProfile, UserAccessibilitySettings
from students.id_generator import generate_student_id


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeded_db(db):
    from django.core.management import call_command
    call_command('seed_db')


@pytest.mark.django_db
class TestAcademicEndpoints:
    def test_list_departments(self, api_client, seeded_db):
        res = api_client.get('/api/v1/academics/departments')
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert len(data) >= 4
        cse = next(d for d in data if d['code'] == 'CSE')
        assert cse['name'] == 'Computer Science & Engineering'
        assert cse['courses_count'] >= 2
        assert len(cse['courses']) >= 2

    def test_get_department_courses(self, api_client, seeded_db):
        res = api_client.get('/api/v1/academics/departments/CSE/courses')
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert len(data) >= 2
        btech = next(c for c in data if c['code'] == 'BTECH-CSE')
        assert btech['total_semesters'] == 8
        assert btech['min_semester'] == 1
        assert btech['max_semester'] == 8
        assert len(btech['semester_options']) == 8

    def test_create_department_admin_protected(self, api_client, seeded_db):
        # Unauthenticated fails
        res = api_client.post('/api/v1/academics/departments', {'code': 'MEC', 'name': 'Mechanical'})
        assert res.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

        # Login as student fails
        login_res = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        student_token = login_res.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')
        res = api_client.post('/api/v1/academics/departments', {'code': 'MEC', 'name': 'Mechanical'})
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # Login as admin succeeds
        login_admin = api_client.post('/api/v1/auth/login', {'email': 'admin@udaan.edu', 'password': 'Password@123'})
        admin_token = login_admin.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        res = api_client.post('/api/v1/academics/departments', {
            'code': 'MEC',
            'name': 'Mechanical Engineering',
            'hod': 'Dr. Sharma',
            'accessibility_compliance': 93,
        })
        assert res.status_code == status.HTTP_201_CREATED
        assert res.json()['code'] == 'MEC'


@pytest.mark.django_db
class TestAuthEndpoints:
    def test_register_student_success(self, api_client, seeded_db):
        payload = {
            'name': 'Priya Das',
            'email': 'priya.das@udaan.edu',
            'password': 'Password@123',
            'role': 'student',
            'phone': '+91 98765 99999',
            'department': 'CSE',
            'course': 'BTECH-CSE',
            'semester': 3,
            'disability_type': 'Visual Impairment',
            'disability_percentage': 50,
            'assistive_devices': ['Screen Reader', 'Large Font'],
            'preferred_communication': 'text',
        }
        res = api_client.post('/api/v1/auth/register', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()
        assert 'access_token' in data
        assert 'refresh_token' in data
        assert data['user']['email'] == 'priya.das@udaan.edu'
        assert data['profile']['studentId'].startswith('UDN-2026-CSE-')
        # High contrast auto-activated for visual impairment
        assert data['accessibility_settings']['high_contrast'] is True

    def test_register_duplicate_email_fails(self, api_client, seeded_db):
        res = api_client.post('/api/v1/auth/register', {
            'name': 'Test',
            'email': 'student@udaan.edu',
            'password': 'Password@123',
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in res.json()

    def test_login_and_hydration(self, api_client, seeded_db):
        res = api_client.post('/api/v1/auth/login', {
            'email': 'student@udaan.edu',
            'password': 'Password@123',
        })
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        token = data['access_token']
        assert data['user']['fullName'] == 'Aarav Sharma'
        assert data['accessibility_settings']['high_contrast'] is True

        # Test GET /api/v1/auth/me session hydration
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        me_res = api_client.get('/api/v1/auth/me')
        assert me_res.status_code == status.HTTP_200_OK
        me_data = me_res.json()
        assert me_data['user']['email'] == 'student@udaan.edu'
        assert me_data['profile']['studentId'] == 'UDN-2026-CSE-0001'

    def test_logout_revocation(self, api_client, seeded_db):
        login_res = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        refresh_token = login_res.json()['refresh_token']
        access_token = login_res.json()['access_token']

        # Logout revokes refresh token
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_res = api_client.post('/api/v1/auth/logout', {'refresh_token': refresh_token})
        assert logout_res.status_code == status.HTTP_200_OK

        # Attempt to refresh with revoked token fails
        api_client.credentials()
        ref_res = api_client.post('/api/v1/auth/refresh', {'refresh_token': refresh_token})
        assert ref_res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_password_reset_flow(self, api_client, seeded_db):
        # 1. Forgot password
        req_res = api_client.post('/api/v1/auth/forgot-password', {'email': 'student@udaan.edu'})
        assert req_res.status_code == status.HTTP_200_OK
        demo_code = req_res.json()['demo_code']
        assert demo_code is not None

        # 2. Verify token
        verify_res = api_client.post('/api/v1/auth/verify-reset-token', {
            'email': 'student@udaan.edu',
            'reset_code': demo_code,
        })
        assert verify_res.status_code == status.HTTP_200_OK
        assert verify_res.json()['valid'] is True

        # 3. Reset password
        reset_res = api_client.post('/api/v1/auth/reset-password', {
            'email': 'student@udaan.edu',
            'reset_code': demo_code,
            'new_password': 'NewPassword@2026',
        })
        assert reset_res.status_code == status.HTTP_200_OK

        # 4. Old password fails, new password succeeds
        fail_login = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        assert fail_login.status_code == status.HTTP_401_UNAUTHORIZED

        succ_login = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'NewPassword@2026'})
        assert succ_login.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestStudentProfileAndPrivacy:
    def test_student_me_profile_and_updates(self, api_client, seeded_db):
        login_res = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        token = login_res.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 1. GET /api/v1/students/me
        me_res = api_client.get('/api/v1/students/me')
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.json()['studentId'] == 'UDN-2026-CSE-0001'

        # 2. PATCH /api/v1/students/me/personal
        p_res = api_client.patch('/api/v1/students/me/personal', {'phone': '+91 99999 11111', 'bio': 'Updated bio.'})
        assert p_res.status_code == status.HTTP_200_OK
        assert p_res.json()['phone'] == '+91 99999 11111'

        # 3. PATCH /api/v1/students/me/academics - validation check
        bad_sem = api_client.patch('/api/v1/students/me/academics', {'semester': 12})
        assert bad_sem.status_code == status.HTTP_400_BAD_REQUEST

        good_sem = api_client.patch('/api/v1/students/me/academics', {'semester': 6})
        assert good_sem.status_code == status.HTTP_200_OK
        assert good_sem.json()['semester'] == 6

        # 4. PUT /api/v1/students/me/accessibility
        a11y_res = api_client.put('/api/v1/students/me/accessibility', {
            'high_contrast': True,
            'font_scale': 1.25,
            'dyslexia_font': True,
            'accommodation_needs': 'Extra exam time',
        })
        assert a11y_res.status_code == status.HTTP_200_OK
        assert a11y_res.json()['accessibilitySettings']['fontScale'] == 1.25

    def test_privacy_filtering(self, api_client, seeded_db):
        # Login as Mentor
        login_mentor = api_client.post('/api/v1/auth/login', {'email': 'mentor@udaan.edu', 'password': 'Password@123'})
        mentor_token = login_mentor.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {mentor_token}')

        # Mentor views student profile
        res = api_client.get('/api/v1/students/UDN-2026-CSE-0001')
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data['fullName'] == 'Aarav Sharma'
        # Sensitive fields MUST BE HIDDEN (None)
        assert data['phone'] is None
        assert data['guardianPhone'] is None
        assert data['udidNumber'] is None
        assert data['accommodationNeeds'] is None

        # Student viewing own profile gets all fields
        login_student = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        student_token = login_student.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')

        res_own = api_client.get('/api/v1/students/UDN-2026-CSE-0001')
        assert res_own.status_code == status.HTTP_200_OK
        own_data = res_own.json()
        assert own_data['phone'] is not None
        assert own_data['udidNumber'] is not None

    def test_concurrency_safe_student_id_generator(self, db):
        # Generate 10 IDs concurrently across threads
        def worker(idx):
            return generate_student_id(dept_code="CSE", year=2026)

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(worker, range(10)))

        # All 10 generated IDs must be unique
        assert len(results) == len(set(results))
        for item in results:
            assert item.startswith('UDN-2026-CSE-')


@pytest.mark.django_db
class TestCustomExceptionHandlerAndAccessibilityEndpoints:
    def test_custom_exception_handler_format(self, api_client, seeded_db):
        # 401 unauthenticated
        res = api_client.get('/api/v1/students/me')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED
        data = res.json()
        assert data['success'] is False
        assert data['error']['code'] == 'AUTHENTICATION_FAILED'
        assert isinstance(data['error']['message'], str)
        assert 'detail' in data
        assert 'message' in data

        # 404 not found
        login_res = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        token = login_res.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_404 = api_client.get('/api/v1/students/NON_EXISTENT_STUDENT_ID')
        assert res_404.status_code == status.HTTP_404_NOT_FOUND
        data_404 = res_404.json()
        assert data_404['success'] is False
        assert data_404['error']['code'] == 'NOT_FOUND'

    def test_direct_accessibility_endpoint(self, api_client, seeded_db):
        login_res = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        token = login_res.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # GET /api/v1/accessibility
        get_res = api_client.get('/api/v1/accessibility')
        assert get_res.status_code == status.HTTP_200_OK
        data = get_res.json()
        assert 'fontScale' in data
        assert data['highContrast'] is True

        # PUT /api/v1/accessibility
        put_res = api_client.put('/api/v1/accessibility', {'font_scale': 1.4, 'dark_mode': True})
        assert put_res.status_code == status.HTTP_200_OK
        updated = put_res.json()
        assert updated['fontScale'] == 1.4
        assert updated['darkMode'] is True

    def test_student_management_and_directory(self, api_client, seeded_db):
        # Admin login
        login_admin = api_client.post('/api/v1/auth/login', {'email': 'admin@udaan.edu', 'password': 'Password@123'})
        admin_token = login_admin.json()['access_token']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

        # List all
        list_res = api_client.get('/api/v1/students')
        assert list_res.status_code == status.HTTP_200_OK
        assert len(list_res.json()) >= 4

        # Filter by search
        search_res = api_client.get('/api/v1/students?search=Aarav')
        assert search_res.status_code == status.HTTP_200_OK
        assert len(search_res.json()) == 1
        assert search_res.json()[0]['fullName'] == 'Aarav Sharma'

        # Filter by disability_type
        hearing_res = api_client.get('/api/v1/students?disability_type=Hearing')
        assert hearing_res.status_code == status.HTTP_200_OK
        assert len(hearing_res.json()) >= 1

        # Admin deactivates student
        status_res = api_client.patch('/api/v1/students/UDN-2026-CSE-0001/status', {'isActive': False}, format='json')
        assert status_res.status_code == status.HTTP_200_OK
        assert status_res.json()['isActive'] is False

        # Student cannot login when deactivated
        api_client.credentials()
        deact_login = api_client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'})
        assert deact_login.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestFeature9SerializersAndAtomicSequences:
    def test_student_me_and_public_serializers(self, seeded_db):
        from students.serializers import StudentMeSerializer, StudentPublicSerializer
        student_user = User.objects.get(email='student@udaan.edu')
        profile = student_user.student_profile

        # StudentMeSerializer includes private fields & computed profile_completion
        me_ser = StudentMeSerializer(profile)
        me_data = me_ser.data
        assert me_data['phone'] == '+91 98765 43210'
        assert me_data['guardianPhone'] == '+91 98765 11223'
        assert me_data['udidNumber'] == 'KA011042004008921'
        assert me_data['accommodationNeeds'] is not None
        assert me_data['profileCompletion'] >= 70

        # StudentPublicSerializer strips private fields
        pub_ser = StudentPublicSerializer(profile)
        pub_data = pub_ser.data
        assert 'phone' not in pub_data
        assert 'guardianPhone' not in pub_data
        assert 'guardianName' not in pub_data
        assert 'udidNumber' not in pub_data
        assert 'accommodationNeeds' not in pub_data
        assert 'address' not in pub_data
        assert pub_data['fullName'] == 'Aarav Sharma'
        assert pub_data['studentId'] == 'UDN-2026-CSE-0001'

    def test_auth_serializers_password_write_only(self):
        from accounts.serializers import UserRegisterSerializer, UserLoginSerializer
        reg_ser = UserRegisterSerializer()
        assert reg_ser.fields['password'].write_only is True

        login_ser = UserLoginSerializer()
        assert login_ser.fields['password'].write_only is True

    def test_student_sequence_atomic_increment(self, db):
        from students.models import StudentSequence
        dept = Department.objects.create(code='CIV', name='Civil Engineering')

        # Generate sequential IDs using StudentSequence
        id_1 = generate_student_id(department=dept, year=2026)
        id_2 = generate_student_id(department=dept, year=2026)

        assert id_1 == 'UDN-2026-CIV-0001'
        assert id_2 == 'UDN-2026-CIV-0002'

        seq = StudentSequence.objects.get(year=2026, dept_code='CIV')
        assert seq.last_number == 2
        assert seq.department == dept
