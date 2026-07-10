"""Platform-team notification emails (non-tenant).

Used for inbound marketing-site leads (demo bookings, contact messages).
Failures are swallowed by callers so a mail hiccup never blocks the DB write.
"""
from django.conf import settings
from django.core.mail import send_mail


def _notify_address():
    return getattr(settings, 'PLATFORM_NOTIFICATION_EMAIL', 'balbir.ms24@gmail.com')


def send_demo_booking_notification(booking):
    """Email the platform team about a new demo booking."""
    org = booking.organization or '—'
    org_type = booking.get_organization_type_display() if booking.organization_type else '—'
    message = (
        "New demo request from the DailyTaiyari website:\n\n"
        f"Name:          {booking.name}\n"
        f"Email:         {booking.email}\n"
        f"Phone:         {booking.phone or '—'}\n"
        f"Organization:  {org}\n"
        f"Type:          {org_type}\n"
        f"Source:        {booking.source or '—'}\n\n"
        f"Message:\n{booking.message or '—'}\n"
    )
    send_mail(
        subject=f'New Demo Request — {booking.name} ({org})',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[_notify_address()],
        fail_silently=False,
    )


def send_contact_message_notification(contact):
    """Email the platform team about a new contact message."""
    message = (
        "New message from the DailyTaiyari website:\n\n"
        f"Name:     {contact.name}\n"
        f"Email:    {contact.email}\n"
        f"Subject:  {contact.subject or '—'}\n"
        f"Source:   {contact.source or '—'}\n\n"
        f"Message:\n{contact.message}\n"
    )
    send_mail(
        subject=f'New Contact Message — {contact.name}',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[_notify_address()],
        fail_silently=False,
    )


def send_job_application_notification(application):
    """Email the platform team about a new job application."""
    message = (
        "New job application from the DailyTaiyari careers page:\n\n"
        f"Name:        {application.name}\n"
        f"Email:       {application.email}\n"
        f"Phone:       {application.phone or '—'}\n"
        f"Position:    {application.position}\n"
        f"Experience:  {application.experience or '—'}\n"
        f"Portfolio:   {application.portfolio_url or '—'}\n"
        f"Source:      {application.source or '—'}\n\n"
        f"Cover letter:\n{application.cover_letter or '—'}\n"
    )
    send_mail(
        subject=f'New Job Application — {application.name} ({application.position})',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[_notify_address()],
        fail_silently=False,
    )
