"""Admin serializers for the job builder and applicant pipeline review."""
from rest_framework import serializers

from .models import Job, JobApplication, ApplicationEvent


class AdminJobSerializer(serializers.ModelSerializer):
    applications_count = serializers.SerializerMethodField()
    stage_counts = serializers.SerializerMethodField()
    is_open = serializers.BooleanField(read_only=True)
    is_external = serializers.BooleanField(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'job_type', 'is_external', 'category',
            'category_display', 'department', 'location',
            'work_mode', 'employment_type', 'experience_min', 'experience_max',
            'salary_min', 'salary_max', 'salary_currency', 'salary_period',
            'description', 'requirements', 'external_url', 'openings',
            'deadline', 'status', 'is_open', 'views_count',
            'created_by', 'created_by_name', 'applications_count',
            'stage_counts', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'views_count', 'created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        job_type = attrs.get('job_type', getattr(self.instance, 'job_type', 'internal'))
        external_url = attrs.get('external_url', getattr(self.instance, 'external_url', ''))
        if job_type == 'external' and not external_url:
            raise serializers.ValidationError(
                {'external_url': 'An external posting requires a link to apply.'}
            )
        return attrs

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_stage_counts(self, obj):
        counts = {}
        for app in obj.applications.all():
            counts[app.stage] = counts.get(app.stage, 0) + 1
        return counts

    def get_created_by_name(self, obj):
        u = obj.created_by
        if not u:
            return ''
        return (getattr(u, 'full_name', '') or u.email or '').strip()


class ApplicationEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    from_stage_display = serializers.SerializerMethodField()
    to_stage_display = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationEvent
        fields = [
            'id', 'event_type', 'from_stage', 'from_stage_display',
            'to_stage', 'to_stage_display', 'note', 'created_by',
            'created_by_name', 'created_at',
        ]

    def get_created_by_name(self, obj):
        u = obj.created_by
        if not u:
            return 'System'
        return (getattr(u, 'full_name', '') or u.email or '').strip()

    def _label(self, stage):
        return dict(JobApplication.STAGE_CHOICES).get(stage, stage)

    def get_from_stage_display(self, obj):
        return self._label(obj.from_stage) if obj.from_stage else ''

    def get_to_stage_display(self, obj):
        return self._label(obj.to_stage) if obj.to_stage else ''


class AdminApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    resume_url = serializers.SerializerMethodField()
    resume_stream_url = serializers.SerializerMethodField()
    resume_name = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_type = serializers.CharField(source='job.job_type', read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'job_title', 'job_type', 'applicant',
            'student_name', 'student_email', 'full_name', 'email', 'phone',
            'cover_letter', 'portfolio_url', 'linkedin_url',
            'resume_url', 'resume_stream_url', 'resume_name',
            'stage', 'stage_display', 'is_external', 'applied_at', 'created_at',
        ]
        read_only_fields = fields

    def _user(self, obj):
        return getattr(obj.applicant, 'user', None)

    def get_student_name(self, obj):
        u = self._user(obj)
        if not u:
            return obj.full_name or ''
        return (getattr(u, 'full_name', '') or u.email or '').strip()

    def get_student_email(self, obj):
        u = self._user(obj)
        return u.email if u else obj.email

    def get_resume_url(self, obj):
        if not obj.resume:
            return None
        request = self.context.get('request')
        url = obj.resume.url
        return request.build_absolute_uri(url) if request else url

    def get_resume_stream_url(self, obj):
        if not obj.resume:
            return None
        return f'/jobs/admin/applications/{obj.id}/resume/'

    def get_resume_name(self, obj):
        if not obj.resume:
            return None
        return obj.resume.name.rsplit('/', 1)[-1]


class AdminApplicationDetailSerializer(AdminApplicationSerializer):
    events = ApplicationEventSerializer(many=True, read_only=True)

    class Meta(AdminApplicationSerializer.Meta):
        fields = AdminApplicationSerializer.Meta.fields + ['events']
        read_only_fields = fields
