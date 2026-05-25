-- ============================================================================
-- Lock the new atomic RPCs to service_role only.
--
-- Supabase's default privilege model grants EXECUTE on every new function in
-- the public schema to both `anon` and `authenticated`. Without an explicit
-- REVOKE, any logged-in user could POST /rest/v1/rpc/award_xp_atomic with
-- arbitrary studentId/action/amount/sourceId and bypass the server-side
-- safeguards (XP_REWARDS clamping, auth-based studentId resolution, internal
-- token check) that the /api/gamification/* handlers enforce.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION
  public.award_xp_atomic(uuid, text, integer, uuid, text)
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION
  public.purchase_shop_item_atomic(uuid, uuid)
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION
  public.complete_quest_atomic(uuid)
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION
  public.tick_quest_progress(uuid, text, integer)
FROM anon, authenticated;

-- calculate_level is pure math; safe to leave callable by authenticated but
-- still revoke from anon for tidy posture.
REVOKE EXECUTE ON FUNCTION public.calculate_level(integer) FROM anon;
