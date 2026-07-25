"""Marketing & Promotions models — coupons and the sitewide promo banner.

A :class:`Coupon` is a discount code an admin creates to promote sales. It can
target every paid course (``applies_to_all``) or a specific set of courses, and
grants either a percentage or a flat-amount discount. Redemptions are recorded
in :class:`CouponRedemption` so per-user / total usage limits can be enforced.

A :class:`PromoBanner` is an optional attractive strip shown at the top of the
app to advertise a running promotion (optionally carrying a coupon's code).
"""
import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def _money(value):
    """Quantise a Decimal/number to 2 places, never negative."""
    d = Decimal(str(value or 0)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return d if d > 0 else Decimal('0.00')


class Coupon(models.Model):
    """A discount code scoped to a tenant.

    ``code`` is stored upper-cased and is unique within a tenant. The discount
    is either a percentage of the order amount (optionally capped by
    ``max_discount_amount``) or a flat currency amount.
    """

    DISCOUNT_PERCENT = 'percent'
    DISCOUNT_FLAT = 'flat'
    DISCOUNT_CHOICES = [
        (DISCOUNT_PERCENT, 'Percentage'),
        (DISCOUNT_FLAT, 'Flat amount'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='coupons'
    )

    code = models.CharField(max_length=40, db_index=True)
    description = models.CharField(max_length=255, blank=True, default='')

    discount_type = models.CharField(max_length=10, choices=DISCOUNT_CHOICES, default=DISCOUNT_PERCENT)
    # Percent (0-100) when discount_type=percent, else a flat currency amount.
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Optional cap on the rupee value of a percentage discount.
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # Minimum order (course price) required for the coupon to apply.
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Scope: every paid course, or a specific set.
    applies_to_all = models.BooleanField(default=True)
    courses = models.ManyToManyField('exams.Course', blank=True, related_name='coupons')

    # Validity window (both optional; open-ended when null).
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    # Usage limits. ``usage_limit`` = total redemptions across all users
    # (null = unlimited). ``per_user_limit`` = redemptions per student
    # (0 = unlimited).
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    per_user_limit = models.PositiveIntegerField(default=1)
    times_redeemed = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Coupon'
        verbose_name_plural = 'Coupons'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'code'], name='uniq_coupon_code_per_tenant'),
        ]
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return f'{self.code} ({self.tenant_id})'

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def clean(self):
        if self.discount_type == self.DISCOUNT_PERCENT:
            if self.discount_value <= 0 or self.discount_value > 100:
                raise ValidationError({'discount_value': 'Percentage must be between 0 and 100.'})
        else:
            if self.discount_value <= 0:
                raise ValidationError({'discount_value': 'Flat discount must be greater than 0.'})
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError({'ends_at': 'End date must be after the start date.'})

    # ── Validity helpers ────────────────────────────────────────────────────
    @property
    def is_expired(self):
        return bool(self.ends_at and timezone.now() > self.ends_at)

    @property
    def is_scheduled(self):
        return bool(self.starts_at and timezone.now() < self.starts_at)

    @property
    def is_exhausted(self):
        return bool(self.usage_limit is not None and self.times_redeemed >= self.usage_limit)

    def is_live(self):
        """True when the coupon may currently be redeemed by someone."""
        return (
            self.is_active
            and not self.is_expired
            and not self.is_scheduled
            and not self.is_exhausted
        )

    def applies_to_course(self, course):
        if self.applies_to_all:
            return True
        return self.courses.filter(pk=course.pk).exists()

    def compute_discount(self, amount):
        """Return the discount amount (never more than ``amount``)."""
        amount = _money(amount)
        if self.discount_type == self.DISCOUNT_PERCENT:
            discount = amount * (Decimal(str(self.discount_value)) / Decimal('100'))
            if self.max_discount_amount:
                discount = min(discount, Decimal(str(self.max_discount_amount)))
        else:
            discount = Decimal(str(self.discount_value))
        discount = _money(discount)
        return min(discount, amount)


class CouponRedemption(models.Model):
    """A single successful use of a coupon by a student for a course."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='coupon_redemptions'
    )
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='redemptions')
    student = models.ForeignKey(
        'users.StudentProfile', on_delete=models.CASCADE, related_name='coupon_redemptions'
    )
    course = models.ForeignKey('exams.Course', on_delete=models.CASCADE, related_name='coupon_redemptions')
    order = models.ForeignKey(
        'payments.PaymentOrder', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='coupon_redemptions'
    )

    original_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Coupon Redemption'
        verbose_name_plural = 'Coupon Redemptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['coupon', 'student']),
        ]

    def __str__(self):
        return f'{self.coupon_id}:{self.student_id}'


class PromoBanner(models.Model):
    """A sitewide announcement strip advertising a running promotion."""

    THEME_CHOICES = [
        ('sunset', 'Sunset (orange → pink)'),
        ('ocean', 'Ocean (blue → cyan)'),
        ('forest', 'Forest (green → teal)'),
        ('royal', 'Royal (indigo → violet)'),
        ('midnight', 'Midnight (slate → black)'),
        ('custom', 'Custom colours'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='promo_banners'
    )

    title = models.CharField(max_length=120, blank=True, default='')
    message = models.CharField(max_length=255)
    cta_label = models.CharField(max_length=40, blank=True, default='')
    cta_url = models.CharField(max_length=500, blank=True, default='')

    # Optionally advertise a coupon's code directly in the banner.
    coupon = models.ForeignKey(
        Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='banners'
    )

    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='sunset')
    # Used only when theme == 'custom'.
    bg_color = models.CharField(max_length=7, blank=True, default='')
    text_color = models.CharField(max_length=7, blank=True, default='')

    dismissible = models.BooleanField(default=True)
    is_active = models.BooleanField(default=False)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Promo Banner'
        verbose_name_plural = 'Promo Banners'
        ordering = ['-updated_at']

    def __str__(self):
        return self.message[:40]

    def is_live(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.starts_at and now < self.starts_at:
            return False
        if self.ends_at and now > self.ends_at:
            return False
        return True

    def clean(self):
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError({'ends_at': 'End date must be after the start date.'})
