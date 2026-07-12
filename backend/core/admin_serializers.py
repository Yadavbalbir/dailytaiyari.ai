"""Serializers for tenant-admin managed settings (branding + feature toggles)."""
from rest_framework import serializers

from .models import Tenant, PaymentGateway


class TenantSettingsSerializer(serializers.ModelSerializer):
    """Read/update a tenant's branding (name, logo) and feature toggles.

    ``features`` is always represented as the full, defaulted feature map.
    Updates are merged onto the stored dict so partial updates are safe, and
    only known feature keys are accepted.
    """

    features = serializers.JSONField(required=False)
    logo = serializers.ImageField(required=False, allow_null=True)
    favicon = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'tagline', 'subdomain', 'logo', 'favicon', 'theme',
            'show_name', 'features',
            'request_enrollment_free', 'request_enrollment_paid',
        ]
        read_only_fields = ['id', 'subdomain']

    def validate_theme(self, value):
        if value not in Tenant.THEME_CHOICES:
            raise serializers.ValidationError(
                'Unknown theme. Choose one of: '
                + ', '.join(Tenant.THEME_CHOICES)
            )
        return value

    def validate_features(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'features must be an object mapping feature keys to booleans.'
            )
        cleaned = {}
        for key, enabled in value.items():
            if key in Tenant.FEATURE_CHOICES:
                cleaned[key] = bool(enabled)
        return cleaned

    def validate(self, attrs):
        # Paid courses may only skip the request/approve flow when an active
        # payment gateway is configured — otherwise there is no way to collect
        # payment. Free courses are independent and can be toggled freely.
        instance = self.instance
        request_paid = attrs.get(
            'request_enrollment_paid',
            getattr(instance, 'request_enrollment_paid', True),
        )
        if request_paid is False:
            has_gateway = bool(instance and instance.has_active_payment_gateway)
            if not has_gateway:
                raise serializers.ValidationError({
                    'request_enrollment_paid': (
                        'Self-enrolment for paid courses requires an active '
                        'payment gateway. Configure Razorpay or Cashfree first, '
                        'or keep request-based enrolment enabled.'
                    )
                })
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['features'] = instance.get_features()
        data['available_features'] = [
            {'key': key, 'label': label}
            for key, label in Tenant.FEATURE_CHOICES.items()
        ]
        data['available_themes'] = [
            {'key': key, 'label': label}
            for key, label in Tenant.THEME_CHOICES.items()
        ]
        data['has_active_payment_gateway'] = instance.has_active_payment_gateway
        return data

    def update(self, instance, validated_data):
        features = validated_data.pop('features', None)
        if features is not None:
            instance.features = {**(instance.features or {}), **features}
        return super().update(instance, validated_data)


class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Read/write a tenant's payment gateway credentials.

    The secret is write-only: it is accepted on input, encrypted at rest, and
    never returned. Instead a boolean ``has_secret`` flag tells the UI whether a
    secret is already stored so it can leave the field blank to keep it.
    """

    # Write-only plaintext secret. Blank/omitted on update keeps the stored one.
    key_secret = serializers.CharField(
        write_only=True, required=False, allow_blank=True, style={'input_type': 'password'}
    )
    webhook_secret = serializers.CharField(
        write_only=True, required=False, allow_blank=True, style={'input_type': 'password'}
    )
    has_secret = serializers.SerializerMethodField()
    has_webhook_secret = serializers.SerializerMethodField()

    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'provider', 'key_id', 'key_secret', 'has_secret',
            'webhook_secret', 'has_webhook_secret',
            'is_active', 'is_test_mode', 'is_configured',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_configured', 'created_at', 'updated_at']

    def get_has_secret(self, obj):
        return bool(obj.key_secret_encrypted)

    def get_has_webhook_secret(self, obj):
        return bool(obj.webhook_secret_encrypted)

    def validate_provider(self, value):
        valid = {c[0] for c in PaymentGateway.PROVIDER_CHOICES}
        if value not in valid:
            raise serializers.ValidationError(
                'Unsupported provider. Choose one of: ' + ', '.join(sorted(valid))
            )
        return value

    def validate(self, attrs):
        # A gateway can only be activated once fully configured (id + secret).
        is_active = attrs.get(
            'is_active', getattr(self.instance, 'is_active', False)
        )
        if is_active:
            key_id = attrs.get('key_id', getattr(self.instance, 'key_id', ''))
            secret = attrs.get('key_secret', None)
            has_secret = bool(secret) or bool(
                getattr(self.instance, 'key_secret_encrypted', '')
            )
            if not (key_id and has_secret):
                raise serializers.ValidationError(
                    'Provide both the key/app id and secret before activating the gateway.'
                )
        return attrs

    def create(self, validated_data):
        secret = validated_data.pop('key_secret', '')
        webhook = validated_data.pop('webhook_secret', '')
        instance = PaymentGateway(**validated_data)
        if secret:
            instance.key_secret = secret
        if webhook:
            instance.webhook_secret = webhook
        instance.save()
        return instance

    def update(self, instance, validated_data):
        # Only overwrite stored secrets when a non-blank value is supplied.
        secret = validated_data.pop('key_secret', None)
        webhook = validated_data.pop('webhook_secret', None)
        if secret:
            instance.key_secret = secret
        if webhook:
            instance.webhook_secret = webhook
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
