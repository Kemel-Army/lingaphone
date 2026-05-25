-- Migration: Remove TUTOR role and all tutor-related tables/columns
-- Platform pivoted to B2C self-paced AI tutoring (grades 1-6).
-- Tutors, lessons-as-services, earnings, reviews and curriculum plans are removed.

BEGIN;

-- ============================================================
-- 1. Drop RLS policies that reference TUTOR or get_current_tutor_id()
--    (must run before functions/columns referenced are removed)
-- ============================================================

DROP POLICY IF EXISTS "tutor_select_students" ON "User";
DROP POLICY IF EXISTS "tutor_select_own_students" ON "Student";
DROP POLICY IF EXISTS "tutor_select_student_models" ON "StudentModel";
DROP POLICY IF EXISTS "tutor_select_student_edu_profile" ON "EducationProfile";
DROP POLICY IF EXISTS "tutor_manage_student_trajectories" ON "LearningTrajectory";
DROP POLICY IF EXISTS "tutor_select_student_diagnostics" ON "DiagnosticResult";
DROP POLICY IF EXISTS "tutor_manage_own_lessons" ON "Lesson";
DROP POLICY IF EXISTS "tutor_manage_lesson_students" ON "LessonStudent";
DROP POLICY IF EXISTS "tutor_manage_own_group_lessons" ON "GroupLesson";
DROP POLICY IF EXISTS "tutor_manage_group_participants" ON "GroupLessonParticipant";
DROP POLICY IF EXISTS "tutor_manage_own_schedule" ON "Schedule";
DROP POLICY IF EXISTS "tutor_manage_own_homework" ON "Homework";
DROP POLICY IF EXISTS "tutor_select_submissions" ON "HomeworkSubmission";
DROP POLICY IF EXISTS "tutor_manage_own_tests" ON "Test";
DROP POLICY IF EXISTS "tutor_select_student_attempts" ON "TestAttempt";
DROP POLICY IF EXISTS "tutor_select_student_progress" ON "Progress";
DROP POLICY IF EXISTS "tutor_select_student_ai_conversations" ON "AIConversation";
DROP POLICY IF EXISTS "tutor_select_student_game_profiles" ON "StudentGameProfile";
DROP POLICY IF EXISTS "tutor_select_own_earnings" ON "Earning";
DROP POLICY IF EXISTS "tutor_select_all" ON "Tutor";
DROP POLICY IF EXISTS "tutor_select_own" ON "Tutor";
DROP POLICY IF EXISTS "tutor_update_own" ON "Tutor";
DROP POLICY IF EXISTS "admin_manage_tutors" ON "Tutor";
DROP POLICY IF EXISTS "tutor_subject_select_all" ON "TutorSubject";
DROP POLICY IF EXISTS "tutor_subject_manage_own" ON "TutorSubject";
DROP POLICY IF EXISTS "admin_manage_tutor_subjects" ON "TutorSubject";
DROP POLICY IF EXISTS "tutor_manage_own_curriculum" ON "CurriculumPlan";
DROP POLICY IF EXISTS "student_select_own_curriculum" ON "CurriculumPlan";
DROP POLICY IF EXISTS "admin_manage_curriculum_plans" ON "CurriculumPlan";
DROP POLICY IF EXISTS "curriculum_item_tutor_manage" ON "CurriculumPlanItem";
DROP POLICY IF EXISTS "curriculum_item_student_select" ON "CurriculumPlanItem";
DROP POLICY IF EXISTS "curriculum_item_admin_manage" ON "CurriculumPlanItem";

-- ============================================================
-- 2. Drop helper functions tied to tutor role
-- ============================================================

DROP FUNCTION IF EXISTS public.get_current_tutor_id() CASCADE;
DROP FUNCTION IF EXISTS public.update_tutor_rating() CASCADE;

-- ============================================================
-- 3. Drop tutor-related tables (in FK-dependency order)
-- ============================================================

DROP TABLE IF EXISTS "CurriculumPlanItem" CASCADE;
DROP TABLE IF EXISTS "CurriculumPlan" CASCADE;
DROP TABLE IF EXISTS "Earning" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "TutorSubject" CASCADE;

-- ============================================================
-- 4. Drop tutorId columns from remaining tables
-- ============================================================

ALTER TABLE "Student"  DROP COLUMN IF EXISTS "tutorId";
ALTER TABLE "Lesson"   DROP COLUMN IF EXISTS "tutorId";
ALTER TABLE "Schedule" DROP COLUMN IF EXISTS "tutorId";
ALTER TABLE "Homework" DROP COLUMN IF EXISTS "tutorId";
ALTER TABLE "Test"     DROP COLUMN IF EXISTS "tutorId";

-- ============================================================
-- 5. Drop the Tutor table itself (now that nothing references it)
-- ============================================================

DROP TABLE IF EXISTS "Tutor" CASCADE;
DROP TYPE  IF EXISTS "TutorVerificationStatus";

-- ============================================================
-- 6. Migrate any remaining TUTOR users to STUDENT
--    (safer than dropping the rows; rare in practice)
-- ============================================================

UPDATE "User" SET "role" = 'STUDENT' WHERE "role" = 'TUTOR';

-- ============================================================
-- 7. Recreate UserRole enum without TUTOR
--    PostgreSQL does not allow removing an enum value directly,
--    so we create a new type, swap the column, and drop the old.
-- ============================================================

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'ADMIN');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING ("role"::text::"UserRole");

DROP TYPE "UserRole_old";

-- ============================================================
-- 8. Refresh JWT custom-claims hook so user_role no longer
--    contains TUTOR (re-create with same body to bust any cache).
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_name text;
  v_surname text;
BEGIN
  SELECT u.id, u.role::text, u.name, u.surname
  INTO v_user_id, v_role, v_name, v_surname
  FROM public."User" u
  WHERE u.email = (event->'claims'->>'email');

  RETURN jsonb_build_object('claims',
    (event->'claims') || jsonb_build_object(
      'user_id',      v_user_id,
      'user_role',    v_role,
      'user_name',    v_name,
      'user_surname', v_surname
    )
  );
END;
$$;

COMMIT;
