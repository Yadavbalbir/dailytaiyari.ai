"""
Live-class models.

A LiveClass is authored under a Topic (mirrors CodingProblem/Assignment/Quiz
placement). It represents a scheduled live session students can join.

Right now only Google Meet (``gmeet``) is supported: the instructor pastes a
Google Meet link and students join through it. In-house live streaming (going
live from inside the portal with the creator's own device) is planned and is
surfaced as "coming soon" -- it is intentionally not selectable yet, enforced
both in the serializer and the UI.
"""
from django.db import models
from django.utils import timezone

from core.models import OrderedModel
from exams.models import Topic, Subject, Course


class LiveClass(OrderedModel):
    PROVIDER_GMEET = 'gmeet'
    PROVIDER_IN_HOUSE = 'in_house'
    PROVIDER_CHOICES = [
        (PROVIDER_GMEET, 'Google Meet'),
        (PROVIDER_IN_HOUSE, 'In-house Live'),
    ]
    # Providers the instructor may actually pick right now. Others are
    # "coming soon" and rejected by the authoring serializer.
    ENABLED_PROVIDERS = {PROVIDER_GMEET}

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='live_classes',
        help_text='Required: no live class without tenant.',
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='live_classes')
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='live_classes',
    )
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='live_classes')

    title = models.CharField(max_length=500)
    # Rich description (HTML / Markdown) shown to students before they join.
    description = models.TextField(blank=True)

    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default=PROVIDER_GMEET)
    # Google Meet (or other provider) join link.
    meeting_url = models.URLField(blank=True)

    # Schedule. duration is used to derive whether the class is live/ended.
    scheduled_start = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)

    host_name = models.CharField(max_length=200, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    class Meta:
        verbose_name = 'Live Class'
        verbose_name_plural = 'Live Classes'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['topic', 'status']),
            models.Index(fields=['course', 'status']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_published(self):
        return self.status == 'published'

    @property
    def scheduled_end(self):
        if not self.scheduled_start:
            return None
        return self.scheduled_start + timezone.timedelta(minutes=self.duration_minutes or 0)

    @property
    def live_status(self):
        """Derived lifecycle state: 'upcoming', 'live', or 'ended'.

        Falls back to 'upcoming' when no start time has been set yet.
        """
        start = self.scheduled_start
        if not start:
            return 'upcoming'
        now = timezone.now()
        if now < start:
            return 'upcoming'
        if now <= self.scheduled_end:
            return 'live'
        return 'ended'
