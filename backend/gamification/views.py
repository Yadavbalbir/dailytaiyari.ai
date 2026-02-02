"""
Views for Gamification app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import Badge, StudentBadge, XPTransaction, LeaderboardEntry, Challenge, ChallengeParticipation
from .serializers import (
    BadgeSerializer, StudentBadgeSerializer, XPTransactionSerializer,
    LeaderboardEntrySerializer, ChallengeSerializer, ChallengeParticipationSerializer,
    LeaderboardResponseSerializer
)
from .services import GamificationService


class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for badges.
    """
    queryset = Badge.objects.filter(is_active=True)
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Hide secret badges that user hasn't earned
        student = self.request.user.profile
        earned_badge_ids = StudentBadge.objects.filter(
            student=student
        ).values_list('badge_id', flat=True)
        
        return Badge.objects.filter(is_active=True).exclude(
            is_secret=True
        ).union(
            Badge.objects.filter(id__in=earned_badge_ids, is_secret=True)
        )


class StudentBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for student's earned badges.
    """
    serializer_class = StudentBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentBadge.objects.filter(
            student=self.request.user.profile
        ).select_related('badge')

    @action(detail=False, methods=['post'])
    def check_new(self, request):
        """Check for newly earned badges (passive badges only - no context-dependent badges)."""
        student = request.user.profile
        # Pass empty context - only awards badges that don't require context
        new_badges = GamificationService.check_and_award_badges(student, context={})
        
        return Response({
            'new_badges': BadgeSerializer(new_badges, many=True).data,
            'count': len(new_badges)
        })


class XPTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for XP transaction history.
    """
    serializer_class = XPTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return XPTransaction.objects.filter(
            student=self.request.user.profile
        ).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get XP summary."""
        student = request.user.profile
        
        return Response({
            'total_xp': student.total_xp,
            'current_level': student.current_level,
            'xp_for_next_level': student.xp_for_next_level,
            'level_progress': round(
                (1 - student.xp_for_next_level / (student.current_level * 150)) * 100,
                2
            )
        })


class LeaderboardView(APIView):
    """
    Get leaderboard data.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        exam_id = request.query_params.get('exam_id')
        limit = int(request.query_params.get('limit', 50))
        
        exam = None
        if exam_id:
            from exams.models import Exam
            exam = Exam.objects.filter(id=exam_id).first()
        
        # Get leaderboard entries (now returns list of dicts)
        entries = GamificationService.get_leaderboard(period, exam, limit)
        
        # Get user's rank
        student = request.user.profile
        user_rank = GamificationService.get_student_rank(student, period, exam)
        
        # Total participants is the number of entries with activity
        total = len(entries)
        
        return Response({
            'entries': entries,  # Already in dict format
            'user_rank': user_rank,
            'total_participants': total
        })


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for challenges.
    """
    queryset = Challenge.objects.filter(status__in=['active', 'upcoming'])
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active challenges."""
        now = timezone.now()
        challenges = self.get_queryset().filter(
            start_time__lte=now,
            end_time__gte=now,
            status='active'
        )
        return Response(ChallengeSerializer(challenges, many=True).data)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a challenge."""
        challenge = self.get_object()
        student = request.user.profile
        
        if challenge.status != 'active':
            return Response(
                {'error': 'Challenge is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participation, created = ChallengeParticipation.objects.get_or_create(
            student=student,
            challenge=challenge
        )
        
        if created:
            challenge.participants += 1
            challenge.save(update_fields=['participants'])
        
        return Response(ChallengeParticipationSerializer(participation).data)


class ChallengeParticipationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user's challenge participations.
    """
    serializer_class = ChallengeParticipationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChallengeParticipation.objects.filter(
            student=self.request.user.profile
        ).select_related('challenge')

    @action(detail=True, methods=['post'])
    def claim_rewards(self, request, pk=None):
        """Claim rewards for completed challenge."""
        participation = self.get_object()
        student = request.user.profile
        
        if not participation.is_completed:
            return Response(
                {'error': 'Challenge not completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if participation.xp_claimed > 0:
            return Response(
                {'error': 'Rewards already claimed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Award XP
        challenge = participation.challenge
        GamificationService.award_xp(
            student,
            challenge.xp_reward,
            'challenge_win',
            f'Completed challenge: {challenge.title}',
            challenge.id
        )
        
        participation.xp_claimed = challenge.xp_reward
        
        # Award badge if applicable
        if challenge.badge_reward and not participation.badge_claimed:
            StudentBadge.objects.get_or_create(
                student=student,
                badge=challenge.badge_reward
            )
            participation.badge_claimed = True
        
        participation.save()
        
        return Response(ChallengeParticipationSerializer(participation).data)

