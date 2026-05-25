-- ============================================================
-- LINGAFON — Core schema (Student role focus)
-- Run AFTER 000_auth_minimum.sql in lingafon Supabase SQL Editor.
-- Idempotent: safe to re-run.
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN CREATE TYPE "EnglishLevel"     AS ENUM ('A1','A2','S1','S2','B2','F1','F2','F3','F4'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BranchKind"       AS ENUM ('OFFLINE','ONLINE');                            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "GroupMemberStatus" AS ENUM ('ACTIVE','LEFT');                              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LessonStatus"     AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE');                     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MedalKind"        AS ENUM ('GOLD','SILVER','BRONZE','NONE');               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PayoutStatus"     AS ENUM ('PENDING','PAID','CANCELLED');                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HomeworkFormat"   AS ENUM ('TEST','INPUT','TEXT','ORAL','FILE','INTERACTIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HomeworkStatus"   AS ENUM ('ASSIGNED','IN_PROGRESS','SUBMITTED','CHECKED','OVERDUE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MaterialKind"     AS ENUM ('AUDIO','VIDEO','PDF','LINK');                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ConversationKind" AS ENUM ('DIRECT','GROUP');                              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('MEDAL_AWARDED','PAYOUT_RECEIVED','HOMEWORK_CHECKED','LESSON_REMINDER','NEW_MESSAGE','SYSTEM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "XpActionKind"     AS ENUM ('PRACTICE_CARD','PRACTICE_DECK','HOMEWORK_ONTIME','LESSON_ATTENDED','DAILY_QUEST','MANUAL_AWARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. ROLE TABLES (one row per User in their role)
-- ============================================================

CREATE TABLE IF NOT EXISTS public."Student" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"              UUID NOT NULL UNIQUE REFERENCES public."User"("id") ON DELETE CASCADE,
  "level"               "EnglishLevel" NOT NULL DEFAULT 'A1',
  "schoolGrade"         INTEGER,
  "goldStreak"          INTEGER NOT NULL DEFAULT 0,
  "totalEarnings"       INTEGER NOT NULL DEFAULT 0,
  "totalXp"             INTEGER NOT NULL DEFAULT 0,
  "dailyStreak"         INTEGER NOT NULL DEFAULT 0,
  "lastActiveDate"      DATE,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Teacher" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"              UUID NOT NULL UNIQUE REFERENCES public."User"("id") ON DELETE CASCADE,
  "bio"                 TEXT,
  "yearsOfExperience"   INTEGER NOT NULL DEFAULT 0,
  "rating"              DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount"         INTEGER NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Parent" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"              UUID NOT NULL UNIQUE REFERENCES public."User"("id") ON DELETE CASCADE,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. LEARNING — Branch, Group, GroupMember, Lesson, Attendance, Grade
-- ============================================================

CREATE TABLE IF NOT EXISTS public."Branch" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "kind"      "BranchKind" NOT NULL,
  "address"   TEXT,
  "city"      TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Group" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         TEXT NOT NULL,
  "level"        "EnglishLevel" NOT NULL,
  "teacherId"    UUID NOT NULL REFERENCES public."Teacher"("id") ON DELETE RESTRICT,
  "branchId"     UUID NOT NULL REFERENCES public."Branch"("id") ON DELETE RESTRICT,
  "schedule"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "maxStudents"  INTEGER NOT NULL DEFAULT 10,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."GroupMember" (
  "groupId"   UUID NOT NULL REFERENCES public."Group"("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "joinedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "status"    "GroupMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY ("groupId", "studentId")
);

CREATE TABLE IF NOT EXISTS public."Lesson" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId"       UUID NOT NULL REFERENCES public."Group"("id") ON DELETE CASCADE,
  "startsAt"      TIMESTAMPTZ NOT NULL,
  "durationMin"   INTEGER NOT NULL DEFAULT 60,
  "topic"         TEXT NOT NULL DEFAULT '',
  "status"        "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
  "meetingUrl"    TEXT,
  "recordingUrl"  TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Attendance" (
  "studentId" UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "lessonId"  UUID NOT NULL REFERENCES public."Lesson"("id") ON DELETE CASCADE,
  "status"    "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "markedBy"  UUID REFERENCES public."Teacher"("id") ON DELETE SET NULL,
  "markedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("studentId", "lessonId")
);

CREATE TABLE IF NOT EXISTS public."Grade" (
  "studentId" UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "lessonId"  UUID NOT NULL REFERENCES public."Lesson"("id") ON DELETE CASCADE,
  "value"     INTEGER NOT NULL CHECK ("value" BETWEEN 1 AND 5),
  "comment"   TEXT,
  "gradedBy"  UUID REFERENCES public."Teacher"("id") ON DELETE SET NULL,
  "gradedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("studentId", "lessonId")
);

-- ============================================================
-- 4. MARKET OF ACHIEVEMENTS — MonthlyMedal, Payout
-- ============================================================

CREATE TABLE IF NOT EXISTS public."MonthlyMedal" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"     UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "month"         TEXT NOT NULL,  -- YYYY-MM
  "averageGrade"  DOUBLE PRECISION NOT NULL,
  "medal"         "MedalKind" NOT NULL,
  "payout"        INTEGER NOT NULL DEFAULT 0,
  "confirmedBy"   UUID REFERENCES public."Teacher"("id") ON DELETE SET NULL,
  "confirmedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "month")
);

CREATE TABLE IF NOT EXISTS public."Payout" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "medalId"   UUID REFERENCES public."MonthlyMedal"("id") ON DELETE SET NULL,
  "studentId" UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "amount"    INTEGER NOT NULL,
  "status"    "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "method"    TEXT,
  "kind"      TEXT NOT NULL DEFAULT 'MEDAL',  -- MEDAL | STREAK_BONUS
  "paidAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. HOMEWORK
-- ============================================================

CREATE TABLE IF NOT EXISTS public."Homework" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId"    UUID NOT NULL REFERENCES public."Lesson"("id") ON DELETE CASCADE,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "format"      "HomeworkFormat" NOT NULL,
  "payload"     JSONB NOT NULL DEFAULT '{}'::jsonb,
  "dueAt"       TIMESTAMPTZ NOT NULL,
  "maxScore"    INTEGER NOT NULL DEFAULT 100,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."HomeworkSubmission" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "homeworkId"     UUID NOT NULL REFERENCES public."Homework"("id") ON DELETE CASCADE,
  "studentId"      UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "status"         "HomeworkStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "answers"        JSONB,
  "audioUrl"       TEXT,
  "fileUrl"        TEXT,
  "aiScore"        DOUBLE PRECISION,
  "aiFeedback"     JSONB,
  "teacherGrade"   INTEGER CHECK ("teacherGrade" BETWEEN 1 AND 5),
  "teacherComment" TEXT,
  "submittedAt"    TIMESTAMPTZ,
  "checkedAt"      TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("homeworkId", "studentId")
);

-- ============================================================
-- 6. PRACTICE — attempts (decks/cards stay in mock for now)
-- ============================================================

CREATE TABLE IF NOT EXISTS public."PracticeAttempt" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"    UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "deckId"       TEXT NOT NULL,    -- references mock deck id
  "cardId"       TEXT NOT NULL,
  "target"       TEXT NOT NULL,
  "transcript"   TEXT NOT NULL,
  "score"        INTEGER NOT NULL CHECK ("score" BETWEEN 0 AND 100),
  "attemptedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. MATERIALS & VOCABULARY
-- ============================================================

CREATE TABLE IF NOT EXISTS public."Material" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId"    UUID REFERENCES public."Lesson"("id") ON DELETE SET NULL,
  "groupId"     UUID REFERENCES public."Group"("id") ON DELETE SET NULL,
  "kind"        "MaterialKind" NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "url"         TEXT NOT NULL,
  "durationSec" INTEGER,
  "tag"         TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."VocabularyEntry" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"   UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "word"        TEXT NOT NULL,
  "ipa"         TEXT,
  "translation" TEXT NOT NULL,
  "example"     TEXT,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "bestScore"   INTEGER NOT NULL DEFAULT 0,
  "addedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "word")
);

-- ============================================================
-- 8. COMMUNICATIONS — Conversation, Message, Notification
-- ============================================================

CREATE TABLE IF NOT EXISTS public."Conversation" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind"           "ConversationKind" NOT NULL DEFAULT 'DIRECT',
  "groupId"        UUID REFERENCES public."Group"("id") ON DELETE CASCADE,
  "participantIds" UUID[] NOT NULL,  -- array of User.id
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Conversation_participants_idx" ON public."Conversation" USING GIN ("participantIds");

CREATE TABLE IF NOT EXISTS public."Message" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES public."Conversation"("id") ON DELETE CASCADE,
  "senderId"       UUID NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
  "body"           TEXT NOT NULL,
  "attachments"    JSONB,
  "readBy"         UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Notification" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT,
  "payload"   JSONB,
  "isRead"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. GAMIFICATION — XpLog
-- ============================================================

CREATE TABLE IF NOT EXISTS public."XpLog" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES public."Student"("id") ON DELETE CASCADE,
  "action"    "XpActionKind" NOT NULL,
  "amount"    INTEGER NOT NULL,
  "refId"     TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS "Group_teacher_idx"       ON public."Group" ("teacherId");
CREATE INDEX IF NOT EXISTS "Group_branch_idx"        ON public."Group" ("branchId");
CREATE INDEX IF NOT EXISTS "Lesson_group_starts_idx" ON public."Lesson" ("groupId", "startsAt");
CREATE INDEX IF NOT EXISTS "Grade_student_idx"       ON public."Grade" ("studentId");
CREATE INDEX IF NOT EXISTS "Medal_student_month_idx" ON public."MonthlyMedal" ("studentId", "month");
CREATE INDEX IF NOT EXISTS "Payout_student_idx"      ON public."Payout" ("studentId");
CREATE INDEX IF NOT EXISTS "HwSub_student_idx"       ON public."HomeworkSubmission" ("studentId");
CREATE INDEX IF NOT EXISTS "HwSub_hw_idx"            ON public."HomeworkSubmission" ("homeworkId");
CREATE INDEX IF NOT EXISTS "Practice_student_idx"    ON public."PracticeAttempt" ("studentId", "attemptedAt" DESC);
CREATE INDEX IF NOT EXISTS "Vocab_student_idx"       ON public."VocabularyEntry" ("studentId");
CREATE INDEX IF NOT EXISTS "Material_lesson_idx"     ON public."Material" ("lessonId");
CREATE INDEX IF NOT EXISTS "Message_conv_idx"        ON public."Message" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_user_idx"   ON public."Notification" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "XpLog_student_idx"       ON public."XpLog" ("studentId", "createdAt" DESC);

-- ============================================================
-- 11. updatedAt triggers
-- ============================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updatedAt'
    GROUP BY table_name
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
        'update_' || lower(tbl) || '_updated_at', tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 12. HELPER FUNCTIONS for RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public."User" WHERE "authId" = auth.uid()::text LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS "UserRole" LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public."User" WHERE "authId" = auth.uid()::text LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id FROM public."Student" s
  JOIN public."User" u ON u.id = s."userId"
  WHERE u."authId" = auth.uid()::text LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_current_teacher_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id FROM public."Teacher" t
  JOIN public."User" u ON u.id = t."userId"
  WHERE u."authId" = auth.uid()::text LIMIT 1
$$;

-- Lock helpers so they can't be misused
REVOKE EXECUTE ON FUNCTION public.get_current_user_id()    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_role()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_student_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_teacher_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_id()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_role()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_student_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_teacher_id() TO authenticated;

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- All tables: enable, drop existing policies (idempotent), recreate.
-- ============================================================

-- Student
ALTER TABLE public."Student" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_self_select   ON public."Student";
DROP POLICY IF EXISTS student_admin_select  ON public."Student";
DROP POLICY IF EXISTS student_teacher_select ON public."Student";
CREATE POLICY student_self_select ON public."Student" FOR SELECT USING ("userId" = public.get_current_user_id());
CREATE POLICY student_admin_select ON public."Student" FOR SELECT USING (public.get_current_role() = 'ADMIN');
CREATE POLICY student_teacher_select ON public."Student" FOR SELECT USING (
  public.get_current_role() = 'TUTOR'
  AND "id" IN (
    SELECT gm."studentId" FROM public."GroupMember" gm
    JOIN public."Group" g ON g.id = gm."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id() AND gm.status = 'ACTIVE'
  )
);

-- Teacher / Parent — readable by self + admin
ALTER TABLE public."Teacher" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_select ON public."Teacher";
CREATE POLICY teacher_select ON public."Teacher" FOR SELECT USING (
  "userId" = public.get_current_user_id() OR public.get_current_role() IN ('ADMIN','STUDENT','PARENT')
);

ALTER TABLE public."Parent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parent_select ON public."Parent";
CREATE POLICY parent_select ON public."Parent" FOR SELECT USING (
  "userId" = public.get_current_user_id() OR public.get_current_role() = 'ADMIN'
);

-- Branch — anyone authenticated can read (used for cards / landing)
ALTER TABLE public."Branch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_select ON public."Branch";
CREATE POLICY branch_select ON public."Branch" FOR SELECT USING (auth.uid() IS NOT NULL);

-- Group — student sees groups they belong to; teacher sees own; admin all
ALTER TABLE public."Group" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS group_member_select  ON public."Group";
DROP POLICY IF EXISTS group_teacher_select ON public."Group";
DROP POLICY IF EXISTS group_admin_select   ON public."Group";
CREATE POLICY group_member_select ON public."Group" FOR SELECT USING (
  "id" IN (
    SELECT "groupId" FROM public."GroupMember"
    WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
  )
);
CREATE POLICY group_teacher_select ON public."Group" FOR SELECT USING ("teacherId" = public.get_current_teacher_id());
CREATE POLICY group_admin_select   ON public."Group" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- GroupMember
ALTER TABLE public."GroupMember" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gm_self_select    ON public."GroupMember";
DROP POLICY IF EXISTS gm_teacher_select ON public."GroupMember";
DROP POLICY IF EXISTS gm_admin_select   ON public."GroupMember";
CREATE POLICY gm_self_select    ON public."GroupMember" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY gm_teacher_select ON public."GroupMember" FOR SELECT USING ("groupId" IN (SELECT id FROM public."Group" WHERE "teacherId" = public.get_current_teacher_id()));
CREATE POLICY gm_admin_select   ON public."GroupMember" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- Lesson
ALTER TABLE public."Lesson" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_student_select ON public."Lesson";
DROP POLICY IF EXISTS lesson_teacher_select ON public."Lesson";
DROP POLICY IF EXISTS lesson_admin_select   ON public."Lesson";
CREATE POLICY lesson_student_select ON public."Lesson" FOR SELECT USING (
  "groupId" IN (
    SELECT "groupId" FROM public."GroupMember"
    WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
  )
);
CREATE POLICY lesson_teacher_select ON public."Lesson" FOR SELECT USING (
  "groupId" IN (SELECT id FROM public."Group" WHERE "teacherId" = public.get_current_teacher_id())
);
CREATE POLICY lesson_admin_select ON public."Lesson" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- Attendance + Grade — student sees own, teacher sees their group, admin all
ALTER TABLE public."Attendance" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS att_self_select    ON public."Attendance";
DROP POLICY IF EXISTS att_teacher_select ON public."Attendance";
DROP POLICY IF EXISTS att_admin_select   ON public."Attendance";
CREATE POLICY att_self_select    ON public."Attendance" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY att_teacher_select ON public."Attendance" FOR SELECT USING (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);
CREATE POLICY att_admin_select   ON public."Attendance" FOR SELECT USING (public.get_current_role() = 'ADMIN');

ALTER TABLE public."Grade" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grade_self_select    ON public."Grade";
DROP POLICY IF EXISTS grade_teacher_select ON public."Grade";
DROP POLICY IF EXISTS grade_admin_select   ON public."Grade";
CREATE POLICY grade_self_select    ON public."Grade" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY grade_teacher_select ON public."Grade" FOR SELECT USING (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);
CREATE POLICY grade_admin_select   ON public."Grade" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- MonthlyMedal + Payout — student own, admin all
ALTER TABLE public."MonthlyMedal" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medal_self_select   ON public."MonthlyMedal";
DROP POLICY IF EXISTS medal_admin_select  ON public."MonthlyMedal";
CREATE POLICY medal_self_select  ON public."MonthlyMedal" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY medal_admin_select ON public."MonthlyMedal" FOR SELECT USING (public.get_current_role() IN ('ADMIN','TUTOR'));

ALTER TABLE public."Payout" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payout_self_select  ON public."Payout";
DROP POLICY IF EXISTS payout_admin_select ON public."Payout";
CREATE POLICY payout_self_select  ON public."Payout" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY payout_admin_select ON public."Payout" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- Homework + Submission
ALTER TABLE public."Homework" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hw_select ON public."Homework";
CREATE POLICY hw_select ON public."Homework" FOR SELECT USING (
  "lessonId" IN (
    SELECT l.id FROM public."Lesson" l
    WHERE l."groupId" IN (
      SELECT "groupId" FROM public."GroupMember"
      WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
    )
  )
  OR public.get_current_role() IN ('ADMIN','TUTOR')
);

ALTER TABLE public."HomeworkSubmission" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hwsub_self_select  ON public."HomeworkSubmission";
DROP POLICY IF EXISTS hwsub_self_modify  ON public."HomeworkSubmission";
DROP POLICY IF EXISTS hwsub_teacher_all  ON public."HomeworkSubmission";
DROP POLICY IF EXISTS hwsub_admin_all    ON public."HomeworkSubmission";
CREATE POLICY hwsub_self_select ON public."HomeworkSubmission" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY hwsub_self_modify ON public."HomeworkSubmission" FOR INSERT WITH CHECK ("studentId" = public.get_current_student_id());
CREATE POLICY hwsub_self_update ON public."HomeworkSubmission" FOR UPDATE USING ("studentId" = public.get_current_student_id());
CREATE POLICY hwsub_teacher_all ON public."HomeworkSubmission" FOR ALL USING (
  public.get_current_role() = 'TUTOR'
  AND "homeworkId" IN (
    SELECT h.id FROM public."Homework" h
    JOIN public."Lesson" l ON l.id = h."lessonId"
    JOIN public."Group" g ON g.id = l."groupId"
    WHERE g."teacherId" = public.get_current_teacher_id()
  )
);
CREATE POLICY hwsub_admin_all ON public."HomeworkSubmission" FOR ALL USING (public.get_current_role() = 'ADMIN');

-- PracticeAttempt — only student writes/reads own; admin reads
ALTER TABLE public."PracticeAttempt" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS practice_self_select ON public."PracticeAttempt";
DROP POLICY IF EXISTS practice_self_insert ON public."PracticeAttempt";
DROP POLICY IF EXISTS practice_admin_select ON public."PracticeAttempt";
CREATE POLICY practice_self_select  ON public."PracticeAttempt" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY practice_self_insert  ON public."PracticeAttempt" FOR INSERT WITH CHECK ("studentId" = public.get_current_student_id());
CREATE POLICY practice_admin_select ON public."PracticeAttempt" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- Material — anyone in a relevant group + admin/teacher
ALTER TABLE public."Material" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS material_select ON public."Material";
CREATE POLICY material_select ON public."Material" FOR SELECT USING (
  "groupId" IS NULL  -- common materials
  OR "groupId" IN (
    SELECT "groupId" FROM public."GroupMember"
    WHERE "studentId" = public.get_current_student_id() AND status = 'ACTIVE'
  )
  OR public.get_current_role() IN ('ADMIN','TUTOR')
);

-- VocabularyEntry — student owns
ALTER TABLE public."VocabularyEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vocab_self_all ON public."VocabularyEntry";
CREATE POLICY vocab_self_all ON public."VocabularyEntry" FOR ALL USING ("studentId" = public.get_current_student_id());

-- Conversation + Message — visible to participants
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conv_participant_select ON public."Conversation";
DROP POLICY IF EXISTS conv_admin_select       ON public."Conversation";
CREATE POLICY conv_participant_select ON public."Conversation" FOR SELECT USING (public.get_current_user_id() = ANY ("participantIds"));
CREATE POLICY conv_admin_select       ON public."Conversation" FOR SELECT USING (public.get_current_role() = 'ADMIN');

ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_participant_select ON public."Message";
DROP POLICY IF EXISTS msg_participant_insert ON public."Message";
DROP POLICY IF EXISTS msg_admin_select       ON public."Message";
CREATE POLICY msg_participant_select ON public."Message" FOR SELECT USING (
  "conversationId" IN (SELECT id FROM public."Conversation" WHERE public.get_current_user_id() = ANY ("participantIds"))
);
CREATE POLICY msg_participant_insert ON public."Message" FOR INSERT WITH CHECK (
  "senderId" = public.get_current_user_id()
  AND "conversationId" IN (SELECT id FROM public."Conversation" WHERE public.get_current_user_id() = ANY ("participantIds"))
);
CREATE POLICY msg_admin_select ON public."Message" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- Notification — user owns
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_self_select ON public."Notification";
DROP POLICY IF EXISTS notif_self_update ON public."Notification";
CREATE POLICY notif_self_select ON public."Notification" FOR SELECT USING ("userId" = public.get_current_user_id());
CREATE POLICY notif_self_update ON public."Notification" FOR UPDATE USING ("userId" = public.get_current_user_id());

-- XpLog — student reads own; admin reads all
ALTER TABLE public."XpLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xp_self_select  ON public."XpLog";
DROP POLICY IF EXISTS xp_admin_select ON public."XpLog";
CREATE POLICY xp_self_select  ON public."XpLog" FOR SELECT USING ("studentId" = public.get_current_student_id());
CREATE POLICY xp_admin_select ON public."XpLog" FOR SELECT USING (public.get_current_role() = 'ADMIN');

-- ============================================================
-- 14. REALTIME PUBLICATION
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public."Notification";
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- DONE.
-- Next: run 002_seed_demo.sql to populate a sample group/lessons.
-- ============================================================
