-- Revoke EXECUTE on internal trigger functions — they are invoked by the
-- trigger system, not by clients, so exposing them via /rest/v1/rpc is noise.

REVOKE EXECUTE ON FUNCTION public.enforce_service_role_only() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_progress_writer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_game_profile_writer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_student_model_writer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_homework_submission_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_test_attempt_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_diagnostic_result_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_message_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_ai_message_role() FROM PUBLIC, anon, authenticated;

-- Also catch leftover warning from earlier audit
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='set_updated_at') THEN
    EXECUTE 'ALTER FUNCTION public.set_updated_at() SET search_path = ''public''';
  END IF;
END $$;
