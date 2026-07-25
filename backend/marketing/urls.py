"""Marketing & Promotions API URLs."""
from django.urls import path

from .views import ValidateCouponView
from .admin_views import (
    CouponListCreateView,
    CouponDetailView,
    CouponRedemptionListView,
    CouponCourseOptionsView,
    BannerListCreateView,
    BannerDetailView,
)

urlpatterns = [
    # --- Student-facing ---
    path('coupons/validate/', ValidateCouponView.as_view(), name='marketing-coupon-validate'),

    # --- Tenant-admin: coupons ---
    path('admin/coupons/', CouponListCreateView.as_view(), name='admin-coupon-list'),
    path('admin/coupons/course-options/', CouponCourseOptionsView.as_view(), name='admin-coupon-course-options'),
    path('admin/coupons/<uuid:pk>/', CouponDetailView.as_view(), name='admin-coupon-detail'),
    path('admin/coupons/<uuid:pk>/redemptions/', CouponRedemptionListView.as_view(), name='admin-coupon-redemptions'),

    # --- Tenant-admin: promo banners ---
    path('admin/banners/', BannerListCreateView.as_view(), name='admin-banner-list'),
    path('admin/banners/<uuid:pk>/', BannerDetailView.as_view(), name='admin-banner-detail'),
]
