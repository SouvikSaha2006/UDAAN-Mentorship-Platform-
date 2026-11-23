from django.contrib import admin
from students.models import StudentProfile, UserAccessibilitySettings, StudentSequence


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        'student_id',
        'full_name',
        'get_email',
        'department',
        'course',
        'semester',
        'disability_type',
        'profile_completion',
        'created_at',
    )
    list_filter = ('department', 'course', 'semester', 'disability_type')
    search_fields = ('student_id', 'full_name', 'user__email', 'phone', 'roll_number')
    ordering = ('student_id',)

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Institutional Email'
    get_email.admin_order_field = 'user__email'


@admin.register(UserAccessibilitySettings)
class UserAccessibilitySettingsAdmin(admin.ModelAdmin):
    list_display = (
        'get_user_email',
        'font_scale',
        'dark_mode',
        'high_contrast',
        'dyslexia_font',
        'reading_mode',
        'caption_mode',
        'updated_at',
    )
    list_filter = ('dark_mode', 'high_contrast', 'dyslexia_font', 'reading_mode', 'caption_mode')
    search_fields = ('user__email',)

    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = 'User'
    get_user_email.admin_order_field = 'user__email'


@admin.register(StudentSequence)
class StudentSequenceAdmin(admin.ModelAdmin):
    list_display = ('year', 'dept_code', 'department', 'last_number', 'updated_at')
    list_filter = ('year', 'dept_code')
    search_fields = ('dept_code',)
    ordering = ('year', 'dept_code')
