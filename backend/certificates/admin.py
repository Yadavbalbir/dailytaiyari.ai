from django.contrib import admin

from .models import CourseCertificate


@admin.register(CourseCertificate)
class CourseCertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_number', 'student_name', 'course_name', 'tenant_name', 'template', 'issued_at')
    search_fields = ('certificate_number', 'student_name', 'course_name', 'tenant_name')
    list_filter = ('template', 'issued_at')
    readonly_fields = ('certificate_number', 'issued_at', 'created_at', 'updated_at')
