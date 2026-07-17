"""Serializers for the tenant landing page + legal documents."""
from rest_framework import serializers

from .models import LandingPage, LegalDocument
from . import landing_defaults


class LandingSectionField(serializers.Field):
    """Validate the ordered list of landing sections.

    Each item must be ``{id, type, enabled, data}``. Unknown keys are dropped
    and defaults are filled so malformed input can't break the renderer.
    """

    def to_representation(self, value):
        return value or []

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError('sections must be a list.')
        cleaned = []
        for idx, item in enumerate(data):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f'Section #{idx} must be an object.'
                )
            stype = item.get('type')
            if not stype or not isinstance(stype, str):
                raise serializers.ValidationError(
                    f'Section #{idx} is missing a valid "type".'
                )
            cleaned.append({
                'id': str(item.get('id') or '') or landing_defaults._sid(),
                'type': stype,
                'enabled': bool(item.get('enabled', True)),
                'data': item.get('data') if isinstance(item.get('data'), dict) else {},
            })
        return cleaned


class LandingPageSerializer(serializers.ModelSerializer):
    """Full read/write representation of a tenant's landing page config."""

    sections = LandingSectionField(required=False)
    footer = serializers.JSONField(required=False)
    meta = serializers.JSONField(required=False)

    class Meta:
        model = LandingPage
        fields = [
            'template', 'is_published', 'sections', 'footer', 'meta',
            'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate_template(self, value):
        if value not in landing_defaults.TEMPLATE_CHOICES:
            raise serializers.ValidationError(
                'Unknown template. Choose one of: '
                + ', '.join(landing_defaults.TEMPLATE_CHOICES)
            )
        return value

    def validate_footer(self, value):
        if value is not None and not isinstance(value, dict):
            raise serializers.ValidationError('footer must be an object.')
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['available_templates'] = [
            {'key': k, 'label': v}
            for k, v in landing_defaults.TEMPLATE_CHOICES.items()
        ]
        return data


class LegalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalDocument
        fields = ['doc_type', 'title', 'content', 'updated_at']
        read_only_fields = ['doc_type', 'updated_at']
