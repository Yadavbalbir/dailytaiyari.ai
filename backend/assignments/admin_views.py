"""Admin CRUD + submission review for assignments (tenant-admin only)."""
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
