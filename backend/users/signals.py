"""
Signals for user-related actions.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, StudentProfile


@receiver(post_save, sender=User)
def create_student_profile(sender, instance, created, **kwargs):
    """Create StudentProfile when a new User is created."""
    if created:
        StudentProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_student_profile(sender, instance, **kwargs):
    """Save StudentProfile when User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()

