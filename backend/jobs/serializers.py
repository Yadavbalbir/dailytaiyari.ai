"""Student-facing serializers for the Job Portal."""
from rest_framework import serializers

from .models import Job, JobApplication


class MyJobApplicationSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    has_resume = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id', 'stage', 'stage_display', 'is_external', 'is_active',
            'full_name', 'email', 'phone', 'cover_letter', 'portfolio_url',
            'linkedin_url', 'has_resume', 'applied_at', 'created_at',
        ]

    def get_has_resume(self, obj):
        return bool(obj.resume)


class JobListSerializer(serializers.ModelSerializer):
    is_open = serializers.BooleanField(read_only=True)
    is_external = serializers.BooleanField(read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    work_mode_display = serializers.CharField(source='get_work_mode_display', read_only=True)
    my_application = serializers.SerializerMethodField()
    applicants_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'job_type', 'is_external', 'department', 'location',
            'work_mode', 'work_mode_display', 'employment_type',
            'employment_type_display', 'experience_min', 'experience_max',
            'salary_min', 'salary_max', 'salary_currency', 'salary_period',
            'openings', 'deadline', 'status', 'is_open', 'external_url',
            'my_application', 'applicants_count', 'created_at',
        ]

    def get_my_application(self, obj):
        app = getattr(obj, '_my_application', None)
        return MyJobApplicationSerializer(app).data if app else None

    def get_applicants_count(self, obj):
        # Only meaningful for internal jobs; cheap when prefetched/annotated.
        return getattr(obj, '_applicants_count', None)


class JobDetailSerializer(JobListSerializer):
    class Meta(JobListSerializer.Meta):
        fields = JobListSerializer.Meta.fields + ['description', 'requirements']


class MyApplicationWithJobSerializer(MyJobApplicationSerializer):
    """A student's application enriched with its job summary."""
    job = JobListSerializer(read_only=True)

    class Meta(MyJobApplicationSerializer.Meta):
        fields = MyJobApplicationSerializer.Meta.fields + ['job']
