-- ============================================================
-- LINGAFON — JWT hook v2: also return user_id claim
-- Run AFTER 001_core_schema.sql (no dependencies, but logical order).
-- ============================================================
--
-- After running this, the hook is already enabled in Dashboard from bootstrap.
-- Existing sessions need to log out + back in to pick up new claims.
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_role       TEXT;
  v_name       TEXT;
  v_surname    TEXT;
BEGIN
  SELECT u.id, u.role, u.name, u.surname
    INTO v_user_id, v_role, v_name, v_surname
    FROM public."User" u
   WHERE u."authId" = (event->'claims'->>'sub');

  IF v_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'claims', (event->'claims') || jsonb_build_object(
        'user_id',      v_user_id::text,
        'user_role',    v_role,
        'user_name',    v_name,
        'user_surname', v_surname
      )
    );
  END IF;

  RETURN event;
END;
$$;

-- Grants already in place from bootstrap, but re-assert for safety
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;
