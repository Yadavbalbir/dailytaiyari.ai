"""Draft shapes for the AI Course Builder, and the normalisers that enforce them.

An LLM is a best-effort JSON producer, not a validator. Everything it returns
passes through here first, so the rest of the system (preview, editor, apply)
only ever deals with a draft that is *structurally guaranteed*: codes are unique
slugs, list lengths are clamped, enums are real choices, and every quiz question
has a correct option that actually exists.

The same normalisers run again when an admin hand-edits a draft, so a typed edit
can't produce something the apply step would choke on.
"""
from __future__ import annotations

import re

from django.utils.text import slugify

from content.models import Content
from exams.models import Course, Topic
from quiz.models import Question

from .notehtml import BLOCK_TYPES, CALLOUT_VARIANTS, estimate_reading_minutes, render_blocks

# Hard ceilings. They exist so one over-eager prompt can't produce a draft that
# takes minutes to review or thousands of rows to apply.
MAX_SUBJECTS = 12
MAX_CHAPTERS_PER_SUBJECT = 30
MAX_TOPICS_PER_CHAPTER = 30
MAX_TOPICS_PER_CONTENT_JOB = 12
MAX_QUESTIONS_PER_QUIZ = 20
MAX_BLOCKS_PER_NOTE = 60
MAX_HIGHLIGHTS = 10

COURSE_TYPES = {value for value, _label in Course.COURSE_TYPES}
TOPIC_DIFFICULTIES = {value for value, _label in Topic.DIFFICULTY_CHOICES}
TOPIC_IMPORTANCE = {value for value, _label in Topic.IMPORTANCE_CHOICES}
QUESTION_DIFFICULTIES = {value for value, _label in Question.DIFFICULTY_CHOICES}
CONTENT_DIFFICULTIES = {value for value, _label in Content.DIFFICULTY_CHOICES}


def _text(value, limit, default=''):
    if value is None:
        return default
    cleaned = ' '.join(str(value).split())
    return cleaned[:limit] if cleaned else default


def _long_text(value, limit=6000, default=''):
    if value is None:
        return default
    cleaned = str(value).strip()
    return cleaned[:limit] if cleaned else default


def _choice(value, allowed, default):
    candidate = str(value or '').strip().lower().replace(' ', '_')
    return candidate if candidate in allowed else default


def _number(value, default, minimum, maximum):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, round(number, 2)))


def _code(value, fallback, used, limit=50):
    """A unique, URL-safe code within ``used`` (which this call mutates)."""
    base = slugify(str(value or '')) or slugify(str(fallback or '')) or 'item'
    base = base[:limit].strip('-') or 'item'
    candidate = base
    suffix = 2
    while candidate in used:
        tail = f'-{suffix}'
        candidate = f'{base[:limit - len(tail)]}{tail}'
        suffix += 1
    used.add(candidate)
    return candidate


def _string_list(value, limit, item_limit=200):
    if not isinstance(value, list):
        return []
    out = []
    for item in value[:limit]:
        cleaned = _text(item, item_limit)
        if cleaned:
            out.append(cleaned)
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Outline draft
# ─────────────────────────────────────────────────────────────────────────────

def normalize_outline(payload, *, existing_course=None):
    """Coerce a model's outline JSON into the canonical outline draft."""
    payload = payload if isinstance(payload, dict) else {}
    raw_course = payload.get('course') if isinstance(payload.get('course'), dict) else {}

    course_codes = set()
    course = {
        'name': _text(raw_course.get('name'), 200, default='Untitled course'),
        'subtitle': _text(raw_course.get('subtitle'), 255),
        'description': _long_text(raw_course.get('description'), 4000),
        'course_type': _choice(raw_course.get('course_type'), COURSE_TYPES, 'skill'),
        'highlights': _string_list(raw_course.get('highlights'), MAX_HIGHLIGHTS, 200),
        'audience': _text(raw_course.get('audience'), 300),
        'level': _text(raw_course.get('level'), 60),
        'estimated_hours': _number(raw_course.get('estimated_hours'), 0, 0, 2000),
    }
    course['code'] = _code(raw_course.get('code'), course['name'], course_codes)

    # Extending an existing course: keep its identity, only the tree is new.
    if existing_course is not None:
        course['name'] = existing_course.name
        course['code'] = existing_course.code
        course['course_type'] = existing_course.course_type

    subjects = []
    subject_codes = set()
    raw_subjects = payload.get('subjects') if isinstance(payload.get('subjects'), list) else []
    for subject_index, raw_subject in enumerate(raw_subjects[:MAX_SUBJECTS]):
        if not isinstance(raw_subject, dict):
            continue
        name = _text(raw_subject.get('name'), 200, default=f'Module {subject_index + 1}')
        subject = {
            'name': name,
            'code': _code(raw_subject.get('code'), name, subject_codes),
            'description': _long_text(raw_subject.get('description'), 1500),
            'weightage': _number(raw_subject.get('weightage'), 0, 0, 100),
            'order': subject_index,
            'chapters': [],
        }

        chapter_codes = set()
        raw_chapters = raw_subject.get('chapters')
        raw_chapters = raw_chapters if isinstance(raw_chapters, list) else []
        for chapter_index, raw_chapter in enumerate(raw_chapters[:MAX_CHAPTERS_PER_SUBJECT]):
            if not isinstance(raw_chapter, dict):
                continue
            chapter_name = _text(
                raw_chapter.get('name'), 300, default=f'Chapter {chapter_index + 1}'
            )
            chapter = {
                'name': chapter_name,
                'code': _code(raw_chapter.get('code'), chapter_name, chapter_codes, limit=100),
                'description': _long_text(raw_chapter.get('description'), 1500),
                'estimated_hours': _number(raw_chapter.get('estimated_hours'), 2.0, 0.5, 200),
                'order': chapter_index,
                'topics': [],
            }

            topic_codes = set()
            raw_topics = raw_chapter.get('topics')
            raw_topics = raw_topics if isinstance(raw_topics, list) else []
            for topic_index, raw_topic in enumerate(raw_topics[:MAX_TOPICS_PER_CHAPTER]):
                if isinstance(raw_topic, str):
                    raw_topic = {'name': raw_topic}
                if not isinstance(raw_topic, dict):
                    continue
                topic_name = _text(
                    raw_topic.get('name'), 300, default=f'Topic {topic_index + 1}'
                )
                chapter['topics'].append({
                    'name': topic_name,
                    'code': _code(raw_topic.get('code'), topic_name, topic_codes, limit=100),
                    'summary': _long_text(raw_topic.get('summary'), 800),
                    'difficulty': _choice(
                        raw_topic.get('difficulty'), TOPIC_DIFFICULTIES, 'medium'
                    ),
                    'importance': _choice(
                        raw_topic.get('importance'), TOPIC_IMPORTANCE, 'medium'
                    ),
                    'estimated_study_hours': _number(
                        raw_topic.get('estimated_study_hours'), 1.0, 0.1, 40
                    ),
                    'objectives': _string_list(raw_topic.get('objectives'), 8, 240),
                    'order': topic_index,
                })

            if chapter['topics']:
                subject['chapters'].append(chapter)

        if subject['chapters']:
            subjects.append(subject)

    return {'course': course, 'subjects': subjects, 'stats': outline_stats(subjects)}


def outline_stats(subjects):
    chapters = sum(len(s.get('chapters') or []) for s in subjects or [])
    topics = sum(
        len(c.get('topics') or [])
        for s in subjects or []
        for c in s.get('chapters') or []
    )
    return {'subjects': len(subjects or []), 'chapters': chapters, 'topics': topics}


# ─────────────────────────────────────────────────────────────────────────────
# Content draft (notes + quiz per topic)
# ─────────────────────────────────────────────────────────────────────────────

def normalize_blocks(raw_blocks):
    """Clamp and sanitise the note blocks the model produced."""
    if not isinstance(raw_blocks, list):
        return []
    blocks = []
    for raw in raw_blocks[:MAX_BLOCKS_PER_NOTE]:
        if isinstance(raw, str):
            raw = {'type': 'paragraph', 'text': raw}
        if not isinstance(raw, dict):
            continue
        kind = str(raw.get('type') or 'paragraph').strip().lower()
        # Accept the model's common aliases, but store the canonical name.
        kind = {
            'h': 'heading', 'h2': 'heading', 'h3': 'heading', 'h4': 'heading',
            'p': 'paragraph', 'text': 'paragraph',
            'ul': 'bullets', 'list': 'bullets',
            'ol': 'numbers', 'steps': 'numbers',
            'pre': 'code', 'hr': 'divider', 'blockquote': 'quote',
        }.get(kind, kind)
        if kind not in BLOCK_TYPES:
            kind = 'paragraph'

        block = {'type': kind}
        if kind in ('bullets', 'numbers'):
            block['items'] = _string_list(raw.get('items'), 15, 500)
            if not block['items']:
                continue
        elif kind == 'table':
            headers = _string_list(raw.get('headers'), 6, 120)
            rows = []
            for row in (raw.get('rows') or [])[:15]:
                if isinstance(row, list):
                    rows.append([_text(cell, 240) for cell in row[:6]])
            if not headers or not rows:
                continue
            block['headers'] = headers
            block['rows'] = rows
        elif kind == 'divider':
            pass
        else:
            text = _long_text(raw.get('text') or raw.get('content'), 4000)
            if not text:
                continue
            block['text'] = text
            if kind == 'heading':
                try:
                    block['level'] = min(4, max(2, int(raw.get('level') or 3)))
                except (TypeError, ValueError):
                    block['level'] = 3
            elif kind == 'code':
                block['language'] = _text(raw.get('language'), 30)
                # Code must keep its whitespace — re-read it unsquashed.
                block['text'] = str(raw.get('text') or raw.get('content') or '')[:4000]
            elif kind == 'callout':
                variant = str(raw.get('variant') or 'note').strip().lower()
                block['variant'] = variant if variant in CALLOUT_VARIANTS else 'note'
                title = _text(raw.get('title'), 80)
                if title:
                    block['title'] = title
            elif kind == 'quote':
                attribution = _text(raw.get('attribution'), 120)
                if attribution:
                    block['attribution'] = attribution
        blocks.append(block)
    return blocks


def normalize_question(raw, index=0):
    """One MCQ, guaranteed to have ≥2 options and a valid correct index."""
    if not isinstance(raw, dict):
        return None
    text = _long_text(raw.get('question_text') or raw.get('question'), 2000)
    if not text:
        return None

    options = []
    for option in (raw.get('options') or [])[:6]:
        if isinstance(option, dict):
            option = option.get('text') or option.get('option_text')
        cleaned = _long_text(option, 500)
        if cleaned:
            options.append(cleaned)
    # De-duplicate while preserving order; identical options make a broken MCQ.
    seen = set()
    options = [o for o in options if not (o.lower() in seen or seen.add(o.lower()))]
    if len(options) < 2:
        return None

    try:
        correct = int(raw.get('correct_option', raw.get('correct_index', 0)))
    except (TypeError, ValueError):
        correct = 0
    if not 0 <= correct < len(options):
        correct = 0

    return {
        'question_text': text,
        'options': options,
        'correct_option': correct,
        'explanation': _long_text(raw.get('explanation'), 2000),
        'difficulty': _choice(raw.get('difficulty'), QUESTION_DIFFICULTIES, 'medium'),
        'concept': _text(raw.get('concept') or raw.get('topic'), 200),
        'order': index,
    }


def normalize_topic_content(raw, *, fallback_name='Topic'):
    """One topic's note + quiz, with the note pre-rendered for preview."""
    raw = raw if isinstance(raw, dict) else {}
    topic_name = _text(raw.get('topic_name') or raw.get('name'), 300, default=fallback_name)

    raw_note = raw.get('note') if isinstance(raw.get('note'), dict) else {}
    blocks = normalize_blocks(raw_note.get('blocks') or raw.get('blocks'))
    note = {
        'title': _text(raw_note.get('title'), 500, default=topic_name),
        'blocks': blocks,
        # Rendered server-side so the preview shows exactly what will be saved.
        'html': render_blocks(blocks),
        'estimated_time_minutes': estimate_reading_minutes(blocks),
        'difficulty': _choice(
            raw_note.get('difficulty'), CONTENT_DIFFICULTIES, 'intermediate'
        ),
        'include': bool(blocks),
    }

    raw_quiz = raw.get('quiz') if isinstance(raw.get('quiz'), dict) else {}
    raw_questions = raw_quiz.get('questions')
    if not isinstance(raw_questions, list):
        raw_questions = raw.get('questions') if isinstance(raw.get('questions'), list) else []
    questions = []
    for index, raw_question in enumerate(raw_questions[:MAX_QUESTIONS_PER_QUIZ]):
        question = normalize_question(raw_question, index=len(questions))
        if question:
            questions.append(question)
    quiz = {
        'title': _text(raw_quiz.get('title'), 300, default=f'{topic_name} Quiz'),
        'duration_minutes': int(_number(raw_quiz.get('duration_minutes'), 10, 1, 180)),
        'questions': questions,
        'include': bool(questions),
    }

    return {
        'topic_id': _text(raw.get('topic_id'), 64) or None,
        'topic_name': topic_name,
        'topic_code': _text(raw.get('topic_code'), 100),
        'note': note,
        'quiz': quiz,
    }


def normalize_content(payload, *, requested_topics=None):
    """Coerce a model's content JSON into the canonical content draft.

    ``requested_topics`` is the list of ``{'id', 'name', 'code'}`` the admin
    asked for; it is used to re-attach topic ids the model may have dropped or
    hallucinated, so an apply always writes against topics we chose.
    """
    payload = payload if isinstance(payload, dict) else {}
    raw_topics = payload.get('topics')
    if not isinstance(raw_topics, list):
        # A single-topic response is common — accept it rather than fail.
        raw_topics = [payload] if payload.get('note') or payload.get('blocks') else []

    requested = list(requested_topics or [])
    by_code = {str(t.get('code')): t for t in requested if t.get('code')}
    by_name = {str(t.get('name', '')).strip().lower(): t for t in requested if t.get('name')}

    topics = []
    for index, raw_topic in enumerate(raw_topics[:MAX_TOPICS_PER_CONTENT_JOB]):
        fallback = requested[index] if index < len(requested) else {}
        entry = normalize_topic_content(
            raw_topic, fallback_name=fallback.get('name') or f'Topic {index + 1}'
        )

        # Re-anchor to a topic we actually asked for: match by code, then name,
        # then position. Never trust a model-supplied id on its own.
        match = (
            by_code.get(entry['topic_code'])
            or by_name.get(entry['topic_name'].strip().lower())
            or fallback
        )
        if match:
            entry['topic_id'] = str(match.get('id')) if match.get('id') else None
            entry['topic_name'] = match.get('name') or entry['topic_name']
            entry['topic_code'] = match.get('code') or entry['topic_code']
        if entry['note']['blocks'] or entry['quiz']['questions']:
            topics.append(entry)

    return {'topics': topics, 'stats': content_stats(topics)}


def content_stats(topics):
    notes = sum(1 for t in topics or [] if (t.get('note') or {}).get('include'))
    quizzes = sum(1 for t in topics or [] if (t.get('quiz') or {}).get('include'))
    questions = sum(
        len((t.get('quiz') or {}).get('questions') or [])
        for t in topics or []
        if (t.get('quiz') or {}).get('include')
    )
    return {
        'topics': len(topics or []),
        'notes': notes,
        'quizzes': quizzes,
        'questions': questions,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Course meta draft
# ─────────────────────────────────────────────────────────────────────────────

def normalize_meta(payload):
    payload = payload if isinstance(payload, dict) else {}
    raw = payload.get('course') if isinstance(payload.get('course'), dict) else payload
    blocks = normalize_blocks(raw.get('description_blocks'))
    description = _long_text(raw.get('description'), 6000)
    return {
        'course': {
            'subtitle': _text(raw.get('subtitle'), 255),
            'description': description,
            'description_blocks': blocks,
            'description_html': render_blocks(blocks) if blocks else '',
            'highlights': _string_list(raw.get('highlights'), MAX_HIGHLIGHTS, 200),
            'refund_policy': _long_text(raw.get('refund_policy'), 2000),
        }
    }


NORMALIZERS = {
    'outline': normalize_outline,
    'content': normalize_content,
    'meta': lambda payload, **kwargs: normalize_meta(payload),
}


def normalize_draft(kind, payload, **kwargs):
    """Normalise ``payload`` for ``kind``; unknown kinds return an empty draft."""
    normalizer = NORMALIZERS.get(kind)
    if normalizer is None:
        return {}
    return normalizer(payload, **kwargs)


_SAFE_KEY = re.compile(r'^[a-z_]+$')


def draft_summary(kind, draft):
    """One-line counts for list views and confirmation dialogs."""
    draft = draft or {}
    if kind == 'outline':
        return draft.get('stats') or outline_stats(draft.get('subjects'))
    if kind == 'content':
        return draft.get('stats') or content_stats(draft.get('topics'))
    if kind == 'meta':
        course = draft.get('course') or {}
        return {'fields': sum(1 for key, value in course.items() if value and _SAFE_KEY.match(key))}
    return {}
