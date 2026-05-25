-- ═══════════════════════════════════════════════════
-- FEMO Battle — Kahoot-like classroom math game
-- Anonymous play via PIN. Teacher creates session,
-- students join via /play/[pin] without auth.
-- ═══════════════════════════════════════════════════

CREATE TYPE "BattleStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'ENDED');

-- ──────────────────────────────────────
-- BattleQuestion — банк вопросов
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BattleQuestion" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "gradeLevel"  INTEGER NOT NULL CHECK ("gradeLevel" BETWEEN 1 AND 6),
  "topic"       TEXT NOT NULL,
  "topicKz"     TEXT,
  "text"        TEXT NOT NULL,
  "textKz"      TEXT,
  "options"     JSONB NOT NULL,
  "correctIndex" INTEGER NOT NULL CHECK ("correctIndex" BETWEEN 0 AND 3),
  "difficulty"  INTEGER NOT NULL DEFAULT 1 CHECK ("difficulty" BETWEEN 1 AND 5),
  "explanation" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_battle_question_grade_topic"
  ON "BattleQuestion"("gradeLevel", "topic");

-- ──────────────────────────────────────
-- BattleSession — игровая сессия
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BattleSession" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pin"                 TEXT NOT NULL UNIQUE,
  "gradeLevel"          INTEGER NOT NULL CHECK ("gradeLevel" BETWEEN 1 AND 6),
  "topic"               TEXT NOT NULL,
  "status"              "BattleStatus" NOT NULL DEFAULT 'WAITING',
  "questionCount"       INTEGER NOT NULL DEFAULT 10,
  "secondsPerQuestion"  INTEGER NOT NULL DEFAULT 20,
  "currentIndex"        INTEGER NOT NULL DEFAULT -1,
  "currentQuestionStartAt" TIMESTAMPTZ,
  "hostUserId"          UUID,
  "startedAt"           TIMESTAMPTZ,
  "endedAt"             TIMESTAMPTZ,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_battle_session_pin" ON "BattleSession"("pin");
CREATE INDEX IF NOT EXISTS "idx_battle_session_status" ON "BattleSession"("status");

-- ──────────────────────────────────────
-- BattleSessionQuestion — снимок вопросов для сессии
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BattleSessionQuestion" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId"     UUID NOT NULL REFERENCES "BattleSession"("id") ON DELETE CASCADE,
  "questionId"    UUID NOT NULL REFERENCES "BattleQuestion"("id") ON DELETE RESTRICT,
  "orderIndex"    INTEGER NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("sessionId", "orderIndex")
);

CREATE INDEX IF NOT EXISTS "idx_battle_sq_session" ON "BattleSessionQuestion"("sessionId");

-- ──────────────────────────────────────
-- BattlePlayer — игрок в сессии (анонимный)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BattlePlayer" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId"     UUID NOT NULL REFERENCES "BattleSession"("id") ON DELETE CASCADE,
  "nickname"      TEXT NOT NULL,
  "avatar"        TEXT NOT NULL DEFAULT 'fox',
  "totalScore"    INTEGER NOT NULL DEFAULT 0,
  "correctCount"  INTEGER NOT NULL DEFAULT 0,
  "joinedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "leftAt"        TIMESTAMPTZ,
  UNIQUE ("sessionId", "nickname")
);

CREATE INDEX IF NOT EXISTS "idx_battle_player_session" ON "BattlePlayer"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_battle_player_score" ON "BattlePlayer"("sessionId", "totalScore" DESC);

-- ──────────────────────────────────────
-- BattleAnswer — ответ игрока на вопрос
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BattleAnswer" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionQuestionId" UUID NOT NULL REFERENCES "BattleSessionQuestion"("id") ON DELETE CASCADE,
  "playerId"          UUID NOT NULL REFERENCES "BattlePlayer"("id") ON DELETE CASCADE,
  "selectedIndex"     INTEGER NOT NULL CHECK ("selectedIndex" BETWEEN 0 AND 3),
  "isCorrect"         BOOLEAN NOT NULL,
  "responseTimeMs"    INTEGER NOT NULL,
  "pointsAwarded"     INTEGER NOT NULL DEFAULT 0,
  "answeredAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("sessionQuestionId", "playerId")
);

CREATE INDEX IF NOT EXISTS "idx_battle_answer_sq" ON "BattleAnswer"("sessionQuestionId");
CREATE INDEX IF NOT EXISTS "idx_battle_answer_player" ON "BattleAnswer"("playerId");

-- ──────────────────────────────────────
-- RLS — публичный анонимный доступ для активных сессий
-- ──────────────────────────────────────
ALTER TABLE "BattleQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattleSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattleSessionQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattlePlayer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattleAnswer" ENABLE ROW LEVEL SECURITY;

-- BattleQuestion: read by anyone (public bank), write only service_role
CREATE POLICY "battle_q_select_all" ON "BattleQuestion"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "battle_q_service_all" ON "BattleQuestion"
  FOR ALL TO service_role USING (true);

-- BattleSession: read by anyone (PIN is the gate), write via service_role only
CREATE POLICY "battle_session_select_all" ON "BattleSession"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "battle_session_service_all" ON "BattleSession"
  FOR ALL TO service_role USING (true);

-- BattleSessionQuestion: read public (so host can show questions), write service_role
CREATE POLICY "battle_sq_select_all" ON "BattleSessionQuestion"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "battle_sq_service_all" ON "BattleSessionQuestion"
  FOR ALL TO service_role USING (true);

-- BattlePlayer: read public, write service_role (server validates nickname uniqueness)
CREATE POLICY "battle_player_select_all" ON "BattlePlayer"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "battle_player_service_all" ON "BattlePlayer"
  FOR ALL TO service_role USING (true);

-- BattleAnswer: read public, write service_role (server scores)
CREATE POLICY "battle_answer_select_all" ON "BattleAnswer"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "battle_answer_service_all" ON "BattleAnswer"
  FOR ALL TO service_role USING (true);
