-- Admin management access for the Books module.
--
-- The original policies only expose PUBLISHED books to authenticated users, so
-- the admin library couldn't see drafts. Give ADMIN full read access to Book
-- and Module (writes still go through service-role server routes).
--
-- Role is read straight from the JWT claim (auth.jwt() ->> 'user_role'), which
-- is the pattern the live DB uses for admin gating.

DROP POLICY IF EXISTS "book_admin_select_all" ON "Book";
CREATE POLICY "book_admin_select_all"
  ON "Book" FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'ADMIN');

DROP POLICY IF EXISTS "module_admin_select_all" ON "Module";
CREATE POLICY "module_admin_select_all"
  ON "Module" FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'ADMIN');
