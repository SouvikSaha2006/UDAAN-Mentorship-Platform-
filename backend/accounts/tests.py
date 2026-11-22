from django.test import TestCase
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, UserRole, PasswordResetToken


class AuthAPITests(TestCase):
    def setUp(self):
        call_command('seed_udaan')
        self.client = APIClient()

    def test_student_registration_atomic_and_tokens(self):
        payload = {
            'name': 'Bikramjit Sen',
            'email': 'bikramjit@udaan.edu',
            'password': 'Password@123',
            'role': 'student',
            'department': 'CSE',
            'course': 'BTECH-CSE',
            'semester': 4,
            'disability_type': 'Locomotor Disability',
            'assistive_devices': ['Wheelchair Ramp Access'],
            'preferred_communication': 'text',
        }
        res = self.client.post('/api/v1/auth/register', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()

        # SimpleJWT and standard tokens verified
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertIn('access_token', data)
        self.assertIn('refresh_token', data)

        # Hydrated response
        self.assertEqual(data['user']['email'], 'bikramjit@udaan.edu')
        self.assertTrue(data['profile']['studentId'].startswith('UDN-2026-CSE-'))
        self.assertIn('accessibility_settings', data)

    def test_login_and_token_refresh(self):
        login_res = self.client.post('/api/v1/auth/login', {
            'email': 'student@udaan.edu',
            'password': 'Password@123',
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        tokens = login_res.json()
        refresh_token = tokens['refresh_token']
        access_token = tokens['access_token']

        # Refresh token rotation
        ref_res = self.client.post('/api/v1/auth/refresh', {'refresh_token': refresh_token}, format='json')
        self.assertEqual(ref_res.status_code, status.HTTP_200_OK)
        new_tokens = ref_res.json()
        self.assertIn('access_token', new_tokens)
        self.assertNotEqual(new_tokens['refresh_token'], refresh_token)

    def test_logout_token_blacklisting(self):
        login_res = self.client.post('/api/v1/auth/login', {
            'email': 'student@udaan.edu',
            'password': 'Password@123',
        }, format='json')
        tokens = login_res.json()
        refresh_token = tokens['refresh_token']
        access_token = tokens['access_token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_res = self.client.post('/api/v1/auth/logout', {'refresh_token': refresh_token}, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Re-using blacklisted token fails
        self.client.credentials()
        ref_fail = self.client.post('/api/v1/auth/refresh', {'refresh_token': refresh_token}, format='json')
        self.assertEqual(ref_fail.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_session_hydration_me(self):
        login_res = self.client.post('/api/v1/auth/login', {
            'email': 'student@udaan.edu',
            'password': 'Password@123',
        }, format='json')
        access_token = login_res.json()['access_token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_res = self.client.get('/api/v1/auth/me')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        data = me_res.json()
        self.assertEqual(data['user']['email'], 'student@udaan.edu')
        self.assertEqual(data['profile']['studentId'], 'UDN-2026-CSE-0001')

    def test_password_reset_flow(self):
        # 1. Request code
        req_res = self.client.post('/api/v1/auth/forgot-password', {'email': 'student@udaan.edu'}, format='json')
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        demo_code = req_res.json()['demo_code']
        self.assertIsNotNone(demo_code)

        # 2. Verify code
        ver_res = self.client.post('/api/v1/auth/verify-reset-token', {
            'email': 'student@udaan.edu',
            'reset_code': demo_code,
        }, format='json')
        self.assertEqual(ver_res.status_code, status.HTTP_200_OK)
        self.assertTrue(ver_res.json()['valid'])

        # 3. Reset password
        reset_res = self.client.post('/api/v1/auth/reset-password', {
            'email': 'student@udaan.edu',
            'reset_code': demo_code,
            'new_password': 'UpdatedPass@2026',
        }, format='json')
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)

        # 4. Old password rejected, new accepted
        old_login = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'Password@123'}, format='json')
        self.assertEqual(old_login.status_code, status.HTTP_401_UNAUTHORIZED)

        new_login = self.client.post('/api/v1/auth/login', {'email': 'student@udaan.edu', 'password': 'UpdatedPass@2026'}, format='json')
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)
