"""
URL patterns for user authentication and profile.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    ProfileView,
    UserView,
    OnboardingView,
    ExamEnrollmentListView,
    ExamEnrollmentDetailView,
)

urlpatterns = [
    # Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    
    # User & Profile
    path('user/', UserView.as_view(), name='user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('onboarding/', OnboardingView.as_view(), name='onboarding'),
    
    # Exam Enrollments
    path('enrollments/', ExamEnrollmentListView.as_view(), name='enrollment-list'),
    path('enrollments/<uuid:pk>/', ExamEnrollmentDetailView.as_view(), name='enrollment-detail'),
]

