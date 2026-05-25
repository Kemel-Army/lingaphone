-- Fix: students could only SELECT their own StudentModel records.
-- They need INSERT / UPDATE / DELETE to add subjects, update mastery, etc.

-- Drop the old SELECT-only policy
DROP POLICY IF EXISTS "student_select_own_model" ON "StudentModel";

-- Replace with a full-access policy (SELECT + INSERT + UPDATE + DELETE)
CREATE POLICY "student_manage_own_models" ON "StudentModel" FOR ALL
  USING ("studentId" = public.get_current_student_id())
  WITH CHECK ("studentId" = public.get_current_student_id());

-- Also allow tutors to UPDATE their students' models (e.g. after lesson review)
CREATE POLICY "tutor_update_student_models" ON "StudentModel" FOR UPDATE
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  )
  WITH CHECK (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );
