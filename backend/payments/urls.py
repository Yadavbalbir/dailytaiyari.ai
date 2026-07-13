"""Payment API URLs."""
from django.urls import path

from .views import CreateOrderView, VerifyOrderView, WebhookView, PayUCallbackView
from .admin_views import (
    SalesOrderListView,
    SalesSummaryView,
    RefundOrderView,
    RevokeAccessView,
)

urlpatterns = [
    path('orders/', CreateOrderView.as_view(), name='payment-create-order'),
    path('orders/<uuid:pk>/verify/', VerifyOrderView.as_view(), name='payment-verify-order'),
    path('webhook/<str:provider>/', WebhookView.as_view(), name='payment-webhook'),
    # PayU redirects the browser (surl/furl) here after its hosted checkout.
    path('payu/callback/', PayUCallbackView.as_view(), name='payment-payu-callback'),
    # --- Tenant-admin sales dashboard ---
    path('admin/sales/orders/', SalesOrderListView.as_view(), name='admin-sales-orders'),
    path('admin/sales/summary/', SalesSummaryView.as_view(), name='admin-sales-summary'),
    path('admin/sales/orders/<uuid:pk>/refund/', RefundOrderView.as_view(), name='admin-sales-refund'),
    path('admin/sales/orders/<uuid:pk>/revoke/', RevokeAccessView.as_view(), name='admin-sales-revoke'),
]
