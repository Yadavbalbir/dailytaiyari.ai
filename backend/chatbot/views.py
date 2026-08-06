"""
Views for Chatbot app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from django.utils import timezone
from .models import (
    ChatSession, ChatMessage, SavedResponse, FrequentQuestion,
    AIQuizAttempt, AIQuizQuestion, AILearningStats
)
from .serializers import (
    ChatSessionSerializer, ChatSessionDetailSerializer,
    ChatMessageSerializer, SendMessageSerializer, CreateSessionSerializer,
    SavedResponseSerializer, FrequentQuestionSerializer,
    AIQuizAttemptSerializer, AIQuizAttemptListSerializer,
    SubmitAIQuizSerializer, AILearningStatsSerializer
)
from . import resolver
from .course_context import enrolled_course_or_none, enrolled_courses, starter_prompts
from .services import ChatService
from .tenancy import request_tenant
from core.views import TenantAwareViewSet, TenantAwareReadOnlyViewSet


class AIWorkspaceView(APIView):
    """Everything the AI Doubt Solver needs to render its empty state.

    Returns the student's enrolled courses (the only ones they may scope a chat
    to), starter prompts tailored to their real progress, and whether the AI is
    actually usable right now — so the UI can explain *why* it is unavailable
    instead of failing on the first message.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = request.user.profile
        tenant = request_tenant(request, required=False)

        enrollments = list(enrolled_courses(student, tenant=tenant))
        courses = [
            {
                'id': str(e.course.id),
                'name': e.course.name,
                'code': e.course.code,
                'color': e.course.color,
                'course_type': e.course.get_course_type_display(),
            }
            for e in enrollments
        ]

        requested = request.query_params.get('course_id')
        course = next(
            (e.course for e in enrollments if str(e.course.id) == str(requested)), None
        ) if requested else None

        try:
            resolution = resolver.resolve(tenant, student=None)
            available, reason, message = True, '', ''
            model_label = resolution.provider.model
        except resolver.AIUnavailable as exc:
            available, reason, message, model_label = False, exc.reason, exc.message, ''

        return Response({
            'courses': courses,
            'selected_course_id': str(course.id) if course else None,
            'starter_prompts': starter_prompts(student, course),
            'is_available': available,
            'unavailable_reason': reason,
            'unavailable_message': message,
            'model_label': model_label,
        })



class ChatSessionViewSet(TenantAwareViewSet):
    """
    ViewSet for chat sessions.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['topic', 'subject', 'course', 'is_active']
    search_fields = ['title']

    def get_queryset(self):
        return ChatSession.objects.filter(
            student=self.request.user.profile
        ).select_related('topic', 'subject', 'course')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatSessionDetailSerializer
        return ChatSessionSerializer

    def _enrolled_course(self, course_id):
        """Resolve a course id to one the student may actually use.

        Scoping a chat to a course feeds that course's syllabus and the
        student's own progress to the model, so this rejects anything they are
        not approved for, anything no longer active, and anything outside the
        tenant they are signed in to.
        """
        if not course_id:
            return None

        course = enrolled_course_or_none(
            self.request.user.profile,
            course_id,
            tenant=request_tenant(self.request, required=False),
        )
        if course is None:
            raise ValidationError(
                {'course_id': 'You are not enrolled in this course, or it is no longer available.'}
            )
        return course

    def create(self, request, *args, **kwargs):
        """Create a new chat session."""
        serializer = CreateSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        topic = None
        subject = None
        
        if data.get('topic_id'):
            from exams.models import Topic
            topic = Topic.objects.filter(id=data['topic_id']).first()
        
        if data.get('subject_id'):
            from exams.models import Subject
            subject = Subject.objects.filter(id=data['subject_id']).first()

        course = self._enrolled_course(data.get('course_id'))

        session = ChatService.create_session(
            request.user.profile,
            topic=topic,
            subject=subject,
            course=course,
            title=data.get('title'),
            tenant=request_tenant(request, required=False),
        )
        
        # Process initial message if provided
        if data.get('initial_message'):
            result = ChatService.process_question(session, data['initial_message'])
        
        return Response(
            ChatSessionDetailSerializer(session).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def set_course(self, request, pk=None):
        """Re-scope an existing conversation to a different enrolled course."""
        session = self.get_object()
        session.course = self._enrolled_course(request.data.get('course_id'))
        session.save(update_fields=['course', 'updated_at'])
        return Response(ChatSessionSerializer(session).data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in the session (non-streaming)."""
        session = self.get_object()
        
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = ChatService.process_question(
            session,
            serializer.validated_data['content'],
            image=serializer.validated_data.get('image')
        )
        
        return Response({
            'message': ChatMessageSerializer(result['message']).data,
            'success': result['success']
        })

    @action(detail=True, methods=['post'])
    def send_message_stream(self, request, pk=None):
        """Send a message with streaming response."""
        session = self.get_object()
        
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create streaming response
        response = StreamingHttpResponse(
            ChatService.process_question_streaming(
                session,
                serializer.validated_data['content'],
                image=serializer.validated_data.get('image')
            ),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        
        return response

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a chat session."""
        session = self.get_object()
        session.is_active = False
        session.save()
        return Response({'status': 'closed'})

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a chat session."""
        session = self.get_object()
        
        rating = request.data.get('rating')
        was_helpful = request.data.get('was_helpful')
        
        if rating:
            session.rating = min(5, max(1, int(rating)))
        if was_helpful is not None:
            session.was_helpful = was_helpful
        
        session.save()
        return Response(ChatSessionSerializer(session).data)


class ChatMessageViewSet(TenantAwareReadOnlyViewSet):
    """
    ViewSet for chat messages.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(
            session__student=self.request.user.profile
        )

    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Mark a message as helpful or not."""
        message = self.get_object()
        message.is_helpful = request.data.get('is_helpful', True)
        message.save()
        return Response(ChatMessageSerializer(message).data)

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        """Save a message for later reference."""
        message = self.get_object()
        
        saved, created = SavedResponse.objects.get_or_create(
            student=request.user.profile,
            message=message,
            defaults={
                'title': request.data.get('title', ''),
                'topic': message.session.topic
            }
        )
        
        return Response(
            SavedResponseSerializer(saved).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class SavedResponseViewSet(TenantAwareViewSet):
    """
    ViewSet for saved responses.
    """
    serializer_class = SavedResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['topic']
    search_fields = ['title', 'personal_notes']

    def get_queryset(self):
        return SavedResponse.objects.filter(
            student=self.request.user.profile
        ).select_related('message', 'topic')


class FrequentQuestionViewSet(TenantAwareReadOnlyViewSet):
    """
    ViewSet for FAQs.
    """
    queryset = FrequentQuestion.objects.filter(is_active=True)
    serializer_class = FrequentQuestionSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['topic', 'subject']
    search_fields = ['question', 'answer']

    def retrieve(self, request, *args, **kwargs):
        """Increment view count on retrieve."""
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Mark FAQ as helpful."""
        faq = self.get_object()
        faq.helpful_count += 1
        faq.save(update_fields=['helpful_count'])
        return Response({'helpful_count': faq.helpful_count})

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get suggested FAQs based on topic."""
        topic_id = request.query_params.get('topic_id')
        
        if not topic_id:
            faqs = self.get_queryset().order_by('-views_count')[:10]
        else:
            faqs = self.get_queryset().filter(
                topic_id=topic_id
            ).order_by('-views_count')[:10]
        
        return Response(FrequentQuestionSerializer(faqs, many=True).data)


class AIQuizAttemptViewSet(TenantAwareViewSet):
    """
    ViewSet for AI Quiz attempts.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AIQuizAttempt.objects.filter(
            student=self.request.user.profile
        ).prefetch_related('questions')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AIQuizAttemptListSerializer
        return AIQuizAttemptSerializer
    
    @action(detail=False, methods=['post'])
    def submit(self, request):
        """
        Submit an AI quiz attempt and get XP.
        
        Expected data:
        {
            "session_id": "uuid" (optional),
            "quiz_topic": "string",
            "quiz_subject": "string",
            "questions": [
                {
                    "question_text": "...",
                    "options": ["A", "B", "C", "D"],
                    "correct_option": 0,
                    "user_answer": 1,
                    "explanation": "..."
                },
                ...
            ],
            "time_taken_seconds": 120
        }
        """
        serializer = SubmitAIQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        student = request.user.profile
        
        # Get session if provided
        session = None
        if data.get('session_id'):
            session = ChatSession.objects.filter(
                id=data['session_id'],
                student=student
            ).first()
        
        # Create the attempt
        attempt = AIQuizAttempt.objects.create(
            student=student,
            session=session,
            quiz_topic=data.get('quiz_topic', ''),
            quiz_subject=data.get('quiz_subject', ''),
            questions_data=data['questions'],
            time_taken_seconds=data.get('time_taken_seconds', 0),
            completed_at=timezone.now()
        )
        
        # Create individual question records
        for idx, q in enumerate(data['questions']):
            user_answer = q.get('user_answer')
            correct_option = q.get('correct_option', 0)
            is_correct = user_answer == correct_option if user_answer is not None else False
            
            AIQuizQuestion.objects.create(
                attempt=attempt,
                question_index=idx,
                question_text=q.get('question_text', q.get('question', '')),
                options=q.get('options', []),
                correct_option=correct_option,
                user_answer=user_answer,
                is_correct=is_correct,
                explanation=q.get('explanation', '')
            )
        
        # Calculate results and XP
        attempt.calculate_results()
        xp_earned = attempt.calculate_xp()

        # Enforce a daily cap on AI-quiz XP so quizzes can't be farmed endlessly.
        from .models import AI_QUIZ_XP_DAILY_CAP
        from gamification.models import XPTransaction
        from django.db.models import Sum
        today = timezone.now().date()
        used_today = XPTransaction.objects.filter(
            student=student,
            transaction_type='ai_quiz',
            created_at__date=today,
        ).aggregate(total=Sum('xp_amount'))['total'] or 0
        remaining = max(0, AI_QUIZ_XP_DAILY_CAP - used_today)
        xp_earned = min(xp_earned, remaining)
        attempt.xp_earned = xp_earned
        attempt.save()
        
        # Award XP via gamification (creates XPTransaction, updates profile.total_xp)
        from gamification.services import GamificationService
        if xp_earned > 0:
            GamificationService.award_xp(
                student,
                xp_earned,
                'ai_quiz',
                f'AI Quiz: {attempt.quiz_topic or "Practice"}',
                reference_id=attempt.id,
                update_daily_activity=False,
            )
        
        # Update AI learning stats
        stats, created = AILearningStats.objects.get_or_create(student=student)
        stats.update_from_attempt(attempt)
        
        # Update daily activity (quiz/mock flow: award_xp skips daily, we do it here)
        from analytics.services import AnalyticsService
        AnalyticsService.update_daily_activity(
            student,
            questions_attempted=attempt.total_questions,
            questions_correct=attempt.correct_answers,
            xp_earned=xp_earned
        )
        
        # Check for badges
        GamificationService.check_and_award_badges(student, context={
            'perfect_quiz': attempt.percentage == 100,
            'ai_quiz': True
        })
        
        return Response({
            'attempt': AIQuizAttemptSerializer(attempt).data,
            'xp_earned': xp_earned,
            'message': f"Quiz completed! You earned {xp_earned} XP 🎉"
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        """Get detailed review of a quiz attempt."""
        attempt = self.get_object()
        return Response(AIQuizAttemptSerializer(attempt).data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get AI learning statistics for the current user."""
        student = request.user.profile
        stats, created = AILearningStats.objects.get_or_create(student=student)
        return Response(AILearningStatsSerializer(stats).data)
    
    @action(detail=False, methods=['get'])
    def by_topic(self, request):
        """Get quiz attempts grouped by topic."""
        student = request.user.profile
        topic = request.query_params.get('topic')
        
        queryset = self.get_queryset()
        if topic:
            queryset = queryset.filter(quiz_topic__icontains=topic)
        
        return Response(AIQuizAttemptListSerializer(queryset[:20], many=True).data)
    
    @action(detail=False, methods=['get'])
    def wrong_questions(self, request):
        """Get all questions the user got wrong for revision."""
        student = request.user.profile
        topic = request.query_params.get('topic')
        
        wrong_questions = AIQuizQuestion.objects.filter(
            attempt__student=student,
            is_correct=False
        ).select_related('attempt')
        
        if topic:
            wrong_questions = wrong_questions.filter(
                attempt__quiz_topic__icontains=topic
            )
        
        questions = wrong_questions.order_by('-attempt__created_at')[:50]
        
        result = []
        for q in questions:
            result.append({
                'id': str(q.id),
                'question_text': q.question_text,
                'options': q.options,
                'correct_option': q.correct_option,
                'user_answer': q.user_answer,
                'explanation': q.explanation,
                'quiz_topic': q.attempt.quiz_topic,
                'attempted_at': q.attempt.created_at
            })
        
        return Response(result)

