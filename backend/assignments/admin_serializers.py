"""Admin serializers for the assignment builder and submission review."""
from rest_framework import serializers

from .models import Assignment, AssignmentSubmission


class AdminAssignmentSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'instructions', 'course', 'subject', 'subject_name',
            'topic', 'topic_name', 'submission_type', 'attachment',
            'is_timed', 'due_at', 'max_marks', 'status', 'order',
            'submissions_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_submissions_count(self, obj):
        return obj.submissions.count()


class AdminSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_stream_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    assignment_instructions = serializers.CharField(source='assignment.instructions', read_only=True)
    assignment_max_marks = serializers.IntegerField(source='assignment.max_marks', read_only=True)
    assignment_submission_type = serializers.CharField(source='assignment.submission_type', read_only=True)
    topic_name = serializers.CharField(source='assignment.topic.name', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'assignment_instructions',
            'assignment_max_marks', 'assignment_submission_type', 'topic_name',
            'student', 'student_name', 'student_email',
            'submission_text', 'file_url', 'file_stream_url', 'file_name',
            'submitted_at', 'status', 'marks', 'feedback', 'graded_at',
        ]
        read_only_fields = [
            'id', 'assignment', 'student', 'submission_text', 'file_url',
            'submitted_at', 'graded_at',
        ]

    def _user(self, obj):
        return getattr(obj.student, 'user', None)

    def get_student_name(self, obj):
        u = self._user(obj)
        if not u:
            return ''
        return (getattr(u, 'full_name', '') or u.get_full_name() or u.email or '').strip()

    def get_student_email(self, obj):
        u = self._user(obj)
        return u.email if u else ''

    def get_file_url(self, obj):
        if not obj.submission_file:
            return None
        request = self.context.get('request')
        url = obj.submission_file.url
        return request.build_absolute_uri(url) if request else url

    def get_file_stream_url(self, obj):
        """Relative path the frontend PdfReader streams from (authenticated)."""
        if not obj.submission_file:
            return None
        return f'/assignments/admin/submissions/{obj.id}/file/'

    def get_file_name(self, obj):
        if not obj.submission_file:
            return None
        return obj.submission_file.name.rsplit('/', 1)[-1]
