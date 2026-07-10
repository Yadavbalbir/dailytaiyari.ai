"""Admin Job Portal endpoints (tenant-admin only).

Full control of the hiring pipeline: CRUD jobs, view every applicant per job and
across the tenant, move applications through stages, leave notes, and stream a
candidate's resume for review.
"""
import mimetypes

from django.http import FileResponse, Http404
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsTenantAdmin

from .models import Job, JobApplication, ApplicationEvent
from .admin_serializers import (
    AdminJobSerializer, AdminApplicationSerializer,
    AdminApplicationDetailSerializer, ApplicationEventSerializer,
)


class JobsPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


class AdminJobViewSet(viewsets.ModelViewSet):
    """CRUD jobs for the current tenant + per-job applicant overview."""
    serializer_class = AdminJobSerializer
    permission_classes = [IsTenantAdmin]
    pagination_class = JobsPagination
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'department', 'location']
    ordering_fields = ['created_at', 'title', 'status', 'deadline']
    ordering = ['-created_at']
    filterset_fields = ['status', 'job_type', 'employment_type', 'work_mode']

    def _tenant(self):
        return getattr(self.request, 'tenant', None)

    def get_queryset(self):
        tenant = self._tenant()
        if not tenant:
            return Job.objects.none()
        return Job.objects.filter(tenant=tenant).prefetch_related('applications')

    def perform_create(self, serializer):
        tenant = self._tenant()
        if not tenant:
            raise PermissionDenied('A valid tenant is required.')
        serializer.save(tenant=tenant, created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """Every applicant for this job, grouped into pipeline columns."""
        job = self.get_object()
        apps = job.applications.select_related('applicant__user').all()
        data = AdminApplicationSerializer(apps, many=True, context={'request': request}).data

        stage_counts = {}
        for a in apps:
            stage_counts[a.stage] = stage_counts.get(a.stage, 0) + 1

        return Response({
            'job': {
                'id': str(job.id),
                'title': job.title,
                'job_type': job.job_type,
                'is_external': job.is_external,
                'status': job.status,
                'openings': job.openings,
                'external_url': job.external_url,
            },
            'pipeline_stages': JobApplication.PIPELINE_STAGES,
            'applications': data,
            'stage_counts': stage_counts,
            'total': len(data),
        })


class AdminApplicationViewSet(viewsets.ReadOnlyModelViewSet):
    """Review applications, move stages, add notes, stream resumes."""
    serializer_class = AdminApplicationSerializer
    permission_classes = [IsTenantAdmin]
    pagination_class = JobsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['applied_at', 'stage']
    ordering = ['-applied_at']
    filterset_fields = ['job', 'stage', 'is_external']

    def get_serializer_class(self):
        return AdminApplicationDetailSerializer if self.action == 'retrieve' else AdminApplicationSerializer

    def _tenant(self):
        return getattr(self.request, 'tenant', None)

    def get_queryset(self):
        tenant = self._tenant()
        if not tenant:
            return JobApplication.objects.none()
        return JobApplication.objects.filter(job__tenant=tenant).select_related(
            'applicant__user', 'job',
        ).prefetch_related('events')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post'], url_path='move-stage')
    def move_stage(self, request, pk=None):
        app = self.get_object()
        if app.is_external:
            return Response(
                {'error': 'External applications are managed on the external site.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        new_stage = request.data.get('stage')
        valid = {s for s, _ in JobApplication.STAGE_CHOICES} - {'applied_external'}
        if new_stage not in valid:
            return Response({'error': 'Invalid stage.'}, status=400)

        note = (request.data.get('note') or '').strip()
        prev = app.stage
        if prev == new_stage and not note:
            return Response(
                AdminApplicationDetailSerializer(app, context={'request': request}).data
            )
        app.stage = new_stage
        app.save(update_fields=['stage'])
        ApplicationEvent.objects.create(
            application=app, event_type='stage_change', from_stage=prev,
            to_stage=new_stage, note=note, created_by=request.user,
            tenant=app.job.tenant,
        )
        return Response(
            AdminApplicationDetailSerializer(app, context={'request': request}).data
        )

    @action(detail=True, methods=['post'], url_path='add-note')
    def add_note(self, request, pk=None):
        app = self.get_object()
        note = (request.data.get('note') or '').strip()
        if not note:
            return Response({'error': 'A note is required.'}, status=400)
        ApplicationEvent.objects.create(
            application=app, event_type='note', note=note,
            created_by=request.user, tenant=app.job.tenant,
        )
        return Response(
            AdminApplicationDetailSerializer(app, context={'request': request}).data
        )

    @action(detail=True, methods=['get'])
    def resume(self, request, pk=None):
        """Stream a candidate's resume inline (view-only)."""
        app = self.get_object()
        if not app.resume:
            raise Http404('No resume submitted.')
        try:
            fh = app.resume.open('rb')
        except Exception:
            raise Http404('Resume file not found.')
        name = app.resume.name
        content_type = mimetypes.guess_type(name)[0] or 'application/pdf'
        response = FileResponse(fh, content_type=content_type)
        response['Content-Disposition'] = 'inline; filename="resume.pdf"'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Tenant-wide hiring snapshot for the admin dashboard."""
        qs = self.get_queryset()
        tenant = self._tenant()
        jobs = Job.objects.filter(tenant=tenant) if tenant else Job.objects.none()

        stage_counts = {}
        for a in qs:
            stage_counts[a.stage] = stage_counts.get(a.stage, 0) + 1

        return Response({
            'jobs_total': jobs.count(),
            'jobs_published': jobs.filter(status='published').count(),
            'jobs_internal': jobs.filter(job_type='internal').count(),
            'jobs_external': jobs.filter(job_type='external').count(),
            'applications_total': qs.count(),
            'applications_external': qs.filter(is_external=True).count(),
            'stage_counts': stage_counts,
        })
