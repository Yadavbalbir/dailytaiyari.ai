"""Admin CRUD + submission review for assignments (tenant-admin only)."""
import mimetypes

from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response

from exams.admin_views import TenantAdminModelViewSet
from users.models import CourseEnrollment

from .models import Assignment, AssignmentSubmission
from .admin_serializers import AdminAssignmentSerializer, AdminSubmissionSerializer


class AdminAssignmentViewSet(TenantAdminModelViewSet):
    queryset = Assignment.objects.select_related('course', 'subject', 'topic').all()
    serializer_class = AdminAssignmentSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    search_fields = ['title']
    ordering_fields = ['order', 'created_at', 'title']
    ordering = ['order', '-created_at']
    filterset_fields = ['course', 'subject', 'topic', 'status', 'submission_type']
    tenant_lookup = 'tenant'
    course_lookup = 'course'

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Return submissions + students still pending + counts."""
        assignment = self.get_object()
        subs = assignment.submissions.select_related('student__user').all()
        submitted_ids = {s.student_id for s in subs}

        enrollments = CourseEnrollment.objects.filter(
            course=assignment.course, status='approved', is_active=True,
        ).select_related('student__user')

        pending = []
        for e in enrollments:
            if e.student_id in submitted_ids:
                continue
            u = getattr(e.student, 'user', None)
            pending.append({
                'student': str(e.student_id),
                'student_name': (getattr(u, 'full_name', '') or (u.email if u else '')).strip() if u else '',
                'student_email': u.email if u else '',
            })

        total = enrollments.count()
        submitted = len(submitted_ids)
        return Response({
            'assignment': {
                'id': str(assignment.id),
                'title': assignment.title,
                'instructions': assignment.instructions,
                'submission_type': assignment.submission_type,
                'max_marks': assignment.max_marks,
                'status': assignment.status,
                'is_timed': assignment.is_timed,
                'due_at': assignment.due_at.isoformat() if assignment.due_at else None,
                'topic_name': assignment.topic.name if assignment.topic else '',
                'subject_name': assignment.subject.name if assignment.subject else '',
                'course': str(assignment.course_id),
            },
            'submitted': AdminSubmissionSerializer(subs, many=True, context={'request': request}).data,
            'pending': pending,
            'counts': {
                'enrolled': total,
                'submitted': submitted,
                'pending': max(total - submitted, 0),
                'graded': sum(1 for s in subs if s.status == 'graded'),
            },
        })


class AdminSubmissionViewSet(TenantAdminModelViewSet):
    """Read + grade submissions. Scoped to the tenant via the assignment."""
    queryset = AssignmentSubmission.objects.select_related(
        'student__user', 'assignment',
    ).all()
    serializer_class = AdminSubmissionSerializer
    search_fields = []
    ordering_fields = ['submitted_at']
    ordering = ['-submitted_at']
    filterset_fields = ['assignment', 'status']
    tenant_lookup = 'assignment__tenant'
    course_lookup = 'assignment__course'
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_update(self, serializer):
        obj = serializer.save()
        # Grading: stamp when marks/feedback provided.
        if obj.marks is not None or obj.feedback:
            obj.status = 'graded'
            obj.graded_at = timezone.now()
            obj.graded_by = self.request.user
            obj.save(update_fields=['status', 'graded_at', 'graded_by'])

            # Award XP the first time this submission is graded.
            from gamification.models import XPTransaction
            from gamification.services import GamificationService
            from core.utils import calculate_xp_for_assignment

            already_awarded = XPTransaction.objects.filter(
                student=obj.student, transaction_type='assignment_graded', reference_id=obj.id,
            ).exists()
            if not already_awarded:
                GamificationService.award_xp(
                    obj.student,
                    calculate_xp_for_assignment(obj.marks, obj.assignment.max_marks),
                    'assignment_graded',
                    f'Assignment graded: {obj.assignment.title}',
                    str(obj.id),
                )

    @action(detail=True, methods=['get'], url_path='file')
    def file(self, request, pk=None):
        """Stream a student's submitted file inline (view-only) for grading."""
        submission = self.get_object()
        if not submission.submission_file:
            raise Http404('No file submitted.')
        try:
            fh = submission.submission_file.open('rb')
        except Exception:
            raise Http404('Submission file not found.')
        name = submission.submission_file.name
        content_type = mimetypes.guess_type(name)[0] or 'application/pdf'
        response = FileResponse(fh, content_type=content_type)
        response['Content-Disposition'] = 'inline; filename="submission.pdf"'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
