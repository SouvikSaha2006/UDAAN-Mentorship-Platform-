import concurrent.futures
from django.test import TestCase
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient
from students.models import StudentProfile, UserAccessibilitySettings, StudentSequence
from students.id_generator import generate_student_id
from academics.models import Department


class StudentProfileAndSequenceTests(TestCase):
    def setUp(self):
        call_command('seed_udaan')
        self.client = APIClient()

    def test_student_me_profile_updates(self):
        login_res = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'}, format='json')
        token = login_res.json()['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 1. GET /api/v1/students/me
        me_res = self.client.get('/api/v1/students/me')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.json()['studentId'], 'UDN-2026-CSE-0001')

        # 2. PATCH /api/v1/students/me/personal
        p_res = self.client.patch('/api/v1/students/me/personal', {'phone': '+91 91234 56789'}, format='json')
        self.assertEqual(p_res.status_code, status.HTTP_200_OK)
        self.assertEqual(p_res.json()['phone'], '+91 91234 56789')

        # 3. PATCH /api/v1/students/me/academics with semester bound validation
        bad_sem = self.client.patch('/api/v1/students/me/academics', {'semester': 14}, format='json')
        self.assertEqual(bad_sem.status_code, status.HTTP_400_BAD_REQUEST)

        good_sem = self.client.patch('/api/v1/students/me/academics', {'semester': 7}, format='json')
        self.assertEqual(good_sem.status_code, status.HTTP_200_OK)
        self.assertEqual(good_sem.json()['semester'], 7)

    def test_accessibility_persistence(self):
        login_res = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'}, format='json')
        token = login_res.json()['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # PUT /api/v1/students/me/accessibility
        put_res = self.client.put('/api/v1/students/me/accessibility', {
            'font_scale': 1.35,
            'high_contrast': True,
            'dyslexia_font': True,
            'disability_type': 'Low Vision',
            'accommodation_needs': 'Screen Reader Exam Option',
        }, format='json')
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        data = put_res.json()
        self.assertEqual(data['accessibilitySettings']['fontScale'], 1.35)
        self.assertTrue(data['accessibilitySettings']['highContrast'])

        # GET /api/v1/students/me/accessibility
        get_res = self.client.get('/api/v1/students/me/accessibility')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.json()['accessibilitySettings']['fontScale'], 1.35)

    def test_privacy_filtering_mentor_vs_owner(self):
        # Mentor accesses student profile
        login_mentor = self.client.post('/api/v1/auth/login', {'email': 'mentor@udaan.edu', 'password': 'Password@123'}, format='json')
        mentor_token = login_mentor.json()['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {mentor_token}')

        mentor_view = self.client.get('/api/v1/students/UDN-2026-CSE-0001')
        self.assertEqual(mentor_view.status_code, status.HTTP_200_OK)
        mv_data = mentor_view.json()
        # Sensitive private fields stripped (None)
        self.assertIsNone(mv_data['guardianPhone'])
        self.assertIsNone(mv_data['udidNumber'])
        self.assertIsNone(mv_data['accommodationNeeds'])
        self.assertIsNone(mv_data['phone'])
        self.assertEqual(mv_data['fullName'], 'Aarav Sharma')

        # Owner accesses own profile
        login_owner = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'}, format='json')
        owner_token = login_owner.json()['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {owner_token}')

        owner_view = self.client.get('/api/v1/students/UDN-2026-CSE-0001')
        self.assertEqual(owner_view.status_code, status.HTTP_200_OK)
        ov_data = owner_view.json()
        self.assertIsNotNone(ov_data['guardianPhone'])
        self.assertIsNotNone(ov_data['udidNumber'])

    def test_soft_deactivation(self):
        login_res = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'}, format='json')
        token = login_res.json()['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # DELETE /api/v1/students/me
        del_res = self.client.delete('/api/v1/students/me')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        # Subsequent login denied
        self.client.credentials()
        blocked_login = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'}, format='json')
        self.assertEqual(blocked_login.status_code, status.HTTP_403_FORBIDDEN)

    def test_atomic_student_id_uniqueness(self):
        dept = Department.objects.get(code='CSE')
        ids = [generate_student_id(department=dept, year=2026) for _ in range(5)]
        self.assertEqual(len(ids), len(set(ids)))
        for sid in ids:
            self.assertTrue(sid.startswith('UDN-2026-CSE-'))

    def test_realtime_stream_accepts_sse_header(self):
        # Verify SSE endpoint accepts text/event-stream without 406 Not Acceptable
        res = self.client.get('/api/v1/realtime/stream/', HTTP_ACCEPT='text/event-stream')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/event-stream', res.headers.get('Content-Type', ''))
        first_chunk = next(res.streaming_content)
        self.assertIn(b'event: connected', first_chunk)
        res.close()

