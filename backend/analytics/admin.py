from django.contrib import admin
from .models import TopicMastery, SubjectPerformance, DailyActivity, Streak, WeeklyReport


@admin.register(TopicMastery)
class TopicMasteryAdmin(admin.ModelAdmin):
    list_display = ['student', 'topic', 'mastery_level', 'accuracy_percentage', 'needs_revision']
    list_filter = ['mastery_level', 'needs_revision', 'topic__subject']
    search_fields = ['student__user__email', 'topic__name']
    raw_id_fields = ['student', 'topic']


@admin.register(SubjectPerformance)
class SubjectPerformanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'exam', 'accuracy', 'overall_progress']
    list_filter = ['exam', 'subject']
    raw_id_fields = ['student', 'subject', 'exam']


@admin.register(DailyActivity)
class DailyActivityAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'study_time_minutes', 'questions_attempted', 'daily_goal_met']
    list_filter = ['date', 'daily_goal_met']
    raw_id_fields = ['student']
    date_hierarchy = 'date'


@admin.register(Streak)
class StreakAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'current_streak', 'longest_streak', 'last_activity_date']
    list_filter = ['exam']
    raw_id_fields = ['student', 'exam']


@admin.register(WeeklyReport)
class WeeklyReportAdmin(admin.ModelAdmin):
    list_display = ['student', 'week_start', 'week_end', 'days_active', 'xp_earned']
    raw_id_fields = ['student']
    date_hierarchy = 'week_start'

