"""URL patterns for the Coding app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CodingProblemViewSet
from .admin_views import AdminCodingProblemViewSet, AdminSubmissionViewSet
from .meta_views import CodingMetaView

router = DefaultRouter()
router.register(r'problems', CodingProblemViewSet, basename='coding-problem')

admin_router = DefaultRouter()
admin_router.register(r'problems', AdminCodingProblemViewSet, basename='admin-coding-problem')
admin_router.register(r'submissions', AdminSubmissionViewSet, basename='admin-coding-submission')

urlpatterns = [
    path('meta/', CodingMetaView.as_view(), name='coding-meta'),
    path('admin/', include(admin_router.urls)),
    path('', include(router.urls)),
]
