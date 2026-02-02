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
    QuizAttemptSerializer, MockTestAttemptSerializer,
    AnswerSubmitSerializer, QuizStartSerializer, QuizSubmitSerializer
)
from core.utils import calculate_xp_for_quiz


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
        student.add_xp(xp)
        
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
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            student=self.request.user.profile
        ).order_by('-started_at')

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent quiz attempts."""
        attempts = self.get_queryset()[:10]
        return Response(QuizAttemptSerializer(attempts, many=True).data)


class MockTestAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing mock test attempts.
    """
    serializer_class = MockTestAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MockTestAttempt.objects.filter(
            student=self.request.user.profile
        ).order_by('-started_at')

