-- ═══════════════════════════════════════════════════════════════
-- Reading Library Seed — A1 & A2
-- ═══════════════════════════════════════════════════════════════

-- ── A1 · Text 1: My Family ──────────────────────────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'My Family',
    '## My Family

My name is Lisa. I am eight years old. I have a small family.

My mother is a teacher. Her name is Anna. She is kind and funny.

My father is a doctor. His name is Peter. He is tall.

I have one brother. His name is Tom. Tom is five years old. He likes cars and dogs.

We have a cat. Her name is Fluffy. Fluffy is white and small. I love Fluffy!

We live in a small house. Our house has a garden. In the garden there are flowers and trees.

I love my family!',
    'A1', 'story', 'Family', 87,
    '[{"word":"brother","translation":"брат"},{"word":"teacher","translation":"учитель"},{"word":"doctor","translation":"врач"},{"word":"garden","translation":"сад"},{"word":"flowers","translation":"цветы"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'What is the name of Lisa''s mother?',
    '["Anna", "Maria", "Kate", "Julia"]'::jsonb, 'Anna', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'Lisa has two brothers.', NULL, 'False', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'The name of the cat is ___.', NULL, 'Fluffy', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'What is the job of Lisa''s father?',
  '["He is a teacher", "He is a doctor", "He is a driver", "He is a cook"]'::jsonb,
  'He is a doctor', 10, 4
FROM t;

-- ── A1 · Text 2: At the Cafe ────────────────────────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'At the Cafe',
    '## At the Cafe

Tom and his friend Ben are at a cafe. They are hungry and thirsty.

Tom orders a sandwich and apple juice. Ben orders a pizza and tea.

The waiter brings the food. The sandwich is very good. The pizza is big.

"Is the pizza tasty?" asks Tom.

"Yes, it is delicious!" says Ben.

After lunch, they order ice cream. Tom likes chocolate ice cream. Ben likes vanilla.

They pay the bill and say thank you to the waiter. It is a good lunch!',
    'A1', 'dialogue', 'Food & Drink', 83,
    '[{"word":"cafe","translation":"кафе"},{"word":"hungry","translation":"голодный"},{"word":"sandwich","translation":"бутерброд"},{"word":"delicious","translation":"вкусный"},{"word":"waiter","translation":"официант"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'What does Tom order to drink?',
    '["Tea", "Coffee", "Apple juice", "Water"]'::jsonb, 'Apple juice', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'Ben orders a sandwich.', NULL, 'False', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'Ben says the pizza is ___.', NULL, 'delicious', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'What ice cream does Tom like?',
  '["Vanilla", "Strawberry", "Chocolate", "Mango"]'::jsonb, 'Chocolate', 10, 4
FROM t;

-- ── A2 · Text 1: Weekend Plans ──────────────────────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'Weekend Plans',
    '## Weekend Plans

Every weekend, my friends and I make plans to do something fun together.

Last Saturday, we went to the city park. The weather was sunny and warm. We played football and had a picnic. Sarah brought sandwiches and lemonade. It was delicious!

This Saturday, we are planning to go to the cinema. There is a new film about a young explorer who travels to the Amazon rainforest. The reviews say it is very exciting.

Next weekend, we want to try a new Italian restaurant near the shopping centre. My friend Mark has already reserved a table for six people.

We always have a great time together. Having good friends makes weekends special!',
    'A2', 'story', 'Leisure & Friends', 112,
    '[{"word":"picnic","translation":"пикник"},{"word":"explorer","translation":"исследователь"},{"word":"rainforest","translation":"тропический лес"},{"word":"reserved","translation":"зарезервировал"},{"word":"reviews","translation":"отзывы"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'Where did the friends go last Saturday?',
    '["Cinema", "Park", "Restaurant", "Museum"]'::jsonb, 'Park', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'The new film is about a young explorer.', NULL, 'True', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'Mark reserved a table for ___ people.', NULL, 'six', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'What did Sarah bring to the picnic?',
  '["Pizza and juice", "Sandwiches and lemonade", "Cake and tea", "Fruit and water"]'::jsonb,
  'Sandwiches and lemonade', 10, 4
FROM t;

-- ── A2 · Text 2: The Perfect Hobby ─────────────────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'The Perfect Hobby',
    '## The Perfect Hobby

Many people have hobbies to relax and enjoy their free time. A hobby can be almost anything — from painting to cooking, from reading to playing sports.

My hobby is photography. I started two years ago when my parents gave me a camera for my birthday. At first, I only took photos of my family and friends. Now I photograph nature, buildings, and street life.

Photography teaches me to look at the world differently. I notice small details that other people often miss — a leaf with water drops, shadows on a wall, or the smile of a stranger.

I share my photos on social media and have already got 500 followers! Some people have asked me to take photos at their events.

What is your hobby? Whatever it is, enjoy it!',
    'A2', 'article', 'Hobbies', 128,
    '[{"word":"photography","translation":"фотография"},{"word":"camera","translation":"фотоаппарат"},{"word":"details","translation":"детали"},{"word":"followers","translation":"подписчики"},{"word":"shadows","translation":"тени"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'When did the author start photography?',
    '["One year ago", "Two years ago", "Three years ago", "Last month"]'::jsonb,
    'Two years ago', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'The author only takes photos of the family now.', NULL, 'False', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'The author has ___ followers on social media.', NULL, '500', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'What was the first subject the author photographed?',
  '["Nature", "Buildings", "Family and friends", "Street life"]'::jsonb,
  'Family and friends', 10, 4
FROM t;
