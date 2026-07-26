"""Student-facing coding endpoints: list problems, solve, run samples, submit."""
import logging

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import F
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from users.models import CourseEnrollment

from .models import CodingProblem, CodingSubmission, CodingProblemCompletion
from .serializers import (
    CodingProblemListSerializer,
    CodingProblemDetailSerializer,
    SubmissionResultSerializer,
)
from .languages import LANGUAGES
from . import services

logger = logging.getLogger(__name__)


class CodingProblemViewSet(viewsets.ReadOnlyModelViewSet):
    """Published coding problems for the student's approved-enrolled courses."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return CodingProblemDetailSerializer if self.action == 'retrieve' else CodingProblemListSerializer

    def get_throttles(self):
        if self.action == 'run':
            self.throttle_scope = 'code_run'
            return [ScopedRateThrottle()]
        if self.action == 'submit':
            self.throttle_scope = 'code_submit'
            return [ScopedRateThrottle()]
        # Polling one's own submission is a cheap authenticated read that the
        # frontend does repeatedly while a submission grades — don't throttle it
        # under the shared 'user' bucket (that would starve normal API calls).
        if self.action == 'submission_status':
            return []
        return super().get_throttles()

    def _student(self):
        return getattr(self.request.user, 'profile', None)

    def _enrolled_course_ids(self):
        student = self._student()
        if not student:
            return []
        return list(CourseEnrollment.objects.filter(
            student=student, status='approved', is_active=True,
        ).values_list('course_id', flat=True))

    def get_queryset(self):
        qs = CodingProblem.objects.select_related('topic', 'subject').filter(
            status='published', course_id__in=self._enrolled_course_ids(),
        )
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs.order_by('order', '-created_at')

    def _attach_best(self, problems):
        """Attach each student's best submission + explicit completion record."""
        student = self._student()
        if not student:
            return
        best = {}
        subs = CodingSubmission.objects.filter(
            student=student, problem__in=problems,
        ).exclude(status__in=['queued', 'running']).order_by('problem_id', '-passed_points', '-submitted_at')
        for s in subs:
            if s.problem_id not in best:
                best[s.problem_id] = s
        completions = {
            c.problem_id: c
            for c in CodingProblemCompletion.objects.filter(student=student, problem__in=problems)
        }
        for p in problems:
            p._my_best = best.get(p.id)
            p._my_completion = completions.get(p.id)

    def list(self, request, *args, **kwargs):
        problems = list(self.get_queryset())
        self._attach_best(problems)
        return Response(self.get_serializer(problems, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        problem = self.get_object()
        self._attach_best([problem])
        return Response(self.get_serializer(problem).data)

    def _validate_lang(self, problem, language):
        if language not in problem.normalized_languages() or language not in LANGUAGES:
            return Response(
                {'error': 'This language is not allowed for this problem.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Run code against SAMPLE cases (or a custom stdin). Not graded, not saved."""
        problem = self.get_object()
        language = request.data.get('language')
        source = request.data.get('source_code') or request.data.get('source') or ''
        custom_stdin = request.data.get('stdin')

        err = self._validate_lang(problem, language)
        if err:
            return err
        if not source.strip():
            return Response({'error': 'Write some code first.'}, status=400)

        try:
            if custom_stdin is not None:
                result = services.run_code(
                    language=language, source=source, stdin=custom_stdin,
                    time_limit_ms=problem.time_limit_ms,
                    memory_limit_mb=problem.memory_limit_mb,
                )
                return Response({'mode': 'custom', 'run': result})

            samples = list(problem.test_cases.filter(is_sample=True).order_by('order', 'created_at'))
            if not samples:
                return Response({'mode': 'samples', 'results': [], 'passed_count': 0, 'total_count': 0})
            outcome = services.run_against_cases(
                language=language, source=source, cases=samples,
                time_limit_ms=problem.time_limit_ms,
                memory_limit_mb=problem.memory_limit_mb,
                reveal_io=True,
            )
            return Response({'mode': 'samples', **outcome})
        except services.EngineError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Run code against ALL test cases, score, and persist the submission.

        Behaviour depends on settings.CODE_JUDGE_ASYNC:
          * async  -> create a 'queued' submission, enqueue grading to Celery,
                      return 202 with the queued submission; client polls
                      `submissions/<id>/` until status is done/error.
          * sync   -> grade in-request and return 201 with the full result
                      (legacy behaviour). Also the automatic fallback if the
                      task queue can't be reached.
        """
        problem = self.get_object()
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)
        if not problem.is_open:
            return Response({'error': 'This problem is closed.'}, status=status.HTTP_403_FORBIDDEN)

        language = request.data.get('language')
        source = request.data.get('source_code') or request.data.get('source') or ''
        err = self._validate_lang(problem, language)
        if err:
            return err
        if not source.strip():
            return Response({'error': 'Write some code first.'}, status=400)

        if not problem.test_cases.exists():
            return Response({'error': 'This problem has no test cases yet.'}, status=400)

        submission = CodingSubmission.objects.create(
            problem=problem, student=student, language=language, source_code=source,
            status='queued',
        )

        if getattr(settings, 'CODE_JUDGE_ASYNC', False):
            try:
                from .tasks import grade_submission
                grade_submission.delay(str(submission.id))
            except Exception as exc:  # broker down -> never block the student
                logger.warning('Async enqueue failed (%s); grading synchronously.', exc)
                return self._grade_sync(submission)
            data = SubmissionResultSerializer(submission).data
            data['xp_awarded'] = 0
            return Response(data, status=status.HTTP_202_ACCEPTED)

        return self._grade_sync(submission)

    def _grade_sync(self, submission):
        """Grade a queued submission in-request and return the 201 result."""
        from . import grading
        try:
            xp_awarded = grading.finalize_submission(submission)
        except services.EngineError as exc:
            # Preserve legacy behaviour: an engine failure leaves no submission
            # row and returns 503 (the student simply retries).
            submission.delete()
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        data = SubmissionResultSerializer(submission).data
        data['xp_awarded'] = xp_awarded
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'],
            url_path=r'submissions/(?P<sub_id>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})')
    def submission_status(self, request, pk=None, sub_id=None):
        """Poll a single submission's status/result (owner-scoped).

        Used by the frontend to poll a queued/async submission until it is graded.
        Returns the same shape as `submit`, including a display-only `xp_awarded`.
        """
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)
        try:
            submission = CodingSubmission.objects.filter(
                id=sub_id, problem_id=pk, student=student,
            ).first()
        except (ValidationError, ValueError):
            submission = None
        if not submission:
            return Response({'error': 'Submission not found.'}, status=status.HTTP_404_NOT_FOUND)
        data = SubmissionResultSerializer(submission).data
        data['xp_awarded'] = self._display_xp(submission) if submission.status == 'done' else 0
        return Response(data)

    def _display_xp(self, submission):
        """XP to *display* for a graded submission: the solve XP only when this is
        the first fully-passing submission for the student on this problem, else 0
        (mirrors the award-once semantics without re-awarding)."""
        from core.utils import calculate_xp_for_coding
        if not (submission.total_count > 0 and submission.passed_count == submission.total_count):
            return 0
        earlier_solve = CodingSubmission.objects.filter(
            problem_id=submission.problem_id, student_id=submission.student_id,
            total_count__gt=0, passed_count=F('total_count'),
            submitted_at__lt=submission.submitted_at,
        ).exists()
        if earlier_solve:
            return 0
        return calculate_xp_for_coding(submission.problem.difficulty)

    @action(detail=True, methods=['post'], url_path='toggle-external-solved')
    def toggle_external_solved(self, request, pk=None):
        """Self-report (or un-report) solving this problem on an external judge.

        Honour-based: only allowed when the problem is configured with an external
        link (solve_mode 'external' or 'both'). Toggling on creates a completion
        record (method='external') and awards solve XP once; toggling off removes
        the external completion (in-app completions are never removed here).
        """
        problem = self.get_object()
        student = self._student()
        if not student:
            return Response({'error': 'Student profile required.'}, status=400)
        if not problem.allows_external:
            return Response(
                {'error': 'This problem is not set up for external solving.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = CodingProblemCompletion.objects.filter(problem=problem, student=student).first()
        if existing:
            # Only external self-reports are reversible; an in-app solve stays.
            if existing.method == 'external':
                existing.delete()
                return Response({'is_solved': False, 'method': None, 'xp_awarded': 0})
            return Response({
                'is_solved': True, 'method': existing.method, 'xp_awarded': 0,
            })

        CodingProblemCompletion.objects.create(
            tenant=problem.tenant, problem=problem, student=student, method='external',
        )
        from . import grading
        xp_awarded = grading.award_solve_xp(student, problem)
        return Response({'is_solved': True, 'method': 'external', 'xp_awarded': xp_awarded})

    @action(detail=True, methods=['get'], url_path='my-submissions')
    def my_submissions(self, request, pk=None):
        """The current student's submission history for this problem (newest first)."""
        problem = self.get_object()
        student = self._student()
        if not student:
            return Response([])
        subs = CodingSubmission.objects.filter(problem=problem, student=student).order_by('-submitted_at')
        return Response(SubmissionResultSerializer(subs, many=True).data)
