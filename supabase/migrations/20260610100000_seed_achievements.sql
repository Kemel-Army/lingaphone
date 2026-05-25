-- Seed default achievements for the gamification system
-- These match ACHIEVEMENT_DEFINITIONS in app/entities/game-profile/model/types.ts

INSERT INTO "Achievement" (id, name, "nameKz", description, "descriptionKz", icon, condition, "xpReward", "isActive")
VALUES
  (gen_random_uuid(), 'Первые шаги', 'Алғашқы қадамдар', 'Заработайте 100 XP', '100 XP жинаңыз', 'i-lucide-footprints', '{"type": "xp_total", "value": 100}'::jsonb, 50, true),
  (gen_random_uuid(), 'Ученик', 'Оқушы', 'Заработайте 1,000 XP', '1,000 XP жинаңыз', 'i-lucide-book-open', '{"type": "xp_total", "value": 1000}'::jsonb, 100, true),
  (gen_random_uuid(), 'Мастер', 'Шебер', 'Заработайте 10,000 XP', '10,000 XP жинаңыз', 'i-lucide-crown', '{"type": "xp_total", "value": 10000}'::jsonb, 500, true),
  (gen_random_uuid(), 'Streak 7', '7 күндік серия', '7 дней подряд', '7 күн қатарынан', 'i-lucide-flame', '{"type": "streak", "value": 7}'::jsonb, 100, true),
  (gen_random_uuid(), 'Streak 30', '30 күндік серия', '30 дней подряд', '30 күн қатарынан', 'i-lucide-flame', '{"type": "streak", "value": 30}'::jsonb, 300, true),
  (gen_random_uuid(), 'Streak 100', '100 күндік серия', '100 дней подряд', '100 күн қатарынан', 'i-lucide-flame', '{"type": "streak", "value": 100}'::jsonb, 1000, true),
  (gen_random_uuid(), 'Отличник', 'Үздік оқушы', 'Идеальный тест (100%)', 'Мінсіз тест (100%)', 'i-lucide-star', '{"type": "perfect_test", "value": 1}'::jsonb, 150, true),
  (gen_random_uuid(), 'ДЗ машина', 'ҮТ машинасы', '50 ДЗ вовремя', '50 ҮТ уақытында', 'i-lucide-check-circle', '{"type": "homework_on_time", "value": 50}'::jsonb, 200, true),
  (gen_random_uuid(), 'AI друг', 'AI досы', '20 AI-сессий', '20 AI сессия', 'i-lucide-bot', '{"type": "ai_sessions", "value": 20}'::jsonb, 150, true),
  (gen_random_uuid(), 'Пробел закрыт', 'Олқылық жойылды', 'Закройте пробел в знаниях', 'Білімдегі олқылықты жойыңыз', 'i-lucide-puzzle', '{"type": "gap_closed", "value": 1}'::jsonb, 200, true),
  (gen_random_uuid(), 'Уровень 10', '10-деңгей', 'Достигните 10 уровня', '10-деңгейге жетіңіз', 'i-lucide-trophy', '{"type": "level", "value": 10}'::jsonb, 200, true),
  (gen_random_uuid(), 'Уровень 25', '25-деңгей', 'Достигните 25 уровня', '25-деңгейге жетіңіз', 'i-lucide-trophy', '{"type": "level", "value": 25}'::jsonb, 500, true)
ON CONFLICT DO NOTHING;
