from django.contrib import admin

from .models import LiveClass


@admin.register(LiveClass)
class LiveClassAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'topic', 'provider', 'status', 'scheduled_start']
    list_filter = ['status', 'provider', 'course']
    search_fields = ['title']
