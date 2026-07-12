"""Payment provider clients (Razorpay & Cashfree).

Thin wrappers over each provider's REST API using ``requests`` (already a
dependency) so we avoid pulling in provider-specific SDKs. Each client is built
from a tenant's :class:`core.models.PaymentGateway` and exposes a uniform
interface used by the payment views:

    client = get_client(gateway)
    order = client.create_order(amount, currency, receipt, notes, customer)
    ok    = client.verify_return(payload)          # client-side return verify
    ok    = client.verify_webhook(raw_body, headers)
    paid  = client.is_order_paid(provider_order_id) # authoritative status check
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json

import requests

TIMEOUT = 20


class PaymentError(Exception):
    """Raised when a provider call fails or a payload cannot be verified."""


# ---------------------------------------------------------------------------
# Razorpay
# ---------------------------------------------------------------------------
class RazorpayClient:
    provider = 'razorpay'
    BASE = 'https://api.razorpay.com/v1'

    def __init__(self, gateway):
        self.gateway = gateway
        self.key_id = gateway.key_id
        self.key_secret = gateway.key_secret
        self.webhook_secret = gateway.webhook_secret

    def _auth(self):
        return (self.key_id, self.key_secret)

    def create_order(self, amount, currency, receipt, notes=None, customer=None):
        """Create a Razorpay order. ``amount`` is a Decimal in major units."""
        payload = {
            # Razorpay expects the smallest currency unit (paise for INR).
            'amount': int(round(float(amount) * 100)),
            'currency': currency or 'INR',
            'receipt': receipt[:40],
            'notes': notes or {},
        }
        try:
            resp = requests.post(
                f'{self.BASE}/orders', json=payload, auth=self._auth(), timeout=TIMEOUT
            )
        except requests.RequestException as exc:
            raise PaymentError(f'Razorpay order creation failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'Razorpay error: {resp.text}')
        data = resp.json()
        return {
            'provider': self.provider,
            'provider_order_id': data['id'],
            'amount': amount,
            'currency': payload['currency'],
            # Everything the frontend checkout.js needs to open the modal.
            'checkout': {
                'provider': self.provider,
                'key_id': self.key_id,
                'order_id': data['id'],
                'amount': payload['amount'],
                'currency': payload['currency'],
            },
        }

    def verify_return(self, payload):
        """Verify the browser return payload's HMAC signature.

        Razorpay signs ``{order_id}|{payment_id}`` with the key secret.
        """
        order_id = payload.get('razorpay_order_id') or payload.get('order_id')
        payment_id = payload.get('razorpay_payment_id') or payload.get('payment_id')
        signature = payload.get('razorpay_signature') or payload.get('signature')
        if not (order_id and payment_id and signature):
            return False, ''
        expected = hmac.new(
            self.key_secret.encode(), f'{order_id}|{payment_id}'.encode(),
            hashlib.sha256,
        ).hexdigest()
        if hmac.compare_digest(expected, signature):
            return True, payment_id
        return False, ''

    def verify_webhook(self, raw_body, headers):
        """Verify a Razorpay webhook using the dedicated webhook secret."""
        signature = headers.get('X-Razorpay-Signature') or headers.get('x-razorpay-signature')
        if not signature or not self.webhook_secret:
            return False
        expected = hmac.new(
            self.webhook_secret.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    @staticmethod
    def parse_webhook(raw_body):
        """Return ``(order_id, payment_id, is_paid)`` from a webhook body."""
        try:
            event = json.loads(raw_body.decode() if isinstance(raw_body, bytes) else raw_body)
        except (ValueError, AttributeError):
            return None, '', False
        entity = (
            event.get('payload', {}).get('payment', {}).get('entity', {})
            or event.get('payload', {}).get('order', {}).get('entity', {})
        )
        order_id = entity.get('order_id') or entity.get('id')
        payment_id = entity.get('id') if entity.get('order_id') else ''
        etype = event.get('event', '')
        is_paid = etype in ('payment.captured', 'order.paid')
        return order_id, payment_id, is_paid

    def is_order_paid(self, provider_order_id):
        """Authoritatively check whether an order has a captured payment."""
        try:
            resp = requests.get(
                f'{self.BASE}/orders/{provider_order_id}/payments',
                auth=self._auth(), timeout=TIMEOUT,
            )
        except requests.RequestException as exc:
            raise PaymentError(f'Razorpay status check failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'Razorpay error: {resp.text}')
        items = resp.json().get('items', [])
        for pay in items:
            if pay.get('status') == 'captured':
                return True, pay.get('id', '')
        return False, ''


# ---------------------------------------------------------------------------
# Cashfree
# ---------------------------------------------------------------------------
class CashfreeClient:
    provider = 'cashfree'
    API_VERSION = '2023-08-01'

    def __init__(self, gateway):
        self.gateway = gateway
        self.app_id = gateway.key_id
        self.secret_key = gateway.key_secret
        self.webhook_secret = gateway.webhook_secret
        self.base = (
            'https://sandbox.cashfree.com/pg'
            if gateway.is_test_mode
            else 'https://api.cashfree.com/pg'
        )

    def _headers(self):
        return {
            'x-client-id': self.app_id,
            'x-client-secret': self.secret_key,
            'x-api-version': self.API_VERSION,
            'Content-Type': 'application/json',
        }

    def create_order(self, amount, currency, receipt, notes=None, customer=None):
        customer = customer or {}
        payload = {
            'order_id': receipt,
            'order_amount': float(round(float(amount), 2)),
            'order_currency': currency or 'INR',
            'customer_details': {
                'customer_id': str(customer.get('id', receipt))[:50],
                'customer_name': (customer.get('name') or 'Student')[:100],
                'customer_email': customer.get('email') or 'student@example.com',
                'customer_phone': customer.get('phone') or '9999999999',
            },
            'order_note': (notes or {}).get('note', '')[:200],
        }
        try:
            resp = requests.post(
                f'{self.base}/orders', json=payload, headers=self._headers(), timeout=TIMEOUT
            )
        except requests.RequestException as exc:
            raise PaymentError(f'Cashfree order creation failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'Cashfree error: {resp.text}')
        data = resp.json()
        return {
            'provider': self.provider,
            'provider_order_id': data.get('order_id', receipt),
            'amount': amount,
            'currency': payload['order_currency'],
            'checkout': {
                'provider': self.provider,
                'payment_session_id': data.get('payment_session_id'),
                'order_id': data.get('order_id', receipt),
                'mode': 'sandbox' if self.gateway.is_test_mode else 'production',
            },
        }

    def verify_return(self, payload):
        """Cashfree returns no client signature — confirm via authoritative status."""
        order_id = payload.get('order_id')
        if not order_id:
            return False, ''
        return self.is_order_paid(order_id)

    def verify_webhook(self, raw_body, headers):
        """Verify a Cashfree webhook: base64(HMAC-SHA256(secret, ts + rawBody))."""
        signature = headers.get('x-webhook-signature') or headers.get('X-Webhook-Signature')
        timestamp = headers.get('x-webhook-timestamp') or headers.get('X-Webhook-Timestamp')
        if not signature or not timestamp or not self.webhook_secret:
            return False
        body = raw_body.decode() if isinstance(raw_body, bytes) else raw_body
        signed = f'{timestamp}{body}'.encode()
        digest = hmac.new(self.secret_key.encode(), signed, hashlib.sha256).digest()
        expected = base64.b64encode(digest).decode()
        return hmac.compare_digest(expected, signature)

    @staticmethod
    def parse_webhook(raw_body):
        try:
            event = json.loads(raw_body.decode() if isinstance(raw_body, bytes) else raw_body)
        except (ValueError, AttributeError):
            return None, '', False
        data = event.get('data', {})
        order = data.get('order', {})
        payment = data.get('payment', {})
        order_id = order.get('order_id')
        payment_id = str(payment.get('cf_payment_id', '') or '')
        status = payment.get('payment_status', '')
        is_paid = status == 'SUCCESS' or event.get('type') == 'PAYMENT_SUCCESS_WEBHOOK'
        return order_id, payment_id, is_paid

    def is_order_paid(self, provider_order_id):
        try:
            resp = requests.get(
                f'{self.base}/orders/{provider_order_id}',
                headers=self._headers(), timeout=TIMEOUT,
            )
        except requests.RequestException as exc:
            raise PaymentError(f'Cashfree status check failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'Cashfree error: {resp.text}')
        data = resp.json()
        if data.get('order_status') == 'PAID':
            return True, ''
        return False, ''


def get_client(gateway):
    """Build the provider client for a tenant's gateway."""
    if gateway.provider == 'razorpay':
        return RazorpayClient(gateway)
    if gateway.provider == 'cashfree':
        return CashfreeClient(gateway)
    raise PaymentError(f'Unsupported provider: {gateway.provider}')
