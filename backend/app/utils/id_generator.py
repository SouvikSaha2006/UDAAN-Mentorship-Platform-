import threading
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.academic import StudentIDSequence

_seq_lock = threading.Lock()


def generate_student_id(
    db: Session,
    dept_code: str = "GEN",
    year: int = 2026,
    prefix: str = "UDN",
) -> str:
    """
    Concurrency-safe, deterministic Student ID Generator (Feature 6).
    Enforces format: UDN-<YEAR>-<DEPT_CODE>-<4_DIGIT_SEQ> (e.g. UDN-2026-CSE-0001).
    Uses a thread lock combined with an atomic DB counter table (UPSERT / RETURNING)
    so concurrent registrations never produce duplicate or out-of-order IDs.
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
        try:
            # Atomic SQLite 3.35+ / PostgreSQL UPSERT with RETURNING clause
            stmt = text(
                """
                INSERT INTO student_id_sequences (id, year, dept_code, last_seq, updated_at)
                VALUES (:id, :year, :dept_code, 1, CURRENT_TIMESTAMP)
                ON CONFLICT(year, dept_code) DO UPDATE SET
                    last_seq = student_id_sequences.last_seq + 1,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING last_seq;
                """
            )
            cursor_res = db.execute(stmt, {
                "id": str(uuid.uuid4()),
                "year": year,
                "dept_code": clean_dept,
            })
            row = cursor_res.fetchone()
            cursor_res.close()
            next_seq = row[0]
            db.flush()
        except Exception:
            # Fallback ORM query with for update
            seq = db.query(StudentIDSequence).filter(
                StudentIDSequence.year == year,
                StudentIDSequence.dept_code == clean_dept,
            ).with_for_update().first()

            if not seq:
                seq = StudentIDSequence(
                    id=str(uuid.uuid4()),
                    year=year,
                    dept_code=clean_dept,
                    last_seq=1,
                )
                db.add(seq)
                next_seq = 1
            else:
                seq.last_seq += 1
                next_seq = seq.last_seq
            db.flush()

    return f"{prefix}-{year}-{clean_dept}-{next_seq:04d}"
