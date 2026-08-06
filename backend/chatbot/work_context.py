"""Question-, assignment- and code-level detail for a course-scoped chat.

:mod:`chatbot.course_context` answers "how far along is this student?" — this
module answers "what exactly did they get wrong?".

Progress percentages are enough for "what's pending", but useless the moment a
student asks *"what mistakes did I make?"* or *"why is my code failing?"*. That
needs the actual wrong answers, the actual grader feedback, and the actual
failing test cases.

Everything here is deliberately **actionable-only** and tightly capped. This
block is re-sent with every message in the conversation, so listing work the
student has already nailed is a recurring token cost for no benefit. We list
what is wrong, overdue, unsubmitted or failing, and summarise the rest as
counts.
"""
from __future__ import annotations

from django.utils import timezone

# Caps chosen to keep this whole block a few hundred tokens.
MAX_WRONG_QUESTIONS = 6
MAX_ASSIGNMENTS = 6
MAX_CODING = 5
MAX_RECENT_ATTEMPTS = 5

QUESTION_CHARS = 180
EXPLANATION_CHARS = 220
FEEDBACK_CHARS = 200
ERROR_CHARS = 200


def _clip(text, limit):
    """Single-line, length-capped text — prompts hate stray newlines."""
    if not text:
        return ''
    flat = ' '.join(str(text).split())
    return flat if len(flat) <= limit else flat[: limit - 1].rstrip() + '…'


def _option_label(question, value):
    """Human-readable label for a stored option value.

    ``Answer.selected_option`` and ``Question.correct_answer`` hold either an
    option index or a raw value (see ``Answer.check_answer``), so resolve
    whichever we were given back to the option text the student actually saw.
    """
    if value in (None, ''):
        return 'no answer'

    raw = str(value).strip()
    options = list(question.options.order_by('order'))

    if raw.isdigit() and options:
        index = int(raw)
        if 0 <= index < len(options):
            return f'{chr(65 + index)}) {_clip(options[index].option_text, 90)}'

    for position, option in enumerate(options):
        if str(option.option_text).strip() == raw:
            return f'{chr(65 + position)}) {_clip(option.option_text, 90)}'

    return _clip(raw, 90)


def recent_mistakes(student, course, limit=MAX_WRONG_QUESTIONS):
    """The student's most recent wrong answers, with what they picked and why.

    This is what makes "what did I get wrong?" answerable instead of the
    assistant apologising that it only has aggregate accuracy.
    """
    from quiz.models import Answer

    wrong = (
        Answer.objects.filter(
            quiz_attempt__student=student,
            quiz_attempt__quiz__course=course,
            quiz_attempt__status='completed',
            is_correct=False,
        )
        .exclude(selected_option='', answer_text='')
        .select_related('question', 'question__topic', 'question__subject', 'quiz_attempt__quiz')
        .prefetch_related('question__options')
        .order_by('-created_at')[:limit]
    )

    rows = []
    for answer in wrong:
        question = answer.question
        rows.append(
            {
                'quiz': question and answer.quiz_attempt.quiz.title,
                'subject': question.subject.name if question.subject_id else '',
                'topic': question.topic.name if question.topic_id else '',
                'question': _clip(question.question_text, QUESTION_CHARS),
                'chose': _option_label(question, answer.selected_option or answer.answer_text),
                'correct': _option_label(question, question.correct_answer),
                'explanation': _clip(question.explanation, EXPLANATION_CHARS),
            }
        )
    return rows


def assignment_status(student, course):
    """Per-assignment standing, biased toward what still needs action."""
    from assignments.models import Assignment, AssignmentSubmission

    assignments = (
        Assignment.objects.filter(course=course, status='published')
        .select_related('topic', 'subject')
        .order_by('due_at', 'order')
    )
    if not assignments:
        return {'total': 0, 'submitted': 0, 'graded': 0, 'rows': []}

    submissions = {
        s.assignment_id: s
        for s in AssignmentSubmission.objects.filter(
            student=student, assignment__in=assignments
        ).select_related('assignment')
    }

    now = timezone.now()
    rows, submitted, graded = [], 0, 0

    for assignment in assignments:
        submission = submissions.get(assignment.id)
        if submission:
            submitted += 1
            if submission.status == 'graded':
                graded += 1

        overdue = bool(assignment.due_at and assignment.due_at < now and not submission)

        # Only surface rows the student can still act on: anything missing, and
        # anything graded (where the feedback is the teaching opportunity).
        if submission and submission.status != 'graded':
            continue

        row = {
            'title': assignment.title,
            'topic': assignment.topic.name if assignment.topic_id else '',
            'due': assignment.due_at.strftime('%d %b') if assignment.due_at else '',
            'overdue': overdue,
            'max_marks': assignment.max_marks,
        }
        if submission:
            row.update(
                {
                    'state': 'graded',
                    'marks': (
                        float(submission.marks) if submission.marks is not None else None
                    ),
                    'feedback': _clip(submission.feedback, FEEDBACK_CHARS),
                }
            )
        else:
            row['state'] = 'not_submitted'
        rows.append(row)

    return {
        'total': len(assignments),
        'submitted': submitted,
        'graded': graded,
        'rows': rows[:MAX_ASSIGNMENTS],
    }


def _failure_summary(submission):
    """Why a coding submission failed, in a few words the model can reason on."""
    if submission.compile_output:
        return 'compile error', _clip(submission.compile_output, ERROR_CHARS)

    failures = [
        result
        for result in (submission.results or [])
        if result.get('verdict') and result.get('verdict') != 'passed'
    ]
    if not failures:
        return '', ''

    verdicts = [result['verdict'] for result in failures]
    # Most common failure mode first — that is the one worth explaining.
    dominant = max(set(verdicts), key=verdicts.count)

    # Take the error text from a case that actually failed this way, otherwise
    # we would pair (say) a timeout's output with a "wrong answer" diagnosis.
    error = next(
        (
            _clip(result.get('stderr'), ERROR_CHARS)
            for result in failures
            if result['verdict'] == dominant and result.get('stderr')
        ),
        '',
    )
    return dominant.replace('_', ' '), error


def coding_status(student, course):
    """Coding practice standing, focused on problems that are still failing."""
    from coding.models import CodingProblem, CodingSubmission

    problems = CodingProblem.objects.filter(course=course, status='published')
    if not problems:
        return {'total': 0, 'attempted': 0, 'solved': 0, 'rows': []}

    submissions = (
        CodingSubmission.objects.filter(student=student, problem__in=problems)
        .select_related('problem')
        .order_by('problem_id', '-submitted_at')
    )

    best = {}
    for submission in submissions:
        current = best.get(submission.problem_id)
        # Keep the strongest attempt per problem, tie-broken by recency.
        if current is None or submission.passed_count > current.passed_count:
            best[submission.problem_id] = submission

    rows, solved = [], 0
    for problem_id, submission in best.items():
        problem = submission.problem
        is_solved = (
            submission.total_count > 0 and submission.passed_count == submission.total_count
        )
        if is_solved:
            solved += 1
            continue

        reason, error = _failure_summary(submission)
        rows.append(
            {
                'title': problem.title,
                'difficulty': problem.get_difficulty_display(),
                'passed': submission.passed_count,
                'total': submission.total_count,
                'language': submission.language,
                'reason': reason,
                'error': error,
            }
        )

    unattempted = problems.exclude(id__in=best.keys()).count()

    return {
        'total': problems.count(),
        'attempted': len(best),
        'solved': solved,
        'unattempted': unattempted,
        'rows': rows[:MAX_CODING],
    }


def pending_content(student, course, max_items=8):
    """The next unfinished study items by name.

    The course snapshot says a chapter is "40% done"; this says *which* lessons
    are actually left, so "what should I do next?" gets a concrete answer the
    student can act on rather than a percentage.
    """
    from content.models import Content, ContentProgress

    completed_ids = set(
        ContentProgress.objects.filter(
            student=student, is_completed=True, content__courses=course
        ).values_list('content_id', flat=True)
    )

    items = (
        Content.objects.filter(courses=course, status='published')
        .exclude(id__in=completed_ids)
        .select_related('topic', 'topic__subject')
        .distinct()
        .order_by('topic__subject__order', 'topic__order', 'order')[: max_items * 3]
    )

    # Courses often carry near-identical items (e.g. two "Complete Notes" rows
    # for one topic). Listing both wastes prompt space and reads like a glitch.
    rows, seen = [], set()
    for item in items:
        key = (item.title.strip().lower(), item.content_type)
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                'title': _clip(item.title, 90),
                'type': item.get_content_type_display(),
                'topic': item.topic.name if item.topic_id else '',
                'subject': (
                    item.topic.subject.name if item.topic_id and item.topic.subject_id else ''
                ),
            }
        )
        if len(rows) >= max_items:
            break
    return rows


def build_work_snapshot(student, course):
    """Everything this module knows, as one structured dict."""
    return {
        'next_items': pending_content(student, course),
        'mistakes': recent_mistakes(student, course),
        'assignments': assignment_status(student, course),
        'coding': coding_status(student, course),
    }


def render_work_context(snapshot):
    """Render the snapshot as prompt lines, or ``''`` when there is nothing."""
    lines = []

    next_items = snapshot.get('next_items') or []
    if next_items:
        lines.append('')
        lines.append('### Next unfinished study items (in course order)')
        for item in next_items:
            where = ' → '.join(p for p in (item['subject'], item['topic']) if p)
            lines.append(f"  - {item['title']} ({item['type']})" + (f' — {where}' if where else ''))

    mistakes = snapshot['mistakes']
    if mistakes:
        lines.append('')
        lines.append('### Recent wrong answers (most recent first)')
        for m in mistakes:
            where = ' → '.join(p for p in (m['subject'], m['topic']) if p)
            lines.append(f"  - [{where or 'General'}] {m['question']}")
            lines.append(f"      student answered: {m['chose']}  |  correct: {m['correct']}")
            if m['explanation']:
                lines.append(f"      official explanation: {m['explanation']}")
    else:
        lines.append('')
        lines.append('### Recent wrong answers: none recorded.')

    assignments = snapshot['assignments']
    if assignments['total']:
        lines.append('')
        lines.append(
            f"### Assignments: {assignments['submitted']} of {assignments['total']} submitted, "
            f"{assignments['graded']} graded"
        )
        for row in assignments['rows']:
            if row['state'] == 'not_submitted':
                flag = ' — OVERDUE' if row['overdue'] else ''
                due = f" (due {row['due']})" if row['due'] else ''
                lines.append(f"  - NOT SUBMITTED: {row['title']}{due}{flag}")
            else:
                score = (
                    f" scored {row['marks']:g}/{row['max_marks']}"
                    if row['marks'] is not None and row['max_marks']
                    else ''
                )
                lines.append(f"  - graded: {row['title']}{score}")
                if row['feedback']:
                    lines.append(f"      teacher feedback: {row['feedback']}")

    coding = snapshot['coding']
    if coding['total']:
        lines.append('')
        lines.append(
            f"### Coding practice: {coding['solved']} solved, {coding['attempted']} attempted, "
            f"{coding.get('unattempted', 0)} not started (of {coding['total']})"
        )
        for row in coding['rows']:
            detail = f"  - FAILING: {row['title']} ({row['difficulty']}) — "
            detail += f"{row['passed']}/{row['total']} test cases passing"
            if row['reason']:
                detail += f", mostly {row['reason']}"
            lines.append(detail)
            if row['error']:
                lines.append(f"      error output: {row['error']}")

    return '\n'.join(lines)


def work_context_for(student, course):
    """Convenience wrapper: snapshot → rendered prompt block."""
    return render_work_context(build_work_snapshot(student, course))
