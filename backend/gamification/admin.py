from django.contrib import admin
from .models import Badge, StudentBadge, XPTransaction, LeaderboardEntry, Challenge, ChallengeParticipation


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'rarity', 'xp_reward', 'is_active', 'is_secret']
    list_filter = ['category', 'rarity', 'is_active', 'is_secret']
    search_fields = ['name', 'description']


@admin.register(StudentBadge)
class StudentBadgeAdmin(admin.ModelAdmin):
    list_display = ['student', 'badge', 'earned_at', 'is_complete']
    list_filter = ['badge__category', 'is_complete']
    raw_id_fields = ['student', 'badge']


@admin.register(XPTransaction)
class XPTransactionAdmin(admin.ModelAdmin):
    list_display = ['student', 'transaction_type', 'xp_amount', 'balance_after', 'created_at']
    list_filter = ['transaction_type']
    raw_id_fields = ['student']
    date_hierarchy = 'created_at'


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'period', 'rank', 'xp_earned', 'period_start']
    list_filter = ['period', 'exam']
    raw_id_fields = ['student', 'exam']


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'challenge_type', 'status', 'start_time', 'end_time', 'participants']
    list_filter = ['challenge_type', 'status']
    raw_id_fields = ['exam', 'badge_reward']


@admin.register(ChallengeParticipation)
class ChallengeParticipationAdmin(admin.ModelAdmin):
    list_display = ['student', 'challenge', 'is_completed', 'xp_claimed']
    list_filter = ['is_completed', 'challenge']
    raw_id_fields = ['student', 'challenge']

