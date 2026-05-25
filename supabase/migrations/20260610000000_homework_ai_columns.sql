-- Add AI scoring columns to HomeworkSubmission
-- The server AI endpoints write aiScore/aiFeedback which were missing from the schema.

ALTER TABLE "HomeworkSubmission"
  ADD COLUMN IF NOT EXISTS "aiScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "aiFeedback" TEXT;
