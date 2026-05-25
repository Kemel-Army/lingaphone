-- ============================================================
-- Phase 3: Tutor Catalog + Schedule + Verification fixes
-- ============================================================

-- 1. Add isPublished to Tutor (code expects it for catalog filtering)
ALTER TABLE "Tutor"
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- Set already-approved tutors as published
UPDATE "Tutor"
SET "isPublished" = true
WHERE "verificationStatus" = 'APPROVED';

-- Index for catalog queries
CREATE INDEX IF NOT EXISTS "Tutor_isPublished_idx" ON "Tutor" ("isPublished") WHERE "isPublished" = true;

-- 2. Add status to Earning (PENDING / PAID)
ALTER TABLE "Earning"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';

-- Mark paid ones where paidAt is set
UPDATE "Earning"
SET "status" = 'PAID'
WHERE "paidAt" IS NOT NULL;

-- 3. Create update_tutor_rating RPC function
-- Recalculates rating & reviewCount from approved reviews
CREATE OR REPLACE FUNCTION update_tutor_rating(p_tutor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg DOUBLE PRECISION;
  v_count INTEGER;
BEGIN
  SELECT COALESCE(AVG(r."rating"), 0), COUNT(*)
  INTO v_avg, v_count
  FROM "Review" r
  WHERE r."tutorId" = p_tutor_id
    AND r."isApproved" = true;

  UPDATE "Tutor"
  SET "rating" = ROUND(v_avg::numeric, 2),
      "reviewCount" = v_count,
      "updatedAt" = now()
  WHERE "id" = p_tutor_id;
END;
$$;

-- 4. Add unique constraint for one review per author per tutor
CREATE UNIQUE INDEX IF NOT EXISTS "Review_author_tutor_unique"
  ON "Review" ("authorUserId", "tutorId");
