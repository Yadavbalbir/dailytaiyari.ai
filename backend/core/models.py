"""
Core models - Base classes for all models in the platform.
"""
from django.db import models
import uuid


class Tenant(models.Model):
    """
    Model representing a Tenant (e.g. an Institute, Coaching Center, or School).
    All data in the platform will be scopes to a Tenant.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=100, unique=True, null=True, blank=True)
    logo = models.ImageField(upload_to='tenant_logos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['name']

    def __str__(self):
        return self.name


class TimeStampedModel(models.Model):
    """
    Abstract base model with created and modified timestamps.
    All models should inherit from this.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='+')
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



class PlatformLead(models.Model):
    """Abstract base for platform-owned (non-tenant) inbound records.

    These belong to the DailyTaiyari platform team — NOT to any tenant — and
    will be managed later from a super-admin dashboard.
    """
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    source = models.CharField(max_length=100, default='landing', blank=True)
    internal_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class DemoBooking(PlatformLead):
    """A 'Book a Demo' request submitted from the marketing site."""
    ORG_TYPE_CHOICES = [
        ('coaching', 'Coaching Institute'),
        ('school', 'School'),
        ('college', 'College'),
        ('other', 'Other'),
    ]

    phone = models.CharField(max_length=30, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    organization_type = models.CharField(max_length=20, choices=ORG_TYPE_CHOICES, blank=True)
    message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demo Booking'
        verbose_name_plural = 'Demo Bookings'

    def __str__(self):
        return f'{self.name} <{self.email}> ({self.organization or "—"})'


class ContactMessage(PlatformLead):
    """A 'Talk to us' message submitted from the marketing site."""
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Message'
        verbose_name_plural = 'Contact Messages'

    def __str__(self):
        return f'{self.name} <{self.email}>'
