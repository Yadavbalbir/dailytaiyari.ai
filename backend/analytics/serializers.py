"""
Serializers for Analytics app.
"""
from rest_framework import serializers
from .models import TopicMastery, SubjectPerformance, DailyActivity, Streak, WeeklyReport


class TopicMasterySerializer(serializers.ModelSerializer):
    """Serializer for topic mastery."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='topic.subject.name', read_only=True)
    mastery_level_display = serializers.CharField(source='get_mastery_level_display', read_only=True)
    
    class Meta:
        model = TopicMastery
        fields = [
            'id', 'topic', 'topic_name', 'subject_name',
            'mastery_level', 'mastery_level_display', 'mastery_score',
            'total_questions_attempted', 'total_correct_answers',
            'accuracy_percentage', 'average_time_per_question',
            'last_attempted', 'streak_correct', 'needs_revision'
        ]


class SubjectPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for subject performance."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    
    class Meta:
        model = SubjectPerformance
        fields = [
            'id', 'subject', 'subject_name', 'exam', 'exam_name',
            'total_questions', 'correct_answers', 'accuracy',
            'topics_attempted', 'topics_mastered', 'overall_progress',
            'total_study_minutes', 'average_speed'
        ]


class DailyActivitySerializer(serializers.ModelSerializer):
    """Serializer for daily activity."""
    accuracy = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyActivity
        fields = [
            'id', 'date', 'study_time_minutes', 'questions_attempted',
            'questions_correct', 'accuracy', 'notes_read', 'videos_watched',
            'quizzes_completed', 'mock_tests_completed', 'xp_earned',
            'daily_goal_met'
        ]
    
    def get_accuracy(self, obj):
        if obj.questions_attempted == 0:
            return 0
        return round((obj.questions_correct / obj.questions_attempted) * 100, 2)


class StreakSerializer(serializers.ModelSerializer):
    """Serializer for streaks."""
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    
    class Meta:
        model = Streak
        fields = [
            'id', 'exam', 'exam_name', 'current_streak',
            'last_activity_date', 'longest_streak',
            'longest_streak_start', 'longest_streak_end',
            'total_active_days'
        ]


class WeeklyReportSerializer(serializers.ModelSerializer):
    """Serializer for weekly reports."""
    
    class Meta:
        model = WeeklyReport
        fields = [
            'id', 'week_start', 'week_end', 'total_study_minutes',
            'questions_attempted', 'questions_correct', 'accuracy',
            'days_active', 'goals_met', 'topics_covered', 'topics_improved',
            'weak_topics', 'xp_earned', 'rank_change', 'vs_last_week'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    today = serializers.DictField()
    weekly = serializers.DictField()
    mastery = serializers.DictField()
    profile = serializers.DictField()


class PerformanceChartSerializer(serializers.Serializer):
    """Serializer for performance chart data."""
    labels = serializers.ListField(child=serializers.CharField())
    accuracy = serializers.ListField(child=serializers.FloatField())
    questions = serializers.ListField(child=serializers.IntegerField())
    study_time = serializers.ListField(child=serializers.IntegerField())

