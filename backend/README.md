# UDAAN Mentorship Platform — Relational Backend API

FastAPI + SQLAlchemy 2.0 + SQLite relational backend for the UDAAN Mentorship Platform.

## Features
- **Authentication (Feature 9):** User model with UUID primary keys, lowercase unique emails, bcrypt password hashing, role-based access (`student`, `mentor`, `faculty`, `support`, `admin`), and strict serializers that never expose `password_hash`.
- **Academic Hierarchy (Feature 8):** Normalized `Department` and `Course` models with semester boundary validation (`1 <= semester <= course.total_semesters`).
- **Student Profile:** Complete personal details, academic links, and dedicated **Specially Abled Student Fields** (`disability_type`, `disability_percentage`, `assistive_devices` JSON array, `preferred_communication`, `accommodation_needs`, `udid_number`).
- **WCAG 2.2 Accessibility Persistence:** Persistent `user_accessibility_settings` matching `AccessibilityContext.jsx` (`font_scale`, `dark_mode`, `high_contrast`, `dyslexia_font`, `reading_mode`, `line_spacing`, `reduced_motion`, `written_notifications`, `caption_mode`, `tts_rate`).
- **CORS & Vite Integration:** Pre-configured for Vite at `http://localhost:5173`.
- **Database Migrations:** Alembic migration scripts in `alembic/versions/`.
- **Deterministic Seeding:** `seed.py` populating departments, courses, and demo accounts matching `mockUsers.js` and `mockAcademics.js`.

## Setup & Running

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Apply Migrations & Seed Database
```bash
alembic stamp head
python -m app.seed
```

### 3. Run Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 4. Run Test Suite
```bash
python -m pytest tests/test_backend.py -v
```
