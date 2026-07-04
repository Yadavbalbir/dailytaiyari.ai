from django.contrib import admin

from .models import Assignment, AssignmentSubmission


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'topic', 'submission_type', 'is_timed', 'due_at', 'status')
    list_filter = ('status', 'submission_type', 'is_timed')
    search_fields = ('title',)


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'student', 'status', 'marks', 'submitted_at')
    list_filter = ('status',)
