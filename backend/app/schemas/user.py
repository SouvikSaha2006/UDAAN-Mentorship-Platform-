import re
from datetime import datetime
from typing import Optional, Union, List, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict
from app.models.user import UserRole
from app.schemas.student_profile import StudentProfileResponse
from app.schemas.accessibility import AccessibilitySettingsResponse


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.STUDENT

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, description="Full Name")
    email: EmailStr
    role: UserRole = UserRole.STUDENT
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = Field(None, alias="confirmPassword")
    phone: Optional[str] = None

    # Academic fields
    department: Optional[str] = "Computer Science & Engineering"
    course: Optional[str] = "B.Tech Computer Science"
    semester: Optional[Union[int, str]] = "1st Semester"

    # Feature 1: Specially Abled Student Fields
    disability_type: Optional[str] = Field(None, alias="disabilityType")
    disability_percentage: Optional[float] = Field(None, alias="disabilityPercentage")
    assistive_devices: Optional[List[str]] = Field(default_factory=list, alias="assistiveDevices")
    accessibility_needs: Optional[List[str]] = Field(default_factory=list, alias="accessibilityNeeds")
    preferred_communication: Optional[str] = Field("text", alias="preferredCommunication")
    accommodation_needs: Optional[str] = Field(None, alias="accommodationNeeds")
    udid_number: Optional[str] = Field(None, alias="udidNumber")

    # Mentor registration fields
    qualification: Optional[str] = None
    experience_years: Optional[Union[int, str]] = Field(None, alias="experienceYears")
    expertise: Optional[str] = None
    bio: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = None
    remember_me: Optional[bool] = Field(True, alias="rememberMe")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., alias="refreshToken")

    model_config = ConfigDict(populate_by_name=True)


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, alias="refreshToken")

    model_config = ConfigDict(populate_by_name=True)


class PasswordResetRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class VerifyResetTokenRequest(BaseModel):
    email: EmailStr
    reset_code: str = Field(..., alias="resetCode")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class VerifyResetTokenResponse(BaseModel):
    ok: bool = True
    valid: bool = True
    message: str
    email: Optional[EmailStr] = None


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_code: str = Field(..., alias="resetCode")
    new_password: str = Field(..., min_length=6, alias="newPassword")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class PasswordResetResponse(BaseModel):
    ok: bool = True
    message: str
    demo_code: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    name: Optional[str] = None
    full_name: Optional[str] = Field(None, alias="fullName")
    student_id: Optional[str] = Field(None, alias="studentId")
    department: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[Union[str, int]] = None
    roll_number: Optional[str] = Field(None, alias="rollNumber")
    phone: Optional[str] = None
    avatar_color: Optional[str] = Field(None, alias="avatarColor")
    profile_completion: Optional[int] = Field(None, alias="profileCompletion")
    cgpa: Optional[float] = None
    bio: Optional[str] = None
    career_goal: Optional[str] = Field(None, alias="careerGoal")
    accessibility_needs: Optional[List[str]] = Field(default_factory=list, alias="accessibilityNeeds")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None
    tokenType: Optional[str] = "bearer"
    user: UserResponse
    profile: Optional[StudentProfileResponse] = None
    accessibility_settings: Optional[AccessibilitySettingsResponse] = None
    accessibilitySettings: Optional[AccessibilitySettingsResponse] = None

    model_config = ConfigDict(populate_by_name=True)


class SessionHydrationResponse(BaseModel):
    user: UserResponse
    profile: Optional[StudentProfileResponse] = None
    accessibility_settings: Optional[AccessibilitySettingsResponse] = None
    accessibilitySettings: Optional[AccessibilitySettingsResponse] = None

    model_config = ConfigDict(populate_by_name=True)
