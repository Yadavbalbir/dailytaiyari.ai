"""
URL patterns for Chatbot app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChatSessionViewSet, ChatMessageViewSet,
    SavedResponseViewSet, FrequentQuestionViewSet,
    AIQuizAttemptViewSet
)

router = DefaultRouter()
router.register(r'sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'messages', ChatMessageViewSet, basename='chat-message')
router.register(r'saved', SavedResponseViewSet, basename='saved-response')
router.register(r'faq', FrequentQuestionViewSet, basename='faq')
router.register(r'ai-quizzes', AIQuizAttemptViewSet, basename='ai-quiz')

urlpatterns = [
    path('', include(router.urls)),
]

