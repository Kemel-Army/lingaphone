-- GrammarProgress.studentId was incorrectly referencing User(id) (the app UUID),
-- but the composable inserts auth.uid() and RLS compares against auth.uid().
-- Re-point the FK to auth.users so all three are consistent.

ALTER TABLE "GrammarProgress"
  DROP CONSTRAINT "GrammarProgress_studentId_fkey";

ALTER TABLE "GrammarProgress"
  ADD CONSTRAINT "GrammarProgress_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES auth.users(id) ON DELETE CASCADE;
