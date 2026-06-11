-- ═══════════════════════════════════════════════════════════════
-- Reading Library Seed — B1 & B2
-- ═══════════════════════════════════════════════════════════════

-- ── B1 · Text 1: The Science of Sleep ──────────────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'The Science of Sleep',
    '## The Science of Sleep

We all know that sleep is important, but most people do not know exactly why. Scientists have been studying sleep for decades, and they have discovered some fascinating things.

When we sleep, our brain does not simply switch off. Instead, it is extremely active. During sleep, the brain processes and stores information from the day. This is why students who sleep well after studying remember more than those who stay up all night.

Sleep also repairs the body. Growth hormones are released during deep sleep, which helps muscles recover after exercise. The immune system becomes stronger, making it easier to fight diseases.

Adults need between seven and nine hours of sleep each night. However, research shows that teenagers require more — between eight and ten hours. Unfortunately, many teenagers do not get enough sleep due to school schedules, social media, and smartphones.

Experts recommend switching off screens one hour before bed and keeping a regular sleep schedule.',
    'B1', 'article', 'Science & Health', 158,
    '[{"word":"fascinating","translation":"захватывающий"},{"word":"processes","translation":"обрабатывает"},{"word":"immune system","translation":"иммунная система"},{"word":"schedules","translation":"расписания"},{"word":"releases","translation":"выделяет"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'What does the brain do during sleep?',
    '["It switches off completely", "It is extremely active", "It slows down completely", "It stops storing information"]'::jsonb,
    'It is extremely active', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'Adults need between eight and ten hours of sleep.', NULL, 'False', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'Growth hormones are released during ___ sleep.', NULL, 'deep', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'What do experts recommend before bed?',
  '["Drinking warm milk", "Reading a book", "Switching off screens", "Taking medicine"]'::jsonb,
  'Switching off screens', 10, 4
FROM t;

-- ── B1 · Text 2: Social Media — Friend or Enemy? ────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'Social Media: Friend or Enemy?',
    '## Social Media: Friend or Enemy?

Social media platforms have transformed the way people communicate, share information, and spend their time. With billions of users worldwide, sites like Instagram, TikTok, and YouTube have become central to modern life — especially for young people.

Supporters of social media argue that it helps people stay connected with friends and family across long distances. It also allows individuals to express themselves creatively, discover new interests, and even build successful businesses.

However, critics point out serious concerns. Studies have shown that heavy social media use is linked to higher levels of anxiety and depression, particularly among teenagers. The constant pressure to gain likes and followers can damage self-esteem. Moreover, the addictive design of these platforms often makes it difficult for users to control how much time they spend online.

The key, most experts agree, is balance. Using social media intentionally — for real connection and creativity rather than mindless scrolling — can bring benefits without the negative effects.

How do you use social media?',
    'B1', 'article', 'Technology & Society', 169,
    '[{"word":"transformed","translation":"изменил"},{"word":"self-esteem","translation":"самооценка"},{"word":"addictive","translation":"вызывающий привыкание"},{"word":"anxiety","translation":"тревога"},{"word":"intentionally","translation":"намеренно"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'According to supporters, what is one benefit of social media?',
    '["Making easy money", "Staying connected with friends", "Improving sleep quality", "Learning languages faster"]'::jsonb,
    'Staying connected with friends', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'Heavy social media use is linked to lower levels of anxiety.', NULL, 'False', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'The ___ design of these platforms makes it hard to stop using them.', NULL, 'addictive', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'What do most experts recommend?',
  '["Deleting all social media", "Using social media in balance", "Banning smartphones", "Limiting internet to 30 minutes"]'::jsonb,
  'Using social media in balance', 10, 4
FROM t;

-- ── B2 · Text 1: The Psychology of Procrastination ──────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'The Psychology of Procrastination',
    '## The Psychology of Procrastination

Procrastination — the habit of delaying tasks despite knowing the consequences — is one of the most widespread human behaviours. Research suggests that around 20 percent of adults are chronic procrastinators, meaning they consistently put off important tasks in all areas of their lives.

Despite being commonly dismissed as laziness, procrastination is fundamentally an emotional regulation problem, not a time management one. When a task triggers negative emotions — such as fear of failure, boredom, or self-doubt — the brain automatically seeks immediate relief through distraction. Checking social media or watching videos feels rewarding in the short term, but the avoidance creates a cycle of guilt and further procrastination.

Neuroscience reveals that procrastinators tend to have a larger amygdala — the part of the brain responsible for emotional responses — along with weaker connections between the amygdala and the prefrontal cortex, which controls decision-making and impulse regulation.

Effective strategies to overcome procrastination include breaking tasks into smaller steps, using implementation intentions, and practising self-compassion rather than harsh self-criticism after setbacks.',
    'B2', 'article', 'Psychology', 178,
    '[{"word":"procrastination","translation":"прокрастинация"},{"word":"chronic","translation":"хронический"},{"word":"avoidance","translation":"избегание"},{"word":"amygdala","translation":"миндалевидное тело"},{"word":"self-compassion","translation":"самосострадание"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'According to the text, procrastination is fundamentally a problem with...',
    '["Time management", "Emotional regulation", "Laziness", "Decision-making speed"]'::jsonb,
    'Emotional regulation', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'About 20 percent of adults are chronic procrastinators.', NULL, 'True', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'Procrastinators tend to have a larger ___.', NULL, 'amygdala', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'Which strategy for overcoming procrastination is mentioned?',
  '["Taking longer breaks", "Rewarding yourself with food", "Breaking tasks into smaller steps", "Working only in the morning"]'::jsonb,
  'Breaking tasks into smaller steps', 10, 4
FROM t;

-- ── B2 · Text 2: The Hidden Language of Colour ──────────────────
WITH t AS (
  INSERT INTO "ReadingText" (title, body, level, genre, topic, "wordCount", vocabulary, "isPublished")
  VALUES (
    'The Hidden Language of Colour',
    '## The Hidden Language of Colour

Colour is far more than a visual experience — it is a powerful force that shapes our perceptions, emotions, and behaviours in ways we rarely notice. Across different cultures and contexts, colours carry meanings that can vary dramatically, making colour one of the most complex and fascinating aspects of human communication.

In Western cultures, white is typically associated with purity and weddings, while in many East Asian cultures it is traditionally linked to mourning. Red, universally recognised as energetic and attention-grabbing, is used in fast-food logos to stimulate appetite, while blue is favoured by banks and technology companies to convey trust and stability.

Research in colour psychology has demonstrated that exposure to certain colours can measurably affect physiological responses. Studies show that the colour red increases heart rate and can boost performance in competitive tasks, whereas blue environments tend to enhance creativity and calm the nervous system.

Marketers, architects, and therapists all exploit this hidden language deliberately. The next time you walk into a shop, hospital, or restaurant, consider: whose emotional experience is being designed for you?',
    'B2', 'article', 'Science & Culture', 175,
    '[{"word":"perceptions","translation":"восприятие"},{"word":"mourning","translation":"траур"},{"word":"physiological","translation":"физиологический"},{"word":"convey","translation":"передавать"},{"word":"exploit","translation":"использовать"}]'::jsonb,
    true
  )
  RETURNING id
),
q1 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'MCQ', 'In many East Asian cultures, white is associated with...',
    '["Weddings", "Purity", "Mourning", "Good luck"]'::jsonb, 'Mourning', 10, 1
  FROM t
),
q2 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'TRUE_FALSE', 'The colour blue is said to boost performance in competitive tasks.', NULL, 'False', 10, 2
  FROM t
),
q3 AS (
  INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
  SELECT id, 'FILL', 'Red is used in fast-food logos to stimulate ___.', NULL, 'appetite', 10, 3
  FROM t
)
INSERT INTO "ReadingQuestion" ("textId", type, question, options, answer, points, "order")
SELECT id, 'MCQ', 'Why do banks often use blue in their branding?',
  '["To stimulate spending", "To convey trust and stability", "To increase heart rate", "To attract young customers"]'::jsonb,
  'To convey trust and stability', 10, 4
FROM t;
