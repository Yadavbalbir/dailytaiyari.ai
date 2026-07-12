"""Payment API URLs."""
from django.urls import path

from .views import CreateOrderView, VerifyOrderView, WebhookView, PayUCallbackView

urlpatterns = [
    path('orders/', CreateOrderView.as_view(), name='payment-create-order'),
    path('orders/<uuid:pk>/verify/', VerifyOrderView.as_view(), name='payment-verify-order'),
    path('webhook/<str:provider>/', WebhookView.as_view(), name='payment-webhook'),
    # PayU redirects the browser (surl/furl) here after its hosted checkout.
    path('payu/callback/', PayUCallbackView.as_view(), name='payment-payu-callback'),
]
