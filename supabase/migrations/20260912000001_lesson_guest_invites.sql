-- ════════════════════════════════════════════════════════════════════════════
-- Гостевой доступ к онлайн-уроку по ссылке БЕЗ регистрации.
--
-- Зачем: пробные уроки и клиенты, которые не хотят заводить аккаунт. Ссылка
-- одноразовая/ограниченная по времени — постоянный доступ в платформу так
-- не выдаётся.
--
-- Токен резолвится server-side (service role), поэтому анонимного RLS-доступа
-- к таблице нет вообще: anon её не читает.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."LessonGuestInvite" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE,
  "lessonId"  UUID NOT NULL REFERENCES public."Lesson"(id) ON DELETE CASCADE,
  "guestName" TEXT,
  "leadId"    UUID REFERENCES public."Lead"(id) ON DELETE SET NULL,
  "maxUses"   SMALLINT NOT NULL DEFAULT 5 CHECK ("maxUses" > 0),
  "usedCount" SMALLINT NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createdBy" UUID REFERENCES public."User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastUsedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "LessonGuestInvite_lessonId_idx"
  ON public."LessonGuestInvite" ("lessonId");

ALTER TABLE public."LessonGuestInvite" ENABLE ROW LEVEL SECURITY;

-- Учитель: приглашения на свои уроки.
DROP POLICY IF EXISTS lgi_teacher_all ON public."LessonGuestInvite";
CREATE POLICY lgi_teacher_all ON public."LessonGuestInvite" FOR ALL
  USING (
    public.get_current_role() = 'TEACHER'::public."UserRole"
    AND "lessonId" = ANY (public.get_current_teacher_lesson_ids())
  )
  WITH CHECK (
    public.get_current_role() = 'TEACHER'::public."UserRole"
    AND "lessonId" = ANY (public.get_current_teacher_lesson_ids())
  );

DROP POLICY IF EXISTS lgi_admin_all ON public."LessonGuestInvite";
CREATE POLICY lgi_admin_all ON public."LessonGuestInvite" FOR ALL
  USING (public.get_current_role() IN ('ADMIN'::public."UserRole", 'DIRECTOR'::public."UserRole"))
  WITH CHECK (public.get_current_role() IN ('ADMIN'::public."UserRole", 'DIRECTOR'::public."UserRole"));

GRANT SELECT, INSERT, UPDATE, DELETE ON public."LessonGuestInvite" TO authenticated;
-- anon НЕ получает грантов: токен проверяет только server route с service role.
