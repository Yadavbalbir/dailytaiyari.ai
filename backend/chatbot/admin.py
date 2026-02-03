from django.contrib import admin
from .models import (
    ChatSession, ChatMessage, SavedResponse, FrequentQuestion,
    AIQuizAttempt, AIQuizQuestion, AILearningStats
)


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'topic', 'is_active', 'message_count', 'rating', 'created_at']
    list_filter = ['is_active', 'subject', 'rating']
    search_fields = ['title', 'student__user__email']
    raw_id_fields = ['student', 'topic', 'subject']


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
    list_display = ['attempt', 'question_index', 'question_short', 'is_correct', 'user_answer', 'correct_option']
    list_filter = ['is_correct']
    raw_id_fields = ['attempt']
    
    def question_short(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text


@admin.register(AILearningStats)
class AILearningStatsAdmin(admin.ModelAdmin):
    list_display = ['student', 'total_quizzes_attempted', 'total_xp_earned', 'average_accuracy', 'current_quiz_streak', 'perfect_quizzes']
    search_fields = ['student__user__email']
    raw_id_fields = ['student']
    readonly_fields = ['total_quizzes_attempted', 'total_questions_attempted', 'total_correct_answers', 'total_xp_earned', 'average_accuracy']

