"""Payment order models — one row per checkout attempt for a paid course.

A ``PaymentOrder`` is created when a student starts checkout for a paid course
(pay-to-enrol mode). It tracks the provider order id and moves to ``paid`` once
the payment is verified (via the client return **or** a provider webhook), at
which point an approved :class:`users.CourseEnrollment` is granted.
"""
import uuid

from django.db import models


class PaymentOrder(models.Model):
    STATUS_CREATED = 'created'
    STATUS_PAID = 'paid'
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_CREATED, 'Created'),
        (STATUS_PAID, 'Paid'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    PROVIDER_CHOICES = [
        ('razorpay', 'Razorpay'),
        ('cashfree', 'Cashfree'),
        ('payu', 'PayU'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='payment_orders'
    )
    student = models.ForeignKey(
        'users.StudentProfile', on_delete=models.CASCADE, related_name='payment_orders'
    )
    course = models.ForeignKey(
        'exams.Course', on_delete=models.CASCADE, related_name='payment_orders'
    )
    enrollment = models.ForeignKey(
        'users.CourseEnrollment', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payment_orders'
    )

    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    # Provider's order identifier (Razorpay order_id / Cashfree order_id).
    provider_order_id = models.CharField(max_length=255, db_index=True)
    # Set once a specific payment succeeds (Razorpay payment_id / Cashfree cf id).
    provider_payment_id = models.CharField(max_length=255, blank=True, default='')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CREATED, db_index=True
    )
    is_test_mode = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Payment Order'
        verbose_name_plural = 'Payment Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider', 'provider_order_id']),
            models.Index(fields=['tenant', 'status']),
        ]

    def __str__(self):
        return f'{self.provider}:{self.provider_order_id} ({self.status})'

    @property
    def is_paid(self):
        return self.status == self.STATUS_PAID
