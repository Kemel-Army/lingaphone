-- ============================================================================
-- XPActionType enum extension
--
-- The application code in /api/gamification/award-xp.post.ts and
-- /update-quest-progress.post.ts references action values that are not yet
-- members of the DB enum: QUEST_DAILY, QUEST_WEEKLY, DAILY_BONUS, WEEKLY_BONUS,
-- ACHIEVEMENT_REWARD. Inserts with those values 22P02 today. This migration
-- adds them.
--
-- Postgres requires ALTER TYPE ... ADD VALUE to be committed before the new
-- value is usable, so it sits in its own migration ahead of the RPCs that
-- reference them.
-- ============================================================================

ALTER TYPE public."XPActionType" ADD VALUE IF NOT EXISTS 'QUEST_DAILY';
ALTER TYPE public."XPActionType" ADD VALUE IF NOT EXISTS 'QUEST_WEEKLY';
ALTER TYPE public."XPActionType" ADD VALUE IF NOT EXISTS 'DAILY_BONUS';
ALTER TYPE public."XPActionType" ADD VALUE IF NOT EXISTS 'WEEKLY_BONUS';
ALTER TYPE public."XPActionType" ADD VALUE IF NOT EXISTS 'ACHIEVEMENT_REWARD';
