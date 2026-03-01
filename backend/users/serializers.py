"""
Serializers for User authentication and profile management.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import StudentProfile, ExamEnrollment

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data."""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['name'] = user.full_name
        token['is_onboarded'] = user.is_onboarded
        return token

    def validate(self, attrs):
        # The standard validate calls authenticate() which will fail 
        # because the email is no longer globally unique for the default backend.
        # We handle tenant-scoping here.
        email = attrs.get('email')
        password = attrs.get('password')
        tenant = getattr(self.context['request'], 'tenant', None)

        if not tenant:
            raise serializers.ValidationError('Tenant context is missing.')

        try:
            user = User.objects.get(email=email, tenant=tenant)
        except User.DoesNotExist:
            user = None

        if user and user.check_password(password):
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            self.user = user
            refresh = self.get_token(user)
            data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }
            return data
        
        raise serializers.ValidationError('No active account found with the given credentials')



class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        tenant = validated_data.pop('tenant')
        user = User.objects.create_user(password=password, tenant=tenant, **validated_data)
        return user



class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data."""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'role',
            'phone', 'avatar', 'is_onboarded', 'preferred_language',
            'notification_enabled', 'dark_mode', 'created_at', 'last_active'
        ]

        read_only_fields = ['id', 'email', 'created_at', 'last_active']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for student profile."""
    user = UserSerializer(required=False)

    overall_accuracy = serializers.ReadOnlyField()
    xp_for_next_level = serializers.ReadOnlyField()
    primary_exam_name = serializers.CharField(source='primary_exam.name', read_only=True)
    
    # Handle nullable fields that may receive empty strings from frontend
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    target_year = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 
            # Personal info
            'date_of_birth', 'bio', 'instagram_handle', 'parent_phone',
            # Academic info
            'grade', 'school', 'coaching', 'board', 'medium', 'target_year',
            # Location
            'city', 'state',
            # Exam info
            'primary_exam', 'primary_exam_name', 
            # Study preferences
            'daily_study_goal_minutes', 'preferred_study_time', 
            # Stats
            'total_xp', 'current_level', 
            'total_questions_attempted', 'total_correct_answers',
            'total_study_time_minutes', 'overall_accuracy', 'xp_for_next_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_xp', 'current_level', 
            'total_questions_attempted', 'total_correct_answers',
            'total_study_time_minutes', 'created_at', 'updated_at'
        ]

    
    def to_internal_value(self, data):
        # Convert empty strings to None for nullable fields
        if 'date_of_birth' in data and data['date_of_birth'] == '':
            data['date_of_birth'] = None
        if 'target_year' in data and data['target_year'] == '':
            data['target_year'] = None
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserSerializer(instance.user, data=user_data, partial=True)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()
        
        return super().update(instance, validated_data)




class ExamEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for exam enrollment."""
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    exam_code = serializers.CharField(source='exam.code', read_only=True)

    class Meta:
        model = ExamEnrollment
        fields = [
            'id', 'exam', 'exam_name', 'exam_code', 'is_active',
            'enrolled_at', 'exam_xp', 'exam_rank', 'target_score', 'target_rank'
        ]
        read_only_fields = ['id', 'enrolled_at', 'exam_xp', 'exam_rank']


class OnboardingSerializer(serializers.Serializer):
    """Serializer for student onboarding — IIT JEE & NEET only."""
    primary_exam_id = serializers.UUIDField()
    additional_exam_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=[]
    )
    target_year = serializers.IntegerField(required=False)
    daily_study_goal_minutes = serializers.IntegerField(default=60)
    preferred_study_time = serializers.ChoiceField(
        choices=['morning', 'afternoon', 'evening', 'night'],
        default='evening'
    )

