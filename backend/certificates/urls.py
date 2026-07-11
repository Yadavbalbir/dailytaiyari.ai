"""URL patterns for the certificates app."""
from django.urls import path

from .views import CourseCertificateView, CertificateVerifyView

urlpatterns = [
    path('course/<uuid:course_id>/', CourseCertificateView.as_view(), name='course-certificate'),
    path('verify/<str:number>/', CertificateVerifyView.as_view(), name='certificate-verify'),
]
