"""
Views for Quiz app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.utils import timezone
from django.db.models import Q

from .models import (
    Question, Quiz, MockTest, QuizAttempt, MockTestAttempt, Answer
)
from .serializers import (
    QuestionSerializer, QuestionWithAnswerSerializer,
    QuizSerializer, QuizDetailSerializer,
    MockTestSerializer, MockTestDetailSerializer,
    QuizAttemptSerializer, QuizAttemptSummarySerializer,
    MockTestAttemptSerializer, MockTestAttemptSummarySerializer,
    AnswerSubmitSerializer, QuizStartSerializer, QuizSubmitSerializer
)
from core.utils import calculate_xp_for_quiz
from analytics.services import AnalyticsService
from gamification.services import GamificationService


class QuizSubmitThrottle(UserRateThrottle):
    """Throttle for quiz submissions."""
    rate = '60/hour'


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for questions.
    """
    queryset = Question.objects.filter(status='published')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['topic', 'subject', 'difficulty', 'question_type']
    search_fields = ['question_text']

    def get_serializer_class(self):
        # Only show answers for review purposes
        if self.action == 'retrieve' and self.request.query_params.get('with_answer'):
            return QuestionWithAnswerSerializer
        return QuestionSerializer

    @action(detail=False, methods=['get'])
    def by_topic(self, request):
        """Get questions by topic."""
        topic_id = request.query_params.get('topic_id')
        limit = int(request.query_params.get('limit', 10))
        difficulty = request.query_params.get('difficulty')
        
        questions = self.get_queryset().filter(topic_id=topic_id)
        if difficulty:
            questions = questions.filter(difficulty=difficulty)
        
        questions = questions.order_by('?')[:limit]
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for quiz operations.
    """
    queryset = Quiz.objects.filter(status='published')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['exam', 'subject', 'topic', 'quiz_type', 'is_free', 'is_daily_challenge']
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer

    @action(detail=False, methods=['get'])
    def daily_challenge(self, request):
        """Get today's daily challenge."""
        exam_id = request.query_params.get('exam_id')
        today = timezone.now().date()
        
        quiz = self.get_queryset().filter(
            is_daily_challenge=True,
            challenge_date=today
        )
        if exam_id:
            quiz = quiz.filter(exam_id=exam_id)
        
        quiz = quiz.first()
        if not quiz:
            return Response(
                {'error': 'No daily challenge available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(QuizDetailSerializer(quiz).data)

    @action(detail=True, methods=['get'])
    def my_attempts(self, request, pk=None):
        """Get all attempts for this quiz by the current user."""
        quiz = self.get_object()
        student = request.user.profile
        
        attempts = QuizAttempt.objects.filter(
            student=student,
            quiz=quiz
        ).order_by('-started_at')
        
        return Response(QuizAttemptSummarySerializer(attempts, many=True).data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a quiz attempt."""
        quiz = self.get_object()
        student = request.user.profile
        
        # Check for existing in-progress attempt
        existing = QuizAttempt.objects.filter(
            student=student,
            quiz=quiz,
            status='in_progress'
        ).first()
        
        if existing:
            return Response(
                QuizAttemptSerializer(existing).data,
                status=status.HTTP_200_OK
            )
        
        # Create new attempt
        attempt = QuizAttempt.objects.create(
            student=student,
            quiz=quiz,
            total_questions=quiz.questions.count()
        )
        
        return Response(
            QuizAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], throttle_classes=[QuizSubmitThrottle])
    def submit(self, request, pk=None):
        """Submit quiz answers."""
        quiz = self.get_object()
        student = request.user.profile
        
        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get or create attempt
        attempt = QuizAttempt.objects.filter(
            student=student,
            quiz=quiz,
            status='in_progress'
        ).first()
        
        if not attempt:
            attempt = QuizAttempt.objects.create(
                student=student,
                quiz=quiz,
                total_questions=quiz.questions.count()
            )
        
        # Process answers
        for answer_data in serializer.validated_data['answers']:
            try:
                question = Question.objects.get(id=answer_data['question_id'])
                answer, created = Answer.objects.get_or_create(
                    quiz_attempt=attempt,
                    question=question,
                    defaults={
                        'selected_option': answer_data.get('selected_option', ''),
                        'answer_text': answer_data.get('answer_text', ''),
                        'numerical_answer': answer_data.get('numerical_answer'),
                        'time_taken_seconds': answer_data.get('time_taken_seconds', 0),
                        'is_marked_for_review': answer_data.get('is_marked_for_review', False)
                    }
                )
                if not created:
                    answer.selected_option = answer_data.get('selected_option', '')
                    answer.answer_text = answer_data.get('answer_text', '')
                    answer.numerical_answer = answer_data.get('numerical_answer')
                    answer.time_taken_seconds = answer_data.get('time_taken_seconds', 0)
                    answer.save()
                
                answer.check_answer()
                
                # Update question statistics
                question.times_attempted += 1
                if answer.is_correct:
                    question.times_correct += 1
                question.save(update_fields=['times_attempted', 'times_correct'])
                
            except Question.DoesNotExist:
                continue
        
        # Calculate results
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.time_taken_seconds = serializer.validated_data['time_taken_seconds']
        attempt.calculate_results()
        
        # Calculate XP
        accuracy = attempt.percentage
        xp = calculate_xp_for_quiz(
            accuracy,
            attempt.total_questions,
            quiz.is_daily_challenge
        )
        attempt.xp_earned = xp
        attempt.save()
        
        # Update student profile
        student.total_questions_attempted += attempt.attempted_questions
        student.total_correct_answers += attempt.correct_answers
        student.save()
        
        # Award XP through gamification service (creates XP transaction)
        GamificationService.award_xp(
            student,
            xp,
            'quiz_complete',
            f'Completed quiz: {quiz.title}',
            str(attempt.id)
        )
        
        # Update daily activity (convert time_taken_seconds to minutes)
        study_minutes = max(1, attempt.time_taken_seconds // 60)  # At least 1 minute
        AnalyticsService.update_daily_activity(
            student,
            study_time_minutes=study_minutes,
            questions_attempted=attempt.attempted_questions,
            questions_correct=attempt.correct_answers,
            quizzes_completed=1,
            xp_earned=xp
        )
        
        # Also update profile study time
        student.total_study_time_minutes += study_minutes
        student.save(update_fields=['total_study_time_minutes'])
        
        # Update topic mastery
        AnalyticsService.update_topic_mastery_from_attempt(attempt)
        
        # Build badge context for accurate badge awarding
        badge_context = {
            'perfect_quiz': attempt.percentage == 100,
            'speed_quiz': attempt.time_taken_seconds < (quiz.duration_minutes * 60 / 2) if quiz.duration_minutes > 0 else False,
            'early_study': timezone.now().hour < 6,
            'night_study': timezone.now().hour >= 22,
            'weekend_study': timezone.now().weekday() >= 5,
        }
        
        # Check for new badges with context
        GamificationService.check_and_award_badges(student, context=badge_context)
        
        # Update quiz statistics
        quiz.total_attempts += 1
        quiz.save(update_fields=['total_attempts'])
        
        return Response(QuizAttemptSerializer(attempt).data)


class MockTestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for mock test operations.
    """
    queryset = MockTest.objects.filter(status='published')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['exam', 'is_free']
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MockTestDetailSerializer
        return MockTestSerializer

    @action(detail=True, methods=['get'])
    def my_attempts(self, request, pk=None):
        """Get all attempts for this mock test by the current user."""
        mock_test = self.get_object()
        student = request.user.profile
        
        attempts = MockTestAttempt.objects.filter(
            student=student,
            mock_test=mock_test
        ).order_by('-started_at')
        
        return Response(MockTestAttemptSummarySerializer(attempts, many=True).data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a mock test attempt."""
        mock_test = self.get_object()
        student = request.user.profile
        
        # Check for existing attempt
        existing = MockTestAttempt.objects.filter(
            student=student,
            mock_test=mock_test,
            status='in_progress'
        ).first()
        
        if existing:
            return Response(
                MockTestAttemptSerializer(existing).data,
                status=status.HTTP_200_OK
            )
        
        attempt = MockTestAttempt.objects.create(
            student=student,
            mock_test=mock_test,
            total_questions=mock_test.questions.count()
        )
        
        return Response(
            MockTestAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], throttle_classes=[QuizSubmitThrottle])
    def submit(self, request, pk=None):
        """Submit mock test answers."""
        mock_test = self.get_object()
        student = request.user.profile
        
        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        attempt = MockTestAttempt.objects.filter(
            student=student,
            mock_test=mock_test,
            status='in_progress'
        ).first()
        
        if not attempt:
            return Response(
                {'error': 'No active attempt found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process answers (similar to quiz)
        for answer_data in serializer.validated_data['answers']:
            try:
                question = Question.objects.get(id=answer_data['question_id'])
                answer, created = Answer.objects.get_or_create(
                    mock_test_attempt=attempt,
                    question=question,
                    defaults={
                        'selected_option': answer_data.get('selected_option', ''),
                        'time_taken_seconds': answer_data.get('time_taken_seconds', 0),
                    }
                )
                answer.check_answer()
            except Question.DoesNotExist:
                continue
        
        # Calculate results
        answers = attempt.answers.all()
        attempt.attempted_questions = answers.count()
        attempt.correct_answers = answers.filter(is_correct=True).count()
        attempt.wrong_answers = answers.filter(is_correct=False).count()
        
        marks = sum(a.marks_obtained for a in answers)
        attempt.marks_obtained = max(0, marks)
        attempt.percentage = (attempt.marks_obtained / mock_test.total_marks) * 100
        
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.time_taken_seconds = serializer.validated_data['time_taken_seconds']
        attempt.save()
        
        # Calculate XP for mock test
        xp = calculate_xp_for_quiz(
            attempt.percentage,
            attempt.total_questions,
            is_daily_challenge=False
        ) * 2  # Double XP for mock tests
        
        # Update student profile
        student.total_questions_attempted += attempt.attempted_questions
        student.total_correct_answers += attempt.correct_answers
        student.save()
        
        # Award XP through gamification service
        GamificationService.award_xp(
            student,
            xp,
            'mock_test',
            f'Completed mock test: {mock_test.title}',
            str(attempt.id)
        )
        
        # Update daily activity (convert time_taken_seconds to minutes)
        study_minutes = max(1, attempt.time_taken_seconds // 60)  # At least 1 minute
        AnalyticsService.update_daily_activity(
            student,
            study_time_minutes=study_minutes,
            questions_attempted=attempt.attempted_questions,
            questions_correct=attempt.correct_answers,
            mock_tests_completed=1,
            xp_earned=xp
        )
        
        # Also update profile study time
        student.total_study_time_minutes += study_minutes
        student.save(update_fields=['total_study_time_minutes'])
        
        # Update topic mastery and subject performance
        AnalyticsService.update_mock_test_analytics(attempt)
        
        # Build badge context for accurate badge awarding
        badge_context = {
            'perfect_quiz': attempt.percentage == 100,
            'speed_quiz': attempt.time_taken_seconds < (mock_test.duration_minutes * 60 / 2) if mock_test.duration_minutes > 0 else False,
            'early_study': timezone.now().hour < 6,
            'night_study': timezone.now().hour >= 22,
            'weekend_study': timezone.now().weekday() >= 5,
        }
        
        # Check for new badges with context
        GamificationService.check_and_award_badges(student, context=badge_context)
        
        # Update mock test stats
        mock_test.total_attempts += 1
        if attempt.marks_obtained > mock_test.highest_score:
            mock_test.highest_score = attempt.marks_obtained
        mock_test.save()
        
        return Response(MockTestAttemptSerializer(attempt).data)


class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing quiz attempts.
    """
    serializer_class = QuizAttemptSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            student=self.request.user.profile
        ).order_by('-started_at')

    def retrieve(self, request, *args, **kwargs):
        """Get attempt with full answers for review."""
        instance = self.get_object()
        # Only show answers if attempt is completed
        if instance.status == 'completed':
            serializer = QuizAttemptSerializer(instance)
        else:
            serializer = QuizAttemptSummarySerializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent quiz attempts."""
        attempts = self.get_queryset().filter(status='completed')[:10]
        return Response(QuizAttemptSummarySerializer(attempts, many=True).data)

    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        """Get detailed review with answers and correct options."""
        attempt = self.get_object()
        
        if attempt.status != 'completed':
            return Response(
                {'error': 'Can only review completed attempts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(QuizAttemptSerializer(attempt).data)


class MockTestAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing mock test attempts.
    """
    serializer_class = MockTestAttemptSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MockTestAttempt.objects.filter(
            student=self.request.user.profile
        ).order_by('-started_at')

    def retrieve(self, request, *args, **kwargs):
        """Get attempt with full answers for review."""
        instance = self.get_object()
        # Only show answers if attempt is completed
        if instance.status == 'completed':
            serializer = MockTestAttemptSerializer(instance)
        else:
            serializer = MockTestAttemptSummarySerializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent mock test attempts."""
        attempts = self.get_queryset().filter(status='completed')[:10]
        return Response(MockTestAttemptSummarySerializer(attempts, many=True).data)

    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        """Get detailed review with answers and correct options."""
        attempt = self.get_object()
        
        if attempt.status != 'completed':
            return Response(
                {'error': 'Can only review completed attempts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(MockTestAttemptSerializer(attempt).data)

