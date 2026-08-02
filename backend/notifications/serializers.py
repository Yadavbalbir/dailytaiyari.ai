from rest_framework import serializers

from exams.models import Course

from .models import Announcement, Notification, TenantEmailTemplate


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'body', 'link', 'data',
            'is_read', 'read_at', 'created_at',
        ]
        read_only_fields = fields


class AnnouncementSerializer(serializers.ModelSerializer):
    course_ids = serializers.SerializerMethodField(read_only=True)
    course_names = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'body', 'audience', 'course_ids', 'course_names',
            'send_email', 'send_in_app', 'status', 'recipients_count',
            'sent_at', 'created_at', 'created_by_name',
        ]
        read_only_fields = [
            'id', 'status', 'recipients_count', 'sent_at', 'created_at',
            'course_ids', 'course_names', 'created_by_name',
        ]

    def get_course_ids(self, obj):
        return [str(c.id) for c in obj.courses.all()]

    def get_course_names(self, obj):
        return [c.name for c in obj.courses.all()]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return None


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    courses = serializers.ListField(
        child=serializers.UUIDField(), required=False, allow_empty=True, write_only=True,
    )

    class Meta:
        model = Announcement
        fields = ['title', 'body', 'audience', 'courses', 'send_email', 'send_in_app']

    def validate(self, attrs):
        if not attrs.get('send_email') and not attrs.get('send_in_app'):
            raise serializers.ValidationError(
                'Select at least one delivery channel (email or in-app notification).'
            )
        audience = attrs.get('audience', Announcement.AUDIENCE_ALL)
        course_ids = attrs.get('courses') or []
        if audience == Announcement.AUDIENCE_COURSES and not course_ids:
            raise serializers.ValidationError(
                'Select at least one course for a course-targeted announcement.'
            )
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        tenant = request.tenant
        course_ids = validated_data.pop('courses', []) or []

        announcement = Announcement.objects.create(
            tenant=tenant,
            created_by=request.user,
            title=validated_data['title'],
            body=validated_data['body'],
            audience=validated_data.get('audience', Announcement.AUDIENCE_ALL),
            send_email=validated_data.get('send_email', True),
            send_in_app=validated_data.get('send_in_app', True),
        )
        if announcement.audience == Announcement.AUDIENCE_COURSES and course_ids:
            valid_courses = Course.objects.filter(id__in=course_ids, tenant=tenant)
            announcement.courses.set(valid_courses)
        return announcement


class EmailTemplateUpdateSerializer(serializers.Serializer):
    """Validates an admin's override of an email template's parts.

    All three parts are optional; a blank part means "fall back to the packaged
    default" for that part.
    """
    subject = serializers.CharField(
        max_length=500, required=False, allow_blank=True, trim_whitespace=False,
    )
    heading = serializers.CharField(
        max_length=255, required=False, allow_blank=True, trim_whitespace=False,
    )
    body = serializers.CharField(
        required=False, allow_blank=True, trim_whitespace=False,
    )
