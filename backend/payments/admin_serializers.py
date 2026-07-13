"""Serializers for the tenant-admin sales dashboard."""
from rest_framework import serializers

from .models import PaymentOrder


class AdminPaymentOrderSerializer(serializers.ModelSerializer):
    """Read-only order row for the admin sales table."""
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_email = serializers.CharField(source='student.user.email', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_id = serializers.CharField(source='course.id', read_only=True)
    refunded_by_email = serializers.CharField(source='refunded_by.email', read_only=True)
    enrollment_status = serializers.SerializerMethodField()
    enrollment_active = serializers.SerializerMethodField()

    class Meta:
        model = PaymentOrder
        fields = [
            'id', 'provider', 'provider_order_id', 'provider_payment_id',
            'amount', 'currency', 'status', 'is_test_mode',
            'student_name', 'student_email',
            'course_id', 'course_name', 'course_code',
            'provider_refund_id', 'refund_amount', 'refund_reason',
            'refunded_at', 'refunded_by_email',
            'enrollment_status', 'enrollment_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_enrollment_status(self, obj):
        return obj.enrollment.status if obj.enrollment_id else None

    def get_enrollment_active(self, obj):
        return obj.enrollment.is_active if obj.enrollment_id else None
