from rest_framework import serializers
from students.models import StudentProfile, UserAccessibilitySettings
from accounts.models import UserRole


class AccessibilitySettingsSerializer(serializers.ModelSerializer):
    userId = serializers.UUIDField(source='user.id', read_only=True)
    fontScale = serializers.FloatField(source='font_scale', required=False)
    darkMode = serializers.BooleanField(source='dark_mode', required=False)
    highContrast = serializers.BooleanField(source='high_contrast', required=False)
    highlightLinks = serializers.BooleanField(source='highlight_links', required=False)
    dyslexiaFont = serializers.BooleanField(source='dyslexia_font', required=False)
    readingMode = serializers.BooleanField(source='reading_mode', required=False)
    lineSpacing = serializers.FloatField(source='line_spacing', required=False)
    largeControls = serializers.BooleanField(source='large_controls', required=False)
    reducedMotion = serializers.BooleanField(source='reduced_motion', required=False)
    focusEnhanced = serializers.BooleanField(source='focus_enhanced', required=False)
    writtenNotifications = serializers.BooleanField(source='written_notifications', required=False)
    captionMode = serializers.BooleanField(source='caption_mode', required=False)
    ttsRate = serializers.FloatField(source='tts_rate', required=False)

    class Meta:
        model = UserAccessibilitySettings
        fields = [
            'id',
            'userId',
            'fontScale',
            'darkMode',
            'highContrast',
            'highlightLinks',
            'dyslexiaFont',
            'readingMode',
            'lineSpacing',
            'largeControls',
            'reducedMotion',
            'focusEnhanced',
            'writtenNotifications',
            'captionMode',
            'ttsRate',
            'font_scale',
            'dark_mode',
            'high_contrast',
            'highlight_links',
            'dyslexia_font',
            'reading_mode',
            'line_spacing',
            'large_controls',
            'reduced_motion',
            'focus_enhanced',
            'written_notifications',
            'caption_mode',
            'tts_rate',
            'created_at',
            'updated_at',
        ]


class StudentProfileSerializer(serializers.ModelSerializer):
    userId = serializers.UUIDField(source='user.id', read_only=True)
    studentId = serializers.CharField(source='student_id', read_only=True)
    fullName = serializers.CharField(source='full_name')
    dateOfBirth = serializers.SerializerMethodField()
    guardianName = serializers.SerializerMethodField()
    guardianPhone = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    accommodationNeeds = serializers.SerializerMethodField()
    udidNumber = serializers.SerializerMethodField()

    avatarUrl = serializers.CharField(source='avatar_url', allow_null=True, required=False)
    avatarColor = serializers.CharField(source='avatar_color', required=False)
    careerGoal = serializers.CharField(source='career_goal', allow_null=True, required=False)

    departmentId = serializers.UUIDField(source='department.id', read_only=True, allow_null=True)
    departmentName = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    courseId = serializers.UUIDField(source='course.id', read_only=True, allow_null=True)
    courseName = serializers.CharField(source='course.name', read_only=True, allow_null=True)

    batchYear = serializers.IntegerField(source='batch_year', required=False)
    rollNumber = serializers.CharField(source='roll_number', allow_null=True, required=False)
    profileCompletion = serializers.IntegerField(source='profile_completion', read_only=True)

    disabilityType = serializers.CharField(source='disability_type', allow_null=True, required=False)
    disabilityPercentage = serializers.FloatField(source='disability_percentage', allow_null=True, required=False)
    assistiveDevices = serializers.ListField(source='assistive_devices', required=False)
    preferredCommunication = serializers.CharField(source='preferred_communication', required=False)

    email = serializers.EmailField(source='user.email', read_only=True)
    isActive = serializers.BooleanField(source='user.is_active', read_only=True)
    accessibilitySettings = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id',
            'userId',
            'studentId',
            'fullName',
            'phone',
            'dateOfBirth',
            'gender',
            'address',
            'guardianName',
            'guardianPhone',
            'bio',
            'avatarUrl',
            'avatarColor',
            'departmentId',
            'departmentName',
            'courseId',
            'courseName',
            'semester',
            'batchYear',
            'rollNumber',
            'cgpa',
            'profileCompletion',
            'careerGoal',
            'disabilityType',
            'disabilityPercentage',
            'assistiveDevices',
            'preferredCommunication',
            'accommodationNeeds',
            'udidNumber',
            'email',
            'isActive',
            'accessibilitySettings',
            'created_at',
            'updated_at',
        ]

    def is_authorized(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if request.user.id == obj.user.id:
            return True
        if request.user.role in [UserRole.ADMIN, UserRole.SUPPORT]:
            return True
        return False

    def get_phone(self, obj):
        return obj.phone if self.is_authorized(obj) else None

    def get_dateOfBirth(self, obj):
        return obj.date_of_birth if self.is_authorized(obj) else None

    def get_address(self, obj):
        return obj.address if self.is_authorized(obj) else None

    def get_guardianName(self, obj):
        return obj.guardian_name if self.is_authorized(obj) else None

    def get_guardianPhone(self, obj):
        return obj.guardian_phone if self.is_authorized(obj) else None

    def get_accommodationNeeds(self, obj):
        return obj.accommodation_needs if self.is_authorized(obj) else None

    def get_udidNumber(self, obj):
        return obj.udid_number if self.is_authorized(obj) else None

    def get_accessibilitySettings(self, obj):
        if hasattr(obj.user, 'accessibility_settings'):
            return AccessibilitySettingsSerializer(obj.user.accessibility_settings).data
        return None
