"""Tenant-admin sales dashboard — orders, summary, refunds, access control.

All endpoints are scoped to the tenant resolved by ``TenantMiddleware`` from the
``X-Tenant-ID`` header and restricted to users with the ``admin`` role.
"""
import logging
from datetime import datetime, time

from django.db import transaction
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import PaymentGateway
from core.permissions import IsTenantAdmin

from .admin_serializers import AdminPaymentOrderSerializer
from .models import PaymentOrder
from .providers import get_client, PaymentError

logger = logging.getLogger(__name__)


def _tenant_or_404(request):
    tenant = getattr(request, 'tenant', None)
    if tenant is None:
        raise NotFound('No tenant is associated with this request.')
    return tenant


def _apply_filters(qs, params):
    """Apply the shared sales filters (status/provider/course/date/search)."""
    status_filter = params.get('status')
    if status_filter and status_filter != 'all':
        qs = qs.filter(status=status_filter)

    provider = params.get('provider')
    if provider and provider != 'all':
        qs = qs.filter(provider=provider)

    course = params.get('course')
    if course and course != 'all':
        qs = qs.filter(course_id=course)

    date_from = params.get('date_from')
    if date_from:
        parsed = parse_date(date_from)
        if parsed:
            qs = qs.filter(created_at__gte=timezone.make_aware(
                datetime.combine(parsed, time.min)))

    date_to = params.get('date_to')
    if date_to:
        parsed = parse_date(date_to)
        if parsed:
            qs = qs.filter(created_at__lte=timezone.make_aware(
                datetime.combine(parsed, time.max)))

    search = (params.get('search') or '').strip()
    if search:
        qs = qs.filter(
            Q(student__user__email__icontains=search)
            | Q(student__user__first_name__icontains=search)
            | Q(student__user__last_name__icontains=search)
            | Q(course__name__icontains=search)
            | Q(provider_order_id__icontains=search)
            | Q(provider_payment_id__icontains=search)
        )
    return qs


class SalesOrderListView(generics.ListAPIView):
    """Paginated, filterable list of the tenant's payment orders."""
    serializer_class = AdminPaymentOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get_queryset(self):
        tenant = _tenant_or_404(self.request)
        qs = (
            PaymentOrder.objects
            .filter(tenant=tenant)
            .select_related('student__user', 'course', 'enrollment', 'refunded_by')
            .order_by('-created_at')
        )
        return _apply_filters(qs, self.request.query_params)


class SalesSummaryView(APIView):
    """Aggregate sales figures over the same filters as the orders list."""
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get(self, request):
        tenant = _tenant_or_404(request)
        qs = _apply_filters(
            PaymentOrder.objects.filter(tenant=tenant), request.query_params
        )

        paid = qs.filter(status=PaymentOrder.STATUS_PAID)
        refunded = qs.filter(status=PaymentOrder.STATUS_REFUNDED)

        total_sales = paid.aggregate(s=Sum('amount'))['s'] or 0
        refunded_total = refunded.aggregate(s=Sum('refund_amount'))['s'] or 0

        by_status = {
            row['status']: {'count': row['c'], 'amount': row['a'] or 0}
            for row in qs.values('status').annotate(c=Count('id'), a=Sum('amount'))
        }

        by_provider = [
            {
                'provider': row['provider'],
                'count': row['c'],
                'amount': row['a'] or 0,
            }
            for row in paid.values('provider').annotate(
                c=Count('id'), a=Sum('amount')).order_by('-a')
        ]

        by_course = [
            {
                'course_id': str(row['course_id']),
                'course_name': row['course__name'],
                'course_code': row['course__code'],
                'count': row['c'],
                'amount': row['a'] or 0,
            }
            for row in paid.values('course_id', 'course__name', 'course__code')
            .annotate(c=Count('id'), a=Sum('amount')).order_by('-a')
        ]

        return Response({
            'total_sales': total_sales,
            'refunded_total': refunded_total,
            'currency': 'INR',
            'counts': {
                'total_orders': qs.count(),
                'paid': paid.count(),
                'refunded': refunded.count(),
                'failed': qs.filter(status=PaymentOrder.STATUS_FAILED).count(),
                'created': qs.filter(status=PaymentOrder.STATUS_CREATED).count(),
            },
            'by_status': by_status,
            'by_provider': by_provider,
            'by_course': by_course,
        })


class RefundOrderView(APIView):
    """Refund a paid order via the provider API, then revoke course access."""
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def post(self, request, pk):
        tenant = _tenant_or_404(request)
        order = (
            PaymentOrder.objects
            .select_related('student', 'course', 'enrollment')
            .filter(tenant=tenant, pk=pk).first()
        )
        if order is None:
            raise NotFound('Order not found.')
        if order.status == PaymentOrder.STATUS_REFUNDED:
            return Response({'detail': 'Order is already refunded.'}, status=400)
        if order.status != PaymentOrder.STATUS_PAID:
            return Response({'detail': 'Only paid orders can be refunded.'}, status=400)

        gateway = PaymentGateway.objects.filter(
            tenant=tenant, provider=order.provider
        ).first()
        if gateway is None or not gateway.is_configured:
            return Response(
                {'detail': f'No configured {order.provider} gateway to process the refund.'},
                status=400,
            )

        reason = (request.data.get('reason') or 'Refunded by admin')[:255]
        # Optional partial amount; defaults to a full refund.
        amount = request.data.get('amount')
        try:
            amount = order.amount if amount in (None, '') else round(float(amount), 2)
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid refund amount.'}, status=400)

        order.refund_reason = reason
        client = get_client(gateway)
        try:
            refund_id, _raw = client.refund(order, amount)
        except PaymentError as exc:
            logger.warning('Refund failed for order %s: %s', order.pk, exc)
            return Response({'detail': str(exc)}, status=502)

        with transaction.atomic():
            order = PaymentOrder.objects.select_for_update().get(pk=order.pk)
            order.status = PaymentOrder.STATUS_REFUNDED
            order.provider_refund_id = refund_id
            order.refund_amount = amount
            order.refund_reason = reason
            order.refunded_at = timezone.now()
            order.refunded_by = request.user
            order.save(update_fields=[
                'status', 'provider_refund_id', 'refund_amount', 'refund_reason',
                'refunded_at', 'refunded_by', 'updated_at',
            ])
            _revoke_enrollment(order, reason=f'Payment refunded: {reason}')

        return Response(AdminPaymentOrderSerializer(order).data)


def _revoke_enrollment(order, reason=''):
    """Deactivate the enrolment tied to an order (blocks course access)."""
    enrollment = order.enrollment
    if enrollment is None:
        return
    enrollment.is_active = False
    enrollment.status = 'rejected'
    enrollment.rejection_reason = (reason or 'Access revoked by admin')[:255]
    enrollment.save(update_fields=[
        'is_active', 'status', 'rejection_reason', 'updated_at',
    ])


class RevokeAccessView(APIView):
    """Revoke (or restore) the course access granted by an order's enrolment."""
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def post(self, request, pk):
        tenant = _tenant_or_404(request)
        order = (
            PaymentOrder.objects
            .select_related('enrollment', 'student', 'course')
            .filter(tenant=tenant, pk=pk).first()
        )
        if order is None:
            raise NotFound('Order not found.')
        if order.enrollment is None:
            return Response({'detail': 'No enrolment is linked to this order.'}, status=400)

        restore = bool(request.data.get('restore'))
        enrollment = order.enrollment
        if restore:
            enrollment.is_active = True
            enrollment.status = 'approved'
            enrollment.rejection_reason = ''
            enrollment.reviewed_at = timezone.now()
            enrollment.reviewed_by = request.user
            enrollment.save(update_fields=[
                'is_active', 'status', 'rejection_reason', 'reviewed_at',
                'reviewed_by', 'updated_at',
            ])
        else:
            reason = (request.data.get('reason') or 'Access revoked by admin')[:255]
            _revoke_enrollment(order, reason=reason)

        order.refresh_from_db()
        return Response(AdminPaymentOrderSerializer(order).data)
