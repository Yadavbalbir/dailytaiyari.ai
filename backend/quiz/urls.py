"""
URL patterns for Quiz app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuestionViewSet, QuizViewSet, MockTestViewSet,
    PreviousYearPaperViewSet,
    QuizAttemptViewSet, MockTestAttemptViewSet, QuestionReportViewSet
)
from .admin_views import (
    AdminQuizViewSet, AdminQuestionViewSet,
    AdminMockTestViewSet, AdminMockTestItemViewSet,
)

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'mock-tests', MockTestViewSet, basename='mock-test')
router.register(r'pyp', PreviousYearPaperViewSet, basename='pyp')
router.register(r'attempts', QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'mock-attempts', MockTestAttemptViewSet, basename='mock-attempt')
router.register(r'reports', QuestionReportViewSet, basename='question-report')

admin_router = DefaultRouter()
admin_router.register(r'quizzes', AdminQuizViewSet, basename='admin-quiz')
admin_router.register(r'questions', AdminQuestionViewSet, basename='admin-question')
admin_router.register(r'mock-tests', AdminMockTestViewSet, basename='admin-mock-test')
admin_router.register(r'mock-items', AdminMockTestItemViewSet, basename='admin-mock-item')

urlpatterns = [
    path('admin/', include(admin_router.urls)),
    path('', include(router.urls)),
]

