"""Coupon validation and redemption services.

These helpers are the single source of truth for whether a coupon may be
applied to a given course purchase and for how much. The checkout flow calls
:func:`validate_coupon` before creating a payment order and
:func:`record_redemption` once the order is paid.
"""
from decimal import Decimal

from django.db import transaction
from django.db.models import F

from .models import Coupon, CouponRedemption


class CouponError(Exception):
    """Raised when a coupon cannot be applied. ``message`` is user-safe."""

    def __init__(self, message):
        super().__init__(message)
        self.message = message


def _money(value):
    return Decimal(str(value or 0)).quantize(Decimal('0.01'))


def get_coupon(tenant, code):
    """Return the tenant's coupon for ``code`` (case-insensitive) or None."""
    if not code:
        return None
    return Coupon.objects.filter(
        tenant=tenant, code=(code or '').strip().upper()
    ).first()


def validate_coupon(tenant, code, course, student=None):
    """Validate ``code`` for buying ``course`` and return a quote dict.

    Returns ``{coupon, original_amount, discount_amount, final_amount, currency}``.
    Raises :class:`CouponError` with a user-safe message when invalid.
    """
    coupon = get_coupon(tenant, code)
    if coupon is None:
        raise CouponError('This coupon code is not valid.')

    if not coupon.is_active:
        raise CouponError('This coupon is no longer active.')
    if coupon.is_scheduled:
        raise CouponError('This coupon is not active yet.')
    if coupon.is_expired:
        raise CouponError('This coupon has expired.')
    if coupon.is_exhausted:
        raise CouponError('This coupon has reached its usage limit.')

    if not coupon.applies_to_course(course):
        raise CouponError('This coupon does not apply to this course.')

    original = _money(course.price)
    if original <= 0:
        raise CouponError('This course is free — no coupon needed.')

    if coupon.min_order_amount and original < _money(coupon.min_order_amount):
        raise CouponError(
            f'Minimum order of {coupon.min_order_amount} required for this coupon.'
        )

    # Per-user usage limit.
    if student is not None and coupon.per_user_limit:
        used = CouponRedemption.objects.filter(coupon=coupon, student=student).count()
        if used >= coupon.per_user_limit:
            raise CouponError('You have already used this coupon.')

    discount = coupon.compute_discount(original)
    final = _money(original - discount)

    return {
        'coupon': coupon,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_value': coupon.discount_value,
        'original_amount': original,
        'discount_amount': discount,
        'final_amount': final,
        'currency': course.currency,
    }


@transaction.atomic
def record_redemption(coupon, student, course, order, quote):
    """Persist a redemption and bump the coupon counter (idempotent per order).

    Safe to call from the paid-order path which may fire more than once.
    """
    if order is not None and CouponRedemption.objects.filter(
        coupon=coupon, order=order
    ).exists():
        return None

    redemption = CouponRedemption.objects.create(
        tenant=coupon.tenant,
        coupon=coupon,
        student=student,
        course=course,
        order=order,
        original_amount=quote['original_amount'],
        discount_amount=quote['discount_amount'],
        final_amount=quote['final_amount'],
        currency=quote.get('currency', 'INR'),
    )
    Coupon.objects.filter(pk=coupon.pk).update(times_redeemed=F('times_redeemed') + 1)
    return redemption
