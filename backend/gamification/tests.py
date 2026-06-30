"""
Tests for XP / gamification fixes.
"""
from django.test import TestCase

from core.models import Tenant
from core.utils import calculate_xp_for_quiz, QUIZ_XP_CAP, QUIZ_XP_CAP_DAILY_CHALLENGE
from users.models import User, StudentProfile
from chatbot.models import AIQuizAttempt, AI_QUIZ_XP_CAP_PER_ATTEMPT
from gamification.models import XPTransaction
from gamification.services import GamificationService


class QuizXPCapTests(TestCase):
    def test_daily_challenge_cap_higher_than_normal(self):
        self.assertGreater(QUIZ_XP_CAP_DAILY_CHALLENGE, QUIZ_XP_CAP)

    def test_quiz_xp_capped(self):
        # 100 questions at 100% would be 500 raw; must be capped.
        self.assertEqual(calculate_xp_for_quiz(100, 100, False), QUIZ_XP_CAP)
        self.assertEqual(calculate_xp_for_quiz(100, 100, True), QUIZ_XP_CAP_DAILY_CHALLENGE)

    def test_daily_bonus_visible_below_cap(self):
        # Small quiz: bonus is not erased by the cap.
        normal = calculate_xp_for_quiz(100, 2, False)   # 2*5 = 10
        daily = calculate_xp_for_quiz(100, 2, True)      # 10 * 1.5 = 15
        self.assertEqual(normal, 10)
        self.assertEqual(daily, 15)


class AIQuizXPTests(TestCase):
    def _attempt(self, q, pct):
        a = AIQuizAttempt(total_questions=q, percentage=pct)
        return a

    def test_bonus_applied(self):
        a = self._attempt(2, 100)  # base 10 + 10 bonus = 20 (below cap)
        self.assertEqual(a.calculate_xp(), 20)

    def test_per_attempt_cap(self):
        a = self._attempt(100, 100)  # raw huge -> capped
        self.assertEqual(a.calculate_xp(), AI_QUIZ_XP_CAP_PER_ATTEMPT)

    def test_zero_questions(self):
        a = self._attempt(0, 0)
        self.assertEqual(a.calculate_xp(), 0)


class AwardXPTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='T', subdomain='t')
        self.user = User.objects.create_user(email='s@example.com', tenant=self.tenant, password='x')
        self.profile, _ = StudentProfile.objects.get_or_create(user=self.user)

    def test_level_up_creates_bonus_transaction(self):
        result = GamificationService.award_xp(self.profile, 100, 'manual', 'test')
        self.profile.refresh_from_db()
        # 100 XP -> level 2; bonus = level 2 * 20 = 40
        self.assertTrue(result['level_up'])
        self.assertEqual(result['level_bonus'], 40)
        self.assertEqual(self.profile.total_xp, 140)
        self.assertTrue(
            XPTransaction.objects.filter(student=self.profile, transaction_type='level_up').exists()
        )

    def test_negative_clamped_to_zero(self):
        GamificationService.award_xp(self.profile, 30, 'manual', 'add')
        GamificationService.award_xp(self.profile, -100, 'manual', 'deduct')
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.total_xp, 0)

    def test_balance_after_recorded(self):
        GamificationService.award_xp(self.profile, 40, 'manual', 'a')
        txn = XPTransaction.objects.filter(
            student=self.profile, transaction_type='manual'
        ).latest('created_at')
        self.assertEqual(txn.balance_after, 40)
