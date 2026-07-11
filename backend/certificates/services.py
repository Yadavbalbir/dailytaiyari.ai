"""
Certificate services — course completion progress + issuance.

``compute_course_progress`` mirrors the per-subject aggregation used by the
Study flow (see ``exams.views.StudySubjectsView``) so the completion percentage
that unlocks a certificate matches exactly what the student sees on the course
completion panel.
"""
from django.db.models import F


def compute_course_progress(student, course):
    """Return (completed_items, total_items, percent) for a student in a course.

    Counts published reading + video content, quizzes, assignments and coding
    problems across every subject of the course, and how many the student has
    finished.
    """
    from content.models import Content, ContentProgress
    from quiz.models import Quiz, QuizAttempt
    from assignments.models import Assignment, AssignmentSubmission
    from coding.models import CodingProblem, CodingSubmission
    from exams.models import Subject

    reading_types = ['notes', 'pdf', 'revision', 'formula']

    total = 0
    completed = 0

    for subj in Subject.objects.filter(course=course):
        subj_topic_ids = list(subj.topics.values_list('id', flat=True))

        reading_total = Content.objects.filter(
            subject=subj, status='published', content_type__in=reading_types,
        ).count()
        reading_done = ContentProgress.objects.filter(
            student=student, content__subject=subj, content__status='published',
            content__content_type__in=reading_types, is_completed=True,
        ).count()

        video_total = Content.objects.filter(
            subject=subj, status='published', content_type='video',
        ).count()
        video_done = ContentProgress.objects.filter(
            student=student, content__subject=subj, content__status='published',
            content__content_type='video', is_completed=True,
        ).count()

        quiz_total = Quiz.objects.filter(
            subject=subj, course=course, status='published'
        ).count()
        quiz_done = QuizAttempt.objects.filter(
            student=student, quiz__subject=subj, quiz__course=course,
            quiz__status='published', status='completed',
        ).values('quiz').distinct().count()

        assignment_total = Assignment.objects.filter(
            topic_id__in=subj_topic_ids, status='published',
        ).count()
        assignment_done = AssignmentSubmission.objects.filter(
            student=student, assignment__topic_id__in=subj_topic_ids,
            assignment__status='published',
        ).values('assignment').distinct().count()

        coding_total = CodingProblem.objects.filter(
            topic_id__in=subj_topic_ids, status='published',
        ).count()
        coding_done = CodingSubmission.objects.filter(
            student=student, problem__topic_id__in=subj_topic_ids,
            problem__status='published', total_count__gt=0,
            passed_count=F('total_count'),
        ).values('problem').distinct().count()

        total += reading_total + video_total + quiz_total + assignment_total + coding_total
        completed += reading_done + video_done + quiz_done + assignment_done + coding_done

    percent = round((completed / total) * 100) if total > 0 else 0
    return completed, total, percent


def is_course_complete(student, course):
    """True when the course has gradable content and the student finished it all."""
    completed, total, percent = compute_course_progress(student, course)
    return total > 0 and percent >= 100


def get_or_issue_certificate(student, course):
    """Return the student's certificate for the course, creating it if eligible.

    Returns ``None`` when certificates are disabled for the course or the student
    is not yet eligible (and none was previously issued).
    """
    from .models import CourseCertificate

    existing = CourseCertificate.objects.filter(student=student, course=course).first()
    if existing:
        return existing

    if not getattr(course, 'certificate_enabled', False):
        return None
    if not is_course_complete(student, course):
        return None

    user = student.user
    student_name = (user.full_name or '').strip() or user.email
    tenant = getattr(course, 'tenant', None)

    certificate, _ = CourseCertificate.objects.get_or_create(
        student=student,
        course=course,
        defaults={
            'certificate_number': CourseCertificate.make_number(),
            'template': getattr(course, 'certificate_template', 'classic') or 'classic',
            'student_name': student_name,
            'course_name': course.name,
            'tenant_name': getattr(tenant, 'name', '') or '',
            'tenant': tenant,
        },
    )
    return certificate
