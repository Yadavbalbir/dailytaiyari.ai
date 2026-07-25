"""Admin/instructor authoring for live classes."""
from exams.admin_views import TenantAdminModelViewSet

from .models import LiveClass
from .admin_serializers import AdminLiveClassSerializer


class AdminLiveClassViewSet(TenantAdminModelViewSet):
    queryset = LiveClass.objects.select_related('course', 'subject', 'topic').all()
    serializer_class = AdminLiveClassSerializer
    search_fields = ['title']
    ordering_fields = ['order', 'created_at', 'title', 'scheduled_start']
    ordering = ['order', '-created_at']
    filterset_fields = ['course', 'subject', 'topic', 'status', 'provider']
    tenant_lookup = 'tenant'
    course_lookup = 'course'
