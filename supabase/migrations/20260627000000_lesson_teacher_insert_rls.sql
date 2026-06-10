-- Drop old broken policy (uses get_current_tutor_id() which no longer exists)
DROP POLICY IF EXISTS "tutor_manage_own_lessons" ON public."Lesson";

-- RPC helpers called by useTeacher composable (idempotent via CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.get_current_teacher_group_ids()
RETURNS UUID[] LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(g.id), '{}')
  FROM public."Group" g
  WHERE g."teacherId" = public.get_current_teacher_id()
$$;

CREATE OR REPLACE FUNCTION public.get_current_teacher_lesson_ids()
RETURNS UUID[] LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(l.id), '{}')
  FROM public."Lesson" l
  WHERE l."groupId" IN (
    SELECT g.id FROM public."Group" g
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_current_teacher_group_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_teacher_lesson_ids() TO authenticated;

-- Teacher: INSERT lessons for their own groups
DROP POLICY IF EXISTS lesson_teacher_insert ON public."Lesson";
CREATE POLICY lesson_teacher_insert ON public."Lesson" FOR INSERT
  WITH CHECK (
    public.get_current_role() = 'TEACHER'
    AND "groupId" IN (
      SELECT g.id FROM public."Group" g
      WHERE g."teacherId" = public.get_current_teacher_id()
    )
  );

-- Teacher: UPDATE lessons for their own groups
DROP POLICY IF EXISTS lesson_teacher_update ON public."Lesson";
CREATE POLICY lesson_teacher_update ON public."Lesson" FOR UPDATE
  USING (
    public.get_current_role() = 'TEACHER'
    AND "groupId" IN (
      SELECT g.id FROM public."Group" g
      WHERE g."teacherId" = public.get_current_teacher_id()
    )
  );

-- Teacher: DELETE lessons for their own groups
DROP POLICY IF EXISTS lesson_teacher_delete ON public."Lesson";
CREATE POLICY lesson_teacher_delete ON public."Lesson" FOR DELETE
  USING (
    public.get_current_role() = 'TEACHER'
    AND "groupId" IN (
      SELECT g.id FROM public."Group" g
      WHERE g."teacherId" = public.get_current_teacher_id()
    )
  );

-- Student SELECT: only lessons in groups where the student is an ACTIVE member
-- Replaces the old LessonStudent-based policy if it exists
DROP POLICY IF EXISTS "student_select_own_lessons" ON public."Lesson";
DROP POLICY IF EXISTS lesson_student_group_select ON public."Lesson";
CREATE POLICY lesson_student_group_select ON public."Lesson" FOR SELECT
  USING (
    public.get_current_role() = 'STUDENT'
    AND "groupId" IN (
      SELECT gm."groupId" FROM public."GroupMember" gm
      WHERE gm."studentId" = public.get_current_student_id()
        AND gm.status = 'ACTIVE'
    )
  );
