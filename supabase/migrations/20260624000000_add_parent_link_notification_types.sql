-- ============================================================================
-- Extend NotificationType enum with parent-link events.
-- Must run in its own migration: Postgres requires new enum values to be
-- committed before they can appear in subsequent DML (the next migration
-- inserts rows whose type column uses these new labels).
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'NotificationType' AND e.enumlabel = 'PARENT_LINK_REQUEST'
  ) THEN
    ALTER TYPE public."NotificationType" ADD VALUE 'PARENT_LINK_REQUEST';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'NotificationType' AND e.enumlabel = 'PARENT_LINK_REMOVED'
  ) THEN
    ALTER TYPE public."NotificationType" ADD VALUE 'PARENT_LINK_REMOVED';
  END IF;
END $$;
