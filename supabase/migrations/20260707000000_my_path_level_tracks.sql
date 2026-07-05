-- ═══════════════════════════════════════════════════════════════════
-- «Мой путь» (User Journey) — часть 1: справочник уровней-треков.
--
-- ТЗ (docs/МойПуть.md §2): иерархия Уровень (CEFR) → Учебник → Блоки → Тесты.
-- Куратор вручную ставит уровень ученика (Student.level : EnglishLevel enum
-- {A1,A2,S1,S2,B2,F1,F2,F3,F4}), а система авто-привязывает учебник.
--
-- Ключевая развязка: значение Student.level ЕСТЬ трек-книга (F=Fairyland,
-- A=Access, S=Spark, B=On Screen). Book.trackKey хранит то же значение —
-- привязка выполняется как Book.trackKey == Student.level::text.
--
-- LevelTrack — справочник-матрица из ТЗ (возраст/класс/CEFR-тир/учебник):
-- даёт куратору осмысленный выпадающий список и документирует исключения.
-- ═══════════════════════════════════════════════════════════════════

-- ── Справочник уровней-треков ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LevelTrack" (
  "level"       TEXT PRIMARY KEY,          -- значение EnglishLevel enum
  "tier"        TEXT NOT NULL,             -- CEFR-тир: 'Pre-beginner' | 'Beginner A1' | 'Elementary A2'
  "ageRange"    TEXT NOT NULL DEFAULT '',  -- '5–7'
  "grades"      TEXT NOT NULL DEFAULT '',  -- '1', '5–7'
  "bookTitle"   TEXT NOT NULL DEFAULT '',  -- 'Access 1', 'Phonics 1 + Fairyland 1'
  "orderIndex"  INTEGER NOT NULL DEFAULT 0,-- педагогический порядок прохождения
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = исключён из разработки (On Screen B2+)
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Матрица сопоставления из ТЗ ──────────────────────────────────
-- Spark 3, Spark 4, On Screen B2+ — исключены (ТЗ §2). On Screen (B2)
-- остаётся значением enum, но помечен isActive=FALSE и учебник не заводится.
INSERT INTO "LevelTrack" ("level","tier","ageRange","grades","bookTitle","orderIndex","isActive") VALUES
  ('F1','Pre-beginner','5–7',  '1',    'Phonics 1 + Fairyland 1', 1, TRUE),
  ('F2','Pre-beginner','7–8',  '1–2',  'Phonics 2 + Fairyland 2', 2, TRUE),
  ('F3','Pre-beginner','8–9',  '2–3',  'Fairyland 3 (+ Phonics 3)',3, TRUE),
  ('F4','Beginner A1', '9–10', '3–4',  'Fairyland 4',             4, TRUE),
  ('A1','Beginner A1', '10–11','4–5',  'Access 1',                5, TRUE),
  ('S1','Beginner A1', '11–13','5–7',  'Spark 1',                 6, TRUE),
  ('A2','Elementary A2','12–13','6–7', 'Access 2',                7, TRUE),
  ('S2','Elementary A2','13–18','7–11','Spark 2',                 8, TRUE),
  ('B2','On Screen B2+','—',   '—',    'On Screen B2+ (исключён)',99, FALSE)
ON CONFLICT ("level") DO UPDATE SET
  "tier"      = EXCLUDED."tier",
  "ageRange"  = EXCLUDED."ageRange",
  "grades"    = EXCLUDED."grades",
  "bookTitle" = EXCLUDED."bookTitle",
  "orderIndex"= EXCLUDED."orderIndex",
  "isActive"  = EXCLUDED."isActive";

-- ── Привязка учебника к треку ────────────────────────────────────
-- trackKey — то же значение, что Student.level. Ученик видит книгу,
-- у которой Book.trackKey = его level. cefrTier дублируется для показа.
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "trackKey" TEXT
  REFERENCES "LevelTrack"("level");
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "cefrTier" TEXT;

-- Один опубликованный учебник на трек (иначе привязка неоднозначна).
CREATE UNIQUE INDEX IF NOT EXISTS "uq_book_trackkey_published"
  ON "Book"("trackKey") WHERE "isPublished" = TRUE AND "trackKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_book_trackkey" ON "Book"("trackKey");

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE "LevelTrack" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "level_track_select" ON "LevelTrack"
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "level_track_service_all" ON "LevelTrack"
  FOR ALL TO service_role USING (TRUE);
