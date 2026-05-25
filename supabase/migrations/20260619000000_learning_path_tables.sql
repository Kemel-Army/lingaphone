-- ═══════════════════════════════════════════════════
-- Learning Path: PathTopic, PathLesson, PathProgress
-- "Мой путь" — самостоятельные уроки с лекцией,
-- примерами, карточками и квизом
-- ═══════════════════════════════════════════════════

-- ──────────────────────────────────────
-- PathTopic — разделы пути (e.g. Дроби, Уравнения)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PathTopic" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId"       UUID NOT NULL REFERENCES "Subject"("id") ON DELETE CASCADE,
  "name"            TEXT NOT NULL,
  "nameKz"          TEXT,
  "description"     TEXT,
  "descriptionKz"   TEXT,
  "icon"            TEXT NOT NULL DEFAULT 'i-lucide-book-open',
  "color"           TEXT NOT NULL DEFAULT 'green',
  "orderIndex"      INTEGER NOT NULL DEFAULT 0,
  "gradeLevel"      INTEGER NOT NULL DEFAULT 5,
  "totalXp"         INTEGER NOT NULL DEFAULT 0,
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────
-- PathLesson — урок внутри раздела
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PathLesson" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pathTopicId"       UUID NOT NULL REFERENCES "PathTopic"("id") ON DELETE CASCADE,
  "title"             TEXT NOT NULL,
  "titleKz"           TEXT,
  "subtitle"          TEXT,
  "subtitleKz"        TEXT,
  "orderIndex"        INTEGER NOT NULL DEFAULT 0,
  "durationMinutes"   INTEGER NOT NULL DEFAULT 15,
  "xpReward"          INTEGER NOT NULL DEFAULT 50,
  "lectureContent"    TEXT NOT NULL DEFAULT '',
  "lectureContentKz"  TEXT,
  "videoUrl"          TEXT,
  "examples"          JSONB NOT NULL DEFAULT '[]'::jsonb,
  "quizQuestions"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "flashcards"        JSONB NOT NULL DEFAULT '[]'::jsonb,
  "matchingPairs"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────
-- PathProgress — прогресс ученика по уроку
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PathProgress" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"         UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "pathLessonId"      UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "lectureCompleted"  BOOLEAN NOT NULL DEFAULT FALSE,
  "examplesCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "cardsCompleted"    BOOLEAN NOT NULL DEFAULT FALSE,
  "quizScore"         INTEGER,
  "quizMaxScore"      INTEGER,
  "xpEarned"          INTEGER NOT NULL DEFAULT 0,
  "completedAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId", "pathLessonId")
);

-- ──────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_path_topic_subject" ON "PathTopic"("subjectId");
CREATE INDEX IF NOT EXISTS "idx_path_topic_grade" ON "PathTopic"("gradeLevel");
CREATE INDEX IF NOT EXISTS "idx_path_lesson_topic" ON "PathLesson"("pathTopicId");
CREATE INDEX IF NOT EXISTS "idx_path_progress_student" ON "PathProgress"("studentId");
CREATE INDEX IF NOT EXISTS "idx_path_progress_lesson" ON "PathProgress"("pathLessonId");

-- ──────────────────────────────────────
-- RLS
-- ──────────────────────────────────────
ALTER TABLE "PathTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PathLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PathProgress" ENABLE ROW LEVEL SECURITY;

-- PathTopic: читают все авторизованные, пишут только admins (service role)
CREATE POLICY "path_topic_select" ON "PathTopic"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "path_topic_admin_all" ON "PathTopic"
  FOR ALL TO service_role USING (true);

-- PathLesson: читают все авторизованные
CREATE POLICY "path_lesson_select" ON "PathLesson"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "path_lesson_admin_all" ON "PathLesson"
  FOR ALL TO service_role USING (true);

-- PathProgress: студент видит и изменяет только свой прогресс
CREATE POLICY "path_progress_select_own" ON "PathProgress"
  FOR SELECT TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));

CREATE POLICY "path_progress_insert_own" ON "PathProgress"
  FOR INSERT TO authenticated
  WITH CHECK ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));

CREATE POLICY "path_progress_update_own" ON "PathProgress"
  FOR UPDATE TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));

CREATE POLICY "path_progress_service_all" ON "PathProgress"
  FOR ALL TO service_role USING (true);
