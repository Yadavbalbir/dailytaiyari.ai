"""Serializers for the payments API."""
from rest_framework import serializers

from .models import PaymentOrder


class PaymentOrderSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = PaymentOrder
        fields = [
            'id', 'course', 'course_name', 'provider', 'provider_order_id',
            'amount', 'currency', 'status', 'is_test_mode', 'created_at',
        ]
        read_only_fields = fields
