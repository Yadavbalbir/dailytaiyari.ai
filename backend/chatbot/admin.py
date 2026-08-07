from django.contrib import admin
from .models import (
    ChatSession, ChatMessage, SavedResponse, FrequentQuestion,
    AIQuizAttempt, AIQuizQuestion, AILearningStats,
    AIProviderConfig, AISettings, AIUsageRecord
)


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'course', 'topic', 'is_active', 'message_count', 'rating', 'created_at']
    list_filter = ['is_active', 'subject', 'rating']
    search_fields = ['title', 'student__user__email']
    raw_id_fields = ['student', 'topic', 'subject', 'course']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'content_short', 'model_used', 'tokens_used', 'is_helpful']
    list_filter = ['role', 'model_used', 'is_helpful']
    raw_id_fields = ['session']
    
    def content_short(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content


@admin.register(SavedResponse)
class SavedResponseAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'topic', 'created_at']
    list_filter = ['topic']
    raw_id_fields = ['student', 'message', 'topic']


@admin.register(FrequentQuestion)
class FrequentQuestionAdmin(admin.ModelAdmin):
    list_display = ['question_short', 'topic', 'subject', 'views_count', 'helpful_count', 'is_active']
    list_filter = ['is_active', 'subject', 'topic']
    search_fields = ['question', 'answer']
    
    def question_short(self, obj):
        return obj.question[:50] + '...' if len(obj.question) > 50 else obj.question


@admin.register(AIQuizAttempt)
class AIQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz_topic', 'total_questions', 'correct_answers', 'percentage', 'xp_earned', 'created_at']
    list_filter = ['created_at', 'quiz_subject']
    search_fields = ['student__user__email', 'quiz_topic']
    raw_id_fields = ['student', 'session']
    readonly_fields = ['total_questions', 'correct_answers', 'wrong_answers', 'percentage', 'xp_earned']


@admin.register(AIQuizQuestion)
class AIQuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question_index', 'question_short', 'topic', 'is_correct', 'user_answer', 'correct_option']
    list_filter = ['is_correct']
    search_fields = ['topic', 'question_text']
    raw_id_fields = ['attempt']
    
    def question_short(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text


@admin.register(AILearningStats)
class AILearningStatsAdmin(admin.ModelAdmin):
    list_display = ['student', 'total_quizzes_attempted', 'total_xp_earned', 'average_accuracy', 'current_quiz_streak', 'perfect_quizzes']
    search_fields = ['student__user__email']
    raw_id_fields = ['student']
    readonly_fields = ['total_quizzes_attempted', 'total_questions_attempted', 'total_correct_answers', 'total_xp_earned', 'average_accuracy']


@admin.register(AIProviderConfig)
class AIProviderConfigAdmin(admin.ModelAdmin):
    """API keys are encrypted at rest and intentionally not editable here."""
    list_display = ['tenant', 'provider', 'model', 'is_active', 'is_configured', 'last_test_ok', 'updated_at']
    list_filter = ['provider', 'is_active']
    search_fields = ['tenant__name', 'model']
    raw_id_fields = ['tenant']
    readonly_fields = ['api_key_encrypted', 'last_tested_at', 'last_test_ok', 'last_test_error']


@admin.register(AISettings)
class AISettingsAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'is_enabled', 'student_daily_message_limit', 'monthly_token_budget', 'updated_at']
    list_filter = ['is_enabled', 'allow_quiz_generation', 'allow_course_context']
    raw_id_fields = ['tenant']


@admin.register(AIUsageRecord)
class AIUsageRecordAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'tenant', 'student', 'source', 'provider', 'model', 'total_tokens', 'estimated_cost_usd', 'was_successful']
    list_filter = ['source', 'provider', 'was_successful']
    search_fields = ['tenant__name', 'model']
    raw_id_fields = ['tenant', 'student', 'session']
    readonly_fields = [f.name for f in AIUsageRecord._meta.fields]

