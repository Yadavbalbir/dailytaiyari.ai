"""
Community services - Content moderation, XP rewards, leaderboard.
"""
from datetime import date, timedelta
from django.db import transaction
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
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
        Update leaderboard for the specified period using XPTransaction as source of truth.
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
        
        from users.models import StudentProfile
        from gamification.models import XPTransaction
        
        # Get aggregate scores from XP transactions for the period
        # We also need to get the counts for posts, answers, etc. for display
        
        # Use a single query with annotations to get all data
        # Note: We filter profiles that have ANY community activity in this period
        profiles_with_activity = StudentProfile.objects.annotate(
            period_xp=Sum(
                'xp_transactions__xp_amount',
                filter=Q(
                    xp_transactions__transaction_type='community',
                    xp_transactions__created_at__date__gte=period_start,
                    xp_transactions__created_at__date__lte=period_end
                )
            ),
            p_count=Count(
                'community_posts',
                filter=Q(
                    community_posts__created_at__date__gte=period_start,
                    community_posts__created_at__date__lte=period_end,
                    community_posts__status='active'
                ),
                distinct=True
            ),
            a_count=Count(
                'community_comments',
                filter=Q(
                    community_comments__created_at__date__gte=period_start,
                    community_comments__created_at__date__lte=period_end,
                    community_comments__parent__isnull=True
                ),
                distinct=True
            ),
            ba_count=Count(
                'community_comments',
                filter=Q(
                    community_comments__created_at__date__gte=period_start,
                    community_comments__created_at__date__lte=period_end,
                    community_comments__is_best_answer=True
                ),
                distinct=True
            ),
            # Likes received is harder to count direct via relationships in one go without complexity
            # But we can approximate or just use the XP score as primary
        ).filter(period_xp__gt=0).order_by('-period_xp')
        
        with transaction.atomic():
            # Delete old entries for this period
            CommunityLeaderboard.objects.filter(
                period=period,
                period_start=period_start
            ).delete()
            
            # Create new entries
            # Limit to top 100 for storage efficiency per period
            entries_to_create = []
            for rank, profile in enumerate(profiles_with_activity[:100], 1):
                # We still need likes count for display, we'll do quick secondary counts
                # Since we are only doing this for top 100, it's fine
                likes = Like.objects.filter(
                    Q(post__author=profile) | Q(comment__author=profile),
                    created_at__date__gte=period_start,
                    created_at__date__lte=period_end
                ).count()
                
                entries_to_create.append(CommunityLeaderboard(
                    user=profile,
                    period=period,
                    period_start=period_start,
                    period_end=period_end,
                    posts_count=profile.p_count,
                    answers_count=profile.a_count,
                    best_answers_count=profile.ba_count,
                    likes_received=likes,
                    community_xp=profile.period_xp,
                    score=profile.period_xp, # Use XP as the score directly
                    rank=rank
                ))
            
            CommunityLeaderboard.objects.bulk_create(entries_to_create)
            
        return len(entries_to_create)
    
    @classmethod
    def get_leaderboard(cls, period: str = 'weekly', limit: int = 50):
        """Get current leaderboard, generating if needed or stale."""
        today = date.today()
        
        if period == 'weekly':
            period_start = today - timedelta(days=today.weekday())
        elif period == 'monthly':
            period_start = today.replace(day=1)
        else:
            period_start = date(2020, 1, 1)
        
        # Check if we have recent entries
        # If any entry is older than 5 minutes, refresh the whole leaderboard for this period
        staleness_threshold = timezone.now() - timedelta(minutes=5)
        
        last_entry = CommunityLeaderboard.objects.filter(
            period=period,
            period_start=period_start
        ).order_by('-updated_at').first()
        
        if not last_entry or last_entry.updated_at < staleness_threshold:
            cls.update_leaderboard(period)
        
        entries = CommunityLeaderboard.objects.filter(
            period=period,
            period_start=period_start
        ).select_related('user__user').order_by('rank')[:limit]
        
        return entries
