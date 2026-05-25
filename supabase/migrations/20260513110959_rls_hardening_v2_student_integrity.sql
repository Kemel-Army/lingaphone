-- ============================================================================
-- RLS HARDENING v2 — Student-role integrity.
-- Blocks self-grading, XP grinding, fake StudentModel/Progress, conversation
-- hijack via known id, AIMessage assistant-spoofing, homework/test enumeration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Block client INSERTs on transaction/profile tables (only service_role)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_service_role_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) <> 'service_role' THEN
    RAISE EXCEPTION 'Only server-side writes allowed for %', TG_TABLE_NAME
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.enforce_service_role_only() FROM PUBLIC, anon, authenticated;

-- XPTransaction / GemTransaction: server-only inserts
DROP TRIGGER IF EXISTS trg_xptx_service_only ON public."XPTransaction";
CREATE TRIGGER trg_xptx_service_only
BEFORE INSERT OR UPDATE OR DELETE ON public."XPTransaction"
FOR EACH ROW EXECUTE FUNCTION public.enforce_service_role_only();

DROP TRIGGER IF EXISTS trg_gemtx_service_only ON public."GemTransaction";
CREATE TRIGGER trg_gemtx_service_only
BEFORE INSERT OR UPDATE OR DELETE ON public."GemTransaction"
FOR EACH ROW EXECUTE FUNCTION public.enforce_service_role_only();

-- Progress: tutor or service_role may write
CREATE OR REPLACE FUNCTION public.enforce_progress_writer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF COALESCE(public.get_current_user_role(), '') IN ('TUTOR', 'ADMIN') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Only server, tutors, or admins may write Progress'
    USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS trg_progress_writer ON public."Progress";
CREATE TRIGGER trg_progress_writer
BEFORE INSERT OR UPDATE OR DELETE ON public."Progress"
FOR EACH ROW EXECUTE FUNCTION public.enforce_progress_writer();

-- StudentGameProfile: read by student (existing), write by service_role only
CREATE OR REPLACE FUNCTION public.enforce_game_profile_writer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'StudentGameProfile is server-managed'
    USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS trg_sgp_writer ON public."StudentGameProfile";
CREATE TRIGGER trg_sgp_writer
BEFORE INSERT OR UPDATE OR DELETE ON public."StudentGameProfile"
FOR EACH ROW EXECUTE FUNCTION public.enforce_game_profile_writer();

-- StudentAchievement: server-only inserts
DROP TRIGGER IF EXISTS trg_studachv_service_only ON public."StudentAchievement";
CREATE TRIGGER trg_studachv_service_only
BEFORE INSERT OR UPDATE OR DELETE ON public."StudentAchievement"
FOR EACH ROW EXECUTE FUNCTION public.enforce_service_role_only();

-- ----------------------------------------------------------------------------
-- 2. StudentModel writable only by tutor/admin/service_role
--    (was: student could upsert their own model with fake mastery)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "student_manage_own_models" ON public."StudentModel";

CREATE POLICY "student_select_own_model" ON public."StudentModel"
FOR SELECT TO authenticated
USING ("studentId" = public.get_current_student_id());

CREATE OR REPLACE FUNCTION public.enforce_student_model_writer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF COALESCE(public.get_current_user_role(), '') IN ('TUTOR', 'ADMIN') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'StudentModel is server- or tutor-managed only'
    USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS trg_studentmodel_writer ON public."StudentModel";
CREATE TRIGGER trg_studentmodel_writer
BEFORE INSERT OR UPDATE OR DELETE ON public."StudentModel"
FOR EACH ROW EXECUTE FUNCTION public.enforce_student_model_writer();

-- ----------------------------------------------------------------------------
-- 3. Sanitize score/aiAnalysis writes on HomeworkSubmission / TestAttempt /
--    DiagnosticResult — clients cannot self-grade. Server-side (service_role)
--    bypasses; the trigger silently reverts to OLD value (or NULL on INSERT).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sanitize_homework_submission_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.score := NULL;
    NEW."aiScore" := NULL;
    NEW."aiAnalysis" := NULL;
    NEW."aiFeedback" := NULL;
    NEW."aiCheckedAt" := NULL;
  ELSE
    NEW.score := OLD.score;
    NEW."aiScore" := OLD."aiScore";
    NEW."aiAnalysis" := OLD."aiAnalysis";
    NEW."aiFeedback" := OLD."aiFeedback";
    NEW."aiCheckedAt" := OLD."aiCheckedAt";
    -- once CHECKED, client cannot revert status backwards
    IF OLD.status = 'CHECKED' AND NEW.status <> OLD.status THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_hwsub_sanitize ON public."HomeworkSubmission";
CREATE TRIGGER trg_hwsub_sanitize
BEFORE INSERT OR UPDATE ON public."HomeworkSubmission"
FOR EACH ROW EXECUTE FUNCTION public.sanitize_homework_submission_writes();


CREATE OR REPLACE FUNCTION public.sanitize_test_attempt_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.score := NULL;
    NEW."topicScores" := NULL;
    NEW."completedAt" := NULL;
  ELSE
    NEW.score := OLD.score;
    NEW."topicScores" := OLD."topicScores";
    NEW."completedAt" := OLD."completedAt";
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_testattempt_sanitize ON public."TestAttempt";
CREATE TRIGGER trg_testattempt_sanitize
BEFORE INSERT OR UPDATE ON public."TestAttempt"
FOR EACH ROW EXECUTE FUNCTION public.sanitize_test_attempt_writes();


CREATE OR REPLACE FUNCTION public.sanitize_diagnostic_result_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW."overallScore" := NULL;
    NEW."topicScores" := NULL;
    NEW."completedAt" := NULL;
    NEW.answers := COALESCE(NEW.answers, '[]'::jsonb);
    NEW.status := 'IN_PROGRESS';
  ELSE
    NEW."overallScore" := OLD."overallScore";
    NEW."topicScores" := OLD."topicScores";
    NEW."completedAt" := OLD."completedAt";
    NEW.answers := OLD.answers;
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_diagresult_sanitize ON public."DiagnosticResult";
CREATE TRIGGER trg_diagresult_sanitize
BEFORE INSERT OR UPDATE ON public."DiagnosticResult"
FOR EACH ROW EXECUTE FUNCTION public.sanitize_diagnostic_result_writes();

-- ----------------------------------------------------------------------------
-- 4. ConversationParticipant — clients cannot add anyone (including self) to
--    arbitrary conversations. Creation flow moves to /api/conversations/*.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "participant_insert_self" ON public."ConversationParticipant";
DROP POLICY IF EXISTS "authenticated_insert_conversations" ON public."Conversation";

-- (No client INSERT policy on Conversation or ConversationParticipant.
-- Server uses service_role.)

-- ----------------------------------------------------------------------------
-- 5. Message — allow participants to UPDATE `isRead` on incoming messages,
--    but only the sender may edit `content` / other fields. We split into
--    two policies and use a trigger to lock fields.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "sender_update_own_messages" ON public."Message";

CREATE POLICY "sender_update_own_message_content" ON public."Message"
FOR UPDATE TO authenticated
USING ("senderId" = public.get_current_user_id())
WITH CHECK ("senderId" = public.get_current_user_id());

CREATE POLICY "participant_mark_message_read" ON public."Message"
FOR UPDATE TO authenticated
USING (
  "conversationId" IN (
    SELECT cp."conversationId" FROM public."ConversationParticipant" cp
    WHERE cp."userId" = public.get_current_user_id()
  )
);

CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  v_uid := public.get_current_user_id();

  IF v_uid = OLD."senderId" THEN
    -- Sender: full edit allowed (handled by content policy)
    RETURN NEW;
  END IF;

  -- Non-sender participant: only `isRead` may change
  IF NEW.content IS DISTINCT FROM OLD.content
     OR NEW."senderId" IS DISTINCT FROM OLD."senderId"
     OR NEW."conversationId" IS DISTINCT FROM OLD."conversationId"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  THEN
    RAISE EXCEPTION 'Only the sender may edit message content'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_message_guard_update ON public."Message";
CREATE TRIGGER trg_message_guard_update
BEFORE UPDATE ON public."Message"
FOR EACH ROW EXECUTE FUNCTION public.guard_message_update();

-- ----------------------------------------------------------------------------
-- 6. AIMessage — clients may only insert role='USER'; ASSISTANT/SYSTEM
--    can only be written by service_role.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_ai_message_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF UPPER(COALESCE(NEW.role::text, '')) NOT IN ('USER') THEN
      RAISE EXCEPTION 'Clients can only insert USER messages'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    -- UPDATE/DELETE not allowed for clients
    RAISE EXCEPTION 'AIMessage is append-only for clients'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_aimsg_guard ON public."AIMessage";
CREATE TRIGGER trg_aimsg_guard
BEFORE INSERT OR UPDATE OR DELETE ON public."AIMessage"
FOR EACH ROW EXECUTE FUNCTION public.guard_ai_message_role();

-- ----------------------------------------------------------------------------
-- 7. Homework / Test SELECT — enumeration fix: visible iff student belongs
--    to the tutor that owns the homework/test, OR there's an existing
--    submission/attempt. Prevents the "INSERT submission to reveal homework"
--    bypass.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "student_select_assigned_homework" ON public."Homework";
CREATE POLICY "student_select_assigned_homework" ON public."Homework"
FOR SELECT TO authenticated
USING (
  -- student belongs to this tutor
  "tutorId" IN (
    SELECT s."tutorId" FROM public."Student" s
    WHERE s.id = public.get_current_student_id()
  )
);

DROP POLICY IF EXISTS "student_select_tests" ON public."Test";
CREATE POLICY "student_select_tests" ON public."Test"
FOR SELECT TO authenticated
USING (
  "tutorId" IN (
    SELECT s."tutorId" FROM public."Student" s
    WHERE s.id = public.get_current_student_id()
  )
);

-- ----------------------------------------------------------------------------
-- 8. AIConversation INSERT scope: ensure studentId matches caller's student.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "student_manage_own_ai_conversations" ON public."AIConversation";

CREATE POLICY "student_select_own_ai_conversations" ON public."AIConversation"
FOR SELECT TO authenticated
USING ("studentId" = public.get_current_student_id());

CREATE POLICY "student_insert_own_ai_conversations" ON public."AIConversation"
FOR INSERT TO authenticated
WITH CHECK ("studentId" = public.get_current_student_id());

CREATE POLICY "student_update_own_ai_conversations" ON public."AIConversation"
FOR UPDATE TO authenticated
USING ("studentId" = public.get_current_student_id())
WITH CHECK ("studentId" = public.get_current_student_id());

CREATE POLICY "student_delete_own_ai_conversations" ON public."AIConversation"
FOR DELETE TO authenticated
USING ("studentId" = public.get_current_student_id());
