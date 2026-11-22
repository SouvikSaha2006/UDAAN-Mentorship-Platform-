import uuid
from django.db import models
from django.utils import timezone


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    hod = models.CharField(max_length=150, blank=True, default='Department Coordinator')
    description = models.TextField(blank=True, default='')
    accessibility_compliance = models.IntegerField(default=95)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    total_semesters = models.PositiveIntegerField(default=8)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} ({self.name})"
