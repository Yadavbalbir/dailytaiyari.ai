"""Builds the study-context brief the AI receives for a course-scoped chat.

When a student picks one of their enrolled courses in the AI Doubt Solver, we
summarise *their* relationship with that course — syllabus shape, how much is
completed, what is still pending, and where they keep making mistakes — and
prepend it to the system prompt. That is what lets the assistant answer
"what's left for me?", "where am I weak?" and "did I finish Thermodynamics?"
instead of only generic subject doubts.

The brief is deliberately compact (a few hundred tokens): it is sent with every
message in the conversation, so verbosity here is a recurring cost.
"""
from __future__ import annotations

import logging
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone

logger = logging.getLogger(__name__)

# How much detail to include before truncating, keeping the prompt small.
MAX_SUBJECTS = 12
MAX_CHAPTERS_LISTED = 8
MAX_WEAK_TOPICS = 6


def enrolled_courses(student, tenant=None):
    """Courses this student may actually use as AI context.

    Deliberately stricter than "has an enrollment row". A course only qualifies
    when the enrollment is approved and live *and* the course itself is still
    active — an inactive or "coming soon" course has no meaningful syllabus or
    progress to reason about, so offering it in the picker just invites the
    assistant to answer from an empty snapshot.

    Passing ``tenant`` additionally pins the result to that tenant, so a stale
    enrollment pointing at another tenant's course can never leak its content.
    """
    from users.models import CourseEnrollment

    qs = CourseEnrollment.objects.filter(
        student=student,
        is_active=True,
        status='approved',
        course__status='active',
    )
    if tenant is not None:
        qs = qs.filter(course__tenant=tenant)

    return qs.select_related('course').order_by('-enrolled_at')


def enrolled_course_or_none(student, course_id, tenant=None):
    """Resolve ``course_id`` to a usable enrolled course, else ``None``.

    One indexed query rather than iterating the student's enrollments, and the
    single place that decides whether a given course is fair game for this
    student — used by both the course picker and the session endpoints.
    """
    if not course_id:
        return None

    try:
        enrollment = enrolled_courses(student, tenant=tenant).filter(course_id=course_id).first()
    except (ValueError, ValidationError):
        # A malformed uuid is simply "no such course" rather than a 500.
        return None
    return enrollment.course if enrollment else None


def _content_progress(student, course):
    """``(total, completed)`` published content items for the course."""
    from content.models import Content, ContentProgress

    contents = Content.objects.filter(courses=course, status='published')
    total = contents.count()
    if not total:
        return 0, 0
    completed = ContentProgress.objects.filter(
        student=student, content__in=contents, is_completed=True
    ).count()
    return total, completed


def _chapter_breakdown(student, course):
    """Per-chapter completion, so the AI can name what is actually pending."""
    from content.models import Content, ContentProgress
    from exams.models import Chapter

    chapters = (
        Chapter.objects.filter(subject__course=course)
        .select_related('subject')
        .prefetch_related('topics')
        .order_by('subject__order', 'order')
    )
    if not chapters:
        return []

    completed_ids = set(
        ContentProgress.objects.filter(
            student=student, is_completed=True, content__courses=course
        ).values_list('content_id', flat=True)
    )

    rows = []
    for chapter in chapters:
        topic_ids = list(chapter.topics.values_list('id', flat=True))
        if not topic_ids:
            continue
        content_ids = list(
            Content.objects.filter(
                courses=course, status='published', topic_id__in=topic_ids
            ).values_list('id', flat=True)
        )
        if not content_ids:
            continue
        done = len([cid for cid in content_ids if cid in completed_ids])
        rows.append(
            {
                'subject': chapter.subject.name,
                'chapter': chapter.name,
                'total': len(content_ids),
                'done': done,
                'percent': round(done * 100 / len(content_ids)),
            }
        )
    return rows


def _quiz_performance(student, course):
    """Recent quiz accuracy plus the topics the student most often gets wrong."""
    from analytics.models import TopicMastery
    from quiz.models import QuizAttempt

    attempts = QuizAttempt.objects.filter(
        student=student, quiz__course=course, status='completed'
    ).select_related('quiz')

    recent = attempts.order_by('-completed_at')[:10]
    total_q = sum(a.total_questions for a in recent)
    correct = sum(a.correct_answers for a in recent)

    weak = (
        TopicMastery.objects.filter(
            student=student,
            topic__subject__course=course,
            total_questions_attempted__gt=0,
        )
        .select_related('topic', 'topic__subject')
        .order_by('accuracy_percentage')[:MAX_WEAK_TOPICS]
    )

    return {
        'attempts': attempts.count(),
        'recent_accuracy': round(correct * 100 / total_q) if total_q else None,
        'weak_topics': [
            {
                'topic': m.topic.name,
                'subject': m.topic.subject.name,
                'accuracy': round(float(m.accuracy_percentage)),
                'attempted': m.total_questions_attempted,
            }
            for m in weak
            if float(m.accuracy_percentage) < 75
        ],
    }


def _recent_activity(student, course):
    from content.models import ContentProgress

    week_ago = timezone.now() - timedelta(days=7)
    return ContentProgress.objects.filter(
        student=student, content__courses=course, updated_at__gte=week_ago
    ).count()


def build_course_snapshot(student, course):
    """Structured snapshot of a student's standing in one course."""
    total_content, completed_content = _content_progress(student, course)
    chapters = _chapter_breakdown(student, course)
    performance = _quiz_performance(student, course)

    subjects = list(
        course.subjects.order_by('order').values_list('name', flat=True)[:MAX_SUBJECTS]
    )

    return {
        'course_name': course.name,
        'course_type': course.get_course_type_display(),
        'subjects': subjects,
        'total_content': total_content,
        'completed_content': completed_content,
        'completion_percent': (
            round(completed_content * 100 / total_content) if total_content else 0
        ),
        'chapters': chapters,
        'performance': performance,
        'active_last_week': _recent_activity(student, course),
    }


def render_course_context(snapshot):
    """Render a snapshot as the compact prompt block the model reads."""
    lines = [
        '## Student course context (authoritative — prefer this over guessing)',
        f"Course: {snapshot['course_name']} ({snapshot['course_type']})",
    ]
    if snapshot['subjects']:
        lines.append('Subjects: ' + ', '.join(snapshot['subjects']))

    if snapshot['total_content']:
        lines.append(
            f"Overall completion: {snapshot['completion_percent']}% "
            f"({snapshot['completed_content']} of {snapshot['total_content']} study items done)"
        )
    else:
        lines.append('Overall completion: no published study material yet.')

    pending = [c for c in snapshot['chapters'] if c['percent'] < 100]
    finished = [c for c in snapshot['chapters'] if c['percent'] == 100]

    if finished:
        lines.append(
            'Completed chapters: '
            + ', '.join(f"{c['subject']} → {c['chapter']}" for c in finished[:MAX_CHAPTERS_LISTED])
            + (f" (+{len(finished) - MAX_CHAPTERS_LISTED} more)" if len(finished) > MAX_CHAPTERS_LISTED else '')
        )
    if pending:
        lines.append('Pending / in-progress chapters:')
        for c in pending[:MAX_CHAPTERS_LISTED]:
            lines.append(
                f"  - {c['subject']} → {c['chapter']}: {c['percent']}% done "
                f"({c['total'] - c['done']} item(s) left)"
            )
        if len(pending) > MAX_CHAPTERS_LISTED:
            lines.append(f'  - …and {len(pending) - MAX_CHAPTERS_LISTED} more chapters not started')

    perf = snapshot['performance']
    if perf['attempts']:
        accuracy = perf['recent_accuracy']
        lines.append(
            f"Quizzes attempted in this course: {perf['attempts']}"
            + (f'; recent accuracy {accuracy}%' if accuracy is not None else '')
        )
    else:
        lines.append('Quizzes attempted in this course: none yet.')

    if perf['weak_topics']:
        lines.append('Topics with the most mistakes (weakest first):')
        for w in perf['weak_topics']:
            lines.append(
                f"  - {w['subject']} → {w['topic']}: {w['accuracy']}% accuracy "
                f"over {w['attempted']} question(s)"
            )

    lines.append(f"Study items touched in the last 7 days: {snapshot['active_last_week']}")
    lines.append(
        'Use these facts when the student asks about their progress, what is pending, '
        'or where they are going wrong. Never invent chapters, scores or topics that '
        'are not listed above; if something is not covered here, say so plainly.'
    )
    return '\n'.join(lines)


def course_context_for(student, course):
    """Convenience wrapper: snapshot → rendered prompt block.

    Re-checks eligibility at send time. A conversation can outlive the access
    that created it — the course may be deactivated or the enrollment revoked
    weeks later — and we should stop feeding that course's data to the model
    the moment that happens, not just when the chat was first scoped.
    """
    from .work_context import work_context_for

    if enrolled_course_or_none(student, course.id) is None:
        return ''

    block = render_course_context(build_course_snapshot(student, course))

    # Question-, assignment- and code-level detail, so the assistant can talk
    # about actual mistakes and failures rather than just percentages.
    try:
        work = work_context_for(student, course)
    except Exception:  # noqa: BLE001 - detail is a bonus, never break the chat
        logger.exception('Failed to build work context for course %s', course.id)
        work = ''

    return f'{block}\n{work}' if work else block


def starter_prompts(student, course=None):
    """Suggested opening prompts, tailored to the student's real situation.

    With a course selected the suggestions reference that course's actual
    pending chapters and weak topics; without one they cover the student's
    enrolled courses generally. Each entry is ``{text, kind}`` where ``kind``
    drives the icon shown in the UI.
    """
    if course is None:
        courses = [e.course for e in enrolled_courses(student)[:3]]
        if not courses:
            return [
                {'text': 'How do I get started on this platform?', 'kind': 'idea'},
                {'text': 'Explain a concept I should learn first', 'kind': 'idea'},
                {'text': 'Give me a study plan for this week', 'kind': 'plan'},
                {'text': 'Quiz me on general aptitude', 'kind': 'quiz'},
            ]
        prompts = []
        for c in courses:
            prompts.append({'text': f'How am I doing in {c.name}?', 'kind': 'progress'})
        prompts.append(
            {'text': f'What should I study next in {courses[0].name}?', 'kind': 'plan'}
        )
        prompts.append(
            {'text': f'Quiz me on a weak topic from {courses[0].name}', 'kind': 'quiz'}
        )
        prompts.append({'text': 'Summarise my mistakes from recent quizzes', 'kind': 'mistakes'})
        return prompts[:6]

    snapshot = build_course_snapshot(student, course)
    prompts = [
        {'text': f"How much of {course.name} have I completed?", 'kind': 'progress'},
    ]

    pending = [c for c in snapshot['chapters'] if c['percent'] < 100]
    if pending:
        first = pending[0]
        prompts.append(
            {'text': f"What's still pending in {first['subject']}?", 'kind': 'pending'}
        )
        prompts.append(
            {'text': f"Explain the key ideas of {first['chapter']}", 'kind': 'idea'}
        )
    else:
        prompts.append({'text': f'What should I revise in {course.name}?', 'kind': 'pending'})

    weak = snapshot['performance']['weak_topics']
    quiz_prompt = None
    if weak:
        prompts.append(
            {'text': f"Why do I keep getting {weak[0]['topic']} wrong?", 'kind': 'mistakes'}
        )
        quiz_prompt = {'text': f"Quiz me on {weak[0]['topic']}", 'kind': 'quiz'}
    else:
        prompts.append({'text': 'Where am I making the most mistakes?', 'kind': 'mistakes'})
        if snapshot['subjects']:
            quiz_prompt = {'text': f"Quiz me on {snapshot['subjects'][0]}", 'kind': 'quiz'}

    # Only offer these when the student actually has such work — a prompt that
    # leads to "you have no assignments" is worse than no prompt at all.
    try:
        from .work_context import assignment_status, coding_status

        assignments = assignment_status(student, course)
        missing = [r for r in assignments['rows'] if r['state'] == 'not_submitted']
        if missing:
            overdue = [r for r in missing if r['overdue']]
            prompts.append(
                {
                    'text': (
                        'Which assignments am I overdue on?'
                        if overdue
                        else 'What assignments do I still owe?'
                    ),
                    'kind': 'pending',
                }
            )

        coding = coding_status(student, course)
        if coding['rows']:
            prompts.append(
                {
                    'text': f"Why is my {coding['rows'][0]['title']} solution failing?",
                    'kind': 'mistakes',
                }
            )
    except Exception:  # pragma: no cover - suggestions must never break the page
        logger.exception('starter_prompts: work context lookup failed')

    # Concrete outstanding work beats a generic quiz suggestion, so the quiz and
    # study-plan prompts are only added once the actionable ones are in.
    if quiz_prompt:
        prompts.append(quiz_prompt)
    prompts.append({'text': f'Build me a 7-day study plan for {course.name}', 'kind': 'plan'})
    return prompts[:6]
