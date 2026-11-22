from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


def generate_semester_labels(total: int) -> List[str]:
    suffixes = {1: "st", 2: "nd", 3: "rd"}
    labels = []
    for sem in range(1, total + 1):
        suffix = suffixes.get(sem if sem < 20 else sem % 10, "th")
        labels.append(f"{sem}{suffix} Semester")
    return labels


class CourseBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Course Code e.g. BTECH-CSE")
    name: str = Field(..., min_length=2, max_length=255, description="Course Name e.g. B.Tech Computer Science")
    total_semesters: int = Field(8, ge=1, le=12, alias="totalSemesters", description="Total semesters (1-12)")
    is_active: bool = Field(True, alias="isActive")

    model_config = ConfigDict(populate_by_name=True)


class CourseCreate(CourseBase):
    department_id: str = Field(..., alias="departmentId", description="Foreign key of Department")


class CourseUpdate(BaseModel):
    department_id: Optional[str] = Field(None, alias="departmentId")
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    total_semesters: Optional[int] = Field(None, ge=1, le=12, alias="totalSemesters")
    is_active: Optional[bool] = Field(None, alias="isActive")

    model_config = ConfigDict(populate_by_name=True)


class CourseResponse(CourseBase):
    id: str
    department_id: str = Field(..., alias="departmentId")
    department_code: Optional[str] = Field(None, alias="departmentCode")
    department_name: Optional[str] = Field(None, alias="departmentName")
    min_semester: int = Field(1, alias="minSemester")
    max_semester: int = Field(8, alias="maxSemester")
    semester_options: List[str] = Field(default_factory=list, alias="semesterOptions")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class DepartmentBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Department Code e.g. CSE")
    name: str = Field(..., min_length=2, max_length=255, description="Department Name")
    hod: Optional[str] = Field(None, description="Head of Department")
    description: Optional[str] = None
    is_active: bool = Field(True, alias="isActive")

    model_config = ConfigDict(populate_by_name=True)


class DepartmentCreate(DepartmentBase):
    accessibility_compliance: Optional[int] = Field(95, ge=0, le=100, alias="accessibilityCompliance")


class DepartmentUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    hod: Optional[str] = None
    description: Optional[str] = None
    accessibility_compliance: Optional[int] = Field(None, ge=0, le=100, alias="accessibilityCompliance")
    is_active: Optional[bool] = Field(None, alias="isActive")

    model_config = ConfigDict(populate_by_name=True)


class DepartmentResponse(DepartmentBase):
    id: str
    accessibility_compliance: int = Field(95, alias="accessibilityCompliance")
    courses_count: int = Field(0, alias="coursesCount")
    students_count: int = Field(0, alias="studentsCount")
    mentors_count: int = Field(0, alias="mentorsCount")
    active_mentorships: int = Field(0, alias="activeMentorships")
    courses: List[CourseResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
