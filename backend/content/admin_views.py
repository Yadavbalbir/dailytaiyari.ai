"""
Admin CRUD view for Content in the Content Builder.
Tenant-admin only, scoped via the subject's course tenant.
"""
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

from exams.admin_views import TenantAdminModelViewSet
from .models import Content
from .admin_serializers import AdminContentSerializer


class AdminContentViewSet(TenantAdminModelViewSet):
    queryset = Content.objects.select_related('topic', 'subject').all()
    serializer_class = AdminContentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['topic', 'subject', 'content_type', 'difficulty', 'status', 'is_free']
    search_fields = ['title', 'description']
    ordering_fields = ['order', 'created_at', 'views_count', 'title']
    ordering = ['order', '-created_at']
    tenant_lookup = 'subject__course__tenant'
