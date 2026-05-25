-- Add availableLessons column to Student table
-- Used by payment callback to track purchased lesson credits
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "availableLessons" INTEGER NOT NULL DEFAULT 0;
