"""Student-facing coding endpoints: list problems, solve, run samples, submit."""
from decimal import Decimal

from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from users.models import CourseEnrollment

from .models import CodingProblem, CodingSubmission
from .serializers import (
    CodingProblemListSerializer,
    CodingProblemDetailSerializer,
    SubmissionResultSerializer,
)
from .languages import LANGUAGES
from . import services


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
        """Attach each student's best submission (most tests passed, then latest)."""
        student = self._student()
        if not student:
            return
        best = {}
        subs = CodingSubmission.objects.filter(
            student=student, problem__in=problems,
        ).order_by('problem_id', '-passed_points', '-submitted_at')
        for s in subs:
            if s.problem_id not in best:
                best[s.problem_id] = s
        for p in problems:
            p._my_best = best.get(p.id)

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
        """Run code against ALL test cases, score, and persist the submission."""
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

        cases = list(problem.test_cases.all().order_by('order', 'created_at'))
        if not cases:
            return Response({'error': 'This problem has no test cases yet.'}, status=400)

        try:
            outcome = services.run_against_cases(
                language=language, source=source, cases=cases,
                time_limit_ms=problem.time_limit_ms,
                memory_limit_mb=problem.memory_limit_mb,
                reveal_io=False,
            )
        except services.EngineError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        marks = None
        if problem.max_marks and outcome['total_points'] > 0:
            marks = (Decimal(problem.max_marks) * outcome['passed_points'] / outcome['total_points']).quantize(Decimal('0.01'))
        elif problem.max_marks:
            marks = Decimal('0.00')

        submission = CodingSubmission.objects.create(
            problem=problem, student=student, language=language, source_code=source,
            status='error' if outcome['compile_error'] and outcome['passed_count'] == 0 else 'done',
            results=outcome['results'],
            compile_output=outcome['compile_output'],
            passed_count=outcome['passed_count'],
            total_count=outcome['total_count'],
            passed_points=outcome['passed_points'],
            total_points=outcome['total_points'],
            marks=marks,
        )

        # Award XP the first time the student fully solves this problem.
        xp_awarded = 0
        if submission.total_count > 0 and submission.passed_count == submission.total_count:
            from gamification.models import XPTransaction
            from gamification.services import GamificationService
            from core.utils import calculate_xp_for_coding

            already_awarded = XPTransaction.objects.filter(
                student=student, transaction_type='coding_solved', reference_id=problem.id,
            ).exists()
            if not already_awarded:
                xp_awarded = calculate_xp_for_coding(problem.difficulty)
                GamificationService.award_xp(
                    student,
                    xp_awarded,
                    'coding_solved',
                    f'Solved coding problem: {problem.title}',
                    str(problem.id),
                )

        data = SubmissionResultSerializer(submission).data
        data['xp_awarded'] = xp_awarded
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='my-submissions')
    def my_submissions(self, request, pk=None):
        """The current student's submission history for this problem (newest first)."""
        problem = self.get_object()
        student = self._student()
        if not student:
            return Response([])
        subs = CodingSubmission.objects.filter(problem=problem, student=student).order_by('-submitted_at')
        return Response(SubmissionResultSerializer(subs, many=True).data)
