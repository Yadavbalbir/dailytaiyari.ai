from rest_framework import serializers

from .models import DemoBooking, ContactMessage


class DemoBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoBooking
        fields = [
            'id', 'name', 'email', 'phone', 'organization',
            'organization_type', 'message', 'source', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Please enter your name.')
        return value


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'source', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Please enter your name.')
        return value

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError('Please enter a message.')
        return value
