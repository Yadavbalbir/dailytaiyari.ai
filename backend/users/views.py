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
from core.permissions import IsTenantAdmin
from core.views import TenantAwareReadOnlyViewSet


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


class TenantStudentViewSet(TenantAwareViewSet):
    """
    Manage student profiles for the current tenant.
    Only accessible by tenant admins.
    """
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get_queryset(self):
        return super().get_queryset().select_related('user', 'primary_exam')

    @action(detail=True, methods=['post'])
    def reset_progress(self, request, pk=None):
        """Reset all progress for a student."""
        profile = self.get_object()
        
        with transaction.atomic():
            # Reset profile counters
            profile.total_xp = 0
            profile.current_level = 1
            profile.total_questions_attempted = 0
            profile.total_correct_answers = 0
            profile.total_study_time_minutes = 0
            profile.save()
            
            # Delete related analytics data
            profile.daily_activities.all().delete()
            profile.topic_masteries.all().delete()
            profile.subject_performances.all().delete()
            profile.streaks.all().delete()
            profile.weekly_reports.all().delete()
            profile.study_sessions.all().delete()
            
            # Note: Quiz attempts and Mock attempts are NOT deleted by default 
            # to preserve audit logs, but their derived analytics are cleared.
            
        return Response({'status': 'progress reset successful'})

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle user active status."""
        profile = self.get_object()
        user = profile.user
        
        # Prevent admins from deactivating themselves via this endpoint 
        # (though they could via other means, this is a safety check)
        if user == request.user:
            return Response(
                {'error': 'You cannot deactivate your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        
        return Response({
            'status': 'status toggled',
            'is_active': user.is_active
        })
