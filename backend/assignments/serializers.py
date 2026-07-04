"""Student-facing serializers for assignments."""
from rest_framework import serializers

from .models import Assignment, AssignmentSubmission


class MySubmissionSerializer(serializers.ModelSerializer):
    has_file = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'submission_text', 'has_file', 'submitted_at',
            'status', 'marks', 'feedback', 'graded_at',
        ]

    def get_has_file(self, obj):
        return bool(obj.submission_file)


class AssignmentSerializer(serializers.ModelSerializer):
    """List item for a student, including their own submission summary."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    has_attachment = serializers.SerializerMethodField()
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'topic', 'topic_name', 'submission_type',
            'is_timed', 'due_at', 'max_marks', 'status', 'order',
            'is_open', 'has_attachment', 'my_submission', 'created_at',
        ]

    def get_has_attachment(self, obj):
        return bool(obj.attachment)

    def get_my_submission(self, obj):
        sub = getattr(obj, '_my_submission', None)
        return MySubmissionSerializer(sub).data if sub else None


class AssignmentDetailSerializer(AssignmentSerializer):
    class Meta(AssignmentSerializer.Meta):
        fields = AssignmentSerializer.Meta.fields + ['instructions', 'subject']
