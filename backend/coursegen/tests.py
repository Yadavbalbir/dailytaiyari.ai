"""Tests for the AI Course Builder.

The feature's whole promise is that **the AI proposes and the admin disposes**.
These tests pin that down: generation must never create course rows, apply must
require an explicit confirmation, and a draft must never be applied twice.

The LLM itself is stubbed — what is under test is the pipeline around it
(normalisation, review gating, the write, and tenant/role scoping).
"""
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from content.models import Content
from core.models import Tenant
from coursegen.models import CourseGenerationJob
from coursegen.schema import normalize_content, normalize_outline
from exams.models import Chapter, ChapterTopic, Course, Subject, Topic
from quiz.models import Question, Quiz
from users.models import User

BASE = '/api/v1/tenant-admin/course-ai'

OUTLINE_RESPONSE = """
Sure! Here is the outline:
```json
{
  "course": {"name": "Intro to Python", "code": "intro-python",
             "course_type": "skill", "description": "Learn Python."},
  "subjects": [{
    "name": "Foundations", "code": "foundations", "weightage": 100,
    "chapters": [{
      "name": "Getting Started", "code": "getting-started",
      "topics": [
        {"name": "Variables", "code": "variables", "difficulty": "easy"},
        {"name": "Loops", "code": "loops", "difficulty": "medium"}
      ]
    }]
  }]
}
```
"""

CONTENT_RESPONSE = """
{"topics": [{
  "topic_code": "variables", "topic_name": "Variables",
  "note": {"title": "Understanding Variables", "blocks": [
    {"type": "lead", "text": "A variable is a labelled box."},
    {"type": "heading", "text": "Why they matter"},
    {"type": "paragraph", "text": "They let you name a value."},
    {"type": "callout", "variant": "recap", "text": "Names point at values."}
  ]},
  "quiz": {"title": "Variables Quiz", "duration_minutes": 8, "questions": [
    {"question_text": "What does x = 5 do?",
     "options": ["Deletes x", "Binds x to 5", "Prints 5", "Nothing"],
     "correct_option": 1, "explanation": "Assignment binds the name.",
     "concept": "Assignment"}
  ]}
}]}
"""


class _StudioTestCase(TestCase):
    """Shared fixtures: a tenant with a configured provider and a small course."""

    @classmethod
    def setUpTestData(cls):
        cls.tenant = Tenant.objects.create(name='Test Academy', is_active=True)
        cls.other_tenant = Tenant.objects.create(name='Rival Academy', is_active=True)

        cls.admin = User.objects.create_user(
            email='admin@example.com', password='pw-admin-123', tenant=cls.tenant, role='admin'
        )
        cls.instructor = User.objects.create_user(
            email='teach@example.com', password='pw-teach-123',
            tenant=cls.tenant, role='instructor',
        )
        cls.outsider = User.objects.create_user(
            email='rival@example.com', password='pw-rival-123',
            tenant=cls.other_tenant, role='admin',
        )

        cls.course = Course.objects.create(
            tenant=cls.tenant, name='Python', code='python-test', course_type='skill'
        )
        cls.subject = Subject.objects.create(
            tenant=cls.tenant, course=cls.course, name='Core', code='core'
        )
        cls.chapter = Chapter.objects.create(
            tenant=cls.tenant, subject=cls.subject, name='Basics', code='basics'
        )
        cls.topic = Topic.objects.create(
            tenant=cls.tenant, subject=cls.subject, name='Variables', code='variables'
        )
        ChapterTopic.objects.create(
            tenant=cls.tenant, chapter=cls.chapter, topic=cls.topic, order=0
        )

    def client_for(self, user):
        client = APIClient()
        token = RefreshToken.for_user(user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def post(self, user, path, payload=None, tenant=None):
        return self.client_for(user).post(
            f'{BASE}{path}', payload or {}, format='json',
            HTTP_X_TENANT_ID=str((tenant or self.tenant).id),
        )

    def get(self, user, path, tenant=None):
        return self.client_for(user).get(
            f'{BASE}{path}', HTTP_X_TENANT_ID=str((tenant or self.tenant).id)
        )

    def patch(self, user, path, payload, tenant=None):
        return self.client_for(user).patch(
            f'{BASE}{path}', payload, format='json',
            HTTP_X_TENANT_ID=str((tenant or self.tenant).id),
        )

    @staticmethod
    def stub_llm(response_text):
        """Patch the provider call so no network request is ever made."""
        from chatbot.providers import Usage

        return patch(
            'coursegen.generation.complete',
            return_value=(response_text, Usage(100, 200, 300), 1200),
        )

    @staticmethod
    def stub_provider():
        """Pretend the tenant has a working provider configured."""
        from chatbot.providers import ResolvedProvider

        return patch(
            'coursegen.generation.resolve_for_admin',
            return_value=ResolvedProvider(provider='openai', api_key='k', model='gpt-4o-mini'),
        )


class GenerationNeverWritesTests(_StudioTestCase):
    """The central guarantee: generating produces a draft and nothing else."""

    def test_outline_generation_creates_no_course_rows(self):
        before = Course.objects.count()
        with self.stub_provider(), self.stub_llm(OUTLINE_RESPONSE):
            response = self.post(self.admin, '/jobs/', {
                'kind': 'outline', 'prompt': 'A beginner Python course',
            })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'preview')
        self.assertEqual(response.data['summary'], {'subjects': 1, 'chapters': 1, 'topics': 2})
        # Nothing was written.
        self.assertEqual(Course.objects.count(), before)
        self.assertFalse(Subject.objects.filter(code='foundations').exists())

    def test_content_generation_creates_no_content_rows(self):
        with self.stub_provider(), self.stub_llm(CONTENT_RESPONSE):
            response = self.post(self.admin, '/jobs/', {
                'kind': 'content', 'prompt': '', 'course': str(self.course.id),
                'topic_ids': [str(self.topic.id)],
            })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['summary']['questions'], 1)
        self.assertFalse(Content.objects.filter(topic=self.topic).exists())
        self.assertFalse(Quiz.objects.filter(topic=self.topic).exists())

    def test_failed_generation_is_reported_not_raised(self):
        with self.stub_provider(), self.stub_llm('I am afraid I cannot do that.'):
            response = self.post(self.admin, '/jobs/', {
                'kind': 'outline', 'prompt': 'Something',
            })
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data['status'], 'failed')
        self.assertIn('JSON', response.data['error'])


class ApplyRequiresConfirmationTests(_StudioTestCase):
    """Applying is a separate, explicit, one-shot action."""

    def _outline_job(self):
        with self.stub_provider(), self.stub_llm(OUTLINE_RESPONSE):
            response = self.post(self.admin, '/jobs/', {
                'kind': 'outline', 'prompt': 'A beginner Python course',
            })
        return response.data['id']

    def test_apply_without_confirm_is_rejected(self):
        job_id = self._outline_job()
        response = self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': False})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Course.objects.filter(code='intro-python').exists())

    def test_confirmed_apply_creates_the_tree(self):
        job_id = self._outline_job()
        response = self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})

        self.assertEqual(response.status_code, 200)
        course = Course.objects.get(code='intro-python')
        self.assertEqual(course.tenant, self.tenant)
        # A generated course is never live until an admin publishes it.
        self.assertEqual(course.status, 'coming_soon')
        self.assertEqual(Topic.objects.filter(subject__course=course).count(), 2)
        self.assertEqual(response.data['summary']['topics'], 2)

    def test_a_draft_cannot_be_applied_twice(self):
        job_id = self._outline_job()
        self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})
        again = self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})

        self.assertEqual(again.status_code, 409)
        self.assertEqual(Course.objects.filter(code='intro-python').count(), 1)

    def test_discarded_draft_cannot_be_applied(self):
        job_id = self._outline_job()
        self.post(self.admin, f'/jobs/{job_id}/discard/')
        response = self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})

        self.assertEqual(response.status_code, 409)
        self.assertFalse(Course.objects.filter(code='intro-python').exists())

    def test_unticking_everything_writes_nothing(self):
        # An empty selection means "none of it" — not "all of it".
        job_id = self._outline_job()
        response = self.post(self.admin, f'/jobs/{job_id}/apply/', {
            'confirm': True, 'selection': {'topics': []},
        })
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Course.objects.filter(code='intro-python').exists())

    def test_selection_limits_what_is_written(self):
        job_id = self._outline_job()
        response = self.post(self.admin, f'/jobs/{job_id}/apply/', {
            'confirm': True,
            'selection': {'topics': ['variables']},
        })
        self.assertEqual(response.status_code, 200)
        course = Course.objects.get(code='intro-python')
        names = set(Topic.objects.filter(subject__course=course).values_list('name', flat=True))
        self.assertEqual(names, {'Variables'})


class ContentApplyTests(_StudioTestCase):
    def _content_job(self):
        with self.stub_provider(), self.stub_llm(CONTENT_RESPONSE):
            response = self.post(self.admin, '/jobs/', {
                'kind': 'content', 'course': str(self.course.id),
                'topic_ids': [str(self.topic.id)],
                'options': {'publish_immediately': True},
            })
        return response.data['id']

    def test_apply_writes_note_and_quiz(self):
        job_id = self._content_job()
        response = self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})
        self.assertEqual(response.status_code, 200)

        note = Content.objects.get(topic=self.topic, content_type='notes')
        self.assertEqual(note.status, 'published')
        self.assertIn('labelled box', note.content_html)
        self.assertEqual(note.subject, self.subject)
        self.assertIn(self.course, note.courses.all())

        quiz = Quiz.objects.get(topic=self.topic)
        self.assertEqual(quiz.questions.count(), 1)
        question = Question.objects.get(topic=self.topic)
        # The player compares the submitted option index against this string.
        self.assertEqual(question.correct_answer, '1')
        self.assertTrue(question.options.get(order=1).is_correct)
        self.assertEqual(question.tags, ['Assignment'])

    def test_reapplying_updates_the_note_instead_of_duplicating(self):
        self.post(self.admin, f'/jobs/{self._content_job()}/apply/', {'confirm': True})
        self.post(self.admin, f'/jobs/{self._content_job()}/apply/', {'confirm': True})
        self.assertEqual(Content.objects.filter(topic=self.topic, content_type='notes').count(), 1)

    def test_quiz_with_attempts_is_not_overwritten(self):
        job_id = self._content_job()
        self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})
        quiz = Quiz.objects.get(topic=self.topic)
        Quiz.objects.filter(pk=quiz.pk).update(total_attempts=4)

        self.post(self.admin, f'/jobs/{self._content_job()}/apply/', {'confirm': True})
        # The attempted quiz survives; the new material lands in a second quiz.
        self.assertEqual(Quiz.objects.filter(topic=self.topic).count(), 2)
        self.assertEqual(Quiz.objects.get(pk=quiz.pk).total_attempts, 4)


class DraftEditingTests(_StudioTestCase):
    def test_admin_edits_are_renormalised(self):
        with self.stub_provider(), self.stub_llm(OUTLINE_RESPONSE):
            job_id = self.post(self.admin, '/jobs/', {
                'kind': 'outline', 'prompt': 'Python',
            }).data['id']

        job = CourseGenerationJob.objects.get(id=job_id)
        edited = job.draft
        edited['subjects'][0]['chapters'][0]['topics'][0]['name'] = '  Renamed   Topic  '
        edited['subjects'][0]['chapters'][0]['topics'][0]['difficulty'] = 'impossible'

        response = self.patch(self.admin, f'/jobs/{job_id}/', {'draft': edited})
        self.assertEqual(response.status_code, 200)
        topic = response.data['draft']['subjects'][0]['chapters'][0]['topics'][0]
        self.assertEqual(topic['name'], 'Renamed Topic')
        # An invalid choice falls back rather than reaching the database.
        self.assertEqual(topic['difficulty'], 'medium')

    def test_applied_draft_cannot_be_edited(self):
        with self.stub_provider(), self.stub_llm(OUTLINE_RESPONSE):
            job_id = self.post(self.admin, '/jobs/', {
                'kind': 'outline', 'prompt': 'Python',
            }).data['id']
        self.post(self.admin, f'/jobs/{job_id}/apply/', {'confirm': True})

        response = self.patch(self.admin, f'/jobs/{job_id}/', {'draft': {'subjects': []}})
        self.assertEqual(response.status_code, 409)


class ScopingTests(_StudioTestCase):
    """Tenant and role boundaries hold for every studio endpoint."""

    def test_another_tenants_admin_cannot_see_the_job(self):
        with self.stub_provider(), self.stub_llm(OUTLINE_RESPONSE):
            job_id = self.post(self.admin, '/jobs/', {
                'kind': 'outline', 'prompt': 'Python',
            }).data['id']

        response = self.get(self.outsider, f'/jobs/{job_id}/', tenant=self.other_tenant)
        self.assertEqual(response.status_code, 404)

    def test_instructor_cannot_create_a_new_course(self):
        with self.stub_provider(), self.stub_llm(OUTLINE_RESPONSE):
            response = self.post(self.instructor, '/jobs/', {
                'kind': 'outline', 'prompt': 'A brand new course',
            })
        self.assertEqual(response.status_code, 403)

    def test_instructor_cannot_generate_for_an_unassigned_course(self):
        with self.stub_provider(), self.stub_llm(CONTENT_RESPONSE):
            response = self.post(self.instructor, '/jobs/', {
                'kind': 'content', 'course': str(self.course.id),
                'topic_ids': [str(self.topic.id)],
            })
        self.assertEqual(response.status_code, 404)

    def test_instructor_can_generate_for_an_assigned_course(self):
        self.course.instructors.add(self.instructor)
        with self.stub_provider(), self.stub_llm(CONTENT_RESPONSE):
            response = self.post(self.instructor, '/jobs/', {
                'kind': 'content', 'course': str(self.course.id),
                'topic_ids': [str(self.topic.id)],
            })
        self.assertEqual(response.status_code, 201)

    def test_topics_from_another_course_are_refused(self):
        other = Course.objects.create(
            tenant=self.tenant, name='Other', code='other-test', course_type='skill'
        )
        other_subject = Subject.objects.create(
            tenant=self.tenant, course=other, name='S', code='s'
        )
        stray = Topic.objects.create(
            tenant=self.tenant, subject=other_subject, name='Stray', code='stray'
        )
        with self.stub_provider(), self.stub_llm(CONTENT_RESPONSE):
            response = self.post(self.admin, '/jobs/', {
                'kind': 'content', 'course': str(self.course.id),
                'topic_ids': [str(stray.id)],
            })
        self.assertEqual(response.status_code, 400)


class StudioSurfaceTests(_StudioTestCase):
    """The read-only endpoints the composer depends on."""

    def test_options_reports_not_ready_without_a_provider(self):
        response = self.get(self.admin, '/options/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_ready'])
        self.assertIn('AI Features', response.data['not_ready_reason'])
        self.assertTrue(response.data['can_create_courses'])
        self.assertIn(
            str(self.course.id), [c['id'] for c in response.data['courses']]
        )

    def test_instructor_only_sees_their_own_courses(self):
        response = self.get(self.instructor, '/options/')
        self.assertEqual(response.data['courses'], [])
        self.assertFalse(response.data['can_create_courses'])

    def test_health_is_a_cheap_probe(self):
        response = self.get(self.admin, '/health/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('is_ready', response.data)

    def test_course_tree_flags_existing_material(self):
        response = self.get(self.admin, f'/courses/{self.course.id}/tree/')
        self.assertEqual(response.status_code, 200)
        topic = response.data['subjects'][0]['chapters'][0]['topics'][0]
        self.assertEqual(topic['name'], 'Variables')
        self.assertFalse(topic['has_notes'])
        self.assertFalse(topic['has_quiz'])

    def test_course_tree_is_tenant_scoped(self):
        response = self.get(self.outsider, f'/courses/{self.course.id}/tree/',
                            tenant=self.other_tenant)
        self.assertEqual(response.status_code, 404)


class NormalisationTests(TestCase):
    """The normalisers are the trust boundary for anything a model returns."""

    def test_note_text_is_escaped(self):
        draft = normalize_content(
            {'topics': [{'topic_name': 'T', 'note': {'blocks': [
                {'type': 'paragraph', 'text': '<img src=x onerror=alert(1)>'}
            ]}}]},
            requested_topics=[{'id': '1', 'name': 'T', 'code': 't'}],
        )
        html = draft['topics'][0]['note']['html']
        self.assertNotIn('<img', html)
        self.assertIn('&lt;img', html)

    def test_question_without_enough_options_is_dropped(self):
        draft = normalize_content(
            {'topics': [{'topic_name': 'T', 'quiz': {'questions': [
                {'question_text': 'Only one?', 'options': ['a'], 'correct_option': 0},
                {'question_text': 'Duplicates?', 'options': ['a', 'A'], 'correct_option': 0},
                {'question_text': 'Fine?', 'options': ['a', 'b'], 'correct_option': 1},
            ]}}]},
            requested_topics=[{'id': '1', 'name': 'T', 'code': 't'}],
        )
        questions = draft['topics'][0]['quiz']['questions']
        self.assertEqual([q['question_text'] for q in questions], ['Fine?'])

    def test_out_of_range_correct_option_is_clamped(self):
        draft = normalize_content(
            {'topics': [{'topic_name': 'T', 'quiz': {'questions': [
                {'question_text': 'Q', 'options': ['a', 'b'], 'correct_option': 9},
            ]}}]},
            requested_topics=[{'id': '1', 'name': 'T', 'code': 't'}],
        )
        self.assertEqual(draft['topics'][0]['quiz']['questions'][0]['correct_option'], 0)

    def test_outline_codes_are_unique_slugs(self):
        draft = normalize_outline({'course': {'name': 'C'}, 'subjects': [{
            'name': 'S', 'chapters': [{'name': 'Ch', 'topics': [
                {'name': 'Same Name'}, {'name': 'Same Name'},
            ]}],
        }]})
        codes = [t['code'] for t in draft['subjects'][0]['chapters'][0]['topics']]
        self.assertEqual(codes, ['same-name', 'same-name-2'])

    def test_empty_chapters_are_dropped(self):
        draft = normalize_outline({'course': {'name': 'C'}, 'subjects': [{
            'name': 'S', 'chapters': [{'name': 'Empty', 'topics': []}],
        }]})
        self.assertEqual(draft['subjects'], [])
