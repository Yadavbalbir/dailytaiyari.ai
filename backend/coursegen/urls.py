"""URL patterns for the AI Course Builder (mounted at /api/v1/tenant-admin/course-ai/)."""
from django.urls import path

from .views import (
    CourseTreeView,
    JobApplyView,
    JobDetailView,
    JobDiscardView,
    JobListCreateView,
    JobRefineView,
    StudioOptionsView,
    TranscribeView,
    studio_health,
)

urlpatterns = [
    path('options/', StudioOptionsView.as_view(), name='coursegen-options'),
    path('health/', studio_health, name='coursegen-health'),
    path('courses/<uuid:course_id>/tree/', CourseTreeView.as_view(), name='coursegen-course-tree'),
    path('transcribe/', TranscribeView.as_view(), name='coursegen-transcribe'),
    path('jobs/', JobListCreateView.as_view(), name='coursegen-jobs'),
    path('jobs/<uuid:job_id>/', JobDetailView.as_view(), name='coursegen-job-detail'),
    path('jobs/<uuid:job_id>/refine/', JobRefineView.as_view(), name='coursegen-job-refine'),
    path('jobs/<uuid:job_id>/apply/', JobApplyView.as_view(), name='coursegen-job-apply'),
    path('jobs/<uuid:job_id>/discard/', JobDiscardView.as_view(), name='coursegen-job-discard'),
]
