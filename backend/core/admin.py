from django.contrib import admin
from .models import Tenant, DemoBooking, ContactMessage, JobApplication


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'tagline', 'theme', 'subdomain', 'is_active', 'created_at')
    search_fields = ('name', 'tagline', 'subdomain')
    list_filter = ('is_active', 'theme')


@admin.register(DemoBooking)
class DemoBookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'organization', 'organization_type', 'status', 'created_at')
    list_filter = ('status', 'organization_type', 'created_at')
    search_fields = ('name', 'email', 'organization', 'phone')
    readonly_fields = ('id', 'name', 'email', 'phone', 'organization',
                       'organization_type', 'message', 'source', 'created_at', 'updated_at')
    list_editable = ('status',)
    ordering = ('-created_at',)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('id', 'name', 'email', 'subject', 'message',
                       'source', 'created_at', 'updated_at')
    list_editable = ('status',)
    ordering = ('-created_at',)


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'position', 'experience', 'status', 'created_at')
    list_filter = ('status', 'position', 'created_at')
    search_fields = ('name', 'email', 'position', 'phone', 'cover_letter')
    readonly_fields = ('id', 'name', 'email', 'phone', 'position', 'experience',
                       'portfolio_url', 'cover_letter', 'source', 'created_at', 'updated_at')
    list_editable = ('status',)
    ordering = ('-created_at',)
