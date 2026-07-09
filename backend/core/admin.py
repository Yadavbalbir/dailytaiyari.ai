from django.contrib import admin
from .models import Tenant, DemoBooking, ContactMessage


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'is_active', 'created_at')
    search_fields = ('name', 'subdomain')
    list_filter = ('is_active',)


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
