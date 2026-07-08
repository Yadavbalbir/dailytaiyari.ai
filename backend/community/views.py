"""
Community views - Posts, Comments, Likes, Polls, Quizzes, Leaderboard.
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Q
from django.shortcuts import get_object_or_404

from .models import (
    Post, Comment, Like, PollOption, PollVote,
    CommunityQuiz, QuizAttempt, CommunityStats, CommunityLeaderboard
)
from .serializers import (
    PostSerializer, PostCreateSerializer,
    CommentSerializer, CommentCreateSerializer,
    CommunityStatsSerializer, CommunityLeaderboardSerializer,
    QuizAttemptSerializer
)
from .services import CommunityXPService, CommunityLeaderboardService
from core.views import TenantAwareViewSet


def _is_staff_user(user):
    """Admins and instructors moderate/see every post in the tenant."""
    role = getattr(user, 'role', None)
    return role in ('admin', 'instructor') or getattr(user, 'is_staff', False)


def _student_course_ids(user):
    """IDs of every course the user is actively (approved) enrolled in."""
    try:
        profile = user.profile
    except Exception:
        return []
    return list(
        profile.enrollments.filter(
            status='approved', is_active=True
        ).values_list('course_id', flat=True)
    )


def accessible_posts_q(user):
    """Q filtering the posts a user is allowed to see.

    - Post has no course links (legacy ``course`` null AND ``courses`` empty)
      -> global, visible to everyone in the tenant.
    - Post is linked to one or more courses -> visible only if the user is
      enrolled in at least one of them.
    - The author always sees their own posts.
    Admins/instructors bypass this entirely (handled by the caller).
    """
    global_q = Q(course__isnull=True) & Q(courses__isnull=True)
    course_ids = _student_course_ids(user)
    q = global_q
    if course_ids:
        q = q | Q(course__in=course_ids) | Q(courses__in=course_ids)
    try:
        q = q | Q(author=user.profile)
    except Exception:
        pass
    return q


class PostViewSet(TenantAwareViewSet):
    """
    ViewSet for community posts (questions, polls, quizzes).
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Post.objects.filter(status='active').select_related(
            'author__user', 'course', 'subject'
        ).prefetch_related('poll_options', 'quiz', 'courses')

        # Course-scoped visibility: global posts are visible to all, but posts
        # linked to course(s) are only visible to enrolled students (the author
        # and admins/instructors always see them).
        if not _is_staff_user(self.request.user):
            queryset = queryset.filter(accessible_posts_q(self.request.user)).distinct()

        # Filters
        post_type = self.request.query_params.get('type')
        if post_type:
            queryset = queryset.filter(post_type=post_type)

        course = self.request.query_params.get('course')
        if course == 'global':
            # Only globally-visible posts (no course link at all).
            queryset = queryset.filter(course__isnull=True, courses__isnull=True)
        elif course:
            # Posts linked to this course via either the M2M or the legacy FK.
            queryset = queryset.filter(
                Q(courses=course) | Q(course_id=course)
            ).distinct()

        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(subject_id=subject)

        is_solved = self.request.query_params.get('is_solved')
        if is_solved is not None:
            queryset = queryset.filter(is_solved=is_solved.lower() == 'true')
        
        # Sorting
        sort = self.request.query_params.get('sort', 'recent')
        if sort == 'popular':
            queryset = queryset.order_by('-likes_count', '-comments_count', '-created_at')
        elif sort == 'unanswered':
            queryset = queryset.filter(comments_count=0, post_type='question')
        else:  # recent
            queryset = queryset.order_by('-created_at')
        
        # My posts
        if self.request.query_params.get('my_posts') == 'true':
            queryset = queryset.filter(author=self.request.user.profile)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateSerializer
        return PostSerializer

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Courses the user can filter by / post into.

        Students get their approved enrollments; admins/instructors get every
        course in the tenant so they can moderate and post to any course.
        """
        from exams.models import Course

        if _is_staff_user(request.user):
            courses_qs = Course.objects.all()
            if getattr(request, 'tenant', None):
                courses_qs = courses_qs.filter(tenant=request.tenant)
        else:
            course_ids = _student_course_ids(request.user)
            courses_qs = Course.objects.filter(id__in=course_ids)

        courses = list(
            courses_qs.values('id', 'name', 'code').order_by('name')
        )
        return Response({
            'courses': courses,
            'is_staff': _is_staff_user(request.user),
        })

    def retrieve(self, request, *args, **kwargs):
        """Increment view count on retrieve."""
        instance = self.get_object()
        Post.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        post = serializer.save()
        
        # Award XP based on post type
        action_map = {
            'question': 'ask_question',
            'poll': 'create_poll',
            'quiz': 'create_quiz'
        }
        action = action_map.get(post.post_type)
        if action:
            CommunityXPService.award_xp(
                self.request.user.profile,
                action,
                reference_id=post.id,
                description=f"Created {post.post_type}: {post.title[:50]}"
            )
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Toggle like on a post (soft-toggle; XP awarded at most once, never to self)."""
        post = self.get_object()
        user = request.user.profile
        
        like, created = Like.objects.get_or_create(
            user=user, post=post,
            defaults={'is_active': True}
        )
        
        if created or not like.is_active:
            # Becoming liked
            if not created:
                like.is_active = True
            Post.objects.filter(pk=post.pk).update(likes_count=F('likes_count') + 1)
            # Award XP to post author once, and never for liking your own post
            if not like.xp_awarded and post.author_id != user.id:
                CommunityXPService.award_xp(
                    post.author,
                    'receive_like_post',
                    reference_id=post.id,
                    description=f"Like received on: {post.title[:50]}"
                )
                like.xp_awarded = True
            like.save(update_fields=['is_active', 'xp_awarded'])
            return Response({'liked': True, 'likes_count': post.likes_count + 1})
        else:
            # Unlike: deactivate (keep row so XP can't be re-awarded later)
            like.is_active = False
            like.save(update_fields=['is_active'])
            Post.objects.filter(pk=post.pk).update(likes_count=F('likes_count') - 1)
            return Response({'liked': False, 'likes_count': post.likes_count - 1})
    
    @action(detail=True, methods=['post'])
    def mark_solved(self, request, pk=None):
        """Mark a question as solved (only by author)."""
        post = self.get_object()
        
        if post.author != request.user.profile:
            return Response(
                {'error': 'Only the author can mark this as solved.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if post.post_type != 'question':
            return Response(
                {'error': 'Only questions can be marked as solved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        post.is_solved = not post.is_solved
        post.save()
        
        return Response({'is_solved': post.is_solved})
    
    @action(detail=True, methods=['post'])
    def select_best_answer(self, request, pk=None):
        """Select the best answer for a question (only by author)."""
        post = self.get_object()
        comment_id = request.data.get('comment_id')
        
        if post.author != request.user.profile:
            return Response(
                {'error': 'Only the author can select the best answer.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if post.post_type != 'question':
            return Response(
                {'error': 'Only questions can have a best answer.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = get_object_or_404(Comment, pk=comment_id, post=post)
        
        # Remove previous best answer
        if post.best_answer:
            post.best_answer.is_best_answer = False
            post.best_answer.save()
        
        # Set new best answer
        comment.is_best_answer = True
        comment.save()
        
        post.best_answer = comment
        post.is_solved = True
        post.save()
        
        # Award XP to answer author once per comment, and never for answering your own question
        if (not comment.best_answer_xp_awarded
                and comment.author_id != post.author_id):
            CommunityXPService.award_xp(
                comment.author,
                'best_answer',
                reference_id=comment.id,
                description=f"Best answer on: {post.title[:50]}"
            )
            Comment.objects.filter(pk=comment.pk).update(best_answer_xp_awarded=True)
        
        return Response({'best_answer': comment.id, 'is_solved': True})
    
    @action(detail=True, methods=['post'])
    def vote_poll(self, request, pk=None):
        """Vote on a poll option."""
        post = self.get_object()
        option_id = request.data.get('option_id')
        
        if post.post_type != 'poll':
            return Response(
                {'error': 'This is not a poll.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        option = get_object_or_404(PollOption, pk=option_id, post=post)
        user = request.user.profile
        
        # Check if already voted
        existing_vote = PollVote.objects.filter(user=user, option__post=post).first()
        if existing_vote:
            # Change vote
            old_option = existing_vote.option
            PollOption.objects.filter(pk=old_option.pk).update(votes_count=F('votes_count') - 1)
            existing_vote.option = option
            existing_vote.save()
        else:
            # New vote
            PollVote.objects.create(user=user, option=option)
            CommunityXPService.award_xp(
                user,
                'vote_poll',
                reference_id=post.id,
                description=f"Voted on poll: {post.title[:50]}"
            )
        
        PollOption.objects.filter(pk=option.pk).update(votes_count=F('votes_count') + 1)
        
        # Return updated options
        post.refresh_from_db()
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data)


class CommentViewSet(TenantAwareViewSet):
    """
    ViewSet for comments/answers.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Comment.objects.select_related('author__user', 'post')
        
        post_id = self.request.query_params.get('post')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Only top-level comments by default
        if self.request.query_params.get('include_replies') != 'true':
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset.prefetch_related('replies__author__user')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CommentCreateSerializer
        return CommentSerializer
    
    def perform_create(self, serializer):
        comment = serializer.save()
        
        # Update post comment count
        Post.objects.filter(pk=comment.post_id).update(
            comments_count=F('comments_count') + 1
        )
        
        # Award XP for answering (only top-level comments, once, never on your own question)
        if (comment.parent is None
                and not comment.answer_xp_awarded
                and comment.author_id != comment.post.author_id):
            CommunityXPService.award_xp(
                self.request.user.profile,
                'answer_question',
                reference_id=comment.id,
                description=f"Answered: {comment.post.title[:50]}"
            )
            Comment.objects.filter(pk=comment.pk).update(answer_xp_awarded=True)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Toggle like on a comment (soft-toggle; XP awarded at most once, never to self)."""
        comment = self.get_object()
        user = request.user.profile
        
        like, created = Like.objects.get_or_create(
            user=user, comment=comment,
            defaults={'is_active': True}
        )
        
        if created or not like.is_active:
            if not created:
                like.is_active = True
            Comment.objects.filter(pk=comment.pk).update(likes_count=F('likes_count') + 1)
            # Award XP to comment author once, and never for liking your own comment
            if not like.xp_awarded and comment.author_id != user.id:
                CommunityXPService.award_xp(
                    comment.author,
                    'receive_like_comment',
                    reference_id=comment.id,
                    description="Like received on comment"
                )
                like.xp_awarded = True
            like.save(update_fields=['is_active', 'xp_awarded'])
            return Response({'liked': True, 'likes_count': comment.likes_count + 1})
        else:
            like.is_active = False
            like.save(update_fields=['is_active'])
            Comment.objects.filter(pk=comment.pk).update(likes_count=F('likes_count') - 1)
            return Response({'liked': False, 'likes_count': comment.likes_count - 1})


class QuizAttemptViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    ViewSet for quiz attempts.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = QuizAttemptSerializer
    queryset = QuizAttempt.objects.all()


class CommunityStatsViewSet(viewsets.GenericViewSet):
    """
    ViewSet for community stats.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        """Get current user's community stats."""
        stats, created = CommunityStats.objects.get_or_create(
            user=request.user.profile
        )
        serializer = CommunityStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_stats(self, request):
        """Get another user's community stats."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stats = get_object_or_404(CommunityStats, user_id=user_id)
        serializer = CommunityStatsSerializer(stats)
        return Response(serializer.data)


class CommunityLeaderboardViewSet(viewsets.GenericViewSet):
    """
    ViewSet for community leaderboard. Tenant-scoped: only students of the current tenant.
    """
    permission_classes = [IsAuthenticated]
    
    def _tenant(self, request):
        return getattr(request, 'tenant', None)
    
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        """Get weekly leaderboard (tenant-scoped)."""
        entries = CommunityLeaderboardService.get_leaderboard('weekly', limit=50, tenant=self._tenant(request))
        serializer = CommunityLeaderboardSerializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get monthly leaderboard (tenant-scoped)."""
        entries = CommunityLeaderboardService.get_leaderboard('monthly', limit=50, tenant=self._tenant(request))
        serializer = CommunityLeaderboardSerializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def all_time(self, request):
        """Get all-time leaderboard (tenant-scoped)."""
        entries = CommunityLeaderboardService.get_leaderboard('all_time', limit=50, tenant=self._tenant(request))
        serializer = CommunityLeaderboardSerializer(entries, many=True)
        return Response(serializer.data)
