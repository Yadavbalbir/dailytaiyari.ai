"""
Analytics service layer for complex calculations.
"""
from django.db.models import Sum, Avg, Count, F, Q
from django.utils import timezone
from datetime import timedelta
from .models import TopicMastery, SubjectPerformance, DailyActivity, Streak, WeeklyReport


class AnalyticsService:
    """
    Service class for analytics calculations and updates.
    """
    
    @staticmethod
    def update_topic_mastery_from_attempt(quiz_attempt):
        """
        Update topic mastery after a quiz attempt.
        """
        from quiz.models import Answer
        
        student = quiz_attempt.student
        answers = quiz_attempt.answers.select_related('question__topic')
        
        # Group answers by topic
        topic_stats = {}
        for answer in answers:
            topic = answer.question.topic
            if topic.id not in topic_stats:
                topic_stats[topic.id] = {'correct': 0, 'total': 0, 'time': 0}
            
            topic_stats[topic.id]['total'] += 1
            if answer.is_correct:
                topic_stats[topic.id]['correct'] += 1
            topic_stats[topic.id]['time'] += answer.time_taken_seconds
        
        # Update mastery for each topic
        for topic_id, stats in topic_stats.items():
            mastery, created = TopicMastery.objects.get_or_create(
                student=student,
                topic_id=topic_id
            )
            avg_time = stats['time'] // stats['total'] if stats['total'] > 0 else 0
            mastery.update_mastery(stats['correct'], stats['total'], avg_time)
    
    @staticmethod
    def update_mock_test_analytics(mock_attempt):
        """
        Update analytics after mock test completion.
        """
        student = mock_attempt.student
        
        # Update topic mastery
        AnalyticsService.update_topic_mastery_from_attempt(mock_attempt)
        
        # Update subject performance
        from quiz.models import Answer
        answers = mock_attempt.answers.select_related('question__subject')
        
        subject_stats = {}
        for answer in answers:
            subject = answer.question.subject
            if subject.id not in subject_stats:
                subject_stats[subject.id] = {'correct': 0, 'total': 0}
            
            subject_stats[subject.id]['total'] += 1
            if answer.is_correct:
                subject_stats[subject.id]['correct'] += 1
        
        for subject_id, stats in subject_stats.items():
            perf, created = SubjectPerformance.objects.get_or_create(
                student=student,
                subject_id=subject_id,
                exam=mock_attempt.mock_test.exam
            )
            perf.total_questions += stats['total']
            perf.correct_answers += stats['correct']
            if perf.total_questions > 0:
                perf.accuracy = (perf.correct_answers / perf.total_questions) * 100
            perf.save()
    
    @staticmethod
    def update_daily_activity(student, **kwargs):
        """
        Update daily activity record.
        """
        today = timezone.now().date()
        activity, created = DailyActivity.objects.get_or_create(
            student=student,
            date=today
        )
        
        for field, value in kwargs.items():
            if hasattr(activity, field):
                current_value = getattr(activity, field)
                if isinstance(current_value, int):
                    setattr(activity, field, current_value + value)
                else:
                    setattr(activity, field, value)
        
        # Check if daily goal met
        if activity.study_time_minutes >= student.daily_study_goal_minutes:
            activity.daily_goal_met = True
        
        activity.save()
        
        # Update streak
        AnalyticsService.update_streak(student, today)
        
        return activity
    
    @staticmethod
    def update_streak(student, activity_date, exam=None):
        """
        Update study streak.
        """
        streak, created = Streak.objects.get_or_create(
            student=student,
            exam=exam
        )
        streak.update_streak(activity_date)
        return streak
    
    @staticmethod
    def get_dashboard_stats(student, exam=None):
        """
        Get comprehensive dashboard statistics.
        """
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        # Get streak
        streak = Streak.objects.filter(student=student, exam=exam).first()
        current_streak = streak.current_streak if streak else 0
        
        # Today's activity
        today_activity = DailyActivity.objects.filter(
            student=student,
            date=today
        ).first()
        
        # Weekly stats
        weekly_activities = DailyActivity.objects.filter(
            student=student,
            date__gte=week_ago
        ).aggregate(
            total_time=Sum('study_time_minutes'),
            total_questions=Sum('questions_attempted'),
            total_correct=Sum('questions_correct'),
            total_xp=Sum('xp_earned'),
            days_active=Count('id')
        )
        
        # Topic mastery summary
        mastery_summary = TopicMastery.objects.filter(student=student).aggregate(
            total_topics=Count('id'),
            mastered_topics=Count('id', filter=Q(mastery_level__gte=4)),
            weak_topics=Count('id', filter=Q(mastery_level__lte=2)),
            level_1=Count('id', filter=Q(mastery_level=1)),
            level_2=Count('id', filter=Q(mastery_level=2)),
            level_3=Count('id', filter=Q(mastery_level=3)),
            level_4=Count('id', filter=Q(mastery_level=4)),
            level_5=Count('id', filter=Q(mastery_level=5)),
        )
        
        # Get weak topics for revision
        weak_topics = TopicMastery.objects.filter(
            student=student,
            mastery_level__lte=2
        ).select_related('topic').order_by('mastery_level')[:5]
        
        return {
            'current_streak': current_streak,
            'longest_streak': streak.longest_streak if streak else 0,
            'today': {
                'study_time': today_activity.study_time_minutes if today_activity else 0,
                'questions': today_activity.questions_attempted if today_activity else 0,
                'accuracy': (today_activity.questions_correct / today_activity.questions_attempted * 100) 
                           if today_activity and today_activity.questions_attempted > 0 else 0,
                'goal_progress': min(100, (today_activity.study_time_minutes / student.daily_study_goal_minutes * 100))
                               if today_activity else 0,
                'goal_met': today_activity.daily_goal_met if today_activity else False
            },
            'weekly': {
                'study_time': weekly_activities['total_time'] or 0,
                'questions': weekly_activities['total_questions'] or 0,
                'accuracy': (weekly_activities['total_correct'] / weekly_activities['total_questions'] * 100)
                           if weekly_activities['total_questions'] else 0,
                'xp_earned': weekly_activities['total_xp'] or 0,
                'days_active': weekly_activities['days_active'] or 0
            },
            'mastery': {
                'total_topics': mastery_summary['total_topics'] or 0,
                'mastered': mastery_summary['mastered_topics'] or 0,
                'weak': mastery_summary['weak_topics'] or 0,
                'distribution': {
                    'beginner': mastery_summary['level_1'] or 0,
                    'developing': mastery_summary['level_2'] or 0,
                    'proficient': mastery_summary['level_3'] or 0,
                    'expert': mastery_summary['level_4'] or 0,
                    'master': mastery_summary['level_5'] or 0,
                },
                'weak_topics': [
                    {'id': str(tm.topic.id), 'name': tm.topic.name, 'level': tm.mastery_level}
                    for tm in weak_topics
                ]
            },
            'profile': {
                'total_xp': student.total_xp,
                'level': student.current_level,
                'xp_for_next_level': student.xp_for_next_level,
                'overall_accuracy': student.overall_accuracy,
                'total_questions': student.total_questions_attempted,
                'total_correct': student.total_correct_answers,
                'total_study_time': student.total_study_time_minutes
            }
        }
    
    @staticmethod
    def generate_weekly_report(student):
        """
        Generate weekly performance report.
        """
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Check if report already exists
        existing = WeeklyReport.objects.filter(
            student=student,
            week_start=week_start
        ).first()
        
        if existing:
            return existing
        
        # Get daily activities for the week
        activities = DailyActivity.objects.filter(
            student=student,
            date__gte=week_start,
            date__lte=week_end
        )
        
        # Aggregate stats
        stats = activities.aggregate(
            total_time=Sum('study_time_minutes'),
            questions=Sum('questions_attempted'),
            correct=Sum('questions_correct'),
            xp=Sum('xp_earned'),
            days=Count('id'),
            goals=Count('id', filter=Q(daily_goal_met=True))
        )
        
        # Get weak topics
        weak = TopicMastery.objects.filter(
            student=student,
            mastery_level__lte=2
        ).values_list('topic_id', flat=True)[:10]
        
        # Create report
        report = WeeklyReport.objects.create(
            student=student,
            week_start=week_start,
            week_end=week_end,
            total_study_minutes=stats['total_time'] or 0,
            questions_attempted=stats['questions'] or 0,
            questions_correct=stats['correct'] or 0,
            accuracy=(stats['correct'] / stats['questions'] * 100) if stats['questions'] else 0,
            days_active=stats['days'] or 0,
            goals_met=stats['goals'] or 0,
            xp_earned=stats['xp'] or 0,
            weak_topics=list(map(str, weak))
        )
        
        return report

