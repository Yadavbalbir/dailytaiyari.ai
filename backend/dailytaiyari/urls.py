"""
URL configuration for DailyTaiyari project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# API Documentation Schema
schema_view = get_schema_view(
    openapi.Info(
        title="DailyTaiyari API",
        default_version='v1',
        description="API for DailyTaiyari - India's Premier Exam Preparation Platform",
        terms_of_service="https://dailytaiyari.ai/terms/",
        contact=openapi.Contact(email="support@dailytaiyari.ai"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1 endpoints
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/exams/', include('exams.urls')),
    path('api/v1/content/', include('content.urls')),
    path('api/v1/quiz/', include('quiz.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/gamification/', include('gamification.urls')),
    path('api/v1/chatbot/', include('chatbot.urls')),
    path('api/v1/community/', include('community.urls')),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

