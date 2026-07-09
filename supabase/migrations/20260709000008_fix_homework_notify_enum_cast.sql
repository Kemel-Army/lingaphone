-- Фикс: в notify_homework_new() литерал 'HOMEWORK_NEW' в SELECT DISTINCT
-- резолвился в text и не кастился неявно в enum NotificationType.
-- Явный каст ::"NotificationType".
CREATE OR REPLACE FUNCTION public.notify_homework_new()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group uuid;
BEGIN
  SELECT l."groupId" INTO v_group FROM "Lesson" l WHERE l."id" = NEW."lessonId";
  IF v_group IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO "Notification" ("userId", "type", "title", "body")
  SELECT s."userId", 'HOMEWORK_NEW'::"NotificationType", 'Новое домашнее задание', NEW."title"
  FROM "GroupMember" gm
  JOIN "Student" s ON s."id" = gm."studentId"
  WHERE gm."groupId" = v_group AND gm."status" = 'ACTIVE';

  INSERT INTO "Notification" ("userId", "type", "title", "body")
  SELECT DISTINCT p."userId", 'HOMEWORK_NEW'::"NotificationType", 'Новое ДЗ у ребёнка', NEW."title"
  FROM "GroupMember" gm
  JOIN "ParentToStudent" ps ON ps."studentId" = gm."studentId"
  JOIN "Parent" p ON p."id" = ps."parentId"
  WHERE gm."groupId" = v_group AND gm."status" = 'ACTIVE';

  RETURN NEW;
END $$;
