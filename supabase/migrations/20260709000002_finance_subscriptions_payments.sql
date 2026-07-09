-- ══════════════════════════════════════════════════════════════════
-- Финансы — Абонементы (Subscription) + Платежи (Payment) (ТЗ разд. 2.6)
--
-- Поступления         = COMPLETED-платежи за период.
-- Дебиторская задолж. = активные абонементы с просроченным nextPaymentAt.
-- Неоплаченные абон.   = активные абонементы без COMPLETED-платежа.
-- План на месяц        = сумма price абонементов с nextPaymentAt в месяце.
--
-- payerId = заказчик/плательщик (может отличаться от ученика).
-- Основа для карточки клиента (4.5), кабинета родителя (13), выручки директора (14).
-- ══════════════════════════════════════════════════════════════════

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'KASPI', 'TRANSFER', 'OTHER');
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'PENDING', 'REFUNDED', 'FAILED');

CREATE TABLE "Subscription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "branchId" UUID REFERENCES "Branch" ("id") ON DELETE SET NULL,
  "payerId" UUID REFERENCES "User" ("id") ON DELETE SET NULL,
  "plan" TEXT NOT NULL,
  "course" TEXT,
  "price" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "lessonsTotal" INTEGER NOT NULL DEFAULT 0,
  "lessonsUsed" INTEGER NOT NULL DEFAULT 0,
  "startAt" DATE,
  "endAt" DATE,
  "nextPaymentAt" DATE,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Subscription_studentId_idx" ON "Subscription" ("studentId");
CREATE INDEX "Subscription_status_idx" ON "Subscription" ("status");
CREATE INDEX "Subscription_nextPaymentAt_idx" ON "Subscription" ("nextPaymentAt");
CREATE INDEX "Subscription_branchId_idx" ON "Subscription" ("branchId");
CREATE TRIGGER "Subscription_set_updated_at" BEFORE UPDATE ON "Subscription"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE "Payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "subscriptionId" UUID REFERENCES "Subscription" ("id") ON DELETE SET NULL,
  "branchId" UUID REFERENCES "Branch" ("id") ON DELETE SET NULL,
  "amount" NUMERIC(12, 2) NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
  "paidAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "comment" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Payment_studentId_idx" ON "Payment" ("studentId");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment" ("subscriptionId");
CREATE INDEX "Payment_paidAt_idx" ON "Payment" ("paidAt");
CREATE INDEX "Payment_status_idx" ON "Payment" ("status");
CREATE INDEX "Payment_branchId_idx" ON "Payment" ("branchId");

-- ─── RLS ────────────────────────────────────────────────────────────
-- Админ полностью. Родитель/учитель-скоуп добавится в кабинете родителя
-- (разд. 6) вместе с таблицей связи родитель↔ребёнок (её сейчас нет).
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_admin_all" ON "Subscription" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');

CREATE POLICY "payment_admin_all" ON "Payment" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');
