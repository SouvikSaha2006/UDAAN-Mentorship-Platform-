import threading
from django.db import transaction
from students.models import StudentSequence

_seq_lock = threading.Lock()


def generate_student_id(department=None, dept_code="GEN", year=2026, prefix="UDN") -> str:
    """
    Concurrency-Safe, Deterministic Student ID Generator (Feature 6).
    Enforces format: UDN-<YEAR>-<DEPT_CODE>-<4_DIGIT_SEQ> (e.g. UDN-2026-CSE-0001).
    Combines thread locking with database atomic transaction and select_for_update() on StudentSequence
    so concurrent student registrations never produce duplicate or out-of-order IDs.
    """
    clean_dept = (department.code if department else dept_code or "GEN").upper().strip()
    dept_mapping = {
        "COMPUTER SCIENCE & ENGINEERING": "CSE",
        "COMPUTER SCIENCE": "CSE",
        "ELECTRONICS & COMMUNICATION": "ECE",
        "ELECTRONICS": "ECE",
        "MATHEMATICS & DATA SCIENCE": "MDS",
        "DATA SCIENCE": "MDS",
        "DESIGN & HUMANITIES": "DES",
        "DESIGN": "DES",
    }
    if clean_dept in dept_mapping:
        clean_dept = dept_mapping[clean_dept]
    elif len(clean_dept) > 8:
        clean_dept = clean_dept[:4]

    with _seq_lock:
        with transaction.atomic():
            seq_obj, created = StudentSequence.objects.select_for_update().get_or_create(
                year=year,
                dept_code=clean_dept,
                defaults={'last_number': 1, 'department': department},
            )
            if not created:
                seq_obj.last_number += 1
                if department and not seq_obj.department:
                    seq_obj.department = department
                seq_obj.save(update_fields=['last_number', 'department', 'updated_at'])
            next_num = seq_obj.last_number

    return f"{prefix}-{year}-{clean_dept}-{next_num:04d}"
