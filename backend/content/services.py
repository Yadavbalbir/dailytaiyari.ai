"""
Service layer for content-related business logic.
"""
from django.db.models import Q
from .models import Content, StudyPlanItem


class StudyPlanService:
    """
    Service for generating and managing study plans.
    Rule-based recommendation engine.
    """
    
    @staticmethod
    def generate_daily_items(study_plan, include_revision=True, focus_weak_topics=True):
        """
        Generate study plan items for a day.
        Uses rule-based logic to create a balanced study plan.
        """
        from analytics.models import TopicMastery
        from exams.models import Topic
        
        student = study_plan.student
        exam = study_plan.exam
        target_minutes = study_plan.target_study_minutes
        
        items_created = []
        total_minutes = 0
        
        # 1. Get weak topics (for revision)
        weak_topic_ids = []
        if focus_weak_topics:
            weak_topics = TopicMastery.objects.filter(
                student=student,
                topic__exams=exam,
                mastery_level__lte=2
            ).order_by('mastery_level', '-last_attempted')[:3]
            weak_topic_ids = [tm.topic_id for tm in weak_topics]
        
        # 2. Add revision items for weak topics
        if include_revision and weak_topic_ids:
            for topic_id in weak_topic_ids[:2]:  # Max 2 revision items
                try:
                    topic = Topic.objects.get(id=topic_id)
                    content = Content.objects.filter(
                        topic=topic,
                        status='published',
                        content_type='revision'
                    ).first()
                    
                    if content:
                        item = StudyPlanItem.objects.create(
                            study_plan=study_plan,
                            item_type='revision',
                            title=f"Revise: {topic.name}",
                            description=f"Review your weak area in {topic.subject.name}",
                            content=content,
                            topic=topic,
                            estimated_minutes=15,
                            is_revision=True,
                            is_priority=True,
                            order=len(items_created)
                        )
                        items_created.append(item)
                        total_minutes += 15
                except Topic.DoesNotExist:
                    pass
        
        # 3. Add new content to learn
        remaining_minutes = target_minutes - total_minutes
        
        # Get topics the student hasn't completed
        from content.models import ContentProgress
        completed_content_ids = ContentProgress.objects.filter(
            student=student,
            is_completed=True
        ).values_list('content_id', flat=True)
        
        new_contents = Content.objects.filter(
            Q(exams=exam) | Q(topic__exams=exam),
            status='published',
            content_type__in=['notes', 'video']
        ).exclude(id__in=completed_content_ids).order_by('order')[:5]
        
        for content in new_contents:
            if total_minutes >= target_minutes:
                break
            
            item = StudyPlanItem.objects.create(
                study_plan=study_plan,
                item_type='content',
                title=f"Study: {content.title}",
                description=content.description[:200] if content.description else '',
                content=content,
                topic=content.topic,
                estimated_minutes=content.estimated_time_minutes,
                order=len(items_created)
            )
            items_created.append(item)
            total_minutes += content.estimated_time_minutes
        
        # 4. Add a practice quiz
        if total_minutes < target_minutes:
            quiz_topic = None
            if weak_topic_ids:
                quiz_topic = Topic.objects.filter(id__in=weak_topic_ids).first()
            
            item = StudyPlanItem.objects.create(
                study_plan=study_plan,
                item_type='quiz',
                title="Practice Quiz" if not quiz_topic else f"Quiz: {quiz_topic.name}",
                description="Test your understanding with a quick quiz",
                topic=quiz_topic,
                estimated_minutes=15,
                order=len(items_created)
            )
            items_created.append(item)
        
        return items_created
    
    @staticmethod
    def get_next_content(student, exam):
        """
        Get the next recommended content for a student.
        """
        from content.models import ContentProgress
        
        # Get completed content
        completed_ids = ContentProgress.objects.filter(
            student=student,
            is_completed=True
        ).values_list('content_id', flat=True)
        
        # Get next uncompleted content
        next_content = Content.objects.filter(
            Q(exams=exam) | Q(topic__exams=exam),
            status='published'
        ).exclude(id__in=completed_ids).order_by('order').first()
        
        return next_content
    
    @staticmethod
    def get_revision_topics(student, exam, limit=5):
        """
        Get topics that need revision based on:
        - Low mastery level
        - Not practiced recently
        - High importance for exam
        """
        from analytics.models import TopicMastery
        from django.utils import timezone
        from datetime import timedelta
        
        week_ago = timezone.now() - timedelta(days=7)
        
        revision_topics = TopicMastery.objects.filter(
            student=student,
            topic__exams=exam
        ).filter(
            Q(mastery_level__lte=2) |  # Low mastery
            Q(last_attempted__lt=week_ago)  # Not practiced recently
        ).order_by('mastery_level', 'last_attempted')[:limit]
        
        return revision_topics

