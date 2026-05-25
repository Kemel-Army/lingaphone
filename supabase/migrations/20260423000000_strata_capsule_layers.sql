-- ═══════════════════════════════════════════════════════════════════════
-- Learning-path · 11-layer capsule architecture
--
-- Reshapes PathLesson into a capsule and introduces two new tables:
--   · CapsuleLayer   — 11 ordered layers that compose a capsule
--   · LayerProgress  — per-student, per-layer completion data
--
-- PathProgress is repurposed as a capsule-level aggregate.
-- Legacy PathLesson JSONB/TEXT content columns are removed — they are
-- superseded by CapsuleLayer.content (shape depends on layerType).
-- ═══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────
-- 1. Strip legacy content columns from PathLesson
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE "PathLesson"
  DROP COLUMN IF EXISTS "lectureContent",
  DROP COLUMN IF EXISTS "lectureContentKz",
  DROP COLUMN IF EXISTS "videoUrl",
  DROP COLUMN IF EXISTS "examples",
  DROP COLUMN IF EXISTS "quizQuestions",
  DROP COLUMN IF EXISTS "flashcards",
  DROP COLUMN IF EXISTS "matchingPairs";

-- capsule metadata
ALTER TABLE "PathLesson"
  ADD COLUMN IF NOT EXISTS "masteryThreshold" INTEGER NOT NULL DEFAULT 80
    CHECK ("masteryThreshold" BETWEEN 50 AND 100),
  ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK ("difficulty" IN ('LIGHT', 'STANDARD', 'DEEP'));

-- ──────────────────────────────────────────────────────────────────────
-- 2. CapsuleLayer — 11 ordered layers per PathLesson
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CapsuleLayer" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId"            UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "layerType"           TEXT NOT NULL CHECK ("layerType" IN (
                          'HOOK',
                          'DIAGNOSTIC',
                          'INTUITION',
                          'EXPLANATION',
                          'FORMALIZATION',
                          'WALKTHROUGH',
                          'TRAINER',
                          'SCENARIO',
                          'TRAPS',
                          'TEACH_BACK',
                          'MASTERY_CHECK'
                        )),
  "orderIndex"          INTEGER NOT NULL CHECK ("orderIndex" BETWEEN 1 AND 11),
  "title"               TEXT NOT NULL,
  "titleKz"             TEXT,
  "subtitle"            TEXT,
  "subtitleKz"          TEXT,
  "icon"                TEXT NOT NULL DEFAULT 'i-lucide-sparkles',
  "accentColor"         TEXT NOT NULL DEFAULT 'green',
  "estimatedMinutes"    INTEGER NOT NULL DEFAULT 3,
  "xpReward"            INTEGER NOT NULL DEFAULT 10,
  -- Layer-specific payload. Shape is discriminated by layerType and
  -- validated in application code (see app/shared/types/capsule.ts).
  "content"             JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Automatic completion criteria (e.g. { "minScore": 75, "minAnswers": 3 }).
  "completionCriteria"  JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("lessonId", "orderIndex"),
  UNIQUE ("lessonId", "layerType")
);

CREATE INDEX IF NOT EXISTS "idx_capsule_layer_lesson"
  ON "CapsuleLayer"("lessonId", "orderIndex");

-- ──────────────────────────────────────────────────────────────────────
-- 3. LayerProgress — per student, per layer
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LayerProgress" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"         UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "layerId"           UUID NOT NULL REFERENCES "CapsuleLayer"("id") ON DELETE CASCADE,
  -- Denormalised for efficient "progress by capsule" queries.
  "lessonId"          UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "status"            TEXT NOT NULL DEFAULT 'LOCKED'
    CHECK ("status" IN ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  "score"             INTEGER CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
  "maxScore"          INTEGER,
  "attempts"          INTEGER NOT NULL DEFAULT 0,
  "timeSpentSeconds"  INTEGER NOT NULL DEFAULT 0,
  "xpEarned"          INTEGER NOT NULL DEFAULT 0,
  -- Free-form interaction log (answers, hint requests, scenario choices…).
  "interactionData"   JSONB NOT NULL DEFAULT '{}'::jsonb,
  "startedAt"         TIMESTAMPTZ,
  "completedAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId", "layerId")
);

CREATE INDEX IF NOT EXISTS "idx_layer_progress_student_lesson"
  ON "LayerProgress"("studentId", "lessonId");
CREATE INDEX IF NOT EXISTS "idx_layer_progress_layer"
  ON "LayerProgress"("layerId");

-- ──────────────────────────────────────────────────────────────────────
-- 4. Reshape PathProgress into a capsule-level aggregate
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE "PathProgress"
  DROP COLUMN IF EXISTS "lectureCompleted",
  DROP COLUMN IF EXISTS "examplesCompleted",
  DROP COLUMN IF EXISTS "cardsCompleted",
  DROP COLUMN IF EXISTS "quizScore",
  DROP COLUMN IF EXISTS "quizMaxScore";

ALTER TABLE "PathProgress"
  ADD COLUMN IF NOT EXISTS "currentLayerIndex" INTEGER NOT NULL DEFAULT 1
    CHECK ("currentLayerIndex" BETWEEN 1 AND 11),
  ADD COLUMN IF NOT EXISTS "layersCompleted" INTEGER NOT NULL DEFAULT 0
    CHECK ("layersCompleted" BETWEEN 0 AND 11),
  ADD COLUMN IF NOT EXISTS "masteryScore" INTEGER
    CHECK ("masteryScore" IS NULL OR "masteryScore" BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS "masteryMaxScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "masteryAchieved" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMPTZ;

-- ──────────────────────────────────────────────────────────────────────
-- 5. RLS — CapsuleLayer (read-only to auth users; writes via service role)
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE "CapsuleLayer" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capsule_layer_select" ON "CapsuleLayer";
CREATE POLICY "capsule_layer_select" ON "CapsuleLayer"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "capsule_layer_service_all" ON "CapsuleLayer";
CREATE POLICY "capsule_layer_service_all" ON "CapsuleLayer"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────
-- 6. RLS — LayerProgress (own data + parent/tutor read of their students)
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE "LayerProgress" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "layer_progress_select_own" ON "LayerProgress";
CREATE POLICY "layer_progress_select_own" ON "LayerProgress"
  FOR SELECT TO authenticated
  USING (
    "studentId" IN (
      SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "layer_progress_insert_own" ON "LayerProgress";
CREATE POLICY "layer_progress_insert_own" ON "LayerProgress"
  FOR INSERT TO authenticated
  WITH CHECK (
    "studentId" IN (
      SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "layer_progress_update_own" ON "LayerProgress";
CREATE POLICY "layer_progress_update_own" ON "LayerProgress"
  FOR UPDATE TO authenticated
  USING (
    "studentId" IN (
      SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()
    )
  );

-- Parents see their children's progress
DROP POLICY IF EXISTS "layer_progress_parent_read" ON "LayerProgress";
CREATE POLICY "layer_progress_parent_read" ON "LayerProgress"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "ParentToStudent" pts
      JOIN "Parent" p ON p.id = pts."parentId"
      WHERE pts."studentId" = "LayerProgress"."studentId"
        AND p."userId" = public.get_current_user_id()
    )
  );

-- Tutors see their students' progress
DROP POLICY IF EXISTS "layer_progress_tutor_read" ON "LayerProgress";
CREATE POLICY "layer_progress_tutor_read" ON "LayerProgress"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Student" s
      JOIN "Tutor" t ON t.id = s."tutorId"
      WHERE s.id = "LayerProgress"."studentId"
        AND t."userId" = public.get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "layer_progress_service_all" ON "LayerProgress";
CREATE POLICY "layer_progress_service_all" ON "LayerProgress"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────
-- 7. updatedAt trigger — shared helper (create once, reuse)
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capsule_layer_set_updated_at ON "CapsuleLayer";
CREATE TRIGGER capsule_layer_set_updated_at
  BEFORE UPDATE ON "CapsuleLayer"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS layer_progress_set_updated_at ON "LayerProgress";
CREATE TRIGGER layer_progress_set_updated_at
  BEFORE UPDATE ON "LayerProgress"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
