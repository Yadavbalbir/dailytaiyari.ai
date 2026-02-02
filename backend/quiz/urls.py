"""
URL patterns for Quiz app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuestionViewSet, QuizViewSet, MockTestViewSet,
    QuizAttemptViewSet, MockTestAttemptViewSet
)

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'mock-tests', MockTestViewSet, basename='mock-test')
router.register(r'attempts', QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'mock-attempts', MockTestAttemptViewSet, basename='mock-attempt')

urlpatterns = [
    path('', include(router.urls)),
]

