-- ══════════════════════════════════════════════
-- Reading Library tables
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "ReadingText" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  "audioUrl"    TEXT,
  level         TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  genre         TEXT NOT NULL CHECK (genre IN ('story', 'article', 'comic', 'dialogue')),
  topic         TEXT,
  "wordCount"   INT,
  vocabulary    JSONB NOT NULL DEFAULT '[]',
  "imageUrl"    TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ReadingQuestion" (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "textId"  UUID NOT NULL REFERENCES "ReadingText"(id) ON DELETE CASCADE,
  type      TEXT NOT NULL CHECK (type IN ('MCQ', 'TRUE_FALSE', 'FILL', 'OPEN')),
  question  TEXT NOT NULL,
  options   JSONB,
  answer    TEXT NOT NULL,
  points    INT NOT NULL DEFAULT 10,
  "order"   INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "ReadingProgress" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"   UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "textId"      UUID NOT NULL REFERENCES "ReadingText"(id) ON DELETE CASCADE,
  score         INT NOT NULL DEFAULT 0,
  "maxScore"    INT NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMPTZ,
  "xpEarned"    INT NOT NULL DEFAULT 0,
  UNIQUE ("studentId", "textId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ReadingText_level_idx" ON "ReadingText" (level);
CREATE INDEX IF NOT EXISTS "ReadingText_published_idx" ON "ReadingText" ("isPublished");
CREATE INDEX IF NOT EXISTS "ReadingQuestion_textId_idx" ON "ReadingQuestion" ("textId");
CREATE INDEX IF NOT EXISTS "ReadingProgress_studentId_idx" ON "ReadingProgress" ("studentId");

-- RLS
ALTER TABLE "ReadingText" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadingQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadingProgress" ENABLE ROW LEVEL SECURITY;

-- ReadingText: everyone reads published, only service role writes
CREATE POLICY "ReadingText_read_published"
  ON "ReadingText" FOR SELECT
  USING ("isPublished" = true);

-- ReadingQuestion: authenticated users can read
CREATE POLICY "ReadingQuestion_read_authenticated"
  ON "ReadingQuestion" FOR SELECT
  TO authenticated
  USING (true);

-- ReadingProgress: students manage their own rows
CREATE POLICY "ReadingProgress_select_own"
  ON "ReadingProgress" FOR SELECT
  TO authenticated
  USING ("studentId" = auth.uid()::uuid);

CREATE POLICY "ReadingProgress_insert_own"
  ON "ReadingProgress" FOR INSERT
  TO authenticated
  WITH CHECK ("studentId" = auth.uid()::uuid);

CREATE POLICY "ReadingProgress_update_own"
  ON "ReadingProgress" FOR UPDATE
  TO authenticated
  USING ("studentId" = auth.uid()::uuid)
  WITH CHECK ("studentId" = auth.uid()::uuid);

-- XP enum additions
ALTER TYPE "XpActionKind" ADD VALUE IF NOT EXISTS 'READING_COMPLETE';
ALTER TYPE "XpActionKind" ADD VALUE IF NOT EXISTS 'READING_PERFECT';
