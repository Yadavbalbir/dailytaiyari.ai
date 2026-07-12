"""Payment API — create order, verify a return, and receive provider webhooks.

Flow (paid course, pay-to-enrol mode):
  1. ``POST /payments/orders/``            → create a provider order + checkout params
  2. ``POST /payments/orders/<id>/verify/`` → verify the browser return, grant enrolment
  3. ``POST /payments/webhook/<provider>/`` → authoritative confirmation (no auth/tenant)
"""
import logging

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import PaymentGateway
from exams.models import Course
from users.models import CourseEnrollment

from .models import PaymentOrder
from .providers import get_client, PaymentError
from .serializers import PaymentOrderSerializer
from .services import mark_order_paid

logger = logging.getLogger(__name__)


def _active_gateway(tenant):
    try:
        gateway = tenant.payment_gateway
    except PaymentGateway.DoesNotExist:
        return None
    if gateway and gateway.is_active and gateway.is_configured:
        return gateway
    return None


class CreateOrderView(APIView):
    """Create a payment order for a paid course in pay-to-enrol mode."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return Response({'detail': 'Tenant required.'}, status=403)

        student = getattr(request.user, 'profile', None)
        if student is None:
            return Response({'detail': 'Only students can enrol.'}, status=403)

        course_id = request.data.get('course')
        course = Course.objects.filter(id=course_id, tenant=tenant).first()
        if course is None:
            return Response({'detail': 'Course not found.'}, status=404)

        # Already enrolled? Nothing to pay for.
        existing = CourseEnrollment.objects.filter(student=student, course=course).first()
        if existing and existing.status == 'approved':
            return Response({'detail': 'You are already enrolled.'}, status=400)

        if tenant.enroll_mode_for(course) != 'payment':
            return Response(
                {'detail': 'This course does not require payment to enrol.'},
                status=400,
            )

        gateway = _active_gateway(tenant)
        if gateway is None:
            return Response({'detail': 'No active payment gateway.'}, status=400)

        client = get_client(gateway)
        user = request.user
        # Provider order ids must be unique; a fresh PaymentOrder id works as the
        # receipt/order_id for both providers.
        pending = PaymentOrder(
            tenant=tenant, student=student, course=course,
            provider=gateway.provider, amount=course.price,
            currency=course.currency, is_test_mode=gateway.is_test_mode,
        )
        receipt = str(pending.id)
        try:
            result = client.create_order(
                amount=course.price,
                currency=course.currency,
                receipt=receipt,
                notes={'note': f'Enrolment: {course.name}'[:200], 'course_id': str(course.id)},
                customer={
                    'id': str(student.id),
                    'name': getattr(user, 'full_name', '') or user.email,
                    'email': user.email,
                    'phone': getattr(user, 'phone', '') or '',
                },
            )
        except PaymentError as exc:
            logger.warning('Payment order creation failed: %s', exc)
            return Response({'detail': 'Could not start payment. Try again later.'}, status=502)

        pending.provider_order_id = result['provider_order_id']
        pending.save()

        return Response(
            {
                'order': PaymentOrderSerializer(pending).data,
                'checkout': result['checkout'],
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyOrderView(APIView):
    """Verify the browser return payload and grant enrolment on success."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        tenant = getattr(request, 'tenant', None)
        student = getattr(request.user, 'profile', None)
        order = PaymentOrder.objects.filter(
            id=pk, tenant=tenant, student=student
        ).select_related('course').first()
        if order is None:
            return Response({'detail': 'Order not found.'}, status=404)

        if order.is_paid:
            return Response({'status': 'paid', 'enrolled': True})

        gateway = _active_gateway(tenant)
        if gateway is None:
            return Response({'detail': 'No active payment gateway.'}, status=400)

        client = get_client(gateway)
        payload = dict(request.data)
        payload.setdefault('order_id', order.provider_order_id)
        try:
            ok, payment_id = client.verify_return(payload)
        except PaymentError as exc:
            logger.warning('Payment verification failed: %s', exc)
            return Response({'detail': 'Verification failed. Please try again.'}, status=502)

        if not ok:
            return Response({'status': 'pending', 'enrolled': False}, status=202)

        mark_order_paid(order, provider_payment_id=payment_id)
        return Response({'status': 'paid', 'enrolled': True})


@method_decorator(csrf_exempt, name='dispatch')
class WebhookView(APIView):
    """Provider webhook receiver. No auth/tenant header — resolved from the order."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, provider):
        raw_body = request.body
        if provider == 'razorpay':
            from .providers import RazorpayClient as _Cls
        elif provider == 'cashfree':
            from .providers import CashfreeClient as _Cls
        else:
            return Response({'detail': 'Unknown provider.'}, status=404)

        order_id, payment_id, is_paid = _Cls.parse_webhook(raw_body)
        if not order_id:
            return Response({'detail': 'Ignored.'}, status=200)

        order = PaymentOrder.objects.filter(
            provider=provider, provider_order_id=order_id
        ).select_related('tenant').first()
        if order is None:
            # Unknown order — ack so the provider stops retrying.
            return Response({'detail': 'Ignored.'}, status=200)

        gateway = _active_gateway(order.tenant)
        if gateway is None:
            return Response({'detail': 'Ignored.'}, status=200)

        client = get_client(gateway)
        if not client.verify_webhook(raw_body, request.headers):
            return Response({'detail': 'Invalid signature.'}, status=400)

        if is_paid:
            mark_order_paid(order, provider_payment_id=payment_id)
        return Response({'detail': 'ok'}, status=200)
