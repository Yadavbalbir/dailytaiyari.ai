from django.contrib import admin
from .models import (
    Question, QuestionOption, Quiz, QuizQuestion,
    MockTest, MockTestQuestion, QuizAttempt, MockTestAttempt, Answer
)


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_text_short', 'question_type', 'topic', 'difficulty', 'status', 'accuracy_rate']
    list_filter = ['question_type', 'difficulty', 'status', 'subject']
    search_fields = ['question_text']
    raw_id_fields = ['topic', 'subject']
    filter_horizontal = ['exams']
    inlines = [QuestionOptionInline]
    
    def question_text_short(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'Question'


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1
    raw_id_fields = ['question']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'quiz_type', 'exam', 'subject', 'questions_count', 'status', 'is_daily_challenge']
    list_filter = ['quiz_type', 'status', 'is_daily_challenge', 'exam']
    search_fields = ['title']
    raw_id_fields = ['exam', 'subject', 'topic']
    inlines = [QuizQuestionInline]


class MockTestQuestionInline(admin.TabularInline):
    model = MockTestQuestion
    extra = 1
    raw_id_fields = ['question']


@admin.register(MockTest)
class MockTestAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam', 'duration_minutes', 'total_marks', 'status', 'total_attempts']
    list_filter = ['exam', 'status', 'is_free']
    search_fields = ['title']
    raw_id_fields = ['exam']
    inlines = [MockTestQuestionInline]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'status', 'percentage', 'xp_earned', 'started_at']
    list_filter = ['status', 'quiz__exam']
    raw_id_fields = ['student', 'quiz']


@admin.register(MockTestAttempt)
class MockTestAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'mock_test', 'status', 'percentage', 'rank', 'started_at']
    list_filter = ['status', 'mock_test__exam']
    raw_id_fields = ['student', 'mock_test']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'is_correct', 'marks_obtained', 'time_taken_seconds']
    list_filter = ['is_correct']
    raw_id_fields = ['quiz_attempt', 'mock_test_attempt', 'question']

