from django.contrib import admin
from .models import Course, Subject, Topic, TopicCourseRelevance, Chapter, ChapterTopic


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'tenant', 'course_type', 'status', 'is_featured', 'total_students']
    list_filter = ['tenant', 'course_type', 'status', 'is_featured']
    search_fields = ['name', 'code']
    prepopulated_fields = {'code': ('name',)}
    raw_id_fields = ['tenant']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'course', 'weightage', 'total_topics', 'total_questions', 'order']
    list_filter = ['course']
    search_fields = ['name', 'code']
    raw_id_fields = ['course']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'difficulty', 'importance', 'total_questions', 'order']
    list_filter = ['subject', 'difficulty', 'importance']
    search_fields = ['name', 'code']
    raw_id_fields = ['subject', 'parent_topic']


@admin.register(TopicCourseRelevance)
class TopicCourseRelevanceAdmin(admin.ModelAdmin):
    list_display = ['topic', 'course', 'importance', 'average_questions']
    list_filter = ['course', 'importance']
    raw_id_fields = ['topic', 'course']


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

