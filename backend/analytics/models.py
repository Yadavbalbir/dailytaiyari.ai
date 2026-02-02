"""
Analytics models for tracking student performance.
"""
from django.db import models
from core.models import TimeStampedModel
from exams.models import Topic, Subject, Exam


class TopicMastery(TimeStampedModel):
    """
    Tracks a student's mastery level for each topic.
    Updated after every quiz/test attempt.
    """
    MASTERY_LEVELS = [
        (1, 'Beginner'),
        (2, 'Developing'),
        (3, 'Proficient'),
        (4, 'Expert'),
        (5, 'Master'),
    ]

    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='topic_masteries'
    )
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='masteries')
    
    # Mastery metrics
    mastery_level = models.PositiveIntegerField(choices=MASTERY_LEVELS, default=1)
    mastery_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # 0-100
    
    # Statistics
    total_questions_attempted = models.PositiveIntegerField(default=0)
    total_correct_answers = models.PositiveIntegerField(default=0)
    accuracy_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Speed
    average_time_per_question = models.PositiveIntegerField(default=0)  # seconds
    
    # Tracking
    last_attempted = models.DateTimeField(auto_now=True)
    streak_correct = models.PositiveIntegerField(default=0)  # Consecutive correct answers
    
    # Revision flag
    needs_revision = models.BooleanField(default=False)

    class Meta:
        unique_together = ['student', 'topic']
        verbose_name = 'Topic Mastery'
        verbose_name_plural = 'Topic Masteries'
        indexes = [
            models.Index(fields=['student', 'mastery_level']),
        ]

    def __str__(self):
        return f"{self.student.user.email} - {self.topic.name}: Level {self.mastery_level}"

    def update_mastery(self, correct, total, avg_time):
        """Update mastery based on new attempt."""
        self.total_questions_attempted += total
        self.total_correct_answers += correct
        
        if self.total_questions_attempted > 0:
            self.accuracy_percentage = (self.total_correct_answers / self.total_questions_attempted) * 100
        
        # Update average time
        if self.average_time_per_question == 0:
            self.average_time_per_question = avg_time
        else:
            self.average_time_per_question = int(
                (self.average_time_per_question + avg_time) / 2
            )
        
        # Calculate mastery score (accuracy weighted by volume)
        volume_factor = min(1, self.total_questions_attempted / 50)  # Max factor at 50 questions
        self.mastery_score = self.accuracy_percentage * (0.5 + 0.5 * volume_factor)
        
        # Determine mastery level
        if self.mastery_score >= 90:
            self.mastery_level = 5
        elif self.mastery_score >= 75:
            self.mastery_level = 4
        elif self.mastery_score >= 60:
            self.mastery_level = 3
        elif self.mastery_score >= 40:
            self.mastery_level = 2
        else:
            self.mastery_level = 1
        
        # Check if needs revision
        self.needs_revision = self.mastery_level <= 2
        
        self.save()


class SubjectPerformance(TimeStampedModel):
    """
    Aggregated performance at subject level.
    """
    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='subject_performances'
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='performances')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='subject_performances')
    
    # Statistics
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Topic coverage
    topics_attempted = models.PositiveIntegerField(default=0)
    topics_mastered = models.PositiveIntegerField(default=0)  # Level 4+
    
    # Progress
    overall_progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # 0-100
    
    # Time analysis
    total_study_minutes = models.PositiveIntegerField(default=0)
    average_speed = models.PositiveIntegerField(default=0)  # seconds per question

    class Meta:
        unique_together = ['student', 'subject', 'exam']
        verbose_name = 'Subject Performance'
        verbose_name_plural = 'Subject Performances'

    def __str__(self):
        return f"{self.student.user.email} - {self.subject.name}"


class DailyActivity(TimeStampedModel):
    """
    Daily activity tracking for study patterns.
    """
    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='daily_activities'
    )
    date = models.DateField()
    
    # Study metrics
    study_time_minutes = models.PositiveIntegerField(default=0)
    questions_attempted = models.PositiveIntegerField(default=0)
    questions_correct = models.PositiveIntegerField(default=0)
    
    # Content consumption
    notes_read = models.PositiveIntegerField(default=0)
    videos_watched = models.PositiveIntegerField(default=0)
    
    # Quiz/Test activity
    quizzes_completed = models.PositiveIntegerField(default=0)
    mock_tests_completed = models.PositiveIntegerField(default=0)
    
    # XP
    xp_earned = models.PositiveIntegerField(default=0)
    
    # Goals
    daily_goal_met = models.BooleanField(default=False)

    class Meta:
        unique_together = ['student', 'date']
        verbose_name = 'Daily Activity'
        verbose_name_plural = 'Daily Activities'
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.user.email} - {self.date}"


class Streak(TimeStampedModel):
    """
    Study streak tracking.
    """
    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='streaks'
    )
    exam = models.ForeignKey(
        Exam, 
        on_delete=models.CASCADE, 
        related_name='streaks',
        null=True, blank=True
    )
    
    # Current streak
    current_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    # Records
    longest_streak = models.PositiveIntegerField(default=0)
    longest_streak_start = models.DateField(null=True, blank=True)
    longest_streak_end = models.DateField(null=True, blank=True)
    
    # Total active days
    total_active_days = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['student', 'exam']
        verbose_name = 'Streak'
        verbose_name_plural = 'Streaks'

    def __str__(self):
        return f"{self.student.user.email} - {self.current_streak} days"

    def update_streak(self, activity_date):
        """Update streak based on activity."""
        from datetime import timedelta
        
        if self.last_activity_date is None:
            self.current_streak = 1
        elif activity_date == self.last_activity_date:
            # Same day, no change
            return
        elif activity_date == self.last_activity_date + timedelta(days=1):
            # Consecutive day
            self.current_streak += 1
        elif activity_date > self.last_activity_date + timedelta(days=1):
            # Streak broken
            self.current_streak = 1
        
        self.last_activity_date = activity_date
        self.total_active_days += 1
        
        # Check for new record
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
            self.longest_streak_end = activity_date
            if self.longest_streak == self.current_streak:
                self.longest_streak_start = activity_date - timedelta(days=self.current_streak - 1)
        
        self.save()


class WeeklyReport(TimeStampedModel):
    """
    Weekly performance summary.
    """
    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='weekly_reports'
    )
    week_start = models.DateField()
    week_end = models.DateField()
    
    # Summary stats
    total_study_minutes = models.PositiveIntegerField(default=0)
    questions_attempted = models.PositiveIntegerField(default=0)
    questions_correct = models.PositiveIntegerField(default=0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Goals
    days_active = models.PositiveIntegerField(default=0)
    goals_met = models.PositiveIntegerField(default=0)
    
    # Topics
    topics_covered = models.PositiveIntegerField(default=0)
    topics_improved = models.PositiveIntegerField(default=0)
    weak_topics = models.JSONField(default=list)  # List of topic IDs
    
    # XP & Rank
    xp_earned = models.PositiveIntegerField(default=0)
    rank_change = models.IntegerField(default=0)  # Positive = improved
    
    # Comparison
    vs_last_week = models.JSONField(default=dict)  # {metric: change_percentage}

    class Meta:
        unique_together = ['student', 'week_start']
        verbose_name = 'Weekly Report'
        verbose_name_plural = 'Weekly Reports'
        ordering = ['-week_start']

    def __str__(self):
        return f"{self.student.user.email} - Week of {self.week_start}"


class StudySession(TimeStampedModel):
    """
    Tracks active study sessions for real-time timer functionality.
    Records when user is actively on the website.
    """
    student = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='study_sessions'
    )
    date = models.DateField()
    
    # Time tracking (all in seconds for precision)
    total_seconds_today = models.PositiveIntegerField(default=0)
    goal_seconds = models.PositiveIntegerField(default=0)  # Copied from profile on session start
    
    # Session state
    is_active = models.BooleanField(default=False)
    last_heartbeat = models.DateTimeField(auto_now=True)
    session_started_at = models.DateTimeField(null=True, blank=True)
    
    # Goal tracking
    goal_achieved = models.BooleanField(default=False)
    goal_achieved_at = models.DateTimeField(null=True, blank=True)
    
    # Rewards given
    goal_xp_awarded = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['student', 'date']
        verbose_name = 'Study Session'
        verbose_name_plural = 'Study Sessions'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.user.email} - {self.date} ({self.total_seconds_today}s)"
    
    @property
    def remaining_seconds(self):
        """Seconds remaining to reach goal (can be negative if exceeded)."""
        return self.goal_seconds - self.total_seconds_today
    
    @property
    def progress_percentage(self):
        """Progress towards goal (can exceed 100%)."""
        if self.goal_seconds == 0:
            return 0
        return (self.total_seconds_today / self.goal_seconds) * 100
    
    @property
    def exceeded_goal(self):
        """Whether the user has exceeded their daily goal."""
        return self.total_seconds_today > self.goal_seconds

