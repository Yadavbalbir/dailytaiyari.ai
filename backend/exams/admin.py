from django.contrib import admin
from .models import Exam, Subject, Topic, TopicExamRelevance, Chapter


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'exam_type', 'status', 'is_featured', 'total_students']
    list_filter = ['exam_type', 'status', 'is_featured']
    search_fields = ['name', 'code']
    prepopulated_fields = {'code': ('name',)}


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'weightage', 'total_topics', 'total_questions', 'order']
    list_filter = ['exams']
    search_fields = ['name', 'code']
    filter_horizontal = ['exams']


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


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'grade', 'estimated_hours', 'order']
    list_filter = ['subject', 'grade']
    search_fields = ['name', 'code']
    filter_horizontal = ['topics']

