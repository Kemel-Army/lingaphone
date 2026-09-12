-- ════════════════════════════════════════════════════════════════════════════
-- «Мотивашка» — электронный дневник по 5 критериям + месячная медаль + бонус.
--
-- Переносит в платформу Google-таблицу «Сводные по мотивашке».
-- Исходные формулы из таблицы (лист «Сводная таблица <месяц>»):
--
--   AO  = кол-во оцениваемых занятий = MAX(посещено + отработано, занятий по абонементу)
--   AP  = средний балл
--       = ( СУММА(оценок учителя) / AO      -- 5 критериев × 5 = до 25
--         + баллы за Instagram               -- 0 или 5
--         + баллы за оплату вовремя          -- 0 или 5
--         + баллы за книги                   -- 0 или 5
--         ) / 8                              -- итого максимум 40/8 = 5.0
--   AV  = участвует, только если оплата вовремя (иначе «НЕ УЧАСТВУЕТ»)
--   AQ  = Бронза  IF(AP >= 2.7 AND AP < 3.8)  → 1 000 ₸
--   AR  = Серебро IF(AP >= 3.8 AND AP < 4.6)  → 3 000 ₸
--   AS  = Золото  IF(AP >= 4.6 AND AP <= 5)   → 5 000 ₸
--   AT  = Бонус   = сумма по медали
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Критерии оценивания ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GradeCriterion') THEN
    CREATE TYPE public."GradeCriterion" AS ENUM (
      'ATTENDANCE',   -- посещаемость
      'BEHAVIOR',     -- поведение
      'HOMEWORK',     -- дом.зад
      'DIARY',        -- дневник
      'EBOOK'         -- работа_с_e-book
    );
  END IF;
END $$;

-- Оценка ученика за один урок по одному критерию (1–5).
CREATE TABLE IF NOT EXISTS public."LessonCriterionGrade" (
  "lessonId"  UUID NOT NULL REFERENCES public."Lesson"(id) ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES public."Student"(id) ON DELETE CASCADE,
  criterion   public."GradeCriterion" NOT NULL,
  value       SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 5),
  "gradedBy"  UUID REFERENCES public."Teacher"(id) ON DELETE SET NULL,
  "gradedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("lessonId", "studentId", criterion)
);

CREATE INDEX IF NOT EXISTS "LessonCriterionGrade_studentId_idx"
  ON public."LessonCriterionGrade" ("studentId");

-- ── 2. Менеджерские параметры месяца ────────────────────────────────────────
-- Instagram / оплата вовремя / книги выставляет менеджер (ADMIN), не учитель.
-- `month` — TEXT 'YYYY-MM', как в MonthlyMedal.month из исходной схемы.
-- Заводить здесь DATE значило бы держать два формата месяца в одной фиче.
CREATE TABLE IF NOT EXISTS public."MonthlyMotivationInput" (
  "studentId"           UUID NOT NULL REFERENCES public."Student"(id) ON DELETE CASCADE,
  month                 TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  instagram             BOOLEAN NOT NULL DEFAULT FALSE,
  "paidOnTime"          BOOLEAN NOT NULL DEFAULT FALSE,
  books                 BOOLEAN NOT NULL DEFAULT FALSE,
  "subscriptionLessons" SMALLINT NOT NULL DEFAULT 0 CHECK ("subscriptionLessons" >= 0),
  note                  TEXT,
  "updatedBy"           UUID REFERENCES public."User"(id) ON DELETE SET NULL,
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("studentId", month)
);

-- ── 3. Расширение MonthlyMedal под расчёт ───────────────────────────────────
ALTER TABLE public."MonthlyMedal"
  ADD COLUMN IF NOT EXISTS "teacherAvg"      NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "instagramPoints" SMALLINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentPoints"   SMALLINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookPoints"      SMALLINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lessonsCounted"  SMALLINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "gradesCount"     SMALLINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS participates      BOOLEAN       NOT NULL DEFAULT TRUE;

-- Уникальность ("studentId", month) уже задана в исходной схеме
-- (`UNIQUE ("studentId", "month")`), так что upsert с onConflict работает
-- как есть — свой индекс не нужен и только дублировал бы её.

-- ── 4. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public."LessonCriterionGrade"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MonthlyMotivationInput" ENABLE ROW LEVEL SECURITY;

-- Учитель: полный доступ к оценкам своих уроков.
DROP POLICY IF EXISTS lcg_teacher_all ON public."LessonCriterionGrade";
CREATE POLICY lcg_teacher_all ON public."LessonCriterionGrade" FOR ALL
  USING (
    public.get_current_role() = 'TEACHER'::public."UserRole"
    AND "lessonId" = ANY (public.get_current_teacher_lesson_ids())
  )
  WITH CHECK (
    public.get_current_role() = 'TEACHER'::public."UserRole"
    AND "lessonId" = ANY (public.get_current_teacher_lesson_ids())
  );

-- Админ/директор: полный доступ.
DROP POLICY IF EXISTS lcg_admin_all ON public."LessonCriterionGrade";
CREATE POLICY lcg_admin_all ON public."LessonCriterionGrade" FOR ALL
  USING (public.get_current_role() IN ('ADMIN'::public."UserRole", 'DIRECTOR'::public."UserRole"))
  WITH CHECK (public.get_current_role() IN ('ADMIN'::public."UserRole", 'DIRECTOR'::public."UserRole"));

-- Ученик: читает свои оценки.
DROP POLICY IF EXISTS lcg_student_select ON public."LessonCriterionGrade";
CREATE POLICY lcg_student_select ON public."LessonCriterionGrade" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

-- Родитель: читает оценки своих детей.
DROP POLICY IF EXISTS lcg_parent_select ON public."LessonCriterionGrade";
CREATE POLICY lcg_parent_select ON public."LessonCriterionGrade" FOR SELECT
  USING ("studentId" IN (SELECT public.get_current_parent_student_ids()));

-- Менеджерские параметры: пишет только админ/директор.
DROP POLICY IF EXISTS mmi_admin_all ON public."MonthlyMotivationInput";
CREATE POLICY mmi_admin_all ON public."MonthlyMotivationInput" FOR ALL
  USING (public.get_current_role() IN ('ADMIN'::public."UserRole", 'DIRECTOR'::public."UserRole"))
  WITH CHECK (public.get_current_role() IN ('ADMIN'::public."UserRole", 'DIRECTOR'::public."UserRole"));

-- Учитель видит параметры своих учеников (нужно для объяснения балла).
DROP POLICY IF EXISTS mmi_teacher_select ON public."MonthlyMotivationInput";
CREATE POLICY mmi_teacher_select ON public."MonthlyMotivationInput" FOR SELECT
  USING (
    public.get_current_role() = 'TEACHER'::public."UserRole"
    AND "studentId" IN (
      SELECT gm."studentId" FROM public."GroupMember" gm
      WHERE gm."groupId" = ANY (public.get_current_teacher_group_ids())
    )
  );

DROP POLICY IF EXISTS mmi_student_select ON public."MonthlyMotivationInput";
CREATE POLICY mmi_student_select ON public."MonthlyMotivationInput" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

DROP POLICY IF EXISTS mmi_parent_select ON public."MonthlyMotivationInput";
CREATE POLICY mmi_parent_select ON public."MonthlyMotivationInput" FOR SELECT
  USING ("studentId" IN (SELECT public.get_current_parent_student_ids()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public."LessonCriterionGrade"   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."MonthlyMotivationInput" TO authenticated;
