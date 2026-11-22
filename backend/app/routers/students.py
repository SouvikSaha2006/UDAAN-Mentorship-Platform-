from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.academic import Department, Course
from app.models.student_profile import StudentProfile
from app.schemas.student_profile import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
)
from app.utils.security import get_current_user
from app.utils.id_generator import generate_student_id

router = APIRouter(prefix="/students", tags=["Students"])


def enrich_profile_response(p: StudentProfile) -> StudentProfileResponse:
    return StudentProfileResponse(
        id=p.id,
        userId=p.user_id,
        studentId=p.student_id,
        fullName=p.full_name,
        phone=p.phone,
        dateOfBirth=p.date_of_birth,
        gender=p.gender,
        address=p.address,
        guardianName=p.guardian_name,
        guardianPhone=p.guardian_phone,
        bio=p.bio,
        avatarUrl=p.avatar_url,
        avatarColor=p.avatar_color,
        departmentId=p.department_id,
        departmentName=p.department.name if p.department else None,
        courseId=p.course_id,
        courseName=p.course.name if p.course else None,
        semester=p.semester,
        batchYear=p.batch_year,
        rollNumber=p.roll_number,
        cgpa=p.cgpa,
        profileCompletion=p.profile_completion,
        careerGoal=p.career_goal,
        disabilityType=p.disability_type,
        disabilityPercentage=p.disability_percentage,
        assistiveDevices=p.assistive_devices or [],
        preferredCommunication=p.preferred_communication,
        accommodationNeeds=p.accommodation_needs,
        udidNumber=p.udid_number,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=List[StudentProfileResponse])
def list_students(
    department_id: Optional[str] = None,
    disability_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(StudentProfile)
    if department_id:
        query = query.filter(StudentProfile.department_id == department_id)
    if disability_type:
        query = query.filter(StudentProfile.disability_type.ilike(f"%{disability_type}%"))
    
    profiles = query.all()
    return [enrich_profile_response(p) for p in profiles]


@router.get("/profile", response_model=StudentProfileResponse)
def get_student_profile(
    user_id: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # If specific user_id or student_id is requested and user is faculty/mentor/admin/support
    target_user_id = current_user.id
    if user_id:
        target_user_id = user_id
    elif student_id:
        profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
        return enrich_profile_response(profile)

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user account.",
        )
    return enrich_profile_response(profile)


@router.put("/profile", response_model=StudentProfileResponse)
def update_student_profile(
    payload: StudentProfileUpdate,
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Feature 3: Ownership check
    if user_id and user_id != current_user.id:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only modify your own student profile.",
            )
        target_user_id = user_id
    else:
        target_user_id = current_user.id

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found.",
        )

    # Determine course for semester validation
    target_course_id = payload.course_id if payload.course_id is not None else profile.course_id
    course = None
    if target_course_id:
        course = db.query(Course).filter(Course.id == target_course_id).first()

    # Validate semester against course total_semesters
    if payload.semester is not None:
        sem_val = payload.semester
        max_sem = course.total_semesters if course else 12
        if sem_val < 1 or sem_val > max_sem:
            course_label = course.name if course else "assigned program"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid semester: {sem_val}. Must be between 1 and {max_sem} for {course_label}.",
            )
        profile.semester = sem_val

    # Update personal fields
    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.address is not None:
        profile.address = payload.address
    if payload.guardian_name is not None:
        profile.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        profile.guardian_phone = payload.guardian_phone
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.avatar_color is not None:
        profile.avatar_color = payload.avatar_color

    # Update academic fields
    if payload.department_id is not None:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        profile.department_id = dept.id
    if payload.course_id is not None:
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        profile.course_id = course.id
    if payload.batch_year is not None:
        profile.batch_year = payload.batch_year
    if payload.roll_number is not None:
        profile.roll_number = payload.roll_number
    if payload.cgpa is not None:
        profile.cgpa = payload.cgpa
    if payload.career_goal is not None:
        profile.career_goal = payload.career_goal
    if payload.profile_completion is not None:
        profile.profile_completion = payload.profile_completion

    # Update specially abled fields
    if payload.disability_type is not None:
        profile.disability_type = payload.disability_type
    if payload.disability_percentage is not None:
        profile.disability_percentage = payload.disability_percentage
    if payload.assistive_devices is not None:
        profile.assistive_devices = payload.assistive_devices
    if payload.preferred_communication is not None:
        profile.preferred_communication = payload.preferred_communication
    if payload.accommodation_needs is not None:
        profile.accommodation_needs = payload.accommodation_needs
    if payload.udid_number is not None:
        profile.udid_number = payload.udid_number

    db.commit()
    db.refresh(profile)
    return enrich_profile_response(profile)


@router.post("/profile", response_model=StudentProfileResponse, status_code=status.HTTP_201_CREATED)
def create_student_profile(
    payload: StudentProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify user exists
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check if profile already exists
    existing = db.query(StudentProfile).filter(StudentProfile.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student profile already exists for this user")

    # Validate course & semester
    course = None
    if payload.course_id:
        course = db.query(Course).filter(Course.id == payload.course_id).first()
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        if payload.semester < 1 or payload.semester > course.total_semesters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Semester {payload.semester} is invalid for course {course.name}. Must be between 1 and {course.total_semesters}.",
            )

    dept = db.query(Department).filter(Department.id == payload.department_id).first() if payload.department_id else None
    student_id = payload.student_id or generate_student_id(db, dept_code=dept.code if dept else "GEN", year=2026)

    profile = StudentProfile(
        user_id=payload.user_id,
        student_id=student_id,
        full_name=payload.full_name,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        address=payload.address,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        bio=payload.bio,
        avatar_url=payload.avatar_url,
        avatar_color=payload.avatar_color,
        department_id=payload.department_id,
        course_id=payload.course_id,
        semester=payload.semester,
        batch_year=payload.batch_year,
        roll_number=payload.roll_number,
        cgpa=payload.cgpa,
        profile_completion=payload.profile_completion,
        career_goal=payload.career_goal,
        disability_type=payload.disability_type,
        disability_percentage=payload.disability_percentage,
        assistive_devices=payload.assistive_devices,
        preferred_communication=payload.preferred_communication,
        accommodation_needs=payload.accommodation_needs,
        udid_number=payload.udid_number,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return enrich_profile_response(profile)
