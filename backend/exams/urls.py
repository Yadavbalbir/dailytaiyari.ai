"""
URL patterns for Exams app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamViewSet, SubjectViewSet, TopicViewSet, ChapterViewSet,
    StudySubjectsView, StudyChaptersView, StudyChapterDetailView,
    StudyLeaderboardView, TenantContentExplorerView
)

router = DefaultRouter()
router.register(r'', ExamViewSet, basename='exam')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'chapters', ChapterViewSet, basename='chapter')

urlpatterns = [
    path('study/subjects/', StudySubjectsView.as_view(), name='study-subjects'),
    path('study/chapters/<uuid:subject_id>/', StudyChaptersView.as_view(), name='study-chapters'),
    path('study/chapter/<uuid:chapter_id>/', StudyChapterDetailView.as_view(), name='study-chapter-detail'),
    path('study/leaderboard/', StudyLeaderboardView.as_view(), name='study-leaderboard'),
    path('explorer/', TenantContentExplorerView.as_view(), name='tenant-content-explorer'),
    path('', include(router.urls)),
]

