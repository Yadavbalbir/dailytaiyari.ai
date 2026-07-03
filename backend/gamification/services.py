"""
Gamification service layer.
"""
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from .models import Badge, StudentBadge, XPTransaction, LeaderboardEntry, Challenge, ChallengeParticipation

# Bonus XP granted each time the student reaches a new level: level N -> N * 20.
LEVEL_UP_BONUS_PER_LEVEL = 20
# Transaction types that update DailyActivity themselves in the view layer (so we skip here to avoid double counting).
_SKIP_DAILY_ACTIVITY_TYPES = ('quiz_complete', 'mock_complete')


class GamificationService:
    """
    Service for gamification operations.
    """

    @staticmethod
    def _bump_daily_activity(student, xp_amount):
        """Add xp_amount to today's DailyActivity.xp_earned with a row lock to avoid lost updates."""
        from django.db.models.functions import Greatest
        from analytics.models import DailyActivity
        today = timezone.now().date()
        with transaction.atomic():
            activity, _ = DailyActivity.objects.get_or_create(student=student, date=today)
            # Clamp at 0 so deductions can't drive period XP negative (field is non-negative).
            DailyActivity.objects.filter(pk=activity.pk).update(
                xp_earned=Greatest(F('xp_earned') + xp_amount, 0)
            )

    @staticmethod
    def award_xp(student, xp_amount, transaction_type, description='', reference_id=None, update_daily_activity=True):
        """
        Award XP to a student and create a transaction record.

        - Locks the profile row for the duration of the update to prevent lost updates
          when multiple XP sources fire concurrently.
        - Clamps total_xp at 0 (the field is non-negative; deductions cannot go below zero).
        - Grants a level-up bonus (level N -> N * 50) and records a separate ``level_up``
          transaction whenever the award pushes the student into one or more new levels.
        - Keeps DailyActivity (period leaderboards) in sync unless the caller handles it.
        """
        from users.models import StudentProfile

        with transaction.atomic():
            # Lock this profile row so concurrent awards serialize instead of clobbering each other.
            locked = StudentProfile.objects.select_for_update().get(pk=student.pk)

            previous_level = locked.current_level
            new_total = max(0, locked.total_xp + xp_amount)
            locked.total_xp = new_total
            new_level = locked.calculate_level()

            # Compute level-up bonus for every level gained in this award.
            level_bonus = 0
            if new_level > previous_level:
                level_bonus = sum(
                    lvl * LEVEL_UP_BONUS_PER_LEVEL
                    for lvl in range(previous_level + 1, new_level + 1)
                )

            if level_bonus:
                locked.total_xp = max(0, locked.total_xp + level_bonus)
                # The bonus itself may unlock further levels; settle the final level.
                new_level = locked.calculate_level()

            locked.current_level = new_level
            locked.save(update_fields=['total_xp', 'current_level'])

            XPTransaction.objects.create(
                student=locked,
                transaction_type=transaction_type,
                xp_amount=xp_amount,
                description=description,
                reference_id=reference_id,
                balance_after=locked.total_xp - level_bonus if level_bonus else locked.total_xp,
            )

            if level_bonus:
                XPTransaction.objects.create(
                    student=locked,
                    transaction_type='level_up',
                    xp_amount=level_bonus,
                    description=f'Reached level {new_level}',
                    reference_id=reference_id,
                    balance_after=locked.total_xp,
                )

        # Keep the caller's in-memory instance consistent with the locked write.
        student.total_xp = locked.total_xp
        student.current_level = locked.current_level

        if update_daily_activity and transaction_type not in _SKIP_DAILY_ACTIVITY_TYPES:
            GamificationService._bump_daily_activity(student, xp_amount)
        # Level-up bonus always counts toward period leaderboards.
        if level_bonus:
            GamificationService._bump_daily_activity(student, level_bonus)

        level_up = new_level > previous_level
        return {'xp_awarded': xp_amount, 'level_up': level_up, 'new_level': new_level, 'level_bonus': level_bonus}
    
    @staticmethod
    def check_and_award_badges(student, context=None):
        """
        Check if student qualifies for any badges and award them.
        
        Args:
            student: StudentProfile instance
            context: Optional dict with context about the current action, e.g.:
                - 'perfect_quiz': True if quiz was completed with 100% accuracy
                - 'speed_quiz': True if quiz was completed in less than half time
                - 'early_study': True if studying before 6 AM
                - 'night_study': True if studying after 10 PM
                - 'weekend_study': True if studying on weekend
        """
        from analytics.models import Streak, TopicMastery
        from quiz.models import QuizAttempt, MockTestAttempt
        
        context = context or {}
        awarded_badges = []
        
        # Get existing badges
        existing_badges = set(StudentBadge.objects.filter(
            student=student
        ).values_list('badge_id', flat=True))
        
        # Get available badges
        badges = Badge.objects.filter(is_active=True).exclude(id__in=existing_badges)
        
        for badge in badges:
            requirements = badge.requirements
            qualified = False  # Default to False, must explicitly qualify
            
            # Only one requirement type per badge, check which one it is
            
            # Streak-based badges
            if 'streak_days' in requirements:
                streak = Streak.objects.filter(student=student).first()
                if streak and streak.current_streak >= requirements['streak_days']:
                    qualified = True
            
            # Quiz count badges
            elif 'quizzes_completed' in requirements:
                quiz_count = QuizAttempt.objects.filter(
                    student=student, status='completed'
                ).count()
                if quiz_count >= requirements['quizzes_completed']:
                    qualified = True
            
            # Accuracy-based badges
            elif 'min_accuracy' in requirements:
                if student.overall_accuracy >= requirements['min_accuracy']:
                    qualified = True
            
            # XP-based badges
            elif 'total_xp' in requirements:
                if student.total_xp >= requirements['total_xp']:
                    qualified = True
            
            # Topic mastery badges
            elif 'topics_mastered' in requirements:
                mastered_count = TopicMastery.objects.filter(
                    student=student, mastery_level__gte=4
                ).count()
                if mastered_count >= requirements['topics_mastered']:
                    qualified = True
            
            # Questions answered badges
            elif 'questions_answered' in requirements:
                if student.total_questions_attempted >= requirements['questions_answered']:
                    qualified = True
            
            # Perfect quiz badge - requires context
            elif 'perfect_quiz' in requirements:
                if context.get('perfect_quiz', False):
                    perfect_count = QuizAttempt.objects.filter(
                        student=student, status='completed', percentage=100
                    ).count()
                    if perfect_count >= requirements['perfect_quiz']:
                        qualified = True
            
            # Speed quiz badge - requires context
            elif 'speed_quiz' in requirements:
                if context.get('speed_quiz', False):
                    qualified = True
            
            # Mock test badges
            elif 'mock_tests_completed' in requirements:
                mock_count = MockTestAttempt.objects.filter(
                    student=student, status='completed'
                ).count()
                if mock_count >= requirements['mock_tests_completed']:
                    qualified = True
            
            # Time-based badges - require context
            elif 'early_study' in requirements:
                if context.get('early_study', False):
                    qualified = True
            
            elif 'night_study' in requirements:
                if context.get('night_study', False):
                    qualified = True
            
            elif 'weekend_study' in requirements:
                if context.get('weekend_study', False):
                    qualified = True
            
            # Comeback badge - requires context
            elif 'comeback' in requirements:
                if context.get('comeback', False):
                    qualified = True
            
            # Top 10 badge - check leaderboard rank (tenant-scoped)
            elif 'top_10' in requirements:
                tenant = getattr(student.user, 'tenant', None)
                if tenant:
                    rank_result = GamificationService.get_student_rank(student, 'daily', None, tenant=tenant)
                    rank = rank_result.get('rank') if isinstance(rank_result, dict) else rank_result
                    if rank is not None and rank <= 10:
                        qualified = True
            
            # Subject mastery badges - check specific subject (honor the configured threshold)
            elif 'physics_mastery' in requirements:
                physics_mastery = TopicMastery.objects.filter(
                    student=student,
                    topic__subject__name__icontains='physics',
                    mastery_level__gte=4
                ).count()
                if physics_mastery >= requirements['physics_mastery']:
                    qualified = True
            
            elif 'chemistry_mastery' in requirements:
                chemistry_mastery = TopicMastery.objects.filter(
                    student=student,
                    topic__subject__name__icontains='chemistry',
                    mastery_level__gte=4
                ).count()
                if chemistry_mastery >= requirements['chemistry_mastery']:
                    qualified = True
            
            elif 'biology_mastery' in requirements:
                biology_mastery = TopicMastery.objects.filter(
                    student=student,
                    topic__subject__name__icontains='biology',
                    mastery_level__gte=4
                ).count()
                if biology_mastery >= requirements['biology_mastery']:
                    qualified = True
            
            # If no recognized requirement, don't qualify
            # This prevents unknown badges from being awarded
            
            if qualified:
                awarded_badges.append(badge)
        
        for badge in awarded_badges:
            StudentBadge.objects.create(student=student, badge=badge)

        # Award the configured XP reward for all newly earned badges in a single transaction.
        total_badge_xp = sum(badge.xp_reward for badge in awarded_badges)
        if total_badge_xp:
            names = ', '.join(badge.name for badge in awarded_badges)
            GamificationService.award_xp(
                student,
                total_badge_xp,
                'badge_earned',
                f'Earned badge(s): {names}'[:200],
            )
        return awarded_badges
    
    @staticmethod
    def update_leaderboard(period='daily', course=None, tenant=None):
        """
        Update leaderboard for a specific period. Scoped to tenant when provided.
        """
        from analytics.models import DailyActivity
        
        today = timezone.now().date()
        
        if period == 'daily':
            start_date = today
            end_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'monthly':
            start_date = today.replace(day=1)
            # Get last day of month
            next_month = start_date.replace(month=start_date.month % 12 + 1, day=1)
            end_date = next_month - timedelta(days=1)
        else:  # all_time
            start_date = None
            end_date = None
        
        # Aggregate student stats (tenant-scoped: only students belonging to this tenant)
        from users.models import StudentProfile
        
        query = StudentProfile.objects.all()
        if tenant:
            query = query.filter(user__tenant=tenant)
        if course:
            query = query.filter(enrollments__course=course)
        
        # Get stats for the period
        student_stats = []
        
        for student in query:
            activities = DailyActivity.objects.filter(student=student)
            if start_date:
                activities = activities.filter(date__gte=start_date, date__lte=end_date)
            
            stats = activities.aggregate(
                total_xp=Sum('xp_earned'),
                total_questions=Sum('questions_attempted'),
                total_correct=Sum('questions_correct'),
                total_time=Sum('study_time_minutes')
            )
            
            xp = stats['total_xp'] or 0
            questions = stats['total_questions'] or 0
            correct = stats['total_correct'] or 0
            accuracy = (correct / questions * 100) if questions > 0 else 0
            
            student_stats.append({
                'student': student,
                'xp': xp,
                'questions': questions,
                'accuracy': accuracy,
                'time': stats['total_time'] or 0
            })
        
        # Sort by XP (primary) and accuracy (secondary)
        student_stats.sort(key=lambda x: (-x['xp'], -x['accuracy']))
        
        # Create/update leaderboard entries
        for rank, stat in enumerate(student_stats, 1):
            # Get previous rank
            previous_entry = LeaderboardEntry.objects.filter(
                student=stat['student'],
                course=course,
                period=period
            ).order_by('-period_start').first()
            
            previous_rank = previous_entry.rank if previous_entry else None
            rank_change = previous_rank - rank if previous_rank else 0
            
            LeaderboardEntry.objects.update_or_create(
                student=stat['student'],
                course=course,
                period=period,
                period_start=start_date or today.replace(year=2020, month=1, day=1),
                defaults={
                    'period_end': end_date or today,
                    'xp_earned': stat['xp'],
                    'questions_answered': stat['questions'],
                    'accuracy': stat['accuracy'],
                    'study_time_minutes': stat['time'],
                    'rank': rank,
                    'previous_rank': previous_rank,
                    'rank_change': rank_change
                }
            )
        
        return len(student_stats)
    
    @staticmethod
    def get_leaderboard(period='daily', course=None, limit=50, tenant=None):
        """
        Get leaderboard data dynamically from DailyActivity. Scoped to tenant when provided.
        """
        from analytics.models import DailyActivity
        from users.models import StudentProfile
        
        today = timezone.now().date()
        
        if period == 'daily':
            start_date = today
            end_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'monthly':
            start_date = today.replace(day=1)
            next_month = start_date.replace(month=start_date.month % 12 + 1, day=1) if start_date.month < 12 else start_date.replace(year=start_date.year + 1, month=1, day=1)
            end_date = next_month - timedelta(days=1)
        else:  # all_time
            start_date = None
            end_date = None
        
        # Get students with activity (tenant-scoped)
        query = StudentProfile.objects.all()
        if tenant:
            query = query.filter(user__tenant=tenant)
        if course:
            query = query.filter(enrollments__course=course)
        
        # Calculate stats for each student
        leaderboard_data = []
        
        for student in query:
            activities = DailyActivity.objects.filter(student=student)
            if start_date:
                activities = activities.filter(date__gte=start_date, date__lte=end_date)
            
            stats = activities.aggregate(
                total_xp=Sum('xp_earned'),
                total_questions=Sum('questions_attempted'),
                total_correct=Sum('questions_correct'),
                total_time=Sum('study_time_minutes')
            )
            
            xp = stats['total_xp'] or 0
            questions = stats['total_questions'] or 0
            correct = stats['total_correct'] or 0
            
            # Only include students with some activity
            if xp > 0 or questions > 0:
                accuracy = (correct / questions * 100) if questions > 0 else 0
                leaderboard_data.append({
                    'id': str(student.id),
                    'student': student,
                    'student_name': student.user.full_name,
                    'role': student.user.role,
                    'student_level': student.current_level,
                    'xp_earned': xp,
                    'questions_answered': questions,
                    'accuracy': round(accuracy, 1),
                    'study_time_minutes': stats['total_time'] or 0,
                })
        
        # Sort by XP (primary) and accuracy (secondary)
        leaderboard_data.sort(key=lambda x: (-x['xp_earned'], -x['accuracy']))
        
        # Add ranks and remove non-serializable fields
        result = []
        for i, entry in enumerate(leaderboard_data[:limit]):
            entry['rank'] = i + 1
            entry['rank_change'] = 0  # TODO: Calculate from previous period
            # Remove non-serializable student object
            entry_copy = {k: v for k, v in entry.items() if k != 'student'}
            result.append(entry_copy)
        
        return result
    
    @staticmethod
    def get_student_rank(student, period='daily', course=None, tenant=None):
        """
        Get student's rank in leaderboard dynamically. Scoped to tenant when provided.
        """
        from analytics.models import DailyActivity
        from users.models import StudentProfile
        
        today = timezone.now().date()
        
        if period == 'daily':
            start_date = today
            end_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'monthly':
            start_date = today.replace(day=1)
            next_month = start_date.replace(month=start_date.month % 12 + 1, day=1) if start_date.month < 12 else start_date.replace(year=start_date.year + 1, month=1, day=1)
            end_date = next_month - timedelta(days=1)
        else:  # all_time
            start_date = None
            end_date = None
        
        # Get students for ranking (tenant-scoped)
        query = StudentProfile.objects.all()
        if tenant:
            query = query.filter(user__tenant=tenant)
        if course:
            query = query.filter(enrollments__course=course)
        
        student_scores = []
        for s in query:
            activities = DailyActivity.objects.filter(student=s)
            if start_date:
                activities = activities.filter(date__gte=start_date, date__lte=end_date)
            
            stats = activities.aggregate(total_xp=Sum('xp_earned'))
            xp = stats['total_xp'] or 0
            student_scores.append({'student_id': s.id, 'xp': xp})
        
        # Sort by XP descending
        student_scores.sort(key=lambda x: -x['xp'])
        
        # Find current student's rank
        for rank, score in enumerate(student_scores, 1):
            if score['student_id'] == student.id:
                return {
                    'rank': rank,
                    'xp': score['xp'],
                    'rank_change': 0  # TODO: Calculate from previous period
                }
        
        return None

