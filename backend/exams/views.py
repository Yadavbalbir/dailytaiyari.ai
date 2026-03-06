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
                    queryset = queryset.filter(exam=exam)
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
                    queryset = queryset.filter(subject__exam=exam)
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


class TenantContentExplorerView(APIView):
    """
    Hierarchical content explorer for Tenant Admins.
    Returns all active exams -> subjects -> chapters.
    """
    permission_classes = [permissions.IsAuthenticated] # Role check handled in frontend for now, or add IsTenantAdmin

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        from .serializers import ExamContentExplorerSerializer
        exams = Exam.objects.filter(status='active').prefetch_related(
            'subjects',
            'subjects__chapters',
            'subjects__quizzes',
            'mock_tests',
            'quizzes'
        ).order_by('name')
        
        serializer = ExamContentExplorerSerializer(exams, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────────────────────
# Exams available for enrollment (dropdown / list) — not tenant-strict so list is never empty
# ──────────────────────────────────────────────────────────────────────────────

class AvailableExamsForEnrollmentView(APIView):
    """
    Return active exams for the enrollment dropdown. Exam must belong to the request tenant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Exam.objects.filter(status='active').order_by('name')
        if hasattr(request, 'tenant') and request.tenant:
            qs = qs.filter(tenant=request.tenant)
        exams = list(qs)
        result = [
            {
                'id': str(e.id),
                'name': e.name,
                'code': e.code,
                'color': getattr(e, 'color', None) or '#3B82F6',
                'is_featured': getattr(e, 'is_featured', False),
            }
            for e in exams
        ]
        return Response(result)


# ──────────────────────────────────────────────────────────────────────────────
# Study Flow API — exams → subjects → chapters → content with progress
# ──────────────────────────────────────────────────────────────────────────────

class StudyExamsView(APIView):
    """
    Return only exams the user is enrolled/registered in for the Study tab.
    No fallback to all exams — user sees only their enrolled exams.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from users.models import ExamEnrollment

        student = request.user.profile
        enrolled = ExamEnrollment.objects.filter(
            student=student, is_active=True
        ).select_related('exam').order_by('enrolled_at')

        exams = [e.exam for e in enrolled if e.exam and e.exam.status == 'active']

        result = [
            {
                'id': str(e.id),
                'name': e.name,
                'code': e.code,
                'color': getattr(e, 'color', None) or '#3B82F6',
                'is_featured': getattr(e, 'is_featured', False),
            }
            for e in exams
        ]
        return Response(result)


class StudySubjectsView(APIView):
    """
    Return subjects for the selected exam with completion progress.
    Flow: Study tab → select exam → this list of subjects.
    Query params: exam_id (optional) — if omitted, uses student's primary_exam.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from content.models import Content, ContentProgress
        from quiz.models import Quiz, QuizAttempt

        student = request.user.profile
        exam_id = request.query_params.get('exam_id')
        if exam_id:
            try:
                exam = Exam.objects.get(pk=exam_id, status='active')
            except Exam.DoesNotExist:
                return Response({'error': 'Exam not found'}, status=404)
        else:
            exam = getattr(student, 'primary_exam', None)
        if not exam:
            return Response([])

        subjects = Subject.objects.filter(exam=exam).order_by('order')
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
    """
    Return chapters for a subject with ordered topics in each chapter.
    Flow: Subject → Chapters → each chapter has topics (ordered).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, subject_id):
        from content.models import Content, ContentProgress
        from quiz.models import Quiz, QuizAttempt

        student = request.user.profile
        try:
            subject = Subject.objects.get(pk=subject_id)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=404)

        chapters = subject.chapters.all().order_by('order').prefetch_related(
            'chapter_topics__topic'
        )
        result = []
        for ch in chapters:
            # Ordered topics via ChapterTopic (prefetched)
            chapter_topic_qs = ch.chapter_topics.select_related('topic').order_by('order')
            topic_ids = []
            topic_list = []
            for ct in chapter_topic_qs:
                topic_ids.append(ct.topic_id)
                topic_list.append({
                    'id': str(ct.topic.id),
                    'name': ct.topic.name,
                    'code': ct.topic.code,
                    'order': ct.order,
                })

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
                'topics': topic_list,
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
    """
    Return chapter detail with topics; each topic has reading materials and quizzes.
    Flow: Chapter → Topics → each topic has reading (content) + quizzes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, chapter_id):
        from content.models import Content, ContentProgress
        from quiz.models import Quiz, QuizAttempt

        student = request.user.profile
        try:
            chapter = Chapter.objects.select_related('subject').prefetch_related(
                'chapter_topics__topic'
            ).get(pk=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=404)

        # Ordered topics in this chapter
        chapter_topics = list(
            chapter.chapter_topics.select_related('topic').order_by('order')
        )
        topic_ids = [ct.topic_id for ct in chapter_topics]

        if not topic_ids:
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
                'topics': [],
            })

        contents = Content.objects.filter(
            topic_id__in=topic_ids, status='published'
        ).order_by('topic_id', 'order')
        progress_map = {
            cp.content_id: cp
            for cp in ContentProgress.objects.filter(
                student=student, content__in=contents
            )
        }
        quizzes = Quiz.objects.filter(
            topic_id__in=topic_ids, status='published'
        ).prefetch_related('questions')
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

        # Build per-topic: reading (notes, revision, pdf, formula) + videos + quizzes
        content_by_topic = {}
        for c in contents:
            tid = str(c.topic_id)
            if tid not in content_by_topic:
                content_by_topic[tid] = {'reading': [], 'videos': []}
            cp = progress_map.get(c.id)
            item = {
                'id': str(c.id),
                'title': c.title,
                'content_type': c.content_type,
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
                content_by_topic[tid]['videos'].append(item)
            else:
                content_by_topic[tid]['reading'].append(item)

        quiz_by_topic = {}
        for q in quizzes:
            tid = str(q.topic_id) if q.topic_id else None
            if tid not in quiz_by_topic:
                quiz_by_topic[tid] = []
            attempts = attempt_map.get(q.id, [])
            best = max((a['percentage'] for a in attempts), default=0) if attempts else 0
            quiz_by_topic[tid].append({
                'id': str(q.id),
                'title': q.title,
                'quiz_type': q.quiz_type,
                'duration_minutes': q.duration_minutes,
                'total_questions': q.questions.count(),
                'is_free': q.is_free,
                'attempts_count': len(attempts),
                'best_score': best,
                'last_attempt': attempts[0] if attempts else None,
            })

        topics_payload = []
        for ct in chapter_topics:
            t = ct.topic
            tid = str(t.id)
            topics_payload.append({
                'topic': {
                    'id': tid,
                    'name': t.name,
                    'code': t.code,
                    'order': ct.order,
                    'difficulty': t.difficulty,
                    'importance': t.importance,
                    'estimated_study_hours': float(t.estimated_study_hours),
                },
                'reading': content_by_topic.get(tid, {}).get('reading', []),
                'videos': content_by_topic.get(tid, {}).get('videos', []),
                'quizzes': quiz_by_topic.get(tid, []),
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
            'topics': topics_payload,
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
        elif scope == 'chapter' and scope_id:
            try:
                ch = Chapter.objects.get(pk=scope_id)
            except Chapter.DoesNotExist:
                return Response([])
            topic_ids = ch.chapter_topics.values_list('topic_id', flat=True)
        else:
            return Response([])

        from quiz.models import QuizAttempt
        from content.models import ContentProgress
        from content.models import Content
        from quiz.models import Quiz
        from gamification.models import XPTransaction

        quiz_qs = (
            QuizAttempt.objects.filter(
                quiz__topic_id__in=topic_ids,
                status='completed',
            )
            .values('student')
            .annotate(
                total_correct=Sum('correct_answers'),
                total_attempted=Sum('total_questions'),
                avg_accuracy=Avg('percentage'),
            )
        )
        
        # Collect base stats per student
        student_stats = {}
        for entry in quiz_qs:
            sid = entry['student']
            student_stats[sid] = {
                'total_xp': 0,
                'avg_accuracy': entry['avg_accuracy'],
            }
            
        # Get content and quiz IDs to filter XPTransactions
        content_ids = Content.objects.filter(topic_id__in=topic_ids).values_list('id', flat=True)
        quiz_ids = Quiz.objects.filter(topic_id__in=topic_ids).values_list('id', flat=True)
        
        # Convert UUIDs to strings for XPTransaction.reference_id (since reference_id might be stored as string or UUID depending on DB)
        # XPTransaction.reference_id is UUIDField so we can filter directly by list of UUIDs
        all_refs = list(content_ids) + list(quiz_ids)
        
        xp_qs = XPTransaction.objects.filter(
            reference_id__in=all_refs
        ).values('student').annotate(
            total_earned=Sum('xp_amount')
        )
        
        for xp_entry in xp_qs:
            sid = xp_entry['student']
            if sid not in student_stats:
                student_stats[sid] = {
                    'total_xp': 0,
                    'avg_accuracy': 0,
                }
            student_stats[sid]['total_xp'] += xp_entry['total_earned'] or 0

        # Sort by XP descending, keep top 20
        sorted_students = sorted(
            [(sid, stats) for sid, stats in student_stats.items() if stats['total_xp'] > 0],
            key=lambda x: x[1]['total_xp'],
            reverse=True
        )[:20]

        profiles = {
            str(p.id): p
            for p in StudentProfile.objects.select_related('user').filter(
                id__in=[sid for sid, stats in sorted_students]
            )
        }

        entries = []
        rank = 1
        for sid, stats in sorted_students:
            p = profiles.get(str(sid))
            if not p:
                continue
            entries.append({
                'rank': rank,
                'student_name': p.user.full_name,
                'role': p.user.role,
                'avatar': p.user.avatar.url if p.user.avatar else None,
                'total_xp': stats['total_xp'],
                'accuracy': round(float(stats['avg_accuracy'] or 0), 1),
                'is_current_user': p.id == student.id,
            })
            rank += 1



        return Response(entries)

