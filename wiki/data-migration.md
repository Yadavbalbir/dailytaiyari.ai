# Data Migration Guide

## Assigning All Existing Data to a Tenant

When migrating from single-tenant to multi-tenant, or when backfilling data, use this script:

```python
python manage.py shell
```

```python
from core.models import Tenant

# Get or create the target tenant
tenant = Tenant.objects.get(name="Your Tenant Name")
# Or by ID:
# tenant = Tenant.objects.get(id="405223b1-7738-4b01-b405-9cbfecdd63a1")

print(f"Assigning all data to: {tenant.name} ({tenant.id})")

# All models that have a tenant FK
from exams.models import Exam, Subject, Topic, Chapter, TopicExamRelevance
from quiz.models import (
    Question, Quiz, MockTest, MockTestQuestion, QuizAttempt,
    MockTestAttempt, Answer, QuestionReport, QuestionOption, QuizQuestion
)
from content.models import Content, ContentProgress, StudyPlan, StudyPlanItem
from analytics.models import (
    TopicMastery, SubjectPerformance, DailyActivity,
    Streak, WeeklyReport, StudySession
)
from gamification.models import (
    Badge, StudentBadge, XPTransaction, LeaderboardEntry,
    Challenge, ChallengeParticipation
)
from community.models import (
    Post, Comment, Like, PollOption, PollVote,
    CommunityQuiz, CommunityStats, CommunityLeaderboard
)
from chatbot.models import (
    ChatSession, ChatMessage, SavedResponse, FrequentQuestion,
    AIQuizAttempt, AIQuizQuestion, AILearningStats
)
from users.models import User, StudentProfile, ExamEnrollment

models = [
    User, StudentProfile, ExamEnrollment,
    Exam, Subject, Topic, Chapter, TopicExamRelevance,
    Question, Quiz, MockTest, MockTestQuestion, QuizAttempt,
    MockTestAttempt, Answer, QuestionReport, QuestionOption, QuizQuestion,
    Content, ContentProgress, StudyPlan, StudyPlanItem,
    TopicMastery, SubjectPerformance, DailyActivity,
    Streak, WeeklyReport, StudySession,
    Badge, StudentBadge, XPTransaction, LeaderboardEntry,
    Challenge, ChallengeParticipation,
    Post, Comment, Like, PollOption, PollVote,
    CommunityQuiz, CommunityStats, CommunityLeaderboard,
    ChatSession, ChatMessage, SavedResponse, FrequentQuestion,
    AIQuizAttempt, AIQuizQuestion, AILearningStats,
]

for model in models:
    count = model.objects.filter(tenant__isnull=True).update(tenant=tenant)
    if count > 0:
        print(f"  {model.__name__}: {count} records updated")

print("Done!")
```

---

## Moving Data Between Tenants

To reassign data from one tenant to another:

```python
from core.models import Tenant

old_tenant = Tenant.objects.get(name="Old Tenant")
new_tenant = Tenant.objects.get(name="New Tenant")

# Move specific models
from quiz.models import Question
moved = Question.objects.filter(tenant=old_tenant).update(tenant=new_tenant)
print(f"Moved {moved} questions")
```

> **Warning:** Moving users between tenants may break references. Move all related data together.

---

## Creating a Management Command for Bulk Migration

For repeatable migrations, create a Django management command:

```python
# core/management/commands/assign_tenant.py

from django.core.management.base import BaseCommand
from core.models import Tenant

class Command(BaseCommand):
    help = 'Assign all unassigned data to a specific tenant'

    def add_arguments(self, parser):
        parser.add_argument('tenant_id', type=str, help='UUID of the target tenant')

    def handle(self, *args, **options):
        tenant = Tenant.objects.get(id=options['tenant_id'])
        self.stdout.write(f"Assigning data to: {tenant.name}")

        # Import and update all models...
        # (use the same model list from above)

        self.stdout.write(self.style.SUCCESS("Done!"))
```

Usage:
```bash
python manage.py assign_tenant 405223b1-7738-4b01-b405-9cbfecdd63a1
```

---

## Verifying Data Isolation

To verify that data is properly isolated between tenants:

```python
from core.models import Tenant
from quiz.models import Question

tenant_a = Tenant.objects.get(name="Tenant A")
tenant_b = Tenant.objects.get(name="Tenant B")

questions_a = Question.objects.filter(tenant=tenant_a).count()
questions_b = Question.objects.filter(tenant=tenant_b).count()
unassigned = Question.objects.filter(tenant__isnull=True).count()

print(f"Tenant A: {questions_a} questions")
print(f"Tenant B: {questions_b} questions")
print(f"Unassigned: {unassigned} questions")  # Should be 0
```

---

## Checklist for New Tenant Setup

- [ ] Create Tenant in Django Admin with name and logo
- [ ] Copy the UUID
- [ ] Set `VITE_TENANT_ID` in the frontend `.env`
- [ ] Build and deploy the frontend
- [ ] Add initial data (Exams, Subjects, Topics, Questions) via admin or bulk import
- [ ] Create a superuser for the tenant
- [ ] Test registration and login
- [ ] Verify data isolation from other tenants
