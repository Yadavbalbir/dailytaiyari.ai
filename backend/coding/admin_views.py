"""Admin/instructor authoring + submission review for coding problems."""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from exams.admin_views import TenantAdminModelViewSet

from users.models import CourseEnrollment

from .models import CodingProblem, CodingSubmission
from .admin_serializers import AdminCodingProblemSerializer, AdminSubmissionSerializer


class AdminCodingProblemViewSet(TenantAdminModelViewSet):
    queryset = CodingProblem.objects.select_related('course', 'subject', 'topic').prefetch_related('test_cases').all()
    serializer_class = AdminCodingProblemSerializer
    search_fields = ['title']
    ordering_fields = ['order', 'created_at', 'title']
    ordering = ['order', '-created_at']
    filterset_fields = ['course', 'subject', 'topic', 'status', 'difficulty']
    tenant_lookup = 'tenant'
    course_lookup = 'course'

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Return per-student best submission + pending students + counts."""
        problem = self.get_object()
        all_subs = problem.submissions.select_related('student__user').order_by(
            '-passed_points', '-submitted_at',
        )

        # Best submission per student (already ordered by passed_points desc, latest).
        best_by_student = {}
        for s in all_subs:
            if s.student_id not in best_by_student:
                best_by_student[s.student_id] = s
        submitted_ids = set(best_by_student.keys())

        enrollments = CourseEnrollment.objects.filter(
            course=problem.course, status='approved', is_active=True,
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
        best_list = list(best_by_student.values())
        return Response({
            'problem': {
                'id': str(problem.id),
                'title': problem.title,
                'statement': problem.statement,
                'difficulty': problem.difficulty,
                'max_marks': problem.max_marks,
                'status': problem.status,
                'topic_name': problem.topic.name if problem.topic else '',
            },
            'counts': {
                'total_students': total,
                'submitted': submitted,
                'pending': max(total - submitted, 0),
                'solved': sum(1 for s in best_list if s.all_passed),
            },
            'submissions': AdminSubmissionSerializer(best_list, many=True).data,
            'pending_students': pending,
        })


class AdminSubmissionViewSet(TenantAdminModelViewSet):
    """Read-only single-submission view for the focused review page."""
    queryset = CodingSubmission.objects.select_related('student__user', 'problem').all()
    serializer_class = AdminSubmissionSerializer
    http_method_names = ['get', 'head', 'options']
    tenant_lookup = 'problem__tenant'
    course_lookup = 'problem__course'
    search_fields = []
    ordering_fields = ['submitted_at']
    ordering = ['-submitted_at']
    filterset_fields = ['problem', 'student', 'status']
