-- ═══════════════════════════════════════════════════════════════
-- Learning Path tables: PathTopic, PathLesson, PathProgress
-- "Мой путь" — structured learning journey for students
-- ═══════════════════════════════════════════════════════════════

-- PathTopic: A topic/module in the learning path (e.g. "Дроби")
CREATE TABLE IF NOT EXISTS "PathTopic" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId"   UUID NOT NULL REFERENCES "Subject"("id") ON DELETE CASCADE,
  "name"        TEXT NOT NULL,
  "nameKz"      TEXT,
  "description"  TEXT,
  "descriptionKz" TEXT,
  "icon"        TEXT DEFAULT 'i-lucide-book-open',
  "color"       TEXT DEFAULT 'primary',
  "orderIndex"  INTEGER NOT NULL DEFAULT 0,
  "gradeLevel"  INTEGER NOT NULL DEFAULT 5,
  "totalXp"     INTEGER NOT NULL DEFAULT 0,
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PathLesson: A lesson inside a topic with full content
CREATE TABLE IF NOT EXISTS "PathLesson" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pathTopicId"      UUID NOT NULL REFERENCES "PathTopic"("id") ON DELETE CASCADE,
  "title"            TEXT NOT NULL,
  "titleKz"          TEXT,
  "subtitle"         TEXT,
  "subtitleKz"       TEXT,
  "orderIndex"       INTEGER NOT NULL DEFAULT 0,
  "durationMinutes"  INTEGER NOT NULL DEFAULT 15,
  "xpReward"         INTEGER NOT NULL DEFAULT 100,
  "lectureContent"   TEXT NOT NULL DEFAULT '',
  "lectureContentKz" TEXT,
  "videoUrl"         TEXT,
  "examples"         JSONB NOT NULL DEFAULT '[]'::jsonb,
  "quizQuestions"    JSONB NOT NULL DEFAULT '[]'::jsonb,
  "flashcards"       JSONB NOT NULL DEFAULT '[]'::jsonb,
  "matchingPairs"    JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PathProgress: Per-student, per-lesson progress tracking
CREATE TABLE IF NOT EXISTS "PathProgress" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"         UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "pathLessonId"      UUID NOT NULL REFERENCES "PathLesson"("id") ON DELETE CASCADE,
  "lectureCompleted"  BOOLEAN NOT NULL DEFAULT false,
  "examplesCompleted" BOOLEAN NOT NULL DEFAULT false,
  "quizScore"         INTEGER,
  "quizMaxScore"      INTEGER,
  "cardsCompleted"    BOOLEAN NOT NULL DEFAULT false,
  "xpEarned"          INTEGER NOT NULL DEFAULT 0,
  "completedAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "pathLessonId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_path_topic_subject ON "PathTopic"("subjectId");
CREATE INDEX IF NOT EXISTS idx_path_topic_order ON "PathTopic"("orderIndex");
CREATE INDEX IF NOT EXISTS idx_path_lesson_topic ON "PathLesson"("pathTopicId");
CREATE INDEX IF NOT EXISTS idx_path_lesson_order ON "PathLesson"("orderIndex");
CREATE INDEX IF NOT EXISTS idx_path_progress_student ON "PathProgress"("studentId");
CREATE INDEX IF NOT EXISTS idx_path_progress_lesson ON "PathProgress"("pathLessonId");

-- RLS
ALTER TABLE "PathTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PathLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PathProgress" ENABLE ROW LEVEL SECURITY;

-- PathTopic: Anyone authenticated can read
CREATE POLICY "PathTopic: read for authenticated" ON "PathTopic"
  FOR SELECT TO authenticated USING (true);

-- PathLesson: Anyone authenticated can read
CREATE POLICY "PathLesson: read for authenticated" ON "PathLesson"
  FOR SELECT TO authenticated USING (true);

-- PathProgress: Students see their own progress
CREATE POLICY "PathProgress: student reads own" ON "PathProgress"
  FOR SELECT TO authenticated
  USING ("studentId" IN (
    SELECT s."id" FROM "Student" s
    JOIN "User" u ON s."userId" = u."id"
    WHERE u."authId" = auth.uid()::text
  ));

-- PathProgress: Students can insert/update own
CREATE POLICY "PathProgress: student inserts own" ON "PathProgress"
  FOR INSERT TO authenticated
  WITH CHECK ("studentId" IN (
    SELECT s."id" FROM "Student" s
    JOIN "User" u ON s."userId" = u."id"
    WHERE u."authId" = auth.uid()::text
  ));

CREATE POLICY "PathProgress: student updates own" ON "PathProgress"
  FOR UPDATE TO authenticated
  USING ("studentId" IN (
    SELECT s."id" FROM "Student" s
    JOIN "User" u ON s."userId" = u."id"
    WHERE u."authId" = auth.uid()::text
  ));

-- Tutors/admins can read all progress
CREATE POLICY "PathProgress: tutor/admin reads all" ON "PathProgress"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."authId" = auth.uid()::text
      AND u."role" IN ('TUTOR', 'ADMIN')
    )
  );

-- Service role full access (for seed scripts)
CREATE POLICY "PathTopic: service role" ON "PathTopic"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "PathLesson: service role" ON "PathLesson"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "PathProgress: service role" ON "PathProgress"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
