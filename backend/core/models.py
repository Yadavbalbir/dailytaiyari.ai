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

    # Canonical list of toggleable product features. Keys are stable identifiers
    # consumed by the frontend to show/hide navigation and routes; values are the
    # human-readable labels shown in the tenant-admin settings UI. To add a new
    # toggleable feature, add it here — existing tenants default it to enabled.
    FEATURE_CHOICES = {
        'courses': 'Courses',
        'study': 'Study Material',
        'quiz': 'Practice Quiz',
        'mock_tests': 'Mock Tests',
        'pyq': 'Previous Year Papers (PYQ)',
        'community': 'Community',
        'analytics': 'Analytics',
        'leaderboard': 'Leaderboard',
        'ai': 'AI Learning & Doubt Solver',
        'jobs': 'Job Portal',
    }

    # Canonical list of selectable colour themes. Keys are stable identifiers the
    # frontend maps to a full colour palette; values are the human-readable
    # labels shown in the tenant-admin settings UI. Keep in sync with the
    # frontend theme config (src/config/themes.js).
    THEME_CHOICES = {
        'sunrise': 'Sunrise Orange',
        'ocean': 'Ocean Blue',
        'emerald': 'Emerald Green',
        'violet': 'Royal Purple',
        'rose': 'Crimson Rose',
        'indigo': 'Midnight Indigo',
        'slate': 'Graphite Slate',
        'amber': 'Golden Amber',
        'cherry': 'Cherry Red',
        'lime': 'Fresh Lime',
    }
    DEFAULT_THEME = 'sunrise'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    tagline = models.CharField(max_length=255, blank=True, default='')
    subdomain = models.CharField(max_length=100, unique=True, null=True, blank=True)
    logo = models.ImageField(upload_to='tenant_logos/', null=True, blank=True)
    favicon = models.ImageField(upload_to='tenant_favicons/', null=True, blank=True)
    theme = models.CharField(
        max_length=32,
        choices=[(k, v) for k, v in THEME_CHOICES.items()],
        default=DEFAULT_THEME,
    )
    # When False, the frontend hides the text name and shows the logo alone
    # (full-width) — useful when the logo already contains the institution name.
    show_name = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    # Per-tenant feature toggles: {feature_key: bool}. Missing keys default to
    # enabled so newly introduced features are on until an admin turns them off.
    features = models.JSONField(default=dict, blank=True)

    # ── Enrollment mode flags ──────────────────────────────────────────────
    # These decide how a student joins a course:
    #   * request_enrollment_* = True  → student sends a request, admin approves
    #     (the current, gateway-independent behaviour).
    #   * request_enrollment_free = False → free courses allow instant self-enrol.
    #   * request_enrollment_paid = False → paid courses enrol only after online
    #     payment, so this may only be turned off when an active payment gateway
    #     is configured (enforced in the admin serializer). Defaults keep every
    #     existing tenant on the request/approve flow.
    request_enrollment_free = models.BooleanField(default=True)
    request_enrollment_paid = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_features(self):
        """Return the full feature map, defaulting any missing key to enabled."""
        stored = self.features or {}
        return {key: bool(stored.get(key, True)) for key in self.FEATURE_CHOICES}

    @property
    def has_active_payment_gateway(self):
        """True when this tenant has a fully-configured, active payment gateway."""
        try:
            gateway = self.payment_gateway
        except PaymentGateway.DoesNotExist:
            return False
        return bool(gateway and gateway.is_active and gateway.is_configured)

    def enroll_mode_for(self, course):
        """Resolve how a student joins ``course`` given this tenant's flags.

        Returns one of:
          * ``'request'`` — student requests, an admin approves (default).
          * ``'self'``    — instant self-enrolment (free course, flag off).
          * ``'payment'`` — enrol after online payment (paid course, flag off
            and an active gateway is configured).
        """
        is_free = getattr(course, 'is_free', False)
        if is_free:
            return 'request' if self.request_enrollment_free else 'self'
        # Paid course.
        if not self.request_enrollment_paid and self.has_active_payment_gateway:
            return 'payment'
        return 'request'


class PaymentGateway(models.Model):
    """A tenant's online payment gateway credentials (Razorpay / Cashfree / PayU).

    Secrets are encrypted at rest via :mod:`core.encryption`; the plaintext
    secret is only ever exposed through the :pyattr:`key_secret` property and is
    never serialized back to API clients. Each tenant has at most one gateway.
    """

    PROVIDER_RAZORPAY = 'razorpay'
    PROVIDER_CASHFREE = 'cashfree'
    PROVIDER_PAYU = 'payu'
    PROVIDER_CHOICES = [
        (PROVIDER_RAZORPAY, 'Razorpay'),
        (PROVIDER_CASHFREE, 'Cashfree'),
        (PROVIDER_PAYU, 'PayU'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        Tenant, on_delete=models.CASCADE, related_name='payment_gateway'
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)

    # Public-ish identifier: Razorpay ``key_id`` / Cashfree ``app_id`` / PayU merchant key.
    key_id = models.CharField(max_length=255, blank=True, default='')
    # Encrypted secret: Razorpay ``key_secret`` / Cashfree ``secret_key`` / PayU salt.
    key_secret_encrypted = models.TextField(blank=True, default='')
    # Encrypted webhook signing secret. Razorpay uses a dedicated webhook secret
    # (set in its dashboard); Cashfree signs webhooks with the account secret and
    # PayU signs with its salt, so this is optional for them and falls back to
    # ``key_secret``.
    webhook_secret_encrypted = models.TextField(blank=True, default='')

    # When False the gateway is stored but not used for checkout yet.
    is_active = models.BooleanField(default=False)
    # Test/sandbox vs. live credentials.
    is_test_mode = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Payment Gateway'
        verbose_name_plural = 'Payment Gateways'

    def __str__(self):
        return f'{self.tenant.name} — {self.get_provider_display()}'

    @property
    def key_secret(self):
        """Decrypted secret (empty string when not set)."""
        from .encryption import decrypt
        return decrypt(self.key_secret_encrypted)

    @key_secret.setter
    def key_secret(self, raw):
        from .encryption import encrypt
        self.key_secret_encrypted = encrypt(raw or '')

    @property
    def webhook_secret(self):
        """Decrypted webhook secret; falls back to the account secret when unset."""
        from .encryption import decrypt
        if self.webhook_secret_encrypted:
            return decrypt(self.webhook_secret_encrypted)
        return decrypt(self.key_secret_encrypted)

    @webhook_secret.setter
    def webhook_secret(self, raw):
        from .encryption import encrypt
        self.webhook_secret_encrypted = encrypt(raw or '')

    @property
    def is_configured(self):
        """True once both the id and secret are present."""
        return bool(self.key_id and self.key_secret_encrypted)


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


class JobApplication(PlatformLead):
    """A careers-page job application submitted from the marketing site."""

    phone = models.CharField(max_length=30, blank=True)
    position = models.CharField(max_length=255)
    experience = models.CharField(max_length=100, blank=True)
    portfolio_url = models.URLField(max_length=500, blank=True)
    cover_letter = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Job Application'
        verbose_name_plural = 'Job Applications'

    def __str__(self):
        return f'{self.name} <{self.email}> — {self.position}'
