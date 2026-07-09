-- Учитель видит ВСЕ книги/модули (включая черновики) — библиотека книг для
-- админа и учителя (просмотр как у детей). BookPage/PageExercise уже читаются
-- любым authenticated (USING true).
CREATE POLICY "book_teacher_select_all" ON "Book" FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'TEACHER');

CREATE POLICY "module_teacher_select_all" ON "Module" FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'TEACHER');
