-- ═══════════════════════════════════════════════════════════════════
-- Learning Path capsules ("Мой путь") — English, linked to Book.
-- Adapted from the arna-tutor capsule model.
-- Hierarchy: Book -> PathTopic -> PathLesson (capsule) -> 11 CapsuleLayer.
-- Progress: PathProgress (capsule) + LayerProgress (layer).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "PathTopic" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookId"          UUID REFERENCES "Book"("id") ON DELETE CASCADE,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "level"           TEXT,
  "icon"            TEXT NOT NULL DEFAULT 'i-lucide-book-open',
  "color"           TEXT NOT NULL DEFAULT 'green',
  "orderIndex"      INTEGER NOT NULL DEFAULT 0,
  "totalXp"         INTEGER NOT NULL DEFAULT 0,
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PathLesson" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pathTopicId"      UUID NOT NULL REFERENCES "PathTopic"("id") ON DELETE CASCADE,
  "title"            TEXT NOT NULL,
  "subtitle"         TEXT,
  "orderIndex"       INTEGER NOT NULL DEFAULT 0,
  "durationMinutes"  INTEGER NOT NULL DEFAULT 15,
  "xpReward"         INTEGER NOT NULL DEFAULT 50,
  "masteryThreshold" INTEGER NOT NULL DEFAULT 80 CHECK ("masteryThreshold" BETWEEN 50 AND 100),
  "difficulty"       TEXT NOT NULL DEFAULT 'STANDARD' CHECK ("difficulty" IN ('LIGHT','STANDARD','DEEP')),
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CapsuleLayer" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId"           UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "layerType"          TEXT NOT NULL CHECK ("layerType" IN
    ('HOOK','DIAGNOSTIC','INTUITION','EXPLANATION','FORMALIZATION',
     'WALKTHROUGH','TRAINER','SCENARIO','TRAPS','TEACH_BACK','MASTERY_CHECK')),
  "orderIndex"         INTEGER NOT NULL CHECK ("orderIndex" BETWEEN 1 AND 11),
  "title"              TEXT NOT NULL,
  "subtitle"           TEXT,
  "icon"               TEXT NOT NULL DEFAULT 'i-lucide-sparkles',
  "accentColor"        TEXT NOT NULL DEFAULT 'green',
  "estimatedMinutes"   INTEGER NOT NULL DEFAULT 3,
  "xpReward"           INTEGER NOT NULL DEFAULT 10,
  "content"            JSONB NOT NULL DEFAULT '{}'::jsonb,
  "completionCriteria" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("lessonId","orderIndex"),
  UNIQUE ("lessonId","layerType")
);

CREATE TABLE IF NOT EXISTS "LayerProgress" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"        UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "layerId"          UUID NOT NULL REFERENCES "CapsuleLayer"("id") ON DELETE CASCADE,
  "lessonId"         UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "status"           TEXT NOT NULL DEFAULT 'LOCKED' CHECK ("status" IN ('LOCKED','AVAILABLE','IN_PROGRESS','COMPLETED','FAILED')),
  "score"            INTEGER CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
  "maxScore"         INTEGER,
  "attempts"         INTEGER NOT NULL DEFAULT 0,
  "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
  "xpEarned"         INTEGER NOT NULL DEFAULT 0,
  "interactionData"  JSONB NOT NULL DEFAULT '{}'::jsonb,
  "startedAt"        TIMESTAMPTZ,
  "completedAt"      TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId","layerId")
);

CREATE TABLE IF NOT EXISTS "PathProgress" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"         UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "pathLessonId"      UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "currentLayerIndex" INTEGER NOT NULL DEFAULT 1 CHECK ("currentLayerIndex" BETWEEN 1 AND 11),
  "layersCompleted"   INTEGER NOT NULL DEFAULT 0 CHECK ("layersCompleted" BETWEEN 0 AND 11),
  "masteryScore"      INTEGER CHECK ("masteryScore" IS NULL OR "masteryScore" BETWEEN 0 AND 100),
  "masteryMaxScore"   INTEGER,
  "masteryAchieved"   BOOLEAN NOT NULL DEFAULT FALSE,
  "xpEarned"          INTEGER NOT NULL DEFAULT 0,
  "lastActivityAt"    TIMESTAMPTZ,
  "completedAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId","pathLessonId")
);

CREATE INDEX IF NOT EXISTS "idx_path_topic_book" ON "PathTopic"("bookId");
CREATE INDEX IF NOT EXISTS "idx_path_lesson_topic" ON "PathLesson"("pathTopicId");
CREATE INDEX IF NOT EXISTS "idx_capsule_layer_lesson" ON "CapsuleLayer"("lessonId","orderIndex");
CREATE INDEX IF NOT EXISTS "idx_layer_progress_student_lesson" ON "LayerProgress"("studentId","lessonId");
CREATE INDEX IF NOT EXISTS "idx_layer_progress_layer" ON "LayerProgress"("layerId");
CREATE INDEX IF NOT EXISTS "idx_path_progress_student" ON "PathProgress"("studentId");
CREATE INDEX IF NOT EXISTS "idx_path_progress_lesson" ON "PathProgress"("pathLessonId");

ALTER TABLE "PathTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PathLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CapsuleLayer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LayerProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PathProgress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "path_topic_select" ON "PathTopic" FOR SELECT TO authenticated USING (true);
CREATE POLICY "path_topic_service_all" ON "PathTopic" FOR ALL TO service_role USING (true);
CREATE POLICY "path_lesson_select" ON "PathLesson" FOR SELECT TO authenticated USING (true);
CREATE POLICY "path_lesson_service_all" ON "PathLesson" FOR ALL TO service_role USING (true);
CREATE POLICY "capsule_layer_select" ON "CapsuleLayer" FOR SELECT TO authenticated USING (true);
CREATE POLICY "capsule_layer_service_all" ON "CapsuleLayer" FOR ALL TO service_role USING (true);

CREATE POLICY "layer_progress_select_own" ON "LayerProgress" FOR SELECT TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "layer_progress_insert_own" ON "LayerProgress" FOR INSERT TO authenticated
  WITH CHECK ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "layer_progress_update_own" ON "LayerProgress" FOR UPDATE TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "layer_progress_service_all" ON "LayerProgress" FOR ALL TO service_role USING (true);

CREATE POLICY "path_progress_select_own" ON "PathProgress" FOR SELECT TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "path_progress_insert_own" ON "PathProgress" FOR INSERT TO authenticated
  WITH CHECK ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "path_progress_update_own" ON "PathProgress" FOR UPDATE TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "path_progress_service_all" ON "PathProgress" FOR ALL TO service_role USING (true);
