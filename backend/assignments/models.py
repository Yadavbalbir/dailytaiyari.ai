"""
Assignment models.

An Assignment is authored by a tenant admin under a Topic (like a Quiz) and can
be timed (with a due date after which submissions are rejected) or timeless.
Students submit a text answer and/or a PDF file; admins view submissions, track
who is still pending, and grade with marks + feedback.
"""
from django.db import models
from django.utils import timezone

from core.models import OrderedModel
from exams.models import Topic, Subject, Course


class Assignment(OrderedModel):
    SUBMISSION_TYPES = [
        ('text', 'Text answer'),
        ('pdf', 'PDF upload'),
        ('either', 'Text or PDF'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='assignments',
        help_text='Required: no assignment without tenant.',
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='assignments')

    title = models.CharField(max_length=500)
    # Rich instructions (HTML / Markdown, supports pasted images like notes).
    instructions = models.TextField(blank=True)
    submission_type = models.CharField(max_length=10, choices=SUBMISSION_TYPES, default='either')

    # Optional question paper the admin attaches (view-only PDF for students).
    attachment = models.FileField(upload_to='assignment_papers/', blank=True, null=True)

    # Timing: timeless when is_timed is False (due_at ignored).
    is_timed = models.BooleanField(default=False)
    due_at = models.DateTimeField(null=True, blank=True)

    max_marks = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    class Meta:
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_open(self):
        """Whether submissions are currently accepted."""
        if self.status != 'published':
            return False
        if self.is_timed and self.due_at:
            return timezone.now() <= self.due_at
        return True


class AssignmentSubmission(OrderedModel):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey('users.StudentProfile', on_delete=models.CASCADE, related_name='assignment_submissions')

    submission_text = models.TextField(blank=True)
    submission_file = models.FileField(upload_to='assignment_submissions/', blank=True, null=True)
    submitted_at = models.DateTimeField(default=timezone.now)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='graded_submissions',
    )

    class Meta:
        verbose_name = 'Assignment Submission'
        verbose_name_plural = 'Assignment Submissions'
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student_id} → {self.assignment_id}"
