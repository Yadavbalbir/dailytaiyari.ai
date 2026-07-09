"""Platform-owned (non-tenant) public URLs — marketing site leads."""
from django.urls import path

from .views import DemoBookingCreateView, ContactMessageCreateView

urlpatterns = [
    path('demo-bookings/', DemoBookingCreateView.as_view(), name='platform-demo-booking'),
    path('contact-messages/', ContactMessageCreateView.as_view(), name='platform-contact-message'),
]
