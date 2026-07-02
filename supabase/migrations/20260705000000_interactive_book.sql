-- ═══════════════════════════════════════════════════════════════════
-- Interactive Book: scanned book page as image + interactive overlay.
-- Hierarchy: Module -> BookPage (page image) -> PageExercise (bbox widget)
--            + PageExerciseAnswer (service-only key) + PageAttempt (student).
-- Book/Module already exist (20260701000000_books_module.sql).
-- ═══════════════════════════════════════════════════════════════════

-- Track how many pages a module's PDF was rendered into.
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "pageCount" INTEGER NOT NULL DEFAULT 0;

-- ── BookPage: one rendered page image of a module's PDF ──────────
CREATE TABLE IF NOT EXISTS "BookPage" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "moduleId"    UUID NOT NULL REFERENCES "Module"("id") ON DELETE CASCADE,
  "pageNumber"  INTEGER NOT NULL CHECK ("pageNumber" >= 1),
  "imageUrl"    TEXT NOT NULL,
  "imageWidth"  INTEGER NOT NULL DEFAULT 0,
  "imageHeight" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("moduleId","pageNumber")
);

-- ── PageExercise: an interactive widget positioned over a page ───
-- bbox is normalised 0..1 relative to the page image (resolution-independent).
-- NO correct answer here — this row is readable by students. Options for
-- CHOICE/MATCH carry only the visible labels (correct pick lives in the
-- answer table below), so nothing is leaked to the client.
CREATE TABLE IF NOT EXISTS "PageExercise" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pageId"     UUID NOT NULL REFERENCES "BookPage"("id") ON DELETE CASCADE,
  "kind"       TEXT NOT NULL CHECK ("kind" IN ('BLANK','CHOICE','TRUE_FALSE','MATCH','SHORT_TEXT','ORAL')),
  "x"          DOUBLE PRECISION NOT NULL CHECK ("x" >= 0 AND "x" <= 1),
  "y"          DOUBLE PRECISION NOT NULL CHECK ("y" >= 0 AND "y" <= 1),
  "w"          DOUBLE PRECISION NOT NULL CHECK ("w" > 0 AND "w" <= 1),
  "h"          DOUBLE PRECISION NOT NULL CHECK ("h" > 0 AND "h" <= 1),
  "prompt"     TEXT,
  "options"    JSONB NOT NULL DEFAULT '[]'::jsonb,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PageExerciseAnswer: the correct answer, hidden from students ─
-- RLS grants NO authenticated policy → only service_role (server routes)
-- can read/write. The check-answer route compares against this.
CREATE TABLE IF NOT EXISTS "PageExerciseAnswer" (
  "exerciseId"  UUID PRIMARY KEY REFERENCES "PageExercise"("id") ON DELETE CASCADE,
  "answerKey"   JSONB NOT NULL DEFAULT '{}'::jsonb,
  "explanation" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PageAttempt: a student's answer to one exercise ─────────────
CREATE TABLE IF NOT EXISTS "PageAttempt" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"  UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "exerciseId" UUID NOT NULL REFERENCES "PageExercise"("id") ON DELETE CASCADE,
  "response"   JSONB NOT NULL DEFAULT '{}'::jsonb,
  "isCorrect"  BOOLEAN,
  "score"      INTEGER CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
  "aiFeedback" JSONB,
  "audioUrl"   TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId","exerciseId")
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_book_page_module"    ON "BookPage"("moduleId","pageNumber");
CREATE INDEX IF NOT EXISTS "idx_page_exercise_page"  ON "PageExercise"("pageId","orderIndex");
CREATE INDEX IF NOT EXISTS "idx_page_attempt_student" ON "PageAttempt"("studentId");
CREATE INDEX IF NOT EXISTS "idx_page_attempt_exercise" ON "PageAttempt"("exerciseId");

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE "BookPage"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageExercise"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageExerciseAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageAttempt"        ENABLE ROW LEVEL SECURITY;

-- Page images + exercises: readable by any authenticated user; writes via service role.
CREATE POLICY "book_page_select"       ON "BookPage"     FOR SELECT TO authenticated USING (true);
CREATE POLICY "book_page_service_all"  ON "BookPage"     FOR ALL    TO service_role  USING (true);
CREATE POLICY "page_exercise_select"      ON "PageExercise" FOR SELECT TO authenticated USING (true);
CREATE POLICY "page_exercise_service_all" ON "PageExercise" FOR ALL    TO service_role  USING (true);

-- Answers: service role only (no authenticated policy = students cannot read).
CREATE POLICY "page_answer_service_all" ON "PageExerciseAnswer" FOR ALL TO service_role USING (true);

-- Attempts: student reads own; writes go through the service-role check route.
CREATE POLICY "page_attempt_select_own" ON "PageAttempt" FOR SELECT TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "page_attempt_service_all" ON "PageAttempt" FOR ALL TO service_role USING (true);
