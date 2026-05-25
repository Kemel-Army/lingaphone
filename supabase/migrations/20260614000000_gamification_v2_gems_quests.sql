-- ══════════════════════════════════════════════════════════════════
-- Gamification V2: Gems Economy + Quests + Achievement Tiers
-- ══════════════════════════════════════════════════════════════════

-- ─────────────── 1. Gems on StudentGameProfile ───────────────

ALTER TABLE "StudentGameProfile"
  ADD COLUMN IF NOT EXISTS "gems" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streakFreezes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "activeFrameId" UUID,
  ADD COLUMN IF NOT EXISTS "activeTitleId" UUID,
  ADD COLUMN IF NOT EXISTS "visualMode" TEXT NOT NULL DEFAULT 'standard';

-- ─────────────── 2. GemTransaction ───────────────

CREATE TYPE "GemSourceType" AS ENUM (
  'QUEST',
  'ACHIEVEMENT',
  'MILESTONE',
  'STREAK',
  'LEVEL_UP',
  'SHOP_PURCHASE',
  'SHOP_REFUND'
);

CREATE TABLE "GemTransaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "amount" INTEGER NOT NULL, -- positive = earned, negative = spent
  "sourceType" "GemSourceType" NOT NULL,
  "sourceId" UUID,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gem_tx_student ON "GemTransaction"("studentId");
CREATE INDEX idx_gem_tx_created ON "GemTransaction"("createdAt" DESC);

-- ─────────────── 3. Achievement Tiers & Categories ───────────────

ALTER TABLE "Achievement"
  ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'BRONZE',
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gemReward" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Update existing achievements with tiers
UPDATE "Achievement" SET "tier" = 'BRONZE', "category" = 'XP', "gemReward" = 10
  WHERE condition->>'type' = 'xp_total' AND (condition->>'value')::int <= 100;
UPDATE "Achievement" SET "tier" = 'SILVER', "category" = 'XP', "gemReward" = 25
  WHERE condition->>'type' = 'xp_total' AND (condition->>'value')::int BETWEEN 101 AND 5000;
UPDATE "Achievement" SET "tier" = 'GOLD', "category" = 'XP', "gemReward" = 50
  WHERE condition->>'type' = 'xp_total' AND (condition->>'value')::int > 5000;
UPDATE "Achievement" SET "tier" = 'BRONZE', "category" = 'STREAK', "gemReward" = 20
  WHERE condition->>'type' = 'streak' AND (condition->>'value')::int <= 7;
UPDATE "Achievement" SET "tier" = 'SILVER', "category" = 'STREAK', "gemReward" = 25
  WHERE condition->>'type' = 'streak' AND (condition->>'value')::int BETWEEN 8 AND 30;
UPDATE "Achievement" SET "tier" = 'GOLD', "category" = 'STREAK', "gemReward" = 50
  WHERE condition->>'type' = 'streak' AND (condition->>'value')::int > 30;
UPDATE "Achievement" SET "category" = 'TESTS', "gemReward" = 25
  WHERE condition->>'type' = 'perfect_test';
UPDATE "Achievement" SET "category" = 'HOMEWORK', "gemReward" = 25
  WHERE condition->>'type' = 'homework_on_time';
UPDATE "Achievement" SET "category" = 'AI', "gemReward" = 25
  WHERE condition->>'type' = 'ai_sessions';
UPDATE "Achievement" SET "category" = 'MASTERY', "gemReward" = 25
  WHERE condition->>'type' = 'gap_closed';
UPDATE "Achievement" SET "category" = 'LEVEL', "gemReward" = 25
  WHERE condition->>'type' = 'level' AND (condition->>'value')::int <= 10;
UPDATE "Achievement" SET "tier" = 'SILVER', "category" = 'LEVEL', "gemReward" = 50
  WHERE condition->>'type' = 'level' AND (condition->>'value')::int > 10;

-- ─────────────── 4. Expanded Achievements (50+) ───────────────

INSERT INTO "Achievement" (id, name, "nameKz", description, "descriptionKz", icon, condition, "xpReward", "gemReward", "isActive", tier, category, "isHidden", "sortOrder")
VALUES
  -- ══ LESSONS ══
  (gen_random_uuid(), 'Первый урок', 'Алғашқы сабақ', 'Посетите первый урок', 'Алғашқы сабаққа қатысыңыз', 'i-lucide-play-circle', '{"type":"lessons_attended","value":1}'::jsonb, 30, 10, true, 'BRONZE', 'LESSONS', false, 100),
  (gen_random_uuid(), 'Регулярный', 'Тұрақты', 'Посетите 25 уроков', '25 сабаққа қатысыңыз', 'i-lucide-calendar-check', '{"type":"lessons_attended","value":25}'::jsonb, 150, 25, true, 'SILVER', 'LESSONS', false, 101),
  (gen_random_uuid(), 'Ветеран', 'Тәжірибелі', 'Посетите 100 уроков', '100 сабаққа қатысыңыз', 'i-lucide-shield', '{"type":"lessons_attended","value":100}'::jsonb, 500, 50, true, 'GOLD', 'LESSONS', false, 102),
  (gen_random_uuid(), 'Легенда обучения', 'Оқыту аңызы', 'Посетите 500 уроков', '500 сабаққа қатысыңыз', 'i-lucide-sparkles', '{"type":"lessons_attended","value":500}'::jsonb, 1500, 100, true, 'PLATINUM', 'LESSONS', false, 103),

  -- ══ HOMEWORK ══
  (gen_random_uuid(), 'Первая сдача', 'Алғашқы тапсыру', 'Сдайте первое ДЗ', 'Алғашқы ҮТ тапсырыңыз', 'i-lucide-file-check', '{"type":"homework_on_time","value":1}'::jsonb, 30, 10, true, 'BRONZE', 'HOMEWORK', false, 200),
  (gen_random_uuid(), 'Дисциплина', 'Тәртіп', 'Сдайте 25 ДЗ вовремя', '25 ҮТ уақытында тапсырыңыз', 'i-lucide-clipboard-check', '{"type":"homework_on_time","value":25}'::jsonb, 200, 25, true, 'SILVER', 'HOMEWORK', false, 201),
  (gen_random_uuid(), 'Машина ДЗ', 'ҮТ машинасы', 'Сдайте 100 ДЗ вовремя', '100 ҮТ уақытында тапсырыңыз', 'i-lucide-check-circle', '{"type":"homework_on_time","value":100}'::jsonb, 500, 50, true, 'GOLD', 'HOMEWORK', false, 202),

  -- ══ AI ══
  (gen_random_uuid(), 'Первый контакт', 'Алғашқы байланыс', 'Первая AI-сессия', 'Алғашқы AI сессия', 'i-lucide-bot', '{"type":"ai_sessions","value":1}'::jsonb, 30, 10, true, 'BRONZE', 'AI', false, 300),
  (gen_random_uuid(), 'AI-путешественник', 'AI-саяхатшы', '20 AI-сессий', '20 AI сессия', 'i-lucide-brain', '{"type":"ai_sessions","value":20}'::jsonb, 150, 25, true, 'SILVER', 'AI', false, 301),
  (gen_random_uuid(), 'AI-мастер', 'AI-шебер', '100 AI-сессий', '100 AI сессия', 'i-lucide-cpu', '{"type":"ai_sessions","value":100}'::jsonb, 500, 50, true, 'GOLD', 'AI', false, 302),
  (gen_random_uuid(), 'Симбиоз', 'Симбиоз', '500 AI-сессий', '500 AI сессия', 'i-lucide-orbit', '{"type":"ai_sessions","value":500}'::jsonb, 1500, 100, true, 'PLATINUM', 'AI', false, 303),

  -- ══ STREAK ══
  (gen_random_uuid(), 'Искра', 'Ұшқын', '3 дня подряд', '3 күн қатарынан', 'i-lucide-flame', '{"type":"streak","value":3}'::jsonb, 30, 10, true, 'BRONZE', 'STREAK', false, 400),
  (gen_random_uuid(), 'Костёр', 'Алау', '14 дней подряд', '14 күн қатарынан', 'i-lucide-flame', '{"type":"streak","value":14}'::jsonb, 150, 25, true, 'SILVER', 'STREAK', false, 402),
  (gen_random_uuid(), 'Вечный огонь', 'Мәңгі от', '60 дней подряд', '60 күн қатарынан', 'i-lucide-flame', '{"type":"streak","value":60}'::jsonb, 500, 50, true, 'GOLD', 'STREAK', false, 404),
  (gen_random_uuid(), 'Сверхновая', 'Асқын жаңа жұлдыз', '365 дней подряд', '365 күн қатарынан', 'i-lucide-sun', '{"type":"streak","value":365}'::jsonb, 2000, 200, true, 'COSMOS', 'STREAK', false, 407),

  -- ══ TESTS ══
  (gen_random_uuid(), 'Первопроходец', 'Жаңашыл', 'Пройдите первый тест', 'Алғашқы тестті тапсырыңыз', 'i-lucide-file-question', '{"type":"tests_completed","value":1}'::jsonb, 30, 10, true, 'BRONZE', 'TESTS', false, 500),
  (gen_random_uuid(), 'Тестер', 'Сынақшы', '5 идеальных тестов', '5 мінсіз тест', 'i-lucide-star', '{"type":"perfect_test","value":5}'::jsonb, 300, 25, true, 'SILVER', 'TESTS', false, 501),
  (gen_random_uuid(), 'Гений', 'Дара', '25 идеальных тестов', '25 мінсіз тест', 'i-lucide-zap', '{"type":"perfect_test","value":25}'::jsonb, 1000, 50, true, 'GOLD', 'TESTS', false, 502),

  -- ══ MASTERY ══
  (gen_random_uuid(), 'Первая звезда', 'Алғашқы жұлдыз', 'Освойте первую тему (90%+)', 'Алғашқы тақырыпты меңгеріңіз', 'i-lucide-star', '{"type":"topics_mastered","value":1}'::jsonb, 100, 15, true, 'BRONZE', 'MASTERY', false, 600),
  (gen_random_uuid(), 'Созвездие', 'Шоқжұлдыз', 'Освойте 10 тем', '10 тақырыпты меңгеріңіз', 'i-lucide-stars', '{"type":"topics_mastered","value":10}'::jsonb, 400, 40, true, 'SILVER', 'MASTERY', false, 601),
  (gen_random_uuid(), 'Планета', 'Ғаламшар', 'Полностью освойте один предмет', 'Бір пәнді толық меңгеріңіз', 'i-lucide-globe', '{"type":"subjects_mastered","value":1}'::jsonb, 1000, 100, true, 'GOLD', 'MASTERY', false, 602),
  (gen_random_uuid(), 'Галактика', 'Галактика', 'Полностью освойте 3 предмета', '3 пәнді толық меңгеріңіз', 'i-lucide-orbit', '{"type":"subjects_mastered","value":3}'::jsonb, 3000, 200, true, 'PLATINUM', 'MASTERY', false, 603),

  -- ══ LEVEL ══
  (gen_random_uuid(), 'Уровень 5', '5-деңгей', 'Достигните 5 уровня', '5-деңгейге жетіңіз', 'i-lucide-trending-up', '{"type":"level","value":5}'::jsonb, 100, 15, true, 'BRONZE', 'LEVEL', false, 700),
  (gen_random_uuid(), 'Уровень 50', '50-деңгей', 'Достигните 50 уровня', '50-деңгейге жетіңіз', 'i-lucide-medal', '{"type":"level","value":50}'::jsonb, 2000, 100, true, 'GOLD', 'LEVEL', false, 703),
  (gen_random_uuid(), 'Уровень 100', '100-деңгей', 'Достигните максимального уровня', 'Ең жоғары деңгейге жетіңіз', 'i-lucide-crown', '{"type":"level","value":100}'::jsonb, 5000, 200, true, 'COSMOS', 'LEVEL', false, 704),

  -- ══ XP MILESTONES ══
  (gen_random_uuid(), 'Звёздная пыль', 'Жұлдыз шаңы', 'Заработайте 5,000 XP', '5,000 XP жинаңыз', 'i-lucide-sparkle', '{"type":"xp_total","value":5000}'::jsonb, 200, 25, true, 'SILVER', 'XP', false, 802),
  (gen_random_uuid(), 'Сверхразум', 'Асқын ақыл', 'Заработайте 50,000 XP', '50,000 XP жинаңыз', 'i-lucide-brain', '{"type":"xp_total","value":50000}'::jsonb, 1000, 100, true, 'PLATINUM', 'XP', false, 804),
  (gen_random_uuid(), 'Вселенная', 'Ғалам', 'Заработайте 100,000 XP', '100,000 XP жинаңыз', 'i-lucide-infinity', '{"type":"xp_total","value":100000}'::jsonb, 3000, 200, true, 'COSMOS', 'XP', false, 805),

  -- ══ HIDDEN (surprise achievements) ══
  (gen_random_uuid(), 'Ночная Сова', 'Түнгі жапалақ', 'Учёба после 23:00', '23:00-ден кейін оқу', 'i-lucide-moon', '{"type":"night_study","value":1}'::jsonb, 50, 15, true, 'BRONZE', 'HIDDEN', true, 900),
  (gen_random_uuid(), 'Ранняя Пташка', 'Ерте тұрушы', 'Учёба до 7:00', '7:00-ге дейін оқу', 'i-lucide-sunrise', '{"type":"early_study","value":1}'::jsonb, 50, 15, true, 'BRONZE', 'HIDDEN', true, 901),
  (gen_random_uuid(), 'Перфекционист', 'Перфекционист', '5 идеальных тестов подряд', '5 мінсіз тест қатарынан', 'i-lucide-target', '{"type":"perfect_test_streak","value":5}'::jsonb, 500, 50, true, 'GOLD', 'HIDDEN', true, 902),
  (gen_random_uuid(), 'Марафонец', 'Марафоншы', '3 часа учёбы за день', '3 сағат оқу бір күнде', 'i-lucide-timer', '{"type":"daily_study_hours","value":3}'::jsonb, 200, 25, true, 'SILVER', 'HIDDEN', true, 903)
ON CONFLICT DO NOTHING;

-- ─────────────── 5. Quest System ───────────────

CREATE TYPE "QuestType" AS ENUM (
  'SOLVE_PROBLEMS',
  'AI_SESSION_MINUTES',
  'ATTEND_LESSON',
  'SUBMIT_HOMEWORK',
  'REVIEW_TOPIC',
  'EARN_XP',
  'PERFECT_TEST',
  'CLOSE_GAP',
  'STREAK_DAYS'
);

CREATE TYPE "QuestPeriod" AS ENUM ('DAILY', 'WEEKLY');
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

CREATE TABLE "Quest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "QuestType" NOT NULL,
  "title" TEXT NOT NULL,
  "titleKz" TEXT,
  "description" TEXT,
  "descriptionKz" TEXT,
  "icon" TEXT NOT NULL DEFAULT 'i-lucide-target',
  "target" INTEGER NOT NULL DEFAULT 1,
  "xpReward" INTEGER NOT NULL DEFAULT 0,
  "gemReward" INTEGER NOT NULL DEFAULT 0,
  "period" "QuestPeriod" NOT NULL DEFAULT 'DAILY',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTemplate" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "StudentQuest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "questId" UUID NOT NULL REFERENCES "Quest"("id") ON DELETE CASCADE,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "target" INTEGER NOT NULL,
  "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
  "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  UNIQUE("studentId", "questId", "assignedAt")
);

CREATE INDEX idx_student_quest_student ON "StudentQuest"("studentId");
CREATE INDEX idx_student_quest_status ON "StudentQuest"("status");
CREATE INDEX idx_student_quest_expires ON "StudentQuest"("expiresAt");

-- ─────────────── 6. Seed Quest Templates ───────────────

INSERT INTO "Quest" (id, type, title, "titleKz", description, "descriptionKz", icon, target, "xpReward", "gemReward", period, "isActive", "isTemplate")
VALUES
  -- Daily templates
  (gen_random_uuid(), 'EARN_XP', 'Набери 50 XP', '50 XP жина', 'Заработайте 50 XP любым способом', 'Кез-келген жолмен 50 XP жинаңыз', 'i-lucide-zap', 50, 25, 5, 'DAILY', true, true),
  (gen_random_uuid(), 'SOLVE_PROBLEMS', 'Реши 5 задач', '5 есеп шеш', 'Решите 5 задач в AI-репетиторе', 'AI-репетиторда 5 есеп шешіңіз', 'i-lucide-calculator', 5, 30, 5, 'DAILY', true, true),
  (gen_random_uuid(), 'AI_SESSION_MINUTES', '15 минут с AI', 'AI-мен 15 минут', 'Проведите 15 минут в AI-репетиторе', 'AI-репетиторда 15 минут жұмсаңыз', 'i-lucide-bot', 15, 30, 5, 'DAILY', true, true),
  (gen_random_uuid(), 'SUBMIT_HOMEWORK', 'Сдай ДЗ', 'ҮТ тапсыр', 'Сдайте одно домашнее задание', 'Бір үй тапсырмасын тапсырыңыз', 'i-lucide-file-check', 1, 25, 5, 'DAILY', true, true),
  (gen_random_uuid(), 'REVIEW_TOPIC', 'Повтори тему', 'Тақырыпты қайтала', 'Повторите любую тему', 'Кез-келген тақырыпты қайталаңыз', 'i-lucide-rotate-ccw', 1, 20, 5, 'DAILY', true, true),
  (gen_random_uuid(), 'ATTEND_LESSON', 'Посети урок', 'Сабаққа қатыс', 'Посетите один урок', 'Бір сабаққа қатысыңыз', 'i-lucide-video', 1, 30, 5, 'DAILY', true, true),

  -- Weekly templates
  (gen_random_uuid(), 'EARN_XP', 'Набери 500 XP', '500 XP жина', 'Заработайте 500 XP за неделю', 'Аптада 500 XP жинаңыз', 'i-lucide-zap', 500, 100, 20, 'WEEKLY', true, true),
  (gen_random_uuid(), 'SOLVE_PROBLEMS', 'Реши 30 задач', '30 есеп шеш', 'Решите 30 задач за неделю', 'Аптада 30 есеп шешіңіз', 'i-lucide-calculator', 30, 150, 20, 'WEEKLY', true, true),
  (gen_random_uuid(), 'SUBMIT_HOMEWORK', 'Сдай 5 ДЗ', '5 ҮТ тапсыр', 'Сдайте 5 ДЗ за неделю', 'Аптада 5 ҮТ тапсырыңыз', 'i-lucide-file-check', 5, 120, 15, 'WEEKLY', true, true),
  (gen_random_uuid(), 'STREAK_DAYS', '7-дневный streak', '7 күндік серия', 'Занимайтесь 7 дней подряд', '7 күн қатарынан оқыңыз', 'i-lucide-flame', 7, 150, 25, 'WEEKLY', true, true),
  (gen_random_uuid(), 'PERFECT_TEST', 'Идеальный тест', 'Мінсіз тест', 'Получите 100% на тесте', 'Тестте 100% алыңыз', 'i-lucide-star', 1, 100, 15, 'WEEKLY', true, true),
  (gen_random_uuid(), 'AI_SESSION_MINUTES', '60 минут с AI', 'AI-мен 60 минут', 'Проведите 60 минут с AI за неделю', 'Аптада AI-мен 60 минут жұмсаңыз', 'i-lucide-brain', 60, 120, 20, 'WEEKLY', true, true)
ON CONFLICT DO NOTHING;

-- ─────────────── 7. Shop System ───────────────

CREATE TYPE "ShopCategory" AS ENUM (
  'POWER_UP',
  'AVATAR_FRAME',
  'PROFILE_THEME',
  'TITLE'
);

CREATE TABLE "ShopItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "nameKz" TEXT,
  "description" TEXT,
  "descriptionKz" TEXT,
  "icon" TEXT NOT NULL DEFAULT 'i-lucide-package',
  "category" "ShopCategory" NOT NULL,
  "price" INTEGER NOT NULL,
  "maxOwnable" INTEGER NOT NULL DEFAULT 1,
  "effect" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isLimited" BOOLEAN NOT NULL DEFAULT false,
  "requiredLevel" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "StudentInventory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "shopItemId" UUID NOT NULL REFERENCES "ShopItem"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "purchasedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("studentId", "shopItemId")
);

CREATE INDEX idx_student_inventory_student ON "StudentInventory"("studentId");

-- ─────────────── 8. Seed Shop Items ───────────────

INSERT INTO "ShopItem" (id, name, "nameKz", description, "descriptionKz", icon, category, price, "maxOwnable", effect, "isActive", "requiredLevel", "sortOrder")
VALUES
  -- Power-ups
  (gen_random_uuid(), 'Streak Freeze', 'Серияны қорғау', 'Защитите свой streak на 1 день', 'Серияңызды 1 күнге қорғаңыз', 'i-lucide-shield', 'POWER_UP', 200, 2, '{"type":"streak_freeze","duration_days":1}'::jsonb, true, 1, 100),
  (gen_random_uuid(), 'Двойной XP', 'Қос XP', 'Двойной XP на 1 час', '1 сағат бойы қос XP', 'i-lucide-zap', 'POWER_UP', 150, 3, '{"type":"double_xp","duration_minutes":60}'::jsonb, true, 5, 101),
  (gen_random_uuid(), 'Подсказка', 'Кеңес', 'Дополнительная подсказка от AI', 'AI-дан қосымша кеңес', 'i-lucide-lightbulb', 'POWER_UP', 50, 5, '{"type":"hint_token","count":1}'::jsonb, true, 1, 102),

  -- Avatar frames
  (gen_random_uuid(), 'Звёздная рамка', 'Жұлдызды жақтау', 'Сияющая рамка аватара', 'Жарқыраған аватар жақтауы', 'i-lucide-hexagon', 'AVATAR_FRAME', 100, 1, '{"type":"frame","style":"starry"}'::jsonb, true, 3, 200),
  (gen_random_uuid(), 'Галактическая рамка', 'Галактикалық жақтау', 'Анимированная рамка', 'Анимациялы жақтау', 'i-lucide-hexagon', 'AVATAR_FRAME', 300, 1, '{"type":"frame","style":"galactic"}'::jsonb, true, 10, 201),
  (gen_random_uuid(), 'Рамка Чёрная дыра', 'Қара тесік жақтауы', 'Премиум рамка', 'Премиум жақтау', 'i-lucide-hexagon', 'AVATAR_FRAME', 1000, 1, '{"type":"frame","style":"blackhole"}'::jsonb, true, 25, 202),

  -- Themes
  (gen_random_uuid(), 'Тема Нептун', 'Нептун тақырыбы', 'Голубая тема профиля', 'Көк профиль тақырыбы', 'i-lucide-palette', 'PROFILE_THEME', 200, 1, '{"type":"theme","name":"neptune","colors":{"primary":"#3B82F6","bg":"#1E3A5F"}}'::jsonb, true, 5, 300),
  (gen_random_uuid(), 'Тема Марс', 'Марс тақырыбы', 'Красная тема профиля', 'Қызыл профиль тақырыбы', 'i-lucide-palette', 'PROFILE_THEME', 200, 1, '{"type":"theme","name":"mars","colors":{"primary":"#EF4444","bg":"#5F1E1E"}}'::jsonb, true, 5, 301),
  (gen_random_uuid(), 'Тема Аврора', 'Аврора тақырыбы', 'Переливающаяся тема', 'Жарқыраған тақырып', 'i-lucide-palette', 'PROFILE_THEME', 500, 1, '{"type":"theme","name":"aurora","colors":{"primary":"#10B981","bg":"#064E3B"}}'::jsonb, true, 15, 302),

  -- Titles
  (gen_random_uuid(), 'Звёздный путник', 'Жұлдызды жолаушы', 'Титул под именем', 'Аттын астындағы титул', 'i-lucide-badge', 'TITLE', 300, 1, '{"type":"title","text":"★ Звёздный путник","textKz":"★ Жұлдызды жолаушы"}'::jsonb, true, 5, 400),
  (gen_random_uuid(), 'Покоритель планет', 'Ғаламшарларды бағындырушы', 'Элитный титул', 'Элиталық титул', 'i-lucide-badge', 'TITLE', 500, 1, '{"type":"title","text":"🪐 Покоритель планет","textKz":"🪐 Ғаламшарларды бағындырушы"}'::jsonb, true, 15, 401),
  (gen_random_uuid(), 'Создатель миров', 'Әлем жаратушы', 'Легендарный титул', 'Аңыздық титул', 'i-lucide-badge', 'TITLE', 1000, 1, '{"type":"title","text":"🌌 Создатель миров","textKz":"🌌 Әлем жаратушы"}'::jsonb, true, 30, 402)
ON CONFLICT DO NOTHING;

-- ─────────────── 9. RLS Policies ───────────────

-- GemTransaction RLS
ALTER TABLE "GemTransaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_gems" ON "GemTransaction"
  FOR SELECT USING (
    "studentId" IN (SELECT id FROM "Student" WHERE "userId" = auth.uid())
  );
CREATE POLICY "admin_manage_gems" ON "GemTransaction"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Quest RLS
ALTER TABLE "Quest" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_quests" ON "Quest"
  FOR SELECT USING (true);
CREATE POLICY "admin_manage_quests" ON "Quest"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- StudentQuest RLS
ALTER TABLE "StudentQuest" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_quests" ON "StudentQuest"
  FOR SELECT USING (
    "studentId" IN (SELECT id FROM "Student" WHERE "userId" = auth.uid())
  );
CREATE POLICY "admin_manage_student_quests" ON "StudentQuest"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ShopItem RLS (public read)
ALTER TABLE "ShopItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_shop" ON "ShopItem"
  FOR SELECT USING (true);
CREATE POLICY "admin_manage_shop" ON "ShopItem"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- StudentInventory RLS
ALTER TABLE "StudentInventory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_inventory" ON "StudentInventory"
  FOR SELECT USING (
    "studentId" IN (SELECT id FROM "Student" WHERE "userId" = auth.uid())
  );
CREATE POLICY "admin_manage_inventory" ON "StudentInventory"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
  );
