"""
Chatbot models for AI doubt solver.
"""
from django.db import models
from core.models import TimeStampedModel
from exams.models import Topic, Subject


class ChatSession(TimeStampedModel):
    """
    A chat session with the AI doubt solver.
    """
    student = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    
    # Context
    title = models.CharField(max_length=200, blank=True)
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_sessions'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_sessions'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Stats
    message_count = models.PositiveIntegerField(default=0)
    
    # Feedback
    was_helpful = models.BooleanField(null=True, blank=True)
    rating = models.PositiveIntegerField(null=True, blank=True)  # 1-5

    class Meta:
        verbose_name = 'Chat Session'
        verbose_name_plural = 'Chat Sessions'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.student.user.email} - {self.title or 'Untitled'}"


class ChatMessage(TimeStampedModel):
    """
    Individual message in a chat session.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # For image/file uploads
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    
    # AI response metadata
    model_used = models.CharField(max_length=50, blank=True)
    tokens_used = models.PositiveIntegerField(default=0)
    response_time_ms = models.PositiveIntegerField(default=0)
    
    # Feedback
    is_helpful = models.BooleanField(null=True, blank=True)

    class Meta:
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class SavedResponse(TimeStampedModel):
    """
    Saved/bookmarked AI responses for later reference.
    """
    student = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='saved_responses'
    )
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='saves'
    )
    
    # Organization
    title = models.CharField(max_length=200, blank=True)
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    
    # Notes
    personal_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Saved Response'
        verbose_name_plural = 'Saved Responses'
        unique_together = ['student', 'message']

    def __str__(self):
        return f"Saved: {self.title or self.message.content[:30]}..."


class FrequentQuestion(TimeStampedModel):
    """
    Frequently asked questions with pre-generated answers.
    """
    question = models.TextField()
    answer = models.TextField()
    
    # Context
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='faqs'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='faqs'
    )
    
    # Stats
    views_count = models.PositiveIntegerField(default=0)
    helpful_count = models.PositiveIntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Frequent Question'
        verbose_name_plural = 'Frequent Questions'

    def __str__(self):
        return self.question[:50]


class AIQuizAttempt(TimeStampedModel):
    """
    Tracks quizzes generated and attempted through the AI chatbot.
    """
    student = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='ai_quiz_attempts'
    )
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='quiz_attempts'
    )
    
    # Quiz content (stored as JSON)
    quiz_topic = models.CharField(max_length=200, blank=True)
    quiz_subject = models.CharField(max_length=100, blank=True)
    questions_data = models.JSONField(default=list)  # Store all questions with options
    
    # Results
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    wrong_answers = models.PositiveIntegerField(default=0)
    percentage = models.FloatField(default=0)
    
    # XP awarded
    xp_earned = models.PositiveIntegerField(default=0)
    
    # Time tracking
    time_taken_seconds = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'AI Quiz Attempt'
        verbose_name_plural = 'AI Quiz Attempts'
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Quiz: {self.student.user.email} - {self.quiz_topic or 'General'} ({self.percentage}%)"
    
    def calculate_results(self):
        """Calculate quiz results from answers."""
        if not self.questions_data:
            return
        
        correct = 0
        for q in self.questions_data:
            if q.get('user_answer') == q.get('correct_option'):
                correct += 1
        
        self.total_questions = len(self.questions_data)
        self.correct_answers = correct
        self.wrong_answers = self.total_questions - correct
        self.percentage = (correct / self.total_questions * 100) if self.total_questions > 0 else 0
    
    def calculate_xp(self):
        """Calculate XP based on performance."""
        if self.total_questions == 0:
            return 0
        
        # Base XP: 5 per question
        base_xp = self.total_questions * 5
        
        # Accuracy multiplier
        accuracy_multiplier = self.percentage / 100
        
        # Bonus for high accuracy
        bonus = 0
        if self.percentage == 100:
            bonus = 50  # Perfect score bonus
        elif self.percentage >= 80:
            bonus = 25  # Good score bonus
        elif self.percentage >= 60:
            bonus = 10  # Passing bonus
        
        self.xp_earned = int(base_xp * accuracy_multiplier) + bonus
        return self.xp_earned


class AIQuizQuestion(TimeStampedModel):
    """
    Individual question record for AI quiz attempts (for detailed analytics).
    """
    attempt = models.ForeignKey(
        AIQuizAttempt,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    
    # Question data
    question_index = models.PositiveIntegerField(default=0)
    question_text = models.TextField()
    options = models.JSONField(default=list)  # List of option strings
    correct_option = models.PositiveIntegerField(default=0)  # Index of correct option
    
    # User's answer
    user_answer = models.IntegerField(null=True, blank=True)  # Index of selected option
    is_correct = models.BooleanField(default=False)
    
    # Explanation
    explanation = models.TextField(blank=True)
    
    # Time spent on this question
    time_spent_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'AI Quiz Question'
        verbose_name_plural = 'AI Quiz Questions'
        ordering = ['attempt', 'question_index']

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"Q{self.question_index + 1} {status}: {self.question_text[:50]}..."


class AILearningStats(TimeStampedModel):
    """
    Aggregated AI learning statistics for a student.
    Updated after each AI quiz attempt.
    """
    student = models.OneToOneField(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='ai_learning_stats'
    )
    
    # Overall stats
    total_quizzes_attempted = models.PositiveIntegerField(default=0)
    total_questions_attempted = models.PositiveIntegerField(default=0)
    total_correct_answers = models.PositiveIntegerField(default=0)
    total_xp_earned = models.PositiveIntegerField(default=0)
    
    # Averages
    average_accuracy = models.FloatField(default=0)
    average_time_per_question = models.FloatField(default=0)  # in seconds
    
    # Streaks
    current_quiz_streak = models.PositiveIntegerField(default=0)
    longest_quiz_streak = models.PositiveIntegerField(default=0)
    last_quiz_date = models.DateField(null=True, blank=True)
    
    # Topic mastery (JSON: {"topic_name": {"attempted": X, "correct": Y}})
    topic_performance = models.JSONField(default=dict)
    
    # Achievements
    perfect_quizzes = models.PositiveIntegerField(default=0)  # 100% score
    quizzes_above_80 = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'AI Learning Stats'
        verbose_name_plural = 'AI Learning Stats'

    def __str__(self):
        return f"AI Stats: {self.student.user.email} - {self.total_xp_earned} XP"
    
    def update_from_attempt(self, attempt):
        """Update stats from a new quiz attempt."""
        self.total_quizzes_attempted += 1
        self.total_questions_attempted += attempt.total_questions
        self.total_correct_answers += attempt.correct_answers
        self.total_xp_earned += attempt.xp_earned
        
        # Update averages
        if self.total_questions_attempted > 0:
            self.average_accuracy = (self.total_correct_answers / self.total_questions_attempted) * 100
        
        # Update topic performance
        if attempt.quiz_topic:
            topic = attempt.quiz_topic
            if topic not in self.topic_performance:
                self.topic_performance[topic] = {'attempted': 0, 'correct': 0, 'quizzes': 0}
            self.topic_performance[topic]['attempted'] += attempt.total_questions
            self.topic_performance[topic]['correct'] += attempt.correct_answers
            self.topic_performance[topic]['quizzes'] += 1
        
        # Update achievements
        if attempt.percentage == 100:
            self.perfect_quizzes += 1
        if attempt.percentage >= 80:
            self.quizzes_above_80 += 1
        
        # Update streak
        from django.utils import timezone
        today = timezone.now().date()
        if self.last_quiz_date:
            if (today - self.last_quiz_date).days == 1:
                self.current_quiz_streak += 1
            elif (today - self.last_quiz_date).days > 1:
                self.current_quiz_streak = 1
        else:
            self.current_quiz_streak = 1
        
        if self.current_quiz_streak > self.longest_quiz_streak:
            self.longest_quiz_streak = self.current_quiz_streak
        
        self.last_quiz_date = today
        self.save()

