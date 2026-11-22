import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)  # Formatted ID e.g., UDN-2026-0101 or CSE-2024-042

    # Personal Details
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    date_of_birth = Column(String(50), nullable=True)  # YYYY-MM-DD
    gender = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    guardian_name = Column(String(255), nullable=True)
    guardian_phone = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    avatar_color = Column(String(100), nullable=True, default="from-royal-600 to-violet-600")

    # Academic Details
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    semester = Column(Integer, default=1, nullable=False)
    batch_year = Column(Integer, default=2026, nullable=False)
    roll_number = Column(String(50), nullable=True)
    cgpa = Column(Float, default=0.0, nullable=False)
    profile_completion = Column(Integer, default=70, nullable=False)
    career_goal = Column(String(255), nullable=True)

    # Specially Abled Student Fields
    disability_type = Column(String(100), nullable=True)
    disability_percentage = Column(Float, nullable=True)
    assistive_devices = Column(JSON, default=list, nullable=False)  # e.g., ["Screen Reader", "Braille Keyboard"]
    preferred_communication = Column(String(100), nullable=True, default="text")  # text, sign language, audio, captioned video
    accommodation_needs = Column(Text, nullable=True)  # Restricted visibility notes/accommodations
    udid_number = Column(String(50), nullable=True)  # Government Unique Disability ID

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="student_profiles")
    course = relationship("Course", back_populates="student_profiles")

    def __repr__(self):
        return f"<StudentProfile student_id={self.student_id} full_name={self.full_name}>"
