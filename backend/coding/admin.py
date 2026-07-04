from django.contrib import admin

from .models import CodingProblem, TestCase, CodingSubmission


class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 0


@admin.register(CodingProblem)
class CodingProblemAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'topic', 'difficulty', 'status', 'max_marks']
    list_filter = ['status', 'difficulty', 'course']
    search_fields = ['title']
    inlines = [TestCaseInline]


@admin.register(CodingSubmission)
class CodingSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'problem', 'student', 'language', 'passed_count', 'total_count', 'marks', 'submitted_at']
    list_filter = ['language', 'status']
    search_fields = ['problem__title']
    readonly_fields = ['results', 'compile_output', 'submitted_at']
