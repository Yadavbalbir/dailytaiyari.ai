"""Shared grading logic for coding submissions.

`finalize_submission` grades a *queued* CodingSubmission in place: it runs the
source against all of the problem's test cases, scores it, persists the result,
and — on the first full solve — records a completion and awards XP. It is used
by both the synchronous submit path (settings.CODE_JUDGE_ASYNC=False) and the
Celery task (async path), so scoring/XP semantics are identical either way.
"""
import logging
from decimal import Decimal

from . import services
from .models import CodingProblemCompletion

logger = logging.getLogger(__name__)


def award_solve_xp(student, problem):
    """Award coding-solved XP once per problem (idempotent). Returns XP given."""
    from gamification.models import XPTransaction
    from gamification.services import GamificationService
    from core.utils import calculate_xp_for_coding

    already_awarded = XPTransaction.objects.filter(
        student=student, transaction_type='coding_solved', reference_id=problem.id,
    ).exists()
    if already_awarded:
        return 0
    xp_awarded = calculate_xp_for_coding(problem.difficulty)
    GamificationService.award_xp(
        student,
        xp_awarded,
        'coding_solved',
        f'Solved coding problem: {problem.title}',
        str(problem.id),
    )
    return xp_awarded


def finalize_submission(submission):
    """Grade `submission` in place against all test cases and persist the result.

    Returns the XP awarded (0 unless this is the first full solve). On an engine
    failure the submission is marked status='error' with a user-facing message
    and services.EngineError is re-raised so the caller can decide how to surface
    it (HTTP 503 for the sync path; logged-and-swallowed for the async task).
    """
    problem = submission.problem
    student = submission.student

    cases = list(problem.test_cases.all().order_by('order', 'created_at'))
    if not cases:
        submission.status = 'error'
        submission.compile_output = 'This problem has no test cases yet.'
        submission.save(update_fields=['status', 'compile_output'])
        return 0

    try:
        outcome = services.run_against_cases(
            language=submission.language,
            source=submission.source_code,
            cases=cases,
            time_limit_ms=problem.time_limit_ms,
            memory_limit_mb=problem.memory_limit_mb,
            reveal_io=False,
        )
    except services.EngineError as exc:
        submission.status = 'error'
        submission.compile_output = str(exc)
        submission.save(update_fields=['status', 'compile_output'])
        raise

    marks = None
    if problem.max_marks and outcome['total_points'] > 0:
        marks = (
            Decimal(problem.max_marks) * outcome['passed_points'] / outcome['total_points']
        ).quantize(Decimal('0.01'))
    elif problem.max_marks:
        marks = Decimal('0.00')

    submission.status = 'error' if outcome['compile_error'] and outcome['passed_count'] == 0 else 'done'
    submission.results = outcome['results']
    submission.compile_output = outcome['compile_output']
    submission.passed_count = outcome['passed_count']
    submission.total_count = outcome['total_count']
    submission.passed_points = outcome['passed_points']
    submission.total_points = outcome['total_points']
    submission.marks = marks
    submission.save()

    xp_awarded = 0
    if submission.total_count > 0 and submission.passed_count == submission.total_count:
        CodingProblemCompletion.objects.update_or_create(
            problem=problem, student=student,
            defaults={'tenant': problem.tenant, 'method': 'in_app'},
        )
        xp_awarded = award_solve_xp(student, problem)
    return xp_awarded
