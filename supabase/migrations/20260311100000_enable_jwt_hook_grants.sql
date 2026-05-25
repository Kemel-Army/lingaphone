-- ============================================================
-- Grant permissions for custom_access_token_hook
-- The supabase_auth_admin role needs to execute the hook
-- and read the User table to populate JWT claims.
-- ============================================================

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

GRANT SELECT ON TABLE public."User" TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon;
