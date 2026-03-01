"""
URL patterns for Analytics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TopicMasteryViewSet, SubjectPerformanceViewSet,
    DailyActivityViewSet, StreakViewSet, WeeklyReportViewSet,
    DashboardView, StudyTimerView, StudyGoalView,
    TenantAdminStatsView, TenantSubjectStatsView, TenantLeaderboardView
)


router = DefaultRouter()
router.register(r'topic-mastery', TopicMasteryViewSet, basename='topic-mastery')
router.register(r'subject-performance', SubjectPerformanceViewSet, basename='subject-performance')
router.register(r'daily-activity', DailyActivityViewSet, basename='daily-activity')
router.register(r'streaks', StreakViewSet, basename='streak')
router.register(r'weekly-reports', WeeklyReportViewSet, basename='weekly-report')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('study-timer/', StudyTimerView.as_view(), name='study-timer'),
    path('study-goal/', StudyGoalView.as_view(), name='study-goal'),

    # Tenant Admin Endpoints
    path('tenant-admin-stats/', TenantAdminStatsView.as_view(), name='tenant-admin-stats'),
    path('tenant-subject-stats/', TenantSubjectStatsView.as_view(), name='tenant-subject-stats'),
    path('tenant-leaderboard/', TenantLeaderboardView.as_view(), name='tenant-leaderboard'),
]
