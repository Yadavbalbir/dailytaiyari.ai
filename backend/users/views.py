"""
Views for user authentication and profile management.
"""
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import StudentProfile, ExamEnrollment
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    StudentProfileSerializer,
    ExamEnrollmentSerializer,
    OnboardingSerializer
)
from exams.models import Exam

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with extra user data."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        if not hasattr(request, 'tenant') or not request.tenant:
            return Response(
                {'error': 'A valid Tenant is required to register.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(tenant=request.tenant)
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile."""
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class UserView(generics.RetrieveUpdateAPIView):
    """Get and update user data."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class OnboardingView(APIView):
    """Complete user onboarding with exam selection."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        profile = user.profile

        # Update profile
        profile.target_year = data.get('target_year')
        profile.daily_study_goal_minutes = data['daily_study_goal_minutes']
        profile.preferred_study_time = data['preferred_study_time']

        # Set primary exam
        try:
            primary_exam = Exam.objects.get(id=data['primary_exam_id'])
            profile.primary_exam = primary_exam
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Primary exam not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.save()

        # Create exam enrollments
        ExamEnrollment.objects.get_or_create(
            student=profile,
            exam=primary_exam,
            defaults={'is_active': True}
        )

        for exam_id in data.get('additional_exam_ids', []):
            try:
                exam = Exam.objects.get(id=exam_id)
                ExamEnrollment.objects.get_or_create(
                    student=profile,
                    exam=exam,
                    defaults={'is_active': True}
                )
            except Exam.DoesNotExist:
                pass

        # Mark user as onboarded
        user.is_onboarded = True
        user.onboarded_at = timezone.now()
        user.save()

        return Response({
            'message': 'Onboarding completed successfully',
            'profile': StudentProfileSerializer(profile).data
        })


class ExamEnrollmentListView(generics.ListCreateAPIView):
    """List and create exam enrollments for current user."""
    serializer_class = ExamEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExamEnrollment.objects.filter(student=self.request.user.profile)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.profile)


class ExamEnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual exam enrollment."""
    serializer_class = ExamEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExamEnrollment.objects.filter(student=self.request.user.profile)

