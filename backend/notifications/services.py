"""Notification service layer.

Single place where an event (enrollment requested/approved/rejected, or an admin
announcement) turns into (a) in-app ``Notification`` rows and (b) branded emails.

Every public function is defensive: a failure to notify must never roll back or
break the action that triggered it (enrolling, approving, etc.). Callers should
still wrap calls in try/except for belt-and-braces, but these functions also
swallow-and-log internally.
"""
import logging

from django.conf import settings
from django.utils import timezone
from django.utils.html import escape

from . import emails
from .models import Announcement, Notification

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------
def _tenant_admins(tenant):
    """Active, non-suspended admin users for a tenant."""
    from users.models import User
    if not tenant:
        return User.objects.none()
    return User.objects.filter(
        tenant=tenant, role='admin', is_active=True, is_suspended=False,
    )


def _dispatch_email(tenant, to, subject, heading, body_html,
                    cta_text=None, cta_url=None, preheader=None):
    """Send a branded email, async when configured, inline otherwise."""
    if getattr(settings, 'NOTIFICATIONS_ASYNC', False):
        try:
            from .tasks import send_branded_email_task
            send_branded_email_task.delay(
                str(tenant.id) if tenant else None, to, subject, heading,
                body_html, cta_text, cta_url, preheader,
            )
            return
        except Exception:  # noqa: BLE001 - broker down, fall back to inline
            logger.exception('Async email dispatch failed; sending inline')
    emails.send_branded_email(
        tenant, to, subject, heading, body_html, cta_text, cta_url, preheader,
    )


def notify(recipient, *, tenant, type, title, body='', link='', data=None):
    """Create a single in-app notification. Returns the row or None."""
    try:
        return Notification.objects.create(
            recipient=recipient, tenant=tenant, type=type,
            title=title, body=body, link=link, data=data or {},
        )
    except Exception:  # noqa: BLE001
        logger.exception('Failed to create notification for %s', getattr(recipient, 'id', None))
        return None


# ---------------------------------------------------------------------------
# Enrollment lifecycle
# ---------------------------------------------------------------------------
def on_enrollment_requested(enrollment):
    """A student requested to join a course → alert every tenant admin."""
    try:
        student_user = enrollment.student.user
        course = enrollment.course
        tenant = course.tenant or student_user.tenant
        admins = list(_tenant_admins(tenant))
        if not admins:
            return

        student_name = student_user.full_name or student_user.email
        title = 'New enrollment request'
        body = f'{student_name} requested to join {course.name}.'
        review_path = '/admin-dashboard?tab=enrollments'

        for admin in admins:
            notify(
                admin, tenant=tenant, type=Notification.TYPE_ENROLLMENT_REQUEST,
                title=title, body=body, link=review_path,
                data={
                    'enrollment_id': str(enrollment.id),
                    'course_id': str(course.id),
                    'course_name': course.name,
                    'student_name': student_name,
                    'student_email': student_user.email,
                },
            )

        body_html = (
            f'<p><strong>{escape(student_name)}</strong> '
            f'(<a href="mailto:{escape(student_user.email)}">{escape(student_user.email)}</a>) '
            f'has requested to enroll in <strong>{escape(course.name)}</strong>.</p>'
            f'<p>Review the request and approve or decline it from your admin dashboard.</p>'
        )
        _dispatch_email(
            tenant,
            [a.email for a in admins if a.email],
            subject=f'New enrollment request — {course.name}',
            heading='New enrollment request',
            body_html=body_html,
            cta_text='Review request',
            cta_url=emails.tenant_link(tenant, review_path),
            preheader=f'{student_name} wants to join {course.name}',
        )
    except Exception:  # noqa: BLE001
        logger.exception('on_enrollment_requested failed for enrollment %s', getattr(enrollment, 'id', None))


def on_enrollment_approved(enrollment):
    """Admin approved a request → congratulate the student."""
    try:
        student_user = enrollment.student.user
        course = enrollment.course
        tenant = course.tenant or student_user.tenant
        dash_path = '/dashboard'

        notify(
            student_user, tenant=tenant, type=Notification.TYPE_ENROLLMENT_APPROVED,
            title='Enrollment approved 🎉',
            body=f'Your enrollment in {course.name} has been approved. You can start learning now.',
            link=dash_path,
            data={'enrollment_id': str(enrollment.id), 'course_id': str(course.id), 'course_name': course.name},
        )

        body_html = (
            f'<p>Good news! Your request to join <strong>{escape(course.name)}</strong> '
            f'has been <strong>approved</strong>.</p>'
            f'<p>You now have full access to the course. Jump in and start learning.</p>'
        )
        _dispatch_email(
            tenant,
            student_user.email,
            subject=f'You\'re enrolled in {course.name} 🎉',
            heading='Enrollment approved',
            body_html=body_html,
            cta_text='Start learning',
            cta_url=emails.tenant_link(tenant, dash_path),
            preheader=f'Your enrollment in {course.name} was approved',
        )
    except Exception:  # noqa: BLE001
        logger.exception('on_enrollment_approved failed for enrollment %s', getattr(enrollment, 'id', None))


def on_enrollment_rejected(enrollment):
    """Admin declined a request → inform the student (with reason if any)."""
    try:
        student_user = enrollment.student.user
        course = enrollment.course
        tenant = course.tenant or student_user.tenant
        reason = (enrollment.rejection_reason or '').strip()

        body = f'Your enrollment request for {course.name} was not approved.'
        if reason:
            body += f' Reason: {reason}'
        notify(
            student_user, tenant=tenant, type=Notification.TYPE_ENROLLMENT_REJECTED,
            title='Enrollment request declined',
            body=body, link='/profile',
            data={'enrollment_id': str(enrollment.id), 'course_id': str(course.id),
                  'course_name': course.name, 'reason': reason},
        )

        reason_html = f'<p><strong>Reason:</strong> {escape(reason)}</p>' if reason else ''
        body_html = (
            f'<p>Your request to join <strong>{escape(course.name)}</strong> '
            f'was not approved at this time.</p>{reason_html}'
            f'<p>If you think this is a mistake, please reach out to your institute.</p>'
        )
        _dispatch_email(
            tenant,
            student_user.email,
            subject=f'Update on your enrollment request — {course.name}',
            heading='Enrollment request declined',
            body_html=body_html,
            preheader=f'Update on your request to join {course.name}',
        )
    except Exception:  # noqa: BLE001
        logger.exception('on_enrollment_rejected failed for enrollment %s', getattr(enrollment, 'id', None))


# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------
def _announcement_recipients(announcement):
    """Resolve the set of User rows an announcement should reach."""
    from users.models import User
    tenant = announcement.tenant
    base = User.objects.filter(
        tenant=tenant, is_active=True, is_suspended=False,
        role__in=['student', 'instructor'],
    )
    if announcement.audience == Announcement.AUDIENCE_COURSES:
        course_ids = list(announcement.courses.values_list('id', flat=True))
        if not course_ids:
            return User.objects.none()
        base = base.filter(
            profile__enrollments__course_id__in=course_ids,
            profile__enrollments__status='approved',
        )
    return base.distinct()


def deliver_announcement(announcement):
    """Fan an announcement out to its audience as notifications + emails."""
    try:
        recipients = list(_announcement_recipients(announcement))
        tenant = announcement.tenant

        if announcement.send_in_app:
            rows = [
                Notification(
                    recipient=u, tenant=tenant,
                    type=Notification.TYPE_ANNOUNCEMENT,
                    title=announcement.title, body=announcement.body,
                    link='/notifications',
                    data={'announcement_id': str(announcement.id)},
                )
                for u in recipients
            ]
            if rows:
                Notification.objects.bulk_create(rows, batch_size=500)

        if announcement.send_email:
            body_html = ''.join(
                f'<p>{escape(line)}</p>' for line in announcement.body.splitlines() if line.strip()
            ) or f'<p>{escape(announcement.body)}</p>'
            to_emails = [u.email for u in recipients if u.email]
            # One message per recipient keeps addresses private (no shared To/BCC).
            for email in to_emails:
                _dispatch_email(
                    tenant, email,
                    subject=announcement.title,
                    heading=announcement.title,
                    body_html=body_html,
                    preheader=announcement.title,
                )

        announcement.recipients_count = len(recipients)
        announcement.status = Announcement.STATUS_SENT
        announcement.sent_at = timezone.now()
        announcement.save(update_fields=['recipients_count', 'status', 'sent_at'])
    except Exception:  # noqa: BLE001
        logger.exception('deliver_announcement failed for %s', getattr(announcement, 'id', None))
        try:
            announcement.status = Announcement.STATUS_FAILED
            announcement.save(update_fields=['status'])
        except Exception:  # noqa: BLE001
            pass


def dispatch_announcement(announcement):
    """Deliver an announcement, async when configured, inline otherwise."""
    if getattr(settings, 'NOTIFICATIONS_ASYNC', False):
        try:
            from .tasks import deliver_announcement_task
            deliver_announcement_task.delay(str(announcement.id))
            return
        except Exception:  # noqa: BLE001
            logger.exception('Async announcement dispatch failed; delivering inline')
    deliver_announcement(announcement)
