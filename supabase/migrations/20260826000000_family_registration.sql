-- Family self-registration: parent(s) + child(ren) sign up together, land in
-- PENDING state, and only gain access once an admin approves the whole batch.

BEGIN;

-- 1. New UserStatus values. Existing rows are unaffected (default stays 'ACTIVE').
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- 2. Group every account created by one registration submission so admin can
--    approve/reject the whole family in one action.
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "registrationBatchId" uuid;

CREATE INDEX IF NOT EXISTS "User_registrationBatchId_idx"
  ON public."User" ("registrationBatchId")
  WHERE "registrationBatchId" IS NOT NULL;

-- 3. Fields collected on the family registration form that Student didn't
--    have yet (school name, age — separate from the precise `birthdate`).
ALTER TABLE public."Student"
  ADD COLUMN IF NOT EXISTS "schoolName" text,
  ADD COLUMN IF NOT EXISTS "age" integer;

-- 4. ParentToStudent link status (idempotent — may already exist from
--    20260513154909_parent_hardening_link_approval_and_storage.sql, but this
--    migration must not assume that ran against this environment).
ALTER TABLE public."ParentToStudent"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ParentToStudent_status_check'
  ) THEN
    ALTER TABLE public."ParentToStudent"
      ADD CONSTRAINT "ParentToStudent_status_check" CHECK ("status" IN ('PENDING', 'ACTIVE'));
  END IF;
END $$;

ALTER TABLE public."ParentToStudent"
  ADD COLUMN IF NOT EXISTS "respondedAt" timestamptz;

-- 5. JWT hook — expose account status so the client can gate a PENDING/REJECTED
--    account before it ever reaches a role-scoped page.
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
  v_status text;
BEGIN
  SELECT u.id, u.role::text, u.name, u.surname, u.status::text
  INTO v_user_id, v_role, v_name, v_surname, v_status
  FROM public."User" u
  WHERE u.email = (event->'claims'->>'email');

  RETURN jsonb_build_object('claims',
    (event->'claims') || jsonb_build_object(
      'user_id',      v_user_id,
      'user_role',    v_role,
      'user_name',    v_name,
      'user_surname', v_surname,
      'user_status',  v_status
    )
  );
END;
$$;

COMMIT;
