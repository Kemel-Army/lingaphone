-- ============================================================================
-- ADMIN GOVERNANCE
--  * audit trigger on User / Payment / PromoCode — auto-logs admin/service
--    changes to ActivityLog (append-only by existing policy set)
--  * last-admin guard — blocks UPDATE/DELETE that would leave 0 ADMINs
--  * unify DiagnosticQuestion admin policy with get_current_user_role()
--  * drop dead Tutor / TutorSubject admin policies
-- ============================================================================

-- 1. Audit logger (writes to ActivityLog)
CREATE OR REPLACE FUNCTION public.audit_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_actor_role text;
  v_actor_user_id uuid;
  v_target_id uuid;
  v_action text;
  v_diff jsonb;
BEGIN
  v_actor_role := (SELECT auth.role());

  -- Skip noise: only audit admin-issued or server-issued mutations.
  IF v_actor_role <> 'service_role' THEN
    IF COALESCE(public.get_current_user_role(), '') <> 'ADMIN' THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    v_actor_user_id := public.get_current_user_id();
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '.INSERT';
    v_target_id := NEW.id;
    v_diff := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '.UPDATE';
    v_target_id := NEW.id;
    v_diff := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after',  to_jsonb(NEW)
    );
  ELSE
    v_action := TG_TABLE_NAME || '.DELETE';
    v_target_id := OLD.id;
    v_diff := to_jsonb(OLD);
  END IF;

  BEGIN
    INSERT INTO public."ActivityLog" ("userId", action, "targetType", "targetId", metadata)
    VALUES (v_actor_user_id, v_action, TG_TABLE_NAME, v_target_id,
            jsonb_build_object('actorRole', v_actor_role, 'diff', v_diff));
  EXCEPTION WHEN OTHERS THEN
    -- never block business operation because of an audit failure
    NULL;
  END;

  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.audit_admin_change() FROM PUBLIC, anon, authenticated;

-- Attach to critical tables. AFTER trigger so original op already happened.
DROP TRIGGER IF EXISTS trg_audit_user        ON public."User";
CREATE TRIGGER trg_audit_user
AFTER INSERT OR UPDATE OR DELETE ON public."User"
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();

DROP TRIGGER IF EXISTS trg_audit_payment     ON public."Payment";
CREATE TRIGGER trg_audit_payment
AFTER INSERT OR UPDATE OR DELETE ON public."Payment"
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();

DROP TRIGGER IF EXISTS trg_audit_promo       ON public."PromoCode";
CREATE TRIGGER trg_audit_promo
AFTER INSERT OR UPDATE OR DELETE ON public."PromoCode"
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();

DROP TRIGGER IF EXISTS trg_audit_subscription ON public."Subscription";
CREATE TRIGGER trg_audit_subscription
AFTER INSERT OR UPDATE OR DELETE ON public."Subscription"
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();

DROP TRIGGER IF EXISTS trg_audit_package     ON public."Package";
CREATE TRIGGER trg_audit_package
AFTER INSERT OR UPDATE OR DELETE ON public."Package"
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();


-- 2. Last-admin guard
CREATE OR REPLACE FUNCTION public.guard_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_remaining int;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role = 'ADMIN' AND NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT COUNT(*) INTO v_remaining FROM public."User"
      WHERE role = 'ADMIN' AND id <> OLD.id;
    IF v_remaining = 0 THEN
      RAISE EXCEPTION 'Cannot demote the last admin'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'ADMIN' THEN
    SELECT COUNT(*) INTO v_remaining FROM public."User"
      WHERE role = 'ADMIN' AND id <> OLD.id;
    IF v_remaining = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last admin'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_last_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_last_admin ON public."User";
CREATE TRIGGER trg_guard_last_admin
BEFORE UPDATE OR DELETE ON public."User"
FOR EACH ROW EXECUTE FUNCTION public.guard_last_admin();


-- 3. Unify DiagnosticQuestion admin policy (was using EXISTS-pattern,
-- everything else uses get_current_user_role()).
DROP POLICY IF EXISTS "admin_manage_diagnostic_questions" ON public."DiagnosticQuestion";
CREATE POLICY "admin_manage_diagnostic_questions" ON public."DiagnosticQuestion"
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'ADMIN')
WITH CHECK (public.get_current_user_role() = 'ADMIN');


-- 4. Drop dead Tutor / TutorSubject policies (tables effectively unused)
DROP POLICY IF EXISTS "admin_manage_tutors" ON public."Tutor";
DROP POLICY IF EXISTS "admin_manage_tutor_subjects" ON public."TutorSubject";
DROP POLICY IF EXISTS "anyone_select_tutors" ON public."Tutor";
DROP POLICY IF EXISTS "tutor_update_own" ON public."Tutor";
DROP POLICY IF EXISTS "anyone_select_tutor_subjects" ON public."TutorSubject";


-- 5. Tighten implicit WITH CHECK on most-touched admin policies for clarity.
-- (semantically equivalent — Postgres falls back to USING when WITH CHECK is
-- omitted on FOR ALL — but having it explicit avoids future confusion.)
DROP POLICY IF EXISTS "admin_manage_payments" ON public."Payment";
CREATE POLICY "admin_manage_payments" ON public."Payment"
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'ADMIN')
WITH CHECK (public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "admin_manage_promos" ON public."PromoCode";
CREATE POLICY "admin_manage_promos" ON public."PromoCode"
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'ADMIN')
WITH CHECK (public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "admin_manage_subscriptions" ON public."Subscription";
CREATE POLICY "admin_manage_subscriptions" ON public."Subscription"
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'ADMIN')
WITH CHECK (public.get_current_user_role() = 'ADMIN');
