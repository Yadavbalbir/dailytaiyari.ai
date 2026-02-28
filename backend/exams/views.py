"""
Views for Exams app.
"""
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Avg, Sum, F, Value, DecimalField
from django.db.models.functions import Coalesce

from .models import Exam, Subject, Topic, Chapter
from .serializers import (
    ExamSerializer, ExamListSerializer, ExamDetailSerializer,
    SubjectSerializer, SubjectDetailSerializer,
    TopicSerializer, TopicDetailSerializer,
    ChapterSerializer, ChapterDetailSerializer
)
from core.views import TenantAwareReadOnlyViewSet


class ExamViewSet(TenantAwareReadOnlyViewSet):
    """
    ViewSet for exam operations.

    list: Get all active exams
    retrieve: Get exam details with subjects
    subjects: Get all subjects for an exam
    """
    queryset = Exam.objects.filter(status='active')
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['exam_type', 'is_featured']
    search_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamListSerializer
        return ExamDetailSerializer

    @action(detail=True, methods=['get'])
    def subjects(self, request, pk=None):
        """Get all subjects for an exam."""
        exam = self.get_object()
        subjects = exam.subjects.all()
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def topics(self, request, pk=None):
        """Get all topics for an exam."""
        exam = self.get_object()
        topics = Topic.objects.filter(exams=exam)
        serializer = TopicSerializer(topics, many=True)
        return Response(serializer.data)


class SubjectViewSet(TenantAwareReadOnlyViewSet):
    """
    ViewSet for subject operations.
    """
    queryset = Subject.objects.all()
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['exams']
    search_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SubjectDetailSerializer
        return SubjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            try:
                exam = self.request.user.profile.primary_exam
                if exam and not self.request.query_params.get('exams'):
                    queryset = queryset.filter(exams=exam)
            except Exception:
                pass
        return queryset

    @action(detail=True, methods=['get'])
    def topics(self, request, pk=None):
        """Get all topics for a subject."""
        subject = self.get_object()
        topics = subject.topics.filter(parent_topic__isnull=True)
        serializer = TopicDetailSerializer(topics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        """Get all chapters for a subject."""
        subject = self.get_object()
        chapters = subject.chapters.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)


class TopicViewSet(TenantAwareReadOnlyViewSet):
    """
    ViewSet for topic operations.
    """
    queryset = Topic.objects.all()
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['subject', 'difficulty', 'importance', 'parent_topic']
    search_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TopicDetailSerializer
        return TopicSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            try:
                exam = self.request.user.profile.primary_exam
                if exam:
                    queryset = queryset.filter(subject__exams=exam)
            except Exception:
                pass
        return queryset

    @action(detail=True, methods=['get'])
    def subtopics(self, request, pk=None):
        """Get subtopics of a topic."""
        topic = self.get_object()
        subtopics = topic.subtopics.all()
        serializer = TopicSerializer(subtopics, many=True)
        return Response(serializer.data)


class ChapterViewSet(TenantAwareReadOnlyViewSet):
    """
    ViewSet for chapter operations.
    """
    queryset = Chapter.objects.all()
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['subject', 'grade']
    search_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChapterDetailSerializer
        return ChapterSerializer


# ──────────────────────────────────────────────────────────────────────────────
# Study Flow API — subjects/chapters/content with progress
# ──────────────────────────────────────────────────────────────────────────────

class StudySubjectsView(APIView):
    """Return subjects for the student's primary exam with completion progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from content.models import Content, ContentProgress
        from quiz.models import Quiz, QuizAttempt

        student = request.user.profile
        exam = student.primary_exam
        if not exam:
            return Response([])

        subjects = Subject.objects.filter(exams=exam).order_by('order')
        result = []
        for subj in subjects:
            content_count = Content.objects.filter(
                subject=subj, status='published'
            ).count()
            content_done = ContentProgress.objects.filter(
                student=student,
                content__subject=subj,
                content__status='published',
                is_completed=True,
            ).count()
            quiz_count = Quiz.objects.filter(
                subject=subj, exam=exam, status='published'
            ).count()
            quiz_done = QuizAttempt.objects.filter(
                student=student,
                quiz__subject=subj,
                quiz__exam=exam,
                quiz__status='published',
                status='completed',
            ).values('quiz').distinct().count()

            total_content = content_count + quiz_count
            completed_content = content_done + quiz_done
            progress = (
                round((completed_content / total_content) * 100)
                if total_content > 0 else 0
            )

            chapters = subj.chapters.all().order_by('order')
            chapter_count = chapters.count()
            topic_count = subj.topics.count()

            result.append({
                'id': str(subj.id),
                'name': subj.name,
                'code': subj.code,
                'icon': subj.icon,
                'color': subj.color,
                'weightage': float(subj.weightage),
                'total_topics': topic_count,
                'total_chapters': chapter_count,
                'total_content': total_content,
                'completed_content': completed_content,
                'progress': progress,
            })

        return Response(result)


class StudyChaptersView(APIView):
    """Return chapters for a subject with completion progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, subject_id):
        from content.models import Content, ContentProgress
        from quiz.models import Quiz, QuizAttempt

        student = request.user.profile
        try:
            subject = Subject.objects.get(pk=subject_id)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=404)

        chapters = subject.chapters.all().order_by('order')
        result = []
        for ch in chapters:
            topic_ids = ch.topics.values_list('id', flat=True)

            content_count = Content.objects.filter(
                topic_id__in=topic_ids, status='published'
            ).count()
            content_done = ContentProgress.objects.filter(
                student=student,
                content__topic_id__in=topic_ids,
                content__status='published',
                is_completed=True,
            ).count()
            quiz_count = Quiz.objects.filter(
                topic_id__in=topic_ids, status='published',
            ).count()
            quiz_done = QuizAttempt.objects.filter(
                student=student,
                quiz__topic_id__in=topic_ids,
                status='completed',
            ).values('quiz').distinct().count()

            total_content = content_count + quiz_count
            completed_content = content_done + quiz_done

            reading_total = Content.objects.filter(
                topic_id__in=topic_ids, status='published',
                content_type__in=['notes', 'pdf', 'revision', 'formula'],
            ).count()
            reading_done = ContentProgress.objects.filter(
                student=student,
                content__topic_id__in=topic_ids,
                content__status='published',
                content__content_type__in=['notes', 'pdf', 'revision', 'formula'],
                is_completed=True,
            ).count()

            video_total = Content.objects.filter(
                topic_id__in=topic_ids, status='published',
                content_type='video',
            ).count()
            video_done = ContentProgress.objects.filter(
                student=student,
                content__topic_id__in=topic_ids,
                content__status='published',
                content__content_type='video',
                is_completed=True,
            ).count()

            quiz_total = Quiz.objects.filter(
                topic_id__in=topic_ids, status='published',
            ).count()
            quiz_attempted = QuizAttempt.objects.filter(
                student=student,
                quiz__topic_id__in=topic_ids,
                status='completed',
            ).values('quiz').distinct().count()

            progress = (
                round((completed_content / total_content) * 100)
                if total_content > 0 else 0
            )

            result.append({
                'id': str(ch.id),
                'name': ch.name,
                'code': ch.code,
                'description': ch.description,
                'estimated_hours': float(ch.estimated_hours),
                'topics_count': len(topic_ids),
                'order': ch.order,
                'progress': progress,
                'reading': {'total': reading_total, 'completed': reading_done},
                'videos': {'total': video_total, 'completed': video_done},
                'quizzes': {'total': quiz_total, 'attempted': quiz_attempted},
            })

        return Response({
            'subject': {
                'id': str(subject.id),
                'name': subject.name,
                'code': subject.code,
                'color': subject.color,
            },
            'chapters': result,
        })


class StudyChapterDetailView(APIView):
    """Return full chapter detail: content items, quizzes, with per-item progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, chapter_id):
        from content.models import Content, ContentProgress
        from quiz.models import Quiz, QuizAttempt

        student = request.user.profile
        try:
            chapter = Chapter.objects.select_related('subject').get(pk=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=404)

        topic_ids = list(chapter.topics.values_list('id', flat=True))

        # Content items with progress
        contents = Content.objects.filter(
            topic_id__in=topic_ids, status='published'
        ).order_by('order')
        progress_map = {
            cp.content_id: cp
            for cp in ContentProgress.objects.filter(
                student=student, content__in=contents
            )
        }
        reading_items = []
        video_items = []
        for c in contents:
            cp = progress_map.get(c.id)
            item = {
                'id': str(c.id),
                'title': c.title,
                'content_type': c.content_type,
                'topic_name': c.topic.name,
                'estimated_time_minutes': c.estimated_time_minutes,
                'video_duration_minutes': c.video_duration_minutes,
                'difficulty': c.difficulty,
                'is_free': c.is_free,
                'views_count': c.views_count,
                'is_completed': cp.is_completed if cp else False,
                'progress_percentage': cp.progress_percentage if cp else 0,
                'video_position_seconds': cp.video_position_seconds if cp else 0,
                'is_bookmarked': cp.is_bookmarked if cp else False,
            }
            if c.content_type == 'video':
                video_items.append(item)
            else:
                reading_items.append(item)

        # Quizzes with attempt info
        quizzes = Quiz.objects.filter(
            topic_id__in=topic_ids, status='published'
        ).order_by('created_at')
        attempt_map = {}
        for qa in QuizAttempt.objects.filter(
            student=student, quiz__in=quizzes, status='completed'
        ).order_by('-completed_at'):
            if qa.quiz_id not in attempt_map:
                attempt_map[qa.quiz_id] = []
            attempt_map[qa.quiz_id].append({
                'id': str(qa.id),
                'percentage': float(qa.percentage),
                'correct_answers': qa.correct_answers,
                'total_questions': qa.total_questions,
                'completed_at': qa.completed_at.isoformat() if qa.completed_at else None,
            })

        quiz_items = []
        for q in quizzes:
            attempts = attempt_map.get(q.id, [])
            best = max((a['percentage'] for a in attempts), default=0) if attempts else 0
            quiz_items.append({
                'id': str(q.id),
                'title': q.title,
                'quiz_type': q.quiz_type,
                'topic_name': q.topic.name if q.topic else '',
                'duration_minutes': q.duration_minutes,
                'total_questions': q.questions.count(),
                'is_free': q.is_free,
                'attempts_count': len(attempts),
                'best_score': best,
                'last_attempt': attempts[0] if attempts else None,
            })

        return Response({
            'chapter': {
                'id': str(chapter.id),
                'name': chapter.name,
                'code': chapter.code,
                'description': chapter.description,
                'subject_name': chapter.subject.name,
                'subject_id': str(chapter.subject.id),
                'estimated_hours': float(chapter.estimated_hours),
            },
            'reading': reading_items,
            'videos': video_items,
            'quizzes': quiz_items,
        })


class StudyLeaderboardView(APIView):
    """Scoped leaderboard at subject, chapter, or quiz level."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from analytics.models import DailyActivity
        from users.models import StudentProfile

        scope = request.query_params.get('scope', 'subject')
        scope_id = request.query_params.get('scope_id')
        student = request.user.profile

        if scope == 'subject' and scope_id:
            topic_ids = Topic.objects.filter(subject_id=scope_id).values_list('id', flat=True)
            from quiz.models import QuizAttempt
            leaderboard_qs = (
                QuizAttempt.objects.filter(
                    quiz__topic_id__in=topic_ids,
                    status='completed',
                )
                .values('student')
                .annotate(
                    total_xp=Sum('xp_earned'),
                    total_correct=Sum('correct_answers'),
                    total_attempted=Sum('total_questions'),
                    avg_accuracy=Avg('percentage'),
                )
                .order_by('-total_xp')[:20]
            )
        elif scope == 'chapter' and scope_id:
            try:
                ch = Chapter.objects.get(pk=scope_id)
            except Chapter.DoesNotExist:
                return Response([])
            topic_ids = ch.topics.values_list('id', flat=True)
            from quiz.models import QuizAttempt
            leaderboard_qs = (
                QuizAttempt.objects.filter(
                    quiz__topic_id__in=topic_ids,
                    status='completed',
                )
                .values('student')
                .annotate(
                    total_xp=Sum('xp_earned'),
                    total_correct=Sum('correct_answers'),
                    total_attempted=Sum('total_questions'),
                    avg_accuracy=Avg('percentage'),
                )
                .order_by('-total_xp')[:20]
            )
        else:
            return Response([])

        profiles = {
            str(p.id): p
            for p in StudentProfile.objects.select_related('user').filter(
                id__in=[e['student'] for e in leaderboard_qs]
            )
        }

        entries = []
        for rank, entry in enumerate(leaderboard_qs, 1):
            p = profiles.get(str(entry['student']))
            if not p:
                continue
            entries.append({
                'rank': rank,
                'student_name': p.user.full_name,
                'avatar': p.user.avatar.url if p.user.avatar else None,
                'total_xp': entry['total_xp'] or 0,
                'accuracy': round(float(entry['avg_accuracy'] or 0), 1),
                'is_current_user': p.id == student.id,
            })

        return Response(entries)

