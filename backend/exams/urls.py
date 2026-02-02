"""
URL patterns for Exams app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, SubjectViewSet, TopicViewSet, ChapterViewSet

router = DefaultRouter()
router.register(r'', ExamViewSet, basename='exam')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'chapters', ChapterViewSet, basename='chapter')

urlpatterns = [
    path('', include(router.urls)),
]

