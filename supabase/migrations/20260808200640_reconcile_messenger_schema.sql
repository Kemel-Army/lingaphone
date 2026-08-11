-- Приводит схему мессенджера в миграциях к тому, что реально живёт в проде.
--
-- Расхождение (ревью 2026-08-11): таблицы Conversation/Message правили прямо
-- через дашборд Supabase, минуя миграции, поэтому миграционная схема и прод
-- разошлись:
--
--   миграции (20260309000000_initial_schema.sql)   прод
--   -------------------------------------------   -----------------------------
--   Conversation.type TEXT                        Conversation.kind ConversationKind
--   Conversation.lastMessageAt                    Conversation.groupId  -> Group.id
--   таблица ConversationParticipant               Conversation.participantIds UUID[]
--   Message.content / fileUrls / isRead           Message.body / attachments / readBy
--
-- Из-за этого 20260808200656_backfill_group_conversations.sql (INSERT в
-- kind/groupId/participantIds) падал на чистой БД — то есть `pnpm db:reset`
-- и поднятие нового окружения были сломаны.
--
-- Миграция идемпотентна и на проде выполняется как no-op: все определения
-- сверены с живой БД (information_schema + pg_policies, 2026-08-11).
-- Номер намеренно раньше 20260808200656, чтобы бэкфилл групповых чатов
-- выполнялся уже по правильной схеме.

-- ── Conversation ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationKind') THEN
    CREATE TYPE "ConversationKind" AS ENUM ('DIRECT', 'GROUP');
  END IF;
END $$;

ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "kind" "ConversationKind" NOT NULL DEFAULT 'DIRECT',
  ADD COLUMN IF NOT EXISTS "groupId" UUID REFERENCES "Group" ("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "participantIds" UUID[] NOT NULL;

DROP INDEX IF EXISTS "Conversation_lastMessageAt_idx";
ALTER TABLE "Conversation"
  DROP COLUMN IF EXISTS "type",
  DROP COLUMN IF EXISTS "lastMessageAt";

CREATE INDEX IF NOT EXISTS "Conversation_groupId_idx" ON "Conversation" ("groupId");
CREATE INDEX IF NOT EXISTS "Conversation_participantIds_idx"
  ON "Conversation" USING GIN ("participantIds");

-- ── Message ─────────────────────────────────────────────────────────────────

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "body" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "attachments" JSONB,
  ADD COLUMN IF NOT EXISTS "readBy" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

ALTER TABLE "Message"
  DROP COLUMN IF EXISTS "content",
  DROP COLUMN IF EXISTS "fileUrls",
  DROP COLUMN IF EXISTS "isRead";

-- ── ConversationParticipant: в проде таблицы нет, участники живут в массиве ──

DROP TABLE IF EXISTS "ConversationParticipant" CASCADE;

-- ── RLS ─────────────────────────────────────────────────────────────────────
--
-- Политики из 20260309182051 / 20260513110959 ссылались на снесённую таблицу
-- и в проде давно заменены на participantIds-версии с другими именами.
-- Сносим старые имена и воссоздаём ровно то, что стоит на проде.

DROP POLICY IF EXISTS "participant_select_conversations" ON "Conversation";
DROP POLICY IF EXISTS "admin_manage_conversations" ON "Conversation";
DROP POLICY IF EXISTS "participant_select_messages" ON "Message";
DROP POLICY IF EXISTS "user_insert_own_messages" ON "Message";
DROP POLICY IF EXISTS "admin_manage_messages" ON "Message";
DROP POLICY IF EXISTS "sender_update_own_message_content" ON "Message";
DROP POLICY IF EXISTS "participant_mark_message_read" ON "Message";

DROP POLICY IF EXISTS "conv_participant_select" ON "Conversation";
CREATE POLICY "conv_participant_select" ON "Conversation" FOR SELECT
  USING (public.get_current_user_id() = ANY ("participantIds"));

DROP POLICY IF EXISTS "conv_admin_select" ON "Conversation";
CREATE POLICY "conv_admin_select" ON "Conversation" FOR SELECT
  USING (public.get_current_role() = 'ADMIN'::"UserRole");

DROP POLICY IF EXISTS "msg_participant_select" ON "Message";
CREATE POLICY "msg_participant_select" ON "Message" FOR SELECT
  USING (
    "conversationId" IN (
      SELECT c."id" FROM "Conversation" c
      WHERE public.get_current_user_id() = ANY (c."participantIds")
    )
  );

-- Отправитель обязан быть собой И участником беседы.
DROP POLICY IF EXISTS "msg_participant_insert" ON "Message";
CREATE POLICY "msg_participant_insert" ON "Message" FOR INSERT
  WITH CHECK (
    "senderId" = public.get_current_user_id()
    AND "conversationId" IN (
      SELECT c."id" FROM "Conversation" c
      WHERE public.get_current_user_id() = ANY (c."participantIds")
    )
  );

DROP POLICY IF EXISTS "msg_admin_select" ON "Message";
CREATE POLICY "msg_admin_select" ON "Message" FOR SELECT
  USING (public.get_current_role() = 'ADMIN'::"UserRole");
