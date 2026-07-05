-- ══════════════════════════════════════════════════════════════════
-- Shop Avatars — часть 2: сид аватарок-персонажей
--
-- Аватары — emoji-персонажи (без внешних файлов: надёжно с CSP и грузится
-- мгновенно). Отображаемый персонаж лежит в effect.emoji; поле icon — только
-- запасной lucide-значок. При надевании (equip-item, category=AVATAR) в
-- StudentGameProfile.activeAvatarId пишется id этого товара, а UserAvatar
-- показывает effect.emoji вместо фото/инициалов.
-- ══════════════════════════════════════════════════════════════════

INSERT INTO "ShopItem" (id, name, "nameKz", description, "descriptionKz", icon, category, price, "maxOwnable", effect, "isActive", "requiredLevel", "sortOrder")
VALUES
  (gen_random_uuid(), 'Лисёнок',    'Түлкі',      'Хитрый рыжий друг',        'Айлакер қызыл дос',       'i-lucide-smile', 'AVATAR', 80,  1, '{"type":"avatar","emoji":"🦊","bg":"#FED7AA"}'::jsonb, true, 1,  10),
  (gen_random_uuid(), 'Котик',      'Мысық',      'Мягкие лапки',             'Жұмсақ табандар',         'i-lucide-smile', 'AVATAR', 80,  1, '{"type":"avatar","emoji":"🐱","bg":"#FEF08A"}'::jsonb, true, 1,  11),
  (gen_random_uuid(), 'Панда',      'Панда',      'Спокойствие и бамбук',     'Тыныштық пен бамбук',     'i-lucide-smile', 'AVATAR', 80,  1, '{"type":"avatar","emoji":"🐼","bg":"#E5E7EB"}'::jsonb, true, 1,  12),
  (gen_random_uuid(), 'Пингвинчик', 'Пингвин',    'Всегда при параде',        'Әрдайым сәнді',           'i-lucide-smile', 'AVATAR', 120, 1, '{"type":"avatar","emoji":"🐧","bg":"#BAE6FD"}'::jsonb, true, 3,  13),
  (gen_random_uuid(), 'Совёнок',    'Байғыз',     'Ночной мудрец',            'Түнгі дана',              'i-lucide-smile', 'AVATAR', 120, 1, '{"type":"avatar","emoji":"🦉","bg":"#DDD6FE"}'::jsonb, true, 3,  14),
  (gen_random_uuid(), 'Ракета',     'Зымыран',    'К звёздам знаний',         'Білім жұлдыздарына',      'i-lucide-smile', 'AVATAR', 200, 1, '{"type":"avatar","emoji":"🚀","bg":"#FBCFE8"}'::jsonb, true, 6,  15),
  (gen_random_uuid(), 'Тигрёнок',   'Жолбарыс',   'Сила и смелость',          'Күш пен батылдық',        'i-lucide-smile', 'AVATAR', 150, 1, '{"type":"avatar","emoji":"🐯","bg":"#FDE68A"}'::jsonb, true, 5,  16),
  (gen_random_uuid(), 'Робот',      'Робот',      'Алгоритмы и логика',       'Алгоритмдер мен логика',  'i-lucide-smile', 'AVATAR', 250, 1, '{"type":"avatar","emoji":"🤖","bg":"#C7D2FE"}'::jsonb, true, 8,  17),
  (gen_random_uuid(), 'Пришелец',   'Ғарыштық',   'Гость из галактики',       'Галактикадан қонақ',      'i-lucide-smile', 'AVATAR', 250, 1, '{"type":"avatar","emoji":"👽","bg":"#BBF7D0"}'::jsonb, true, 8,  18),
  (gen_random_uuid(), 'Дракоша',    'Айдаһар',    'Легендарный питомец',      'Аңызға айналған үй жануары','i-lucide-smile', 'AVATAR', 300, 1, '{"type":"avatar","emoji":"🐲","bg":"#A7F3D0"}'::jsonb, true, 10, 19),
  (gen_random_uuid(), 'Единорог',   'Керіктұяқ',  'Магия и чудеса',           'Сиқыр мен ғажайып',       'i-lucide-smile', 'AVATAR', 300, 1, '{"type":"avatar","emoji":"🦄","bg":"#FBCFE8"}'::jsonb, true, 10, 20),
  (gen_random_uuid(), 'Король',     'Патша',      'Вершина мастерства',       'Шеберлік шыңы',           'i-lucide-smile', 'AVATAR', 500, 1, '{"type":"avatar","emoji":"👑","bg":"#FDE68A"}'::jsonb, true, 15, 21)
ON CONFLICT DO NOTHING;
