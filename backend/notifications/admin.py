from django.contrib import admin

from .models import Announcement, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'recipient', 'tenant', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'tenant')
    search_fields = ('title', 'body', 'recipient__email')
    readonly_fields = ('created_at', 'read_at')
    raw_id_fields = ('recipient', 'tenant')


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'tenant', 'audience', 'status', 'recipients_count', 'created_at')
    list_filter = ('audience', 'status', 'tenant')
    search_fields = ('title', 'body')
    readonly_fields = ('recipients_count', 'status', 'sent_at', 'created_at')
    raw_id_fields = ('tenant', 'created_by')
    filter_horizontal = ('courses',)
