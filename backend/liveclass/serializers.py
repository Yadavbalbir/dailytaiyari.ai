"""Student-facing serializers for live classes."""
from rest_framework import serializers

from .models import LiveClass


class LiveClassSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    scheduled_end = serializers.DateTimeField(read_only=True)
    live_status = serializers.CharField(read_only=True)

    class Meta:
        model = LiveClass
        fields = [
            'id', 'title', 'description', 'provider', 'provider_display',
            'meeting_url', 'scheduled_start', 'duration_minutes', 'scheduled_end',
            'host_name', 'status', 'live_status', 'order', 'topic', 'topic_name',
        ]
