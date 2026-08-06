"""Picks which LLM answers a request, and enforces the spend guardrails.

Resolution order for a tenant:

1. Its own active, fully-configured :class:`~chatbot.models.AIProviderConfig`
   → billed to the tenant, capped only by the tenant's own budget.
2. The platform's key (``settings.OPENAI_API_KEY``) — **only** when the super
   admin has granted ``tenant.ai_platform_monthly_tokens`` and this month's
   platform usage is still under it. This is what protects the platform owner's
   bill: the default grant is 0, so an unconfigured tenant simply gets a clear
   "ask your admin to connect an AI provider" message instead of costing money.

Every successful call is metered into :class:`~chatbot.models.AIUsageRecord`.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.db.models import Sum
from django.utils import timezone

from .models import AIProviderConfig, AISettings, AIUsageRecord
from .providers import ResolvedProvider, Usage, estimate_cost_usd

# Model used when falling back to the platform's own key — cheap on purpose.
PLATFORM_MODEL = getattr(settings, 'AI_PLATFORM_MODEL', 'gpt-4o-mini')


class AIUnavailable(Exception):
    """No usable provider. ``reason`` is a code the frontend can branch on."""

    def __init__(self, message, reason='not_configured'):
        super().__init__(message)
        self.message = message
        self.reason = reason


@dataclass
class Resolution:
    """The provider chosen for a request plus the settings that shaped it."""

    provider: ResolvedProvider
    settings_obj: AISettings


def month_start(now=None):
    now = now or timezone.now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def get_ai_settings(tenant) -> AISettings:
    """The tenant's AI settings row, created with defaults on first access."""
    obj, _created = AISettings.objects.get_or_create(tenant=tenant)
    return obj


def tokens_used(tenant, since, source=None):
    qs = AIUsageRecord.objects.filter(tenant=tenant, created_at__gte=since)
    if source:
        qs = qs.filter(source=source)
    return qs.aggregate(total=Sum('total_tokens'))['total'] or 0


def platform_allowance(tenant):
    """``(granted, used, remaining)`` platform tokens for this calendar month."""
    granted = getattr(tenant, 'ai_platform_monthly_tokens', 0) or 0
    used = tokens_used(tenant, month_start(), source=AIUsageRecord.SOURCE_PLATFORM)
    return granted, used, max(0, granted - used)


def active_config(tenant):
    """The tenant's active provider config, or ``None``."""
    for config in AIProviderConfig.objects.filter(tenant=tenant, is_active=True):
        if config.is_configured:
            return config
    return None


def check_student_quota(student, tenant, ai_settings=None):
    """Raise :class:`AIUnavailable` when the student hit their daily message cap."""
    ai_settings = ai_settings or get_ai_settings(tenant)
    limit = ai_settings.student_daily_message_limit
    if not limit:
        return
    since = timezone.now() - timedelta(days=1)
    used = AIUsageRecord.objects.filter(
        student=student, created_at__gte=since, was_successful=True
    ).count()
    if used >= limit:
        raise AIUnavailable(
            f'You have reached your daily limit of {limit} AI messages. '
            'It resets 24 hours after your first message today.',
            reason='student_limit',
        )


def resolve(tenant, student=None) -> Resolution:
    """Choose the provider for this tenant, enforcing every guardrail.

    Raises :class:`AIUnavailable` with a student-friendly message when the AI
    cannot be used (disabled, unconfigured, or out of budget).
    """
    if tenant is None:
        raise AIUnavailable(
            'The AI assistant is not available on this workspace.', reason='no_tenant'
        )

    ai_settings = get_ai_settings(tenant)
    if not ai_settings.is_enabled:
        raise AIUnavailable(
            'The AI assistant has been turned off by your institute.', reason='disabled'
        )

    if student is not None:
        check_student_quota(student, tenant, ai_settings)

    config = active_config(tenant)
    if config is not None:
        # The tenant's own monthly budget guards their spend, not the platform's.
        budget = ai_settings.monthly_token_budget
        if budget:
            used = tokens_used(tenant, month_start(), source=AIUsageRecord.SOURCE_TENANT)
            if used >= budget:
                raise AIUnavailable(
                    'Your institute has used its AI budget for this month. '
                    'Please ask an administrator to raise it.',
                    reason='tenant_budget',
                )
        return Resolution(
            provider=ResolvedProvider.from_config(config, source=AIUsageRecord.SOURCE_TENANT),
            settings_obj=ai_settings,
        )

    # No tenant key → the platform pays, so only proceed within an explicit grant.
    granted, _used, remaining = platform_allowance(tenant)
    platform_key = getattr(settings, 'OPENAI_API_KEY', '')
    if granted and remaining > 0 and platform_key:
        return Resolution(
            provider=ResolvedProvider(
                provider=AIProviderConfig.PROVIDER_OPENAI,
                api_key=platform_key,
                model=PLATFORM_MODEL,
                temperature=0.7,
                max_tokens=1500,
                source=AIUsageRecord.SOURCE_PLATFORM,
            ),
            settings_obj=ai_settings,
        )

    if granted and remaining <= 0:
        raise AIUnavailable(
            'The included AI allowance for this month has run out. Your institute '
            'can connect its own AI provider key to continue right away.',
            reason='platform_exhausted',
        )

    raise AIUnavailable(
        'The AI assistant has not been set up yet. Ask your institute admin to '
        'connect an AI provider under Admin → AI Features.',
        reason='not_configured',
    )


def record_usage(
    *,
    tenant,
    student,
    session,
    resolved: ResolvedProvider,
    usage: Usage,
    response_time_ms=0,
    was_successful=True,
    error_message='',
):
    """Persist one metered call. Never raises — metering must not break chat."""
    try:
        return AIUsageRecord.objects.create(
            tenant=tenant,
            student=student,
            session=session,
            source=resolved.source,
            provider=resolved.provider,
            model=resolved.model,
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            total_tokens=usage.total_tokens,
            estimated_cost_usd=estimate_cost_usd(resolved.model, usage),
            response_time_ms=response_time_ms,
            was_successful=was_successful,
            error_message=error_message[:500],
        )
    except Exception:  # noqa: BLE001 - metering is best-effort
        return None


def usage_summary(tenant, days=30):
    """Aggregates for the admin "AI Features" usage panel."""
    since = timezone.now() - timedelta(days=days)
    window = AIUsageRecord.objects.filter(tenant=tenant, created_at__gte=since)
    totals = window.aggregate(
        total_tokens=Sum('total_tokens'),
        prompt_tokens=Sum('prompt_tokens'),
        completion_tokens=Sum('completion_tokens'),
        cost=Sum('estimated_cost_usd'),
    )
    granted, used, remaining = platform_allowance(tenant)
    return {
        'days': days,
        'messages': window.count(),
        'active_students': window.exclude(student=None).values('student').distinct().count(),
        'total_tokens': totals['total_tokens'] or 0,
        'prompt_tokens': totals['prompt_tokens'] or 0,
        'completion_tokens': totals['completion_tokens'] or 0,
        'estimated_cost_usd': float(totals['cost'] or 0),
        'month_tokens': tokens_used(tenant, month_start()),
        'platform_grant_tokens': granted,
        'platform_used_tokens': used,
        'platform_remaining_tokens': remaining,
    }
