"""Student-facing assignment endpoints: list, detail, submit, view paper."""
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response

from users.models import CourseEnrollment

from .models import Assignment, AssignmentSubmission
from .serializers import AssignmentSerializer, AssignmentDetailSerializer


class AssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    """Published assignments for the student's approved-enrolled courses."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        return AssignmentDetailSerializer if self.action == 'retrieve' else AssignmentSerializer

    def _student(self):
        return getattr(self.request.user, 'profile', None)

    def _enrolled_course_ids(self):
        student = self._student()
        if not student:
            return []
        return list(CourseEnrollment.objects.filter(
            student=student, status='approved', is_active=True,
        ).values_list('course_id', flat=True))

    def get_queryset(self):
        qs = Assignment.objects.select_related('topic', 'subject').filter(
            status='published', course_id__in=self._enrolled_course_ids(),
        )
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs.order_by('order', '-created_at')

    def _attach_submissions(self, assignments):
        student = self._student()
        if not student:
            return
        by_assignment = {
            s.assignment_id: s for s in AssignmentSubmission.objects.filter(
                student=student, assignment__in=assignments,
            )
        }
        for a in assignments:
            a._my_submission = by_assignment.get(a.id)

    def list(self, request, *args, **kwargs):
        assignments = list(self.get_queryset())
        self._attach_submissions(assignments)
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        assignment = self.get_object()
        self._attach_submissions([assignment])
        return Response(self.get_serializer(assignment).data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        assignment = self.get_object()
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)
        if not assignment.is_open:
            return Response(
                {'error': 'This assignment is closed. Submissions are no longer accepted.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        text = (request.data.get('submission_text') or '').strip()
        upload = request.FILES.get('submission_file')

        stype = assignment.submission_type
        if stype == 'text' and not text:
            return Response({'error': 'A text answer is required.'}, status=400)
        if stype == 'pdf' and not upload:
            return Response({'error': 'A PDF file is required.'}, status=400)
        if stype == 'either' and not text and not upload:
            return Response({'error': 'Provide a text answer or upload a PDF.'}, status=400)

        sub, _ = AssignmentSubmission.objects.get_or_create(
            assignment=assignment, student=student,
        )
        if text:
            sub.submission_text = text
        if upload:
            sub.submission_file = upload
        sub.submitted_at = timezone.now()
        # Re-submission resets any prior grade.
        sub.status = 'submitted'
        sub.marks = None
        sub.feedback = ''
        sub.graded_at = None
        sub.graded_by = None
        sub.save()

        self._attach_submissions([assignment])
        return Response(self.get_serializer(assignment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='paper')
    def paper(self, request, pk=None):
        """Stream the admin-attached question paper inline (view only)."""
        assignment = self.get_object()
        if not assignment.attachment:
            raise Http404('No paper attached.')
        try:
            fh = assignment.attachment.open('rb')
        except Exception:
            raise Http404('Paper file not found.')
        response = FileResponse(fh, content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="assignment.pdf"'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
