# XP Calculation – Summary and Fixes

## Sources of XP

| Source | Where it's awarded | Transaction type | Updates `profile.total_xp` | Creates `XPTransaction` | Updates `DailyActivity.xp_earned` |
|--------|--------------------|------------------|----------------------------|-------------------------|-----------------------------------|
| **Content completion** | `content/views.py` (progress complete) | `content_complete` | ✅ via `GamificationService.award_xp` | ✅ | ✅ inside `award_xp` |
| **Quiz** | `quiz/views.py` (submit) | `quiz_complete` | ✅ via `award_xp` | ✅ | ✅ in view via `AnalyticsService.update_daily_activity(..., xp_earned=xp)` |
| **Mock test** | `quiz/views.py` (mock submit) | `mock_complete` | ✅ via `award_xp` | ✅ | ✅ in view via `update_daily_activity(..., xp_earned=xp)` |
| **Community** | `community/views.py` → `CommunityXPService.award_xp` | `community` | ✅ (F() + refresh) | ✅ | ✅ **fixed**: now updates `DailyActivity` |
| **AI Quiz (chatbot)** | `chatbot/views.py` (submit) | `ai_quiz` | ✅ via `award_xp` | ✅ **fixed**: now uses `GamificationService.award_xp` | ✅ in view via `update_daily_activity(..., xp_earned=xp)` |
| **Badge** | `GamificationService.check_and_award_badges` | `badge_earned` | ✅ via `award_xp` | ✅ | ✅ inside `award_xp` |
| **Level up** | `GamificationService.award_xp` (when level up) | `level_up` | ✅ | ✅ (second transaction) | ✅ inside `award_xp` |

## Global XP (`profile.total_xp`)

- **Single source of truth**: `StudentProfile.total_xp`.
- **Updated by**:
  - `GamificationService.award_xp()` for: content, quiz, mock test, badge, level up, AI quiz (after fix).
  - `CommunityXPService.award_xp()` for community (uses `F('total_xp') + xp_amount` then `refresh_from_db()`).
- **Consistency**: Sum of `XPTransaction.xp_amount` for a student should match `profile.total_xp` as long as all XP flows create a transaction (content, quiz, mock, community, AI quiz, badge, level up). After the fixes below, that holds.

## Leaderboard / period XP (daily, weekly, monthly)

- **Source of truth**: `DailyActivity.xp_earned` per student per day.
- **Computation**: `Sum(DailyActivity.xp_earned)` for the period.
- **Must be updated** whenever XP is awarded so that:
  - Quiz/mock: view calls `update_daily_activity(..., xp_earned=xp)` (because `award_xp` skips daily for these).
  - Content/badge/level: `award_xp` updates `DailyActivity` itself.
  - Community: **fixed** – `CommunityXPService.award_xp` now updates `DailyActivity.xp_earned` for the current day.
  - AI quiz: view calls `update_daily_activity(..., xp_earned=xp_earned)` (same pattern as quiz/mock).

So: **global XP** = `profile.total_xp`. **Period XP** (e.g. weekly) = sum of `DailyActivity.xp_earned` for that period. Both stay in sync after the fixes.

## Bugs that were fixed

### 1. Mock test transaction type

- **Issue**: Quiz view used `transaction_type='mock_test'`, but `XPTransaction.TRANSACTION_TYPES` only had `'mock_complete'`.
- **Change**: Use `'mock_complete'` in `quiz/views.py` and in `GamificationService.award_xp` skip list (`'mock_complete'` instead of `'mock_test'`).

### 2. Content complete transaction type

- **Issue**: Content completion used `'content_complete'`, which was not in `XPTransaction.TRANSACTION_TYPES`.
- **Change**: Added `('content_complete', 'Content Completed')` to `TRANSACTION_TYPES` in `gamification/models.py`.

### 3. AI Quiz (chatbot) not creating XPTransaction

- **Issue**: Chatbot updated `student.total_xp` and `DailyActivity` but did not call `GamificationService.award_xp`, so no `XPTransaction` was created. XP history and any logic summing transactions missed AI quiz XP.
- **Change**: Chatbot now calls `GamificationService.award_xp(..., 'ai_quiz', ..., update_daily_activity=False)` and still calls `AnalyticsService.update_daily_activity(..., xp_earned=xp_earned)`. Added `('ai_quiz', 'AI Quiz Completed')` to `TRANSACTION_TYPES`.

### 4. Community XP not in leaderboard / period XP

- **Issue**: Community XP was added to `profile.total_xp` and `XPTransaction`, but `DailyActivity.xp_earned` was not updated, so daily/weekly/monthly leaderboards and weekly reports did not include community XP.
- **Change**: In `CommunityXPService.award_xp`, after creating the XP transaction, get or create today’s `DailyActivity` and add `xp_amount` to `activity.xp_earned`, then save.

### 5. Study leaderboard (topic/subject/chapter) XP undercounted

- **Issue**: Study leaderboard XP was taken from `XPTransaction` with `reference_id__in=all_refs` where `all_refs = content_ids + quiz_ids`. For quiz completion we store `attempt.id` (QuizAttempt id), not `quiz.id`, so quiz XP was never included.
- **Change**: Build `all_refs` as `content_ids + quiz_attempt_ids`, where `quiz_attempt_ids` are completed `QuizAttempt` ids for quizzes in the scope (topic/chapter/subject). So both content and quiz XP are counted.

## Flow summary

1. **Content complete**  
   View → `GamificationService.award_xp(..., 'content_complete')` → updates `total_xp`, creates `XPTransaction`, updates `DailyActivity` (inside `award_xp`).

2. **Quiz complete**  
   View → `GamificationService.award_xp(..., 'quiz_complete', update_daily_activity=False)` → updates `total_xp`, creates `XPTransaction`; view then calls `AnalyticsService.update_daily_activity(..., xp_earned=xp)`.

3. **Mock complete**  
   Same as quiz: `award_xp(..., 'mock_complete', update_daily_activity=False)` + `update_daily_activity(..., xp_earned=xp)`.

4. **AI Quiz**  
   Same as quiz: `award_xp(..., 'ai_quiz', update_daily_activity=False)` + `update_daily_activity(..., xp_earned=xp_earned)`.

5. **Community**  
   `CommunityXPService.award_xp` → updates `total_xp` (F expression), creates `XPTransaction`, updates community stats, **and** updates today’s `DailyActivity.xp_earned`.

6. **Badge / level up**  
   Handled inside `GamificationService.award_xp` (and level-up bonus as a second transaction); both update `DailyActivity` when `update_daily_activity` is True.

## Files changed

- `gamification/models.py` – Added `content_complete`, `ai_quiz`; kept `mock_complete` (no `mock_test`).
- `gamification/services.py` – Skip daily activity for `mock_complete` (was `mock_test`).
- `quiz/views.py` – Use `'mock_complete'` when awarding mock test XP.
- `chatbot/views.py` – Use `GamificationService.award_xp` for AI quiz XP and keep `update_daily_activity(..., xp_earned=xp_earned)`.
- `community/services.py` – Update `DailyActivity.xp_earned` when awarding community XP.
- `exams/views.py` – Study leaderboard XP filter uses content IDs + quiz attempt IDs (not quiz IDs).
- `gamification/migrations/0005_xp_transaction_types.py` – Migration for new transaction type choices.

## Verification

- **Global XP**: Ensure every place that gives XP either calls `GamificationService.award_xp` or (for community) `CommunityXPService.award_xp` and that both update `profile.total_xp` and create an `XPTransaction`.
- **Period XP**: Ensure every such path also updates `DailyActivity.xp_earned` for the current day (either inside `award_xp` or in the view with `update_daily_activity(..., xp_earned=...)`).
- **Study leaderboard**: Ensure XP is aggregated by `reference_id` in the set of content IDs and quiz attempt IDs for the scope, not quiz IDs.
