"""
Views for Analytics app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta

from .models import TopicMastery, SubjectPerformance, DailyActivity, Streak, WeeklyReport
from .serializers import (
    TopicMasterySerializer, SubjectPerformanceSerializer,
    DailyActivitySerializer, StreakSerializer, WeeklyReportSerializer,
    DashboardStatsSerializer, PerformanceChartSerializer
)
from .services import AnalyticsService


class DashboardView(APIView):
    """
    Get comprehensive dashboard statistics.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = request.user.profile
        exam_id = request.query_params.get('exam_id')
        
        stats = AnalyticsService.get_dashboard_stats(student, exam_id)
        serializer = DashboardStatsSerializer(stats)
        
        return Response(serializer.data)


class TopicMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for topic mastery data.
    """
    serializer_class = TopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TopicMastery.objects.filter(
            student=self.request.user.profile
        ).select_related('topic', 'topic__subject')

    @action(detail=False, methods=['get'])
    def weak_topics(self, request):
        """Get topics that need revision."""
        topics = self.get_queryset().filter(
            mastery_level__lte=2
        ).order_by('mastery_level', '-last_attempted')[:10]
        
        return Response(TopicMasterySerializer(topics, many=True).data)

    @action(detail=False, methods=['get'])
    def strong_topics(self, request):
        """Get mastered topics."""
        topics = self.get_queryset().filter(
            mastery_level__gte=4
        ).order_by('-mastery_level', '-mastery_score')[:10]
        
        return Response(TopicMasterySerializer(topics, many=True).data)

    @action(detail=False, methods=['get'])
    def by_subject(self, request):
        """Get topic mastery grouped by subject."""
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response(
                {'error': 'subject_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        topics = self.get_queryset().filter(
            topic__subject_id=subject_id
        ).order_by('topic__order')
        
        return Response(TopicMasterySerializer(topics, many=True).data)


class SubjectPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subject performance data.
    """
    serializer_class = SubjectPerformanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubjectPerformance.objects.filter(
            student=self.request.user.profile
        ).select_related('subject', 'exam')

    @action(detail=False, methods=['get'])
    def by_exam(self, request):
        """Get performance for all subjects in an exam."""
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response(
                {'error': 'exam_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        performances = self.get_queryset().filter(exam_id=exam_id)
        return Response(SubjectPerformanceSerializer(performances, many=True).data)


class DailyActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for daily activity data.
    """
    serializer_class = DailyActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyActivity.objects.filter(
            student=self.request.user.profile
        ).order_by('-date')

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's activity."""
        today = timezone.now().date()
        activity = self.get_queryset().filter(date=today).first()
        
        if not activity:
            return Response({
                'date': str(today),
                'study_time_minutes': 0,
                'questions_attempted': 0,
                'questions_correct': 0,
                'accuracy': 0,
                'daily_goal_met': False
            })
        
        return Response(DailyActivitySerializer(activity).data)

    @action(detail=False, methods=['get'])
    def weekly(self, request):
        """Get last 7 days activity."""
        week_ago = timezone.now().date() - timedelta(days=7)
        activities = self.get_queryset().filter(date__gte=week_ago)
        
        return Response(DailyActivitySerializer(activities, many=True).data)

    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """Get data for performance charts."""
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now().date() - timedelta(days=days)
        
        activities = self.get_queryset().filter(
            date__gte=start_date
        ).order_by('date')
        
        labels = []
        accuracy = []
        questions = []
        study_time = []
        
        for activity in activities:
            labels.append(activity.date.strftime('%b %d'))
            accuracy.append(
                round(activity.questions_correct / activity.questions_attempted * 100, 2)
                if activity.questions_attempted > 0 else 0
            )
            questions.append(activity.questions_attempted)
            study_time.append(activity.study_time_minutes)
        
        return Response({
            'labels': labels,
            'accuracy': accuracy,
            'questions': questions,
            'study_time': study_time
        })


class StreakViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for streak data.
    """
    serializer_class = StreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Streak.objects.filter(
            student=self.request.user.profile
        ).select_related('exam')

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current active streak."""
        exam_id = request.query_params.get('exam_id')
        streak = self.get_queryset().filter(exam_id=exam_id).first()
        
        if not streak:
            return Response({
                'current_streak': 0,
                'longest_streak': 0,
                'total_active_days': 0
            })
        
        return Response(StreakSerializer(streak).data)


class WeeklyReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for weekly reports.
    """
    serializer_class = WeeklyReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WeeklyReport.objects.filter(
            student=self.request.user.profile
        ).order_by('-week_start')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest weekly report."""
        report = self.get_queryset().first()
        
        if not report:
            # Generate report
            report = AnalyticsService.generate_weekly_report(request.user.profile)
        
        return Response(WeeklyReportSerializer(report).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new weekly report."""
        report = AnalyticsService.generate_weekly_report(request.user.profile)
        return Response(WeeklyReportSerializer(report).data)

