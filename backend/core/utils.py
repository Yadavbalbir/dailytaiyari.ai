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


# Per-quiz XP caps (lean economy). Daily-challenge cap is intentionally higher
# than the normal cap so the 1.5x daily-challenge bonus is not erased by the cap.
QUIZ_XP_CAP = 25
QUIZ_XP_CAP_DAILY_CHALLENGE = 40

# Coding-problem solve XP by difficulty. Awarded once, on the first fully-passing
# submission. A solve is more effort than a single quiz, so it sits above the quiz cap.
CODING_XP_BY_DIFFICULTY = {'easy': 15, 'medium': 25, 'hard': 40}

# Assignment XP. Awarded once, when a submission is first graded. Scaled by the
# score when the assignment defines max_marks; otherwise a flat completion award.
ASSIGNMENT_XP_MAX = 30
ASSIGNMENT_XP_MIN = 5


def calculate_xp_for_coding(difficulty):
    """XP for solving a coding problem (all test cases passed)."""
    return CODING_XP_BY_DIFFICULTY.get(difficulty, CODING_XP_BY_DIFFICULTY['easy'])


def calculate_xp_for_assignment(marks, max_marks):
    """XP for a graded assignment submission, scaled by score when possible."""
    if max_marks and marks is not None:
        ratio = max(0.0, min(1.0, float(marks) / float(max_marks)))
        return max(ASSIGNMENT_XP_MIN, round(ASSIGNMENT_XP_MAX * ratio))
    return ASSIGNMENT_XP_MAX


def calculate_xp_for_quiz(accuracy, questions_count, is_daily_challenge=False):
    """
    Calculate XP earned for completing a quiz.
    Base: 5 XP per question × accuracy. Capped per quiz so one attempt doesn't award excessive XP.
    """
    if questions_count <= 0:
        return 0
    base_xp = questions_count * 5  # 5 XP per question
    accuracy_multiplier = min(100, max(0, accuracy)) / 100
    xp = int(base_xp * accuracy_multiplier)
    if is_daily_challenge:
        xp = int(xp * 1.5)  # 50% bonus for daily challenges
    cap = QUIZ_XP_CAP_DAILY_CHALLENGE if is_daily_challenge else QUIZ_XP_CAP
    return min(xp, cap)


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

