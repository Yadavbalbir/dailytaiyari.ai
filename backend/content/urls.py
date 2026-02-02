"""
URL patterns for Content app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContentViewSet, ContentProgressViewSet,
    StudyPlanViewSet, StudyPlanItemViewSet
)

router = DefaultRouter()
router.register(r'', ContentViewSet, basename='content')
router.register(r'progress', ContentProgressViewSet, basename='content-progress')
router.register(r'study-plans', StudyPlanViewSet, basename='study-plan')
router.register(r'study-plan-items', StudyPlanItemViewSet, basename='study-plan-item')

urlpatterns = [
    path('', include(router.urls)),
]

