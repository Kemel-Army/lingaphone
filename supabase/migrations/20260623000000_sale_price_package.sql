-- ═══════════════════════════════════════════════════════════════
-- FEMO Sales Launch: add salePrice + durationDays to Package,
-- seed single "FEMO Годовая подписка" entry.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "Package"
  ADD COLUMN IF NOT EXISTS "salePrice"    INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "durationDays" INTEGER DEFAULT 365;

-- Deactivate any existing packages (clean slate for single-tariff launch)
UPDATE "Package" SET "isActive" = false;

-- Insert the single launch package (idempotent by isFeatured+isActive check)
INSERT INTO "Package" (
  "name", "nameKz", "description",
  "priceTotal", "salePrice", "durationDays",
  "pricePerLesson", "lessonsCount", "lessonDuration",
  "isFeatured", "isActive", "sortOrder"
)
SELECT
  'FEMO Годовая подписка',
  'FEMO Жылдық жазылым',
  'Полный доступ к AI-платформе FEMO на 365 дней: AI-тренер Феми 24/7, все 6 классов математики, олимпиадная подготовка, геймификация, прогресс для родителей',
  29990,
  19990,
  365,
  0, 0, 0,
  true, true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM "Package" WHERE "name" = 'FEMO Годовая подписка'
);
