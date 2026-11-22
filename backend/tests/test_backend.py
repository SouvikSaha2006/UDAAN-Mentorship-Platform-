import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.academic import Department, Course
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.utils.security import hash_password

# Use SQLite in-memory with StaticPool so all threads/sessions share the same connection
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # 1. Seed Departments
    dept_cse = Department(
        code="CSE",
        name="Computer Science & Engineering",
        description="Department of Computer Science & Engineering",
        is_active=True,
    )
    dept_ece = Department(
        code="ECE",
        name="Electronics & Communication",
        description="Department of Electronics & Communication",
        is_active=True,
    )
    db.add_all([dept_cse, dept_ece])
    db.flush()

    # 2. Seed Courses
    course_cse = Course(
        department_id=dept_cse.id,
        code="BTECH-CSE",
        name="B.Tech Computer Science & Engineering",
        total_semesters=8,
        is_active=True,
    )
    course_ece = Course(
        department_id=dept_ece.id,
        code="BTECH-ECE",
        name="B.Tech Electronics & Communication",
        total_semesters=8,
        is_active=True,
    )
    db.add_all([course_cse, course_ece])
    db.flush()

    # 3. Seed Demo Accounts matching mockUsers.js
    pwd_hash = hash_password("Password@123")
    demo_roles = [
        ("student@udaan.edu", UserRole.STUDENT),
        ("mentor@udaan.edu", UserRole.MENTOR),
        ("faculty@udaan.edu", UserRole.FACULTY),
        ("support@udaan.edu", UserRole.SUPPORT),
        ("admin@udaan.edu", UserRole.ADMIN),
    ]

    for email, role in demo_roles:
        u = User(email=email, password_hash=pwd_hash, role=role, is_active=True)
        db.add(u)
        db.flush()

        # Add accessibility settings
        a11y = UserAccessibilitySettings(
            user_id=u.id,
            font_scale=1.15 if role == UserRole.STUDENT else 1.0,
            high_contrast=True if role == UserRole.STUDENT else False,
        )
        db.add(a11y)

        # Add student profile if student
        if role == UserRole.STUDENT:
            sp = StudentProfile(
                user_id=u.id,
                student_id="UDN-2026-0101",
                full_name="Aarav Sharma",
                phone="+91 98765 43210",
                date_of_birth="2004-06-15",
                gender="Male",
                department_id=dept_cse.id,
                course_id=course_cse.id,
                semester=5,
                batch_year=2024,
                roll_number="CSE-2024-042",
                cgpa=8.74,
                profile_completion=88,
                career_goal="Accessibility-focused Full Stack Engineer",
                disability_type="Visual Impairment (Low Vision)",
                disability_percentage=60.0,
                assistive_devices=["Screen Reader Support", "High Contrast UI"],
                preferred_communication="text",
                accommodation_needs="Extended Exam Time (+30 mins), Screen Reader Digital Option",
                udid_number="KA011042004008921",
            )
            db.add(sp)

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_user_registration_and_serializer_hides_password_hash():
    payload = {
        "name": "Priya Nair",
        "email": "priya.nair@udaan.edu",
        "role": "student",
        "password": "Password@123",
        "confirmPassword": "Password@123",
        "department": "Computer Science & Engineering",
        "course": "B.Tech Computer Science & Engineering",
        "semester": "3rd Semester",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    user_data = data["user"]
    assert user_data["email"] == "priya.nair@udaan.edu"
    assert user_data["role"] == "student"
    assert user_data["name"] == "Priya Nair"
    # Ensure password_hash is NEVER exposed!
    assert "password_hash" not in user_data
    assert "password" not in user_data


def test_login_demo_credentials_all_roles():
    for role in ["student", "mentor", "faculty", "support", "admin"]:
        response = client.post("/api/auth/login", json={
            "email": f"{role}@udaan.edu",
            "password": "Password@123",
            "role": role,
        })
        assert response.status_code == 200, f"Failed for {role}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == f"{role}@udaan.edu"
        assert data["user"]["role"] == role
        assert "password_hash" not in data["user"]


def test_course_semester_validation():
    # Total semesters for BTECH-CSE is 8. Trying to register with semester 9 should fail!
    payload = {
        "name": "Invalid Sem Student",
        "email": "invalid.sem@udaan.edu",
        "role": "student",
        "password": "Password@123",
        "confirmPassword": "Password@123",
        "course": "B.Tech Computer Science & Engineering",
        "semester": "9th Semester",  # Exceeds total_semesters (8)
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "between 1 and 8" in response.json()["detail"]


def test_student_profile_with_specially_abled_fields():
    # Login as seeded student Aarav Sharma
    login_res = client.post("/api/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    get_res = client.get("/api/students/profile", headers=headers)
    assert get_res.status_code == 200
    p = get_res.json()
    assert p["fullName"] == "Aarav Sharma"
    assert p["studentId"] == "UDN-2026-0101"
    assert p["disabilityType"] == "Visual Impairment (Low Vision)"
    assert p["disabilityPercentage"] == 60.0
    assert "Screen Reader Support" in p["assistiveDevices"]
    assert p["udidNumber"] == "KA011042004008921"
    assert p["semester"] == 5

    # Update profile
    profile_update = {
        "fullName": "Aarav Sharma",
        "careerGoal": "Senior Accessibility Architect & Full Stack Lead",
        "disabilityPercentage": 65.0,
        "assistiveDevices": ["Screen Reader Support", "High Contrast UI", "Refreshable Braille Display"],
    }
    put_res = client.put("/api/students/profile", json=profile_update, headers=headers)
    assert put_res.status_code == 200
    updated_p = put_res.json()
    assert updated_p["disabilityPercentage"] == 65.0
    assert "Refreshable Braille Display" in updated_p["assistiveDevices"]
    assert updated_p["careerGoal"] == "Senior Accessibility Architect & Full Stack Lead"


def test_accessibility_settings_persistence():
    # Login as student
    login_res = client.post("/api/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch initial accessibility settings
    get_res = client.get("/api/accessibility", headers=headers)
    assert get_res.status_code == 200
    a11y = get_res.json()
    assert a11y["fontScale"] == 1.15
    assert a11y["highContrast"] is True

    # Update accessibility settings
    update_payload = {
        "fontScale": 1.25,
        "highContrast": True,
        "dyslexiaFont": True,
        "reducedMotion": True,
        "readingMode": True,
        "lineSpacing": 1.8,
        "captionMode": True,
        "ttsRate": 0.9,
    }
    put_res = client.put("/api/accessibility", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_a11y = put_res.json()
    assert updated_a11y["fontScale"] == 1.25
    assert updated_a11y["dyslexiaFont"] is True
    assert updated_a11y["reducedMotion"] is True
    assert updated_a11y["readingMode"] is True
    assert updated_a11y["lineSpacing"] == 1.8


def test_academic_departments_and_courses():
    res_depts = client.get("/api/academics/departments")
    assert res_depts.status_code == 200
    depts = res_depts.json()
    assert len(depts) >= 2
    dept_codes = [d["code"] for d in depts]
    assert "CSE" in dept_codes
    assert "ECE" in dept_codes

    res_courses = client.get("/api/academics/courses")
    assert res_courses.status_code == 200
    courses = res_courses.json()
    assert len(courses) >= 2
    course_codes = [c["code"] for c in courses]
    assert "BTECH-CSE" in course_codes
    assert "BTECH-ECE" in course_codes
