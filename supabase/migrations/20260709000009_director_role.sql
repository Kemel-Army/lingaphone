-- Роль «Директор» (ТЗ разд. 7/8) — мульти-филиальный обзор.
-- Доступ к сводным данным реализован через серверные роуты (service role,
-- gated DIRECTOR/ADMIN), поэтому широкие RLS-политики не добавляются.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTOR';
