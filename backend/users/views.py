"""
Views for user authentication and profile management.
"""
from rest_framework import status, generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

from .models import StudentProfile, CourseEnrollment
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    StudentProfileSerializer,
    CourseEnrollmentSerializer,
    AdminEnrollmentRequestSerializer,
    OnboardingSerializer
)
from exams.models import Course
from core.permissions import IsTenantAdmin
from core.views import TenantAwareViewSet, TenantAwareReadOnlyViewSet


User = get_user_model()


class StudentRecordsPagination(PageNumberPagination):
    """
    Pagination for the tenant admin student-records view.

    Defaults to a high page size so admins can search/filter/export across
    the whole institution, while still allowing an explicit ?page_size=
    override (capped) for clients that want true pagination.
    """
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 5000


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
    """Complete user onboarding with course selection."""
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

        # Set primary course
        try:
            primary_course = Course.objects.get(id=data['primary_course_id'])
            profile.primary_course = primary_course
        except Course.DoesNotExist:
            return Response(
                {'error': 'Primary course not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.save()

        # Create course enrollments — primary course auto-approved at onboarding
        CourseEnrollment.objects.get_or_create(
            student=profile,
            course=primary_course,
            defaults={'is_active': True, 'status': 'approved', 'reviewed_at': timezone.now()}
        )

        for course_id in data.get('additional_course_ids', []):
            try:
                course = Course.objects.get(id=course_id)
                CourseEnrollment.objects.get_or_create(
                    student=profile,
                    course=course,
                    defaults={'is_active': True, 'status': 'pending'}
                )
            except Course.DoesNotExist:
                pass

        # Mark user as onboarded
        user.is_onboarded = True
        user.onboarded_at = timezone.now()
        user.save()

        return Response({
            'message': 'Onboarding completed successfully',
            'profile': StudentProfileSerializer(profile).data
        })


class CourseEnrollmentListView(generics.ListCreateAPIView):
    """List enrollment requests and request enrollment in an course (pending admin approval)."""
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseEnrollment.objects.filter(
            student=self.request.user.profile
        ).select_related('course').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        student = request.user.profile
        course = request.data.get('course')
        existing = CourseEnrollment.objects.filter(student=student, course_id=course).first()
        if existing:
            if existing.status == 'rejected':
                # Allow re-request after rejection: reopen as pending
                existing.status = 'pending'
                existing.is_active = True
                existing.rejection_reason = ''
                existing.reviewed_at = None
                existing.reviewed_by = None
                existing.save()
                return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
            return Response(
                {'course': ['You have already requested or are enrolled in this course.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.profile, status='pending', is_active=True)


class CourseEnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual course enrollment."""
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseEnrollment.objects.filter(student=self.request.user.profile)


class TenantStudentViewSet(TenantAwareViewSet):
    """
    Manage student profiles for the current tenant.
    Only accessible by tenant admins.
    """
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    pagination_class = StudentRecordsPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name', 'user__phone',
        'school', 'coaching', 'city', 'state',
    ]
    ordering_fields = [
        'user__first_name', 'user__email', 'total_xp', 'current_level',
        'total_questions_attempted', 'created_at',
    ]
    ordering = ['user__first_name']

    def get_queryset(self):
        tenant = self.request.tenant
        qs = StudentProfile.objects.filter(user__tenant=tenant).select_related('user', 'primary_course')

        # Optional explicit filters (used by the admin dashboard).
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(user__role=role)

        status_param = self.request.query_params.get('status')
        if status_param == 'active':
            qs = qs.filter(user__is_suspended=False)
        elif status_param == 'suspended':
            qs = qs.filter(user__is_suspended=True)

        primary_course = self.request.query_params.get('primary_course')
        if primary_course:
            qs = qs.filter(primary_course_id=primary_course)

        return qs

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
            
        user.is_suspended = not user.is_suspended
        user.save(update_fields=['is_suspended'])
        
        return Response({
            'status': 'status toggled',
            'is_active': user.is_active,
            'is_suspended': user.is_suspended
        })

class TenantEnrollmentRequestViewSet(TenantAwareViewSet):
    """
    Tenant admins review and approve/reject student course enrollment requests.
    """
    serializer_class = AdminEnrollmentRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        tenant = self.request.tenant
        qs = CourseEnrollment.objects.filter(
            student__user__tenant=tenant
        ).select_related('student__user', 'course', 'reviewed_by').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'approved'
        enrollment.is_active = True
        enrollment.rejection_reason = ''
        enrollment.reviewed_at = timezone.now()
        enrollment.reviewed_by = request.user
        enrollment.save()
        return Response(self.get_serializer(enrollment).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'rejected'
        enrollment.is_active = False
        enrollment.rejection_reason = request.data.get('reason', '')
        enrollment.reviewed_at = timezone.now()
        enrollment.reviewed_by = request.user
        enrollment.save()
        return Response(self.get_serializer(enrollment).data)
