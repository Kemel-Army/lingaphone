-- ═══════════════════════════════════════════════════════════════════
-- «Мой путь» — часть 2: блоки, блочные тесты и гейтинг.
--
-- ТЗ §3.2/§3.3: книга делится на блоки; в конце блока обязательный тест;
-- блок засчитан только после успешной сдачи теста; следующий блок закрыт,
-- пока не пройден текущий; результаты тестов сохраняются под аналитику.
--
-- Модель: Блок = Module (упорядочен по "order"). Внутри блока — LessonUnit'ы.
-- Тест — это LessonUnit с kind='TEST' (переиспользует весь движок упражнений
-- и детерминированный чекер /api/book/check-exercise). Итог теста агрегируется
-- в StudentBlockResult (источник гейтинга + аналитика).
-- ═══════════════════════════════════════════════════════════════════

-- ── Тип юнита + порог сдачи ──────────────────────────────────────
ALTER TABLE "LessonUnit" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'LESSON'
  CHECK ("kind" IN ('LESSON','TEST'));
ALTER TABLE "LessonUnit" ADD COLUMN IF NOT EXISTS "passThreshold" INTEGER NOT NULL DEFAULT 70
  CHECK ("passThreshold" BETWEEN 1 AND 100);

-- ── Результат блочного теста ученика ─────────────────────────────
-- Одна строка на (ученик, блок). Обновляется при каждой сдаче теста —
-- храним лучший результат для гейтинга и число попыток для аналитики.
CREATE TABLE IF NOT EXISTS "StudentBlockResult" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"   UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "moduleId"    UUID NOT NULL REFERENCES "Module"("id") ON DELETE CASCADE,
  "testUnitId"  UUID REFERENCES "LessonUnit"("id") ON DELETE SET NULL,
  "bestScore"   INTEGER NOT NULL DEFAULT 0 CHECK ("bestScore" BETWEEN 0 AND 100),
  "lastScore"   INTEGER NOT NULL DEFAULT 0 CHECK ("lastScore" BETWEEN 0 AND 100),
  "passed"      BOOLEAN NOT NULL DEFAULT FALSE,
  "attempts"    INTEGER NOT NULL DEFAULT 0,
  "passedAt"    TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId","moduleId")
);

CREATE INDEX IF NOT EXISTS "idx_block_result_student" ON "StudentBlockResult"("studentId");
CREATE INDEX IF NOT EXISTS "idx_block_result_module"  ON "StudentBlockResult"("moduleId");

-- ── RLS ──────────────────────────────────────────────────────────
-- Ученик читает свои результаты; запись — только через service-role
-- маршрут сдачи теста (проверка ответов там же, ключи скрыты).
ALTER TABLE "StudentBlockResult" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_result_select_own" ON "StudentBlockResult" FOR SELECT TO authenticated
  USING ("studentId" IN (SELECT id FROM "Student" WHERE "userId" = public.get_current_user_id()));
CREATE POLICY "block_result_service_all" ON "StudentBlockResult" FOR ALL TO service_role USING (TRUE);
