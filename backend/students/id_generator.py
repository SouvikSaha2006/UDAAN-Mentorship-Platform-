import threading
from django.db import transaction
from academics.models import StudentIDSequence

_seq_lock = threading.Lock()


def generate_student_id(dept_code="GEN", year=2026, prefix="UDN") -> str:
    """
    Concurrency-Safe, Deterministic Student ID Generator (Feature 6).
    Enforces format: UDN-<YEAR>-<DEPT_CODE>-<4_DIGIT_SEQ> (e.g. UDN-2026-CSE-0001).
    Combines Python threading lock with Django DB atomic transaction and select_for_update()
    so concurrent registrations never produce duplicate IDs.
    """
    clean_dept = (dept_code or "GEN").upper().strip()
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
            seq_obj, created = StudentIDSequence.objects.select_for_update().get_or_create(
                year=year,
                dept_code=clean_dept,
                defaults={'last_seq': 1},
            )
            if not created:
                seq_obj.last_seq += 1
                seq_obj.save(update_fields=['last_seq', 'updated_at'])
            next_seq = seq_obj.last_seq

    return f"{prefix}-{year}-{clean_dept}-{next_seq:04d}"
