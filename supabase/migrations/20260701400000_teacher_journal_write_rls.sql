-- Teacher journal write access.
--
-- Attendance and Grade had only SELECT policies in the live schema, so a
-- teacher marking attendance or saving a grade failed silently at the RLS
-- layer (the client upsert returned a permission error). Add INSERT + UPDATE
-- policies scoped to lessons in the teacher's OWN groups (same join the
-- existing *_teacher_select policies use).

-- ---- Attendance ----------------------------------------------------------
DROP POLICY IF EXISTS att_teacher_insert ON public."Attendance";
CREATE POLICY att_teacher_insert ON public."Attendance" FOR INSERT WITH CHECK (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);
DROP POLICY IF EXISTS att_teacher_update ON public."Attendance";
CREATE POLICY att_teacher_update ON public."Attendance" FOR UPDATE USING (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);

-- ---- Grade ---------------------------------------------------------------
DROP POLICY IF EXISTS grade_teacher_insert ON public."Grade";
CREATE POLICY grade_teacher_insert ON public."Grade" FOR INSERT WITH CHECK (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);
DROP POLICY IF EXISTS grade_teacher_update ON public."Grade";
CREATE POLICY grade_teacher_update ON public."Grade" FOR UPDATE USING (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);
