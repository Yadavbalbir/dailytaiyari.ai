from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsTenantAdmin

from . import services
from .models import Announcement, Notification
from .serializers import (
    AnnouncementCreateSerializer,
    AnnouncementSerializer,
    NotificationSerializer,
)


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()


class NotificationListView(generics.ListAPIView):
    """Current user's notifications (newest first) + unread count."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get('unread') in ('1', 'true', 'True'):
            qs = qs.filter(is_read=False)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if isinstance(response.data, dict):
            response.data['unread_count'] = _unread_count(request.user)
        return response


class UnreadCountView(APIView):
    """Lightweight endpoint the bell polls for the badge count."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'unread_count': _unread_count(request.user)})


class MarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.filter(
            id=pk, recipient=request.user, is_read=False,
        ).update(is_read=True, read_at=timezone.now())
        return Response({'updated': updated, 'unread_count': _unread_count(request.user)})


class MarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False,
        ).update(is_read=True, read_at=timezone.now())
        return Response({'updated': updated, 'unread_count': 0})


# ---------------------------------------------------------------------------
# Admin: announcements
# ---------------------------------------------------------------------------
class AnnouncementListCreateView(generics.ListCreateAPIView):
    """Tenant admins list past announcements and broadcast new ones."""
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    pagination_class = NotificationPagination

    def get_serializer_class(self):
        return AnnouncementCreateSerializer if self.request.method == 'POST' else AnnouncementSerializer

    def get_queryset(self):
        return Announcement.objects.filter(
            tenant=self.request.tenant,
        ).prefetch_related('courses').select_related('created_by')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        announcement = serializer.save()
        # Fan out (async when configured, inline otherwise).
        services.dispatch_announcement(announcement)
        return Response(
            AnnouncementSerializer(announcement).data,
            status=status.HTTP_201_CREATED,
        )
