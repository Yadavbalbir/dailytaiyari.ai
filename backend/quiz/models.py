"""
Quiz models - Questions, Quizzes, Mock Tests, and Attempts.
"""
from django.db import models
from core.models import TimeStampedModel, OrderedModel
from exams.models import Topic, Subject, Exam
import uuid


class Question(TimeStampedModel):
    """
    Question bank model supporting multiple question types.
    """
    QUESTION_TYPES = [
        ('mcq', 'Multiple Choice (Single)'),
        ('mcq_multi', 'Multiple Choice (Multiple)'),
        ('true_false', 'True/False'),
        ('numerical', 'Numerical'),
        ('fill_blank', 'Fill in the Blank'),
        ('match', 'Match the Following'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    # Question content
    question_text = models.TextField()
    question_html = models.TextField(blank=True)  # Rich text with formulas
    question_image = models.ImageField(upload_to='questions/', blank=True, null=True)
    
    # Type and metadata
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='mcq')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Relationships
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    exams = models.ManyToManyField(Exam, related_name='questions')
    
    # Answer
    correct_answer = models.CharField(max_length=500)  # Option index or value
    explanation = models.TextField(blank=True)
    explanation_image = models.ImageField(upload_to='explanations/', blank=True, null=True)
    
    # For numerical questions
    numerical_answer = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    numerical_tolerance = models.DecimalField(max_digits=10, decimal_places=5, default=0.01)
    
    # Scoring
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    negative_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.25)
    
    # Statistics (updated periodically)
    times_attempted = models.PositiveIntegerField(default=0)
    times_correct = models.PositiveIntegerField(default=0)
    average_time_seconds = models.PositiveIntegerField(default=0)
    
    # Source
    source = models.CharField(max_length=200, blank=True)  # e.g., "NEET 2023"
    year = models.PositiveIntegerField(null=True, blank=True)
    
    # Tags for filtering
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        indexes = [
            models.Index(fields=['topic', 'difficulty']),
            models.Index(fields=['subject', 'status']),
        ]

    def __str__(self):
        return f"Q{self.id}: {self.question_text[:50]}..."

    @property
    def accuracy_rate(self):
        if self.times_attempted == 0:
            return 0
        return round((self.times_correct / self.times_attempted) * 100, 2)


class QuestionOption(OrderedModel):
    """
    Options for MCQ questions.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    option_image = models.ImageField(upload_to='options/', blank=True, null=True)
    is_correct = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Question Option'
        verbose_name_plural = 'Question Options'

    def __str__(self):
        return f"Option {self.order}: {self.option_text[:30]}..."


class Quiz(TimeStampedModel):
    """
    Quiz model - can be topic-wise, subject-wise, or custom.
    """
    QUIZ_TYPES = [
        ('topic', 'Topic Quiz'),
        ('subject', 'Subject Quiz'),
        ('chapter', 'Chapter Quiz'),
        ('daily', 'Daily Challenge'),
        ('custom', 'Custom Quiz'),
        ('pyq', 'Previous Year Questions'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Relationships
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='quizzes')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    
    # Questions
    questions = models.ManyToManyField(Question, through='QuizQuestion', related_name='quizzes')
    
    # Settings
    duration_minutes = models.PositiveIntegerField(default=15)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    passing_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    # Rules
    shuffle_questions = models.BooleanField(default=True)
    shuffle_options = models.BooleanField(default=True)
    show_answer_after_each = models.BooleanField(default=False)
    allow_skip = models.BooleanField(default=True)
    
    # Visibility
    is_free = models.BooleanField(default=True)
    is_daily_challenge = models.BooleanField(default=False)
    challenge_date = models.DateField(null=True, blank=True)
    
    # Statistics
    total_attempts = models.PositiveIntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return self.title

    @property
    def questions_count(self):
        return self.questions.count()


class QuizQuestion(OrderedModel):
    """
    Through model for Quiz-Question relationship with ordering.
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['quiz', 'question']
        verbose_name = 'Quiz Question'
        verbose_name_plural = 'Quiz Questions'


class MockTest(TimeStampedModel):
    """
    Full-length mock test simulating actual exam.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='mock_tests')
    
    # Sections (for exams with multiple subjects)
    sections = models.JSONField(default=list)  # [{subject_id, questions_count, marks}]
    
    # Questions
    questions = models.ManyToManyField(Question, through='MockTestQuestion', related_name='mock_tests')
    
    # Settings (from exam defaults)
    duration_minutes = models.PositiveIntegerField()
    total_marks = models.DecimalField(max_digits=6, decimal_places=2)
    negative_marking = models.BooleanField(default=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_free = models.BooleanField(default=False)
    
    # Scheduling
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_attempts = models.PositiveIntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    highest_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Mock Test'
        verbose_name_plural = 'Mock Tests'

    def __str__(self):
        return self.title


class MockTestQuestion(OrderedModel):
    """
    Through model for MockTest-Question with section info.
    """
    mock_test = models.ForeignKey(MockTest, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    section = models.PositiveIntegerField(default=0)  # Section index

    class Meta:
        unique_together = ['mock_test', 'question']


class QuizAttempt(TimeStampedModel):
    """
    Records a student's quiz attempt.
    """
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
        ('timed_out', 'Timed Out'),
    ]

    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='quiz_attempts'
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    # Results
    total_questions = models.PositiveIntegerField(default=0)
    attempted_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    wrong_answers = models.PositiveIntegerField(default=0)
    skipped_questions = models.PositiveIntegerField(default=0)
    
    # Scoring
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # XP earned
    xp_earned = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Quiz Attempt'
        verbose_name_plural = 'Quiz Attempts'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.user.email} - {self.quiz.title}"

    def calculate_results(self):
        """Calculate and update results from answers."""
        answers = self.answers.all()
        self.total_questions = self.quiz.questions.count()
        self.attempted_questions = answers.count()
        self.correct_answers = answers.filter(is_correct=True).count()
        self.wrong_answers = answers.filter(is_correct=False).count()
        self.skipped_questions = self.total_questions - self.attempted_questions
        
        # Calculate marks
        marks = 0
        for answer in answers:
            if answer.is_correct:
                marks += answer.question.marks
            else:
                marks -= answer.question.negative_marks
        
        self.marks_obtained = max(0, marks)
        self.total_marks = sum(q.marks for q in self.quiz.questions.all())
        
        if self.total_marks > 0:
            self.percentage = (self.marks_obtained / self.total_marks) * 100
        
        self.save()


class MockTestAttempt(TimeStampedModel):
    """
    Records a student's mock test attempt.
    """
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
        ('timed_out', 'Timed Out'),
    ]

    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='mock_test_attempts'
    )
    mock_test = models.ForeignKey(MockTest, on_delete=models.CASCADE, related_name='attempts')
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    # Results
    total_questions = models.PositiveIntegerField(default=0)
    attempted_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    wrong_answers = models.PositiveIntegerField(default=0)
    
    # Scoring
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Section-wise results
    section_results = models.JSONField(default=dict)  # {section_id: {attempted, correct, marks}}
    
    # Rank (calculated after submission)
    rank = models.PositiveIntegerField(null=True, blank=True)
    percentile = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # XP
    xp_earned = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Mock Test Attempt'
        verbose_name_plural = 'Mock Test Attempts'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.user.email} - {self.mock_test.title}"


class Answer(TimeStampedModel):
    """
    Individual answer in a quiz/mock test attempt.
    """
    # Can be linked to either quiz or mock test attempt
    quiz_attempt = models.ForeignKey(
        QuizAttempt, 
        on_delete=models.CASCADE, 
        related_name='answers',
        null=True, blank=True
    )
    mock_test_attempt = models.ForeignKey(
        MockTestAttempt, 
        on_delete=models.CASCADE, 
        related_name='answers',
        null=True, blank=True
    )
    
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    
    # Answer data
    selected_option = models.CharField(max_length=500, blank=True)  # Option index or value
    answer_text = models.TextField(blank=True)  # For fill-in-blank
    numerical_answer = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    
    # Result
    is_correct = models.BooleanField(default=False)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Timing
    time_taken_seconds = models.PositiveIntegerField(default=0)
    
    # Status
    is_marked_for_review = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Answer'
        verbose_name_plural = 'Answers'

    def __str__(self):
        return f"Answer to Q{self.question_id}"

    def check_answer(self):
        """Check if the answer is correct and calculate marks."""
        question = self.question
        
        if question.question_type in ['mcq', 'true_false']:
            self.is_correct = self.selected_option == question.correct_answer
        elif question.question_type == 'numerical':
            if self.numerical_answer is not None and question.numerical_answer is not None:
                diff = abs(self.numerical_answer - question.numerical_answer)
                self.is_correct = diff <= question.numerical_tolerance
        elif question.question_type == 'fill_blank':
            self.is_correct = self.answer_text.strip().lower() == question.correct_answer.strip().lower()
        
        if self.is_correct:
            self.marks_obtained = question.marks
        else:
            self.marks_obtained = -question.negative_marks
        
        self.save()
        return self.is_correct


class QuestionReport(TimeStampedModel):
    """
    Model for reporting problems with questions.
    """
    REPORT_TYPES = [
        ('wrong_answer', 'Wrong Answer/Solution'),
        ('unclear_question', 'Unclear Question'),
        ('wrong_options', 'Wrong/Missing Options'),
        ('formatting_issue', 'Formatting Issue'),
        ('typo', 'Typo/Spelling Error'),
        ('wrong_topic', 'Wrong Topic/Subject'),
        ('duplicate', 'Duplicate Question'),
        ('outdated', 'Outdated Information'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewing', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(
        'users.StudentProfile',
        on_delete=models.CASCADE,
        related_name='question_reports'
    )
    
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    description = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_response = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_reports'
    )
    
    class Meta:
        verbose_name = 'Question Report'
        verbose_name_plural = 'Question Reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Report on Q{self.question_id} by {self.reported_by}"

