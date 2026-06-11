-- ═══════════════════════════════════════════════════════════════
-- Grammar Platform: schema + RLS
-- ═══════════════════════════════════════════════════════════════

-- XP action enum extensions
ALTER TYPE "XPAction" ADD VALUE IF NOT EXISTS 'GRAMMAR_COMPLETE';
ALTER TYPE "XPAction" ADD VALUE IF NOT EXISTS 'GRAMMAR_PERFECT';

-- ── Tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "GrammarTopic" (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        UNIQUE NOT NULL,
  title       TEXT        NOT NULL,
  level       TEXT        NOT NULL CHECK (level IN ('A1','A2','B1','B2')),
  "order"     INT         NOT NULL,
  videoUrl    TEXT,
  theoryMd    TEXT        NOT NULL DEFAULT '',
  isPublished BOOLEAN     NOT NULL DEFAULT false,
  createdAt   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "GrammarExercise" (
  id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  topicId  UUID    NOT NULL REFERENCES "GrammarTopic"(id) ON DELETE CASCADE,
  type     TEXT    NOT NULL CHECK (type IN ('MCQ','FILL','TRANSFORM')),
  prompt   TEXT    NOT NULL,
  options  JSONB,
  answer   TEXT    NOT NULL,
  hint     TEXT,
  points   INT     NOT NULL DEFAULT 10,
  "order"  INT     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_grammar_exercise_topic ON "GrammarExercise"(topicId);
CREATE INDEX IF NOT EXISTS idx_grammar_topic_level ON "GrammarTopic"(level, "order");

CREATE TABLE IF NOT EXISTS "GrammarProgress" (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId     UUID        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  topicId       UUID        NOT NULL REFERENCES "GrammarTopic"(id) ON DELETE CASCADE,
  mastery       FLOAT       NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 1),
  attempts      INT         NOT NULL DEFAULT 0,
  bestScore     INT         NOT NULL DEFAULT 0,
  maxScore      INT         NOT NULL DEFAULT 0,
  lastPracticed TIMESTAMPTZ,
  completedAt   TIMESTAMPTZ,
  UNIQUE(studentId, topicId)
);

CREATE INDEX IF NOT EXISTS idx_grammar_progress_student ON "GrammarProgress"(studentId);

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE "GrammarTopic"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GrammarExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GrammarProgress" ENABLE ROW LEVEL SECURITY;

-- Published topics are readable by all authenticated users
CREATE POLICY "grammar_topics_select"
  ON "GrammarTopic" FOR SELECT TO authenticated
  USING ("isPublished" = true);

-- Exercises are readable by all authenticated users
CREATE POLICY "grammar_exercises_select"
  ON "GrammarExercise" FOR SELECT TO authenticated
  USING (true);

-- Progress: each student manages only their own rows
CREATE POLICY "grammar_progress_select"
  ON "GrammarProgress" FOR SELECT TO authenticated
  USING ("studentId" = auth.uid());

CREATE POLICY "grammar_progress_insert"
  ON "GrammarProgress" FOR INSERT TO authenticated
  WITH CHECK ("studentId" = auth.uid());

CREATE POLICY "grammar_progress_update"
  ON "GrammarProgress" FOR UPDATE TO authenticated
  USING ("studentId" = auth.uid());
