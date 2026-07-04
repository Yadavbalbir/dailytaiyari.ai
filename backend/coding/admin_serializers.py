"""Admin/instructor authoring serializers for coding problems."""
from rest_framework import serializers

from .models import CodingProblem, TestCase, CodingSubmission
from .languages import LANGUAGE_KEYS


class AdminTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = [
            'id', 'stdin', 'expected_output', 'is_sample', 'points',
            'explanation', 'order',
        ]


class AdminCodingProblemSerializer(serializers.ModelSerializer):
    test_cases = AdminTestCaseSerializer(many=True, required=False)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default=None)
    submission_count = serializers.SerializerMethodField()
    test_case_count = serializers.SerializerMethodField()

    class Meta:
        model = CodingProblem
        fields = [
            'id', 'course', 'subject', 'subject_name', 'topic', 'topic_name',
            'title', 'statement', 'difficulty', 'allowed_languages', 'starter_code',
            'time_limit_ms', 'memory_limit_mb', 'max_marks', 'status', 'order',
            'test_cases', 'submission_count', 'test_case_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def get_test_case_count(self, obj):
        return obj.test_cases.count()

    def validate_allowed_languages(self, value):
        if value in (None, ''):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Must be a list of language keys.')
        bad = [v for v in value if v not in LANGUAGE_KEYS]
        if bad:
            raise serializers.ValidationError(f'Unsupported languages: {", ".join(bad)}')
        return value

    def _write_test_cases(self, problem, cases):
        problem.test_cases.all().delete()
        for i, c in enumerate(cases):
            TestCase.objects.create(
                problem=problem,
                stdin=c.get('stdin', ''),
                expected_output=c.get('expected_output', ''),
                is_sample=c.get('is_sample', False),
                points=c.get('points', 1),
                explanation=c.get('explanation', ''),
                order=c.get('order', i),
            )

    def create(self, validated_data):
        cases = validated_data.pop('test_cases', None)
        problem = super().create(validated_data)
        if cases is not None:
            self._write_test_cases(problem, cases)
        return problem

    def update(self, instance, validated_data):
        cases = validated_data.pop('test_cases', None)
        problem = super().update(instance, validated_data)
        if cases is not None:
            self._write_test_cases(problem, cases)
        return problem


class AdminSubmissionSerializer(serializers.ModelSerializer):
    """Full submission view for admins/instructors (includes hidden-case I/O)."""
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    all_passed = serializers.BooleanField(read_only=True)
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    problem_max_marks = serializers.IntegerField(source='problem.max_marks', read_only=True)

    class Meta:
        model = CodingSubmission
        fields = [
            'id', 'problem', 'problem_title', 'problem_max_marks',
            'student', 'student_name', 'student_email',
            'language', 'source_code', 'status', 'results', 'compile_output',
            'passed_count', 'total_count', 'passed_points', 'total_points',
            'marks', 'all_passed', 'submitted_at',
        ]

    def _user(self, obj):
        return getattr(obj.student, 'user', None)

    def get_student_name(self, obj):
        u = self._user(obj)
        if not u:
            return ''
        return (getattr(u, 'full_name', '') or u.email or '').strip()

    def get_student_email(self, obj):
        u = self._user(obj)
        return u.email if u else ''
