-- Расписание: у не-групповых типов урока (TRIAL/INDIVIDUAL/MAKEUP/SPEAKING_CLUB)
-- Lesson.groupId всё равно NOT NULL (см. 20260808200654_lesson_type.sql — задумано
-- через отдельную/служебную группу, как в AlfaCRM). Раньше этот механизм не был
-- реализован, и админ/учитель был вынужден вручную выбирать реальную учебную
-- группу даже для пробного урока. Теперь на каждого учителя автоматически
-- заводится одна служебная группа под такие уроки, без выбора вручную.

BEGIN;

ALTER TABLE "Group" ADD COLUMN "isService" BOOLEAN NOT NULL DEFAULT false;

-- Одна служебная группа на учителя.
CREATE UNIQUE INDEX "Group_service_teacher_unique" ON "Group" ("teacherId") WHERE "isService";

-- SECURITY DEFINER: у "Group" нет INSERT-политики вообще (группы заводятся
-- только через server route с service-role), поэтому находим/создаём служебную
-- группу здесь. Вызывается и с клиента (admin/teacher RLS-контекст — сверяем
-- роль вручную), и с сервера через service-role (auth.role() = 'service_role',
-- там роль уже проверена выше по стеку).
CREATE OR REPLACE FUNCTION public.get_or_create_service_group(p_teacher_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF public.get_current_role() = 'ADMIN'::"UserRole" THEN
      NULL; -- admin может создавать служебную группу любому учителю
    ELSIF public.get_current_role() = 'TEACHER'::"UserRole" AND public.get_current_teacher_id() = p_teacher_id THEN
      NULL; -- учитель — только себе
    ELSE
      RAISE EXCEPTION 'not allowed';
    END IF;
  END IF;

  SELECT id INTO v_id FROM "Group" WHERE "teacherId" = p_teacher_id AND "isService" LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO "Group" ("name", "level", "teacherId", "isService", "maxStudents", "branchId")
  VALUES ('Служебная (без группы)', 'A1', p_teacher_id, true, 1, NULL)
  ON CONFLICT ("teacherId") WHERE "isService" DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    -- Конкурентный вызов уже создал строку — забираем её.
    SELECT id INTO v_id FROM "Group" WHERE "teacherId" = p_teacher_id AND "isService" LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_service_group(UUID) TO authenticated;

COMMIT;
