-- ============================================================================
-- PARENT HARDENING — link approval flow + storage scoping.
-- Closes:
--  * "parent steals child" — any parent could see ANY student's data by
--    inviting their email. New: link starts as PENDING and requires the
--    student to accept before any visibility kicks in.
--  * Parent could not download child's homework files — new storage policies
--    scope path-segment 1 to the authId of any ACTIVE-linked child.
-- ============================================================================

-- 1. Add status column to ParentToStudent
ALTER TABLE public."ParentToStudent"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'PENDING'
    CHECK ("status" IN ('PENDING', 'ACTIVE'));

-- Backfill: every existing link is ACTIVE (created by admin/seed flows).
-- NOTE: this auto-grandfathered the legacy links — fixed in a follow-up
-- migration (20260624000000_parent_links_require_explicit_approval.sql)
-- which reverts never-responded links back to PENDING so the approval
-- flow applies to them too.
UPDATE public."ParentToStudent" SET "status" = 'ACTIVE' WHERE "status" = 'PENDING';

ALTER TABLE public."ParentToStudent"
  ADD COLUMN IF NOT EXISTS "respondedAt" timestamptz;

-- Allow student to SEE pending requests addressed to them
DROP POLICY IF EXISTS "student_select_pending_parent_links" ON public."ParentToStudent";
CREATE POLICY "student_select_pending_parent_links" ON public."ParentToStudent"
FOR SELECT TO authenticated
USING ("studentId" = public.get_current_student_id());


-- 2. Rebuild parent_select_child_* policies to require ACTIVE link only.
-- (PENDING requests grant NO data visibility.)

-- Helper: a SECURITY DEFINER function that returns the set of studentIds
-- the current parent has ACTIVE links to. Reused by every parent policy.
CREATE OR REPLACE FUNCTION public.get_active_child_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ps."studentId"
  FROM public."ParentToStudent" ps
  WHERE ps."parentId" = public.get_current_parent_id()
    AND ps."status" = 'ACTIVE';
$$;
REVOKE EXECUTE ON FUNCTION public.get_active_child_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_child_ids() TO authenticated;

-- Recreate each parent_select_child_* policy with the active-only helper
DROP POLICY IF EXISTS "parent_select_own_children" ON public."Student";
CREATE POLICY "parent_select_own_children" ON public."Student"
FOR SELECT TO authenticated
USING (id IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_children" ON public."User";
CREATE POLICY "parent_select_children" ON public."User"
FOR SELECT TO authenticated
USING (
  (public.get_current_user_role() = 'PARENT')
  AND id IN (
    SELECT s."userId" FROM public."Student" s
    WHERE s.id IN (SELECT public.get_active_child_ids())
  )
);

DROP POLICY IF EXISTS "parent_select_child_progress" ON public."Progress";
CREATE POLICY "parent_select_child_progress" ON public."Progress"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_models" ON public."StudentModel";
CREATE POLICY "parent_select_child_models" ON public."StudentModel"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_homework" ON public."Homework";
CREATE POLICY "parent_select_child_homework" ON public."Homework"
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT hs."homeworkId" FROM public."HomeworkSubmission" hs
    WHERE hs."studentId" IN (SELECT public.get_active_child_ids())
  )
);

DROP POLICY IF EXISTS "parent_select_child_submissions" ON public."HomeworkSubmission";
CREATE POLICY "parent_select_child_submissions" ON public."HomeworkSubmission"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_lessons" ON public."Lesson";
CREATE POLICY "parent_select_child_lessons" ON public."Lesson"
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT ls."lessonId" FROM public."LessonStudent" ls
    WHERE ls."studentId" IN (SELECT public.get_active_child_ids())
  )
);

DROP POLICY IF EXISTS "parent_select_child_diagnostics" ON public."DiagnosticResult";
CREATE POLICY "parent_select_child_diagnostics" ON public."DiagnosticResult"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_test_attempts" ON public."TestAttempt";
CREATE POLICY "parent_select_child_test_attempts" ON public."TestAttempt"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_trajectory" ON public."LearningTrajectory";
CREATE POLICY "parent_select_child_trajectory" ON public."LearningTrajectory"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_edu_profile" ON public."EducationProfile";
CREATE POLICY "parent_select_child_edu_profile" ON public."EducationProfile"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_game_profile" ON public."StudentGameProfile";
CREATE POLICY "parent_select_child_game_profile" ON public."StudentGameProfile"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));

DROP POLICY IF EXISTS "parent_select_child_achievements" ON public."StudentAchievement";
CREATE POLICY "parent_select_child_achievements" ON public."StudentAchievement"
FOR SELECT TO authenticated
USING (
  "studentProfileId" IN (
    SELECT sgp.id FROM public."StudentGameProfile" sgp
    WHERE sgp."studentId" IN (SELECT public.get_active_child_ids())
  )
);

DROP POLICY IF EXISTS "layer_progress_parent_read" ON public."LayerProgress";
CREATE POLICY "layer_progress_parent_read" ON public."LayerProgress"
FOR SELECT TO authenticated
USING ("studentId" IN (SELECT public.get_active_child_ids()));


-- 3. Tighten ParentToStudent SELECT for parent: only show own links (any status)
DROP POLICY IF EXISTS "parent_select_own_links" ON public."ParentToStudent";
CREATE POLICY "parent_select_own_links" ON public."ParentToStudent"
FOR SELECT TO authenticated
USING ("parentId" = public.get_current_parent_id());


-- 4. Storage — parent may read files belonging to ACTIVE children
DROP POLICY IF EXISTS "homework_parent_read" ON storage.objects;
CREATE POLICY "homework_parent_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'homework-submissions'
  AND public.get_current_user_role() = 'PARENT'
  AND (storage.foldername(name))[1] IN (
    SELECT u."authId" FROM public."User" u
    JOIN public."Student" s ON s."userId" = u.id
    WHERE s.id IN (SELECT public.get_active_child_ids())
  )
);

DROP POLICY IF EXISTS "recordings_parent_read" ON storage.objects;
CREATE POLICY "recordings_parent_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'lesson-recordings'
  AND public.get_current_user_role() = 'PARENT'
  AND (storage.foldername(name))[1] IN (
    SELECT u."authId" FROM public."User" u
    JOIN public."Student" s ON s."userId" = u.id
    WHERE s.id IN (SELECT public.get_active_child_ids())
  )
);

DROP POLICY IF EXISTS "documents_parent_read" ON storage.objects;
CREATE POLICY "documents_parent_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND public.get_current_user_role() = 'PARENT'
  AND (storage.foldername(name))[1] IN (
    SELECT u."authId" FROM public."User" u
    JOIN public."Student" s ON s."userId" = u.id
    WHERE s.id IN (SELECT public.get_active_child_ids())
  )
);
