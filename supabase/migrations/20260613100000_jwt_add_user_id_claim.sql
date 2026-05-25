-- ============================================================
-- Add internal User.id to JWT custom claims
-- This allows frontend to use internal DB user ID directly
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
  SELECT u."id", u.role, u.name, u.surname
    INTO v_user_id, v_role, v_name, v_surname
    FROM public."User" u
   WHERE u."authId" = (event->'claims'->>'sub');

  IF v_role IS NOT NULL THEN
    RETURN jsonb_build_object(
      'claims', (event->'claims') || jsonb_build_object(
        'user_id', v_user_id,
        'user_role', v_role,
        'user_name', v_name,
        'user_surname', v_surname
      )
    );
  END IF;

  RETURN event;
END;
$$;

-- ============================================================
-- Allow authenticated users to create conversations
-- ============================================================

CREATE POLICY "authenticated_insert_conversations" ON "Conversation" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- Allow users to add participants (themselves + others) to conversations they created
-- ============================================================

CREATE POLICY "authenticated_insert_participants" ON "ConversationParticipant" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
