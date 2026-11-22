from app.models.user import User, UserRole
from app.models.academic import Department, Course, StudentIDSequence
from app.models.student_profile import StudentProfile
from app.models.accessibility import UserAccessibilitySettings
from app.models.token import RevokedToken

__all__ = [
    "User",
    "UserRole",
    "Department",
    "Course",
    "StudentIDSequence",
    "StudentProfile",
    "UserAccessibilitySettings",
    "RevokedToken",
]
