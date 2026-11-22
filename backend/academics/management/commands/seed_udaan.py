from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from academics.models import Department, Course
from students.models import StudentProfile, UserAccessibilitySettings, StudentSequence
from accounts.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = "Idempotently seed departments, courses, and demo accounts for Udaan matching mockAcademics.js and mockUsers.js"

    def handle(self, *args, **options):
        self.stdout.write("Seeding academic departments...")
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
            dept, _ = Department.objects.update_or_create(
                code=d["code"],
                defaults={
                    "name": d["name"],
                    "hod": d["hod"],
                    "accessibility_compliance": d["accessibility_compliance"],
                    "description": d["description"],
                    "is_active": True,
                },
            )
            dept_map[d["code"]] = dept

        self.stdout.write("Seeding courses...")
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
            course, _ = Course.objects.update_or_create(
                code=c["code"],
                defaults={
                    "department": dept_map[c["dept_code"]],
                    "name": c["name"],
                    "total_semesters": c["total_semesters"],
                    "is_active": True,
                },
            )
            course_map[c["code"]] = course

        self.stdout.write("Seeding demo accounts from mockUsers.js...")
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
                    "preferences": {
                        "theme": "high_contrast",
                        "reader": "screen_reader",
                    },
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
            user = User.objects.filter(email=u_data["email"]).first()
            if not user:
                user = User.objects.create_user(
                    email=u_data["email"],
                    password="Password@123",
                    role=u_data["role"],
                    is_active=True,
                )
            else:
                user.set_password("Password@123")
                user.role = u_data["role"]
                user.is_active = True
                user.save()

            # Seed Accessibility Settings
            a11y_data = u_data.get("accessibility", {})
            UserAccessibilitySettings.objects.update_or_create(
                user=user,
                defaults={
                    "font_scale": a11y_data.get("font_scale", 1.0),
                    "dark_mode": a11y_data.get("dark_mode", False),
                    "high_contrast": a11y_data.get("high_contrast", False),
                    "highlight_links": a11y_data.get("highlight_links", False),
                    "dyslexia_font": a11y_data.get("dyslexia_font", False),
                    "reading_mode": a11y_data.get("reading_mode", False),
                    "line_spacing": a11y_data.get("line_spacing", 1.6),
                    "large_controls": a11y_data.get("large_controls", False),
                    "reduced_motion": a11y_data.get("reduced_motion", False),
                    "focus_enhanced": a11y_data.get("focus_enhanced", False),
                    "written_notifications": a11y_data.get("written_notifications", True),
                    "caption_mode": a11y_data.get("caption_mode", True),
                    "tts_rate": a11y_data.get("tts_rate", 1.0),
                    "preferences": a11y_data.get("preferences", {}),
                },
            )

            # Seed Student Profile if present
            if "profile" in u_data:
                prof_data = u_data["profile"]
                dept = dept_map.get(prof_data.get("dept_code"))
                course = course_map.get(prof_data.get("course_code"))
                StudentProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "student_id": prof_data["student_id"],
                        "full_name": prof_data["full_name"],
                        "phone": prof_data.get("phone"),
                        "date_of_birth": prof_data.get("date_of_birth"),
                        "gender": prof_data.get("gender"),
                        "address": prof_data.get("address"),
                        "guardian_name": prof_data.get("guardian_name"),
                        "guardian_phone": prof_data.get("guardian_phone"),
                        "bio": prof_data.get("bio"),
                        "avatar_color": prof_data.get("avatar_color", "from-royal-600 to-violet-600"),
                        "department": dept,
                        "course": course,
                        "semester": prof_data.get("semester", 1),
                        "batch_year": prof_data.get("batch_year", 2026),
                        "roll_number": prof_data.get("roll_number"),
                        "cgpa": prof_data.get("cgpa", 0.0),
                        "profile_completion": prof_data.get("profile_completion", 70),
                        "career_goal": prof_data.get("career_goal"),
                        "disability_type": prof_data.get("disability_type"),
                        "disability_percentage": prof_data.get("disability_percentage"),
                        "assistive_devices": prof_data.get("assistive_devices", []),
                        "preferred_communication": prof_data.get("preferred_communication", "text"),
                        "accommodation_needs": prof_data.get("accommodation_needs"),
                        "udid_number": prof_data.get("udid_number"),
                    },
                )

        # Seed StudentSequence records
        seq_records = [
            {"year": 2026, "dept_code": "CSE", "last_number": 2},
            {"year": 2026, "dept_code": "ECE", "last_number": 1},
            {"year": 2026, "dept_code": "MDS", "last_number": 1},
            {"year": 2026, "dept_code": "DES", "last_number": 0},
            {"year": 2026, "dept_code": "GEN", "last_number": 0},
        ]
        for s in seq_records:
            dept = dept_map.get(s["dept_code"])
            seq_obj, _ = StudentSequence.objects.get_or_create(
                year=s["year"],
                dept_code=s["dept_code"],
                defaults={"last_number": s["last_number"], "department": dept},
            )
            if seq_obj.last_number < s["last_number"]:
                seq_obj.last_number = s["last_number"]
                if dept:
                    seq_obj.department = dept
                seq_obj.save()

        self.stdout.write(self.style.SUCCESS("Udaan database seeded successfully via seed_udaan!"))
