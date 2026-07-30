"""Views for the platform super-admin dashboard.

Every endpoint here is restricted to Django superusers (``is_superuser=True``)
via :class:`core.permissions.IsSuperAdmin`. Because super admins are
tenant-less, this URL tree is registered under a tenant-exempt path (see
``core.middleware.TENANT_EXEMPT_PATHS``), so no ``X-Tenant-ID`` header is
required.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSuperAdmin
from .models import Tenant
from .superadmin_serializers import (
    SuperAdminLoginSerializer,
    SuperAdminUserSerializer,
    TenantListSerializer,
    TenantDetailSerializer,
    TenantCreateSerializer,
)

User = get_user_model()


class SuperAdminLoginView(APIView):
    """POST email + password → JWT. Super admins only; no tenant header."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = SuperAdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class SuperAdminMeView(APIView):
    """The currently authenticated super admin."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        return Response(SuperAdminUserSerializer(request.user).data)


class PlatformStatsView(APIView):
    """Platform-wide roll-up numbers for the dashboard overview."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        tenants = Tenant.objects.all()
        total_tenants = tenants.count()
        active_tenants = tenants.filter(is_active=True).count()

        # Users belonging to a tenant (exclude platform superusers).
        tenant_users = User.objects.filter(tenant__isnull=False)
        from exams.models import Course

        return Response({
            'total_tenants': total_tenants,
            'active_tenants': active_tenants,
            'inactive_tenants': total_tenants - active_tenants,
            'total_users': tenant_users.count(),
            'total_students': tenant_users.filter(role='student').count(),
            'total_admins': tenant_users.filter(role='admin').count(),
            'total_instructors': tenant_users.filter(role='instructor').count(),
            'total_courses': Course.objects.count(),
        })


class TenantListCreateView(generics.ListCreateAPIView):
    """GET a list of all tenants (with counts) / POST to create a tenant."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TenantCreateSerializer
        return TenantListSerializer

    def get_queryset(self):
        qs = Tenant.objects.annotate(
            user_count=Count('users', distinct=True),
            student_count=Count('users', filter=Q(users__role='student'), distinct=True),
            admin_count=Count('users', filter=Q(users__role='admin'), distinct=True),
            course_count=Count('courses', distinct=True),
        )
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(subdomain__icontains=search))
        active = self.request.query_params.get('is_active')
        if active in ('true', 'false'):
            qs = qs.filter(is_active=(active == 'true'))
        return qs.order_by('name')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()
        return Response(
            TenantDetailSerializer(tenant).data, status=status.HTTP_201_CREATED
        )


class TenantDetailView(generics.RetrieveUpdateAPIView):
    """GET / PATCH a single tenant."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = TenantDetailSerializer
    queryset = Tenant.objects.all()
    lookup_field = 'pk'
    http_method_names = ['get', 'patch', 'head', 'options']
