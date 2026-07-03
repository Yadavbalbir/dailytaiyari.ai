"""
URL patterns for Content app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContentViewSet, ContentProgressViewSet,
    StudyPlanViewSet, StudyPlanItemViewSet
)
from .admin_views import AdminContentViewSet, AdminImageUploadView

admin_router = DefaultRouter()
admin_router.register(r'contents', AdminContentViewSet, basename='admin-content')

router = DefaultRouter()
router.register(r'', ContentViewSet, basename='content')
router.register(r'progress', ContentProgressViewSet, basename='content-progress')
router.register(r'study-plans', StudyPlanViewSet, basename='study-plan')
router.register(r'study-plan-items', StudyPlanItemViewSet, basename='study-plan-item')

urlpatterns = [
    path('admin/upload-image/', AdminImageUploadView.as_view(), name='admin-content-upload-image'),
    path('admin/', include(admin_router.urls)),
    path('', include(router.urls)),
]

