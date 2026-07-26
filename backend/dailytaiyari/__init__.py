# DailyTaiyari - Course Preparation Platform

# Ensure the Celery app is loaded when Django starts so shared_task/@app.task
# and `celery -A dailytaiyari` resolve. Guarded so the project still boots if
# Celery isn't installed (e.g. a minimal tooling environment).
try:
    from .celery import app as celery_app  # noqa: F401

    __all__ = ('celery_app',)
except ImportError:  # pragma: no cover - celery is a hard dependency in prod
    pass

