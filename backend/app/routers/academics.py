from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.academic import Department, Course
from app.schemas.academic import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    CourseCreate,
    CourseResponse,
    CourseUpdate,
)

router = APIRouter(prefix="/academics", tags=["Academics"])


@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Department)
    if is_active is not None:
        query = query.filter(Department.is_active == is_active)
    return query.all()


@router.get("/departments/{department_id}", response_model=DepartmentResponse)
def get_department(department_id: str, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(
        (Department.id == department_id) | (Department.code == department_id.upper())
    ).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return dept


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(Department.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department with code '{payload.code}' already exists.",
        )
    dept = Department(
        code=payload.code.upper(),
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/courses", response_model=List[CourseResponse])
def list_courses(department_id: Optional[str] = None, is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)
    
    courses = query.all()
    # Enrich with department info
    results = []
    for c in courses:
        resp = CourseResponse(
            id=c.id,
            department_id=c.department_id,
            department_code=c.department.code if c.department else None,
            department_name=c.department.name if c.department else None,
            code=c.code,
            name=c.name,
            total_semesters=c.total_semesters,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        results.append(resp)
    return results


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(
        (Course.id == course_id) | (Course.code == course_id.upper())
    ).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return CourseResponse(
        id=course.id,
        department_id=course.department_id,
        department_code=course.department.code if course.department else None,
        department_name=course.department.name if course.department else None,
        code=course.code,
        name=course.name,
        total_semesters=course.total_semesters,
        is_active=course.is_active,
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department id '{payload.department_id}' not found.",
        )
    existing = db.query(Course).filter(Course.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course with code '{payload.code}' already exists.",
        )
    course = Course(
        department_id=payload.department_id,
        code=payload.code.upper(),
        name=payload.name,
        total_semesters=payload.total_semesters,
        is_active=payload.is_active,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseResponse(
        id=course.id,
        department_id=course.department_id,
        department_code=dept.code,
        department_name=dept.name,
        code=course.code,
        name=course.name,
        total_semesters=course.total_semesters,
        is_active=course.is_active,
        created_at=course.created_at,
        updated_at=course.updated_at,
    )
