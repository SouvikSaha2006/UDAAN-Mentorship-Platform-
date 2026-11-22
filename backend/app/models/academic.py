import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hod = Column(String(255), nullable=True)  # Head of Department
    description = Column(Text, nullable=True)
    accessibility_compliance = Column(Integer, default=95, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan")
    student_profiles = relationship("StudentProfile", back_populates="department")

    def __repr__(self):
        return f"<Department code={self.code} name={self.name}>"


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    total_semesters = Column(Integer, default=8, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="courses")
    student_profiles = relationship("StudentProfile", back_populates="course")

    def __repr__(self):
        return f"<Course code={self.code} name={self.name} total_semesters={self.total_semesters}>"


class StudentIDSequence(Base):
    """
    Atomic counter table for concurrency-safe student ID generation.
    Supports atomic increments on (year, dept_code) so concurrent registrations
    never collide or produce duplicate IDs.
    """
    __tablename__ = "student_id_sequences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    year = Column(Integer, nullable=False)
    dept_code = Column(String(50), nullable=False)
    last_seq = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("year", "dept_code", name="uq_student_id_year_dept"),
    )

    def __repr__(self):
        return f"<StudentIDSequence year={self.year} dept_code={self.dept_code} last_seq={self.last_seq}>"
