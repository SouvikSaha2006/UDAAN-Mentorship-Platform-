# UDAAN Mentorship Platform — Django + DRF Backend

Enterprise-grade REST API backend for the UDAAN Mentorship Platform built with **Django 5**, **Django REST Framework (DRF)**, **SimpleJWT**, and **SQLite**.

---

## 🏛️ Architecture & Modular Apps

The backend is organized into three decoupled apps:

1. **`accounts`**:
   - Custom `User` model inheriting `AbstractBaseUser` and `PermissionsMixin` with UUID primary keys.
   - 5 RBAC roles: `student`, `mentor`, `faculty`, `support`, `admin`.
   - JWT authentication via `djangorestframework-simplejwt` with database token blacklisting on logout.
   - Password reset flow with 15-minute OTP and deterministic console log fallback for local development.

2. **`academics`**:
   - `Department` and `Course` relational models with semester validation bounds (`1 <= semester <= total_semesters`).
   - `StudentIDSequence` counter table for atomic sequence tracking.
   - Custom Django management command `python manage.py seed_db` to populate demo data deterministically.

3. **`students`**:
   - `StudentProfile` model capturing personal, academic, and disability/accommodation details.
   - `UserAccessibilitySettings` model syncing UI toolbar preferences (`high_contrast`, `font_scale`, `dyslexia_font`, etc.).
   - Concurrency-safe atomic student ID generator (`UDN-<YEAR>-<DEPT>-<SEQ>`).
   - Privacy-filtered student profiles for mentors/faculty.

4. **`udaan_backend/exceptions.py`**:
   - Custom DRF exception handler standardizing all errors to:
     ```json
     {
       "success": false,
       "error": {
         "code": "VALIDATION_ERROR",
         "message": "Screen reader plain-language explanation",
         "fields": { "field_name": "error details" }
       },
       "detail": "Screen reader plain-language explanation",
       "message": "Screen reader plain-language explanation"
     }
     ```

---

## 🚀 Running the Server

### 1. Install Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### 2. Run Database Migrations
```powershell
python manage.py migrate
```

### 3. Seed Database
```powershell
python manage.py seed_db
```

### 4. Start Development Server
```powershell
python manage.py runserver 8000
```
Runs at: `http://localhost:8000/api/v1/`

---

## 🧪 Running Tests

```powershell
cd backend
pytest -v
```

---

## 🔑 Demo Accounts (All Passwords: `Password@123`)

| Email | Role | Features |
| :--- | :--- | :--- |
| `student@udaan.edu` | Student | Aarav Sharma (Low Vision, High Contrast UI) |
| `mentor@udaan.edu` | Mentor | Student Directory, Privacy-filtered profiles |
| `faculty@udaan.edu` | Faculty | Academic views |
| `support@udaan.edu` | Support | Assistive review |
| `admin@udaan.edu` | Admin | Academic CRUD & Student Status toggle |
