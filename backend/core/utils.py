"""
Core utilities for the DailyTaiyari platform.
"""
from django.utils import timezone
from datetime import timedelta
import random
import string


def generate_code(length=6):
    """Generate a random alphanumeric code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def get_today_start():
    """Get the start of today in the current timezone."""
    now = timezone.now()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def get_week_start():
    """Get the start of the current week (Monday)."""
    today = get_today_start()
    return today - timedelta(days=today.weekday())


def get_month_start():
    """Get the start of the current month."""
    today = get_today_start()
    return today.replace(day=1)


def calculate_percentage(part, total):
    """Calculate percentage safely."""
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)


def calculate_accuracy(correct, total):
    """Calculate accuracy percentage."""
    return calculate_percentage(correct, total)


def calculate_speed_score(time_taken_seconds, max_time_seconds):
    """
    Calculate speed score (0-100).
    Faster completion = higher score.
    """
    if max_time_seconds == 0:
        return 0
    time_ratio = time_taken_seconds / max_time_seconds
    # Inverse relationship: faster = higher score
    speed_score = max(0, 100 - (time_ratio * 100))
    return round(speed_score, 2)


def get_mastery_level(accuracy):
    """
    Determine mastery level based on accuracy.
    Returns: (level_name, level_number)
    """
    if accuracy >= 90:
        return ('Master', 5)
    elif accuracy >= 75:
        return ('Expert', 4)
    elif accuracy >= 60:
        return ('Proficient', 3)
    elif accuracy >= 40:
        return ('Developing', 2)
    else:
        return ('Beginner', 1)


def calculate_xp_for_quiz(accuracy, questions_count, is_daily_challenge=False):
    """
    Calculate XP earned for completing a quiz.
    Base XP + accuracy bonus + daily challenge bonus
    """
    base_xp = questions_count * 5  # 5 XP per question
    accuracy_multiplier = accuracy / 100
    xp = int(base_xp * accuracy_multiplier)
    
    if is_daily_challenge:
        xp = int(xp * 1.5)  # 50% bonus for daily challenges
    
    return xp


def calculate_streak_bonus(streak_days):
    """
    Calculate bonus XP for maintaining a streak.
    """
    if streak_days <= 0:
        return 0
    elif streak_days < 7:
        return streak_days * 10
    elif streak_days < 30:
        return 70 + (streak_days - 7) * 15
    else:
        return 415 + (streak_days - 30) * 20

