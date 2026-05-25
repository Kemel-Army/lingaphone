-- ============================================================
-- Diagnostic Questions Table + Topics Seed
-- Pre-built question bank for adaptive diagnostic tests
-- ============================================================

-- 1. Create DiagnosticQuestion table
CREATE TABLE IF NOT EXISTS "DiagnosticQuestion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId" UUID NOT NULL REFERENCES "Subject" ("id") ON DELETE CASCADE,
  "topicName" TEXT NOT NULL,
  "gradeLevel" INTEGER NOT NULL CHECK ("gradeLevel" BETWEEN 5 AND 11),
  "difficulty" INTEGER NOT NULL CHECK ("difficulty" BETWEEN 1 AND 10),
  "text" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'multiple_choice' CHECK ("type" IN ('multiple_choice', 'input', 'true_false')),
  "options" JSONB NOT NULL DEFAULT '[]',
  "explanation" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX "DiagnosticQuestion_subjectId_gradeLevel_idx"
  ON "DiagnosticQuestion" ("subjectId", "gradeLevel");
CREATE INDEX "DiagnosticQuestion_difficulty_idx"
  ON "DiagnosticQuestion" ("difficulty");
CREATE INDEX "DiagnosticQuestion_isActive_idx"
  ON "DiagnosticQuestion" ("isActive");
CREATE INDEX "DiagnosticQuestion_subjectId_gradeLevel_difficulty_idx"
  ON "DiagnosticQuestion" ("subjectId", "gradeLevel", "difficulty")
  WHERE "isActive" = true;

-- Auto-update trigger
CREATE TRIGGER "DiagnosticQuestion_updatedAt"
  BEFORE UPDATE ON "DiagnosticQuestion"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. RLS Policies
ALTER TABLE "DiagnosticQuestion" ENABLE ROW LEVEL SECURITY;

-- Anyone can read active questions (needed for diagnostic tests)
CREATE POLICY "anyone_select_diagnostic_questions"
  ON "DiagnosticQuestion" FOR SELECT
  USING ("isActive" = true);

-- Only admins can manage questions
CREATE POLICY "admin_manage_diagnostic_questions"
  ON "DiagnosticQuestion" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "authId" = auth.uid()::text AND "role" = 'ADMIN'
    )
  );

-- Service role can insert (for seeding)
CREATE POLICY "service_role_manage_diagnostic_questions"
  ON "DiagnosticQuestion" FOR ALL
  USING (auth.role() = 'service_role');
