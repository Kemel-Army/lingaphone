-- Тип занятия (админ-раздел «Расписание»): групповой / индивидуальный /
-- пробный / отработка / Speaking Club. Каждый Lesson по-прежнему привязан
-- к Group (groupId NOT NULL сохраняется) — не-групповые типы занятий
-- планируются через отдельную/служебную группу, как и в AlfaCRM.

CREATE TYPE "LessonType" AS ENUM (
  'GROUP', 'INDIVIDUAL', 'TRIAL', 'MAKEUP', 'SPEAKING_CLUB'
);

ALTER TABLE "Lesson"
  ADD COLUMN "type" "LessonType" NOT NULL DEFAULT 'GROUP';

CREATE INDEX "Lesson_type_idx" ON "Lesson" ("type");
