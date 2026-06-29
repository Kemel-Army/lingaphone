-- Scope teacher Homework SELECT to their own groups.
--
-- Previously hw_select allowed `OR get_current_role() IN ('ADMIN','TEACHER')`,
-- so ANY teacher could read EVERY homework row on the platform — including the
-- homework of other teachers' groups. Students were already correctly scoped
-- via group membership; this only over-exposed homework to teachers.
--
-- New rule:
--   student → homework for lessons of groups they actively belong to
--   teacher → homework for lessons of groups they OWN
--   admin   → everything
--
-- Note: HomeworkSubmission's teacher policy (hwsub_teacher_all) is already
-- group-scoped, so submissions were never over-exposed.

DROP POLICY IF EXISTS hw_select ON public."Homework";
CREATE POLICY hw_select ON public."Homework" FOR SELECT USING (
  -- student: homework for lessons of their active groups
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    WHERE l."groupId" IN (
      SELECT "groupId" FROM public."GroupMember"
      WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
    )
  )
  -- teacher: homework for lessons of groups they own
  OR (
    public.get_current_role() = 'TEACHER'
    AND "lessonId" IN (
      SELECT l.id FROM public."Lesson" l
      JOIN public."Group" g ON g.id = l."groupId"
      WHERE g."teacherId" = public.get_current_teacher_id()
    )
  )
  -- admin: full access
  OR public.get_current_role() = 'ADMIN'
);

-- ---------------------------------------------------------------------------
-- Same over-exposure class on MonthlyMedal: medal_admin_select granted
-- `role IN ('ADMIN','TEACHER')`, so any teacher could read EVERY student's
-- monthly medals (and payouts) platform-wide. Scope teacher reads to medals
-- of students in their own groups; keep admin full + student-self.
DROP POLICY IF EXISTS medal_admin_select ON public."MonthlyMedal";
CREATE POLICY medal_admin_select ON public."MonthlyMedal" FOR SELECT USING (
  public.get_current_role() = 'ADMIN'
);
DROP POLICY IF EXISTS medal_teacher_select ON public."MonthlyMedal";
CREATE POLICY medal_teacher_select ON public."MonthlyMedal" FOR SELECT USING (
  public.get_current_role() = 'TEACHER'
  AND "studentId" IN (
    SELECT gm."studentId" FROM public."GroupMember" gm
    JOIN public."Group" g ON g.id = gm."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id() AND gm.status = 'ACTIVE'
  )
);

-- ---------------------------------------------------------------------------
-- Same class on Material: any teacher could read every group's materials.
-- Scope to common materials (groupId IS NULL) + the teacher's own groups.
DROP POLICY IF EXISTS material_select ON public."Material";
CREATE POLICY material_select ON public."Material" FOR SELECT USING (
  "groupId" IS NULL
  OR "groupId" IN (
    SELECT "groupId" FROM public."GroupMember"
    WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
  )
  OR (
    public.get_current_role() = 'TEACHER'
    AND "groupId" IN (
      SELECT id FROM public."Group" WHERE "teacherId" = public.get_current_teacher_id()
    )
  )
  OR public.get_current_role() = 'ADMIN'
);
