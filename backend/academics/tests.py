from django.test import TestCase
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient
from academics.models import Department, Course


class AcademicAPITests(TestCase):
    def setUp(self):
        call_command('seed_udaan')
        self.client = APIClient()

    def test_get_departments_and_nested_courses(self):
        res = self.client.get('/api/v1/academics/departments')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertGreaterEqual(len(data), 4)
        cse = next(d for d in data if d['code'] == 'CSE')
        self.assertEqual(cse['name'], 'Computer Science & Engineering')
        self.assertGreaterEqual(cse['courses_count'], 2)

    def test_get_department_courses_bounds(self):
        res = self.client.get('/api/v1/academics/departments/CSE/courses')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        courses = res.json()
        btech = next(c for c in courses if c['code'] == 'BTECH-CSE')
        self.assertEqual(btech['min_semester'], 1)
        self.assertEqual(btech['max_semester'], 8)
        self.assertEqual(len(btech['semester_options']), 8)

    def test_admin_create_department(self):
        login_admin = self.client.post('/api/v1/auth/login', {'email': 'admin@udaan.edu', 'password': 'Password@123'}, format='json')
        admin_token = login_admin.json()['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

        res = self.client.post('/api/v1/academics/departments', {
            'code': 'BIO',
            'name': 'Bioengineering & Assistive Tech',
            'hod': 'Dr. Sen',
            'accessibility_compliance': 97,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['code'], 'BIO')
