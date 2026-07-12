"""Shared payment services — granting enrolment once a payment is confirmed."""
from django.db import transaction
from django.utils import timezone

from users.models import CourseEnrollment

from .models import PaymentOrder


@transaction.atomic
def mark_order_paid(order: PaymentOrder, provider_payment_id: str = '') -> PaymentOrder:
    """Mark ``order`` paid and grant an approved enrolment (idempotent).

    Safe to call multiple times (client return **and** webhook may both fire):
    the enrolment is created-or-updated and the order is only transitioned once.
    """
    order = PaymentOrder.objects.select_for_update().get(pk=order.pk)
    if provider_payment_id and not order.provider_payment_id:
        order.provider_payment_id = provider_payment_id

    enrollment, _created = CourseEnrollment.objects.get_or_create(
        student=order.student,
        course=order.course,
        defaults={'status': 'approved', 'is_active': True},
    )
    # Confirm/repair the enrolment regardless of prior state.
    if enrollment.status != 'approved' or not enrollment.is_active:
        enrollment.status = 'approved'
        enrollment.is_active = True
        enrollment.rejection_reason = ''
        enrollment.reviewed_at = timezone.now()
        enrollment.save(update_fields=[
            'status', 'is_active', 'rejection_reason', 'reviewed_at', 'updated_at',
        ])

    order.enrollment = enrollment
    if order.status != PaymentOrder.STATUS_PAID:
        order.status = PaymentOrder.STATUS_PAID
    order.save(update_fields=['status', 'provider_payment_id', 'enrollment', 'updated_at'])
    return order
