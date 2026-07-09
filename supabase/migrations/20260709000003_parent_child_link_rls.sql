-- ══════════════════════════════════════════════════════════════════
-- Кабинет родителя (ТЗ разд. 6) — связь родитель↔ребёнок + RLS-доступ
-- родителя к данным своих детей (профиль, оценки, посещаемость, ДЗ,
-- группы, финансы).
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE "ParentToStudent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentId" UUID NOT NULL REFERENCES "Parent" ("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("parentId", "studentId")
);
CREATE INDEX "ParentToStudent_parentId_idx" ON "ParentToStudent" ("parentId");
CREATE INDEX "ParentToStudent_studentId_idx" ON "ParentToStudent" ("studentId");

ALTER TABLE "ParentToStudent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "p2s_admin_all" ON "ParentToStudent" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');

CREATE POLICY "p2s_parent_read" ON "ParentToStudent" FOR SELECT
  USING (
    "parentId" IN (
      SELECT p."id" FROM "Parent" p
      JOIN "User" u ON u."id" = p."userId"
      WHERE u."authId" = auth.uid()::text
    )
  );

-- ─── Helper: id детей текущего родителя ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_current_parent_student_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ps."studentId"
  FROM "ParentToStudent" ps
  JOIN "Parent" p ON p."id" = ps."parentId"
  JOIN "User" u ON u."id" = p."userId"
  WHERE u."authId" = auth.uid()::text
$$;

-- ─── Parent SELECT policies по данным детей ─────────────────────────
CREATE POLICY "student_parent_read" ON "Student" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT public.get_current_parent_student_ids()));

CREATE POLICY "user_parent_read_children" ON "User" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT s."userId" FROM "Student" s
      WHERE s."id" IN (SELECT public.get_current_parent_student_ids())));

CREATE POLICY "grade_parent_read" ON "Grade" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));

CREATE POLICY "attendance_parent_read" ON "Attendance" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));

CREATE POLICY "homeworksub_parent_read" ON "HomeworkSubmission" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));

CREATE POLICY "homework_parent_read" ON "Homework" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT hs."homeworkId" FROM "HomeworkSubmission" hs
      WHERE hs."studentId" IN (SELECT public.get_current_parent_student_ids())));

CREATE POLICY "groupmember_parent_read" ON "GroupMember" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));

CREATE POLICY "group_parent_read" ON "Group" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "id" IN (SELECT gm."groupId" FROM "GroupMember" gm
      WHERE gm."studentId" IN (SELECT public.get_current_parent_student_ids())));

CREATE POLICY "lesson_parent_read" ON "Lesson" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "groupId" IN (SELECT gm."groupId" FROM "GroupMember" gm
      WHERE gm."studentId" IN (SELECT public.get_current_parent_student_ids())));

CREATE POLICY "subscription_parent_read" ON "Subscription" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));

CREATE POLICY "payment_parent_read" ON "Payment" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));
