
-- ============================================================
-- RLS POLICIES for FEMO
-- Pattern: auth.uid()::text matches User.authId
-- ============================================================

-- Helper function: get current user's internal ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "id" FROM public."User" WHERE "authId" = auth.uid()::text LIMIT 1;
$$;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "role"::text FROM public."User" WHERE "authId" = auth.uid()::text LIMIT 1;
$$;

-- Helper function: get current student ID
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s."id" FROM public."Student" s
  JOIN public."User" u ON u."id" = s."userId"
  WHERE u."authId" = auth.uid()::text LIMIT 1;
$$;

-- Helper function: get current tutor ID
CREATE OR REPLACE FUNCTION public.get_current_tutor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t."id" FROM public."Tutor" t
  JOIN public."User" u ON u."id" = t."userId"
  WHERE u."authId" = auth.uid()::text LIMIT 1;
$$;

-- Helper function: get current parent ID
CREATE OR REPLACE FUNCTION public.get_current_parent_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p."id" FROM public."Parent" p
  JOIN public."User" u ON u."id" = p."userId"
  WHERE u."authId" = auth.uid()::text LIMIT 1;
$$;

-- ============================================================
-- USER TABLE
-- ============================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "user_select_own" ON "User" FOR SELECT
  USING ("authId" = auth.uid()::text);

-- Admins can read all users
CREATE POLICY "admin_select_all_users" ON "User" FOR SELECT
  USING (public.get_current_user_role() = 'ADMIN');

-- Tutors can see their students' user records
CREATE POLICY "tutor_select_students" ON "User" FOR SELECT
  USING (
    public.get_current_user_role() = 'TUTOR'
    AND "id" IN (
      SELECT s."userId" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

-- Parents can see their children's user records
CREATE POLICY "parent_select_children" ON "User" FOR SELECT
  USING (
    public.get_current_user_role() = 'PARENT'
    AND "id" IN (
      SELECT s."userId" FROM "Student" s
      JOIN "ParentToStudent" ps ON ps."studentId" = s."id"
      WHERE ps."parentId" = public.get_current_parent_id()
    )
  );

-- Users can update their own row
CREATE POLICY "user_update_own" ON "User" FOR UPDATE
  USING ("authId" = auth.uid()::text)
  WITH CHECK ("authId" = auth.uid()::text);

-- Admins can update any user
CREATE POLICY "admin_update_users" ON "User" FOR UPDATE
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- STUDENT TABLE
-- ============================================================
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own" ON "Student" FOR SELECT
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "tutor_select_own_students" ON "Student" FOR SELECT
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "parent_select_own_children" ON "Student" FOR SELECT
  USING (
    "id" IN (
      SELECT ps."studentId" FROM "ParentToStudent" ps
      WHERE ps."parentId" = public.get_current_parent_id()
    )
  );

CREATE POLICY "admin_select_all_students" ON "Student" FOR SELECT
  USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "student_update_own" ON "Student" FOR UPDATE
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_students" ON "Student" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- TUTOR TABLE
-- ============================================================
ALTER TABLE "Tutor" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view approved tutors (catalog)
CREATE POLICY "anyone_select_tutors" ON "Tutor" FOR SELECT
  USING (true);

CREATE POLICY "tutor_update_own" ON "Tutor" FOR UPDATE
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_tutors" ON "Tutor" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- PARENT TABLE
-- ============================================================
ALTER TABLE "Parent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_select_own" ON "Parent" FOR SELECT
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_parents" ON "Parent" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- PARENT TO STUDENT
-- ============================================================
ALTER TABLE "ParentToStudent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_select_own_links" ON "ParentToStudent" FOR SELECT
  USING ("parentId" = public.get_current_parent_id());

CREATE POLICY "admin_manage_parent_student" ON "ParentToStudent" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- SUBJECT (public read)
-- ============================================================
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_subjects" ON "Subject" FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_subjects" ON "Subject" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- TOPIC (public read)
-- ============================================================
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_topics" ON "Topic" FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_topics" ON "Topic" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- TUTOR SUBJECT
-- ============================================================
ALTER TABLE "TutorSubject" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_tutor_subjects" ON "TutorSubject" FOR SELECT
  USING (true);

CREATE POLICY "tutor_manage_own_subjects" ON "TutorSubject" FOR ALL
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "admin_manage_tutor_subjects" ON "TutorSubject" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- STUDENT MODEL
-- ============================================================
ALTER TABLE "StudentModel" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_model" ON "StudentModel" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_models" ON "StudentModel" FOR SELECT
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "parent_select_child_models" ON "StudentModel" FOR SELECT
  USING (
    "studentId" IN (
      SELECT ps."studentId" FROM "ParentToStudent" ps
      WHERE ps."parentId" = public.get_current_parent_id()
    )
  );

CREATE POLICY "admin_manage_student_models" ON "StudentModel" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- EDUCATION PROFILE
-- ============================================================
ALTER TABLE "EducationProfile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_manage_own_edu_profile" ON "EducationProfile" FOR ALL
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_edu_profile" ON "EducationProfile" FOR SELECT
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_edu_profiles" ON "EducationProfile" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- LEARNING TRAJECTORY
-- ============================================================
ALTER TABLE "LearningTrajectory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_trajectory" ON "LearningTrajectory" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_manage_student_trajectories" ON "LearningTrajectory" FOR ALL
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_trajectories" ON "LearningTrajectory" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- DIAGNOSTIC TEST (public read)
-- ============================================================
ALTER TABLE "DiagnosticTest" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_diagnostic_tests" ON "DiagnosticTest" FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_diagnostic_tests" ON "DiagnosticTest" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- DIAGNOSTIC RESULT
-- ============================================================
ALTER TABLE "DiagnosticResult" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_manage_own_diagnostics" ON "DiagnosticResult" FOR ALL
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_diagnostics" ON "DiagnosticResult" FOR SELECT
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_diagnostics" ON "DiagnosticResult" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- LESSON
-- ============================================================
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_manage_own_lessons" ON "Lesson" FOR ALL
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "student_select_own_lessons" ON "Lesson" FOR SELECT
  USING (
    "id" IN (
      SELECT ls."lessonId" FROM "LessonStudent" ls
      WHERE ls."studentId" = public.get_current_student_id()
    )
  );

CREATE POLICY "parent_select_child_lessons" ON "Lesson" FOR SELECT
  USING (
    "id" IN (
      SELECT ls."lessonId" FROM "LessonStudent" ls
      WHERE ls."studentId" IN (
        SELECT ps."studentId" FROM "ParentToStudent" ps
        WHERE ps."parentId" = public.get_current_parent_id()
      )
    )
  );

CREATE POLICY "admin_manage_lessons" ON "Lesson" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- LESSON STUDENT
-- ============================================================
ALTER TABLE "LessonStudent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_lesson_students" ON "LessonStudent" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_manage_lesson_students" ON "LessonStudent" FOR ALL
  USING (
    "lessonId" IN (
      SELECT l."id" FROM "Lesson" l WHERE l."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_lesson_students" ON "LessonStudent" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- GROUP LESSON
-- ============================================================
ALTER TABLE "GroupLesson" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_group_lessons" ON "GroupLesson" FOR SELECT
  USING (true);

CREATE POLICY "tutor_manage_own_group_lessons" ON "GroupLesson" FOR ALL
  USING (
    "lessonId" IN (
      SELECT l."id" FROM "Lesson" l WHERE l."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_group_lessons" ON "GroupLesson" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- GROUP LESSON PARTICIPANT
-- ============================================================
ALTER TABLE "GroupLessonParticipant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_group_participation" ON "GroupLessonParticipant" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_manage_group_participants" ON "GroupLessonParticipant" FOR ALL
  USING (
    "groupLessonId" IN (
      SELECT gl."id" FROM "GroupLesson" gl
      JOIN "Lesson" l ON l."id" = gl."lessonId"
      WHERE l."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_group_participants" ON "GroupLessonParticipant" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- SCHEDULE
-- ============================================================
ALTER TABLE "Schedule" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_schedules" ON "Schedule" FOR SELECT
  USING (true);

CREATE POLICY "tutor_manage_own_schedule" ON "Schedule" FOR ALL
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "admin_manage_schedules" ON "Schedule" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- HOMEWORK
-- ============================================================
ALTER TABLE "Homework" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_manage_own_homework" ON "Homework" FOR ALL
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "student_select_assigned_homework" ON "Homework" FOR SELECT
  USING (
    "id" IN (
      SELECT hs."homeworkId" FROM "HomeworkSubmission" hs
      WHERE hs."studentId" = public.get_current_student_id()
    )
  );

CREATE POLICY "parent_select_child_homework" ON "Homework" FOR SELECT
  USING (
    "id" IN (
      SELECT hs."homeworkId" FROM "HomeworkSubmission" hs
      WHERE hs."studentId" IN (
        SELECT ps."studentId" FROM "ParentToStudent" ps
        WHERE ps."parentId" = public.get_current_parent_id()
      )
    )
  );

CREATE POLICY "admin_manage_homework" ON "Homework" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- HOMEWORK SUBMISSION
-- ============================================================
ALTER TABLE "HomeworkSubmission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_manage_own_submissions" ON "HomeworkSubmission" FOR ALL
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_submissions" ON "HomeworkSubmission" FOR SELECT
  USING (
    "homeworkId" IN (
      SELECT h."id" FROM "Homework" h WHERE h."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "parent_select_child_submissions" ON "HomeworkSubmission" FOR SELECT
  USING (
    "studentId" IN (
      SELECT ps."studentId" FROM "ParentToStudent" ps
      WHERE ps."parentId" = public.get_current_parent_id()
    )
  );

CREATE POLICY "admin_manage_submissions" ON "HomeworkSubmission" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- TEST
-- ============================================================
ALTER TABLE "Test" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_manage_own_tests" ON "Test" FOR ALL
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "student_select_tests" ON "Test" FOR SELECT
  USING (
    "id" IN (
      SELECT ta."testId" FROM "TestAttempt" ta
      WHERE ta."studentId" = public.get_current_student_id()
    )
  );

CREATE POLICY "admin_manage_tests" ON "Test" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- TEST ATTEMPT
-- ============================================================
ALTER TABLE "TestAttempt" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_manage_own_attempts" ON "TestAttempt" FOR ALL
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_attempts" ON "TestAttempt" FOR SELECT
  USING (
    "testId" IN (
      SELECT t."id" FROM "Test" t WHERE t."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_test_attempts" ON "TestAttempt" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- PROGRESS
-- ============================================================
ALTER TABLE "Progress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_progress" ON "Progress" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_progress" ON "Progress" FOR SELECT
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "parent_select_child_progress" ON "Progress" FOR SELECT
  USING (
    "studentId" IN (
      SELECT ps."studentId" FROM "ParentToStudent" ps
      WHERE ps."parentId" = public.get_current_parent_id()
    )
  );

CREATE POLICY "admin_manage_progress" ON "Progress" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- AI CONVERSATION
-- ============================================================
ALTER TABLE "AIConversation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_manage_own_ai_conversations" ON "AIConversation" FOR ALL
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_ai_conversations" ON "AIConversation" FOR SELECT
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_ai_conversations" ON "AIConversation" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- AI MESSAGE
-- ============================================================
ALTER TABLE "AIMessage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_manage_own_ai_messages" ON "AIMessage" FOR ALL
  USING (
    "conversationId" IN (
      SELECT ac."id" FROM "AIConversation" ac
      WHERE ac."studentId" = public.get_current_student_id()
    )
  );

CREATE POLICY "admin_manage_ai_messages" ON "AIMessage" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- STUDENT GAME PROFILE
-- ============================================================
ALTER TABLE "StudentGameProfile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_game_profile" ON "StudentGameProfile" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "tutor_select_student_game_profiles" ON "StudentGameProfile" FOR SELECT
  USING (
    "studentId" IN (
      SELECT s."id" FROM "Student" s WHERE s."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "admin_manage_game_profiles" ON "StudentGameProfile" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- ACHIEVEMENT (public read)
-- ============================================================
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_achievements" ON "Achievement" FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_achievements" ON "Achievement" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- STUDENT ACHIEVEMENT
-- ============================================================
ALTER TABLE "StudentAchievement" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_achievements" ON "StudentAchievement" FOR SELECT
  USING (
    "studentProfileId" IN (
      SELECT sgp."id" FROM "StudentGameProfile" sgp
      WHERE sgp."studentId" = public.get_current_student_id()
    )
  );

CREATE POLICY "admin_manage_student_achievements" ON "StudentAchievement" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- XP TRANSACTION
-- ============================================================
ALTER TABLE "XPTransaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_xp" ON "XPTransaction" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

CREATE POLICY "admin_manage_xp" ON "XPTransaction" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- CONVERSATION (messaging)
-- ============================================================
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participant_select_conversations" ON "Conversation" FOR SELECT
  USING (
    "id" IN (
      SELECT cp."conversationId" FROM "ConversationParticipant" cp
      WHERE cp."userId" = public.get_current_user_id()
    )
  );

CREATE POLICY "admin_manage_conversations" ON "Conversation" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- CONVERSATION PARTICIPANT
-- ============================================================
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_participations" ON "ConversationParticipant" FOR SELECT
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "user_select_co_participants" ON "ConversationParticipant" FOR SELECT
  USING (
    "conversationId" IN (
      SELECT cp."conversationId" FROM "ConversationParticipant" cp
      WHERE cp."userId" = public.get_current_user_id()
    )
  );

CREATE POLICY "admin_manage_participants" ON "ConversationParticipant" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- MESSAGE
-- ============================================================
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participant_select_messages" ON "Message" FOR SELECT
  USING (
    "conversationId" IN (
      SELECT cp."conversationId" FROM "ConversationParticipant" cp
      WHERE cp."userId" = public.get_current_user_id()
    )
  );

CREATE POLICY "user_insert_own_messages" ON "Message" FOR INSERT
  WITH CHECK ("senderId" = public.get_current_user_id());

CREATE POLICY "admin_manage_messages" ON "Message" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- NOTIFICATION
-- ============================================================
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manage_own_notifications" ON "Notification" FOR ALL
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_notifications" ON "Notification" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- PACKAGE (public read)
-- ============================================================
ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_packages" ON "Package" FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_packages" ON "Package" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- SUBSCRIPTION
-- ============================================================
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_subscriptions" ON "Subscription" FOR SELECT
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_subscriptions" ON "Subscription" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- PROMO CODE
-- ============================================================
ALTER TABLE "PromoCode" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_active_promos" ON "PromoCode" FOR SELECT
  USING ("isActive" = true);

CREATE POLICY "admin_manage_promos" ON "PromoCode" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- PAYMENT
-- ============================================================
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_payments" ON "Payment" FOR SELECT
  USING ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_payments" ON "Payment" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- FAMILY PLAN
-- ============================================================
ALTER TABLE "FamilyPlan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_select_own_family_plan" ON "FamilyPlan" FOR SELECT
  USING ("parentUserId" = public.get_current_user_id());

CREATE POLICY "admin_manage_family_plans" ON "FamilyPlan" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- EARNING
-- ============================================================
ALTER TABLE "Earning" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_select_own_earnings" ON "Earning" FOR SELECT
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "admin_manage_earnings" ON "Earning" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- CURRICULUM PLAN
-- ============================================================
ALTER TABLE "CurriculumPlan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_manage_own_curriculum" ON "CurriculumPlan" FOR ALL
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "student_select_own_curriculum" ON "CurriculumPlan" FOR SELECT
  USING (
    "studentId" = public.get_current_student_id()
    OR "tutorId" IN (
      SELECT s."tutorId" FROM "Student" s WHERE s."id" = public.get_current_student_id()
    )
  );

CREATE POLICY "admin_manage_curriculum" ON "CurriculumPlan" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- CURRICULUM PLAN ITEM
-- ============================================================
ALTER TABLE "CurriculumPlanItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_manage_own_curriculum_items" ON "CurriculumPlanItem" FOR ALL
  USING (
    "curriculumPlanId" IN (
      SELECT cp."id" FROM "CurriculumPlan" cp WHERE cp."tutorId" = public.get_current_tutor_id()
    )
  );

CREATE POLICY "student_select_curriculum_items" ON "CurriculumPlanItem" FOR SELECT
  USING (
    "curriculumPlanId" IN (
      SELECT cp."id" FROM "CurriculumPlan" cp
      WHERE cp."studentId" = public.get_current_student_id()
        OR cp."tutorId" IN (
          SELECT s."tutorId" FROM "Student" s WHERE s."id" = public.get_current_student_id()
        )
    )
  );

CREATE POLICY "admin_manage_curriculum_items" ON "CurriculumPlanItem" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- ============================================================
-- REVIEW
-- ============================================================
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_approved_reviews" ON "Review" FOR SELECT
  USING ("isApproved" = true);

CREATE POLICY "user_insert_own_review" ON "Review" FOR INSERT
  WITH CHECK ("authorUserId" = public.get_current_user_id());

CREATE POLICY "user_select_own_reviews" ON "Review" FOR SELECT
  USING ("authorUserId" = public.get_current_user_id());

CREATE POLICY "tutor_select_own_reviews" ON "Review" FOR SELECT
  USING ("tutorId" = public.get_current_tutor_id());

CREATE POLICY "admin_manage_reviews" ON "Review" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');
;
