"""Seed the official NTA NEET syllabus with authored notes (idempotent)."""
from django.core.management.base import BaseCommand
from ._neet_syllabus import SUBJECTS
from ._seeder import seed_syllabus


class Command(BaseCommand):
    help = "Seed the NEET syllabus (subjects, chapters, topics, notes) for a tenant."

    def add_arguments(self, parser):
        parser.add_argument('--exam-code', default='neet')
        parser.add_argument('--tenant', default='Test Academy')

    def handle(self, *args, **opts):
        s, c, t, n, q, m = seed_syllabus(opts['exam_code'], 'NEET', opts['tenant'], SUBJECTS)
        self.stdout.write(self.style.SUCCESS(
            f"NEET: {s} subjects, {c} chapters, {t} topics, {n} content items, {q} quizzes, {m} mock tests."))
