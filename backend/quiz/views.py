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
from django.db.models import Q, Count

from .models import (
    Question, Quiz, MockTest, QuizAttempt, MockTestAttempt, Answer, QuestionReport
)
from .serializers import (
    QuestionSerializer, QuestionWithAnswerSerializer,
    QuizSerializer, QuizDetailSerializer,
    MockTestSerializer, MockTestDetailSerializer,
    QuizAttemptSerializer, QuizAttemptSummarySerializer,
    MockTestAttemptSerializer, MockTestAttemptSummarySerializer,
    AnswerSubmitSerializer, QuizStartSerializer, QuizSubmitSerializer,
    QuizAttemptReviewSerializer, MockTestAttemptReviewSerializer,
    QuestionReportSerializer, QuestionReportCreateSerializer
)
from core.utils import calculate_xp_for_quiz
from analytics.services import AnalyticsService
from gamification.services import GamificationService


class QuizSubmitThrottle(UserRateThrottle):
    """Throttle for quiz submissions."""
    rate = '60/hour'


def _get_student_exam(request):
    """Helper to get the student's primary exam for filtering."""
    if not request.user.is_authenticated:
        return None
    try:
        profile = request.user.profile
        return profile.primary_exam
    except Exception:
        return None


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

    def get_queryset(self):
        queryset = super().get_queryset()
        # Auto-filter by student's primary exam
        exam = _get_student_exam(self.request)
        if exam:
            queryset = queryset.filter(exams=exam)
        return queryset

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
    
    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        
        # Auto-filter by student's primary exam (unless explicit exam filter is provided)
        if not request.query_params.get('exam'):
            exam = _get_student_exam(request)
            if exam:
                queryset = queryset.filter(exam=exam)
        
        # Filter by attempted status
        attempted_filter = request.query_params.get('attempted')
        if attempted_filter is not None and request.user.is_authenticated:
            profile = request.user.profile
            attempted_quiz_ids = QuizAttempt.objects.filter(
                student=profile,
                status='completed'
            ).values_list('quiz_id', flat=True).distinct()
            
            if attempted_filter.lower() == 'true':
                queryset = queryset.filter(id__in=attempted_quiz_ids)
            elif attempted_filter.lower() == 'false':
                queryset = queryset.exclude(id__in=attempted_quiz_ids)
        
        # Filter by difficulty
        difficulty = request.query_params.get('difficulty')
        if difficulty:
            # Filter quizzes that have questions with this difficulty
            queryset = queryset.filter(questions__difficulty=difficulty).distinct()
        
        return queryset

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options for quizzes (scoped to student's exam)."""
        from exams.models import Subject, Topic, Exam
        
        # Scope to student's primary exam
        exam = _get_student_exam(request)
        quiz_qs = Quiz.objects.filter(status='published')
        if exam:
            quiz_qs = quiz_qs.filter(exam=exam)
        
        # Get subjects that have quizzes for this exam
        subjects_with_quizzes = Subject.objects.filter(
            quizzes__in=quiz_qs
        ).distinct().values('id', 'name')
        
        # Get topics that have quizzes for this exam
        topics_with_quizzes = Topic.objects.filter(
            quizzes__in=quiz_qs
        ).distinct().values('id', 'name', 'subject_id', 'subject__name')
        
        # Get exams that have quizzes
        exams_with_quizzes = Exam.objects.filter(
            quizzes__status='published'
        ).distinct().values('id', 'name', 'short_name')
        
        # Get quiz type counts (scoped to exam)
        quiz_types = quiz_qs.values('quiz_type').annotate(
            count=Count('id')
        )
        
        # Get attempted/non-attempted counts for the user (scoped to exam)
        attempted_count = 0
        non_attempted_count = 0
        if request.user.is_authenticated:
            profile = request.user.profile
            attempted_quiz_ids = QuizAttempt.objects.filter(
                student=profile,
                status='completed',
                quiz__in=quiz_qs
            ).values_list('quiz_id', flat=True).distinct()
            
            total_quizzes = quiz_qs.count()
            attempted_count = len(set(attempted_quiz_ids))
            non_attempted_count = total_quizzes - attempted_count
        
        return Response({
            'subjects': list(subjects_with_quizzes),
            'topics': list(topics_with_quizzes),
            'exams': list(exams_with_quizzes),
            'quiz_types': [
                {'value': 'topic', 'label': 'Topic Quiz', 'count': next((qt['count'] for qt in quiz_types if qt['quiz_type'] == 'topic'), 0)},
                {'value': 'subject', 'label': 'Subject Quiz', 'count': next((qt['count'] for qt in quiz_types if qt['quiz_type'] == 'subject'), 0)},
                {'value': 'mixed', 'label': 'Mixed Quiz', 'count': next((qt['count'] for qt in quiz_types if qt['quiz_type'] == 'mixed'), 0)},
                {'value': 'pyq', 'label': 'Previous Year Questions', 'count': next((qt['count'] for qt in quiz_types if qt['quiz_type'] == 'pyq'), 0)},
                {'value': 'daily', 'label': 'Daily Challenge', 'count': next((qt['count'] for qt in quiz_types if qt['quiz_type'] == 'daily'), 0)},
            ],
            'difficulties': [
                {'value': 'easy', 'label': 'Easy'},
                {'value': 'medium', 'label': 'Medium'},
                {'value': 'hard', 'label': 'Hard'},
            ],
            'attempt_status': {
                'attempted': attempted_count,
                'not_attempted': non_attempted_count,
            }
        })

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
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Get leaderboard for a specific quiz."""
        quiz = self.get_object()
        
        # Get best attempt per student (highest marks)
        from django.db.models import Max, Min, F
        
        attempts = QuizAttempt.objects.filter(
            quiz=quiz,
            status='completed'
        ).order_by('-marks_obtained', 'time_taken_seconds')
        
        # Deduplicate: keep best attempt per student
        seen_students = set()
        leaderboard = []
        for attempt in attempts[:200]:  # Check up to 200 attempts
            if attempt.student_id in seen_students:
                continue
            seen_students.add(attempt.student_id)
            leaderboard.append({
                'rank': len(leaderboard) + 1,
                'student_name': attempt.student.user.full_name or attempt.student.user.username,
                'marks_obtained': float(attempt.marks_obtained),
                'total_marks': float(attempt.total_marks),
                'percentage': float(attempt.percentage),
                'correct_answers': attempt.correct_answers,
                'wrong_answers': attempt.wrong_answers,
                'time_taken_seconds': attempt.time_taken_seconds,
                'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
                'is_current_user': attempt.student == request.user.profile,
            })
            if len(leaderboard) >= 50:
                break
        
        # Find current user's rank if not in top 50
        user_rank = None
        for entry in leaderboard:
            if entry['is_current_user']:
                user_rank = entry
                break
        
        return Response({
            'quiz_title': quiz.title,
            'total_marks': float(quiz.total_marks),
            'entries': leaderboard,
            'user_rank': user_rank,
        })


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
    
    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        
        # Auto-filter by student's primary exam (unless explicit exam filter is provided)
        if not request.query_params.get('exam'):
            exam = _get_student_exam(request)
            if exam:
                queryset = queryset.filter(exam=exam)
        
        # Filter by attempted status
        attempted_filter = request.query_params.get('attempted')
        if attempted_filter is not None and request.user.is_authenticated:
            profile = request.user.profile
            attempted_test_ids = MockTestAttempt.objects.filter(
                student=profile,
                status='completed'
            ).values_list('mock_test_id', flat=True).distinct()
            
            if attempted_filter.lower() == 'true':
                queryset = queryset.filter(id__in=attempted_test_ids)
            elif attempted_filter.lower() == 'false':
                queryset = queryset.exclude(id__in=attempted_test_ids)
        
        return queryset

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options for mock tests (scoped to student's exam)."""
        from exams.models import Exam
        
        # Scope to student's primary exam
        exam = _get_student_exam(request)
        test_qs = MockTest.objects.filter(status='published')
        if exam:
            test_qs = test_qs.filter(exam=exam)
        
        # Get exams that have mock tests
        exams_with_tests = Exam.objects.filter(
            mock_tests__status='published'
        ).distinct().values('id', 'name', 'short_name')
        
        # Get attempted/non-attempted counts for the user (scoped to exam)
        attempted_count = 0
        non_attempted_count = 0
        if request.user.is_authenticated:
            profile = request.user.profile
            attempted_test_ids = MockTestAttempt.objects.filter(
                student=profile,
                status='completed',
                mock_test__in=test_qs
            ).values_list('mock_test_id', flat=True).distinct()
            
            total_tests = test_qs.count()
            attempted_count = len(set(attempted_test_ids))
            non_attempted_count = total_tests - attempted_count
        
        return Response({
            'exams': list(exams_with_tests),
            'attempt_status': {
                'attempted': attempted_count,
                'not_attempted': non_attempted_count,
            }
        })

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
                if not created:
                    answer.selected_option = answer_data.get('selected_option', '')
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
        answers = attempt.answers.all()
        attempt.total_questions = mock_test.questions.count()
        attempt.attempted_questions = answers.count()
        attempt.correct_answers = answers.filter(is_correct=True).count()
        attempt.wrong_answers = answers.filter(is_correct=False).count()
        
        # Use marks_obtained from check_answer (handles +marks/-negative_marks)
        marks = sum(a.marks_obtained for a in answers)
        attempt.marks_obtained = marks  # Can be negative in competitive exams
        
        # Use actual total marks from questions (more accurate than mock_test.total_marks)
        actual_total = sum(q.marks for q in mock_test.questions.all())
        if actual_total > 0:
            attempt.percentage = max(0, (marks / actual_total) * 100)
        else:
            attempt.percentage = 0
        
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
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Get leaderboard for a specific mock test."""
        mock_test = self.get_object()
        
        attempts = MockTestAttempt.objects.filter(
            mock_test=mock_test,
            status='completed'
        ).order_by('-marks_obtained', 'time_taken_seconds')
        
        # Deduplicate: keep best attempt per student
        seen_students = set()
        leaderboard = []
        for attempt in attempts[:200]:
            if attempt.student_id in seen_students:
                continue
            seen_students.add(attempt.student_id)
            leaderboard.append({
                'rank': len(leaderboard) + 1,
                'student_name': attempt.student.user.full_name or attempt.student.user.username,
                'marks_obtained': float(attempt.marks_obtained),
                'total_marks': float(mock_test.total_marks),
                'percentage': float(attempt.percentage),
                'correct_answers': attempt.correct_answers,
                'wrong_answers': attempt.wrong_answers,
                'time_taken_seconds': attempt.time_taken_seconds,
                'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
                'is_current_user': attempt.student == request.user.profile,
            })
            if len(leaderboard) >= 50:
                break
        
        user_rank = None
        for entry in leaderboard:
            if entry['is_current_user']:
                user_rank = entry
                break
        
        return Response({
            'mock_test_title': mock_test.title,
            'total_marks': float(mock_test.total_marks),
            'entries': leaderboard,
            'user_rank': user_rank,
        })


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
        """Get detailed review with all questions (including unanswered)."""
        attempt = self.get_object()
        
        if attempt.status != 'completed':
            return Response(
                {'error': 'Can only review completed attempts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the new review serializer that includes all questions
        return Response(QuizAttemptReviewSerializer(attempt).data)


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
        """Get detailed review with all questions (including unanswered)."""
        attempt = self.get_object()
        
        if attempt.status != 'completed':
            return Response(
                {'error': 'Can only review completed attempts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the new review serializer that includes all questions
        return Response(MockTestAttemptReviewSerializer(attempt).data)


class QuestionReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for reporting problems with questions.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuestionReport.objects.filter(reported_by=self.request.user.profile)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuestionReportCreateSerializer
        return QuestionReportSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new question report."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if user has already reported this question
        existing_report = QuestionReport.objects.filter(
            question=serializer.validated_data['question'],
            reported_by=request.user.profile,
            status__in=['pending', 'reviewing']
        ).first()
        
        if existing_report:
            return Response(
                {'error': 'You have already reported this question. Your report is being reviewed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        return Response(
            {'message': 'Thank you for your report. We will review it shortly.'},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get user's question reports."""
        reports = self.get_queryset().order_by('-created_at')[:20]
        return Response(QuestionReportSerializer(reports, many=True).data)

