"""
Course completion certificate models.

A ``CourseCertificate`` is issued once, the first time a student reaches 100%
completion of a course whose admin has enabled certificates. Human-readable
identity fields (student / course / tenant names) are snapshotted at issue time
so a downloaded/verified certificate stays accurate even if those records later
change.
"""
import secrets

from django.db import models

from core.models import TimeStampedModel


def _generate_serial():
    """Short, unambiguous, upper-case serial fragment (no 0/O/1/I)."""
    alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    return ''.join(secrets.choice(alphabet) for _ in range(8))


class CourseCertificate(TimeStampedModel):
    """A certificate awarded to a student for completing a course."""

    student = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='certificates',
    )
    course = models.ForeignKey(
        'exams.Course',
        on_delete=models.CASCADE,
        related_name='certificates',
    )

    # Unique, shareable certificate number, e.g. "DT-2026-A7KM9QRT".
    certificate_number = models.CharField(max_length=40, unique=True, db_index=True)

    # Design used when the certificate was issued (snapshot of course setting).
    template = models.CharField(max_length=20, default='classic')

    # Snapshots taken at issue time so the artifact never goes stale.
    student_name = models.CharField(max_length=255)
    course_name = models.CharField(max_length=255)
    tenant_name = models.CharField(max_length=255, blank=True, default='')

    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'course']
        verbose_name = 'Course Certificate'
        verbose_name_plural = 'Course Certificates'
        ordering = ['-issued_at']

    def __str__(self):
        return f"{self.certificate_number} — {self.student_name} / {self.course_name}"

    @staticmethod
    def make_number():
        from django.utils import timezone
        year = timezone.now().year
        for _ in range(10):
            number = f"DT-{year}-{_generate_serial()}"
            if not CourseCertificate.objects.filter(certificate_number=number).exists():
                return number
        # Extremely unlikely fallback with extra entropy.
        return f"DT-{year}-{_generate_serial()}{_generate_serial()}"
