"""
Core models - Base classes for all models in the platform.
"""
from django.db import models
import uuid


class TimeStampedModel(models.Model):
    """
    Abstract base model with created and modified timestamps.
    All models should inherit from this.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeleteModel(TimeStampedModel):
    """
    Abstract model with soft delete functionality.
    Records are marked as deleted instead of being removed.
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()


class OrderedModel(TimeStampedModel):
    """
    Abstract model with ordering capability.
    """
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ['order', '-created_at']

