-- Дедупликация лида по телефону: приводим номер к каноническому казахстанскому виду.
--
-- Прошлая версия колонки просто выкидывала не-цифры, поэтому «+7 700 111-22-33»
-- (77001112233) и «8 700 111 22 33» (87001112233) считались разными людьми —
-- ровно тот случай, ради которого колонка и заводилась. Родители пишут номер
-- и так, и так, а иногда без кода страны вовсе.
--
-- Правила:
--   11 цифр, начинается с 8  → меняем ведущую 8 на 7   (87001112233 → 77001112233)
--   10 цифр                  → дописываем 7 спереди    (7001112233  → 77001112233)
--   остальное                → как есть (иностранные номера не трогаем)

ALTER TABLE "Lead" DROP COLUMN IF EXISTS "phoneDigits";

ALTER TABLE "Lead"
  ADD COLUMN "phoneDigits" TEXT
  GENERATED ALWAYS AS (
    CASE
      WHEN length(regexp_replace(COALESCE("phone", ''), '\D', '', 'g')) = 11
        AND left(regexp_replace(COALESCE("phone", ''), '\D', '', 'g'), 1) = '8'
        THEN '7' || right(regexp_replace(COALESCE("phone", ''), '\D', '', 'g'), 10)
      WHEN length(regexp_replace(COALESCE("phone", ''), '\D', '', 'g')) = 10
        THEN '7' || regexp_replace(COALESCE("phone", ''), '\D', '', 'g')
      ELSE regexp_replace(COALESCE("phone", ''), '\D', '', 'g')
    END
  ) STORED;

CREATE INDEX "Lead_phoneDigits_idx" ON "Lead" ("phoneDigits");
