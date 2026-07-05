-- ══════════════════════════════════════════════════════════════════
-- Shop Avatars — часть 1: категория + слот на профиле
--
-- Новое значение enum "ShopCategory" = 'AVATAR' (сменные аватарки-персонажи).
-- Добавление значения enum и его использование в сидах разнесены на два
-- файла миграции: PostgreSQL не даёт использовать только что добавленное
-- значение enum в той же транзакции.
--
-- activeAvatarId — какой купленный аватар надет (ссылка на ShopItem.id,
-- как activeFrameId / activeTitleId).
-- ══════════════════════════════════════════════════════════════════

ALTER TYPE "ShopCategory" ADD VALUE IF NOT EXISTS 'AVATAR';

ALTER TABLE "StudentGameProfile"
  ADD COLUMN IF NOT EXISTS "activeAvatarId" UUID;
