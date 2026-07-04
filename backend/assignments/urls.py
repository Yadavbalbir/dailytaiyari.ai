"""URL patterns for the Assignments app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AssignmentViewSet
from .admin_views import AdminAssignmentViewSet, AdminSubmissionViewSet

router = DefaultRouter()
router.register(r'', AssignmentViewSet, basename='assignment')

admin_router = DefaultRouter()
admin_router.register(r'assignments', AdminAssignmentViewSet, basename='admin-assignment')
admin_router.register(r'submissions', AdminSubmissionViewSet, basename='admin-submission')

urlpatterns = [
    path('admin/', include(admin_router.urls)),
    path('', include(router.urls)),
]
