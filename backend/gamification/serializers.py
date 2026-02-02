"""
Serializers for Gamification app.
"""
from rest_framework import serializers
from .models import Badge, StudentBadge, XPTransaction, LeaderboardEntry, Challenge, ChallengeParticipation


class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for badges."""
    
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'description', 'category', 'rarity',
            'icon', 'color', 'image', 'requirements', 'xp_reward',
            'is_secret'
        ]


class StudentBadgeSerializer(serializers.ModelSerializer):
    """Serializer for student badges."""
    badge = BadgeSerializer(read_only=True)
    
    class Meta:
        model = StudentBadge
        fields = ['id', 'badge', 'earned_at', 'progress', 'is_complete']


class XPTransactionSerializer(serializers.ModelSerializer):
    """Serializer for XP transactions."""
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )
    
    class Meta:
        model = XPTransaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display',
            'xp_amount', 'description', 'balance_after', 'created_at'
        ]


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Serializer for leaderboard entries."""
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_avatar = serializers.ImageField(source='student.user.avatar', read_only=True)
    student_level = serializers.IntegerField(source='student.current_level', read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'student_name', 'student_avatar', 'student_level',
            'rank', 'previous_rank', 'rank_change',
            'xp_earned', 'questions_answered', 'accuracy', 'study_time_minutes'
        ]


class ChallengeSerializer(serializers.ModelSerializer):
    """Serializer for challenges."""
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    badge_reward_data = BadgeSerializer(source='badge_reward', read_only=True)
    
    class Meta:
        model = Challenge
        fields = [
            'id', 'title', 'description', 'challenge_type', 'status',
            'exam', 'exam_name', 'start_time', 'end_time', 'goal',
            'xp_reward', 'badge_reward', 'badge_reward_data',
            'participants', 'completers'
        ]


class ChallengeParticipationSerializer(serializers.ModelSerializer):
    """Serializer for challenge participation."""
    challenge = ChallengeSerializer(read_only=True)
    
    class Meta:
        model = ChallengeParticipation
        fields = [
            'id', 'challenge', 'progress', 'is_completed',
            'completed_at', 'xp_claimed', 'badge_claimed', 'final_rank'
        ]


class LeaderboardResponseSerializer(serializers.Serializer):
    """Serializer for leaderboard response."""
    entries = LeaderboardEntrySerializer(many=True)
    user_rank = serializers.DictField(allow_null=True)
    total_participants = serializers.IntegerField()

