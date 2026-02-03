from django.contrib import admin
from .models import (
    Post, Comment, Like, PollOption, PollVote,
    CommunityQuiz, QuizAttempt, CommunityStats, CommunityLeaderboard
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'post_type', 'author', 'likes_count', 'comments_count', 'is_solved', 'created_at']
    list_filter = ['post_type', 'status', 'is_solved', 'exam']
    search_fields = ['title', 'content', 'author__user__email']
    date_hierarchy = 'created_at'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'author', 'likes_count', 'is_best_answer', 'created_at']
    list_filter = ['is_best_answer']
    search_fields = ['content', 'author__user__email']


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'comment', 'created_at']
    list_filter = ['created_at']


@admin.register(PollOption)
class PollOptionAdmin(admin.ModelAdmin):
    list_display = ['option_text', 'post', 'votes_count']


@admin.register(CommunityQuiz)
class CommunityQuizAdmin(admin.ModelAdmin):
    list_display = ['question', 'post', 'attempts_count', 'success_rate']


@admin.register(CommunityStats)
class CommunityStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'posts_count', 'answers_count', 'best_answers_count', 'total_community_xp']


@admin.register(CommunityLeaderboard)
class CommunityLeaderboardAdmin(admin.ModelAdmin):
    list_display = ['user', 'period', 'rank', 'score', 'period_start']
    list_filter = ['period']
