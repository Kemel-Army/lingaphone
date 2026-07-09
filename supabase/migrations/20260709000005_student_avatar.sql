-- ══════════════════════════════════════════════════════════════════
-- Аватар ученика (ТЗ разд. 5) — конфиг надетых предметов + купленные.
-- Персонаж рисуется на фронте (SVG/CSS, без Rive-ассета). Каталог
-- предметов — в коде (shared/lib/avatarCatalog). Покупки списывают
-- Linga Coins через серверный роут (атомарно, service role).
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE "StudentAvatar" (
  "studentId" UUID PRIMARY KEY REFERENCES "Student" ("id") ON DELETE CASCADE,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "owned" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER "StudentAvatar_set_updated_at" BEFORE UPDATE ON "StudentAvatar"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE "StudentAvatar" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatar_admin_all" ON "StudentAvatar" FOR ALL
  USING (public.get_current_role() = 'ADMIN')
  WITH CHECK (public.get_current_role() = 'ADMIN');

-- Ученик — полный доступ к своей строке (создать/надеть предмет).
CREATE POLICY "avatar_student_own" ON "StudentAvatar" FOR ALL
  USING (public.get_current_role() = 'STUDENT'
    AND "studentId" = public.get_current_student_id())
  WITH CHECK (public.get_current_role() = 'STUDENT'
    AND "studentId" = public.get_current_student_id());

-- Родитель — читать аватар своих детей.
CREATE POLICY "avatar_parent_read" ON "StudentAvatar" FOR SELECT
  USING (public.get_current_role() = 'PARENT'
    AND "studentId" IN (SELECT public.get_current_parent_student_ids()));
