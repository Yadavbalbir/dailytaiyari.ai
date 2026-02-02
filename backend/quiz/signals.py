"""
Signals for quiz-related events.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import QuizAttempt, MockTestAttempt, Answer


@receiver(post_save, sender=QuizAttempt)
def update_analytics_on_quiz_complete(sender, instance, **kwargs):
    """Update analytics when a quiz is completed."""
    if instance.status == 'completed':
        # Update topic mastery
        from analytics.services import AnalyticsService
        AnalyticsService.update_topic_mastery_from_attempt(instance)


@receiver(post_save, sender=MockTestAttempt)
def update_analytics_on_mock_complete(sender, instance, **kwargs):
    """Update analytics when a mock test is completed."""
    if instance.status == 'completed':
        from analytics.services import AnalyticsService
        AnalyticsService.update_mock_test_analytics(instance)

