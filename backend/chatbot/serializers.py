"""
Serializers for Chatbot app.
"""
from rest_framework import serializers
from .models import ChatSession, ChatMessage, SavedResponse, FrequentQuestion


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

