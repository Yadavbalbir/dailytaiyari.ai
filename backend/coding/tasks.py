"""Celery tasks for the coding app.

`grade_submission` grades a previously-created (queued) CodingSubmission off the
web request thread. This keeps a burst of submissions (contest/deadline) from
holding web workers/threads for the full ~seconds-per-submission execution: the
view returns a queued submission immediately and the client polls for the result.
"""
import logging

from celery import shared_task

from . import services
from .models import CodingSubmission

logger = logging.getLogger(__name__)


@shared_task(name='coding.grade_submission', bind=True, max_retries=0)
def grade_submission(self, submission_id):
    """Grade a queued submission in place. Idempotent-safe to re-run."""
    from . import grading

    # Atomically claim the job: only a still-'queued' row transitions to
    # 'running'. If another worker/redelivery already claimed or finished it,
    # skip -- this prevents duplicate grading (and duplicate XP) on redelivery.
    claimed = CodingSubmission.objects.filter(
        id=submission_id, status='queued',
    ).update(status='running')
    if not claimed:
        logger.info('grade_submission: %s already claimed/terminal, skipping', submission_id)
        return None

    try:
        submission = CodingSubmission.objects.select_related('problem', 'student').get(
            id=submission_id,
        )
    except CodingSubmission.DoesNotExist:
        logger.warning('grade_submission: submission %s not found', submission_id)
        return None

    try:
        grading.finalize_submission(submission)
    except services.EngineError as exc:
        # finalize_submission already marked the submission status='error' with a
        # user-facing message; the poll endpoint will surface it. Don't retry —
        # re-running untrusted code on a flaky engine isn't worth the churn.
        logger.error('grade_submission engine error for %s: %s', submission_id, exc)
    except Exception as exc:  # noqa: BLE001 - never leave a submission stuck 'running'
        # Soft/hard time limits, OOM, bugs, etc. Mark it errored so the student
        # isn't stuck on a spinner and can resubmit.
        logger.exception('grade_submission failed for %s: %s', submission_id, exc)
        CodingSubmission.objects.filter(id=submission_id).update(
            status='error',
            compile_output='Grading failed unexpectedly. Please try submitting again.',
        )

    return str(submission_id)
