"""Serializers for course completion certificates."""
from rest_framework import serializers

from .models import CourseCertificate


class CourseCertificateSerializer(serializers.ModelSerializer):
    """Read serializer exposing everything the frontend needs to render/download."""
    issued_at = serializers.DateTimeField(read_only=True)
    issued_date_display = serializers.SerializerMethodField()
    tenant_logo_url = serializers.SerializerMethodField()
    verify_url = serializers.SerializerMethodField()

    class Meta:
        model = CourseCertificate
        fields = [
            'id', 'certificate_number', 'template',
            'student_name', 'course_name', 'tenant_name', 'tenant_logo_url',
            'issued_at', 'issued_date_display', 'verify_url',
        ]

    def get_issued_date_display(self, obj):
        return obj.issued_at.strftime('%d %B %Y') if obj.issued_at else ''

    def get_tenant_logo_url(self, obj):
        tenant = obj.tenant or getattr(obj.course, 'tenant', None)
        logo = getattr(tenant, 'logo', None)
        if not logo:
            return None
        try:
            url = logo.url
        except ValueError:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url

    def get_verify_url(self, obj):
        request = self.context.get('request')
        path = f"/api/v1/certificates/verify/{obj.certificate_number}/"
        return request.build_absolute_uri(path) if request else path
