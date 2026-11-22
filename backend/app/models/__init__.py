from app.models.user import User, UserRole
from app.models.academic import Department, Course
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings

__all__ = [
    "User",
    "UserRole",
    "Department",
    "Course",
    "StudentProfile",
    "UserAccessibilitySettings",
]
