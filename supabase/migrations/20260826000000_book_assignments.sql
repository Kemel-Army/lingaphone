-- ═══════════════════════════════════════════════════════════════════
-- Book assignments — teacher-controlled access to «Мой путь» books.
--
-- Previously a student's book was resolved purely by Book.trackKey ==
-- Student.level with no explicit assignment: every student on a level
-- automatically got that level's published book. This introduces an
-- explicit assignment layer so a teacher decides who sees which book:
--
--   1. Group.bookId       — default book for the whole group.
--   2. StudentBook        — per-student override (NULL = inherit from group).
--
-- Resolution order (see server/api/student/my-path.get.ts):
--   StudentBook.bookId → Group.bookId (via active GroupMember) → null.
-- Only isPublished books are ever surfaced to students (existing
-- book_select_published-style gating), same posture as before.
-- ═══════════════════════════════════════════════════════════════════

-- ── Group: default book for the group ────────────────────────────
ALTER TABLE public."Group" ADD COLUMN IF NOT EXISTS "bookId" UUID
  REFERENCES "Book"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_group_book ON public."Group"("bookId");

-- ── StudentBook: per-student override ────────────────────────────
CREATE TABLE IF NOT EXISTS public."StudentBook" (
  "studentId"           UUID PRIMARY KEY REFERENCES public."Student"(id) ON DELETE CASCADE,
  "bookId"              UUID NOT NULL REFERENCES "Book"(id) ON DELETE CASCADE,
  "assignedByTeacherId" UUID REFERENCES public."Teacher"(id) ON DELETE SET NULL,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studentbook_book ON public."StudentBook"("bookId");

-- Reuses the already-hardened public.set_updated_at() (search_path pinned,
-- see 20260709000001_harden_set_updated_at.sql) — do not redefine it here.
DROP TRIGGER IF EXISTS trg_studentbook_updated_at ON public."StudentBook";
CREATE TRIGGER trg_studentbook_updated_at
  BEFORE UPDATE ON public."StudentBook"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE public."StudentBook" ENABLE ROW LEVEL SECURITY;

-- Student reads their own override.
CREATE POLICY "studentbook_student_select" ON public."StudentBook" FOR SELECT
  USING ("studentId" = public.get_current_student_id());

-- Teacher reads overrides for students in their own groups.
CREATE POLICY "studentbook_teacher_select" ON public."StudentBook" FOR SELECT
  USING (
    public.get_current_role() = 'TEACHER'
    AND "studentId" IN (
      SELECT gm."studentId" FROM public."GroupMember" gm
      JOIN public."Group" g ON g.id = gm."groupId"
      WHERE g."teacherId" = public.get_current_teacher_id() AND gm.status = 'ACTIVE'
    )
  );

-- Admin reads everything.
CREATE POLICY "studentbook_admin_select" ON public."StudentBook" FOR SELECT
  USING (public.get_current_role() = 'ADMIN');

-- Writes go through server routes on the service-role key (bypasses RLS),
-- same posture as Book/Module — no client-side INSERT/UPDATE policy needed.
