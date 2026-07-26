"""
Coding-problem models.

A CodingProblem is authored under a Topic (mirrors Assignment/Quiz placement).
It has a statement, a set of allowed languages, per-run limits, optional starter
code, and a set of TestCases. Sample test cases are visible to students (they can
"Run" against them); hidden cases are used for grading only. Students submit
source code; each CodingSubmission is executed against the test cases and scored.
"""
from django.db import models

from core.models import OrderedModel, TimeStampedModel
from exams.models import Topic, Subject, Course
from .languages import language_choices, LANGUAGE_KEYS


class CodingProblem(OrderedModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    # Where a student is expected to solve this problem.
    #   in_app   -> solved by passing all in-app test cases (default, legacy behaviour)
    #   external -> solved only on an external judge (e.g. LeetCode); self-reported
    #   both     -> either an in-app all-pass OR an external self-report completes it
    SOLVE_MODE_CHOICES = [
        ('in_app', 'Solve in app'),
        ('external', 'Solve on external platform'),
        ('both', 'Solve in app or external platform'),
    ]

    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='coding_problems',
        help_text='Required: no coding problem without tenant.',
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='coding_problems')
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='coding_problems',
    )
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='coding_problems')

    title = models.CharField(max_length=500)
    # Rich problem statement (HTML / Markdown, supports pasted images like notes).
    statement = models.TextField(blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')

    # List of allowed language keys (subset of LANGUAGE_KEYS), e.g. ["python","cpp"].
    allowed_languages = models.JSONField(default=list, blank=True)
    # Optional starter code per language: {"python": "...", "cpp": "..."}.
    starter_code = models.JSONField(default=dict, blank=True)

    # Per-run sandbox limits (also hard-capped in the execution service).
    time_limit_ms = models.PositiveIntegerField(default=3000)
    memory_limit_mb = models.PositiveIntegerField(default=256)

    max_marks = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # External-judge support (e.g. LeetCode / GeeksforGeeks / HackerRank).
    solve_mode = models.CharField(max_length=10, choices=SOLVE_MODE_CHOICES, default='in_app')
    # Optional link to the same problem on an external platform. Required when
    # solve_mode is 'external' or 'both' (enforced in the authoring serializer).
    external_url = models.URLField(max_length=1000, blank=True)

    class Meta:
        verbose_name = 'Coding Problem'
        verbose_name_plural = 'Coding Problems'
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_open(self):
        return self.status == 'published'

    def normalized_languages(self):
        langs = [l for l in (self.allowed_languages or []) if l in LANGUAGE_KEYS]
        return langs or list(LANGUAGE_KEYS)

    @property
    def allows_in_app(self):
        return self.solve_mode in ('in_app', 'both')

    @property
    def allows_external(self):
        return self.solve_mode in ('external', 'both') and bool(self.external_url)


class TestCase(OrderedModel):
    problem = models.ForeignKey(CodingProblem, on_delete=models.CASCADE, related_name='test_cases')
    stdin = models.TextField(blank=True)
    expected_output = models.TextField(blank=True)
    # Sample cases are shown to students and runnable; hidden cases grade only.
    is_sample = models.BooleanField(default=False)
    points = models.PositiveIntegerField(default=1)
    # Optional short explanation shown for sample cases.
    explanation = models.CharField(max_length=500, blank=True)

    class Meta:
        verbose_name = 'Test Case'
        verbose_name_plural = 'Test Cases'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'TestCase {self.id} ({"sample" if self.is_sample else "hidden"})'


class CodingSubmission(OrderedModel):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('done', 'Evaluated'),
        ('error', 'Engine error'),
    ]

    problem = models.ForeignKey(CodingProblem, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        'users.StudentProfile', on_delete=models.CASCADE, related_name='coding_submissions',
    )

    language = models.CharField(max_length=20, choices=language_choices())
    source_code = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='done')
    # Per-test verdicts (JSON list). Hidden-case I/O is never stored with answers
    # for students -- the serializer controls what is exposed.
    results = models.JSONField(default=list, blank=True)
    compile_output = models.TextField(blank=True)

    passed_count = models.PositiveIntegerField(default=0)
    total_count = models.PositiveIntegerField(default=0)
    passed_points = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    # Marks awarded scaled to problem.max_marks (if set), else raw passed_points.
    marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Coding Submission'
        verbose_name_plural = 'Coding Submissions'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['problem', 'student']),
        ]

    def __str__(self):
        return f'{self.student_id} → {self.problem_id} ({self.passed_count}/{self.total_count})'

    @property
    def all_passed(self):
        return self.total_count > 0 and self.passed_count == self.total_count


class CodingProblemCompletion(TimeStampedModel):
    """A definitive per-student completion record for a coding problem.

    Written when a student either passes all in-app test cases (method="in_app")
    or self-reports solving the problem on an external judge (method="external").
    Exactly one row per (problem, student); the `method` reflects how it was most
    recently completed. External completions are reversible (the student can
    unmark), which deletes the row.
    """
    METHOD_CHOICES = [
        ('in_app', 'Solved in app'),
        ('external', 'Solved on external platform'),
    ]

    tenant = models.ForeignKey(
        'core.Tenant', on_delete=models.CASCADE, related_name='coding_completions',
    )
    problem = models.ForeignKey(
        CodingProblem, on_delete=models.CASCADE, related_name='completions',
    )
    student = models.ForeignKey(
        'users.StudentProfile', on_delete=models.CASCADE, related_name='coding_completions',
    )
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='in_app')
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Coding Problem Completion'
        verbose_name_plural = 'Coding Problem Completions'
        constraints = [
            models.UniqueConstraint(fields=['problem', 'student'], name='uniq_problem_student_completion'),
        ]
        indexes = [
            models.Index(fields=['problem', 'student'], name='coding_completion_ps_idx'),
        ]

    def __str__(self):
        return f'{self.student_id} solved {self.problem_id} ({self.method})'
