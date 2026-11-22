import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from academics.models import Department, Course


class StudentSequence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    year = models.IntegerField(default=2026)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='student_sequences',
        null=True,
        blank=True,
    )
    dept_code = models.CharField(max_length=20, default='GEN')
    last_number = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_sequences'
        unique_together = ('year', 'dept_code')

    def __str__(self):
        return f"{self.year}-{self.dept_code}: {self.last_number}"


class StudentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
    )
    student_id = models.CharField(max_length=50, unique=True, db_index=True)

    # Personal details
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True, null=True)
    date_of_birth = models.CharField(max_length=30, blank=True, null=True)
    gender = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    guardian_name = models.CharField(max_length=150, blank=True, null=True)
    guardian_phone = models.CharField(max_length=30, blank=True, null=True)
    bio = models.TextField(blank=True, default='')
    career_goal = models.CharField(max_length=200, blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    avatar_color = models.CharField(max_length=100, default='from-royal-600 to-violet-600')

    # Academic details
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profiles',
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profiles',
    )
    semester = models.PositiveSmallIntegerField(default=1)
    batch_year = models.IntegerField(default=2026)
    roll_number = models.CharField(max_length=50, blank=True, null=True)
    cgpa = models.FloatField(default=8.0)
    profile_completion = models.IntegerField(default=70)

    # Specially Abled Student Fields
    disability_type = models.CharField(max_length=150, blank=True, null=True)
    disability_percentage = models.FloatField(blank=True, null=True)
    assistive_devices = models.JSONField(default=list, blank=True)
    preferred_communication = models.CharField(max_length=50, default='text')
    accommodation_needs = models.TextField(blank=True, null=True)
    udid_number = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_profiles'
        ordering = ['student_id']

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"


class UserAccessibilitySettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='accessibility_settings',
    )
    # General flexible preferences store
    preferences = models.JSONField(default=dict, blank=True)

    # Explicit fields matching AccessibilityContext.jsx keys
    font_scale = models.FloatField(default=1.0)
    dark_mode = models.BooleanField(default=False)
    high_contrast = models.BooleanField(default=False)
    highlight_links = models.BooleanField(default=False)
    dyslexia_font = models.BooleanField(default=False)
    reading_mode = models.BooleanField(default=False)
    line_spacing = models.FloatField(default=1.6)
    large_controls = models.BooleanField(default=False)
    reduced_motion = models.BooleanField(default=False)
    focus_enhanced = models.BooleanField(default=False)
    written_notifications = models.BooleanField(default=True)
    caption_mode = models.BooleanField(default=True)
    tts_rate = models.FloatField(default=1.0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_accessibility_settings'

    def __str__(self):
        return f"A11ySettings({self.user.email})"
