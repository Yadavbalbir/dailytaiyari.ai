"""
URL patterns for Analytics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardView,
    TopicMasteryViewSet, SubjectPerformanceViewSet,
    DailyActivityViewSet, StreakViewSet, WeeklyReportViewSet,
    StudyTimerView, StudyGoalView,
    TenantAdminStatsView
)


router = DefaultRouter()
router.register(r'topic-mastery', TopicMasteryViewSet, basename='topic-mastery')
router.register(r'subject-performance', SubjectPerformanceViewSet, basename='subject-performance')
router.register(r'daily-activity', DailyActivityViewSet, basename='daily-activity')
router.register(r'streaks', StreakViewSet, basename='streak')
router.register(r'weekly-reports', WeeklyReportViewSet, basename='weekly-report')

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('tenant-admin-stats/', TenantAdminStatsView.as_view(), name='tenant-admin-stats'),
    path('study-timer/', StudyTimerView.as_view(), name='study-timer'),

    path('study-goal/', StudyGoalView.as_view(), name='study-goal'),
    path('', include(router.urls)),
]

