-- ============================================================================
-- tick_quest_progress
--
-- update-quest-progress.post.ts currently does read-then-write on
-- StudentQuest.progress for every active quest of the given type. Two
-- parallel calls (e.g. parallel award-xp triggers from a flurry of correct
-- answers) can both read progress=5 and both write 10 — the second
-- increment is lost. On the boundary where the cap is reached, both can
-- also fire complete_quest_atomic at the same time; the inner award
-- functions are idempotent, but the quest "completed" notification fires
-- twice anyway.
--
-- This RPC moves the entire flow into a single function: arithmetic
-- progress update + completion check + reward awards via the existing
-- complete_quest_atomic helper. Returns updated and completed rows so the
-- caller can keep its public response shape.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.tick_quest_progress(
  p_student_id uuid,
  p_quest_type text,
  p_increment  integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now             timestamptz := now();
  v_row             record;
  v_new_progress    integer;
  v_completed_ids   uuid[]      := ARRAY[]::uuid[];
  v_updated_ids     uuid[]      := ARRAY[]::uuid[];
BEGIN
  IF p_increment IS NULL OR p_increment <= 0 THEN
    RAISE EXCEPTION 'increment must be positive' USING ERRCODE = '22023';
  END IF;

  FOR v_row IN
    SELECT sq.id, sq.progress, sq.target, sq.status
    FROM public."StudentQuest" sq
    JOIN public."Quest" q ON q.id = sq."questId"
    WHERE sq."studentId" = p_student_id
      AND sq.status = 'ACTIVE'
      AND sq."expiresAt" > v_now
      AND q.type = p_quest_type::public."QuestType"
    FOR UPDATE OF sq
  LOOP
    v_new_progress := LEAST(v_row.progress + p_increment, v_row.target);

    UPDATE public."StudentQuest"
    SET progress = v_new_progress
    WHERE id = v_row.id;

    IF v_new_progress >= v_row.target THEN
      v_completed_ids := array_append(v_completed_ids, v_row.id);
    ELSE
      v_updated_ids := array_append(v_updated_ids, v_row.id);
    END IF;
  END LOOP;

  -- Awards happen via complete_quest_atomic so the XP / gem accounting goes
  -- through the same idempotent path the rest of the system uses.
  IF array_length(v_completed_ids, 1) > 0 THEN
    PERFORM public.complete_quest_atomic(qid) FROM unnest(v_completed_ids) qid;
  END IF;

  RETURN jsonb_build_object(
    'updatedIds',   to_jsonb(v_updated_ids),
    'completedIds', to_jsonb(v_completed_ids)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.tick_quest_progress(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tick_quest_progress(uuid, text, integer) TO service_role;
