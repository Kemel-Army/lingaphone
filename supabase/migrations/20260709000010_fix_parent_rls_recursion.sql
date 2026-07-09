-- Фикс: рекурсия RLS у родительских политик. Политики на Homework/Group/
-- Lesson/User делали подзапросы к таблицам, у которых своя RLS ссылалась
-- обратно (Homework ↔ HomeworkSubmission → «infinite recursion»).
-- Решение: вынести подзапросы в SECURITY DEFINER-функции (обходят RLS).

CREATE OR REPLACE FUNCTION public.get_current_parent_group_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT gm."groupId" FROM "GroupMember" gm
  WHERE gm."studentId" IN (SELECT public.get_current_parent_student_ids())
$$;

CREATE OR REPLACE FUNCTION public.get_current_parent_homework_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT hs."homeworkId" FROM "HomeworkSubmission" hs
  WHERE hs."studentId" IN (SELECT public.get_current_parent_student_ids())
$$;

CREATE OR REPLACE FUNCTION public.get_current_parent_child_user_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s."userId" FROM "Student" s
  WHERE s."id" IN (SELECT public.get_current_parent_student_ids())
$$;

DROP POLICY IF EXISTS "user_parent_read_children" ON "User";
CREATE POLICY "user_parent_read_children" ON "User" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT public.get_current_parent_child_user_ids()));

DROP POLICY IF EXISTS "homework_parent_read" ON "Homework";
CREATE POLICY "homework_parent_read" ON "Homework" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT public.get_current_parent_homework_ids()));

DROP POLICY IF EXISTS "group_parent_read" ON "Group";
CREATE POLICY "group_parent_read" ON "Group" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT public.get_current_parent_group_ids()));

DROP POLICY IF EXISTS "lesson_parent_read" ON "Lesson";
CREATE POLICY "lesson_parent_read" ON "Lesson" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "groupId" IN (SELECT public.get_current_parent_group_ids()));
