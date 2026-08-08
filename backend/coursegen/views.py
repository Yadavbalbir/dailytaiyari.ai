"""Tenant-admin endpoints for the AI Course Builder ("Course Studio").

The contract the whole screen is built on: **generation and writing are two
separate calls.** ``POST /jobs/`` only ever produces a draft for review;
``POST /jobs/{id}/apply/`` is the single endpoint that touches course tables and
it refuses anything that is not an explicitly confirmed, still-in-preview draft.

Everything is scoped to the tenant resolved by ``TenantMiddleware`` and to the
courses the caller is allowed to edit (admins: all; instructors: assigned only).
"""
from __future__ import annotations

import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from chatbot import resolver
from content.models import Content
from core.permissions import IsCourseEditor
from exams.models import Course
from quiz.models import Quiz

from . import generation
from .apply import ApplyError, apply_draft
from .models import CourseGenerationJob
from .schema import (
    MAX_QUESTIONS_PER_QUIZ,
    MAX_TOPICS_PER_CONTENT_JOB,
)
from .serializers import (
    ApplySerializer,
    CourseGenerationJobListSerializer,
    CourseGenerationJobSerializer,
    DraftUpdateSerializer,
    GenerateSerializer,
    RefineSerializer,
)

logger = logging.getLogger(__name__)


class _StudioView(APIView):
    """Shared tenant + course scoping for every studio endpoint."""

    permission_classes = [IsAuthenticated, IsCourseEditor]

    @property
    def tenant(self):
        return getattr(self.request, 'tenant', None)

    def editable_courses(self):
        """Courses this caller may build in."""
        queryset = Course.objects.filter(tenant=self.tenant)
        if getattr(self.request.user, 'role', None) == 'instructor':
            queryset = queryset.filter(
                id__in=self.request.user.instructing_courses.values_list('id', flat=True)
            )
        return queryset

    def get_course(self, course_id):
        if not course_id:
            return None
        return get_object_or_404(self.editable_courses(), id=course_id)

    def jobs(self):
        queryset = CourseGenerationJob.objects.filter(tenant=self.tenant)
        if getattr(self.request.user, 'role', None) == 'instructor':
            # An instructor sees their own jobs and jobs on their courses, never
            # another instructor's draft for a course they cannot edit.
            queryset = queryset.filter(
                course__in=self.editable_courses()
            ) | queryset.filter(created_by=self.request.user, course__isnull=True)
        return queryset.select_related('course', 'created_by').distinct()

    def can_create_courses(self):
        return getattr(self.request.user, 'role', None) == 'admin'


class StudioOptionsView(_StudioView):
    """Everything the studio needs to render its composer in one call."""

    def get(self, request):
        tenant = self.tenant
        models = generation.available_models(tenant)
        settings_obj = resolver.get_ai_settings(tenant)

        courses = [
            {'id': str(c.id), 'name': c.name, 'code': c.code, 'status': c.status}
            for c in self.editable_courses().order_by('name')
        ]

        return Response({
            'is_ready': bool(models) and settings_obj.is_enabled,
            'ai_enabled': settings_obj.is_enabled,
            'providers': models,
            'courses': courses,
            'can_create_courses': self.can_create_courses(),
            'limits': {
                'max_topics_per_content_job': MAX_TOPICS_PER_CONTENT_JOB,
                'max_questions_per_quiz': MAX_QUESTIONS_PER_QUIZ,
            },
            'defaults': {
                'chapters_per_subject': 5,
                'topics_per_chapter': 4,
                'questions_per_quiz': 5,
                'depth': 'standard',
                'language': 'English',
                'publish_immediately': False,
            },
            'kinds': [
                {'id': k, 'label': label}
                for k, label in CourseGenerationJob.KIND_CHOICES
            ],
            'not_ready_reason': (
                '' if models else
                'Connect an AI provider under Admin → AI Features to use the course studio.'
            ),
        })


class CourseTreeView(_StudioView):
    """The course's tree, annotated with what already has material.

    Powers the topic picker: an admin can see at a glance which topics are still
    empty before asking the AI to write for them.
    """

    def get(self, request, course_id):
        course = self.get_course(course_id)

        topics_with_notes = set(
            Content.objects.filter(
                topic__subject__course=course, content_type='notes'
            ).values_list('topic_id', flat=True)
        )
        topics_with_quiz = set(
            Quiz.objects.filter(course=course).exclude(topic=None).values_list('topic_id', flat=True)
        )

        subjects = []
        for subject in course.subjects.all().order_by('order', 'name'):
            chapters = []
            for chapter in subject.chapters.all().order_by('order', 'name'):
                links = (
                    chapter.chapter_topics.select_related('topic').order_by('order')
                )
                chapters.append({
                    'id': str(chapter.id),
                    'name': chapter.name,
                    'code': chapter.code,
                    'topics': [
                        {
                            'id': str(link.topic.id),
                            'name': link.topic.name,
                            'code': link.topic.code,
                            'summary': link.topic.description or '',
                            'difficulty': link.topic.difficulty,
                            'has_notes': link.topic.id in topics_with_notes,
                            'has_quiz': link.topic.id in topics_with_quiz,
                        }
                        for link in links
                    ],
                })
            subjects.append({
                'id': str(subject.id),
                'name': subject.name,
                'code': subject.code,
                'chapters': chapters,
            })

        return Response({
            'course': {
                'id': str(course.id),
                'name': course.name,
                'code': course.code,
                'status': course.status,
                'description': course.description,
                'subtitle': course.subtitle,
                'highlights': course.highlights or [],
            },
            'subjects': subjects,
        })


class JobPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobListCreateView(_StudioView):
    """``GET`` recent jobs; ``POST`` runs a generation and returns the draft."""

    def get(self, request):
        queryset = self.jobs()
        course_id = request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        kind = request.query_params.get('kind')
        if kind:
            queryset = queryset.filter(kind=kind)
        job_status = request.query_params.get('status')
        if job_status:
            queryset = queryset.filter(status=job_status)

        paginator = JobPagination()
        page = paginator.paginate_queryset(queryset.order_by('-created_at'), request, view=self)
        return paginator.get_paginated_response(
            CourseGenerationJobListSerializer(page, many=True).data
        )

    def post(self, request):
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        course = self.get_course(data.get('course'))
        kind = data['kind']

        if kind == CourseGenerationJob.KIND_OUTLINE and course is None and not self.can_create_courses():
            return Response(
                {'detail': 'Only admins can create new courses. Pick an existing course to extend.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        job = CourseGenerationJob.objects.create(
            tenant=self.tenant,
            created_by=request.user,
            course=course,
            kind=kind,
            prompt=data['prompt'],
            input_mode=data.get('input_mode') or CourseGenerationJob.INPUT_TEXT,
            options=data.get('options') or {},
            provider=(data.get('provider') or '').strip(),
            model=(data.get('model') or '').strip(),
        )

        topics = []
        if kind == CourseGenerationJob.KIND_CONTENT:
            topics = self._resolve_topics(course, data.get('topic_ids') or [])
            if not topics:
                job.delete()
                return Response(
                    {'topic_ids': ['None of those topics belong to this course.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        generation.run_job(job, topics=topics)

        payload = CourseGenerationJobSerializer(job).data
        if job.status == CourseGenerationJob.STATUS_FAILED:
            return Response(payload, status=status.HTTP_502_BAD_GATEWAY)
        return Response(payload, status=status.HTTP_201_CREATED)

    @staticmethod
    def _resolve_topics(course, topic_ids):
        """Load the requested topics, in the order the admin picked them."""
        from exams.models import Topic

        found = {
            str(topic.id): topic
            for topic in Topic.objects.filter(
                id__in=topic_ids, subject__course=course
            ).select_related('subject')
        }
        ordered = []
        for topic_id in topic_ids:
            topic = found.get(str(topic_id))
            if topic is None:
                continue
            ordered.append({
                'id': str(topic.id),
                'name': topic.name,
                'code': topic.code,
                'summary': topic.description or '',
                'subject_name': topic.subject.name,
            })
        return ordered


class JobDetailView(_StudioView):
    """``GET`` the draft, ``PATCH`` an admin's edits, ``DELETE`` the job."""

    def get_job(self, job_id):
        return get_object_or_404(self.jobs(), id=job_id)

    def get(self, request, job_id):
        return Response(CourseGenerationJobSerializer(self.get_job(job_id)).data)

    def patch(self, request, job_id):
        job = self.get_job(job_id)
        if not job.is_reviewable:
            return Response(
                {'detail': 'This draft can no longer be edited.'},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = DraftUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.update(job, serializer.validated_data)
        return Response(CourseGenerationJobSerializer(job).data)

    def delete(self, request, job_id):
        job = self.get_job(job_id)
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JobRefineView(_StudioView):
    """Ask the model to revise the draft. Still does not write anything."""

    def post(self, request, job_id):
        job = get_object_or_404(self.jobs(), id=job_id)
        if not job.is_reviewable:
            return Response(
                {'detail': 'Only a draft awaiting review can be refined.'},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = RefineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            generation.apply_refinement(job, serializer.validated_data['instruction'])
        except generation.GenerationError as exc:
            # The previous draft survives — report the failure without losing it.
            return Response(
                {'detail': str(exc), 'draft_preserved': True},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(CourseGenerationJobSerializer(job).data)


class JobApplyView(_StudioView):
    """The one endpoint that writes. Requires an explicit confirmation."""

    def post(self, request, job_id):
        job = get_object_or_404(self.jobs(), id=job_id)
        if not job.is_reviewable:
            return Response(
                {'detail': f'This draft was already {job.get_status_display().lower()}.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = ApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if (job.kind == CourseGenerationJob.KIND_OUTLINE
                and job.course is None and not self.can_create_courses()):
            return Response(
                {'detail': 'Only admins can create new courses.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            summary = apply_draft(
                job, user=request.user, selection=serializer.validated_data.get('selection') or {}
            )
        except ApplyError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:  # noqa: BLE001 - the transaction already rolled back
            logger.exception('coursegen: apply failed for job %s', job.id)
            return Response(
                {'detail': f'Could not save this draft: {str(exc)[:200]}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'job': CourseGenerationJobSerializer(job).data,
            'summary': summary,
        })


class JobDiscardView(_StudioView):
    """Throw a draft away without writing anything."""

    def post(self, request, job_id):
        job = get_object_or_404(self.jobs(), id=job_id)
        if job.status == CourseGenerationJob.STATUS_APPLIED:
            return Response(
                {'detail': 'An applied draft cannot be discarded.'},
                status=status.HTTP_409_CONFLICT,
            )
        job.status = CourseGenerationJob.STATUS_DISCARDED
        job.record_revision('discarded')
        job.save(update_fields=['status', 'revisions', 'updated_at'])
        return Response(CourseGenerationJobSerializer(job).data)


class TranscribeView(_StudioView):
    """Server-side speech-to-text, for browsers without the Web Speech API.

    The studio dictates in-browser wherever possible (free, instant, private).
    This is the fallback: it forwards the recording to the tenant's own
    OpenAI-compatible provider, so no audio ever reaches a third party the
    academy has not already chosen.
    """

    def post(self, request):
        audio = request.FILES.get('audio')
        if audio is None:
            return Response(
                {'audio': ['Record something first.']}, status=status.HTTP_400_BAD_REQUEST
            )
        if audio.size > 25 * 1024 * 1024:
            return Response(
                {'audio': ['That recording is too long — keep it under 25 MB.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            text = transcribe_audio(
                self.tenant,
                audio,
                provider=request.data.get('provider'),
                language=request.data.get('language') or '',
            )
        except generation.GenerationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'text': text})


def transcribe_audio(tenant, audio, *, provider=None, language=''):
    """Transcribe ``audio`` through an OpenAI-compatible ``/audio/transcriptions``."""
    import requests

    from chatbot.models import AIProviderConfig
    from chatbot.providers import CONNECT_TIMEOUT, READ_TIMEOUT

    resolved = generation.resolve_for_admin(tenant, provider=provider)
    supported = {
        AIProviderConfig.PROVIDER_OPENAI,
        AIProviderConfig.PROVIDER_GROQ,
        AIProviderConfig.PROVIDER_CUSTOM,
    }
    if resolved.provider not in supported:
        raise generation.GenerationError(
            'Voice transcription needs an OpenAI- or Groq-compatible provider. '
            'Dictation still works directly in Chrome, Edge and Safari.'
        )

    base = (resolved.base_url or 'https://api.openai.com/v1').rstrip('/')
    model = (
        'whisper-large-v3-turbo'
        if resolved.provider == AIProviderConfig.PROVIDER_GROQ
        else 'whisper-1'
    )
    data = {'model': model}
    if language:
        data['language'] = language[:5]

    try:
        response = requests.post(
            f'{base}/audio/transcriptions',
            headers={'Authorization': f'Bearer {resolved.api_key}'},
            files={'file': (audio.name or 'speech.webm', audio.file, audio.content_type)},
            data=data,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
        )
    except requests.RequestException as exc:
        raise generation.GenerationError(f'Could not reach the transcription service: {exc}')

    if response.status_code >= 400:
        try:
            detail = response.json().get('error', {}).get('message') or response.text
        except ValueError:
            detail = response.text
        raise generation.GenerationError(f'Transcription failed: {detail[:200]}')

    try:
        return (response.json().get('text') or '').strip()
    except ValueError:
        return response.text.strip()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCourseEditor])
def studio_health(request):
    """Cheap readiness probe used to gate the studio's entry buttons."""
    tenant = getattr(request, 'tenant', None)
    models = generation.available_models(tenant) if tenant else []
    return Response({
        'is_ready': bool(models),
        'provider_count': len(models),
    })
