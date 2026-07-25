"""URL patterns for the Live Class app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LiveClassViewSet
from .admin_views import AdminLiveClassViewSet

router = DefaultRouter()
router.register(r'classes', LiveClassViewSet, basename='live-class')

admin_router = DefaultRouter()
admin_router.register(r'classes', AdminLiveClassViewSet, basename='admin-live-class')

urlpatterns = [
    path('admin/', include(admin_router.urls)),
    path('', include(router.urls)),
]
