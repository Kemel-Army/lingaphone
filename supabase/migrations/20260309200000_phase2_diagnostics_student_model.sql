-- Phase 2: IAE Diagnostics → Student Model
-- Fix StudentModel to support per-subject models, fix DiagnosticResult for ad-hoc tests

-- ============================================================
-- 1. StudentModel: add subjectId for per-subject modeling
-- ============================================================

-- Add subjectId column (nullable first, then we set up constraints)
ALTER TABLE "StudentModel"
  ADD COLUMN "subjectId" UUID REFERENCES "Subject" ("id") ON DELETE CASCADE;

-- Drop old UNIQUE constraint (studentId only) and add composite
ALTER TABLE "StudentModel" DROP CONSTRAINT IF EXISTS "StudentModel_studentId_key";

-- Allow multiple StudentModels per student (one per subject)
CREATE UNIQUE INDEX "StudentModel_studentId_subjectId_unique"
  ON "StudentModel" ("studentId", "subjectId");

-- Index for subject lookups
CREATE INDEX "StudentModel_subjectId_idx" ON "StudentModel" ("subjectId");

-- ============================================================
-- 2. DiagnosticResult: make diagnosticTestId nullable for ad-hoc AI tests
-- ============================================================

ALTER TABLE "DiagnosticResult"
  ALTER COLUMN "diagnosticTestId" DROP NOT NULL;

-- Add subjectId to track which subject the diagnostic was for
ALTER TABLE "DiagnosticResult"
  ADD COLUMN "subjectId" UUID REFERENCES "Subject" ("id");

CREATE INDEX "DiagnosticResult_subjectId_idx" ON "DiagnosticResult" ("subjectId");

-- ============================================================
-- 3. LearningTrajectory: add subjectId for per-subject trajectories
-- ============================================================

ALTER TABLE "LearningTrajectory"
  ADD COLUMN "subjectId" UUID REFERENCES "Subject" ("id") ON DELETE CASCADE;

-- Drop old UNIQUE (studentId only) and add composite
ALTER TABLE "LearningTrajectory" DROP CONSTRAINT IF EXISTS "LearningTrajectory_studentId_key";

CREATE UNIQUE INDEX "LearningTrajectory_studentId_subjectId_unique"
  ON "LearningTrajectory" ("studentId", "subjectId");

-- ============================================================
-- 4. Seed initial subjects for Kazakhstan curriculum
-- ============================================================

INSERT INTO "Subject" ("name", "nameKz", "icon", "description", "isActive") VALUES
  ('Арифметика', 'Арифметика', 'i-lucide-calculator', 'Числа, операции, дроби, проценты', true),
  ('Геометрия', 'Геометрия', 'i-lucide-hexagon', 'Фигуры, площади, объёмы, координаты', true),
  ('Алгебра', 'Алгебра', 'i-lucide-variable', 'Уравнения, неравенства, функции, выражения', true),
  ('Логика и комбинаторика', 'Логика және комбинаторика', 'i-lucide-brain', 'Логические задачи, перебор, комбинации', true),
  ('Теория чисел', 'Сандар теориясы', 'i-lucide-hash', 'Делимость, простые числа, НОД, НОК', true),
  ('Измерения и данные', 'Өлшемдер және деректер', 'i-lucide-bar-chart', 'Единицы измерения, графики, диаграммы, статистика', true),
  ('Текстовые задачи', 'Мәтінді есептер', 'i-lucide-book-open-text', 'Задачи на движение, работу, смеси, проценты', true),
  ('Олимпиадная математика', 'Олимпиадалық математика', 'i-lucide-trophy', 'Нестандартные задачи, математические соревнования', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. RLS policies for new columns
-- ============================================================

-- StudentModel RLS is already set up via initial migrations.
-- The existing policies use studentId checks which still work.

-- Ensure DiagnosticResult policies cover the new nullable diagnosticTestId:
-- (existing policies should still function since they filter by studentId)

-- ============================================================
-- 6. Update supabase_realtime publication
-- ============================================================

-- StudentModel changes should be real-time for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE "StudentModel";
ALTER PUBLICATION supabase_realtime ADD TABLE "DiagnosticResult";
