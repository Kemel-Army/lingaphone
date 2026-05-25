-- ============================================================
-- LINGAPHONE — Minimum schema for authentication
-- Run this in Supabase SQL Editor of the lingaphone project
-- (https://owiaccgxbejsgtyhhtrd.supabase.co/project/_/sql)
-- ============================================================

-- ============================================================
-- 1. Enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'TUTOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. User table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "authId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "surname" TEXT NOT NULL,
  "phone" TEXT,
  "avatarUrl" TEXT,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "User_authId_idx" ON public."User" ("authId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON public."User" ("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON public."User" ("role");

-- ============================================================
-- 3. Auto-update updatedAt trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_updated_at ON public."User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 4. JWT custom claims hook
--    Injects user_role / user_name / user_surname into JWT
--    AFTER running this, enable the hook in:
--    Dashboard → Authentication → Hooks → Customize Access Token
--    and point it at public.custom_access_token_hook
-- ============================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
  v_surname text;
BEGIN
  SELECT u.role, u.name, u.surname
    INTO v_role, v_name, v_surname
    FROM public."User" u
   WHERE u."authId" = (event->'claims'->>'sub');

  IF v_role IS NOT NULL THEN
    RETURN jsonb_build_object(
      'claims', (event->'claims') || jsonb_build_object(
        'user_role', v_role,
        'user_name', v_name,
        'user_surname', v_surname
      )
    );
  END IF;

  RETURN event;
END;
$$;

-- Grants required so supabase_auth_admin can call the hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT SELECT ON TABLE public."User" TO supabase_auth_admin;

-- Hide the hook from regular clients
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- ============================================================
-- 5. RLS on User — minimum policies (own row read/update)
-- ============================================================
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_own" ON public."User";
CREATE POLICY "user_select_own" ON public."User" FOR SELECT
  USING ("authId" = auth.uid()::text);

DROP POLICY IF EXISTS "user_update_own" ON public."User";
CREATE POLICY "user_update_own" ON public."User" FOR UPDATE
  USING ("authId" = auth.uid()::text)
  WITH CHECK ("authId" = auth.uid()::text);

-- ============================================================
-- DONE.
--
-- Next steps (manual, in Supabase Dashboard):
--
-- A) Enable the JWT hook:
--    Authentication → Hooks → "Customize Access Token (JWT) Claims"
--    → Enable → Schema: public → Function: custom_access_token_hook
--
-- B) Create a test user:
--    Authentication → Users → "Add user" → Create new user
--    (set email + password, confirm email automatically)
--    Copy the resulting User UID.
--
-- C) Insert a matching row in public."User":
--
--    INSERT INTO public."User" ("authId", email, name, surname, role)
--    VALUES (
--      '<paste-auth-uid-here>',
--      'test@lingaphone.kz',
--      'Test',
--      'User',
--      'ADMIN'
--    );
--
-- D) Log out / log back in so the new JWT claims load.
-- ============================================================
