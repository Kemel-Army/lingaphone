-- Migration: Fix RLS policies — replace 'TUTOR' with 'TEACHER'
-- After removing TUTOR and adding TEACHER, five policies in 001_core_schema.sql
-- still referenced the old role string, silently locking out all TEACHER users.

BEGIN;

-- Student: teacher can see students in their own groups
DROP POLICY IF EXISTS student_teacher_select ON public."Student";
CREATE POLICY student_teacher_select ON public."Student" FOR SELECT USING (
  public.get_current_role() = 'TEACHER'
  AND "id" IN (
    SELECT gm."studentId" FROM public."GroupMember" gm
    JOIN public."Group" g ON g.id = gm."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id() AND gm.status = 'ACTIVE'
  )
);

-- MonthlyMedal: admin + teacher can read
DROP POLICY IF EXISTS medal_admin_select ON public."MonthlyMedal";
CREATE POLICY medal_admin_select ON public."MonthlyMedal" FOR SELECT USING (
  public.get_current_role() IN ('ADMIN', 'TEACHER')
);

-- Homework: student via group membership OR admin/teacher
DROP POLICY IF EXISTS hw_select ON public."Homework";
CREATE POLICY hw_select ON public."Homework" FOR SELECT USING (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    WHERE l."groupId" IN (
      SELECT "groupId" FROM public."GroupMember"
      WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
    )
  )
  OR public.get_current_role() IN ('ADMIN', 'TEACHER')
);

-- HomeworkSubmission: teacher can read/update submissions in their groups
DROP POLICY IF EXISTS hwsub_teacher_all ON public."HomeworkSubmission";
CREATE POLICY hwsub_teacher_all ON public."HomeworkSubmission" FOR ALL USING (
  public.get_current_role() = 'TEACHER'
  AND "homeworkId" IN (
    SELECT h.id FROM public."Homework" h
    JOIN public."Lesson" l ON l.id = h."lessonId"
    JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);

-- Material: common materials, student's groups, or admin/teacher
DROP POLICY IF EXISTS material_select ON public."Material";
CREATE POLICY material_select ON public."Material" FOR SELECT USING (
  "groupId" IS NULL
  OR "groupId" IN (
    SELECT "groupId" FROM public."GroupMember"
    WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
  )
  OR public.get_current_role() IN ('ADMIN', 'TEACHER')
);

COMMIT;
