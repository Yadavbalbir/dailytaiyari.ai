from datetime import date, timedelta
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from quiz.models import Quiz, Question, QuizQuestion
from exams.models import Course
from core.models import Tenant

class Command(BaseCommand):
    help = 'Automatically generate daily challenges for across all tenants and featured courses'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=1, help='Number of days to generate challenges for starting from today')
        parser.add_argument('--force', action='store_true', help='Force regeneration even if challenge already exists')

    def handle(self, *args, **options):
        days = options['days']
        force = options['force']
        today = timezone.now().date()
        
        tenants = Tenant.objects.all()
        featured_courses = Course.objects.filter(is_featured=True)
        
        if not featured_courses.exists():
            # Fallback to all active courses if no featured ones
            featured_courses = Course.objects.all()
            
        self.stdout.write(f'Generating challenges for {len(tenants)} tenants and {len(featured_courses)} courses over {days} days...')
        
        for i in range(days):
            target_date = today + timedelta(days=i)
            self.generate_for_date(target_date, tenants, featured_courses, force)
            
        self.stdout.write(self.style.SUCCESS('\nDaily challenge generation completed!'))

    def generate_for_date(self, target_date, tenants, courses, force):
        self.stdout.write(f'\nProcessing date: {target_date}')
        
        for tenant in tenants:
            for course in courses:
                # Check if challenge already exists for this tenant, course and date
                existing = Quiz.objects.filter(
                    tenant=tenant,
                    course=course,
                    is_daily_challenge=True,
                    challenge_date=target_date
                ).exists()
                
                if existing and not force:
                    self.stdout.write(f'  - (Tenant: {tenant.name}, Course: {course.name}) Skipping: Already exists')
                    continue
                
                # Pick 10 random published questions for this course
                # We filter by course even if questions are shared, we want relevant ones
                questions = list(Question.objects.filter(
                    courses=course,
                    status='published'
                ).order_by('?')[:10])
                
                if len(questions) < 5:
                    self.stdout.write(f'  - (Tenant: {tenant.name}, Course: {course.name}) Skipping: Not enough questions (found {len(questions)})')
                    continue
                
                with transaction.atomic():
                    # If force is true, delete existing
                    if existing:
                        Quiz.objects.filter(
                            tenant=tenant,
                            course=course,
                            is_daily_challenge=True,
                            challenge_date=target_date
                        ).delete()
                    
                    quiz_title = f'Daily Challenge - {target_date.strftime("%b %d, %Y")}'
                    quiz = Quiz.objects.create(
                        tenant=tenant,
                        course=course,
                        title=quiz_title,
                        description=f'Test your skills with today\'s daily challenge for {course.name}!',
                        quiz_type='daily',
                        status='published',
                        challenge_date=target_date,
                        is_daily_challenge=True,
                        duration_minutes=10,
                        total_marks=len(questions) * 4,
                        is_free=True
                    )
                    
                    # Add questions
                    for j, question in enumerate(questions):
                        QuizQuestion.objects.create(
                            quiz=quiz,
                            question=question,
                            order=j
                        )
                    
                    self.stdout.write(self.style.SUCCESS(f'  - (Tenant: {tenant.name}, Course: {course.name}) Created: {quiz_title}'))
