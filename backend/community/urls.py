"""
Community URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'posts', views.PostViewSet, basename='post')
router.register(r'comments', views.CommentViewSet, basename='comment')
router.register(r'quiz-attempts', views.QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'stats', views.CommunityStatsViewSet, basename='community-stats')
router.register(r'leaderboard', views.CommunityLeaderboardViewSet, basename='community-leaderboard')

urlpatterns = [
    path('', include(router.urls)),
]
