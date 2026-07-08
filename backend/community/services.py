"""
Community services - Content moderation, XP rewards, leaderboard.
"""
import re
import unicodedata
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
    Strict, evasion-resistant profanity filter for English + Hinglish.

    The matcher normalises text before checking so common bypass tricks are
    defeated:
      - leetspeak substitution (f4ck, ch00t, @ss, $ex, b1tch ...),
      - separators / spacing between letters (c.h.u.t.i.y.a, m a d a r c h o d),
      - repeated characters (fuuuuck, chuuutiya),
      - accents / unicode look-alikes.

    Two word lists are kept to balance strictness against false positives:
      - ``PREFIX_WORDS``: unambiguous abuse stems (long / clearly offensive).
        These match even with a trailing suffix (chutiya, chutiyapa) but still
        require a word boundary at the start, so embeddings like "parachute"
        (contains "chut") or "grandiose" (contains "randi") are NOT flagged.
      - ``EXACT_WORDS``: short / ambiguous tokens (sala, mc, bc, ass ...) that
        only match as standalone whole words, so "salad", "class", "assignment"
        are safe.
    """

    # Long / unambiguous abusive stems (English + Hindi/Hinglish transliterations
    # and their common spellings). Matched as a prefix at a word boundary.
    PREFIX_WORDS = [
        # English
        'fuck', 'fuk', 'fuc', 'motherfuck', 'fucker', 'shit', 'bullshit',
        'bitch', 'bastard', 'asshole', 'dickhead', 'cunt', 'pussy', 'nigger',
        'nigga', 'faggot', 'retard', 'slut', 'whore', 'wank', 'jerkoff',
        'cocksuck', 'dumbass', 'jackass', 'bollock', 'bugger', 'prick',
        # Hindi / Hinglish
        'madarchod', 'madarchd', 'maderchod', 'behenchod', 'bhenchod',
        'bhosdike', 'bhosdika', 'bhosdiwala', 'bhosdi', 'bhosad', 'bhosda',
        'chutiya', 'chutiye', 'chutiyapa', 'chutmar', 'chodu', 'chod',
        'gandu', 'gaandu', 'gaand', 'gawar', 'harami', 'haramkhor',
        'haramzada', 'haramzade', 'bhadwa', 'bhadve',
        'lawda', 'lawde', 'lauda', 'laude', 'laund', 'lund', 'loda', 'lodu',
        'jhaant', 'jhant', 'tatti', 'tatte', 'bakchod', 'bakchodi',
        'chinaal', 'kutta', 'kutti', 'kaminey', 'kamina', 'kamine',
        'chodna', 'chudai', 'chudwa', 'gaandfat', 'najayaz', 'phuck',
    ]

    # Short / ambiguous tokens — matched only as complete words.
    EXACT_WORDS = [
        'ass', 'sex', 'dick', 'cock', 'damn', 'crap', 'piss', 'tits', 'boob',
        'sala', 'saala', 'chut', 'choot', 'fck', 'bsdk', 'mkc', 'mkb', 'bkl',
        'lvda', 'lawd', 'randi', 'raand',
    ]

    _LEET_MAP = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
        '@': 'a', '$': 's', '+': 't', '(': 'c', '|': 'i', '!': 'i',
    }

    _compiled = None

    @classmethod
    def _normalize(cls, text: str) -> str:
        """Lowercase, strip accents and apply leetspeak substitutions."""
        if not text:
            return ''
        text = unicodedata.normalize('NFKD', str(text))
        text = text.encode('ascii', 'ignore').decode('ascii')
        text = text.lower()
        return ''.join(cls._LEET_MAP.get(ch, ch) for ch in text)

    @classmethod
    def _build_patterns(cls):
        """Compile regexes once. Letters may repeat and be split by separators."""
        if cls._compiled is not None:
            return cls._compiled

        def core(word):
            # Each letter -> letter+ (repeats) joined by optional separators.
            return r'[\W_0-9]*'.join(re.escape(c) + '+' for c in word)

        patterns = []
        for w in cls.PREFIX_WORDS:
            # Word boundary at start, allow a trailing suffix.
            patterns.append(re.compile(r'\b' + core(w) + r'\w*', re.IGNORECASE))
        for w in cls.EXACT_WORDS:
            # Whole word only.
            patterns.append(re.compile(r'\b' + core(w) + r'\b', re.IGNORECASE))
        cls._compiled = patterns
        return patterns

    @classmethod
    def initialize(cls):
        """Initialize the secondary (better_profanity) English filter."""
        profanity.load_censor_words()
        profanity.add_censor_words(cls.PREFIX_WORDS + cls.EXACT_WORDS)

    @classmethod
    def contains_profanity(cls, text: str) -> bool:
        """True if the text contains disallowed language (any layer trips)."""
        if not text:
            return False
        normalized = cls._normalize(text)
        for pattern in cls._build_patterns():
            if pattern.search(normalized):
                return True
        # Secondary English dictionary as a safety net.
        cls.initialize()
        return bool(profanity.contains_profanity(normalized))

    @classmethod
    def is_clean(cls, text: str) -> bool:
        return not cls.contains_profanity(text)

    @classmethod
    def censor(cls, text: str) -> str:
        cls.initialize()
        return profanity.censor(text or '')

    @classmethod
    def validate_content(cls, title: str = None, content: str = None) -> dict:
        """Validate title and content. Returns {'is_valid', 'errors'}."""
        errors = []
        if title and cls.contains_profanity(title):
            errors.append("Title contains inappropriate language. Please revise.")
        if content and cls.contains_profanity(content):
            errors.append("Content contains inappropriate language. Please revise.")
        return {'is_valid': len(errors) == 0, 'errors': errors}

    @classmethod
    def validate_text(cls, *texts, label: str = 'Content') -> dict:
        """Validate an arbitrary set of text fields (poll options, quiz, etc.)."""
        for t in texts:
            if t and cls.contains_profanity(t):
                return {
                    'is_valid': False,
                    'errors': [f"{label} contains inappropriate language. Please revise."],
                }
        return {'is_valid': True, 'errors': []}


class CommunityXPService:
    """
    Service for awarding XP for community activities.
    """
    
    # XP reward values (lean economy)
    XP_REWARDS = {
        'ask_question': 5,
        'create_poll': 5,
        'create_quiz': 8,
        'answer_question': 8,
        'best_answer': 20,
        'receive_like_post': 2,
        'receive_like_comment': 2,
        'vote_poll': 2,
        'quiz_correct': 3,
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
            
            # Update daily activity so leaderboard / weekly XP includes community XP
            from analytics.models import DailyActivity
            today = timezone.now().date()
            DailyActivity.objects.get_or_create(student=user_profile, date=today)
            DailyActivity.objects.filter(
                student=user_profile, date=today
            ).update(xp_earned=F('xp_earned') + xp_amount)
            
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
    def update_leaderboard(cls, period: str = 'weekly', tenant=None):
        """
        Update leaderboard for the specified period using XPTransaction as source of truth.
        Scoped to tenant when provided (only students of that tenant are included).
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
        
        # Base queryset: only students in this tenant
        base_profiles = StudentProfile.objects.all()
        if tenant:
            base_profiles = base_profiles.filter(user__tenant=tenant)
        
        # Get aggregate scores from XP transactions for the period
        profiles_with_activity = base_profiles.annotate(
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
            # Delete old entries for this period (tenant-scoped when tenant given)
            delete_qs = CommunityLeaderboard.objects.filter(
                period=period,
                period_start=period_start
            )
            if tenant:
                delete_qs = delete_qs.filter(user__user__tenant=tenant)
            delete_qs.delete()
            
            # Create new entries
            # Limit to top 100 for storage efficiency per period
            entries_to_create = []
            for rank, profile in enumerate(profiles_with_activity[:100], 1):
                # We still need likes count for display, we'll do quick secondary counts
                # Since we are only doing this for top 100, it's fine
                likes = Like.objects.filter(
                    Q(post__author=profile) | Q(comment__author=profile),
                    is_active=True,
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
    def get_leaderboard(cls, period: str = 'weekly', limit: int = 50, tenant=None):
        """Get current leaderboard, generating if needed or stale. Scoped to tenant when provided."""
        today = date.today()
        
        if period == 'weekly':
            period_start = today - timedelta(days=today.weekday())
        elif period == 'monthly':
            period_start = today.replace(day=1)
        else:
            period_start = date(2020, 1, 1)
        
        base_filter = CommunityLeaderboard.objects.filter(
            period=period,
            period_start=period_start
        )
        if tenant:
            base_filter = base_filter.filter(user__user__tenant=tenant)
        
        # Check if we have recent entries
        staleness_threshold = timezone.now() - timedelta(minutes=5)
        last_entry = base_filter.order_by('-updated_at').first()
        
        if not last_entry or last_entry.updated_at < staleness_threshold:
            cls.update_leaderboard(period, tenant=tenant)
        
        entries = base_filter.select_related('user__user').order_by('rank')[:limit]
        return entries
