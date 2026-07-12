"""Serializers for tenant-admin managed settings (branding + feature toggles)."""
from rest_framework import serializers

from .models import Tenant


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
        fields = ['id', 'name', 'tagline', 'subdomain', 'logo', 'favicon', 'theme', 'show_name', 'features']
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
        return data

    def update(self, instance, validated_data):
        features = validated_data.pop('features', None)
        if features is not None:
            instance.features = {**(instance.features or {}), **features}
        return super().update(instance, validated_data)
