"""
Serializers for Chatbot app.
"""
from rest_framework import serializers
from .models import (
    ChatSession, ChatMessage, SavedResponse, FrequentQuestion,
    AIQuizAttempt, AIQuizQuestion, AILearningStats
)


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'role', 'content', 'image',
            'model_used', 'tokens_used', 'response_time_ms',
            'is_helpful', 'created_at'
        ]
        read_only_fields = ['id', 'model_used', 'tokens_used', 'response_time_ms', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for chat sessions."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'topic', 'topic_name', 'subject', 'subject_name',
            'is_active', 'message_count', 'was_helpful', 'rating',
            'last_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'message_count', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {
                'content': last.content[:100],
                'role': last.role,
                'created_at': last.created_at
            }
        return None


class ChatSessionDetailSerializer(ChatSessionSerializer):
    """Detailed serializer with messages."""
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta(ChatSessionSerializer.Meta):
        fields = ChatSessionSerializer.Meta.fields + ['messages']


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a message."""
    content = serializers.CharField()
    image = serializers.ImageField(required=False, allow_null=True)


class CreateSessionSerializer(serializers.Serializer):
    """Serializer for creating a new session."""
    topic_id = serializers.UUIDField(required=False, allow_null=True)
    subject_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=False, max_length=200)
    initial_message = serializers.CharField(required=False)


class SavedResponseSerializer(serializers.ModelSerializer):
    """Serializer for saved responses."""
    message_content = serializers.CharField(source='message.content', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    
    class Meta:
        model = SavedResponse
        fields = [
            'id', 'message', 'message_content', 'title',
            'topic', 'topic_name', 'personal_notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FrequentQuestionSerializer(serializers.ModelSerializer):
    """Serializer for FAQs."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = FrequentQuestion
        fields = [
            'id', 'question', 'answer', 'topic', 'topic_name',
            'subject', 'subject_name', 'views_count', 'helpful_count'
        ]


# AI Quiz Serializers

class AIQuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for individual AI quiz questions."""
    
    class Meta:
        model = AIQuizQuestion
        fields = [
            'id', 'question_index', 'question_text', 'options',
            'correct_option', 'user_answer', 'is_correct',
            'explanation', 'time_spent_seconds'
        ]
        read_only_fields = ['id']


class AIQuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for AI quiz attempts."""
    questions = AIQuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = AIQuizAttempt
        fields = [
            'id', 'session', 'quiz_topic', 'quiz_subject',
            'questions_data', 'total_questions', 'correct_answers',
            'wrong_answers', 'percentage', 'xp_earned',
            'time_taken_seconds', 'completed_at', 'created_at',
            'questions'
        ]
        read_only_fields = [
            'id', 'total_questions', 'correct_answers', 'wrong_answers',
            'percentage', 'xp_earned', 'created_at'
        ]


class AIQuizAttemptListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing AI quiz attempts."""
    
    class Meta:
        model = AIQuizAttempt
        fields = [
            'id', 'quiz_topic', 'quiz_subject', 'total_questions',
            'correct_answers', 'percentage', 'xp_earned',
            'time_taken_seconds', 'completed_at', 'created_at'
        ]


class SubmitAIQuizSerializer(serializers.Serializer):
    """Serializer for submitting an AI quiz attempt."""
    session_id = serializers.UUIDField(required=False, allow_null=True)
    quiz_topic = serializers.CharField(max_length=200, required=False, default='')
    quiz_subject = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    questions = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    time_taken_seconds = serializers.IntegerField(min_value=0, default=0)


class AILearningStatsSerializer(serializers.ModelSerializer):
    """Serializer for AI learning statistics."""
    weak_topics = serializers.SerializerMethodField()
    strong_topics = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = AILearningStats
        fields = [
            'total_quizzes_attempted', 'total_questions_attempted',
            'total_correct_answers', 'total_xp_earned', 'average_accuracy',
            'average_time_per_question', 'current_quiz_streak',
            'longest_quiz_streak', 'last_quiz_date', 'topic_performance',
            'perfect_quizzes', 'quizzes_above_80', 'weak_topics',
            'strong_topics', 'recent_activity'
        ]
    
    def get_weak_topics(self, obj):
        """Get topics with accuracy below 60%."""
        weak = []
        for topic, data in obj.topic_performance.items():
            if data['attempted'] > 0:
                accuracy = (data['correct'] / data['attempted']) * 100
                if accuracy < 60:
                    weak.append({
                        'topic': topic,
                        'accuracy': round(accuracy, 1),
                        'attempted': data['attempted'],
                        'quizzes': data.get('quizzes', 0)
                    })
        return sorted(weak, key=lambda x: x['accuracy'])[:5]
    
    def get_strong_topics(self, obj):
        """Get topics with accuracy above 80%."""
        strong = []
        for topic, data in obj.topic_performance.items():
            if data['attempted'] >= 5:  # Minimum attempts for strong
                accuracy = (data['correct'] / data['attempted']) * 100
                if accuracy >= 80:
                    strong.append({
                        'topic': topic,
                        'accuracy': round(accuracy, 1),
                        'attempted': data['attempted'],
                        'quizzes': data.get('quizzes', 0)
                    })
        return sorted(strong, key=lambda x: -x['accuracy'])[:5]
    
    def get_recent_activity(self, obj):
        """Get recent 7 days of AI quiz activity."""
        from django.utils import timezone
        from datetime import timedelta
        
        student = obj.student
        week_ago = timezone.now() - timedelta(days=7)
        
        recent = AIQuizAttempt.objects.filter(
            student=student,
            created_at__gte=week_ago
        ).order_by('-created_at')[:10]
        
        return AIQuizAttemptListSerializer(recent, many=True).data

