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

