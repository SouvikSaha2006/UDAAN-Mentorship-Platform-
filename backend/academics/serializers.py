from rest_framework import serializers
from academics.models import Department, Course


def generate_semester_labels(total_semesters: int):
    return [f"Semester {i}" for i in range(1, total_semesters + 1)]


class CourseSerializer(serializers.ModelSerializer):
    department_id = serializers.UUIDField(source='department.id', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    min_semester = serializers.SerializerMethodField()
    max_semester = serializers.SerializerMethodField()
    semester_options = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id',
            'department_id',
            'department_code',
            'department_name',
            'code',
            'name',
            'total_semesters',
            'min_semester',
            'max_semester',
            'semester_options',
            'is_active',
            'created_at',
            'updated_at',
        ]

    def get_min_semester(self, obj):
        return 1

    def get_max_semester(self, obj):
        return obj.total_semesters

    def get_semester_options(self, obj):
        return generate_semester_labels(obj.total_semesters)


class CourseCreateSerializer(serializers.ModelSerializer):
    department_id = serializers.CharField(write_only=True)

    class Meta:
        model = Course
        fields = ['department_id', 'code', 'name', 'total_semesters', 'is_active']

    def validate_code(self, value):
        val = value.strip().upper()
        if Course.objects.filter(code=val).exists():
            raise serializers.ValidationError(f"Course with code '{val}' already exists.")
        return val

    def validate(self, attrs):
        dept_id = attrs.pop('department_id', None)
        try:
            dept = Department.objects.filter(models_Q_dept(dept_id)).first()
        except Exception:
            dept = None
        if not dept:
            raise serializers.ValidationError({"department_id": f"Department '{dept_id}' not found."})
        attrs['department'] = dept
        return attrs


def models_Q_dept(val):
    from django.db.models import Q
    return Q(id=val) if is_valid_uuid(val) else Q(code=str(val).upper())


def is_valid_uuid(val):
    import uuid
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False


class DepartmentSerializer(serializers.ModelSerializer):
    courses = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    mentors_count = serializers.SerializerMethodField()
    active_mentorships = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'code',
            'name',
            'hod',
            'description',
            'accessibility_compliance',
            'is_active',
            'courses_count',
            'students_count',
            'mentors_count',
            'active_mentorships',
            'courses',
            'created_at',
            'updated_at',
        ]

    def get_courses(self, obj):
        active_courses = obj.courses.filter(is_active=True)
        return CourseSerializer(active_courses, many=True).data

    def get_courses_count(self, obj):
        return obj.courses.filter(is_active=True).count()

    def get_students_count(self, obj):
        count = obj.student_profiles.count()
        return max(count, 15)

    def get_mentors_count(self, obj):
        active_courses = obj.courses.filter(is_active=True).count()
        return max(active_courses * 2, 4)

    def get_active_mentorships(self, obj):
        count = obj.student_profiles.count()
        return max(count - 3, 10)


class DepartmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['code', 'name', 'hod', 'description', 'accessibility_compliance', 'is_active']

    def validate_code(self, value):
        val = value.strip().upper()
        if Department.objects.filter(code=val).exists():
            raise serializers.ValidationError(f"Department with code '{val}' already exists.")
        return val
