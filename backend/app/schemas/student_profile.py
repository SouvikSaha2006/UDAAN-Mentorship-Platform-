from datetime import datetime
from typing import Optional, List, Union, Any
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


class StudentProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, alias="fullName")
    phone: Optional[str] = None
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, alias="guardianName")
    guardian_phone: Optional[str] = Field(None, alias="guardianPhone")
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    avatar_color: Optional[str] = Field("from-royal-600 to-violet-600", alias="avatarColor")
    
    # Academic details
    department_id: Optional[str] = Field(None, alias="departmentId")
    course_id: Optional[str] = Field(None, alias="courseId")
    semester: int = Field(1, ge=1, le=12, description="Current semester (1 to total_semesters)")
    batch_year: int = Field(2026, ge=2000, le=2050, alias="batchYear")
    roll_number: Optional[str] = Field(None, alias="rollNumber")
    cgpa: float = Field(0.0, ge=0.0, le=10.0)
    career_goal: Optional[str] = Field(None, alias="careerGoal")
    profile_completion: int = Field(70, ge=0, le=100, alias="profileCompletion")

    # Specially Abled Student Fields
    disability_type: Optional[str] = Field(None, alias="disabilityType")
    disability_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, alias="disabilityPercentage")
    assistive_devices: List[str] = Field(default_factory=list, alias="assistiveDevices")
    preferred_communication: Optional[str] = Field("text", alias="preferredCommunication")
    accommodation_needs: Optional[str] = Field(None, alias="accommodationNeeds")
    udid_number: Optional[str] = Field(None, alias="udidNumber")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("semester", mode="before")
    @classmethod
    def parse_semester(cls, v: Any) -> int:
        if isinstance(v, str):
            # Parse strings like "5th Semester", "Sem 3", "5"
            digits = "".join([c for c in v if c.isdigit()])
            if digits:
                return int(digits)
        return int(v) if v is not None else 1


class StudentProfileCreate(StudentProfileBase):
    user_id: str = Field(..., alias="userId")
    student_id: Optional[str] = Field(None, alias="studentId")


class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255, alias="fullName")
    phone: Optional[str] = None
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, alias="guardianName")
    guardian_phone: Optional[str] = Field(None, alias="guardianPhone")
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    avatar_color: Optional[str] = Field(None, alias="avatarColor")
    
    department_id: Optional[str] = Field(None, alias="departmentId")
    course_id: Optional[str] = Field(None, alias="courseId")
    semester: Optional[Union[int, str]] = None
    batch_year: Optional[int] = Field(None, alias="batchYear")
    roll_number: Optional[str] = Field(None, alias="rollNumber")
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    career_goal: Optional[str] = Field(None, alias="careerGoal")
    profile_completion: Optional[int] = Field(None, ge=0, le=100, alias="profileCompletion")

    disability_type: Optional[str] = Field(None, alias="disabilityType")
    disability_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, alias="disabilityPercentage")
    assistive_devices: Optional[List[str]] = Field(None, alias="assistiveDevices")
    preferred_communication: Optional[str] = Field(None, alias="preferredCommunication")
    accommodation_needs: Optional[str] = Field(None, alias="accommodationNeeds")
    udid_number: Optional[str] = Field(None, alias="udidNumber")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("semester", mode="before")
    @classmethod
    def parse_semester(cls, v: Any) -> Optional[int]:
        if v is None:
            return None
        if isinstance(v, str):
            digits = "".join([c for c in v if c.isdigit()])
            if digits:
                return int(digits)
        return int(v)


class StudentProfileResponse(StudentProfileBase):
    id: str
    user_id: str = Field(..., alias="userId")
    student_id: str = Field(..., alias="studentId")
    department_name: Optional[str] = Field(None, alias="departmentName")
    course_name: Optional[str] = Field(None, alias="courseName")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
