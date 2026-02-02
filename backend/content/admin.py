from django.contrib import admin
from .models import Content, ContentProgress, StudyPlan, StudyPlanItem


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'content_type', 'topic', 'difficulty', 'status', 'views_count']
    list_filter = ['content_type', 'status', 'difficulty', 'is_free', 'is_premium']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['topic', 'subject']
    filter_horizontal = ['exams']


@admin.register(ContentProgress)
class ContentProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'content', 'is_completed', 'progress_percentage', 'time_spent_minutes']
    list_filter = ['is_completed', 'is_bookmarked']
    raw_id_fields = ['student', 'content']


@admin.register(StudyPlan)
class StudyPlanAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'date', 'is_completed', 'target_study_minutes', 'actual_study_minutes']
    list_filter = ['exam', 'is_completed', 'date']
    raw_id_fields = ['student', 'exam']


@admin.register(StudyPlanItem)
class StudyPlanItemAdmin(admin.ModelAdmin):
    list_display = ['study_plan', 'item_type', 'title', 'status', 'estimated_minutes']
    list_filter = ['item_type', 'status', 'is_priority']
    raw_id_fields = ['study_plan', 'content', 'topic']

