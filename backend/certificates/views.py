"""Certificate API views."""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from exams.models import Course
from .models import CourseCertificate
from .serializers import CourseCertificateSerializer
from .services import compute_course_progress, get_or_issue_certificate


class CourseCertificateView(APIView):
    """Certificate status + auto-issuance for the current student in a course.

    GET returns whether the course offers a certificate, the student's progress,
    eligibility, and — when eligible — the issued certificate payload (creating
    it on first access).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        student = getattr(request.user, 'profile', None)
        if student is None:
            return Response({'detail': 'Student profile required.'}, status=403)

        try:
            course = Course.objects.select_related('tenant').get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=404)

        completed, total, percent = compute_course_progress(student, course)
        enabled = bool(getattr(course, 'certificate_enabled', False))
        eligible = enabled and total > 0 and percent >= 100

        certificate = get_or_issue_certificate(student, course)
        data = {
            'enabled': enabled,
            'template': getattr(course, 'certificate_template', 'classic') or 'classic',
            'progress': percent,
            'completed': completed,
            'total': total,
            'eligible': eligible,
            'certificate': (
                CourseCertificateSerializer(certificate, context={'request': request}).data
                if certificate else None
            ),
        }
        return Response(data)


class CertificateVerifyView(APIView):
    """Public endpoint to verify a certificate by its number."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, number):
        certificate = CourseCertificate.objects.select_related('course', 'tenant').filter(
            certificate_number=number
        ).first()
        if not certificate:
            return Response(
                {'valid': False, 'detail': 'Certificate not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({
            'valid': True,
            'certificate': CourseCertificateSerializer(
                certificate, context={'request': request}
            ).data,
        })
