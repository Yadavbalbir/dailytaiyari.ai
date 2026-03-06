from django.contrib import admin
from .models import Exam, Subject, Topic, TopicExamRelevance, Chapter, ChapterTopic


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'tenant', 'exam_type', 'status', 'is_featured', 'total_students']
    list_filter = ['tenant', 'exam_type', 'status', 'is_featured']
    search_fields = ['name', 'code']
    prepopulated_fields = {'code': ('name',)}
    raw_id_fields = ['tenant']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'exam', 'weightage', 'total_topics', 'total_questions', 'order']
    list_filter = ['exam']
    search_fields = ['name', 'code']
    raw_id_fields = ['exam']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'difficulty', 'importance', 'total_questions', 'order']
    list_filter = ['subject', 'difficulty', 'importance']
    search_fields = ['name', 'code']
    raw_id_fields = ['subject', 'parent_topic']


@admin.register(TopicExamRelevance)
class TopicExamRelevanceAdmin(admin.ModelAdmin):
    list_display = ['topic', 'exam', 'importance', 'average_questions']
    list_filter = ['exam', 'importance']
    raw_id_fields = ['topic', 'exam']


class ChapterTopicInline(admin.TabularInline):
    model = ChapterTopic
    extra = 0
    raw_id_fields = ['topic']
    ordering = ['order']


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'grade', 'estimated_hours', 'order']
    list_filter = ['subject', 'grade']
    search_fields = ['name', 'code']
    inlines = [ChapterTopicInline]

