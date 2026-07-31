"""Super-admin dashboard URLs.

Mounted under a tenant-exempt path (``/api/v1/superadmin/``) so no
``X-Tenant-ID`` header is required — super admins are tenant-less. Every view is
gated by :class:`core.permissions.IsSuperAdmin`.
"""
from django.urls import path

from .superadmin_views import (
    SuperAdminLoginView,
    SuperAdminMeView,
    PlatformStatsView,
    TenantListCreateView,
    TenantDetailView,
    AuditLogListView,
)

urlpatterns = [
    path('auth/login/', SuperAdminLoginView.as_view(), name='superadmin-login'),
    path('auth/me/', SuperAdminMeView.as_view(), name='superadmin-me'),
    path('stats/', PlatformStatsView.as_view(), name='superadmin-stats'),
    path('tenants/', TenantListCreateView.as_view(), name='superadmin-tenant-list'),
    path('tenants/<uuid:pk>/', TenantDetailView.as_view(), name='superadmin-tenant-detail'),
    path('audit-logs/', AuditLogListView.as_view(), name='superadmin-audit-logs'),
]
