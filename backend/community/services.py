"""
Community services - Content moderation, XP rewards, leaderboard.
"""
from datetime import date, timedelta
from django.db import transaction
from django.db.models import Sum, Count, F
from better_profanity import profanity

from .models import (
    Post, Comment, Like, PollOption, PollVote, 
    CommunityQuiz, QuizAttempt, CommunityStats, CommunityLeaderboard
)
from gamification.models import XPTransaction


class ContentModerationService:
    """
    Service for filtering inappropriate content.
    """
    
    # Additional custom bad words (Hindi transliterated abuses, etc.)
    CUSTOM_BAD_WORDS = [
        'bhosdike', 'bhosdi', 'madarchod', 'behenchod', 'chutiya', 
        'gandu', 'laude', 'lodu', 'randi', 'harami', 'sala', 'saala',
        'bakchod', 'chut', 'lawde', 'bsdk', 'mc', 'bc', 'lodu'
    ]
    
    @classmethod
    def initialize(cls):
        """Initialize the profanity filter with custom words."""
        profanity.load_censor_words()
        profanity.add_censor_words(cls.CUSTOM_BAD_WORDS)
    
    @classmethod
    def is_clean(cls, text: str) -> bool:
        """Check if text is free of profanity."""
        cls.initialize()
        return not profanity.contains_profanity(text)
    
    @classmethod
    def censor(cls, text: str) -> str:
        """Censor profanity in text with asterisks."""
        cls.initialize()
        return profanity.censor(text)
    
    @classmethod
    def validate_content(cls, title: str = None, content: str = None) -> dict:
        """
        Validate title and content for profanity.
        Returns: {'is_valid': bool, 'errors': list}
        """
        cls.initialize()
        errors = []
        
        if title and profanity.contains_profanity(title):
            errors.append("Title contains inappropriate language. Please revise.")
        
        if content and profanity.contains_profanity(content):
            errors.append("Content contains inappropriate language. Please revise.")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors
        }


class CommunityXPService:
    """
    Service for awarding XP for community activities.
    """
    
    # XP reward values
    XP_REWARDS = {
        'ask_question': 10,
        'create_poll': 10,
        'create_quiz': 15,
        'answer_question': 15,
        'best_answer': 50,
        'receive_like_post': 2,
        'receive_like_comment': 2,
        'vote_poll': 2,
        'quiz_correct': 5,
    }
    
    @classmethod
    def award_xp(cls, user_profile, action: str, reference_id=None, description: str = None):
        """
        Award XP for a community action.
        """
        xp_amount = cls.XP_REWARDS.get(action, 0)
        if xp_amount == 0:
            return None
        
        with transaction.atomic():
            # Update user's total XP
            user_profile.total_xp = F('total_xp') + xp_amount
            user_profile.save(update_fields=['total_xp'])
            user_profile.refresh_from_db()
            
            # Create XP transaction
            xp_transaction = XPTransaction.objects.create(
                student=user_profile,
                transaction_type='community',
                xp_amount=xp_amount,
                description=description or f"Community: {action.replace('_', ' ').title()}",
                reference_id=reference_id,
                balance_after=user_profile.total_xp
            )
            
            # Update community stats
            cls._update_community_stats(user_profile, action, xp_amount)
            
            return xp_transaction
    
    @classmethod
    def _update_community_stats(cls, user_profile, action: str, xp_amount: int):
        """Update user's community stats."""
        stats, created = CommunityStats.objects.get_or_create(user=user_profile)
        
        stats.total_community_xp = F('total_community_xp') + xp_amount
        
        if action in ['ask_question', 'create_poll', 'create_quiz']:
            stats.posts_count = F('posts_count') + 1
            if action == 'ask_question':
                stats.questions_count = F('questions_count') + 1
            elif action == 'create_poll':
                stats.polls_count = F('polls_count') + 1
            elif action == 'create_quiz':
                stats.quizzes_count = F('quizzes_count') + 1
        elif action == 'answer_question':
            stats.answers_count = F('answers_count') + 1
        elif action == 'best_answer':
            stats.best_answers_count = F('best_answers_count') + 1
        elif action in ['receive_like_post', 'receive_like_comment']:
            stats.likes_received = F('likes_received') + 1
        
        stats.save()


class CommunityLeaderboardService:
    """
    Service for managing community leaderboard.
    """
    
    @classmethod
    def calculate_score(cls, posts: int, answers: int, best_answers: int, likes: int) -> int:
        """Calculate composite score for ranking."""
        return (
            posts * 10 +
            answers * 15 +
            best_answers * 50 +
            likes * 2
        )
    
    @classmethod
    def update_leaderboard(cls, period: str = 'weekly'):
        """
        Update leaderboard for the specified period.
        """
        today = date.today()
        
        if period == 'weekly':
            period_start = today - timedelta(days=today.weekday())
            period_end = period_start + timedelta(days=6)
        elif period == 'monthly':
            period_start = today.replace(day=1)
            next_month = today.replace(day=28) + timedelta(days=4)
            period_end = next_month - timedelta(days=next_month.day)
        else:  # all_time
            period_start = date(2020, 1, 1)
            period_end = today
        
        # Get user stats for the period
        from users.models import StudentProfile
        
        user_scores = []
        
        for profile in StudentProfile.objects.all():
            # Count posts
            posts = Post.objects.filter(
                author=profile,
                created_at__date__gte=period_start,
                created_at__date__lte=period_end
            ).count()
            
            # Count answers (comments on posts)
            answers = Comment.objects.filter(
                author=profile,
                parent__isnull=True,  # Only top-level comments (answers)
                created_at__date__gte=period_start,
                created_at__date__lte=period_end
            ).count()
            
            # Count best answers
            best_answers = Comment.objects.filter(
                author=profile,
                is_best_answer=True,
                created_at__date__gte=period_start,
                created_at__date__lte=period_end
            ).count()
            
            # Count likes received
            likes = Like.objects.filter(
                post__author=profile,
                created_at__date__gte=period_start,
                created_at__date__lte=period_end
            ).count() + Like.objects.filter(
                comment__author=profile,
                created_at__date__gte=period_start,
                created_at__date__lte=period_end
            ).count()
            
            score = cls.calculate_score(posts, answers, best_answers, likes)
            
            if score > 0:
                user_scores.append({
                    'user': profile,
                    'posts_count': posts,
                    'answers_count': answers,
                    'best_answers_count': best_answers,
                    'likes_received': likes,
                    'score': score
                })
        
        # Sort by score and assign ranks
        user_scores.sort(key=lambda x: x['score'], reverse=True)
        
        with transaction.atomic():
            # Delete old entries for this period
            CommunityLeaderboard.objects.filter(
                period=period,
                period_start=period_start
            ).delete()
            
            # Create new entries
            for rank, data in enumerate(user_scores, 1):
                CommunityLeaderboard.objects.create(
                    user=data['user'],
                    period=period,
                    period_start=period_start,
                    period_end=period_end,
                    posts_count=data['posts_count'],
                    answers_count=data['answers_count'],
                    best_answers_count=data['best_answers_count'],
                    likes_received=data['likes_received'],
                    score=data['score'],
                    rank=rank
                )
        
        return len(user_scores)
    
    @classmethod
    def get_leaderboard(cls, period: str = 'weekly', limit: int = 50):
        """Get current leaderboard."""
        today = date.today()
        
        if period == 'weekly':
            period_start = today - timedelta(days=today.weekday())
        elif period == 'monthly':
            period_start = today.replace(day=1)
        else:
            period_start = date(2020, 1, 1)
        
        return CommunityLeaderboard.objects.filter(
            period=period,
            period_start=period_start
        ).select_related('user__user')[:limit]
