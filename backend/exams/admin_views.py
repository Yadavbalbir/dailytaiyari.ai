"""
Admin CRUD views for the Course Content Builder.

All endpoints are restricted to tenant admins and scoped to the current tenant
via the Course relationship (child rows may have a null ``tenant`` in legacy data,
so we always scope through ``course``).
"""
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsTenantAdmin
from .models import Course, Subject, Topic, Chapter, ChapterTopic
from .admin_serializers import (
    AdminCourseSerializer, AdminSubjectSerializer,
    AdminChapterSerializer, AdminTopicSerializer,
)


class BuilderPagination(PageNumberPagination):
    """Larger pages for the content builder; client may override via page_size."""
    page_size = 200
    page_size_query_param = 'page_size'
    max_page_size = 2000


class TenantAdminModelViewSet(viewsets.ModelViewSet):
    """Base CRUD viewset: tenant-admin only, tenant-scoped, searchable."""
    permission_classes = [IsTenantAdmin]
    pagination_class = BuilderPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']

    # Lookup path from the model to the owning Course's tenant.
    tenant_lookup = 'tenant'

    def _tenant(self):
        return getattr(self.request, 'tenant', None)

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self._tenant()
        if not tenant:
            return qs.none()
        return qs.filter(**{self.tenant_lookup: tenant})

    def perform_create(self, serializer):
        serializer.save(tenant=self._tenant())

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Persist a new ordering. Body: {"order": [id1, id2, ...]}."""
        ids = request.data.get('order', [])
        qs = self.get_queryset()
        lookup = {str(obj.id): obj for obj in qs.filter(id__in=ids)}
        updated = []
        for index, obj_id in enumerate(ids):
            obj = lookup.get(str(obj_id))
            if obj is not None:
                obj.order = index
                updated.append(obj)
        if updated:
            type(updated[0]).objects.bulk_update(updated, ['order'])
        return Response({'updated': len(updated)})


class AdminCourseViewSet(TenantAdminModelViewSet):
    queryset = Course.objects.all().order_by('name')
    serializer_class = AdminCourseSerializer
    filterset_fields = ['course_type', 'status', 'is_featured']
    tenant_lookup = 'tenant'
    ordering = ['name']


class AdminSubjectViewSet(TenantAdminModelViewSet):
    queryset = Subject.objects.select_related('course').all()
    serializer_class = AdminSubjectSerializer
    filterset_fields = ['course']
    tenant_lookup = 'course__tenant'


class AdminChapterViewSet(TenantAdminModelViewSet):
    queryset = Chapter.objects.select_related('subject').all()
    serializer_class = AdminChapterSerializer
    filterset_fields = ['subject', 'grade']
    tenant_lookup = 'subject__course__tenant'


class AdminTopicViewSet(TenantAdminModelViewSet):
    queryset = Topic.objects.select_related('subject').prefetch_related('chapter_topics').all()
    serializer_class = AdminTopicSerializer
    filterset_fields = ['subject', 'difficulty', 'importance', 'parent_topic']
    tenant_lookup = 'subject__course__tenant'

    def get_queryset(self):
        qs = super().get_queryset()
        chapter_id = self.request.query_params.get('chapter')
        if chapter_id:
            topic_ids = ChapterTopic.objects.filter(
                chapter_id=chapter_id
            ).values_list('topic_id', flat=True)
            qs = qs.filter(id__in=list(topic_ids))
        return qs

    def perform_destroy(self, instance):
        ChapterTopic.objects.filter(topic=instance).delete()
        instance.delete()
