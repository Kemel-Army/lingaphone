-- Migration: Add TEACHER role to UserRole enum
-- Teacher accounts (teacher@linga.kz) need their own role separate from ADMIN/STUDENT

BEGIN;

-- PostgreSQL doesn't support removing enum values, but does support adding them.
-- Add TEACHER to the existing enum.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TEACHER';

-- Refresh JWT hook so TEACHER role flows through JWT claims.
-- (No body change needed – this re-registers in case of future cache invalidation.)
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
