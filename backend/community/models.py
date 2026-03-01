"""
Community Forum models - Posts, Comments, Likes, Polls, Quizzes.
"""
from django.db import models
from django.core.validators import MinLengthValidator
from core.models import TimeStampedModel
from exams.models import Exam, Subject


class Post(TimeStampedModel):
    """
    Base model for community posts - questions, polls, quizzes.
    """
    POST_TYPES = [
        ('question', 'Question'),
        ('poll', 'Poll'),
        ('quiz', 'Quiz'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('hidden', 'Hidden'),
    ]

    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='question')
    title = models.CharField(max_length=300, validators=[MinLengthValidator(10)])
    content = models.TextField(validators=[MinLengthValidator(20)])
    image = models.ImageField(upload_to='community/posts/', null=True, blank=True)

    
    author = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='community_posts'
    )
    
    # Categorization
    exam = models.ForeignKey(
        Exam,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='community_posts'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='community_posts'
    )
    tags = models.JSONField(default=list, blank=True)
    
    # Stats
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    
    # Question-specific
    is_solved = models.BooleanField(default=False)
    best_answer = models.ForeignKey(
        'Comment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='best_answer_for'
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # XP tracking
    xp_awarded = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post_type', 'status', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['exam', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.post_type}] {self.title[:50]}"


class Comment(TimeStampedModel):
    """
    Comments/answers on posts. Supports nested replies.
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='replies'
    )
    author = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='community_comments'
    )
    
    content = models.TextField(validators=[MinLengthValidator(5)])
    image = models.ImageField(upload_to='community/comments/', null=True, blank=True)
    
    # Stats
    likes_count = models.PositiveIntegerField(default=0)
    
    # Best answer flag
    is_best_answer = models.BooleanField(default=False)
    
    # XP tracking
    xp_awarded = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
        ordering = ['-is_best_answer', '-likes_count', 'created_at']

    def __str__(self):
        return f"Comment by {self.author.user.email} on {self.post.title[:30]}"


class Like(TimeStampedModel):
    """
    Likes for posts and comments.
    """
    user = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='community_likes'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='likes'
    )
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='likes'
    )

    class Meta:
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'post'],
                name='unique_post_like',
                condition=models.Q(post__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['user', 'comment'],
                name='unique_comment_like',
                condition=models.Q(comment__isnull=False)
            ),
        ]

    def __str__(self):
        target = self.post.title[:30] if self.post else f"Comment #{self.comment_id}"
        return f"Like by {self.user.user.email} on {target}"


class PollOption(TimeStampedModel):
    """
    Options for poll posts.
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='poll_options'
    )
    option_text = models.CharField(max_length=200)
    votes_count = models.PositiveIntegerField(default=0)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'Poll Option'
        verbose_name_plural = 'Poll Options'
        ordering = ['order']

    def __str__(self):
        return f"{self.option_text} ({self.votes_count} votes)"


class PollVote(TimeStampedModel):
    """
    User votes on poll options.
    """
    user = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='poll_votes'
    )
    option = models.ForeignKey(
        PollOption,
        on_delete=models.CASCADE,
        related_name='votes'
    )

    class Meta:
        verbose_name = 'Poll Vote'
        verbose_name_plural = 'Poll Votes'
        unique_together = ['user', 'option']

    def __str__(self):
        return f"{self.user.user.email} voted for {self.option.option_text}"


class CommunityQuiz(TimeStampedModel):
    """
    Single-question quiz attached to a post.
    """
    post = models.OneToOneField(
        Post,
        on_delete=models.CASCADE,
        related_name='quiz'
    )
    question = models.TextField()
    options = models.JSONField()  # List of option strings
    correct_answer = models.PositiveSmallIntegerField()  # Index of correct option
    explanation = models.TextField(blank=True)
    
    # Stats
    attempts_count = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Community Quiz'
        verbose_name_plural = 'Community Quizzes'

    @property
    def success_rate(self):
        if self.attempts_count == 0:
            return 0
        return round((self.correct_count / self.attempts_count) * 100, 1)

    def __str__(self):
        return f"Quiz: {self.question[:50]}"


class QuizAttempt(TimeStampedModel):
    """
    User attempts on community quizzes.
    """
    user = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='community_quiz_attempts'
    )
    quiz = models.ForeignKey(
        CommunityQuiz,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    selected_answer = models.PositiveSmallIntegerField()
    is_correct = models.BooleanField()
    xp_earned = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Quiz Attempt'
        verbose_name_plural = 'Quiz Attempts'
        unique_together = ['user', 'quiz']

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{self.user.user.email} {status} {self.quiz.question[:30]}"


class CommunityStats(TimeStampedModel):
    """
    Aggregated community statistics per user.
    """
    user = models.OneToOneField(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='community_stats'
    )
    
    # Counts
    posts_count = models.PositiveIntegerField(default=0)
    questions_count = models.PositiveIntegerField(default=0)
    polls_count = models.PositiveIntegerField(default=0)
    quizzes_count = models.PositiveIntegerField(default=0)
    
    answers_count = models.PositiveIntegerField(default=0)
    best_answers_count = models.PositiveIntegerField(default=0)
    
    likes_given = models.PositiveIntegerField(default=0)
    likes_received = models.PositiveIntegerField(default=0)
    
    # XP from community
    total_community_xp = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Community Stats'
        verbose_name_plural = 'Community Stats'

    def __str__(self):
        return f"Stats for {self.user.user.email}"


class CommunityLeaderboard(TimeStampedModel):
    """
    Community leaderboard entries.
    """
    PERIOD_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('all_time', 'All Time'),
    ]

    user = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='community_leaderboard'
    )
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Metrics
    posts_count = models.PositiveIntegerField(default=0)
    answers_count = models.PositiveIntegerField(default=0)
    best_answers_count = models.PositiveIntegerField(default=0)
    likes_received = models.PositiveIntegerField(default=0)
    community_xp = models.PositiveIntegerField(default=0)
    
    # Ranking
    rank = models.PositiveIntegerField()
    score = models.PositiveIntegerField(default=0)  # Composite score for ranking

    class Meta:
        verbose_name = 'Community Leaderboard'
        verbose_name_plural = 'Community Leaderboard'
        unique_together = ['user', 'period', 'period_start']
        ordering = ['rank']
        indexes = [
            models.Index(fields=['period', 'period_start', 'rank']),
        ]

    def __str__(self):
        return f"{self.user.user.email} - Rank #{self.rank} ({self.period})"
