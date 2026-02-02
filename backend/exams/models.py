"""
Exam models - Exam-agnostic structure for all competitive exams.
Supports NEET, IIT JEE, CBSE, NDA, SSC, Banking, UPSC, CUET etc.
"""
from django.db import models
from core.models import TimeStampedModel, OrderedModel


class Exam(TimeStampedModel):
    """
    Represents an exam category (e.g., NEET, IIT JEE, CBSE Class 10).
    """
    EXAM_TYPES = [
        ('competitive', 'Competitive Exam'),
        ('board', 'Board Exam'),
        ('entrance', 'Entrance Exam'),
        ('government', 'Government Job Exam'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('coming_soon', 'Coming Soon'),
        ('inactive', 'Inactive'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)  # e.g., 'neet', 'jee-main'
    description = models.TextField(blank=True)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES)
    
    # Visual
    icon = models.ImageField(upload_to='exam_icons/', blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    
    # Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    
    # Exam details
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(null=True, blank=True)
    negative_marking = models.BooleanField(default=False)
    negative_marking_ratio = models.DecimalField(
        max_digits=3, decimal_places=2, 
        default=0.25,
        help_text="e.g., 0.25 means 1/4 negative marking"
    )
    
    # Statistics (denormalized for performance)
    total_students = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'
        ordering = ['name']

    def __str__(self):
        return self.name


class Subject(OrderedModel):
    """
    Subjects within an exam (e.g., Physics, Chemistry for NEET).
    A subject can belong to multiple exams.
    """
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Visual
    icon = models.CharField(max_length=50, blank=True)  # Icon name
    color = models.CharField(max_length=7, default='#10B981')
    
    # Exam relationship
    exams = models.ManyToManyField(Exam, related_name='subjects')
    
    # Importance for exam
    weightage = models.DecimalField(
        max_digits=5, decimal_places=2, 
        default=0,
        help_text="Percentage weightage in the exam"
    )
    
    # Statistics
    total_topics = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return self.name


class Topic(OrderedModel):
    """
    Topics within a subject (e.g., "Laws of Motion" in Physics).
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    IMPORTANCE_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    name = models.CharField(max_length=300)
    code = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Hierarchy
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    parent_topic = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='subtopics'
    )
    
    # Metadata
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    importance = models.CharField(max_length=20, choices=IMPORTANCE_CHOICES, default='medium')
    
    # Exam-specific importance (which exams is this topic important for)
    exams = models.ManyToManyField(Exam, through='TopicExamRelevance', related_name='topics')
    
    # Study time estimate
    estimated_study_hours = models.DecimalField(max_digits=4, decimal_places=1, default=1.0)
    
    # Statistics
    total_questions = models.PositiveIntegerField(default=0)
    total_content = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Topic'
        verbose_name_plural = 'Topics'

    def __str__(self):
        return f"{self.subject.name} - {self.name}"


class TopicExamRelevance(TimeStampedModel):
    """
    Tracks the relevance of a topic to specific exams.
    Allows different importance levels for the same topic across exams.
    """
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    
    # Exam-specific importance
    importance = models.CharField(
        max_length=20, 
        choices=Topic.IMPORTANCE_CHOICES, 
        default='medium'
    )
    average_questions = models.PositiveIntegerField(
        default=0,
        help_text="Average questions from this topic in the exam"
    )
    marks_weightage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        unique_together = ['topic', 'exam']
        verbose_name = 'Topic Exam Relevance'
        verbose_name_plural = 'Topic Exam Relevances'

    def __str__(self):
        return f"{self.topic.name} - {self.exam.name}"


class Chapter(OrderedModel):
    """
    Chapters organize topics into a learning sequence.
    Maps to textbook chapters for board exams.
    """
    name = models.CharField(max_length=300)
    code = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Relationships
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    topics = models.ManyToManyField(Topic, related_name='chapters')
    
    # For board exams (e.g., CBSE)
    grade = models.CharField(max_length=20, blank=True)
    book_reference = models.CharField(max_length=200, blank=True)
    
    # Study estimate
    estimated_hours = models.DecimalField(max_digits=4, decimal_places=1, default=2.0)

    class Meta:
        verbose_name = 'Chapter'
        verbose_name_plural = 'Chapters'

    def __str__(self):
        return f"{self.subject.name} - {self.name}"

