"""Student-facing Job Portal endpoints.

Students browse published jobs in their tenant, apply to internal openings with
a resume + cover letter, and record a click-through for external postings.
"""
from django.db.models import F
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Job, JobApplication, ApplicationEvent, JobReport
from .serializers import (
    JobListSerializer, JobDetailSerializer,
    MyJobApplicationSerializer, MyApplicationWithJobSerializer,
)


class JobViewSet(viewsets.ReadOnlyModelViewSet):
    """Published jobs for the current tenant, plus apply actions."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        return JobDetailSerializer if self.action == 'retrieve' else JobListSerializer

    def _tenant(self):
        return getattr(self.request, 'tenant', None)

    def _student(self):
        return getattr(self.request.user, 'profile', None)

    def get_queryset(self):
        tenant = self._tenant()
        if not tenant:
            return Job.objects.none()
        qs = Job.objects.filter(tenant=tenant, status='published')
        job_type = self.request.query_params.get('job_type')
        if job_type in ('internal', 'external'):
            qs = qs.filter(job_type=job_type)
        return qs.order_by('-created_at')

    def _attach_applications(self, jobs):
        student = self._student()
        if student:
            by_job = {
                a.job_id: a for a in JobApplication.objects.filter(
                    applicant=student, job__in=jobs,
                )
            }
            for j in jobs:
                j._my_application = by_job.get(j.id)
        self._attach_reports(jobs, student)

    def _attach_reports(self, jobs, student=None):
        student = student or self._student()
        job_ids = [j.id for j in jobs]
        if not job_ids:
            return
        counts = {}
        for r in JobReport.objects.filter(job_id__in=job_ids):
            counts[r.job_id] = counts.get(r.job_id, 0) + 1
        mine = set()
        if student:
            mine = set(
                JobReport.objects.filter(
                    reporter=student, job_id__in=job_ids,
                ).values_list('job_id', flat=True)
            )
        for j in jobs:
            j._reports_count = counts.get(j.id, 0)
            j._my_report = j.id in mine

    def list(self, request, *args, **kwargs):
        jobs = list(self.get_queryset())
        self._attach_applications(jobs)
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        job = self.get_object()
        Job.objects.filter(pk=job.pk).update(views_count=F('views_count') + 1)
        self._attach_applications([job])
        return Response(self.get_serializer(job).data)

    @action(detail=False, methods=['get'], url_path='my-applications')
    def my_applications(self, request):
        student = self._student()
        if not student:
            return Response([])
        apps = JobApplication.objects.filter(
            applicant=student, job__tenant=self._tenant(),
        ).select_related('job').order_by('-applied_at')
        return Response(
            MyApplicationWithJobSerializer(apps, many=True).data
        )

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply to an internal opening with a resume + cover letter."""
        job = self.get_object()
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)
        if job.is_external:
            return Response(
                {'error': 'This is an external posting. Use apply-external.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not job.is_open:
            return Response(
                {'error': 'This job is closed. Applications are no longer accepted.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        existing = JobApplication.objects.filter(job=job, applicant=student).first()
        if existing and not existing.is_external and existing.stage != 'withdrawn':
            return Response(
                {'error': 'You have already applied to this job.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = request.FILES.get('resume')
        cover_letter = (request.data.get('cover_letter') or '').strip()
        if not resume and not (existing and existing.resume):
            return Response({'error': 'A resume (PDF) is required.'}, status=400)

        user = request.user
        full_name = (request.data.get('full_name') or getattr(user, 'full_name', '') or '').strip()
        email = (request.data.get('email') or user.email or '').strip()
        phone = (request.data.get('phone') or getattr(user, 'phone', '') or '').strip()

        app = existing or JobApplication(job=job, applicant=student)
        app.full_name = full_name
        app.email = email
        app.phone = phone
        if resume:
            app.resume = resume
        app.cover_letter = cover_letter
        app.portfolio_url = (request.data.get('portfolio_url') or '').strip()
        app.linkedin_url = (request.data.get('linkedin_url') or '').strip()
        app.is_external = False
        app.stage = 'applied'
        app.applied_at = timezone.now()
        app.tenant = job.tenant
        app.save()

        ApplicationEvent.objects.create(
            application=app, event_type='applied', to_stage='applied',
            note='Application submitted.', tenant=job.tenant,
        )

        self._attach_applications([job])
        return Response(self.get_serializer(job).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='apply-external')
    def apply_external(self, request, pk=None):
        """Record a click-through on an external posting.

        The student is expected to complete the actual application on the
        external site; we surface a notification and the link to open.
        """
        job = self.get_object()
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)
        if not job.is_external:
            return Response(
                {'error': 'This is an internal opening. Use apply.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        app, created = JobApplication.objects.get_or_create(
            job=job, applicant=student,
            defaults={
                'is_external': True,
                'stage': 'applied_external',
                'full_name': (getattr(request.user, 'full_name', '') or '').strip(),
                'email': request.user.email or '',
                'applied_at': timezone.now(),
                'tenant': job.tenant,
            },
        )
        if created:
            ApplicationEvent.objects.create(
                application=app, event_type='applied', to_stage='applied_external',
                note='Clicked through to the external application.', tenant=job.tenant,
            )

        return Response({
            'message': (
                "You'll complete your application on the external site. "
                "We've marked this as applied externally."
            ),
            'external_url': job.external_url,
            'application': MyJobApplicationSerializer(app).data,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw an internal application."""
        job = self.get_object()
        student = self._student()
        app = JobApplication.objects.filter(job=job, applicant=student).first()
        if not app:
            return Response({'error': 'No application found.'}, status=404)
        if app.is_external:
            return Response({'error': 'External applications cannot be withdrawn.'}, status=400)
        prev = app.stage
        app.stage = 'withdrawn'
        app.save(update_fields=['stage'])
        ApplicationEvent.objects.create(
            application=app, event_type='stage_change', from_stage=prev,
            to_stage='withdrawn', note='Withdrawn by applicant.', tenant=job.tenant,
        )
        self._attach_applications([job])
        return Response(self.get_serializer(job).data)

    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        """Report an opening as no longer active.

        Records one report per student. Once ``REPORT_ARCHIVE_THRESHOLD``
        distinct students report the same job, it is auto-archived so it drops
        off the board and only active openings remain.
        """
        job = self.get_object()
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)

        reason = (request.data.get('reason') or 'closed').strip()
        if reason not in dict(JobReport.REASON_CHOICES):
            reason = 'closed'
        note = (request.data.get('note') or '').strip()

        JobReport.objects.get_or_create(
            job=job, reporter=student,
            defaults={'reason': reason, 'note': note, 'tenant': job.tenant},
        )

        count = JobReport.objects.filter(job=job).count()
        threshold = Job.REPORT_ARCHIVE_THRESHOLD
        archived = False
        if count >= threshold and job.status != 'archived':
            job.status = 'archived'
            job.save(update_fields=['status'])
            archived = True

        if archived:
            message = (
                'Thanks for flagging this. It reached the review threshold and '
                'has been archived, so it will no longer appear on the board.'
            )
        else:
            remaining = max(threshold - count, 0)
            message = (
                "Thanks — we're reviewing this report. Once "
                f"{threshold} or more students report it, we'll archive it "
                f"automatically ({remaining} more to go)."
            )

        return Response({
            'message': message,
            'reports_count': count,
            'report_threshold': threshold,
            'archived': archived,
            'my_report': True,
        }, status=status.HTTP_200_OK)
