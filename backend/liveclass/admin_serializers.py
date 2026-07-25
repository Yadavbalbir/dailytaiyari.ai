"""Admin/instructor authoring serializers for live classes."""
from rest_framework import serializers

from .models import LiveClass


class AdminLiveClassSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default=None)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    scheduled_end = serializers.DateTimeField(read_only=True)
    live_status = serializers.CharField(read_only=True)

    class Meta:
        model = LiveClass
        fields = [
            'id', 'course', 'subject', 'subject_name', 'topic', 'topic_name',
            'title', 'description', 'provider', 'provider_display', 'meeting_url',
            'scheduled_start', 'duration_minutes', 'scheduled_end', 'host_name',
            'status', 'live_status', 'order', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_provider(self, value):
        if value not in LiveClass.ENABLED_PROVIDERS:
            label = dict(LiveClass.PROVIDER_CHOICES).get(value, value)
            raise serializers.ValidationError(
                f'{label} is coming soon and cannot be used yet. Please use Google Meet.'
            )
        return value

    def validate(self, attrs):
        # Resolve provider/url whether creating or partially updating.
        provider = attrs.get('provider', getattr(self.instance, 'provider', LiveClass.PROVIDER_GMEET))
        meeting_url = attrs.get('meeting_url', getattr(self.instance, 'meeting_url', ''))
        if provider == LiveClass.PROVIDER_GMEET and not (meeting_url or '').strip():
            raise serializers.ValidationError(
                {'meeting_url': 'A Google Meet link is required for a Google Meet live class.'}
            )
        return attrs
