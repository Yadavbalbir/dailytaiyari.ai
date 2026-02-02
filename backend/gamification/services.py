"""
Gamification service layer.
"""
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from .models import Badge, StudentBadge, XPTransaction, LeaderboardEntry, Challenge, ChallengeParticipation


class GamificationService:
    """
    Service for gamification operations.
    """
    
    @staticmethod
    def award_xp(student, xp_amount, transaction_type, description='', reference_id=None, update_daily_activity=True):
        """
        Award XP to a student and create transaction record.
        Also updates daily activity to keep leaderboard in sync.
        """
        from analytics.models import DailyActivity
        
        student.total_xp += xp_amount
        new_level = student.calculate_level()
        
        level_up = new_level > student.current_level
        level_bonus = 0
        if level_up:
            student.current_level = new_level
            # Award level up bonus
            level_bonus = new_level * 50
            student.total_xp += level_bonus
        
        student.save()
        
        # Create transaction
        XPTransaction.objects.create(
            student=student,
            transaction_type=transaction_type,
            xp_amount=xp_amount,
            description=description,
            reference_id=reference_id,
            balance_after=student.total_xp
        )
        
        if level_up:
            XPTransaction.objects.create(
                student=student,
                transaction_type='level_up',
                xp_amount=level_bonus,
                description=f'Level {new_level} reached!',
                balance_after=student.total_xp
            )
        
        # Update daily activity with XP (for leaderboard sync)
        # Skip for quiz_complete since that's already tracked by the quiz submission
        if update_daily_activity and transaction_type not in ['quiz_complete', 'mock_test']:
            today = timezone.now().date()
            activity, _ = DailyActivity.objects.get_or_create(
                student=student,
                date=today
            )
            activity.xp_earned += xp_amount + level_bonus
            activity.save(update_fields=['xp_earned'])
        
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
            
            # Top 10 badge - check leaderboard rank
            elif 'top_10' in requirements:
                entry = LeaderboardEntry.objects.filter(
                    student=student, rank__lte=10
                ).first()
                if entry:
                    qualified = True
            
            # Subject mastery badges - check specific subject
            elif 'physics_mastery' in requirements:
                physics_mastery = TopicMastery.objects.filter(
                    student=student,
                    topic__subject__name__icontains='physics',
                    mastery_level__gte=4
                ).count()
                # Require at least 5 topics mastered in physics
                if physics_mastery >= 5:
                    qualified = True
            
            elif 'chemistry_mastery' in requirements:
                chemistry_mastery = TopicMastery.objects.filter(
                    student=student,
                    topic__subject__name__icontains='chemistry',
                    mastery_level__gte=4
                ).count()
                if chemistry_mastery >= 5:
                    qualified = True
            
            elif 'biology_mastery' in requirements:
                biology_mastery = TopicMastery.objects.filter(
                    student=student,
                    topic__subject__name__icontains='biology',
                    mastery_level__gte=4
                ).count()
                if biology_mastery >= 5:
                    qualified = True
            
            # If no recognized requirement, don't qualify
            # This prevents unknown badges from being awarded
            
            if qualified:
                StudentBadge.objects.create(
                    student=student,
                    badge=badge
                )
                awarded_badges.append(badge)
                
                # Award badge XP
                if badge.xp_reward > 0:
                    GamificationService.award_xp(
                        student,
                        badge.xp_reward,
                        'badge_earned',
                        f'Earned badge: {badge.name}',
                        badge.id
                    )
        
        return awarded_badges
    
    @staticmethod
    def update_leaderboard(period='daily', exam=None):
        """
        Update leaderboard for a specific period.
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
        
        # Aggregate student stats
        from users.models import StudentProfile
        
        query = StudentProfile.objects.all()
        
        if exam:
            query = query.filter(enrollments__exam=exam)
        
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
                exam=exam,
                period=period
            ).order_by('-period_start').first()
            
            previous_rank = previous_entry.rank if previous_entry else None
            rank_change = previous_rank - rank if previous_rank else 0
            
            LeaderboardEntry.objects.update_or_create(
                student=stat['student'],
                exam=exam,
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
    def get_leaderboard(period='daily', exam=None, limit=50):
        """
        Get leaderboard data dynamically from DailyActivity.
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
        
        # Get all students with activity
        query = StudentProfile.objects.all()
        if exam:
            query = query.filter(enrollments__exam=exam)
        
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
    def get_student_rank(student, period='daily', exam=None):
        """
        Get student's rank in leaderboard dynamically.
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
        
        # Get all students with their XP for ranking
        query = StudentProfile.objects.all()
        if exam:
            query = query.filter(enrollments__exam=exam)
        
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

