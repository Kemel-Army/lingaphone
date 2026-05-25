-- Migration: Replace all subjects with Математика grades 1-6
-- Removes old topic-category subjects (Арифметика, Геометрия, etc.)
-- and replaces with per-grade Математика subjects for Kazakhstan curriculum.

-- ============================================================
-- 1. Handle tables WITHOUT ON DELETE CASCADE
-- ============================================================

-- DiagnosticTest.subjectId is NOT NULL, no cascade → delete all diagnostic tests
-- (DiagnosticResult.diagnosticTestId has ON DELETE SET NULL equivalent via nullable)
DELETE FROM "DiagnosticTest";

-- DiagnosticResult.subjectId is nullable FK with no delete action → nullify first
UPDATE "DiagnosticResult" SET "subjectId" = NULL WHERE "subjectId" IS NOT NULL;

-- CurriculumPlan.subjectId is NOT NULL, no cascade → delete all curriculum plans
DELETE FROM "CurriculumPlan";

-- ============================================================
-- 2. Delete all subjects
--    Cascades to: Topic, TutorSubject, StudentModel, DiagnosticQuestion,
--                 LearningTrajectory, PathTopic
-- ============================================================

DELETE FROM "Subject";

-- ============================================================
-- 3. Insert Математика for grades 1–6
-- ============================================================

INSERT INTO "Subject" ("name", "nameKz", "description", "icon", "grade", "isActive") VALUES
  ('Математика', 'Математика', 'Математика 1 класс — числа, счёт, базовые арифметические операции', 'i-lucide-calculator', 1, true),
  ('Математика', 'Математика', 'Математика 2 класс — сложение, вычитание, умножение, деление', 'i-lucide-calculator', 2, true),
  ('Математика', 'Математика', 'Математика 3 класс — умножение, деление, дроби', 'i-lucide-calculator', 3, true),
  ('Математика', 'Математика', 'Математика 4 класс — многозначные числа, обыкновенные дроби, геометрия', 'i-lucide-calculator', 4, true),
  ('Математика', 'Математика', 'Математика 5 класс — натуральные числа, обыкновенные и десятичные дроби, проценты', 'i-lucide-calculator', 5, true),
  ('Математика', 'Математика', 'Математика 6 класс — рациональные числа, алгебраические выражения, уравнения', 'i-lucide-calculator', 6, true);
