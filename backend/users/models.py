"""
User models for DailyTaiyari platform.
Custom User model with StudentProfile for IIT JEE & NEET exam preparation.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from core.models import TimeStampedModel
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model with email as the primary identifier.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # Remove username field
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Onboarding status
    is_onboarded = models.BooleanField(default=False)
    onboarded_at = models.DateTimeField(null=True, blank=True)
    
    # Preferences
    preferred_language = models.CharField(max_length=10, default='en')
    notification_enabled = models.BooleanField(default=True)
    dark_mode = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class StudentProfile(TimeStampedModel):
    """
    Extended profile for students preparing for IIT JEE & NEET.
    One profile per user, linked to their target exam.
    """
    
    GRADE_CHOICES = [
        ('6', 'Class 6'),
        ('7', 'Class 7'),
        ('8', 'Class 8'),
        ('9', 'Class 9'),
        ('10', 'Class 10'),
        ('11', 'Class 11'),
        ('12', 'Class 12'),
        ('graduate', 'Graduate'),
        ('other', 'Other'),
    ]
    
    BOARD_CHOICES = [
        ('cbse', 'CBSE'),
        ('icse', 'ICSE'),
        ('state', 'State Board'),
        ('ib', 'IB'),
        ('igcse', 'IGCSE'),
        ('other', 'Other'),
    ]
    
    MEDIUM_CHOICES = [
        ('english', 'English'),
        ('hindi', 'Hindi'),
        ('bilingual', 'Bilingual'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Personal info
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    instagram_handle = models.CharField(max_length=100, blank=True)
    parent_phone = models.CharField(max_length=15, blank=True)
    
    # Academic info
    grade = models.CharField(max_length=20, choices=GRADE_CHOICES, blank=True)
    school = models.CharField(max_length=200, blank=True)
    coaching = models.CharField(max_length=200, blank=True)
    board = models.CharField(max_length=20, choices=BOARD_CHOICES, blank=True)
    medium = models.CharField(max_length=20, choices=MEDIUM_CHOICES, default='english')
    target_year = models.PositiveIntegerField(null=True, blank=True)
    
    # Location
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    
    # Target exams (Many-to-many through ExamEnrollment)
    primary_exam = models.ForeignKey(
        'exams.Exam', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='primary_students'
    )
    
    # Study preferences
    daily_study_goal_minutes = models.PositiveIntegerField(default=60)
    preferred_study_time = models.CharField(
        max_length=20,
        choices=[
            ('morning', 'Morning (6AM-12PM)'),
            ('afternoon', 'Afternoon (12PM-6PM)'),
            ('evening', 'Evening (6PM-10PM)'),
            ('night', 'Night (10PM-6AM)'),
        ],
        default='evening'
    )
    
    # Overall stats (denormalized for quick access)
    total_xp = models.PositiveIntegerField(default=0)
    current_level = models.PositiveIntegerField(default=1)
    total_questions_attempted = models.PositiveIntegerField(default=0)
    total_correct_answers = models.PositiveIntegerField(default=0)
    total_study_time_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'

    def __str__(self):
        return f"Profile: {self.user.email}"

    @property
    def overall_accuracy(self):
        if self.total_questions_attempted == 0:
            return 0
        return round((self.total_correct_answers / self.total_questions_attempted) * 100, 2)

    def add_xp(self, xp_amount):
        """Add XP and check for level up."""
        self.total_xp += xp_amount
        new_level = self.calculate_level()
        if new_level > self.current_level:
            self.current_level = new_level
        self.save()
        return self.current_level

    def calculate_level(self):
        """Calculate level based on XP. Each level requires more XP."""
        xp = self.total_xp
        level = 1
        required_xp = 100
        while xp >= required_xp:
            xp -= required_xp
            level += 1
            required_xp = int(required_xp * 1.5)  # Each level needs 50% more XP
        return level

    @property
    def xp_for_next_level(self):
        """Calculate XP needed for next level."""
        level = 1
        required_xp = 100
        total_required = 100
        while level < self.current_level:
            level += 1
            required_xp = int(required_xp * 1.5)
            total_required += required_xp
        return total_required - self.total_xp


class ExamEnrollment(TimeStampedModel):
    """
    Tracks which exams a student is preparing for.
    Allows multiple exam preparations simultaneously.
    """
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    exam = models.ForeignKey('exams.Exam', on_delete=models.CASCADE, related_name='enrollments')
    
    # Status
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    
    # Exam-specific stats
    exam_xp = models.PositiveIntegerField(default=0)
    exam_rank = models.PositiveIntegerField(null=True, blank=True)
    
    # Target
    target_score = models.PositiveIntegerField(null=True, blank=True)
    target_rank = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'exam']
        verbose_name = 'Exam Enrollment'
        verbose_name_plural = 'Exam Enrollments'

    def __str__(self):
        return f"{self.student.user.email} - {self.exam.name}"

