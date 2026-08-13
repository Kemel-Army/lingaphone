-- Входное тестирование на платформе (три возрастных теста).
--
-- Проходит анонимный посетитель: перед стартом оставляет ФИО + телефон, поэтому
-- каждая попытка привязана к «Lead». Объективные части (сопоставление, выбор
-- варианта, порядок слов, короткий ответ) считаются автоматически; письменная и
-- устная части сохраняются как есть и оцениваются преподавателем.
--
-- Запись создаётся только сервером (service role) — публичного INSERT нет,
-- иначе любой мог бы набивать лидов через открытый endpoint.

CREATE TYPE "PlacementAgeBand" AS ENUM ('AGE_6_9', 'AGE_9_12', 'AGE_12_16');

-- Телефон в CRM хранится как введён («+7 700 111-22-33», «87001112233»), поэтому
-- дедупликация лида по нему возможна только по цифрам. Генерируемая колонка
-- держит нормализованную форму в актуальном состоянии сама.
ALTER TABLE "Lead"
  ADD COLUMN "phoneDigits" TEXT
  GENERATED ALWAYS AS (regexp_replace(COALESCE("phone", ''), '\D', '', 'g')) STORED;

CREATE INDEX "Lead_phoneDigits_idx" ON "Lead" ("phoneDigits");

CREATE TABLE "PlacementTest" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "leadId"            UUID NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "ageBand"           "PlacementAgeBand" NOT NULL,
  "fullName"          TEXT NOT NULL,
  "phone"             TEXT NOT NULL,
  -- questionId -> ответ. null = «затрудняюсь ответить» (отличаем от «не дошёл»).
  "answers"           JSONB NOT NULL DEFAULT '{}',
  "autoScore"         INT NOT NULL DEFAULT 0,
  "autoMax"           INT NOT NULL DEFAULT 0,
  "skippedCount"      INT NOT NULL DEFAULT 0,
  -- Развёрнутые ответы (чтение / письмо) — на ручную проверку преподавателем.
  "openAnswers"       JSONB NOT NULL DEFAULT '[]',
  "recommendedLevel"  TEXT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "PlacementTest_leadId_idx" ON "PlacementTest" ("leadId");
CREATE INDEX "PlacementTest_createdAt_idx" ON "PlacementTest" ("createdAt" DESC);

ALTER TABLE "PlacementTest" ENABLE ROW LEVEL SECURITY;

-- Читают только сотрудники: результат виден в карточке лида.
CREATE POLICY "PlacementTest_staff_read"
  ON "PlacementTest" FOR SELECT
  USING ((auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER'));

-- INSERT/UPDATE/DELETE — нет ни одной политики: только service role.
