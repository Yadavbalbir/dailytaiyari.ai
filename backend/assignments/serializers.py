"""Student-facing serializers for assignments."""
from rest_framework import serializers

from .models import Assignment, AssignmentSubmission


def _is_pdf(file_field):
    return bool(file_field) and file_field.name.lower().endswith('.pdf')


def _file_basename(file_field):
    return file_field.name.rsplit('/', 1)[-1] if file_field else None


class MySubmissionSerializer(serializers.ModelSerializer):
    has_file = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    file_is_pdf = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'submission_text', 'has_file', 'file_name', 'file_is_pdf',
            'submitted_at', 'status', 'marks', 'feedback', 'graded_at',
        ]

    def get_has_file(self, obj):
        return bool(obj.submission_file)

    def get_file_name(self, obj):
        return _file_basename(obj.submission_file)

    def get_file_is_pdf(self, obj):
        return _is_pdf(obj.submission_file)


class AssignmentSerializer(serializers.ModelSerializer):
    """List item for a student, including their own submission summary."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    has_attachment = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    attachment_is_pdf = serializers.SerializerMethodField()
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'topic', 'topic_name', 'submission_type',
            'is_timed', 'due_at', 'max_marks', 'status', 'order',
            'is_open', 'has_attachment', 'attachment_name', 'attachment_is_pdf',
            'my_submission', 'created_at',
        ]

    def get_has_attachment(self, obj):
        return bool(obj.attachment)

    def get_attachment_name(self, obj):
        return _file_basename(obj.attachment)

    def get_attachment_is_pdf(self, obj):
        return _is_pdf(obj.attachment)

    def get_my_submission(self, obj):
        sub = getattr(obj, '_my_submission', None)
        return MySubmissionSerializer(sub).data if sub else None


class AssignmentDetailSerializer(AssignmentSerializer):
    class Meta(AssignmentSerializer.Meta):
        fields = AssignmentSerializer.Meta.fields + ['instructions', 'subject']
