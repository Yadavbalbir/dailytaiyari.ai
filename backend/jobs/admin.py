from django.contrib import admin

from .models import Job, JobApplication, ApplicationEvent


class JobApplicationInline(admin.TabularInline):
    model = JobApplication
    extra = 0
    fields = ('full_name', 'email', 'stage', 'is_external', 'applied_at')
    readonly_fields = fields
    show_change_link = True


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'job_type', 'status', 'department', 'location', 'openings', 'created_at')
    list_filter = ('job_type', 'status', 'employment_type', 'work_mode', 'tenant')
    search_fields = ('title', 'department', 'location')
    inlines = [JobApplicationInline]


class ApplicationEventInline(admin.TabularInline):
    model = ApplicationEvent
    extra = 0
    fields = ('event_type', 'from_stage', 'to_stage', 'note', 'created_by', 'created_at')
    readonly_fields = fields


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'job', 'stage', 'is_external', 'applied_at')
    list_filter = ('stage', 'is_external', 'job__tenant')
    search_fields = ('full_name', 'email', 'job__title')
    inlines = [ApplicationEventInline]


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    list_display = ('application', 'event_type', 'from_stage', 'to_stage', 'created_at')
    list_filter = ('event_type',)
