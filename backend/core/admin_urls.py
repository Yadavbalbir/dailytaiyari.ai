"""Tenant-admin URLs — branding + feature toggles.

Mounted under a non-tenant-exempt path so ``TenantMiddleware`` resolves the
current tenant from the ``X-Tenant-ID`` header before the view runs.
"""
from django.urls import path

from .admin_views import TenantSettingsView

urlpatterns = [
    path('settings/', TenantSettingsView.as_view(), name='tenant-admin-settings'),
]
