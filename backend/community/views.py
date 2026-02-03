"""
Community views - Posts, Comments, Likes, Polls, Quizzes, Leaderboard.
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F
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


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for community posts (questions, polls, quizzes).
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Post.objects.filter(status='active').select_related(
            'author__user', 'exam', 'subject'
        ).prefetch_related('poll_options', 'quiz')
        
        # Filters
        post_type = self.request.query_params.get('type')
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        
        exam = self.request.query_params.get('exam')
        if exam:
            queryset = queryset.filter(exam_id=exam)
        
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
        """Toggle like on a post."""
        post = self.get_object()
        user = request.user.profile
        
        like, created = Like.objects.get_or_create(user=user, post=post)
        
        if created:
            Post.objects.filter(pk=post.pk).update(likes_count=F('likes_count') + 1)
            # Award XP to post author
            CommunityXPService.award_xp(
                post.author,
                'receive_like_post',
                reference_id=post.id,
                description=f"Like received on: {post.title[:50]}"
            )
            return Response({'liked': True, 'likes_count': post.likes_count + 1})
        else:
            like.delete()
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
        
        # Award XP to answer author
        CommunityXPService.award_xp(
            comment.author,
            'best_answer',
            reference_id=comment.id,
            description=f"Best answer on: {post.title[:50]}"
        )
        
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


class CommentViewSet(viewsets.ModelViewSet):
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
        
        # Award XP for answering (only top-level comments)
        if comment.parent is None:
            CommunityXPService.award_xp(
                self.request.user.profile,
                'answer_question',
                reference_id=comment.id,
                description=f"Answered: {comment.post.title[:50]}"
            )
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Toggle like on a comment."""
        comment = self.get_object()
        user = request.user.profile
        
        like, created = Like.objects.get_or_create(user=user, comment=comment)
        
        if created:
            Comment.objects.filter(pk=comment.pk).update(likes_count=F('likes_count') + 1)
            # Award XP to comment author
            CommunityXPService.award_xp(
                comment.author,
                'receive_like_comment',
                reference_id=comment.id,
                description="Like received on comment"
            )
            return Response({'liked': True, 'likes_count': comment.likes_count + 1})
        else:
            like.delete()
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
    ViewSet for community leaderboard.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        """Get weekly leaderboard."""
        entries = CommunityLeaderboardService.get_leaderboard('weekly', limit=50)
        serializer = CommunityLeaderboardSerializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get monthly leaderboard."""
        entries = CommunityLeaderboardService.get_leaderboard('monthly', limit=50)
        serializer = CommunityLeaderboardSerializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def all_time(self, request):
        """Get all-time leaderboard."""
        entries = CommunityLeaderboardService.get_leaderboard('all_time', limit=50)
        serializer = CommunityLeaderboardSerializer(entries, many=True)
        return Response(serializer.data)
