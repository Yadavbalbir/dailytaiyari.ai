"""
URL patterns for Gamification app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BadgeViewSet, StudentBadgeViewSet, XPTransactionViewSet,
    LeaderboardView, ChallengeViewSet, ChallengeParticipationViewSet
)

router = DefaultRouter()
router.register(r'badges', BadgeViewSet, basename='badge')
router.register(r'my-badges', StudentBadgeViewSet, basename='student-badge')
router.register(r'xp-history', XPTransactionViewSet, basename='xp-transaction')
router.register(r'challenges', ChallengeViewSet, basename='challenge')
router.register(r'my-challenges', ChallengeParticipationViewSet, basename='challenge-participation')

urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('', include(router.urls)),
]

