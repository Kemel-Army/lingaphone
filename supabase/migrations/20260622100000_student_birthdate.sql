-- Migration: Add birthdate to Student
-- Reason: diagnostics flow asks for child's age (computed from birthdate)
-- to pick an initial difficulty grade automatically. Stored as DATE so
-- the age stays correct as time passes.

BEGIN;

ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "birthdate" DATE;

-- Helper view: computed age in completed years.
-- (Read-only, no policy needed beyond underlying Student RLS.)
CREATE OR REPLACE FUNCTION public.student_age(birth date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN birth IS NULL THEN NULL
    ELSE date_part('year', age(birth))::int
  END;
$$;

COMMIT;
