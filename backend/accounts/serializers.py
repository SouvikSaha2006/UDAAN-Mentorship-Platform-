from rest_framework import serializers
from accounts.models import User, UserRole, PasswordResetToken
from students.serializers import StudentProfileSerializer, AccessibilitySettingsSerializer


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.STUDENT)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'role']

    def validate_email(self, value):
        val = value.strip().lower()
        if User.objects.filter(email=val).exists():
            raise serializers.ValidationError("An account with this institutional email already exists.")
        return val


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, allow_null=True)


class UserResponseSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    studentId = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    rollNumber = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    avatarColor = serializers.SerializerMethodField()
    profileCompletion = serializers.SerializerMethodField()
    cgpa = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    careerGoal = serializers.SerializerMethodField()
    accessibilityNeeds = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'role',
            'is_active',
            'name',
            'fullName',
            'studentId',
            'department',
            'course',
            'semester',
            'rollNumber',
            'phone',
            'avatarColor',
            'profileCompletion',
            'cgpa',
            'bio',
            'careerGoal',
            'accessibilityNeeds',
            'date_joined',
            'created_at',
            'updated_at',
        ]

    def get_name(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.full_name:
            return obj.student_profile.full_name
        return obj.email.split('@')[0].capitalize()

    def get_fullName(self, obj):
        return self.get_name(obj)

    def get_studentId(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.student_id
        return None

    def get_department(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.department:
            return obj.student_profile.department.name
        return None

    def get_course(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.course:
            return obj.student_profile.course.name
        return None

    def get_semester(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.semester:
            return f"{obj.student_profile.semester}th Semester"
        return None

    def get_rollNumber(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.roll_number or obj.student_profile.student_id
        return None

    def get_phone(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.phone
        return None

    def get_avatarColor(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.avatar_color:
            return obj.student_profile.avatar_color
        return "from-royal-600 to-violet-600"

    def get_profileCompletion(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.profile_completion
        return 75

    def get_cgpa(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.cgpa
        return 8.5

    def get_bio(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.bio
        return ""

    def get_careerGoal(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.career_goal
        return ""

    def get_accessibilityNeeds(self, obj):
        if hasattr(obj, 'student_profile'):
            needs = list(obj.student_profile.assistive_devices or [])
            if obj.student_profile.accommodation_needs and obj.student_profile.accommodation_needs not in needs:
                needs.append(obj.student_profile.accommodation_needs)
            return needs
        return []
