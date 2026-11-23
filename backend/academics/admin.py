from django.contrib import admin
from academics.models import Department, Course


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'hod', 'accessibility_compliance', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('code', 'name', 'hod')
    ordering = ('code',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'department', 'total_semesters', 'is_active', 'created_at')
    list_filter = ('department', 'is_active')
    search_fields = ('code', 'name')
    ordering = ('code',)
