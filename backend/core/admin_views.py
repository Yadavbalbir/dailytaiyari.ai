"""Tenant-admin settings endpoints (branding + feature toggles + payments).

Scoped to the current tenant resolved by ``TenantMiddleware`` from the
``X-Tenant-ID`` header, and restricted to users with the ``admin`` role.
"""
from rest_framework import generics, permissions, parsers
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from core.permissions import IsTenantAdmin
from .models import PaymentGateway
from .admin_serializers import TenantSettingsSerializer, PaymentGatewaySerializer


class TenantSettingsView(generics.RetrieveUpdateAPIView):
    """GET / PATCH the current tenant's branding and feature toggles.

    Accepts multipart (for logo uploads) as well as JSON (for feature toggles).
    """
    serializer_class = TenantSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    parser_classes = [
        parsers.MultiPartParser,
        parsers.FormParser,
        parsers.JSONParser,
    ]

    def get_object(self):
        tenant = getattr(self.request, 'tenant', None)
        if tenant is None:
            raise NotFound('No tenant is associated with this request.')
        return tenant


class PaymentGatewayView(generics.GenericAPIView):
    """Manage the current tenant's payment gateway credentials.

    * ``GET``    — current config (secret never returned; ``has_secret`` flag only).
    * ``PUT``    — create or upsert the gateway for this tenant.
    * ``DELETE`` — remove the stored gateway entirely.
    """
    serializer_class = PaymentGatewaySerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def _tenant(self):
        tenant = getattr(self.request, 'tenant', None)
        if tenant is None:
            raise NotFound('No tenant is associated with this request.')
        return tenant

    def _get_gateway(self):
        return PaymentGateway.objects.filter(tenant=self._tenant()).first()

    def get(self, request, *args, **kwargs):
        gateway = self._get_gateway()
        if gateway is None:
            return Response({'configured': False})
        return Response(self.get_serializer(gateway).data)

    def put(self, request, *args, **kwargs):
        tenant = self._tenant()
        gateway = self._get_gateway()
        serializer = self.get_serializer(
            gateway, data=request.data, partial=gateway is not None
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=tenant)
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        gateway = self._get_gateway()
        if gateway is not None:
            gateway.delete()
        return Response({'configured': False})
