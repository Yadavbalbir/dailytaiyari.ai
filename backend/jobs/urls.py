"""URL patterns for the Job Portal app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import JobViewSet
from .admin_views import AdminJobViewSet, AdminApplicationViewSet

router = DefaultRouter()
router.register(r'', JobViewSet, basename='job')

admin_router = DefaultRouter()
admin_router.register(r'jobs', AdminJobViewSet, basename='admin-job')
admin_router.register(r'applications', AdminApplicationViewSet, basename='admin-application')

urlpatterns = [
    path('admin/', include(admin_router.urls)),
    path('', include(router.urls)),
]
