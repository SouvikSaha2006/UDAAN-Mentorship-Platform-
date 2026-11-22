import random
import string
from sqlalchemy.orm import Session
from app.models.student_profile import StudentProfile


def generate_student_id(db: Session, prefix: str = "UDN", year: int = 2026) -> str:
    """
    Generates a unique formatted student ID, e.g. UDN-2026-1042
    matching the format requirements.
    """
    for _ in range(100):
        random_num = random.randint(1000, 9999)
        candidate = f"{prefix}-{year}-{random_num}"
        exists = db.query(StudentProfile).filter(StudentProfile.student_id == candidate).first()
        if not exists:
            return candidate
    
    # Fallback to alphanumeric if collision
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{year}-{random_str}"
