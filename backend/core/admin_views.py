"""Tenant-admin settings endpoints (branding + feature toggles).

Scoped to the current tenant resolved by ``TenantMiddleware`` from the
``X-Tenant-ID`` header, and restricted to users with the ``admin`` role.
"""
from rest_framework import generics, permissions, parsers
from rest_framework.exceptions import NotFound

from core.permissions import IsTenantAdmin
from .admin_serializers import TenantSettingsSerializer


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
