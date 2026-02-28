"""
Community serializers.
"""
from rest_framework import serializers
from .models import (
    Post, Comment, Like, PollOption, PollVote,
    CommunityQuiz, QuizAttempt, CommunityStats, CommunityLeaderboard
)
from .services import ContentModerationService
from users.serializers import UserSerializer


class AuthorSerializer(serializers.Serializer):
    """Minimal author info for display."""
    id = serializers.UUIDField(source='user.id')
    full_name = serializers.CharField(source='user.full_name')
    first_name = serializers.CharField(source='user.first_name')
    role = serializers.CharField(source='user.role', read_only=True)
    current_level = serializers.IntegerField()
    total_xp = serializers.IntegerField()


class PollOptionSerializer(serializers.ModelSerializer):
    """Serializer for poll options."""
    vote_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = PollOption
        fields = ['id', 'option_text', 'votes_count', 'vote_percentage', 'order']
        read_only_fields = ['id', 'votes_count', 'vote_percentage']
    
    def get_vote_percentage(self, obj):
        total_votes = sum(opt.votes_count for opt in obj.post.poll_options.all())
        if total_votes == 0:
            return 0
        return round((obj.votes_count / total_votes) * 100, 1)


class CommunityQuizSerializer(serializers.ModelSerializer):
    """Serializer for community quiz."""
    success_rate = serializers.ReadOnlyField()
    user_attempt = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityQuiz
        fields = [
            'id', 'question', 'options', 'correct_answer', 'explanation',
            'attempts_count', 'correct_count', 'success_rate', 'user_attempt'
        ]
        extra_kwargs = {
            'correct_answer': {'write_only': True}  # Hide correct answer
        }
    
    def get_user_attempt(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            attempt = QuizAttempt.objects.get(
                quiz=obj,
                user=request.user.profile
            )
            return {
                'selected_answer': attempt.selected_answer,
                'is_correct': attempt.is_correct,
                'xp_earned': attempt.xp_earned
            }
        except QuizAttempt.DoesNotExist:
            return None


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""
    author = AuthorSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'parent', 'author', 'content',
            'likes_count', 'is_best_answer', 'is_liked',
            'replies', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'likes_count', 'is_best_answer', 'created_at']
    
    def get_replies(self, obj):
        if obj.parent is not None:
            return []  # Don't nest more than 2 levels
        replies = obj.replies.all()[:5]  # Limit to 5 replies
        return CommentSerializer(replies, many=True, context=self.context).data
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Like.objects.filter(user=request.user.profile, comment=obj).exists()
    
    def validate_content(self, value):
        result = ContentModerationService.validate_content(content=value)
        if not result['is_valid']:
            raise serializers.ValidationError(result['errors'][0])
        return value


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())
    parent = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Comment
        fields = ['post', 'parent', 'content']
    
    def validate_content(self, value):
        result = ContentModerationService.validate_content(content=value)
        if not result['is_valid']:
            raise serializers.ValidationError(result['errors'][0])
        return value
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user.profile
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    """Serializer for posts (read)."""
    author = AuthorSerializer(read_only=True)
    poll_options = PollOptionSerializer(many=True, read_only=True)
    quiz = CommunityQuizSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    user_poll_vote = serializers.SerializerMethodField()
    top_comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'post_type', 'title', 'content', 'author',
            'exam', 'subject', 'tags',
            'likes_count', 'comments_count', 'views_count',
            'is_solved', 'best_answer', 'status',
            'poll_options', 'quiz', 'is_liked', 'user_poll_vote',
            'top_comments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'likes_count', 'comments_count', 'views_count',
            'is_solved', 'best_answer', 'created_at', 'updated_at'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Like.objects.filter(user=request.user.profile, post=obj).exists()
    
    def get_user_poll_vote(self, obj):
        if obj.post_type != 'poll':
            return None
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        vote = PollVote.objects.filter(
            user=request.user.profile,
            option__post=obj
        ).first()
        return vote.option_id if vote else None
    
    def get_top_comments(self, obj):
        comments = obj.comments.filter(parent__isnull=True)[:3]
        return CommentSerializer(comments, many=True, context=self.context).data


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts."""
    poll_options = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False,
        write_only=True
    )
    quiz_data = serializers.JSONField(required=False, write_only=True)
    
    class Meta:
        model = Post
        fields = [
            'post_type', 'title', 'content', 'exam', 'subject', 'tags',
            'poll_options', 'quiz_data'
        ]
    
    def validate(self, data):
        # Validate content for profanity
        result = ContentModerationService.validate_content(
            title=data.get('title'),
            content=data.get('content')
        )
        if not result['is_valid']:
            raise serializers.ValidationError({'content': result['errors']})
        
        # Validate poll
        if data.get('post_type') == 'poll':
            poll_options = data.get('poll_options', [])
            if len(poll_options) < 2:
                raise serializers.ValidationError({
                    'poll_options': 'Poll must have at least 2 options.'
                })
        
        # Validate quiz
        if data.get('post_type') == 'quiz':
            quiz_data = data.get('quiz_data')
            if not quiz_data:
                raise serializers.ValidationError({
                    'quiz_data': 'Quiz data is required for quiz posts.'
                })
            if 'question' not in quiz_data or 'options' not in quiz_data:
                raise serializers.ValidationError({
                    'quiz_data': 'Quiz must have question and options.'
                })
            if len(quiz_data.get('options', [])) < 2:
                raise serializers.ValidationError({
                    'quiz_data': 'Quiz must have at least 2 options.'
                })
            if 'correct_answer' not in quiz_data:
                raise serializers.ValidationError({
                    'quiz_data': 'Quiz must have a correct_answer index.'
                })
        
        return data
    
    def create(self, validated_data):
        poll_options = validated_data.pop('poll_options', [])
        quiz_data = validated_data.pop('quiz_data', None)
        
        validated_data['author'] = self.context['request'].user.profile
        post = super().create(validated_data)
        
        # Create poll options
        if poll_options:
            for i, option_text in enumerate(poll_options):
                PollOption.objects.create(
                    post=post,
                    option_text=option_text,
                    order=i
                )
        
        # Create quiz
        if quiz_data:
            CommunityQuiz.objects.create(
                post=post,
                question=quiz_data['question'],
                options=quiz_data['options'],
                correct_answer=quiz_data['correct_answer'],
                explanation=quiz_data.get('explanation', '')
            )
        
        return post


class CommunityStatsSerializer(serializers.ModelSerializer):
    """Serializer for community stats."""
    
    class Meta:
        model = CommunityStats
        fields = [
            'posts_count', 'questions_count', 'polls_count', 'quizzes_count',
            'answers_count', 'best_answers_count',
            'likes_given', 'likes_received', 'total_community_xp'
        ]


class CommunityLeaderboardSerializer(serializers.ModelSerializer):
    """Serializer for community leaderboard."""
    user = AuthorSerializer(read_only=True)
    
    class Meta:
        model = CommunityLeaderboard
        fields = [
            'user', 'period', 'posts_count', 'answers_count',
            'best_answers_count', 'likes_received', 'score', 'rank'
        ]


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for quiz attempts."""
    
    class Meta:
        model = QuizAttempt
        fields = ['quiz', 'selected_answer']
    
    def validate(self, data):
        quiz = data['quiz']
        user = self.context['request'].user.profile
        
        # Check if already attempted
        if QuizAttempt.objects.filter(quiz=quiz, user=user).exists():
            raise serializers.ValidationError("You have already attempted this quiz.")
        
        # Validate answer index
        if data['selected_answer'] >= len(quiz.options):
            raise serializers.ValidationError("Invalid answer selection.")
        
        return data
    
    def create(self, validated_data):
        quiz = validated_data['quiz']
        user = self.context['request'].user.profile
        selected = validated_data['selected_answer']
        is_correct = selected == quiz.correct_answer
        
        # Update quiz stats
        quiz.attempts_count += 1
        if is_correct:
            quiz.correct_count += 1
        quiz.save()
        
        # Create attempt
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            selected_answer=selected,
            is_correct=is_correct,
            xp_earned=5 if is_correct else 0
        )
        
        # Award XP if correct
        if is_correct:
            from .services import CommunityXPService
            CommunityXPService.award_xp(
                user,
                'quiz_correct',
                reference_id=quiz.post.id,
                description=f"Correct answer: {quiz.question[:50]}"
            )
        
        return attempt
