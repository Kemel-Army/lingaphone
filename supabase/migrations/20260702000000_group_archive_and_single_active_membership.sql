-- Group archiving (soft-close) + "one active group per student" guarantee.
--
-- Goals:
--  1. Admin can archive a group instead of deleting it. Students stay in the
--     system (their GroupMember rows are preserved), the group just becomes
--     hidden from active lists. The student UI shows it as "группа закрылась".
--  2. A student can be an ACTIVE member of at most ONE non-archived group.
--     (Previously the same student could be added to unlimited groups.)

-- ── 1. Archive flag on Group ────────────────────────────────────────────────
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz;

-- ── 2. Clean up existing violations before enforcing the rule ────────────────
-- Some students are currently ACTIVE in several groups. Keep the earliest
-- membership, mark the rest as LEFT (rows preserved, students untouched).
WITH ranked AS (
  SELECT gm."groupId",
         gm."studentId",
         row_number() OVER (
           PARTITION BY gm."studentId"
           ORDER BY gm."joinedAt" ASC
         ) AS rn
  FROM "GroupMember" gm
  JOIN "Group" g ON g."id" = gm."groupId"
  WHERE gm."status" = 'ACTIVE'
    AND g."archivedAt" IS NULL
)
UPDATE "GroupMember" gm
SET "status" = 'LEFT'
FROM ranked r
WHERE gm."groupId" = r."groupId"
  AND gm."studentId" = r."studentId"
  AND r.rn > 1
  AND gm."status" = 'ACTIVE';

-- ── 3. Enforce single active (non-archived) group per student ────────────────
-- A partial unique index can't join to Group.archivedAt, so use a trigger.
CREATE OR REPLACE FUNCTION public.enforce_single_active_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW."status" = 'ACTIVE' THEN
    IF EXISTS (
      SELECT 1
      FROM public."GroupMember" gm
      JOIN public."Group" g ON g."id" = gm."groupId"
      WHERE gm."studentId" = NEW."studentId"
        AND gm."status" = 'ACTIVE'
        AND g."archivedAt" IS NULL
        AND gm."groupId" <> NEW."groupId"
    ) THEN
      RAISE EXCEPTION 'Ученик уже состоит в активной группе'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_single_active_group ON public."GroupMember";
CREATE TRIGGER trg_single_active_group
  BEFORE INSERT OR UPDATE ON public."GroupMember"
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_active_group();
