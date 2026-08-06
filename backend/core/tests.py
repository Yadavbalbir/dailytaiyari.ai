"""Tests for tenant isolation.

The ``X-Tenant-ID`` header is supplied by the client, so it can only be trusted
once it has been checked against the caller's own account. These tests pin that
behaviour down: a regression here silently exposes one academy's data to
another, which is the single worst failure mode this platform has.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Tenant
from users.models import User

PROBE_PATH = '/api/v1/auth/profile/'


class TenantIsolationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tenant_a = Tenant.objects.create(name='Academy A', is_active=True)
        cls.tenant_b = Tenant.objects.create(name='Academy B', is_active=True)

        cls.user_a = User.objects.create_user(
            email='a@example.com', password='pw-a-12345', tenant=cls.tenant_a
        )
        cls.user_b = User.objects.create_user(
            email='b@example.com', password='pw-b-12345', tenant=cls.tenant_b
        )
        cls.superuser = User.objects.create_superuser(
            email='root@example.com', password='pw-root-12345'
        )

    def client_for(self, user):
        client = APIClient()
        if user is not None:
            token = RefreshToken.for_user(user).access_token
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def get(self, user, tenant, path=PROBE_PATH):
        return self.client_for(user).get(path, HTTP_X_TENANT_ID=str(tenant.id))

    def test_user_can_access_own_tenant(self):
        response = self.get(self.user_a, self.tenant_a)
        self.assertEqual(response.status_code, 200)

    def test_user_cannot_access_another_tenant(self):
        """The core guarantee: a valid login for A must not unlock B."""
        response = self.get(self.user_a, self.tenant_b)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['code'], 'tenant_mismatch')

    def test_rejection_is_mutual(self):
        response = self.get(self.user_b, self.tenant_a)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['code'], 'tenant_mismatch')

    def test_tenant_header_is_required(self):
        response = self.client_for(self.user_a).get(PROBE_PATH)
        self.assertEqual(response.status_code, 403)

    def test_unknown_tenant_is_rejected(self):
        response = self.client_for(self.user_a).get(
            PROBE_PATH, HTTP_X_TENANT_ID='2b1f1d8e-0000-4000-8000-000000000000'
        )
        self.assertEqual(response.status_code, 403)

    def test_malformed_tenant_header_is_rejected(self):
        response = self.client_for(self.user_a).get(PROBE_PATH, HTTP_X_TENANT_ID='not-a-uuid')
        self.assertEqual(response.status_code, 403)

    def test_superuser_is_not_pinned_to_a_tenant(self):
        """Platform operators are tenant-less by design and must stay unblocked."""
        for tenant in (self.tenant_a, self.tenant_b):
            response = self.get(self.superuser, tenant)
            self.assertEqual(response.status_code, 200)

    def test_anonymous_requests_are_not_treated_as_a_mismatch(self):
        """Public endpoints have no user to check; they must fail as 401, not 403."""
        response = self.get(None, self.tenant_a)
        self.assertEqual(response.status_code, 401)

    def test_inactive_tenant_is_rejected(self):
        self.tenant_a.is_active = False
        self.tenant_a.save(update_fields=['is_active'])
        try:
            response = self.get(self.user_a, self.tenant_a)
            self.assertEqual(response.status_code, 403)
        finally:
            self.tenant_a.is_active = True
            self.tenant_a.save(update_fields=['is_active'])
