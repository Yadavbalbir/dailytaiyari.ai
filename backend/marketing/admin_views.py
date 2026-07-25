"""Tenant-admin Marketing & Promotions API — coupons and promo banners.

All endpoints are scoped to the tenant resolved by ``TenantMiddleware`` from the
``X-Tenant-ID`` header and restricted to users with the ``admin`` role.
"""
from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsTenantAdmin
from exams.models import Course

from .admin_serializers import (
    AdminCouponSerializer,
    AdminCouponRedemptionSerializer,
    AdminPromoBannerSerializer,
)
from .models import Coupon, CouponRedemption, PromoBanner


def _tenant_or_404(request):
    tenant = getattr(request, 'tenant', None)
    if tenant is None:
        raise NotFound('No tenant is associated with this request.')
    return tenant


class _TenantAdminMixin:
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get_tenant(self):
        return _tenant_or_404(self.request)

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant())


class _ScopedCourseFieldMixin:
    """Restrict the coupon ``course_ids`` picker to the tenant's courses."""

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        field = serializer.fields.get('course_ids') if hasattr(serializer, 'fields') else None
        if field is not None:
            field.child_relation.queryset = Course.objects.filter(tenant=self.get_tenant())
        return serializer


# ── Coupons ────────────────────────────────────────────────────────────────
class CouponListCreateView(_ScopedCourseFieldMixin, _TenantAdminMixin, generics.ListCreateAPIView):
    serializer_class = AdminCouponSerializer

    def get_queryset(self):
        return (
            Coupon.objects.filter(tenant=self.get_tenant())
            .prefetch_related('courses')
            .order_by('-created_at')
        )


class CouponDetailView(_ScopedCourseFieldMixin, _TenantAdminMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminCouponSerializer

    def get_queryset(self):
        return Coupon.objects.filter(tenant=self.get_tenant()).prefetch_related('courses')


class CouponRedemptionListView(_TenantAdminMixin, generics.ListAPIView):
    serializer_class = AdminCouponRedemptionSerializer

    def get_queryset(self):
        tenant = self.get_tenant()
        return (
            CouponRedemption.objects
            .filter(tenant=tenant, coupon_id=self.kwargs['pk'])
            .select_related('student__user', 'course')
            .order_by('-created_at')
        )


class CouponCourseOptionsView(_TenantAdminMixin, APIView):
    """Paid courses a coupon can target (for the admin course picker)."""

    def get(self, request):
        tenant = self.get_tenant()
        courses = (
            Course.objects.filter(tenant=tenant)
            .exclude(pricing_type='free')
            .order_by('name')
            .values('id', 'name', 'code', 'price', 'currency')
        )
        return Response([
            {
                'id': str(c['id']),
                'name': c['name'],
                'code': c['code'],
                'price': c['price'],
                'currency': c['currency'],
            }
            for c in courses
        ])


# ── Promo banners ────────────────────────────────────────────────────────────
class BannerListCreateView(_TenantAdminMixin, generics.ListCreateAPIView):
    serializer_class = AdminPromoBannerSerializer

    def get_queryset(self):
        return PromoBanner.objects.filter(tenant=self.get_tenant()).order_by('-updated_at')

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        field = serializer.fields.get('coupon') if hasattr(serializer, 'fields') else None
        if field is not None:
            field.queryset = Coupon.objects.filter(tenant=self.get_tenant())
        return serializer


class BannerDetailView(_TenantAdminMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminPromoBannerSerializer

    def get_queryset(self):
        return PromoBanner.objects.filter(tenant=self.get_tenant())

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        field = serializer.fields.get('coupon') if hasattr(serializer, 'fields') else None
        if field is not None:
            field.queryset = Coupon.objects.filter(tenant=self.get_tenant())
        return serializer
