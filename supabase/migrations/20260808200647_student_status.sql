-- Статус обучения ученика (админ-раздел «Ученики»): Активный / Приостановил / Бросил.
-- Отдельно от User.status (аккаунт), GroupMember.status (членство в группе)
-- и Subscription.status (абонемент) — это именно статус обучения на платформе.

CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DROPPED');

ALTER TABLE "Student"
  ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "Student_status_idx" ON "Student" ("status");
