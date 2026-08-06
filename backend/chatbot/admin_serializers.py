"""Serializers for the tenant-admin "AI Features" screen."""
from rest_framework import serializers

from .models import AIProviderConfig, AISettings


class AIProviderConfigSerializer(serializers.ModelSerializer):
    """Read/write a tenant's LLM credentials.

    The API key is write-only: accepted on input, encrypted at rest and never
    returned. ``has_api_key`` tells the UI a key is already stored so the field
    can be left blank to keep it.
    """

    api_key = serializers.CharField(
        write_only=True, required=False, allow_blank=True, style={'input_type': 'password'}
    )
    has_api_key = serializers.SerializerMethodField()
    provider_label = serializers.CharField(source='get_provider_display', read_only=True)
    effective_model = serializers.CharField(read_only=True)
    effective_base_url = serializers.CharField(read_only=True)

    class Meta:
        model = AIProviderConfig
        fields = [
            'id', 'provider', 'provider_label', 'api_key', 'has_api_key',
            'base_url', 'effective_base_url', 'model', 'effective_model',
            'api_version', 'temperature', 'max_tokens', 'is_active', 'is_configured',
            'last_tested_at', 'last_test_ok', 'last_test_error',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'is_configured', 'last_tested_at', 'last_test_ok', 'last_test_error',
            'created_at', 'updated_at',
        ]

    def get_has_api_key(self, obj):
        return bool(obj.api_key_encrypted)

    def validate_provider(self, value):
        valid = {c[0] for c in AIProviderConfig.PROVIDER_CHOICES}
        if value not in valid:
            raise serializers.ValidationError(
                'Unsupported provider. Choose one of: ' + ', '.join(sorted(valid))
            )
        return value

    def validate_temperature(self, value):
        if not 0 <= value <= 2:
            raise serializers.ValidationError('Temperature must be between 0 and 2.')
        return value

    def validate_max_tokens(self, value):
        if not 128 <= value <= 32000:
            raise serializers.ValidationError('Max tokens must be between 128 and 32000.')
        return value

    def _resolved(self, attrs, field, default=''):
        return attrs.get(field, getattr(self.instance, field, default))

    def validate(self, attrs):
        provider = self._resolved(attrs, 'provider')
        base_url = self._resolved(attrs, 'base_url')
        model = self._resolved(attrs, 'model') or AIProviderConfig.DEFAULT_MODELS.get(provider, '')
        has_key = bool(attrs.get('api_key')) or bool(
            getattr(self.instance, 'api_key_encrypted', '')
        )

        if provider == AIProviderConfig.PROVIDER_AZURE and not base_url:
            raise serializers.ValidationError(
                {'base_url': 'Azure OpenAI needs your resource endpoint, '
                             'e.g. https://my-resource.openai.azure.com'}
            )
        if provider in AIProviderConfig.KEYLESS_PROVIDERS:
            if not (base_url or AIProviderConfig.DEFAULT_BASE_URLS.get(provider)):
                raise serializers.ValidationError(
                    {'base_url': 'Provide the endpoint URL of your server.'}
                )
        if not model:
            raise serializers.ValidationError(
                {'model': 'Choose a model name (for Azure, use your deployment name).'}
            )

        if attrs.get('is_active', getattr(self.instance, 'is_active', False)):
            if provider not in AIProviderConfig.KEYLESS_PROVIDERS and not has_key:
                raise serializers.ValidationError(
                    'Add the API key before making this provider live.'
                )
        return attrs

    def create(self, validated_data):
        key = validated_data.pop('api_key', '')
        instance = AIProviderConfig(**validated_data)
        if key:
            instance.api_key = key
        instance.save()
        return instance

    def update(self, instance, validated_data):
        # Only overwrite the stored key when a non-blank value is supplied.
        key = validated_data.pop('api_key', None)
        if key:
            instance.api_key = key
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AISettingsSerializer(serializers.ModelSerializer):
    """Tenant-level AI behaviour and guardrails."""

    class Meta:
        model = AISettings
        fields = [
            'is_enabled', 'student_daily_message_limit', 'monthly_token_budget',
            'allow_quiz_generation', 'allow_course_context', 'custom_instructions',
            'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate_custom_instructions(self, value):
        if len(value) > 2000:
            raise serializers.ValidationError(
                'Keep custom instructions under 2000 characters — they are sent with every message.'
            )
        return value
