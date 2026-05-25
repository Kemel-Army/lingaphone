-- Migration: Add isProfile flag to StudentModel for profile subject tracking
-- Allows students to mark subjects as "profile" (main) vs general

ALTER TABLE "StudentModel"
  ADD COLUMN IF NOT EXISTS "isProfile" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "StudentModel_isProfile_idx" ON "StudentModel" ("studentId", "isProfile")
  WHERE "isProfile" = true;

COMMENT ON COLUMN "StudentModel"."isProfile" IS 'Whether this subject is the student profile/main subject';
