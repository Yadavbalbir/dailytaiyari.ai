"""
Deep-copy (clone) a course and its entire authored-content graph.

Used by the admin Course Builder's "Copy" action. A copy duplicates the whole
graph with brand-new primary keys under the **same tenant**, leaving the source
course untouched. The clone is fully independent — every new row is a real new
object, never a pointer back to the source.

Authored content only is cloned; student-generated data (enrollments, attempts,
answers, submissions, completions) is deliberately excluded so the copy starts
fresh.

Graph (dependency order):

    exams.Course
      -> exams.Subject
           -> exams.Topic (self-FK parent_topic)
           -> exams.Chapter
                -> exams.ChapterTopic
           -> content.Content            (unique slug + M2M courses)
           -> quiz.Question              (M2M courses)
                -> quiz.QuestionOption
      -> exams.TopicCourseRelevance
      -> quiz.Quiz
           -> quiz.QuizQuestion
      -> quiz.MockTest                   (M2M courses, sections JSON w/ subject_id)
           -> quiz.MockTestQuestion
           -> quiz.MockTestItem
      -> coding.CodingProblem
           -> coding.TestCase
      -> assignments.Assignment
      -> liveclass.LiveClass
"""
from django.db import transaction
from django.utils.text import slugify


def _unique_course_code(base_source_code, new_name):
    """Return a globally-unique Course.code derived from the new name."""
    from .models import Course

    base = slugify(new_name) or f"{base_source_code}-copy"
    code = base
    i = 1
    while Course.objects.filter(code=code).exists():
        i += 1
        code = f"{base}-{i}"
    # Course.code is max_length=50.
    return code[:50]


def _unique_content_slug(base_slug):
    """Return a globally-unique Content.slug (Content.slug is unique)."""
    from content.models import Content

    base = (slugify(base_slug) or 'content')[:480]
    slug = base
    i = 1
    while Content.objects.filter(slug=slug).exists():
        i += 1
        slug = f"{base}-{i}"
    return slug[:500]


def _clone(obj, tenant, **overrides):
    """Reset a fetched instance for insertion as a brand-new row and save it."""
    obj.pk = None
    obj.id = None
    obj._state.adding = True
    if hasattr(obj, 'tenant_id'):
        obj.tenant = tenant
    for key, value in overrides.items():
        setattr(obj, key, value)
    obj.save()
    return obj


@transaction.atomic
def clone_course(source, new_name, new_code=None):
    """
    Deep-clone ``source`` into a new, independent course named ``new_name``
    under the same tenant. Returns the new ``Course`` instance.
    """
    from .models import (
        Course, Subject, Topic, TopicCourseRelevance, Chapter, ChapterTopic,
    )
    from content.models import Content
    from quiz.models import (
        Question, QuestionOption, Quiz, QuizQuestion,
        MockTest, MockTestQuestion, MockTestItem,
    )
    from coding.models import CodingProblem, TestCase
    from assignments.models import Assignment
    from liveclass.models import LiveClass

    tenant = source.tenant
    code = new_code or _unique_course_code(source.code, new_name)

    # --- Course ------------------------------------------------------------
    new_course = _clone(
        Course.objects.get(pk=source.pk),
        tenant,
        name=new_name,
        code=code,
        status='inactive',      # copies start unpublished for admin review
        is_featured=False,
        total_students=0,
    )
    # M2M instructors carry over (same tenant staff).
    new_course.instructors.set(source.instructors.all())

    subj_map, topic_map, chap_map = {}, {}, {}
    question_map, quiz_map, mock_map = {}, {}, {}

    # --- Subjects ----------------------------------------------------------
    for s in Subject.objects.filter(course=source):
        subj_map[s.pk] = _clone(Subject.objects.get(pk=s.pk), tenant, course=new_course)

    # --- Topics (clone a parent before its children) -----------------------
    pending = {t.pk: t for t in Topic.objects.filter(subject__course=source)}
    in_course = set(pending)

    def _clone_topic(pk):
        src_t = Topic.objects.get(pk=pk)
        topic_map[pk] = _clone(
            src_t, tenant,
            subject=subj_map[src_t.subject_id],
            parent_topic=topic_map.get(src_t.parent_topic_id),
        )

    while pending:
        progressed = False
        for pk in list(pending):
            parent_id = pending[pk].parent_topic_id
            # Defer only when the parent is in this course and not yet cloned.
            if parent_id in in_course and parent_id not in topic_map:
                continue
            _clone_topic(pk)
            del pending[pk]
            progressed = True
        if not progressed:
            # Break any unexpected cycle: clone the rest with mapped parents.
            for pk in list(pending):
                _clone_topic(pk)
            break

    # --- TopicCourseRelevance ---------------------------------------------
    for rel in TopicCourseRelevance.objects.filter(course=source):
        src_rel = TopicCourseRelevance.objects.get(pk=rel.pk)
        if src_rel.topic_id not in topic_map:
            continue
        _clone(src_rel, tenant, course=new_course, topic=topic_map[src_rel.topic_id])

    # --- Chapters ----------------------------------------------------------
    for ch in Chapter.objects.filter(subject__course=source):
        src_ch = Chapter.objects.get(pk=ch.pk)
        chap_map[ch.pk] = _clone(src_ch, tenant, subject=subj_map[src_ch.subject_id])

    # --- ChapterTopic (through) -------------------------------------------
    for ct in ChapterTopic.objects.filter(chapter__subject__course=source):
        src_ct = ChapterTopic.objects.get(pk=ct.pk)
        if src_ct.chapter_id not in chap_map or src_ct.topic_id not in topic_map:
            continue
        _clone(
            src_ct, tenant,
            chapter=chap_map[src_ct.chapter_id],
            topic=topic_map[src_ct.topic_id],
        )

    # --- Content (reading notes / video / pdf) -----------------------------
    for c in Content.objects.filter(topic__subject__course=source):
        src_c = Content.objects.get(pk=c.pk)
        if src_c.topic_id not in topic_map:
            continue
        new_c = _clone(
            src_c, tenant,
            slug=_unique_content_slug(src_c.slug or src_c.title),
            topic=topic_map[src_c.topic_id],
            subject=subj_map[src_c.subject_id],
            views_count=0, likes_count=0, bookmarks_count=0,
        )
        new_c.courses.set([new_course])

    # --- Questions + options ----------------------------------------------
    for q in Question.objects.filter(subject__course=source):
        src_q = Question.objects.get(pk=q.pk)
        new_q = _clone(
            src_q, tenant,
            subject=subj_map[src_q.subject_id],
            topic=topic_map.get(src_q.topic_id),
        )
        new_q.courses.set([new_course])
        question_map[q.pk] = new_q

    for opt in QuestionOption.objects.filter(question__subject__course=source):
        src_o = QuestionOption.objects.get(pk=opt.pk)
        if src_o.question_id not in question_map:
            continue
        _clone(src_o, tenant, question=question_map[src_o.question_id])

    # --- Quizzes -----------------------------------------------------------
    for qz in Quiz.objects.filter(course=source):
        src_qz = Quiz.objects.get(pk=qz.pk)
        quiz_map[qz.pk] = _clone(
            src_qz, tenant,
            course=new_course,
            subject=subj_map.get(src_qz.subject_id),
            topic=topic_map.get(src_qz.topic_id),
        )

    for qq in QuizQuestion.objects.filter(quiz__course=source):
        src_qq = QuizQuestion.objects.get(pk=qq.pk)
        if src_qq.quiz_id not in quiz_map or src_qq.question_id not in question_map:
            continue
        _clone(
            src_qq, tenant,
            quiz=quiz_map[src_qq.quiz_id],
            question=question_map[src_qq.question_id],
        )

    # --- Mock tests --------------------------------------------------------
    def _remap_sections(sections):
        """Repoint subject_id references inside a MockTest.sections JSON."""
        if not isinstance(sections, list):
            return sections
        remapped = []
        for sec in sections:
            if isinstance(sec, dict) and sec.get('subject_id') in subj_map:
                sec = {**sec, 'subject_id': str(subj_map[sec['subject_id']].pk)}
            remapped.append(sec)
        return remapped

    for mt in MockTest.objects.filter(course=source):
        src_mt = MockTest.objects.get(pk=mt.pk)
        new_mt = _clone(
            src_mt, tenant,
            course=new_course,
            sections=_remap_sections(src_mt.sections),
            total_attempts=0,
            results_released=False,
        )
        new_mt.courses.set([new_course])
        mock_map[mt.pk] = new_mt

    for mq in MockTestQuestion.objects.filter(mock_test__course=source):
        src_mq = MockTestQuestion.objects.get(pk=mq.pk)
        if src_mq.mock_test_id not in mock_map or src_mq.question_id not in question_map:
            continue
        _clone(
            src_mq, tenant,
            mock_test=mock_map[src_mq.mock_test_id],
            question=question_map[src_mq.question_id],
        )

    for mi in MockTestItem.objects.filter(mock_test__course=source):
        src_mi = MockTestItem.objects.get(pk=mi.pk)
        if src_mi.mock_test_id not in mock_map:
            continue
        _clone(src_mi, tenant, mock_test=mock_map[src_mi.mock_test_id])

    # --- Coding problems + test cases -------------------------------------
    problem_map = {}
    for cp in CodingProblem.objects.filter(course=source):
        src_cp = CodingProblem.objects.get(pk=cp.pk)
        problem_map[cp.pk] = _clone(
            src_cp, tenant,
            course=new_course,
            subject=subj_map.get(src_cp.subject_id),
            topic=topic_map.get(src_cp.topic_id),
        )

    for tc in TestCase.objects.filter(problem__course=source):
        src_tc = TestCase.objects.get(pk=tc.pk)
        if src_tc.problem_id not in problem_map:
            continue
        _clone(src_tc, tenant, problem=problem_map[src_tc.problem_id])

    # --- Assignments -------------------------------------------------------
    for a in Assignment.objects.filter(course=source):
        src_a = Assignment.objects.get(pk=a.pk)
        _clone(
            src_a, tenant,
            course=new_course,
            subject=subj_map.get(src_a.subject_id),
            topic=topic_map.get(src_a.topic_id),
        )

    # --- Live classes ------------------------------------------------------
    for lc in LiveClass.objects.filter(course=source):
        src_lc = LiveClass.objects.get(pk=lc.pk)
        _clone(
            src_lc, tenant,
            course=new_course,
            subject=subj_map.get(src_lc.subject_id),
            topic=topic_map.get(src_lc.topic_id),
        )

    return new_course
