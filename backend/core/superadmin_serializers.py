"""Serializers for the platform super-admin dashboard.

The super admin is a Django superuser (``is_superuser=True``, ``tenant=None``)
who owns the whole platform. These serializers power login and tenant
management for the dedicated super-admin frontend — they are never exposed to
tenant users.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Tenant, SuperAdminAuditLog

User = get_user_model()


class SuperAdminLoginSerializer(serializers.Serializer):
    """Authenticate a platform super admin by email + password.

    Only ``is_superuser`` accounts may authenticate here. Super admins are
    tenant-less, so — unlike the tenant login — no ``X-Tenant-ID`` is required.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        # An email may exist under multiple tenants; only superusers count here.
        user = None
        for candidate in User.objects.filter(email__iexact=email, is_superuser=True):
            if candidate.check_password(password):
                user = candidate
                break

        if user is None:
            raise serializers.ValidationError('Invalid credentials or not a super admin.')
        if not user.is_active:
            raise serializers.ValidationError('This account is disabled.')

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['is_superuser'] = True

        self.user = user
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': SuperAdminUserSerializer(user).data,
        }


class SuperAdminUserSerializer(serializers.ModelSerializer):
    """Minimal identity payload for the logged-in super admin."""

    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'first_name', 'last_name', 'is_superuser']
        read_only_fields = fields

    def get_name(self, obj):
        return obj.full_name or obj.email


class TenantListSerializer(serializers.ModelSerializer):
    """A tenant row for the dashboard list, with rolled-up counts."""

    user_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'tagline', 'subdomain', 'theme', 'is_active',
            'is_suspended',
            'user_count', 'student_count', 'admin_count', 'course_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_user_count(self, obj):
        return getattr(obj, 'user_count', None) if hasattr(obj, 'user_count') else obj.users.count()

    def get_student_count(self, obj):
        if hasattr(obj, 'student_count'):
            return obj.student_count
        return obj.users.filter(role='student').count()

    def get_admin_count(self, obj):
        if hasattr(obj, 'admin_count'):
            return obj.admin_count
        return obj.users.filter(role='admin').count()

    def get_course_count(self, obj):
        if hasattr(obj, 'course_count'):
            return obj.course_count
        return obj.courses.count()


class TenantDetailSerializer(serializers.ModelSerializer):
    """Read/update a single tenant from the super-admin dashboard.

    The super admin may edit branding, the subdomain, active status, theme and
    per-feature toggles. Feature updates are merged onto the stored map so
    partial updates are safe, and only known keys are accepted.
    """

    features = serializers.JSONField(required=False)
    feature_locks = serializers.JSONField(required=False)
    user_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'tagline', 'subdomain', 'theme', 'show_name',
            'is_active', 'is_suspended', 'suspension_message',
            'features', 'feature_locks',
            'request_enrollment_free', 'request_enrollment_paid',
            'user_count', 'student_count', 'admin_count', 'course_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'user_count', 'student_count', 'admin_count', 'course_count',
        ]

    def get_user_count(self, obj):
        return obj.users.count()

    def get_student_count(self, obj):
        return obj.users.filter(role='student').count()

    def get_admin_count(self, obj):
        return obj.users.filter(role='admin').count()

    def get_course_count(self, obj):
        return obj.courses.count()

    def validate_theme(self, value):
        if value and value not in Tenant.THEME_CHOICES:
            raise serializers.ValidationError(
                'Unknown theme. Choose one of: ' + ', '.join(Tenant.THEME_CHOICES)
            )
        return value

    def validate_subdomain(self, value):
        if not value:
            return value
        value = value.strip().lower()
        qs = Tenant.objects.filter(subdomain=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This subdomain is already in use.')
        return value

    def validate_features(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'features must be an object mapping feature keys to booleans.'
            )
        return {k: bool(v) for k, v in value.items() if k in Tenant.FEATURE_CHOICES}

    def validate_feature_locks(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'feature_locks must be an object mapping feature keys to booleans.'
            )
        return {k: bool(v) for k, v in value.items() if k in Tenant.FEATURE_CHOICES}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['features'] = instance.get_features()
        data['feature_locks'] = instance.get_feature_locks()
        data['locked_features'] = instance.locked_feature_keys()
        data['available_features'] = [
            {'key': k, 'label': label} for k, label in Tenant.FEATURE_CHOICES.items()
        ]
        data['available_themes'] = [
            {'key': k, 'label': label} for k, label in Tenant.THEME_CHOICES.items()
        ]
        return data

    def update(self, instance, validated_data):
        features = validated_data.pop('features', None)
        if features is not None:
            instance.features = {**(instance.features or {}), **features}
        # feature_locks is replaced wholesale (it is the complete lock map the
        # super admin intends), not merged, so unlocking removes the key.
        locks = validated_data.pop('feature_locks', None)
        if locks is not None:
            instance.feature_locks = locks
        return super().update(instance, validated_data)


class TenantCreateSerializer(serializers.ModelSerializer):
    """Create a brand-new tenant from the super-admin dashboard."""

    class Meta:
        model = Tenant
        fields = ['id', 'name', 'tagline', 'subdomain', 'theme', 'is_active']

    def validate_subdomain(self, value):
        if not value:
            return value
        value = value.strip().lower()
        if Tenant.objects.filter(subdomain=value).exists():
            raise serializers.ValidationError('This subdomain is already in use.')
        return value

    def validate_theme(self, value):
        if value and value not in Tenant.THEME_CHOICES:
            raise serializers.ValidationError(
                'Unknown theme. Choose one of: ' + ', '.join(Tenant.THEME_CHOICES)
            )
        return value


class SuperAdminAuditLogSerializer(serializers.ModelSerializer):
    """Read-only view of a super-admin audit trail entry."""

    tenant_name = serializers.CharField(source='target_name', read_only=True)
    tenant_id = serializers.PrimaryKeyRelatedField(
        source='target_tenant', read_only=True
    )

    class Meta:
        model = SuperAdminAuditLog
        fields = [
            'id', 'actor_email', 'action', 'tenant_id', 'tenant_name',
            'changes', 'created_at',
        ]
        read_only_fields = fields
