-- Автотриггеры уведомлений (ТЗ разд. 16) — новые типы.
-- Значения enum добавляются отдельной миграцией: PostgreSQL не даёт
-- использовать только что добавленное значение в той же транзакции
-- (триггеры на них — в следующей миграции).
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LESSON_MISSED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HOMEWORK_NEW';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOW_PERFORMANCE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_DUE';
