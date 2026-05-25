-- Fix DiagnosticQuestion.gradeLevel check constraint.
-- Old: BETWEEN 5 AND 11 (only high school)
-- New: BETWEEN 1 AND 11 (all school grades including primary 1-6)
-- Required after migration 20260618 replaced subjects with Математика grades 1-6.

ALTER TABLE "DiagnosticQuestion"
  DROP CONSTRAINT IF EXISTS "DiagnosticQuestion_gradeLevel_check";

ALTER TABLE "DiagnosticQuestion"
  ADD CONSTRAINT "DiagnosticQuestion_gradeLevel_check"
  CHECK ("gradeLevel" BETWEEN 1 AND 11);
