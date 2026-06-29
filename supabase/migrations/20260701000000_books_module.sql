-- ═══════════════════════════════════════════════════════════════
-- Books Module (ТЗ §2.2, §3): Book → Module → Game + storage bucket
-- ═══════════════════════════════════════════════════════════════
-- Adapted from the Prisma sketch in ТЗ to the project's Supabase
-- conventions (TEXT level CHECK like GrammarTopic/ReadingText, RLS,
-- service-role writes). No EnglishLevel enum type is created — the
-- codebase stores CEFR level as TEXT everywhere.

-- ── Tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Book" (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  level         TEXT        NOT NULL CHECK (level IN ('A1','A2','B1','B2')),
  "coverUrl"    TEXT,
  "isPublished" BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Module" (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookId"    UUID        NOT NULL REFERENCES "Book"(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  "order"     INT         NOT NULL DEFAULT 1,
  "pdfUrl"    TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Game" (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL,          -- mechanic id: word-puzzle, drag-drop …
  title       TEXT        NOT NULL,
  level       TEXT        NOT NULL CHECK (level IN ('A1','A2','B1','B2')),
  config      JSONB       NOT NULL DEFAULT '{}',
  "moduleId"  UUID        REFERENCES "Module"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_book_level        ON "Book"(level);
CREATE INDEX IF NOT EXISTS idx_book_published     ON "Book"("isPublished");
CREATE INDEX IF NOT EXISTS idx_module_book        ON "Module"("bookId", "order");
CREATE INDEX IF NOT EXISTS idx_game_module        ON "Game"("moduleId");
CREATE INDEX IF NOT EXISTS idx_game_level         ON "Game"(level);

-- ── RLS ───────────────────────────────────────────────────────
-- Read-only for authenticated users; all writes go through server
-- routes using the service-role key (which bypasses RLS).

ALTER TABLE "Book"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game"   ENABLE ROW LEVEL SECURITY;

-- Published books readable by all authenticated users.
-- NOTE: ТЗ asks for hard per-level gating (User.level == Book.level).
-- There is no CEFR level field on the student profile in this codebase
-- (User.level is the gamification level, an INTEGER), so level filtering
-- is applied at the query/UI layer like the Reading Library. Tighten here
-- once a student CEFR level exists.
CREATE POLICY "book_select_published"
  ON "Book" FOR SELECT TO authenticated
  USING ("isPublished" = true);

-- Modules of published books readable by authenticated users.
CREATE POLICY "module_select_published"
  ON "Module" FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Book" b
    WHERE b.id = "Module"."bookId" AND b."isPublished" = true
  ));

-- Games readable by all authenticated users.
CREATE POLICY "game_select_authenticated"
  ON "Game" FOR SELECT TO authenticated
  USING (true);

-- ── Storage bucket (ТЗ §2.2: учебники в бакете books) ─────────
-- Public read so module PDFs render directly in an <iframe>/embed,
-- matching the avatars bucket posture. Writes via service role only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('books', 'books', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "books_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'books');
