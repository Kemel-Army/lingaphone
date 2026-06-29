-- ============================================================================
-- Gamification atomic RPCs — rebuilt against the LIVE lingaphone schema.
--
-- The server endpoints (/api/gamification/award-xp, /shop-purchase,
-- /update-quest-progress) call award_xp_atomic / purchase_shop_item_atomic /
-- tick_quest_progress. Those functions were authored in the legacy migration
-- 20260514210001 against tables that DO NOT exist in this database
-- (XPTransaction, XPActionType). As a result every XP award (reading, grammar,
-- songs, practice, quests) and every shop purchase failed at runtime with a
-- missing-function / missing-relation error — students earned no XP.
--
-- This migration recreates the functions against the tables that actually
-- exist here: XpLog (audit + idempotency, action = "XpActionKind"),
-- StudentGameProfile (xp/level/gems store), GemTransaction, StudentQuest,
-- Quest, ShopItem, StudentInventory. The endpoint code is unchanged.
-- ============================================================================

-- 1. Level lookup. Thresholds match LEVEL_XP_THRESHOLDS in shared/types/common.ts.
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  thresholds integer[] := ARRAY[
       0,    100,    250,    500,    900,   1400,   2000,   2700,   3500,
    4400,   5400,   6500,   7700,   9000,  10400,  11900,  13500,  15200,
   17000,  18900,  20900,  23000,  25200,  27500,  29900,  32400,  35000,
   37700,  40500,  43400,  46400,  49500,  52700,  56000,  59400,  62900,
   66500,  70200,  74000,  77900,  81900,  86000,  90200,  94500,  98900,
  103400, 108000, 112700, 117500, 122400, 127400, 132500, 137700, 143000,
  148400, 153900, 159500, 165200, 171000, 176900, 182900, 189000, 195200,
  201500, 207900, 214400, 221000, 227700, 234500, 241400, 248400, 255500,
  262700, 270000, 277400, 284900, 292500, 300200, 308000, 315900, 323900,
  332000, 340200, 348500, 356900, 365400, 374000, 382700, 391500, 400400,
  409400, 418500, 427700, 437000, 446400, 455900, 465500, 475200, 485000,
  494900
  ];
  i integer;
BEGIN
  FOR i IN REVERSE array_length(thresholds, 1) .. 1 LOOP
    IF p_xp >= thresholds[i] THEN
      RETURN i;
    END IF;
  END LOOP;
  RETURN 1;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_level(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_level(integer) TO authenticated, service_role;

-- 2. award_xp_atomic — idempotent on (studentId, action, refId=sourceId).
--    Audit row goes to XpLog (action is the live "XpActionKind" enum, which
--    already contains every action the endpoint sends). XP/level/gems live in
--    StudentGameProfile. Row lock serializes concurrent awards.
CREATE OR REPLACE FUNCTION public.award_xp_atomic(
  p_student_id  uuid,
  p_action      text,
  p_amount      integer,
  p_source_id   uuid,
  p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_amount integer;
  v_old_xp          integer;
  v_old_level       integer;
  v_new_xp          integer;
  v_new_level       integer;
  v_level_up        boolean := false;
  v_gem_bonus       integer := 0;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive' USING ERRCODE = '22023';
  END IF;

  -- Idempotency: same (student, action, source) cannot be awarded twice.
  SELECT amount INTO v_existing_amount
  FROM public."XpLog"
  WHERE "studentId" = p_student_id
    AND action = p_action::public."XpActionKind"
    AND "refId" = p_source_id::text
  LIMIT 1;

  IF FOUND THEN
    SELECT xp, level INTO v_old_xp, v_old_level
    FROM public."StudentGameProfile"
    WHERE "studentId" = p_student_id;
    RETURN jsonb_build_object(
      'xp',         COALESCE(v_old_xp, 0),
      'level',      COALESCE(v_old_level, 1),
      'levelUp',    false,
      'amount',     v_existing_amount,
      'idempotent', true
    );
  END IF;

  -- Ensure profile exists, then lock it.
  INSERT INTO public."StudentGameProfile" ("studentId")
  VALUES (p_student_id)
  ON CONFLICT ("studentId") DO NOTHING;

  SELECT xp, level
  INTO v_old_xp, v_old_level
  FROM public."StudentGameProfile"
  WHERE "studentId" = p_student_id
  FOR UPDATE;

  v_new_xp    := COALESCE(v_old_xp, 0) + p_amount;
  v_new_level := public.calculate_level(v_new_xp);
  v_level_up  := v_new_level > COALESCE(v_old_level, 1);
  IF v_level_up THEN
    v_gem_bonus := 5 * v_new_level;
  END IF;

  UPDATE public."StudentGameProfile"
  SET xp          = v_new_xp,
      level       = v_new_level,
      gems        = COALESCE(gems, 0) + v_gem_bonus,
      "updatedAt" = now()
  WHERE "studentId" = p_student_id;

  INSERT INTO public."XpLog" ("studentId", action, amount, "refId")
  VALUES (p_student_id, p_action::public."XpActionKind", p_amount, p_source_id::text);

  IF v_level_up THEN
    INSERT INTO public."GemTransaction"
      ("studentId", amount, "sourceType", "sourceId", description)
    VALUES
      (p_student_id, v_gem_bonus, 'LEVEL_UP'::public."GemSourceType",
       p_source_id, format('Уровень %s!', v_new_level));
  END IF;

  RETURN jsonb_build_object(
    'xp',         v_new_xp,
    'level',      v_new_level,
    'levelUp',    v_level_up,
    'amount',     p_amount,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp_atomic(uuid, text, integer, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp_atomic(uuid, text, integer, uuid, text) TO service_role;

-- 3. purchase_shop_item_atomic — server-side price lookup + atomic gem deduct.
CREATE OR REPLACE FUNCTION public.purchase_shop_item_atomic(
  p_student_id   uuid,
  p_shop_item_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item         record;
  v_player_level integer;
  v_current_qty  integer;
  v_new_qty      integer;
  v_new_gems     integer;
  v_effect       jsonb;
BEGIN
  SELECT id, name, price, "maxOwnable", "requiredLevel", effect, "isActive"
  INTO v_item
  FROM public."ShopItem"
  WHERE id = p_shop_item_id;

  IF NOT FOUND OR v_item."isActive" IS NOT TRUE THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT level INTO v_player_level
  FROM public."StudentGameProfile"
  WHERE "studentId" = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_player_level < v_item."requiredLevel" THEN
    RAISE EXCEPTION 'Requires level %', v_item."requiredLevel" USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(quantity, 0) INTO v_current_qty
  FROM public."StudentInventory"
  WHERE "studentId" = p_student_id AND "shopItemId" = p_shop_item_id;
  v_current_qty := COALESCE(v_current_qty, 0);

  IF v_current_qty >= v_item."maxOwnable" THEN
    RAISE EXCEPTION 'Already own maximum quantity' USING ERRCODE = '23514';
  END IF;

  UPDATE public."StudentGameProfile"
  SET gems = gems - v_item.price,
      "updatedAt" = now()
  WHERE "studentId" = p_student_id
    AND gems >= v_item.price
  RETURNING gems INTO v_new_gems;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient gems' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public."GemTransaction"
    ("studentId", amount, "sourceType", "sourceId", description)
  VALUES
    (p_student_id, -v_item.price, 'SHOP_PURCHASE'::public."GemSourceType",
     v_item.id, format('Покупка: %s', v_item.name));

  v_new_qty := v_current_qty + 1;
  INSERT INTO public."StudentInventory" ("studentId", "shopItemId", quantity)
  VALUES (p_student_id, p_shop_item_id, v_new_qty)
  ON CONFLICT ("studentId", "shopItemId")
    DO UPDATE SET quantity = EXCLUDED.quantity;

  v_effect := v_item.effect;
  IF v_effect IS NOT NULL AND v_effect->>'type' = 'streak_freeze' THEN
    UPDATE public."StudentGameProfile"
    SET "streakFreezes" = COALESCE("streakFreezes", 0) + 1
    WHERE "studentId" = p_student_id;
  END IF;

  RETURN jsonb_build_object(
    'gems',     v_new_gems,
    'quantity', v_new_qty,
    'itemId',   v_item.id,
    'itemName', v_item.name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_shop_item_atomic(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item_atomic(uuid, uuid) TO service_role;

-- 4. complete_quest_atomic — marks quest COMPLETED, awards XP + gems once.
CREATE OR REPLACE FUNCTION public.complete_quest_atomic(
  p_student_quest_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sq        record;
  v_quest     record;
  v_action    text;
  v_xp_result jsonb;
BEGIN
  SELECT sq.id, sq."studentId", sq."questId", sq.status
  INTO v_sq
  FROM public."StudentQuest" sq
  WHERE sq.id = p_student_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student quest not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_sq.status = 'COMPLETED' THEN
    RETURN jsonb_build_object('alreadyCompleted', true);
  END IF;

  SELECT id, title, "xpReward", "gemReward", period
  INTO v_quest
  FROM public."Quest"
  WHERE id = v_sq."questId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public."StudentQuest"
  SET status = 'COMPLETED',
      "completedAt" = now()
  WHERE id = p_student_quest_id;

  IF v_quest."xpReward" > 0 THEN
    v_action := CASE WHEN v_quest.period = 'DAILY' THEN 'QUEST_DAILY' ELSE 'QUEST_WEEKLY' END;
    v_xp_result := public.award_xp_atomic(
      v_sq."studentId",
      v_action,
      v_quest."xpReward",
      v_quest.id,
      format('Квест: %s', v_quest.title)
    );
  END IF;

  IF v_quest."gemReward" > 0 THEN
    INSERT INTO public."GemTransaction"
      ("studentId", amount, "sourceType", "sourceId", description)
    SELECT
      v_sq."studentId", v_quest."gemReward", 'QUEST'::public."GemSourceType",
      v_quest.id, format('Квест: %s', v_quest.title)
    WHERE NOT EXISTS (
      SELECT 1 FROM public."GemTransaction"
      WHERE "studentId" = v_sq."studentId"
        AND "sourceType" = 'QUEST'::public."GemSourceType"
        AND "sourceId" = v_quest.id
    );

    UPDATE public."StudentGameProfile"
    SET gems = gems + v_quest."gemReward",
        "updatedAt" = now()
    WHERE "studentId" = v_sq."studentId";
  END IF;

  RETURN jsonb_build_object(
    'alreadyCompleted', false,
    'xpAwarded',        COALESCE(v_quest."xpReward", 0),
    'gemsAwarded',      COALESCE(v_quest."gemReward", 0),
    'xpResult',         v_xp_result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_quest_atomic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest_atomic(uuid) TO service_role;

-- 5. tick_quest_progress — arithmetic progress bump + completion in one tx.
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
  v_now           timestamptz := now();
  v_row           record;
  v_new_progress  integer;
  v_completed_ids uuid[] := ARRAY[]::uuid[];
  v_updated_ids   uuid[] := ARRAY[]::uuid[];
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
