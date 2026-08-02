"""Shared file-serving helpers for assignment papers and submissions.

PDFs are served inline (rendered view-only in-app); ZIP archives (and anything
else) are served as a download with the original filename.
"""
import mimetypes
import os

from django.http import FileResponse, Http404


def serve_assignment_file(file_field, not_found='File not found.'):
    """Return a FileResponse for a FileField, choosing inline vs attachment.

    PDFs stream inline so the in-app reader can render them; ZIPs and other
    types are sent as attachments so the browser downloads them.
    """
    if not file_field:
        raise Http404('No file available.')
    try:
        fh = file_field.open('rb')
    except Exception:
        raise Http404(not_found)

    base = file_field.name.rsplit('/', 1)[-1]
    ext = os.path.splitext(base)[1].lower()

    if ext == '.pdf':
        content_type = 'application/pdf'
        disposition = f'inline; filename="{base}"'
    else:
        content_type = 'application/zip' if ext == '.zip' else (
            mimetypes.guess_type(base)[0] or 'application/octet-stream'
        )
        disposition = f'attachment; filename="{base}"'

    response = FileResponse(fh, content_type=content_type)
    response['Content-Disposition'] = disposition
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'private, no-store'
    return response
