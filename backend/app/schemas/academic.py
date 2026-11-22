from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CourseBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Course Code e.g. BTECH-CSE")
    name: str = Field(..., min_length=2, max_length=255, description="Course Name e.g. B.Tech Computer Science")
    total_semesters: int = Field(8, ge=1, le=12, description="Total number of semesters (1-12)")
    is_active: bool = True

    model_config = ConfigDict(populate_by_name=True)


class CourseCreate(CourseBase):
    department_id: str = Field(..., description="Foreign key of Department")


class CourseUpdate(BaseModel):
    department_id: Optional[str] = None
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    total_semesters: Optional[int] = Field(None, ge=1, le=12)
    is_active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)


class CourseResponse(CourseBase):
    id: str
    department_id: str
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class DepartmentBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Department Code e.g. CSE")
    name: str = Field(..., min_length=2, max_length=255, description="Department Name")
    description: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(populate_by_name=True)


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)


class DepartmentResponse(DepartmentBase):
    id: str
    courses: List[CourseResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
