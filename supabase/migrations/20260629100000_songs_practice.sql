-- ══════════════════════════════════════════════
-- Songs Practice tables
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Song" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL,
  "youtubeId"   TEXT,
  level         TEXT NOT NULL CHECK (level IN ('A2', 'B1', 'B2')),
  genre         TEXT CHECK (genre IN ('pop', 'rock', 'rap', 'indie', 'rnb', 'other')),
  lyrics        JSONB NOT NULL DEFAULT '[]',
  vocabulary    JSONB NOT NULL DEFAULT '[]',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "SongProgress" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"   UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "songId"      UUID NOT NULL REFERENCES "Song"(id) ON DELETE CASCADE,
  score         INT NOT NULL DEFAULT 0,
  "maxScore"    INT NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMPTZ,
  "xpEarned"    INT NOT NULL DEFAULT 0,
  UNIQUE ("studentId", "songId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Song_level_idx" ON "Song" (level);
CREATE INDEX IF NOT EXISTS "Song_published_idx" ON "Song" ("isPublished");
CREATE INDEX IF NOT EXISTS "SongProgress_studentId_idx" ON "SongProgress" ("studentId");

-- RLS
ALTER TABLE "Song" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SongProgress" ENABLE ROW LEVEL SECURITY;

-- Song: everyone reads published
CREATE POLICY "Song_read_published"
  ON "Song" FOR SELECT
  USING ("isPublished" = true);

-- SongProgress: students manage their own rows
CREATE POLICY "SongProgress_select_own"
  ON "SongProgress" FOR SELECT
  TO authenticated
  USING ("studentId" = auth.uid()::uuid);

CREATE POLICY "SongProgress_insert_own"
  ON "SongProgress" FOR INSERT
  TO authenticated
  WITH CHECK ("studentId" = auth.uid()::uuid);

CREATE POLICY "SongProgress_update_own"
  ON "SongProgress" FOR UPDATE
  TO authenticated
  USING ("studentId" = auth.uid()::uuid)
  WITH CHECK ("studentId" = auth.uid()::uuid);

-- XP enum additions
ALTER TYPE "XpActionKind" ADD VALUE IF NOT EXISTS 'SONG_COMPLETE';
ALTER TYPE "XpActionKind" ADD VALUE IF NOT EXISTS 'SONG_PERFECT';
