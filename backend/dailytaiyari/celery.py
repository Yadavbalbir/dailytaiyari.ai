"""Celery application for DailyTaiyari.

Used for off-request work — currently grading coding submissions so a burst of
submissions (contest/deadline) queues gracefully instead of holding web threads.
Broker + result backend are Redis (see settings CELERY_*). Tasks are discovered
from every installed app's ``tasks.py``.
"""
import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dailytaiyari.settings')

app = Celery('dailytaiyari')

# All Celery config lives in Django settings under the CELERY_ namespace.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in each installed app.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
