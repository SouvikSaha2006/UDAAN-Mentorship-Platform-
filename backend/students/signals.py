import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from students.models import StudentProfile, UserAccessibilitySettings
from academics.models import Department, Course
from students.events import broadcaster

logger = logging.getLogger(__name__)


@receiver(post_save, sender=StudentProfile)
def student_profile_saved_handler(sender, instance, created, **kwargs):
    try:
        user_email = instance.user.email if instance.user else None
        dept_name = instance.department.name if instance.department else "General"
        course_name = instance.course.name if instance.course else "B.Tech"

        if created:
            payload = {
                "id": str(instance.id),
                "userId": str(instance.user.id) if instance.user else None,
                "student_id": instance.student_id,
                "studentId": instance.student_id,
                "full_name": instance.full_name,
                "fullName": instance.full_name,
                "name": instance.full_name,
                "email": user_email,
                "department": dept_name,
                "departmentName": dept_name,
                "department_code": instance.department.code if instance.department else "GEN",
                "course": course_name,
                "courseName": course_name,
                "semester": instance.semester,
                "roll_number": instance.roll_number or instance.student_id,
                "rollNumber": instance.roll_number or instance.student_id,
                "disability_type": instance.disability_type or "None / Not Disclosed",
                "disabilityType": instance.disability_type or "None / Not Disclosed",
                "disability_percentage": instance.disability_percentage,
                "disabilityPercentage": instance.disability_percentage,
                "assistive_devices": instance.assistive_devices or [],
                "assistiveDevices": instance.assistive_devices or [],
                "preferred_communication": instance.preferred_communication,
                "preferredCommunication": instance.preferred_communication,
                "profile_completion": instance.profile_completion,
                "profileCompletion": instance.profile_completion,
                "is_active": instance.user.is_active if instance.user else True,
                "isActive": instance.user.is_active if instance.user else True,
                "timestamp": instance.created_at.isoformat() if instance.created_at else timezone.now().isoformat(),
            }
            logger.info("Broadcasting SSE event 'student.registered' for %s", instance.student_id)
            broadcaster.broadcast("student.registered", payload)
        else:
            payload = {
                "id": str(instance.id),
                "userId": str(instance.user.id) if instance.user else None,
                "student_id": instance.student_id,
                "studentId": instance.student_id,
                "full_name": instance.full_name,
                "fullName": instance.full_name,
                "name": instance.full_name,
                "email": user_email,
                "department": dept_name,
                "departmentName": dept_name,
                "course": course_name,
                "courseName": course_name,
                "semester": instance.semester,
                "roll_number": instance.roll_number,
                "rollNumber": instance.roll_number,
                "phone": instance.phone,
                "bio": instance.bio,
                "career_goal": instance.career_goal,
                "careerGoal": instance.career_goal,
                "disability_type": instance.disability_type,
                "disabilityType": instance.disability_type,
                "assistive_devices": instance.assistive_devices or [],
                "assistiveDevices": instance.assistive_devices or [],
                "profile_completion": instance.profile_completion,
                "profileCompletion": instance.profile_completion,
                "is_active": instance.user.is_active if instance.user else True,
                "isActive": instance.user.is_active if instance.user else True,
                "timestamp": instance.updated_at.isoformat() if instance.updated_at else timezone.now().isoformat(),
            }
            logger.info("Broadcasting SSE event 'student.updated' for %s", instance.student_id)
            broadcaster.broadcast("student.updated", payload)
    except Exception as e:
        logger.exception("Failed to broadcast student profile SSE event: %s", e)


@receiver(post_save, sender=UserAccessibilitySettings)
def user_accessibility_saved_handler(sender, instance, **kwargs):
    try:
        user_id = str(instance.user.id) if instance.user else None
        user_email = instance.user.email if instance.user else None
        payload = {
            "user_id": user_id,
            "userId": user_id,
            "email": user_email,
            "font_scale": instance.font_scale,
            "fontScale": instance.font_scale,
            "dark_mode": instance.dark_mode,
            "darkMode": instance.dark_mode,
            "high_contrast": instance.high_contrast,
            "highContrast": instance.high_contrast,
            "highlight_links": instance.highlight_links,
            "highlightLinks": instance.highlight_links,
            "dyslexia_font": instance.dyslexia_font,
            "dyslexiaFont": instance.dyslexia_font,
            "reading_mode": instance.reading_mode,
            "readingMode": instance.reading_mode,
            "line_spacing": instance.line_spacing,
            "lineSpacing": instance.line_spacing,
            "large_controls": instance.large_controls,
            "largeControls": instance.large_controls,
            "reduced_motion": instance.reduced_motion,
            "reducedMotion": instance.reduced_motion,
            "focus_enhanced": instance.focus_enhanced,
            "focusEnhanced": instance.focus_enhanced,
            "written_notifications": instance.written_notifications,
            "writtenNotifications": instance.written_notifications,
            "caption_mode": instance.caption_mode,
            "captionMode": instance.caption_mode,
            "tts_rate": instance.tts_rate,
            "ttsRate": instance.tts_rate,
            "preferences": instance.preferences or {},
            "timestamp": instance.updated_at.isoformat() if instance.updated_at else timezone.now().isoformat(),
        }
        logger.info("Broadcasting SSE event 'accessibility.updated' for user %s", user_id)
        broadcaster.broadcast("accessibility.updated", payload)
    except Exception as e:
        logger.exception("Failed to broadcast accessibility SSE event: %s", e)


@receiver(post_save, sender=Department)
@receiver(post_delete, sender=Department)
def department_change_handler(sender, instance, **kwargs):
    try:
        payload = {
            "model": "department",
            "id": str(instance.id),
            "code": instance.code,
            "name": instance.name,
            "hod": getattr(instance, "hod", ""),
            "accessibilityCompliance": getattr(instance, "accessibility_compliance", 95),
            "timestamp": timezone.now().isoformat(),
        }
        logger.info("Broadcasting SSE event 'academics.updated' for department %s", instance.code)
        broadcaster.broadcast("academics.updated", payload)
    except Exception as e:
        logger.exception("Failed to broadcast department change SSE event: %s", e)


@receiver(post_save, sender=Course)
@receiver(post_delete, sender=Course)
def course_change_handler(sender, instance, **kwargs):
    try:
        payload = {
            "model": "course",
            "id": str(instance.id),
            "code": instance.code,
            "name": instance.name,
            "departmentId": str(instance.department_id) if instance.department_id else None,
            "totalSemesters": getattr(instance, "total_semesters", 8),
            "timestamp": timezone.now().isoformat(),
        }
        logger.info("Broadcasting SSE event 'academics.updated' for course %s", instance.code)
        broadcaster.broadcast("academics.updated", payload)
    except Exception as e:
        logger.exception("Failed to broadcast course change SSE event: %s", e)
