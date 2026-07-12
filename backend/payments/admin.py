from django.contrib import admin

from .models import PaymentOrder


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = ('provider', 'provider_order_id', 'course', 'status', 'amount', 'currency', 'created_at')
    list_filter = ('provider', 'status', 'is_test_mode')
    search_fields = ('provider_order_id', 'provider_payment_id', 'course__name', 'student__user__email')
    readonly_fields = tuple(f.name for f in PaymentOrder._meta.fields)
    ordering = ('-created_at',)
