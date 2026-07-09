-- ══════════════════════════════════════════════════════════════════
-- Геймификация — Linga Coins (ТЗ разд. 8)
--
-- Отдельная «поведенческая» валюта (не XP/Gems). Начисляется учителем
-- за поведение/посещаемость/ДЗ/оплату и т.д. Баланс = сумма транзакций.
-- Медали (порог баланса): Бронза 1000, Серебро 3000, Золото 5000.
-- ══════════════════════════════════════════════════════════════════

CREATE TYPE "LingaCoinReason" AS ENUM (
  'BEHAVIOR',        -- Хорошее поведение на уроках
  'NO_TARDINESS',    -- Отсутствие опозданий
  'RESPECT',         -- Уважение к преподавателю и одногруппникам
  'ATTENDANCE',      -- 85%+ посещаемости (≤2 пропуска/мес)
  'MAKEUP',          -- 100% посещаемости отработок
  'HOMEWORK',        -- 100% выполнения ДЗ
  'IEBOOK',          -- Самостоятельная работа с iEBook
  'DIARY',           -- Ведение дневника
  'ENGLISH_VIDEO',   -- Ежемесячное видео на английском
  'PAYMENT_ONTIME',  -- Своевременная оплата
  'MEDAL',           -- Медаль
  'PURCHASE',        -- Покупка в магазине
  'MANUAL',          -- Ручное начисление
  'ADJUSTMENT'       -- Корректировка (может быть отрицательной)
);

CREATE TABLE "LingaCoinTransaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "delta" INTEGER NOT NULL,
  "reason" "LingaCoinReason" NOT NULL DEFAULT 'MANUAL',
  "note" TEXT,
  "awardedBy" UUID REFERENCES "User" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "LingaCoinTransaction_studentId_idx" ON "LingaCoinTransaction" ("studentId");
CREATE INDEX "LingaCoinTransaction_createdAt_idx" ON "LingaCoinTransaction" ("createdAt");

ALTER TABLE "LingaCoinTransaction" ENABLE ROW LEVEL SECURITY;

-- Админ — полный доступ.
CREATE POLICY "lct_admin_all" ON "LingaCoinTransaction" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');

-- Учитель — читать и начислять (awardedBy проставляется приложением).
CREATE POLICY "lct_teacher_select" ON "LingaCoinTransaction" FOR SELECT
  USING (public.get_current_role() = 'TEACHER');
CREATE POLICY "lct_teacher_insert" ON "LingaCoinTransaction" FOR INSERT
  WITH CHECK (public.get_current_role() = 'TEACHER');

-- Ученик — читать свои.
CREATE POLICY "lct_student_read" ON "LingaCoinTransaction" FOR SELECT
  USING (public.get_current_role() = 'STUDENT'
    AND "studentId" = public.get_current_student_id());

-- Родитель — читать по своим детям.
CREATE POLICY "lct_parent_read" ON "LingaCoinTransaction" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));
