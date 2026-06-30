-- Admin full access to Lesson.
--
-- The schedule page lets an admin add a one-off / recurring lesson and cancel
-- lessons straight from the browser (client Supabase). Existing policies only
-- allowed teachers to insert lessons for their own groups, so admin writes hit
-- "new row violates row-level security policy for table Lesson". Grant ADMIN
-- full read/write, gated on the JWT role claim (the project's admin pattern).
DROP POLICY IF EXISTS "lesson_admin_all" ON "Lesson";
CREATE POLICY "lesson_admin_all"
  ON "Lesson" FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'ADMIN')
  WITH CHECK (auth.jwt() ->> 'user_role' = 'ADMIN');
