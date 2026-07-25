"""Student-facing live-class endpoints: list published classes for a topic."""
from rest_framework import viewsets, permissions

from users.models import CourseEnrollment

from .models import LiveClass
from .serializers import LiveClassSerializer


class LiveClassViewSet(viewsets.ReadOnlyModelViewSet):
    """Published live classes for the student's approved-enrolled courses."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LiveClassSerializer

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
        qs = LiveClass.objects.select_related('topic', 'subject').filter(
            status='published', course_id__in=self._enrolled_course_ids(),
        )
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs.order_by('order', 'scheduled_start', '-created_at')
