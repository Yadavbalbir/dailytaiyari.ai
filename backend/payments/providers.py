"""Payment provider clients (Razorpay, Cashfree & PayU).

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
from urllib.parse import parse_qs

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

    def create_order(self, amount, currency, receipt, notes=None, customer=None,
                     return_url=None, callback_url=None):
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

    def refund(self, order, amount=None):
        """Refund a captured payment. Returns ``(refund_id, raw_response)``.

        ``amount`` is a Decimal in major units; ``None`` refunds the full amount.
        """
        payment_id = order.provider_payment_id
        if not payment_id:
            raise PaymentError('Razorpay payment id is missing; cannot refund.')
        payload = {}
        if amount is not None:
            payload['amount'] = int(round(float(amount) * 100))
        try:
            resp = requests.post(
                f'{self.BASE}/payments/{payment_id}/refund',
                json=payload, auth=self._auth(), timeout=TIMEOUT,
            )
        except requests.RequestException as exc:
            raise PaymentError(f'Razorpay refund failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'Razorpay refund error: {resp.text}')
        data = resp.json()
        return data.get('id', ''), data


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

    def create_order(self, amount, currency, receipt, notes=None, customer=None,
                     return_url=None, callback_url=None):
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

    def refund(self, order, amount=None):
        """Refund a Cashfree order. Returns ``(refund_id, raw_response)``."""
        order_id = order.provider_order_id
        if not order_id:
            raise PaymentError('Cashfree order id is missing; cannot refund.')
        refund_id = f'rfnd_{str(order.id).replace("-", "")[:20]}'
        amount_val = float(round(float(amount if amount is not None else order.amount), 2))
        payload = {
            'refund_amount': amount_val,
            'refund_id': refund_id,
            'refund_note': (order.refund_reason or 'Admin refund')[:200],
        }
        try:
            resp = requests.post(
                f'{self.base}/orders/{order_id}/refunds',
                json=payload, headers=self._headers(), timeout=TIMEOUT,
            )
        except requests.RequestException as exc:
            raise PaymentError(f'Cashfree refund failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'Cashfree refund error: {resp.text}')
        data = resp.json()
        return str(data.get('cf_refund_id', refund_id) or refund_id), data


# ---------------------------------------------------------------------------
# PayU (India)
# ---------------------------------------------------------------------------
class PayUClient:
    """PayU (India) uses a hash-signed form redirect rather than a JS modal.

    Checkout flow:
      1. ``create_order`` builds the ``_payment`` form params + a SHA-512 request
         hash. The browser POSTs the form straight to PayU's hosted page.
      2. PayU redirects the browser (POST) back to ``surl``/``furl`` — our
         :class:`payments.views.PayUCallbackView` — with a signed response.
      3. We verify the reverse hash, grant enrolment, and redirect the learner
         back to the app. PayU's server-to-server webhook posts the same signed
         payload, so the generic webhook endpoint works too.

    Credentials: ``key_id`` = Merchant Key, ``key_secret`` = Merchant Salt.
    """
    provider = 'payu'

    def __init__(self, gateway):
        self.gateway = gateway
        self.key = gateway.key_id          # PayU Merchant Key
        self.salt = gateway.key_secret     # PayU Merchant Salt (signs everything)
        if gateway.is_test_mode:
            self.payment_url = 'https://test.payu.in/_payment'
            self.verify_url = 'https://test.payu.in/merchant/postservice.php?form=2'
        else:
            self.payment_url = 'https://secure.payu.in/_payment'
            self.verify_url = 'https://info.payu.in/merchant/postservice.php?form=2'

    @staticmethod
    def _sha512(value):
        return hashlib.sha512(value.encode('utf-8')).hexdigest()

    @staticmethod
    def _clean(text):
        # PayU hashes these fields verbatim; a literal pipe would corrupt it.
        return (text or '').replace('|', ' ').strip()

    def _response_hash(self, p):
        """Reverse hash PayU signs the response/webhook with.

        ``salt|status|udf10|…|udf1|email|firstname|productinfo|amount|txnid|key``
        (prefixed with ``additionalCharges|`` when that field is present).
        """
        udfs = [p.get(f'udf{i}', '') or '' for i in range(10, 0, -1)]
        seq = [self.salt, p.get('status', '') or ''] + udfs + [
            p.get('email', '') or '',
            p.get('firstname', '') or '',
            p.get('productinfo', '') or '',
            p.get('amount', '') or '',
            p.get('txnid', '') or '',
            self.key,
        ]
        base = '|'.join(seq)
        additional = p.get('additionalCharges')
        if additional:
            base = f'{additional}|{base}'
        return self._sha512(base)

    def create_order(self, amount, currency, receipt, notes=None, customer=None,
                     return_url=None, callback_url=None):
        notes = notes or {}
        customer = customer or {}
        # PayU txnids must be unique & short; the order UUID (dashless) fits.
        txnid = receipt.replace('-', '')[:25]
        amount_str = f'{float(amount):.2f}'
        productinfo = self._clean(notes.get('note') or 'Course enrolment')[:100]
        firstname = self._clean(customer.get('name') or 'Student')[:60]
        email = customer.get('email') or 'student@example.com'
        phone = customer.get('phone') or '9999999999'
        # udf1 carries the app URL to return to; it's inside the hash → tamper-proof.
        udf1 = (return_url or '')[:255]
        udf2 = udf3 = udf4 = udf5 = ''

        # Request hash: key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||salt
        hash_seq = '|'.join([
            self.key, txnid, amount_str, productinfo, firstname, email,
            udf1, udf2, udf3, udf4, udf5, '', '', '', '', '', self.salt,
        ])
        request_hash = self._sha512(hash_seq)

        params = {
            'key': self.key,
            'txnid': txnid,
            'amount': amount_str,
            'productinfo': productinfo,
            'firstname': firstname,
            'email': email,
            'phone': phone,
            'surl': callback_url or '',
            'furl': callback_url or '',
            'hash': request_hash,
            'udf1': udf1,
        }
        return {
            'provider': self.provider,
            'provider_order_id': txnid,
            'amount': amount,
            'currency': currency or 'INR',
            'checkout': {
                'provider': self.provider,
                'action_url': self.payment_url,
                'params': params,
            },
        }

    def verify_return(self, payload):
        """Verify PayU's signed browser return (surl/furl POST)."""
        txnid = payload.get('txnid')
        posted = payload.get('hash')
        if not (txnid and posted):
            return False, ''
        expected = self._response_hash(payload)
        if not hmac.compare_digest(expected, posted):
            return False, ''
        status = (payload.get('status') or '').lower()
        if status == 'success':
            return True, str(payload.get('mihpayid', '') or '')
        return False, ''

    @staticmethod
    def _parse_body(raw_body):
        body = raw_body.decode() if isinstance(raw_body, bytes) else (raw_body or '')
        body = body.strip()
        if body.startswith('{'):
            try:
                return json.loads(body)
            except ValueError:
                return {}
        return {k: v[0] for k, v in parse_qs(body, keep_blank_values=True).items()}

    @staticmethod
    def parse_webhook(raw_body):
        p = PayUClient._parse_body(raw_body)
        txnid = p.get('txnid')
        payment_id = str(p.get('mihpayid', '') or '')
        is_paid = (p.get('status') or '').lower() == 'success'
        return txnid, payment_id, is_paid

    def verify_webhook(self, raw_body, headers):
        """PayU's S2S webhook posts the same signed payload as the return."""
        p = self._parse_body(raw_body)
        posted = p.get('hash')
        if not posted:
            return False
        expected = self._response_hash(p)
        return hmac.compare_digest(expected, posted)

    def is_order_paid(self, provider_order_id):
        """Authoritatively confirm a txn via PayU's verify_payment API."""
        command = 'verify_payment'
        var1 = provider_order_id
        hash_str = '|'.join([self.key, command, var1, self.salt])
        data = {
            'key': self.key,
            'command': command,
            'var1': var1,
            'hash': self._sha512(hash_str),
        }
        try:
            resp = requests.post(self.verify_url, data=data, timeout=TIMEOUT)
        except requests.RequestException as exc:
            raise PaymentError(f'PayU status check failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'PayU error: {resp.text}')
        try:
            body = resp.json()
        except ValueError as exc:
            raise PaymentError('PayU returned a non-JSON verify response') from exc
        details = (body.get('transaction_details') or {}).get(var1, {})
        if (details.get('status') or '').lower() == 'success':
            return True, str(details.get('mihpayid', '') or '')
        return False, ''

    def refund(self, order, amount=None):
        """Refund a PayU transaction via ``cancel_refund_transaction``.

        Returns ``(refund_request_id, raw_response)``. Uses the stored
        ``mihpayid`` (provider payment id) and a unique refund token.
        """
        mihpayid = order.provider_payment_id
        if not mihpayid:
            raise PaymentError('PayU payment id (mihpayid) is missing; cannot refund.')
        command = 'cancel_refund_transaction'
        token = str(order.id).replace('-', '')[:25]
        amount_str = f'{float(amount if amount is not None else order.amount):.2f}'
        hash_str = '|'.join([self.key, command, mihpayid, self.salt])
        data = {
            'key': self.key,
            'command': command,
            'var1': mihpayid,
            'var2': token,
            'var3': amount_str,
            'hash': self._sha512(hash_str),
        }
        try:
            resp = requests.post(self.verify_url, data=data, timeout=TIMEOUT)
        except requests.RequestException as exc:
            raise PaymentError(f'PayU refund failed: {exc}') from exc
        if resp.status_code >= 300:
            raise PaymentError(f'PayU refund error: {resp.text}')
        try:
            body = resp.json()
        except ValueError as exc:
            raise PaymentError('PayU returned a non-JSON refund response') from exc
        if str(body.get('status')) not in ('1', 'success', 'True'):
            raise PaymentError(f'PayU refund rejected: {body.get("msg") or body}')
        return str(body.get('request_id', token) or token), body


def get_client(gateway):
    """Build the provider client for a tenant's gateway."""
    if gateway.provider == 'razorpay':
        return RazorpayClient(gateway)
    if gateway.provider == 'cashfree':
        return CashfreeClient(gateway)
    if gateway.provider == 'payu':
        return PayUClient(gateway)
    raise PaymentError(f'Unsupported provider: {gateway.provider}')
