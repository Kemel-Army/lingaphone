-- ============================================================================
-- PARENT LINKS — require explicit student approval (legacy fix-up)
--
-- The earlier migration 20260513154909_parent_hardening_link_approval_and_storage
-- did `UPDATE ParentToStudent SET status='ACTIVE' WHERE status='PENDING'` to
-- avoid breaking legacy seed data. That auto-grandfathered every existing
-- link as ACTIVE — including ones the student had never explicitly approved.
--
-- This migration reverts that grandfather: every link where the student has
-- never responded (`respondedAt IS NULL`) is set back to PENDING. After this
-- runs, parents see the PENDING badge in /parent/children, students get a
-- PARENT_LINK_REQUEST notification, and visibility is gated by the existing
-- get_active_child_ids() helper as designed.
--
-- Idempotent: re-running this is a no-op once respondedAt is filled in by
-- the /api/parent/respond-link-request endpoint.
-- ============================================================================

-- 1. Revert legacy ACTIVE links to PENDING when no explicit response exists.
UPDATE public."ParentToStudent"
SET "status" = 'PENDING'
WHERE "status" = 'ACTIVE'
  AND "respondedAt" IS NULL;

-- 2. Drop a notification on every student who now has at least one PENDING
--    request, so they discover the new /student/parent-requests inbox.
--    De-duplicates by leaving alone students who already have an unread
--    PARENT_LINK_REQUEST notification.
INSERT INTO public."Notification" ("userId", type, title, body, data)
SELECT DISTINCT
  s."userId",
  'PARENT_LINK_REQUEST'::public."NotificationType",
  'Запрос на привязку',
  'Родитель просит подтвердить доступ к вашему профилю.',
  jsonb_build_object('link', '/student/parent-requests')
FROM public."ParentToStudent" ps
JOIN public."Student" s ON s.id = ps."studentId"
WHERE ps."status" = 'PENDING'
  AND NOT EXISTS (
    SELECT 1 FROM public."Notification" n
    WHERE n."userId" = s."userId"
      AND n.type = 'PARENT_LINK_REQUEST'
      AND n."isRead" = false
  );
