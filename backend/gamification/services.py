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
    def award_xp(student, xp_amount, transaction_type, description='', reference_id=None):
        """
        Award XP to a student and create transaction record.
        """
        student.total_xp += xp_amount
        new_level = student.calculate_level()
        
        level_up = new_level > student.current_level
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
        
        return {'xp_awarded': xp_amount, 'level_up': level_up, 'new_level': new_level}
    
    @staticmethod
    def check_and_award_badges(student):
        """
        Check if student qualifies for any badges and award them.
        """
        from analytics.models import Streak, TopicMastery
        
        awarded_badges = []
        
        # Get existing badges
        existing_badges = set(StudentBadge.objects.filter(
            student=student
        ).values_list('badge_id', flat=True))
        
        # Get available badges
        badges = Badge.objects.filter(is_active=True).exclude(id__in=existing_badges)
        
        for badge in badges:
            requirements = badge.requirements
            qualified = True
            
            # Check streak requirements
            if 'streak_days' in requirements:
                streak = Streak.objects.filter(student=student).first()
                if not streak or streak.current_streak < requirements['streak_days']:
                    qualified = False
            
            # Check quiz count requirements
            if 'quizzes_completed' in requirements:
                from quiz.models import QuizAttempt
                quiz_count = QuizAttempt.objects.filter(
                    student=student, status='completed'
                ).count()
                if quiz_count < requirements['quizzes_completed']:
                    qualified = False
            
            # Check accuracy requirements
            if 'min_accuracy' in requirements:
                if student.overall_accuracy < requirements['min_accuracy']:
                    qualified = False
            
            # Check XP requirements
            if 'total_xp' in requirements:
                if student.total_xp < requirements['total_xp']:
                    qualified = False
            
            # Check topic mastery requirements
            if 'topics_mastered' in requirements:
                mastered_count = TopicMastery.objects.filter(
                    student=student, mastery_level__gte=4
                ).count()
                if mastered_count < requirements['topics_mastered']:
                    qualified = False
            
            # Check questions answered
            if 'questions_answered' in requirements:
                if student.total_questions_attempted < requirements['questions_answered']:
                    qualified = False
            
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
        Get leaderboard data.
        """
        today = timezone.now().date()
        
        if period == 'daily':
            start_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
        elif period == 'monthly':
            start_date = today.replace(day=1)
        else:
            start_date = today.replace(year=2020, month=1, day=1)
        
        entries = LeaderboardEntry.objects.filter(
            period=period,
            exam=exam,
            period_start=start_date
        ).select_related('student__user').order_by('rank')[:limit]
        
        return entries
    
    @staticmethod
    def get_student_rank(student, period='daily', exam=None):
        """
        Get student's rank in leaderboard.
        """
        today = timezone.now().date()
        
        if period == 'daily':
            start_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
        elif period == 'monthly':
            start_date = today.replace(day=1)
        else:
            start_date = today.replace(year=2020, month=1, day=1)
        
        entry = LeaderboardEntry.objects.filter(
            student=student,
            period=period,
            exam=exam,
            period_start=start_date
        ).first()
        
        if entry:
            return {
                'rank': entry.rank,
                'xp': entry.xp_earned,
                'rank_change': entry.rank_change
            }
        
        return None

