"""
Views for Content app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q

from .models import Content, ContentProgress, StudyPlan, StudyPlanItem
from .serializers import (
    ContentSerializer, ContentDetailSerializer,
    ContentProgressSerializer, StudyPlanSerializer,
    StudyPlanItemSerializer, DailyStudyPlanSerializer
)
from .services import StudyPlanService


class ContentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for content operations.
    """
    queryset = Content.objects.filter(status='published')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['topic', 'subject', 'content_type', 'difficulty', 'is_free']
    search_fields = ['title', 'description']
    ordering_fields = ['order', 'views_count', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ContentDetailSerializer
        return ContentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Auto-filter by student's primary exam
        if self.request.user.is_authenticated:
            try:
                exam = self.request.user.profile.primary_exam
                if exam:
                    queryset = queryset.filter(exams=exam)
            except Exception:
                pass
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Increment view count on retrieve."""
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_topic(self, request):
        """Get content grouped by topic."""
        topic_id = request.query_params.get('topic_id')
        if not topic_id:
            return Response(
                {'error': 'topic_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contents = self.get_queryset().filter(topic_id=topic_id)
        serializer = self.get_serializer(contents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """Get recommended content based on user's progress."""
        student = request.user.profile
        
        # Get weak topics from analytics
        from analytics.models import TopicMastery
        weak_topics = TopicMastery.objects.filter(
            student=student,
            mastery_level__lte=2  # Beginner or Developing
        ).values_list('topic_id', flat=True)[:5]
        
        contents = self.get_queryset().filter(
            Q(topic_id__in=weak_topics) | Q(is_free=True)
        ).order_by('-created_at')[:10]
        
        serializer = self.get_serializer(contents, many=True)
        return Response(serializer.data)


class ContentProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for content progress tracking.
    """
    serializer_class = ContentProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ContentProgress.objects.filter(student=self.request.user.profile)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.profile)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark content as completed and award XP."""
        from gamification.services import GamificationService
        from analytics.services import AnalyticsService
        
        progress = self.get_object()
        student = request.user.profile
        
        # Check if already completed (don't award XP twice)
        if progress.is_completed:
            return Response(ContentProgressSerializer(progress).data)
        
        progress.is_completed = True
        progress.completed_at = timezone.now()
        progress.progress_percentage = 100
        progress.save()
        
        # Calculate XP based on content type
        content = progress.content
        xp_amount = 10  # Base XP for notes
        if content.content_type == 'video':
            xp_amount = 15
        elif content.content_type == 'pdf':
            xp_amount = 12
        
        # Award XP
        GamificationService.award_xp(
            student,
            xp_amount,
            'content_complete',
            f'Completed: {content.title}',
            str(content.id)
        )
        
        # Update daily activity
        study_minutes = progress.time_spent_minutes or content.estimated_time_minutes or 5
        AnalyticsService.update_daily_activity(
            student,
            study_time_minutes=study_minutes,
            notes_read=1 if content.content_type in ['notes', 'pdf'] else 0,
            videos_watched=1 if content.content_type == 'video' else 0,
            xp_earned=xp_amount
        )
        
        # Update profile study time
        student.total_study_time_minutes += study_minutes
        student.save(update_fields=['total_study_time_minutes'])
        
        response_data = ContentProgressSerializer(progress).data
        response_data['xp_earned'] = xp_amount
        
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def toggle_bookmark(self, request, pk=None):
        """Toggle bookmark status."""
        progress = self.get_object()
        progress.is_bookmarked = not progress.is_bookmarked
        progress.save()
        
        # Update content bookmark count
        content = progress.content
        if progress.is_bookmarked:
            content.bookmarks_count += 1
        else:
            content.bookmarks_count = max(0, content.bookmarks_count - 1)
        content.save(update_fields=['bookmarks_count'])
        
        return Response(ContentProgressSerializer(progress).data)


class StudyPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for study plan operations.
    """
    serializer_class = StudyPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudyPlan.objects.filter(student=self.request.user.profile)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's study plan."""
        student = request.user.profile
        today = timezone.now().date()
        exam_id = request.query_params.get('exam_id', student.primary_exam_id)
        
        plan, created = StudyPlan.objects.get_or_create(
            student=student,
            exam_id=exam_id,
            date=today,
            defaults={
                'target_study_minutes': student.daily_study_goal_minutes,
                'target_questions': 20
            }
        )
        
        # Generate items if new plan
        if created or plan.items.count() == 0:
            StudyPlanService.generate_daily_items(plan)
        
        return Response(StudyPlanSerializer(plan).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new study plan."""
        serializer = DailyStudyPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student = request.user.profile
        today = timezone.now().date()
        
        plan, created = StudyPlan.objects.get_or_create(
            student=student,
            exam_id=serializer.validated_data['exam_id'],
            date=today,
            defaults={
                'target_study_minutes': serializer.validated_data['target_minutes']
            }
        )
        
        # Regenerate items
        plan.items.all().delete()
        StudyPlanService.generate_daily_items(
            plan,
            include_revision=serializer.validated_data['include_revision'],
            focus_weak_topics=serializer.validated_data['focus_weak_topics']
        )
        
        return Response(StudyPlanSerializer(plan).data)


class StudyPlanItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual study plan items.
    """
    serializer_class = StudyPlanItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudyPlanItem.objects.filter(
            study_plan__student=self.request.user.profile
        )

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start working on an item."""
        item = self.get_object()
        item.status = 'in_progress'
        item.save()
        return Response(StudyPlanItemSerializer(item).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark item as completed."""
        item = self.get_object()
        actual_minutes = request.data.get('actual_minutes', item.estimated_minutes)
        
        item.status = 'completed'
        item.completed_at = timezone.now()
        item.actual_minutes = actual_minutes
        item.save()
        
        # Update study plan
        plan = item.study_plan
        plan.actual_study_minutes += actual_minutes
        if item.item_type == 'quiz':
            plan.actual_questions += request.data.get('questions_count', 0)
        plan.save()
        
        # Check if plan is complete
        if not plan.items.exclude(status='completed').exists():
            plan.is_completed = True
            plan.completed_at = timezone.now()
            plan.save()
        
        return Response(StudyPlanItemSerializer(item).data)

    @action(detail=True, methods=['post'])
    def skip(self, request, pk=None):
        """Skip an item."""
        item = self.get_object()
        item.status = 'skipped'
        item.save()
        return Response(StudyPlanItemSerializer(item).data)

