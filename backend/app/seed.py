"""
Deterministic Database Seed Script for UDAAN Mentorship Platform.
Populates Departments, Courses, Demo Users, Student Profiles, and Accessibility Settings.
"""

from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.academic import Department, Course
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.utils.security import hash_password


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding academic departments...")
        depts_data = [
            {
                "code": "CSE",
                "name": "Computer Science & Engineering",
                "hod": "Prof. Rajeshwari Kulkarni",
                "accessibility_compliance": 96,
                "description": "Department of Computer Science & Engineering with accessible lab setups and inclusive digital curriculum.",
            },
            {
                "code": "ECE",
                "name": "Electronics & Communication",
                "hod": "Prof. Nandini Bose",
                "accessibility_compliance": 92,
                "description": "Department of Electronics & Communication with adaptive hardware stations and assistive lab tools.",
            },
            {
                "code": "MDS",
                "name": "Mathematics & Data Science",
                "hod": "Dr. Harishankar Iyer",
                "accessibility_compliance": 94,
                "description": "Department of Mathematics & Data Science with descriptive math transcripts and audio notation support.",
            },
            {
                "code": "DES",
                "name": "Design & Humanities",
                "hod": "Prof. Deepak Chawla",
                "accessibility_compliance": 98,
                "description": "Department of Design & Humanities specializing in WCAG 2.2 accessible interaction design.",
            },
        ]

        dept_map = {}
        for d in depts_data:
            existing = db.query(Department).filter(Department.code == d["code"]).first()
            if not existing:
                existing = Department(
                    code=d["code"],
                    name=d["name"],
                    hod=d["hod"],
                    accessibility_compliance=d["accessibility_compliance"],
                    description=d["description"],
                    is_active=True,
                )
                db.add(existing)
                db.flush()
            else:
                existing.hod = d["hod"]
                existing.accessibility_compliance = d["accessibility_compliance"]
            dept_map[d["code"]] = existing

        print("Seeding courses...")
        courses_data = [
            {
                "dept_code": "CSE",
                "code": "BTECH-CSE",
                "name": "B.Tech Computer Science & Engineering",
                "total_semesters": 8,
            },
            {
                "dept_code": "CSE",
                "code": "MTECH-CSE",
                "name": "M.Tech Computer Science",
                "total_semesters": 4,
            },
            {
                "dept_code": "ECE",
                "code": "BTECH-ECE",
                "name": "B.Tech Electronics & Communication",
                "total_semesters": 8,
            },
            {
                "dept_code": "MDS",
                "code": "BSC-DS",
                "name": "B.Sc. Data Science",
                "total_semesters": 6,
            },
            {
                "dept_code": "MDS",
                "code": "MSC-MATH",
                "name": "M.Sc. Applied Mathematics",
                "total_semesters": 4,
            },
            {
                "dept_code": "DES",
                "code": "BDES-IXD",
                "name": "B.Des Interaction Design",
                "total_semesters": 8,
            },
        ]

        course_map = {}
        for c in courses_data:
            existing = db.query(Course).filter(Course.code == c["code"]).first()
            if not existing:
                dept = dept_map[c["dept_code"]]
                existing = Course(
                    department_id=dept.id,
                    code=c["code"],
                    name=c["name"],
                    total_semesters=c["total_semesters"],
                    is_active=True,
                )
                db.add(existing)
                db.flush()
            course_map[c["code"]] = existing

        print("Seeding demo accounts matching mockUsers.js...")
        default_pwd_hash = hash_password("Password@123")

        # Core Demo Accounts
        demo_users = [
            {
                "email": "student@udaan.edu",
                "role": UserRole.STUDENT,
                "profile": {
                    "student_id": "UDN-2026-CSE-0001",
                    "full_name": "Aarav Sharma",
                    "phone": "+91 98765 43210",
                    "date_of_birth": "2004-06-15",
                    "gender": "Male",
                    "address": "LH-Ground Floor, Accessible Campus Hostel, Bengaluru",
                    "guardian_name": "Ramesh Sharma",
                    "guardian_phone": "+91 98765 11223",
                    "dept_code": "CSE",
                    "course_code": "BTECH-CSE",
                    "semester": 5,
                    "batch_year": 2024,
                    "roll_number": "CSE-2024-042",
                    "cgpa": 8.74,
                    "profile_completion": 88,
                    "career_goal": "Accessibility-focused Full Stack Engineer",
                    "bio": "Passionate about accessible web engineering and backend systems. Exploring inclusive technology and software internships.",
                    "avatar_color": "from-royal-600 to-violet-600",
                    # Specially Abled Student Fields
                    "disability_type": "Visual Impairment (Low Vision)",
                    "disability_percentage": 60.0,
                    "assistive_devices": [
                        "Screen Reader Support",
                        "High Contrast UI",
                        "Large-Print Question Paper (18pt)",
                    ],
                    "preferred_communication": "text",
                    "accommodation_needs": "Extended Exam Time (+30 mins), Screen Reader Digital Option, Preferential Lab Seating",
                    "udid_number": "KA011042004008921",
                },
                "accessibility": {
                    "font_scale": 1.15,
                    "high_contrast": True,
                    "highlight_links": True,
                    "line_spacing": 1.8,
                    "written_notifications": True,
                    "caption_mode": True,
                    "tts_rate": 1.0,
                },
            },
            {
                "email": "mentor@udaan.edu",
                "role": UserRole.MENTOR,
                "accessibility": {
                    "font_scale": 1.0,
                    "caption_mode": True,
                },
            },
            {
                "email": "faculty@udaan.edu",
                "role": UserRole.FACULTY,
                "accessibility": {
                    "font_scale": 1.0,
                },
            },
            {
                "email": "support@udaan.edu",
                "role": UserRole.SUPPORT,
                "accessibility": {
                    "font_scale": 1.0,
                },
            },
            {
                "email": "admin@udaan.edu",
                "role": UserRole.ADMIN,
                "accessibility": {
                    "font_scale": 1.0,
                },
            },
            # Additional Students from STUDENTS_DIRECTORY
            {
                "email": "sneha.reddy@udaan.edu",
                "role": UserRole.STUDENT,
                "profile": {
                    "student_id": "UDN-2026-ECE-0001",
                    "full_name": "Sneha Reddy",
                    "phone": "+91 98765 43211",
                    "date_of_birth": "2005-02-18",
                    "gender": "Female",
                    "dept_code": "ECE",
                    "course_code": "BTECH-ECE",
                    "semester": 3,
                    "batch_year": 2024,
                    "roll_number": "ECE-2024-019",
                    "cgpa": 8.45,
                    "profile_completion": 79,
                    "career_goal": "Embedded Systems & Assistive Hardware Specialist",
                    "bio": "Interested in IoT devices and visual alert systems for smart accessible campuses.",
                    "disability_type": "Hearing Impairment",
                    "disability_percentage": 70.0,
                    "assistive_devices": [
                        "Live Captions",
                        "Video Transcripts",
                        "Visual Alert System",
                    ],
                    "preferred_communication": "captioned video",
                    "accommodation_needs": "Video Transcripts, Written Announcements, Front-row Visual Line-of-sight",
                    "udid_number": "AP022032005001244",
                },
                "accessibility": {
                    "caption_mode": True,
                    "written_notifications": True,
                },
            },
            {
                "email": "rohan.menon@udaan.edu",
                "role": UserRole.STUDENT,
                "profile": {
                    "student_id": "UDN-2026-CSE-0002",
                    "full_name": "Rohan Menon",
                    "phone": "+91 98765 43212",
                    "date_of_birth": "2003-11-09",
                    "gender": "Male",
                    "dept_code": "CSE",
                    "course_code": "BTECH-CSE",
                    "semester": 7,
                    "batch_year": 2023,
                    "roll_number": "CSE-2023-088",
                    "cgpa": 9.02,
                    "profile_completion": 92,
                    "career_goal": "Cloud Infrastructure & Distributed Systems Engineer",
                    "bio": "Specializing in high-performance cloud backends and asynchronous collaboration tools.",
                    "disability_type": "Locomotor Disability",
                    "disability_percentage": 50.0,
                    "assistive_devices": [
                        "Ergonomic Lab Station",
                        "Wheelchair Ramp Access",
                    ],
                    "preferred_communication": "text",
                    "accommodation_needs": "Ground-floor Lab Access, Flexible Lab Timings, Digital Assignment Submission",
                    "udid_number": "KL031022003004512",
                },
                "accessibility": {
                    "large_controls": True,
                    "reduced_motion": True,
                },
            },
            {
                "email": "neha.patel@udaan.edu",
                "role": UserRole.STUDENT,
                "profile": {
                    "student_id": "UDN-2026-MDS-0001",
                    "full_name": "Neha Patel",
                    "phone": "+91 98765 43213",
                    "date_of_birth": "2005-08-22",
                    "gender": "Female",
                    "dept_code": "MDS",
                    "course_code": "BSC-DS",
                    "semester": 3,
                    "batch_year": 2025,
                    "roll_number": "MDS-2025-011",
                    "cgpa": 8.21,
                    "profile_completion": 76,
                    "career_goal": "Inclusive Data Scientist & AI Bias Auditor",
                    "bio": "Passionate about statistical modeling and cognitive-accessible data visualizations.",
                    "disability_type": "Specific Learning Disability (Dyslexia)",
                    "disability_percentage": 40.0,
                    "assistive_devices": [
                        "Dyslexia-Friendly Font",
                        "Text-to-Speech Engine",
                    ],
                    "preferred_communication": "audio",
                    "accommodation_needs": "Dyslexia-Friendly Font, Extra Assignment Buffer (+48 hrs), Quiet Exam Room",
                    "udid_number": "MH041052005007831",
                },
                "accessibility": {
                    "dyslexia_font": True,
                    "reading_mode": True,
                    "line_spacing": 2.0,
                    "tts_rate": 0.9,
                },
            },
        ]

        for u_data in demo_users:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    password_hash=default_pwd_hash,
                    role=u_data["role"],
                    is_active=True,
                )
                db.add(user)
                db.flush()

            # Seed or update Accessibility Settings
            a11y_data = u_data.get("accessibility", {})
            a11y = db.query(UserAccessibilitySettings).filter(UserAccessibilitySettings.user_id == user.id).first()
            if not a11y:
                a11y = UserAccessibilitySettings(
                    user_id=user.id,
                    font_scale=a11y_data.get("font_scale", 1.0),
                    dark_mode=a11y_data.get("dark_mode", False),
                    high_contrast=a11y_data.get("high_contrast", False),
                    highlight_links=a11y_data.get("highlight_links", False),
                    dyslexia_font=a11y_data.get("dyslexia_font", False),
                    reading_mode=a11y_data.get("reading_mode", False),
                    line_spacing=a11y_data.get("line_spacing", 1.6),
                    large_controls=a11y_data.get("large_controls", False),
                    reduced_motion=a11y_data.get("reduced_motion", False),
                    focus_enhanced=a11y_data.get("focus_enhanced", False),
                    written_notifications=a11y_data.get("written_notifications", True),
                    caption_mode=a11y_data.get("caption_mode", True),
                    tts_rate=a11y_data.get("tts_rate", 1.0),
                )
                db.add(a11y)

            # Seed Student Profile if present
            if "profile" in u_data:
                prof_data = u_data["profile"]
                prof = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
                dept = dept_map.get(prof_data.get("dept_code"))
                course = course_map.get(prof_data.get("course_code"))
                if not prof:
                    prof = StudentProfile(
                        user_id=user.id,
                        student_id=prof_data["student_id"],
                        full_name=prof_data["full_name"],
                        phone=prof_data.get("phone"),
                        date_of_birth=prof_data.get("date_of_birth"),
                        gender=prof_data.get("gender"),
                        address=prof_data.get("address"),
                        guardian_name=prof_data.get("guardian_name"),
                        guardian_phone=prof_data.get("guardian_phone"),
                        bio=prof_data.get("bio"),
                        avatar_color=prof_data.get("avatar_color", "from-royal-600 to-violet-600"),
                        department_id=dept.id if dept else None,
                        course_id=course.id if course else None,
                        semester=prof_data.get("semester", 1),
                        batch_year=prof_data.get("batch_year", 2026),
                        roll_number=prof_data.get("roll_number"),
                        cgpa=prof_data.get("cgpa", 0.0),
                        profile_completion=prof_data.get("profile_completion", 70),
                        career_goal=prof_data.get("career_goal"),
                        disability_type=prof_data.get("disability_type"),
                        disability_percentage=prof_data.get("disability_percentage"),
                        assistive_devices=prof_data.get("assistive_devices", []),
                        preferred_communication=prof_data.get("preferred_communication", "text"),
                        accommodation_needs=prof_data.get("accommodation_needs"),
                        udid_number=prof_data.get("udid_number"),
                    )
                    db.add(prof)

        # Seed Student ID sequences
        seq_records = [
            {"year": 2026, "dept_code": "CSE", "last_seq": 2},
            {"year": 2026, "dept_code": "ECE", "last_seq": 1},
            {"year": 2026, "dept_code": "MDS", "last_seq": 1},
            {"year": 2026, "dept_code": "DES", "last_seq": 0},
            {"year": 2026, "dept_code": "GEN", "last_seq": 0},
        ]
        from app.models.academic import StudentIDSequence
        for s in seq_records:
            existing_seq = db.query(StudentIDSequence).filter(
                StudentIDSequence.year == s["year"],
                StudentIDSequence.dept_code == s["dept_code"]
            ).first()
            if not existing_seq:
                import uuid
                db.add(StudentIDSequence(
                    id=str(uuid.uuid4()),
                    year=s["year"],
                    dept_code=s["dept_code"],
                    last_seq=s["last_seq"],
                ))
            else:
                existing_seq.last_seq = max(existing_seq.last_seq, s["last_seq"])

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
