-- ══════════════════════════════════════════════════════════════════
-- CRM — Лиды, Воронка продаж, Задачи (ТЗ «Правки по платформе», разд. 2.3–2.4)
--
-- Адаптировано под существующий стек Supabase (RLS, PascalCase-таблицы),
-- НЕ на Drizzle/BetterAuth из текстовой части ТЗ (конфликт с CLAUDE.md
-- «❌ ORM в runtime» + 84 существующие миграции).
--
-- Lead              — карточка лида + воронка + ответственный менеджер.
-- LeadStageHistory  — переходы по этапам (для конверсии директора, Phase 7).
-- Task              — задачи админов друг другу, связь с лидом/учеником.
--
-- Клиент = лид со стадией ACTIVE (ТЗ: «Оплата → Активный ученик →
-- автоматически во вкладку Клиенты»). Полное создание аккаунта ученика —
-- отдельный шаг (кнопка в карточке лида), здесь только связь convertedStudentId.
-- ══════════════════════════════════════════════════════════════════

-- ─── Enums ──────────────────────────────────────────────────────────
CREATE TYPE "LeadSource" AS ENUM (
  'INSTAGRAM', 'WHATSAPP', 'TELEGRAM', 'REFERRAL', 'WEBSITE',
  'CALL', 'WALK_IN', 'ADVERTISING', 'OTHER'
);

-- Воронка продаж (ТЗ). ACTIVE = сконвертированный клиент.
CREATE TYPE "LeadStage" AS ENUM (
  'NEW',                       -- Лид
  'CONTACTED',                 -- Установлен контакт
  'TRIAL',                     -- Пробный урок
  'NO_SHOW',                   -- Не пришёл, перезаписать
  'SCHEDULE_MISMATCH_KIDS',    -- Не подходит расписание (дети)
  'SCHEDULE_MISMATCH_ADULTS',  -- Не подходит расписание (взрослые)
  'TOO_EXPENSIVE',             -- Дорого
  'LEFT_TO_COMPETITOR',        -- Ушёл к конкуренту
  'CONTACT_LATER',             -- Связаться позже
  'THINKING',                  -- Думает
  'PAYMENT',                   -- Оплата
  'ACTIVE'                     -- Активный ученик (клиент)
);

CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'OVERDUE');
CREATE TYPE "TaskRelatedType" AS ENUM ('STUDENT', 'LEAD', 'INTERNAL');

-- ─── updatedAt trigger helper (idempotent, hardened search_path) ─────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END $$;

-- ─── Lead ───────────────────────────────────────────────────────────
CREATE TABLE "Lead" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
  "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
  "responsibleId" UUID REFERENCES "User" ("id") ON DELETE SET NULL,
  "branchId" UUID REFERENCES "Branch" ("id") ON DELETE SET NULL,
  "firstContactAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "trialLessonAt" TIMESTAMPTZ,
  "trialTeacherId" UUID REFERENCES "Teacher" ("id") ON DELETE SET NULL,
  "trialSuccess" BOOLEAN,
  "tariff" TEXT,
  "amount" NUMERIC(12, 2),
  "paidAt" TIMESTAMPTZ,
  "notes" TEXT,
  "convertedStudentId" UUID REFERENCES "Student" ("id") ON DELETE SET NULL,
  "convertedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Lead_stage_idx" ON "Lead" ("stage");
CREATE INDEX "Lead_responsibleId_idx" ON "Lead" ("responsibleId");
CREATE INDEX "Lead_branchId_idx" ON "Lead" ("branchId");
CREATE INDEX "Lead_createdAt_idx" ON "Lead" ("createdAt");
CREATE TRIGGER "Lead_set_updated_at" BEFORE UPDATE ON "Lead"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── LeadStageHistory ───────────────────────────────────────────────
CREATE TABLE "LeadStageHistory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "leadId" UUID NOT NULL REFERENCES "Lead" ("id") ON DELETE CASCADE,
  "fromStage" "LeadStage",
  "toStage" "LeadStage" NOT NULL,
  "changedById" UUID REFERENCES "User" ("id") ON DELETE SET NULL,
  "changedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "LeadStageHistory_leadId_idx" ON "LeadStageHistory" ("leadId");
CREATE INDEX "LeadStageHistory_changedAt_idx" ON "LeadStageHistory" ("changedAt");

-- ─── Task ───────────────────────────────────────────────────────────
CREATE TABLE "Task" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
  "creatorId" UUID REFERENCES "User" ("id") ON DELETE SET NULL,
  "assigneeId" UUID REFERENCES "User" ("id") ON DELETE SET NULL,
  "dueAt" TIMESTAMPTZ,
  "relatedType" "TaskRelatedType" NOT NULL DEFAULT 'INTERNAL',
  "relatedId" UUID,
  "branchId" UUID REFERENCES "Branch" ("id") ON DELETE SET NULL,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Task_status_idx" ON "Task" ("status");
CREATE INDEX "Task_assigneeId_idx" ON "Task" ("assigneeId");
CREATE INDEX "Task_creatorId_idx" ON "Task" ("creatorId");
CREATE INDEX "Task_dueAt_idx" ON "Task" ("dueAt");
CREATE TRIGGER "Task_set_updated_at" BEFORE UPDATE ON "Task"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────
-- CRM — только администраторы (директор появится в отдельной фазе).
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadStageHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_admin_all" ON "Lead" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');

CREATE POLICY "lead_history_admin_all" ON "LeadStageHistory" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');

CREATE POLICY "task_admin_all" ON "Task" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');
