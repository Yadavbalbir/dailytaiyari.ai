# XP Architecture – Complete Reference

This document describes **all ways XP is earned**, **how much** each gives, **where it is stored**, and **how levels and leaderboards use it**.

---

## 1. Where XP lives (storage)

| Store | Model / field | Purpose |
|-------|----------------|--------|
| **Global total** | `StudentProfile.total_xp` | Single source of truth for lifetime XP. Shown in profile, used for level. |
| **Audit trail** | `XPTransaction` (per award) | Each XP award creates a row: `transaction_type`, `xp_amount`, `description`, `reference_id`, `balance_after`. Used for history and debugging. |
| **Period (leaderboards)** | `DailyActivity.xp_earned` (per student per day) | Daily/weekly/monthly leaderboards use `Sum(DailyActivity.xp_earned)` for the period. Must be updated whenever XP is awarded. |

**Rule:** Every XP award must (1) add to `StudentProfile.total_xp`, (2) create an `XPTransaction`, and (3) add to today’s `DailyActivity.xp_earned` (so period leaderboards are correct).

---

## 2. How XP is awarded (entry points)

There are two services that add XP:

- **`GamificationService.award_xp(student, xp_amount, transaction_type, ...)`**  
  Used for: content, quiz, mock test, AI quiz, badges, level up, daily goal, challenge.  
  Updates `total_xp`, creates `XPTransaction`, and (unless skipped) updates `DailyActivity.xp_earned`.  
  For `quiz_complete` and `mock_complete` it **does not** update daily activity; the view does that with `update_daily_activity(..., xp_earned=xp)`.

- **`CommunityXPService.award_xp(user_profile, action, ...)`**  
  Used for community actions (post, answer, like, etc.).  
  Uses `F('total_xp') + xp_amount`, creates `XPTransaction`, updates `CommunityStats`, and updates today’s `DailyActivity.xp_earned`.

---

## 3. All XP sources – how and how much

### 3.1 Study content completion

| Where | Trigger | Amount | Transaction type |
|-------|--------|--------|-------------------|
| `content/views.py` (mark progress complete) | User completes a content item (notes/video/pdf) | **Notes:** 10 XP<br>**Video:** 15 XP<br>**PDF:** 12 XP | `content_complete` |

- One award per content item (no double award if already completed).
- `GamificationService.award_xp` is called with default `update_daily_activity=True`, so daily activity is updated automatically.

---

### 3.2 Topic / study quiz (quiz app)

| Where | Trigger | Formula | Cap | Transaction type |
|-------|--------|--------|-----|-------------------|
| `quiz/views.py` (submit) | User submits a topic quiz | `base = questions_count × 5`<br>`xp = int(base × accuracy / 100)`<br>Daily challenge: `xp × 1.5` | **100** (normal)<br>**150** (daily challenge) | `quiz_complete` |

- **Formula:** `core/utils.py` → `calculate_xp_for_quiz(accuracy, questions_count, is_daily_challenge)`.
- Capped so one long quiz cannot give hundreds of XP.
- View then calls `AnalyticsService.update_daily_activity(..., xp_earned=xp)` so period leaderboards include quiz XP.

---

### 3.3 Mock test

| Where | Trigger | Formula | Cap | Transaction type |
|-------|--------|--------|-----|-------------------|
| `quiz/views.py` (mock submit) | User completes a mock test | Same as quiz: `calculate_xp_for_quiz(%, total_questions, False)` **× 2** | 100 × 2 = **200** max | `mock_complete` |

- Same base formula as quiz, doubled; then same cap logic applies to the pre-doubled value (cap 100), so effective max is 200.

---

### 3.4 AI quiz (chatbot)

| Where | Trigger | Formula | Transaction type |
|-------|--------|--------|-------------------|
| `chatbot/views.py` (submit) | User completes an AI-generated quiz | `base_xp = total_questions × 5`<br>`xp = int(base_xp × accuracy/100) + bonus`<br>**Bonus:** 100% → +50, ≥80% → +25, ≥60% → +10 | `ai_quiz` |

- Implemented in `chatbot/models.py` → `AIQuizAttempt.calculate_xp()`.
- No per-quiz cap in code (could be added similarly to study quiz if desired).
- View calls `GamificationService.award_xp(..., update_daily_activity=False)` then `AnalyticsService.update_daily_activity(..., xp_earned=xp_earned)`.

---

### 3.5 Community forum

| Where | Trigger | Amount | Transaction type |
|-------|--------|--------|-------------------|
| `community/views.py` + `CommunityXPService` | Various actions | See table below | `community` |

**Community XP amounts** (`community/services.py` → `CommunityXPService.XP_REWARDS`):

| Action | XP | When |
|--------|----|------|
| `ask_question` | 10 | Create a question post |
| `create_poll` | 10 | Create a poll post |
| `create_quiz` | 15 | Create a quiz post |
| `answer_question` | 15 | Add top-level answer (comment) |
| `best_answer` | 50 | Author’s answer marked best |
| `receive_like_post` | 2 | Someone likes your post |
| `receive_like_comment` | 2 | Someone likes your comment |
| `vote_poll` | 2 | Vote on a poll |
| `quiz_correct` | 5 | Correct answer on community quiz (if used) |

- All go through `CommunityXPService.award_xp`, which updates `total_xp`, creates `XPTransaction`, and updates `DailyActivity.xp_earned` for the day.

---

### 3.6 Badges

| Where | Trigger | Amount | Transaction type |
|-------|--------|--------|-------------------|
| `gamification/services.py` → `check_and_award_badges` | After quiz/mock (and when context allows) | **Sum of all newly earned badges’ `xp_reward`** in one go | `badge_earned` (one transaction per check) |

- Badges are evaluated in one pass; all qualifying badges are created, then **one** `award_xp(total_badge_xp, 'badge_earned', ...)` is called (no cascade of many small awards).
- Badge XP values are per badge in DB (see seed_data); examples: 50, 100, 150, 200, 300, 500, 1000, 2000, 5000 depending on badge.

---

### 3.7 Level up

| Where | Trigger | Formula | Transaction type |
|-------|--------|--------|-------------------|
| `gamification/services.py` → `award_xp` (internal) | Any award that pushes `total_xp` past the next level threshold | **Level N bonus = N × 50** (e.g. level 1 → 50, level 2 → 100) | `level_up` |

- Level is derived from `StudentProfile.total_xp` via `calculate_level()` (see Levels below).
- When `new_level > current_level`, bonus is added to `total_xp` and a second `XPTransaction` is created with type `level_up`.

---

### 3.8 Daily study goal

| Where | Trigger | Amount | Transaction type |
|-------|--------|--------|-------------------|
| `analytics/views.py` (study session heartbeat) | User’s study session reaches daily goal (e.g. minutes) | **50** base + **streak bonus** (5 XP per streak day, max +50) = **50–100** | `daily_goal` |

- Awarded once per day when goal is first achieved (`session.goal_xp_awarded`).
- Streak bonus: `min(50, current_streak * 5)`.

---

### 3.9 Challenges

| Where | Trigger | Amount | Transaction type |
|-------|--------|--------|-------------------|
| `gamification/views.py` (claim challenge rewards) | User completes a challenge and claims | **Per challenge:** `Challenge.xp_reward` (default 100 in model) | `challenge_win` |

- One claim per challenge (tracked on `ChallengeParticipation.xp_claimed`).

---

### 3.10 Streak bonus (formula only; not a separate transaction type)

- **`core/utils.py` → `calculate_streak_bonus(streak_days)`** defines a formula:
  - 0 days → 0  
  - 1–6: `streak_days × 10`  
  - 7–29: `70 + (streak_days - 7) × 15`  
  - 30+: `415 + (streak_days - 30) × 20`  
- This is **not** used as a standalone XP award in the current code. Streak is used **inside daily goal** (extra 5 XP per streak day, max 50) in `analytics/views.py`. So “streak bonus” in practice = daily goal streak component.

---

## 4. Levels

- **Model:** `StudentProfile.current_level`, `StudentProfile.total_xp`.
- **Computation:** `users/models.py` → `StudentProfile.calculate_level()`:
  - Level 1 starts at 0 XP.
  - Each level requires **100 × 1.5^(level-1)** XP within that level (cumulative total increases).
  - Algorithm: subtract level thresholds from `total_xp` until remaining XP is less than next threshold; level = number of steps + 1.
- **Level-up bonus:** When level increases, bonus = `new_level * 50` added to `total_xp` and recorded as `level_up` transaction.
- **Next level progress:** `xp_for_next_level` = XP remaining until the next level threshold (for progress bars).

---

## 5. Leaderboards and period XP

- **Daily / weekly / monthly leaderboard:**  
  `GamificationService.get_leaderboard(period, exam, tenant)` uses **`DailyActivity`**: for each student it sums `xp_earned` for the period and sorts. **Tenant-scoped:** only students with `user__tenant=tenant` are included.

- **Study leaderboard (topic/chapter/subject):**  
  `exams/views.py` → `StudyLeaderboardView`: aggregates XP from `XPTransaction` where `reference_id` is in **content IDs** or **quiz attempt IDs** (not quiz IDs) for the scope, tenant-scoped.

- **Community leaderboard:**  
  `CommunityLeaderboardService` builds leaderboard from community activity/XP, tenant-scoped.

- **Consistency:** For global and period totals to match, every XP award must:
  1. Update `StudentProfile.total_xp`.
  2. Create an `XPTransaction`.
  3. Add the same amount to today’s `DailyActivity.xp_earned` (either inside `award_xp` or via `AnalyticsService.update_daily_activity(..., xp_earned=...)` in the view for quiz/mock/AI quiz).

---

## 6. Summary table – “How much XP from what?”

| Source | Typical / max amount | Capped? |
|--------|----------------------|--------|
| Content (notes) | 10 | No |
| Content (video) | 15 | No |
| Content (PDF) | 12 | No |
| Quiz (topic) | 5 per question × accuracy%, then cap | Yes: 100 (150 daily) |
| Mock test | Same as quiz × 2 | Yes: 200 |
| AI quiz | 5 per question × accuracy% + bonus (e.g. +50 perfect) | No cap in code |
| Community (per action) | 2–50 (see table above) | No |
| Badges | Sum of earned badges (50–5000 each) | One batch per check |
| Level up | level × 50 | N/A |
| Daily goal | 50 + streak (max +50) = 50–100 | Once per day |
| Challenge | Per challenge (e.g. 100) | Once per challenge |

---

## 7. Files to look at (by concern)

- **Formulas / caps:** `core/utils.py` (`calculate_xp_for_quiz`, `calculate_streak_bonus`), `chatbot/models.py` (`AIQuizAttempt.calculate_xp`).
- **Award flow:** `gamification/services.py` (`award_xp`, `check_and_award_badges`), `community/services.py` (`CommunityXPService.award_xp`).
- **Content:** `content/views.py` (complete progress).
- **Quiz / mock:** `quiz/views.py` (submit, mock submit).
- **AI quiz:** `chatbot/views.py` (submit).
- **Daily goal:** `analytics/views.py` (study session heartbeat).
- **Challenges:** `gamification/views.py` (claim rewards).
- **Levels:** `users/models.py` (`calculate_level`, `xp_for_next_level`).
- **Leaderboards:** `gamification/services.py` (`get_leaderboard`, `get_student_rank`), `exams/views.py` (`StudyLeaderboardView`), `community/services.py` (`CommunityLeaderboardService`).

For historical bugs and fixes (transaction types, daily activity, study leaderboard), see **XP_CALCULATION_SUMMARY.md**.
