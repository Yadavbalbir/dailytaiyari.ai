"""Serializers for the tenant-admin Marketing & Promotions dashboard."""
from rest_framework import serializers

from exams.models import Course

from .models import Coupon, CouponRedemption, PromoBanner


class AdminCouponSerializer(serializers.ModelSerializer):
    """Full read/write serializer for managing a coupon."""
    course_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, source='courses',
        queryset=Course.objects.all(),
    )
    courses = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'max_discount_amount', 'min_order_amount', 'applies_to_all',
            'courses', 'course_ids', 'starts_at', 'ends_at', 'usage_limit',
            'per_user_limit', 'times_redeemed', 'is_active', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'times_redeemed', 'created_at', 'updated_at']

    def get_courses(self, obj):
        return [
            {'id': str(c.id), 'name': c.name, 'code': c.code}
            for c in obj.courses.all()
        ]

    def get_status(self, obj):
        if not obj.is_active:
            return 'inactive'
        if obj.is_scheduled:
            return 'scheduled'
        if obj.is_expired:
            return 'expired'
        if obj.is_exhausted:
            return 'exhausted'
        return 'live'

    def validate_code(self, value):
        return (value or '').strip().upper()

    def validate(self, attrs):
        dtype = attrs.get('discount_type', getattr(self.instance, 'discount_type', 'percent'))
        dvalue = attrs.get('discount_value', getattr(self.instance, 'discount_value', 0))
        if dtype == Coupon.DISCOUNT_PERCENT and not (0 < float(dvalue) <= 100):
            raise serializers.ValidationError(
                {'discount_value': 'Percentage must be between 0 and 100.'})
        if dtype == Coupon.DISCOUNT_FLAT and float(dvalue) <= 0:
            raise serializers.ValidationError(
                {'discount_value': 'Flat discount must be greater than 0.'})
        starts, ends = attrs.get('starts_at'), attrs.get('ends_at')
        if starts and ends and ends <= starts:
            raise serializers.ValidationError(
                {'ends_at': 'End date must be after the start date.'})
        return attrs


class AdminCouponRedemptionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = CouponRedemption
        fields = [
            'id', 'student_name', 'course_name', 'original_amount',
            'discount_amount', 'final_amount', 'currency', 'created_at',
        ]
        read_only_fields = fields


class AdminPromoBannerSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    is_live = serializers.SerializerMethodField()

    class Meta:
        model = PromoBanner
        fields = [
            'id', 'title', 'message', 'cta_label', 'cta_url', 'coupon',
            'coupon_code', 'theme', 'bg_color', 'text_color', 'dismissible',
            'is_active', 'starts_at', 'ends_at', 'is_live',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'coupon_code', 'is_live', 'created_at', 'updated_at']

    def get_is_live(self, obj):
        return obj.is_live()

    def validate(self, attrs):
        starts, ends = attrs.get('starts_at'), attrs.get('ends_at')
        if starts and ends and ends <= starts:
            raise serializers.ValidationError(
                {'ends_at': 'End date must be after the start date.'})
        return attrs
