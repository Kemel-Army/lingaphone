-- ============================================================
-- RLS Fixes: SupportTicket, Message UPDATE, ActivityLog/PlatformSettings
-- ============================================================

-- 1. FIX: SupportTicket — was comparing auth.uid()::text to UUID, always fails
DROP POLICY IF EXISTS "user_manage_own_tickets" ON "SupportTicket";
DROP POLICY IF EXISTS "admin_manage_tickets" ON "SupportTicket";

CREATE POLICY "user_manage_own_tickets" ON "SupportTicket" FOR ALL
  USING ("userId" = public.get_current_user_id())
  WITH CHECK ("userId" = public.get_current_user_id());

CREATE POLICY "admin_manage_tickets" ON "SupportTicket" FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');

-- 2. FIX: Message — missing UPDATE policy (users can't mark messages as read)
CREATE POLICY "participant_update_messages" ON "Message" FOR UPDATE
  USING (
    "conversationId" IN (
      SELECT cp."conversationId" FROM "ConversationParticipant" cp
      WHERE cp."userId" = public.get_current_user_id()
    )
  )
  WITH CHECK (
    "conversationId" IN (
      SELECT cp."conversationId" FROM "ConversationParticipant" cp
      WHERE cp."userId" = public.get_current_user_id()
    )
  );

-- 3. FIX: ActivityLog — inconsistent pattern, use helper functions
DROP POLICY IF EXISTS "admin_read_activity_log" ON "ActivityLog";
DROP POLICY IF EXISTS "service_insert_activity_log" ON "ActivityLog";

CREATE POLICY "admin_read_activity_log" ON "ActivityLog"
  FOR SELECT
  USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "admin_insert_activity_log" ON "ActivityLog"
  FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- 4. FIX: PlatformSettings — inconsistent pattern, use helper functions
DROP POLICY IF EXISTS "admin_read_platform_settings" ON "PlatformSettings";
DROP POLICY IF EXISTS "admin_write_platform_settings" ON "PlatformSettings";

CREATE POLICY "admin_read_platform_settings" ON "PlatformSettings"
  FOR SELECT
  USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "admin_manage_platform_settings" ON "PlatformSettings"
  FOR ALL
  USING (public.get_current_user_role() = 'ADMIN');
