-- ═══════════════════════════════════════════════════════════════════
-- «Мой путь» — часть 3: пилот Access 1, структура и наполнение 3 блоков.
--
-- ТЗ, критерий приёмки: для пилотного учебника (Access 1) полностью создана
-- структура и наполнение для первых 3 блоков, с обязательным тестом в конце
-- каждого блока и последовательной блокировкой.
--
-- Блок = Module. Реорганизуем имеющийся Access 1 (1 модуль, 5 юнитов) в 3
-- блока, каждый = урок(и) + тест-юнит (kind='TEST'). Переиспользуем готовый
-- контент упражнений; для блоков 1–2 добавляем тесты, блок 3 использует
-- имеющийся «Тестовый блок (Revision)».
-- ═══════════════════════════════════════════════════════════════════

-- ── Учебник: привязка к треку A1 (Access 1) ──────────────────────
UPDATE "Book"
SET "title" = 'Access 1', "trackKey" = 'A1', "cefrTier" = 'Beginner A1',
    "description" = 'Grammar Book — Beginner (A1). Express Publishing.',
    "isPublished" = TRUE
WHERE id = 'a0000000-0000-4000-8000-000000000001';

-- Чистим мусорные дубли-книги уровня A1 (пустые, из тестовых загрузок).
DELETE FROM "Book" WHERE id IN (
  'be8fca0c-8337-4d31-b048-2447c97bc83d',  -- "тест"
  'db7ecab3-319e-4ac1-bc7c-e99691affdfa'   -- "Access_1_GB" (0 юнитов)
);

-- ── Блоки (модули) ───────────────────────────────────────────────
-- Блок 1 — переиспользуем существующий модуль.
UPDATE "Module"
SET "title" = 'Блок 1. Неопределённый артикль a / an', "order" = 1, "pageCount" = 0
WHERE id = 'a0000000-0000-4000-8000-000000000101';

-- Убираем legacy-оверлей (сканы страниц) — блоки рендерятся нативным плеером.
DELETE FROM "BookPage" WHERE "moduleId" = 'a0000000-0000-4000-8000-000000000101';

INSERT INTO "Module" (id, "bookId", title, "order", "pdfUrl", "pageCount") VALUES
  ('a0000000-0000-4000-8000-000000000102','a0000000-0000-4000-8000-000000000001','Блок 2. Личные местоимения',2,NULL,0),
  ('a0000000-0000-4000-8000-000000000103','a0000000-0000-4000-8000-000000000001','Блок 3. Глагол to be (am / is / are)',3,NULL,0)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, "order" = EXCLUDED."order", "pageCount" = 0;

-- ── Раскладка юнитов по блокам + типы ────────────────────────────
UPDATE "LessonUnit" SET "moduleId"='a0000000-0000-4000-8000-000000000101', "orderIndex"=0, "kind"='LESSON'
  WHERE id='47b8090b-3285-4ce4-be7c-90f3297d8ce0';  -- Артикль a/an (урок)
UPDATE "LessonUnit" SET "moduleId"='a0000000-0000-4000-8000-000000000102', "orderIndex"=0, "kind"='LESSON'
  WHERE id='9c4fedf9-4ef6-463e-bbf2-82363820a09d';  -- Местоимения (урок)
UPDATE "LessonUnit" SET "moduleId"='a0000000-0000-4000-8000-000000000103', "orderIndex"=0, "kind"='LESSON'
  WHERE id='9be19ecf-2fd8-4e7c-97f1-9445297941f0';  -- to be (урок)
UPDATE "LessonUnit" SET "moduleId"='a0000000-0000-4000-8000-000000000103', "orderIndex"=1, "kind"='LESSON'
  WHERE id='eecc282b-7a56-44bd-a5dd-56440db48d9b';  -- Анализ грамматики (урок)
UPDATE "LessonUnit" SET "moduleId"='a0000000-0000-4000-8000-000000000103', "orderIndex"=2, "kind"='TEST', "passThreshold"=70,
    "title"='Тест блока 3. Глагол to be'
  WHERE id='821adc12-dd80-4aaa-8f81-5bf4de5d6dde';  -- Revision → тест блока 3

-- ── Тест-юниты для блоков 1 и 2 ──────────────────────────────────
INSERT INTO "LessonUnit" (id, "moduleId", title, subtitle, "orderIndex", "kind", "passThreshold", intro) VALUES
  ('a0000000-0000-4000-8000-000000000201','a0000000-0000-4000-8000-000000000101',
   'Тест блока 1. Артикль a / an','Ответь верно минимум на 70%, чтобы открыть следующий блок',1,'TEST',70,'[]'::jsonb),
  ('a0000000-0000-4000-8000-000000000202','a0000000-0000-4000-8000-000000000102',
   'Тест блока 2. Личные местоимения','Ответь верно минимум на 70%, чтобы открыть следующий блок',1,'TEST',70,'[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
  "orderIndex"=EXCLUDED."orderIndex", kind=EXCLUDED.kind, "passThreshold"=EXCLUDED."passThreshold";

-- ── Упражнения теста блока 1 (a / an) ────────────────────────────
INSERT INTO "LessonExercise" (id, "unitId", "orderIndex", type, instruction, content, xp) VALUES
  ('a0000000-0000-4000-8000-000000000301','a0000000-0000-4000-8000-000000000201',0,'MCQ','Выбери правильный артикль',
   '{"question":"___ apple","options":[{"id":"a","label":"a"},{"id":"an","label":"an"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000302','a0000000-0000-4000-8000-000000000201',1,'MCQ','Выбери правильный артикль',
   '{"question":"___ book","options":[{"id":"a","label":"a"},{"id":"an","label":"an"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000303','a0000000-0000-4000-8000-000000000201',2,'MCQ','Выбери правильный артикль',
   '{"question":"___ orange","options":[{"id":"a","label":"a"},{"id":"an","label":"an"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000304','a0000000-0000-4000-8000-000000000201',3,'MCQ','Выбери правильный артикль',
   '{"question":"___ car","options":[{"id":"a","label":"a"},{"id":"an","label":"an"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000305','a0000000-0000-4000-8000-000000000201',4,'MCQ','Выбери правильный артикль',
   '{"question":"___ umbrella","options":[{"id":"a","label":"a"},{"id":"an","label":"an"}]}'::jsonb,10)
ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type, instruction=EXCLUDED.instruction, content=EXCLUDED.content;

INSERT INTO "LessonExerciseAnswer" ("exerciseId","answerKey",explanation) VALUES
  ('a0000000-0000-4000-8000-000000000301','{"correctId":"an"}'::jsonb,'apple начинается с гласного звука → an'),
  ('a0000000-0000-4000-8000-000000000302','{"correctId":"a"}'::jsonb,'book начинается с согласного → a'),
  ('a0000000-0000-4000-8000-000000000303','{"correctId":"an"}'::jsonb,'orange начинается с гласного → an'),
  ('a0000000-0000-4000-8000-000000000304','{"correctId":"a"}'::jsonb,'car начинается с согласного → a'),
  ('a0000000-0000-4000-8000-000000000305','{"correctId":"an"}'::jsonb,'umbrella начинается с гласного → an')
ON CONFLICT ("exerciseId") DO UPDATE SET "answerKey"=EXCLUDED."answerKey", explanation=EXCLUDED.explanation;

-- ── Упражнения теста блока 2 (местоимения) ───────────────────────
INSERT INTO "LessonExercise" (id, "unitId", "orderIndex", type, instruction, content, xp) VALUES
  ('a0000000-0000-4000-8000-000000000311','a0000000-0000-4000-8000-000000000202',0,'MCQ','Выбери местоимение',
   '{"question":"Peter is a boy. ___ is happy.","options":[{"id":"he","label":"He"},{"id":"she","label":"She"},{"id":"it","label":"It"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000312','a0000000-0000-4000-8000-000000000202',1,'MCQ','Выбери местоимение',
   '{"question":"Anna is my sister. ___ is ten.","options":[{"id":"he","label":"He"},{"id":"she","label":"She"},{"id":"it","label":"It"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000313','a0000000-0000-4000-8000-000000000202',2,'MCQ','Выбери местоимение',
   '{"question":"The dog is big. ___ is black.","options":[{"id":"he","label":"He"},{"id":"she","label":"She"},{"id":"it","label":"It"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000314','a0000000-0000-4000-8000-000000000202',3,'MCQ','Выбери местоимение',
   '{"question":"Tom and I are friends. ___ are students.","options":[{"id":"we","label":"We"},{"id":"they","label":"They"},{"id":"you","label":"You"}]}'::jsonb,10),
  ('a0000000-0000-4000-8000-000000000315','a0000000-0000-4000-8000-000000000202',4,'MCQ','Выбери местоимение',
   '{"question":"The books are new. ___ are red.","options":[{"id":"we","label":"We"},{"id":"they","label":"They"},{"id":"it","label":"It"}]}'::jsonb,10)
ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type, instruction=EXCLUDED.instruction, content=EXCLUDED.content;

INSERT INTO "LessonExerciseAnswer" ("exerciseId","answerKey",explanation) VALUES
  ('a0000000-0000-4000-8000-000000000311','{"correctId":"he"}'::jsonb,'boy → He'),
  ('a0000000-0000-4000-8000-000000000312','{"correctId":"she"}'::jsonb,'sister → She'),
  ('a0000000-0000-4000-8000-000000000313','{"correctId":"it"}'::jsonb,'dog (предмет/животное) → It'),
  ('a0000000-0000-4000-8000-000000000314','{"correctId":"we"}'::jsonb,'Tom and I → We'),
  ('a0000000-0000-4000-8000-000000000315','{"correctId":"they"}'::jsonb,'books (мн. число) → They')
ON CONFLICT ("exerciseId") DO UPDATE SET "answerKey"=EXCLUDED."answerKey", explanation=EXCLUDED.explanation;
