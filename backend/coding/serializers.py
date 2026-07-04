"""Student-facing serializers for coding problems."""
from rest_framework import serializers

from .models import CodingProblem, TestCase, CodingSubmission
from .languages import LANGUAGES


class SampleTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ['id', 'stdin', 'expected_output', 'explanation', 'points']


class MySubmissionSummarySerializer(serializers.ModelSerializer):
    all_passed = serializers.BooleanField(read_only=True)

    class Meta:
        model = CodingSubmission
        fields = [
            'id', 'language', 'status', 'passed_count', 'total_count',
            'passed_points', 'total_points', 'marks', 'all_passed', 'submitted_at',
        ]


class CodingProblemListSerializer(serializers.ModelSerializer):
    """Compact list view; includes the student's best-so-far status."""
    my_best = serializers.SerializerMethodField()
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = CodingProblem
        fields = [
            'id', 'title', 'difficulty', 'max_marks', 'status', 'order',
            'topic', 'topic_name', 'my_best',
        ]

    def get_my_best(self, obj):
        best = getattr(obj, '_my_best', None)
        return MySubmissionSummarySerializer(best).data if best else None


class CodingProblemDetailSerializer(serializers.ModelSerializer):
    """Full problem for the solve page. Only SAMPLE test cases are exposed."""
    sample_cases = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    starter_code = serializers.SerializerMethodField()
    my_best = serializers.SerializerMethodField()
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = CodingProblem
        fields = [
            'id', 'title', 'statement', 'difficulty', 'max_marks', 'status',
            'topic', 'topic_name', 'time_limit_ms', 'memory_limit_mb',
            'languages', 'starter_code', 'sample_cases', 'my_best',
        ]

    def get_sample_cases(self, obj):
        samples = obj.test_cases.filter(is_sample=True).order_by('order', 'created_at')
        return SampleTestCaseSerializer(samples, many=True).data

    def get_languages(self, obj):
        keys = obj.normalized_languages()
        return [
            {'key': k, 'label': LANGUAGES[k]['label'], 'monaco': LANGUAGES[k]['monaco']}
            for k in keys if k in LANGUAGES
        ]

    def get_starter_code(self, obj):
        keys = obj.normalized_languages()
        code = obj.starter_code or {}
        return {k: code.get(k, '') for k in keys}

    def get_my_best(self, obj):
        best = getattr(obj, '_my_best', None)
        return MySubmissionSummarySerializer(best).data if best else None


class SubmissionResultSerializer(serializers.ModelSerializer):
    """Result returned after a graded submit. Hidden-case I/O is stripped."""
    results = serializers.SerializerMethodField()
    all_passed = serializers.BooleanField(read_only=True)

    class Meta:
        model = CodingSubmission
        fields = [
            'id', 'language', 'status', 'results', 'compile_output',
            'passed_count', 'total_count', 'passed_points', 'total_points',
            'marks', 'all_passed', 'submitted_at',
        ]

    def get_results(self, obj):
        # Strip I/O for hidden cases so answers never leak; keep verdict + points.
        cleaned = []
        for r in (obj.results or []):
            if r.get('is_sample'):
                cleaned.append(r)
            else:
                cleaned.append({
                    'index': r.get('index'),
                    'is_sample': False,
                    'verdict': r.get('verdict'),
                    'points': r.get('points'),
                    'max_points': r.get('max_points'),
                    'time_ms': r.get('time_ms'),
                })
        return cleaned
