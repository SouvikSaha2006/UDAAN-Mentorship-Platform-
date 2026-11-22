import concurrent.futures
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.academic import Department, Course, StudentIDSequence
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.utils.security import hash_password, create_access_token
from app.utils.id_generator import generate_student_id

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
        hod="Prof. Rajeshwari Kulkarni",
        accessibility_compliance=96,
        description="Department of Computer Science & Engineering",
        is_active=True,
    )
    dept_ece = Department(
        code="ECE",
        name="Electronics & Communication",
        hod="Prof. Nandini Bose",
        accessibility_compliance=92,
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

        a11y = UserAccessibilitySettings(
            user_id=u.id,
            font_scale=1.15 if role == UserRole.STUDENT else 1.0,
            high_contrast=True if role == UserRole.STUDENT else False,
        )
        db.add(a11y)

        if role == UserRole.STUDENT:
            sp = StudentProfile(
                user_id=u.id,
                student_id="UDN-2026-CSE-0001",
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

    # 4. Seed sequence table
    import uuid
    db.add(StudentIDSequence(
        id=str(uuid.uuid4()),
        year=2026,
        dept_code="CSE",
        last_seq=1,
    ))
    db.add(StudentIDSequence(
        id=str(uuid.uuid4()),
        year=2026,
        dept_code="ECE",
        last_seq=0,
    ))

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_concurrency_safe_student_id_generator():
    """
    Feature 6: Concurrency-Safe Student ID Generator
    Tests formatting UDN-<YEAR>-<DEPT_CODE>-<4_DIGIT_SEQ> and race-condition safety.
    """
    db = TestingSessionLocal()
    # Sequential test
    id1 = generate_student_id(db, dept_code="CSE", year=2026)
    id2 = generate_student_id(db, dept_code="CSE", year=2026)
    assert id1 == "UDN-2026-CSE-0002"
    assert id2 == "UDN-2026-CSE-0003"

    id_ece = generate_student_id(db, dept_code="ECE", year=2026)
    assert id_ece == "UDN-2026-ECE-0001"
    db.commit()
    db.close()

    # Concurrent multithreaded test
    def generate_worker():
        worker_db = TestingSessionLocal()
        try:
            val = generate_student_id(worker_db, dept_code="MDS", year=2026)
            worker_db.commit()
            return val
        finally:
            worker_db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(generate_worker) for _ in range(10)]
        results = [f.result() for f in futures]

    # Every generated ID must be unique (no duplicates in concurrent runs!)
    assert len(results) == len(set(results)), "Duplicate IDs found in concurrent generation!"
    assert all(r.startswith("UDN-2026-MDS-") for r in results)


def test_department_courses_metadata_endpoint():
    """
    Feature 8: GET /api/v1/academics/departments/{dept_id}/courses
    Verifies semester bounds (1..total_semesters) and semester options.
    """
    res = client.get("/api/v1/academics/departments/CSE/courses")
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) >= 1
    c = courses[0]
    assert c["code"] == "BTECH-CSE"
    assert c["totalSemesters"] == 8
    assert c["minSemester"] == 1
    assert c["maxSemester"] == 8
    assert len(c["semesterOptions"]) == 8
    assert c["semesterOptions"][0] == "1st Semester"
    assert c["semesterOptions"][-1] == "8th Semester"


def test_admin_protected_academic_endpoints():
    """
    Feature 8: POST /api/v1/academics/departments & POST /api/v1/academics/courses
    Verifies admin protection: unauthenticated / non-admin get 401/403; admin succeeds.
    """
    # 1. Unauthenticated request must fail
    res_unauth = client.post("/api/v1/academics/departments", json={
        "code": "MECH",
        "name": "Mechanical Engineering",
        "hod": "Dr. S. K. Verma",
    })
    assert res_unauth.status_code == 401

    # 2. Student token must be rejected with 403 Forbidden
    login_student = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    student_token = login_student.json()["access_token"]
    res_forbidden = client.post(
        "/api/v1/academics/departments",
        json={"code": "MECH", "name": "Mechanical Engineering"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_forbidden.status_code == 403
    assert "Admin privileges required" in res_forbidden.json()["detail"]

    # 3. Admin token must succeed
    login_admin = client.post("/api/v1/auth/login", json={
        "email": "admin@udaan.edu",
        "password": "Password@123",
        "role": "admin",
    })
    admin_token = login_admin.json()["access_token"]
    res_admin = client.post(
        "/api/v1/academics/departments",
        json={
            "code": "MECH",
            "name": "Mechanical Engineering",
            "hod": "Dr. S. K. Verma",
            "description": "Mechanical Engineering Dept",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == 201
    dept_data = res_admin.json()
    assert dept_data["code"] == "MECH"
    assert dept_data["hod"] == "Dr. S. K. Verma"

    # 4. Admin creates course under new department
    res_course = client.post(
        "/api/v1/academics/courses",
        json={
            "departmentId": dept_data["id"],
            "code": "BTECH-MECH",
            "name": "B.Tech Mechanical Engineering",
            "totalSemesters": 8,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_course.status_code == 201
    course_data = res_course.json()
    assert course_data["code"] == "BTECH-MECH"
    assert course_data["totalSemesters"] == 8
    assert course_data["semesterOptions"][0] == "1st Semester"


def test_user_registration_generates_formatted_student_id():
    """
    Verifies that registering a new student generates an ID formatted as UDN-2026-<DEPT>-<SEQ>.
    """
    payload = {
        "name": "Kavya Menon",
        "email": "kavya.menon@udaan.edu",
        "role": "student",
        "password": "Password@123",
        "confirmPassword": "Password@123",
        "department": "Computer Science & Engineering",
        "course": "B.Tech Computer Science & Engineering",
        "semester": "1st Semester",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    user = res.json()["user"]
    assert user["studentId"].startswith("UDN-2026-CSE-")


def test_login_demo_credentials_all_roles():
    for role in ["student", "mentor", "faculty", "support", "admin"]:
        response = client.post("/api/v1/auth/login", json={
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
    payload = {
        "name": "Invalid Sem Student",
        "email": "invalid.sem@udaan.edu",
        "role": "student",
        "password": "Password@123",
        "confirmPassword": "Password@123",
        "course": "B.Tech Computer Science & Engineering",
        "semester": "9th Semester",  # Exceeds total_semesters (8)
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "between 1 and 8" in response.json()["detail"]


def test_student_profile_with_specially_abled_fields():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    get_res = client.get("/api/v1/students/profile", headers=headers)
    assert get_res.status_code == 200
    p = get_res.json()
    assert p["fullName"] == "Aarav Sharma"
    assert p["studentId"] == "UDN-2026-CSE-0001"
    assert p["disabilityType"] == "Visual Impairment (Low Vision)"
    assert p["disabilityPercentage"] == 60.0
    assert "Screen Reader Support" in p["assistiveDevices"]
    assert p["udidNumber"] == "KA011042004008921"
    assert p["semester"] == 5

    profile_update = {
        "fullName": "Aarav Sharma",
        "careerGoal": "Senior Accessibility Architect & Full Stack Lead",
        "disabilityPercentage": 65.0,
        "assistiveDevices": ["Screen Reader Support", "High Contrast UI", "Refreshable Braille Display"],
    }
    put_res = client.put("/api/v1/students/profile", json=profile_update, headers=headers)
    assert put_res.status_code == 200
    updated_p = put_res.json()
    assert updated_p["disabilityPercentage"] == 65.0
    assert "Refreshable Braille Display" in updated_p["assistiveDevices"]
    assert updated_p["careerGoal"] == "Senior Accessibility Architect & Full Stack Lead"


def test_accessibility_settings_persistence():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    get_res = client.get("/api/v1/accessibility", headers=headers)
    assert get_res.status_code == 200
    a11y = get_res.json()
    assert a11y["fontScale"] == 1.15
    assert a11y["highContrast"] is True

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
    put_res = client.put("/api/v1/accessibility", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_a11y = put_res.json()
    assert updated_a11y["fontScale"] == 1.25
    assert updated_a11y["dyslexiaFont"] is True
    assert updated_a11y["reducedMotion"] is True
    assert updated_a11y["readingMode"] is True
    assert updated_a11y["lineSpacing"] == 1.8


def test_auth_registration_full_payload_and_tokens():
    """
    Feature 1: Student Registration
    Verifies full student registration with specially abled fields,
    atomic creation of User, StudentProfile, UserAccessibilitySettings,
    and return of access_token, refresh_token, and hydrated entities without password_hash.
    """
    payload = {
        "name": "Ananya Roy",
        "email": "ananya.roy@udaan.edu",
        "role": "student",
        "password": "Password@123",
        "confirmPassword": "Password@123",
        "department": "Computer Science & Engineering",
        "course": "B.Tech Computer Science & Engineering",
        "semester": "3rd Semester",
        "phone": "+91 91234 56789",
        "disabilityType": "Hearing Impairment",
        "disabilityPercentage": 75.0,
        "assistiveDevices": ["Hearing Aid", "Live Captions"],
        "preferredCommunication": "sign language",
        "accommodationNeeds": "Sign language interpreter for live lectures and captioned materials",
        "udidNumber": "DL021052003009912",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()

    # 1. Check tokens
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # 2. Check user
    user = data["user"]
    assert user["email"] == "ananya.roy@udaan.edu"
    assert user["role"] == "student"
    assert user["studentId"].startswith("UDN-2026-CSE-")
    assert "password_hash" not in user

    # 3. Check profile
    profile = data["profile"]
    assert profile is not None
    assert profile["fullName"] == "Ananya Roy"
    assert profile["disabilityType"] == "Hearing Impairment"
    assert profile["disabilityPercentage"] == 75.0
    assert profile["preferredCommunication"] == "sign language"
    assert "Live Captions" in profile["assistiveDevices"]
    assert profile["udidNumber"] == "DL021052003009912"
    assert profile["semester"] == 3

    # 4. Check accessibility settings
    a11y = data["accessibility_settings"]
    assert a11y is not None
    assert a11y["fontScale"] == 1.0


def test_auth_login_hydrates_user_profile_and_accessibility():
    """
    Feature 2: Login session hydration
    Verifies that logging in returns hydrated user, profile, and accessibility settings.
    """
    response = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "student@udaan.edu"
    assert data["profile"] is not None
    assert data["profile"]["studentId"] == "UDN-2026-CSE-0001"
    assert data["accessibility_settings"] is not None
    assert data["accessibility_settings"]["fontScale"] == 1.15
    assert data["accessibility_settings"]["highContrast"] is True


def test_auth_me_session_hydration():
    """
    Feature 2 & 3: GET /api/v1/auth/me session hydration for reload.
    """
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    token = login_res.json()["access_token"]
    
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == "student@udaan.edu"
    assert me_data["profile"]["studentId"] == "UDN-2026-CSE-0001"
    assert me_data["accessibility_settings"]["fontScale"] == 1.15


def test_auth_refresh_token_lifecycle():
    """
    Feature 2 & 3: POST /api/v1/auth/refresh lifecycle.
    """
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    refresh_token = login_res.json()["refresh_token"]

    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["user"]["email"] == "student@udaan.edu"


def test_auth_logout_revokes_tokens():
    """
    Feature 2 & 3: POST /api/v1/auth/logout revokes tokens in DB blacklist.
    Subsequent use of the revoked access token or refresh token must fail with 401.
    """
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]

    logout_res = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 200
    assert "signed out successfully" in logout_res.json()["message"].lower()

    # Subsequent request with revoked access token must fail
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 401
    assert "revoked" in me_res.json()["detail"].lower()

    # Subsequent refresh with revoked refresh token must fail
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 401
    assert "revoked" in refresh_res.json()["detail"].lower()


def test_ownership_guards_profile_and_accessibility():
    """
    Feature 3: Ownership checks.
    Students cannot modify or view other users' profiles or accessibility settings.
    """
    # 1. Register a student user
    res_s2 = client.post("/api/v1/auth/register", json={
        "name": "Student Two",
        "email": "student.two@udaan.edu",
        "role": "student",
        "password": "Password@123",
        "confirmPassword": "Password@123",
        "department": "Computer Science & Engineering",
        "course": "B.Tech Computer Science & Engineering",
        "semester": "1st Semester",
    })
    assert res_s2.status_code == 201
    s2_data = res_s2.json()
    s2_user_id = s2_data["user"]["id"]
    s2_token = s2_data["access_token"]

    # 2. Get student 1's user ID
    login_s1 = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    s1_token = login_s1.json()["access_token"]
    s1_user_id = login_s1.json()["user"]["id"]

    # Student 2 tries to update Student 1's profile -> 403 Forbidden
    hack_profile = client.put(
        f"/api/v1/students/profile?user_id={s1_user_id}",
        json={"fullName": "Hacked Profile"},
        headers={"Authorization": f"Bearer {s2_token}"},
    )
    assert hack_profile.status_code == 403
    assert "only modify your own" in hack_profile.json()["detail"]

    # Student 2 tries to view Student 1's accessibility settings -> 403 Forbidden
    hack_a11y_get = client.get(
        f"/api/v1/accessibility?user_id={s1_user_id}",
        headers={"Authorization": f"Bearer {s2_token}"},
    )
    assert hack_a11y_get.status_code == 403
    assert "only view your own" in hack_a11y_get.json()["detail"]

    # Student 2 tries to update Student 1's accessibility settings -> 403 Forbidden
    hack_a11y_put = client.put(
        f"/api/v1/accessibility?user_id={s1_user_id}",
        json={"fontScale": 2.0},
        headers={"Authorization": f"Bearer {s2_token}"},
    )
    assert hack_a11y_put.status_code == 403
    assert "only modify your own" in hack_a11y_put.json()["detail"]


def test_forgot_password_prevents_user_enumeration():
    """
    Feature 7: POST /api/v1/auth/forgot-password
    Always returns 200 OK regardless of whether email exists, preventing enumeration.
    """
    res = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent.user@udaan.edu"})
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "dispatched" in data["message"].lower()

    # Verify no token was created in DB for nonexistent user
    db = TestingSessionLocal()
    from app.models.token import PasswordResetToken
    token = db.query(PasswordResetToken).filter(PasswordResetToken.email == "nonexistent.user@udaan.edu").first()
    assert token is None
    db.close()


def test_forgot_password_valid_user_generates_hashed_token():
    """
    Feature 7: Valid user generates 15-minute single-use hashed token in DB.
    """
    res = client.post("/api/v1/auth/forgot-password", json={"email": "student@udaan.edu"})
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["demo_code"] is not None
    code = data["demo_code"]

    db = TestingSessionLocal()
    from app.models.token import PasswordResetToken
    import hashlib
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == "student@udaan.edu",
        PasswordResetToken.used == False,
    ).order_by(PasswordResetToken.created_at.desc()).first()

    assert token_record is not None
    assert token_record.token_hash == hashlib.sha256(code.encode("utf-8")).hexdigest()
    assert token_record.used is False
    db.close()


def test_verify_reset_token_endpoint():
    """
    Feature 7: POST /api/v1/auth/verify-reset-token
    Validates token/OTP expiry and single-use status.
    """
    res = client.post("/api/v1/auth/forgot-password", json={"email": "student@udaan.edu"})
    code = res.json()["demo_code"]

    # Invalid code -> 400
    bad_res = client.post("/api/v1/auth/verify-reset-token", json={
        "email": "student@udaan.edu",
        "resetCode": "WRONG-1234",
    })
    assert bad_res.status_code == 400
    assert "invalid" in bad_res.json()["detail"].lower()

    # Valid code -> 200
    good_res = client.post("/api/v1/auth/verify-reset-token", json={
        "email": "student@udaan.edu",
        "resetCode": code,
    })
    assert good_res.status_code == 200
    assert good_res.json()["valid"] is True


def test_reset_password_success_and_revokes_active_tokens():
    """
    Feature 7: POST /api/v1/auth/reset-password
    Updates password_hash, marks token used = True, and revokes active refresh/access tokens.
    """
    # 1. Login before reset to get active access and refresh tokens
    login_before = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    old_access_token = login_before.json()["access_token"]
    old_refresh_token = login_before.json()["refresh_token"]

    # 2. Request reset
    req_res = client.post("/api/v1/auth/forgot-password", json={"email": "student@udaan.edu"})
    code = req_res.json()["demo_code"]

    # 3. Confirm reset
    new_pass = "UpdatedSecurePassword@2026"
    confirm_res = client.post("/api/v1/auth/reset-password", json={
        "email": "student@udaan.edu",
        "resetCode": code,
        "newPassword": new_pass,
    })
    assert confirm_res.status_code == 200
    assert "updated successfully" in confirm_res.json()["message"].lower()

    # 4. Token must be marked used = True (single-use enforcement)
    db = TestingSessionLocal()
    from app.models.token import PasswordResetToken
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == "student@udaan.edu"
    ).order_by(PasswordResetToken.created_at.desc()).first()
    assert token_record.used is True
    db.close()

    # 5. Trying to reuse same reset code fails with 400
    reuse_res = client.post("/api/v1/auth/reset-password", json={
        "email": "student@udaan.edu",
        "resetCode": code,
        "newPassword": "AnotherPassword@2026",
    })
    assert reuse_res.status_code == 400

    # 6. Active tokens issued prior to password reset must now be revoked
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_access_token}"})
    assert me_res.status_code == 401

    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh_token})
    assert refresh_res.status_code == 401

    # 7. Old password fails
    old_login = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": "Password@123",
        "role": "student",
    })
    assert old_login.status_code == 401

    # 8. New password succeeds
    new_login = client.post("/api/v1/auth/login", json={
        "email": "student@udaan.edu",
        "password": new_pass,
        "role": "student",
    })
    assert new_login.status_code == 200
    assert new_login.json()["user"]["email"] == "student@udaan.edu"


def test_reset_password_expired_token_rejected():
    """
    Feature 7: Expired tokens (> 15 minutes) are rejected.
    """
    # 1. Request reset
    req_res = client.post("/api/v1/auth/forgot-password", json={"email": "mentor@udaan.edu"})
    code = req_res.json()["demo_code"]

    # 2. Artificially expire the token in DB
    db = TestingSessionLocal()
    from app.models.token import PasswordResetToken
    from datetime import datetime, timezone, timedelta
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == "mentor@udaan.edu",
        PasswordResetToken.used == False,
    ).first()
    token_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    db.close()

    # 3. Verify fails with expired
    verify_res = client.post("/api/v1/auth/verify-reset-token", json={
        "email": "mentor@udaan.edu",
        "resetCode": code,
    })
    assert verify_res.status_code == 400
    assert "expired" in verify_res.json()["detail"].lower()

    # 4. Reset fails with expired
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "email": "mentor@udaan.edu",
        "resetCode": code,
        "newPassword": "NewMentorPassword@123",
    })
    assert reset_res.status_code == 400
    assert "expired" in reset_res.json()["detail"].lower()
