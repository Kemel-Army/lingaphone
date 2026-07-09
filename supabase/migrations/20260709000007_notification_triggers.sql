-- ══════════════════════════════════════════════════════════════════
-- Автотриггеры уведомлений (ТЗ разд. 16) — событийные:
--   • пропуск занятия (Attendance ABSENT)   → ученик + родители
--   • новое домашнее задание (Homework)      → ученики группы + родители
-- Реализованы на уровне БД (SECURITY DEFINER), чтобы срабатывать
-- автоматически при любой записи, без изменения клиентского кода.
-- Время-зависимые (оплата, низкая успеваемость) — в Nitro-задаче.
-- ══════════════════════════════════════════════════════════════════

-- ─── Пропуск занятия ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_lesson_missed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
  v_topic text;
  v_when text;
BEGIN
  -- Только переход в ABSENT (не повторно).
  IF NEW."status" <> 'ABSENT' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD."status" = 'ABSENT' THEN
    RETURN NEW;
  END IF;

  SELECT s."userId" INTO v_user FROM "Student" s WHERE s."id" = NEW."studentId";
  SELECT l."topic", to_char(l."startsAt", 'DD.MM') INTO v_topic, v_when
  FROM "Lesson" l WHERE l."id" = NEW."lessonId";

  -- Ученику.
  IF v_user IS NOT NULL THEN
    INSERT INTO "Notification" ("userId", "type", "title", "body")
    VALUES (v_user, 'LESSON_MISSED', 'Пропуск занятия',
      coalesce(v_topic, 'Урок') || coalesce(' · ' || v_when, ''));
  END IF;

  -- Родителям.
  INSERT INTO "Notification" ("userId", "type", "title", "body")
  SELECT p."userId", 'LESSON_MISSED', 'Ребёнок пропустил занятие',
    coalesce(v_topic, 'Урок') || coalesce(' · ' || v_when, '')
  FROM "ParentToStudent" ps
  JOIN "Parent" p ON p."id" = ps."parentId"
  WHERE ps."studentId" = NEW."studentId";

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS "attendance_notify_missed" ON "Attendance";
CREATE TRIGGER "attendance_notify_missed"
  AFTER INSERT OR UPDATE OF "status" ON "Attendance"
  FOR EACH ROW EXECUTE FUNCTION public.notify_lesson_missed();

-- ─── Новое домашнее задание ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_homework_new()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group uuid;
BEGIN
  SELECT l."groupId" INTO v_group FROM "Lesson" l WHERE l."id" = NEW."lessonId";
  IF v_group IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ученикам группы.
  INSERT INTO "Notification" ("userId", "type", "title", "body")
  SELECT s."userId", 'HOMEWORK_NEW'::"NotificationType", 'Новое домашнее задание', NEW."title"
  FROM "GroupMember" gm
  JOIN "Student" s ON s."id" = gm."studentId"
  WHERE gm."groupId" = v_group AND gm."status" = 'ACTIVE';

  -- Родителям учеников группы.
  INSERT INTO "Notification" ("userId", "type", "title", "body")
  SELECT DISTINCT p."userId", 'HOMEWORK_NEW'::"NotificationType", 'Новое ДЗ у ребёнка', NEW."title"
  FROM "GroupMember" gm
  JOIN "ParentToStudent" ps ON ps."studentId" = gm."studentId"
  JOIN "Parent" p ON p."id" = ps."parentId"
  WHERE gm."groupId" = v_group AND gm."status" = 'ACTIVE';

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS "homework_notify_new" ON "Homework";
CREATE TRIGGER "homework_notify_new"
  AFTER INSERT ON "Homework"
  FOR EACH ROW EXECUTE FUNCTION public.notify_homework_new();
