"""Serializers for public marketing endpoints (coupon validation, banner)."""
from rest_framework import serializers

from .models import PromoBanner


class CouponValidateRequestSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)
    course = serializers.UUIDField()


class PublicPromoBannerSerializer(serializers.ModelSerializer):
    """The safe, public shape of a live promo banner for the app header."""
    coupon_code = serializers.SerializerMethodField()

    class Meta:
        model = PromoBanner
        fields = [
            'id', 'title', 'message', 'cta_label', 'cta_url',
            'theme', 'bg_color', 'text_color', 'dismissible', 'coupon_code',
        ]

    def get_coupon_code(self, obj):
        if obj.coupon_id and obj.coupon and obj.coupon.is_live():
            return obj.coupon.code
        return None
