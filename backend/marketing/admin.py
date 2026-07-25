from django.contrib import admin

from .models import Coupon, CouponRedemption, PromoBanner


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'tenant', 'discount_type', 'discount_value',
                    'applies_to_all', 'is_active', 'times_redeemed', 'ends_at')
    list_filter = ('tenant', 'discount_type', 'applies_to_all', 'is_active')
    search_fields = ('code', 'description')
    filter_horizontal = ('courses',)


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ('coupon', 'student', 'course', 'discount_amount', 'final_amount', 'created_at')
    list_filter = ('tenant',)
    search_fields = ('coupon__code',)


@admin.register(PromoBanner)
class PromoBannerAdmin(admin.ModelAdmin):
    list_display = ('message', 'tenant', 'theme', 'is_active', 'starts_at', 'ends_at')
    list_filter = ('tenant', 'theme', 'is_active')
