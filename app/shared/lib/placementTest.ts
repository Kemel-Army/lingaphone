/**
 * Входное тестирование (placement test) — три возрастных теста.
 *
 * Содержание перенесено из методических документов Lingaphone:
 *   6–9 лет, 9–12 лет, 12–16 лет — по 7 частей в каждом.
 *
 * Части 1–5 проверяются автоматически, части 6–7 (письмо / устная речь) —
 * преподавателем: письменный ответ сохраняется в заявке, устная часть
 * проводится на пробном уроке.
 *
 * Файл чистый: только данные и подсчёт. Импортируется и страницей теста, и
 * серверным маршрутом /api/placement/submit — счёт всегда считает сервер, но
 * клиент использует те же функции, чтобы показать результат сразу.
 */

export type PlacementAgeBand = 'AGE_6_9' | 'AGE_9_12' | 'AGE_12_16'

export interface PlacementAgeBandMeta {
  value: PlacementAgeBand
  label: string
  hint: string
  icon: string
}

export const PLACEMENT_AGE_BANDS: readonly PlacementAgeBandMeta[] = [
  { value: 'AGE_6_9', label: '6–9 лет', hint: 'Начальная школа', icon: 'i-lucide-baby' },
  { value: 'AGE_9_12', label: '9–12 лет', hint: 'Средняя школа', icon: 'i-lucide-backpack' },
  { value: 'AGE_12_16', label: '12–16 лет', hint: 'Подростки', icon: 'i-lucide-graduation-cap' }
]

export const PLACEMENT_AGE_BAND_MAP: Record<PlacementAgeBand, PlacementAgeBandMeta>
  = Object.fromEntries(PLACEMENT_AGE_BANDS.map(b => [b.value, b])) as Record<PlacementAgeBand, PlacementAgeBandMeta>

// ─── Question shapes ─────────────────────────────────────────────────────────

/** Сопоставление слово ↔ перевод. Проверяется по паре целиком. */
export interface MatchQuestion {
  id: string
  kind: 'MATCH'
  part: number
  title: string
  instruction: string
  left: { id: string, label: string }[]
  right: { id: string, label: string }[]
  /** leftId -> rightId */
  key: Record<string, string>
}

/** Один вопрос — один правильный вариант. */
export interface ChoiceQuestion {
  id: string
  kind: 'CHOICE'
  part: number
  title: string
  instruction: string
  prompt: string
  options: string[]
  correctIndex: number
}

/** Слова в правильном порядке; сверяется нормализованная строка. */
export interface OrderQuestion {
  id: string
  kind: 'ORDER'
  part: number
  title: string
  instruction: string
  tiles: string[]
  accepted: string[]
}

/** Короткий ответ по тексту / трансформация. Список принимаемых вариантов. */
export interface ShortQuestion {
  id: string
  kind: 'SHORT'
  part: number
  title: string
  instruction: string
  passage?: string
  prompt: string
  accepted: string[]
}

/** Развёрнутый ответ — не оценивается автоматически, уходит преподавателю. */
export interface OpenQuestion {
  id: string
  kind: 'OPEN'
  part: number
  title: string
  instruction: string
  passage?: string
  prompt: string
  minWords?: number
}

export type PlacementQuestion = MatchQuestion | ChoiceQuestion | OrderQuestion | ShortQuestion | OpenQuestion

export interface PlacementTestDef {
  ageBand: PlacementAgeBand
  title: string
  questions: PlacementQuestion[]
  /** Часть 7 — устно на пробном уроке, онлайн не спрашиваем. */
  speakingQuestions: string[]
}

// ─── 6–9 лет ─────────────────────────────────────────────────────────────────

const AGE_6_9: PlacementTestDef = {
  ageBand: 'AGE_6_9',
  title: 'Placement Test (6–9 лет)',
  speakingQuestions: [
    'What is your name?',
    'How old are you?',
    'Where do you live?',
    'What is your favourite colour?',
    'Do you have brothers or sisters?',
    'What animals do you like?'
  ],
  questions: [
    {
      id: 'a69-p1',
      kind: 'MATCH',
      part: 1,
      title: 'Part 1. Vocabulary — Match the words',
      instruction: 'Сопоставь английское слово и перевод.',
      left: [
        { id: 'l1', label: 'cat' },
        { id: 'l2', label: 'school' },
        { id: 'l3', label: 'apple' },
        { id: 'l4', label: 'mother' },
        { id: 'l5', label: 'book' }
      ],
      right: [
        { id: 'r1', label: 'яблоко' },
        { id: 'r2', label: 'кошка' },
        { id: 'r3', label: 'школа' },
        { id: 'r4', label: 'книга' },
        { id: 'r5', label: 'мама' }
      ],
      key: { l1: 'r2', l2: 'r3', l3: 'r1', l4: 'r5', l5: 'r4' }
    },
    // В документе к этому пункту прилагалась картинка. Здесь подсказка вынесена
    // в текст, чтобы вопрос оставался решаемым без иллюстрации.
    {
      id: 'a69-p2-1',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct word',
      instruction: 'Выбери правильный вариант.',
      prompt: 'It is an animal. It is a ___',
      options: ['dog', 'banana', 'pencil'],
      correctIndex: 0
    },
    {
      id: 'a69-p2-2',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct word',
      instruction: 'Выбери правильный вариант.',
      prompt: 'I can see a ___',
      options: ['chair', 'run', 'happy'],
      correctIndex: 0
    },
    {
      id: 'a69-p2-3',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct word',
      instruction: 'Выбери правильный вариант.',
      prompt: 'This is my ___',
      options: ['sister', 'jump', 'blue'],
      correctIndex: 0
    },
    {
      id: 'a69-p3-1',
      kind: 'SHORT',
      part: 3,
      title: 'Part 3. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      passage: 'My name is Tom.\nI am 8 years old.\nI have a dog.\nIts name is Max.\nI like playing with my dog.',
      prompt: 'What is the boy’s name?',
      accepted: ['tom', 'his name is tom', 'the boy is tom']
    },
    {
      id: 'a69-p3-2',
      kind: 'SHORT',
      part: 3,
      title: 'Part 3. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      prompt: 'How old is Tom?',
      accepted: ['8', 'eight', 'he is 8', 'he is eight', '8 years old', 'eight years old']
    },
    {
      id: 'a69-p3-3',
      kind: 'SHORT',
      part: 3,
      title: 'Part 3. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      prompt: 'Does Tom have a dog?',
      accepted: ['yes', 'yes he does', 'yes he has a dog', 'he does']
    },
    {
      id: 'a69-p3-4',
      kind: 'SHORT',
      part: 3,
      title: 'Part 3. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      prompt: 'What is the dog’s name?',
      accepted: ['max', 'its name is max', 'the dog is max']
    },
    {
      id: 'a69-p4-1',
      kind: 'CHOICE',
      part: 4,
      title: 'Part 4. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'I ___ a student.',
      options: ['am', 'is', 'are'],
      correctIndex: 0
    },
    {
      id: 'a69-p4-2',
      kind: 'CHOICE',
      part: 4,
      title: 'Part 4. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'She ___ my friend.',
      options: ['am', 'is', 'are'],
      correctIndex: 1
    },
    {
      id: 'a69-p4-3',
      kind: 'CHOICE',
      part: 4,
      title: 'Part 4. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'They ___ happy.',
      options: ['am', 'is', 'are'],
      correctIndex: 2
    },
    {
      id: 'a69-p4-4',
      kind: 'CHOICE',
      part: 4,
      title: 'Part 4. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'This ___ a cat.',
      options: ['am', 'is', 'are'],
      correctIndex: 1
    },
    {
      id: 'a69-p5-1',
      kind: 'ORDER',
      part: 5,
      title: 'Part 5. Make sentences',
      instruction: 'Составь предложение — нажимай слова по порядку.',
      tiles: ['name', 'My', 'Anna', 'is'],
      accepted: ['my name is anna']
    },
    {
      id: 'a69-p5-2',
      kind: 'ORDER',
      part: 5,
      title: 'Part 5. Make sentences',
      instruction: 'Составь предложение — нажимай слова по порядку.',
      tiles: ['dog', 'have', 'I', 'a'],
      accepted: ['i have a dog']
    },
    {
      id: 'a69-p5-3',
      kind: 'ORDER',
      part: 5,
      title: 'Part 5. Make sentences',
      instruction: 'Составь предложение — нажимай слова по порядку.',
      tiles: ['likes', 'He', 'football'],
      accepted: ['he likes football']
    },
    {
      id: 'a69-p6',
      kind: 'OPEN',
      part: 6,
      title: 'Part 6. Writing',
      instruction: 'Напиши о себе 3–5 предложений. Например: My name is Ali. I am 7 years old. I like football.',
      prompt: 'What is your name? How old are you? What do you like?',
      minWords: 8
    }
  ]
}

// ─── 9–12 лет ────────────────────────────────────────────────────────────────

const AGE_9_12: PlacementTestDef = {
  ageBand: 'AGE_9_12',
  title: 'Placement Test (9–12 лет)',
  speakingQuestions: [
    'Tell me about yourself.',
    'What do you do every day?',
    'What do you like doing after school?',
    'What did you do yesterday?',
    'Describe your best friend.'
  ],
  questions: [
    {
      id: 'a912-p1',
      kind: 'MATCH',
      part: 1,
      title: 'Part 1. Vocabulary — Match the words',
      instruction: 'Сопоставь слово и перевод.',
      left: [
        { id: 'l1', label: 'library' },
        { id: 'l2', label: 'dangerous' },
        { id: 'l3', label: 'travel' },
        { id: 'l4', label: 'interesting' },
        { id: 'l5', label: 'weather' }
      ],
      right: [
        { id: 'r1', label: 'путешествовать' },
        { id: 'r2', label: 'библиотека' },
        { id: 'r3', label: 'интересный' },
        { id: 'r4', label: 'опасный' },
        { id: 'r5', label: 'погода' }
      ],
      key: { l1: 'r2', l2: 'r4', l3: 'r1', l4: 'r3', l5: 'r5' }
    },
    {
      id: 'a912-p2-1',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'A doctor works in a ______.',
      options: ['school', 'hospital', 'cinema'],
      correctIndex: 1
    },
    {
      id: 'a912-p2-2',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'We wear this when it is cold.',
      options: ['T-shirt', 'jacket', 'shorts'],
      correctIndex: 1
    },
    {
      id: 'a912-p2-3',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'A tiger is a ______ animal.',
      options: ['wild', 'friendly', 'slow'],
      correctIndex: 0
    },
    {
      id: 'a912-p3-1',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'She ___ to school every day.',
      options: ['go', 'goes', 'going'],
      correctIndex: 1
    },
    {
      id: 'a912-p3-2',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'They ___ playing football now.',
      options: ['is', 'am', 'are'],
      correctIndex: 2
    },
    {
      id: 'a912-p3-3',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'Yesterday I ___ a movie.',
      options: ['watch', 'watched', 'watching'],
      correctIndex: 1
    },
    {
      id: 'a912-p3-4',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'We ___ dinner at 7 p.m. every day.',
      options: ['have', 'has', 'having'],
      correctIndex: 0
    },
    {
      id: 'a912-p3-5',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'There ___ two books on the table.',
      options: ['is', 'are', 'am'],
      correctIndex: 1
    },
    {
      id: 'a912-p4-1',
      kind: 'SHORT',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      passage: 'Hello! My name is Emma. I am 11 years old. I live in London with my family. I have a younger brother. His name is Ben.\n'
        + 'I like reading books and playing volleyball. My favourite subject at school is English because I enjoy learning new words.\n'
        + 'At weekends, I usually visit my grandparents or go to the park with my friends.',
      prompt: 'How old is Emma?',
      accepted: ['11', 'eleven', 'she is 11', 'she is eleven', '11 years old', 'eleven years old']
    },
    {
      id: 'a912-p4-2',
      kind: 'SHORT',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      prompt: 'Where does she live?',
      accepted: ['london', 'in london', 'she lives in london']
    },
    {
      id: 'a912-p4-3',
      kind: 'SHORT',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      prompt: 'Does she have a sister?',
      accepted: ['no', 'no she does not', 'no she doesnt', 'no she has a brother', 'she has a brother']
    },
    {
      id: 'a912-p4-4',
      kind: 'SHORT',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      prompt: 'What is her favourite subject?',
      accepted: ['english', 'her favourite subject is english', 'her favorite subject is english']
    },
    {
      id: 'a912-p4-5',
      kind: 'OPEN',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Ответь развёрнуто.',
      prompt: 'What does she do at weekends?'
    },
    {
      id: 'a912-p5-1',
      kind: 'ORDER',
      part: 5,
      title: 'Part 5. Sentence Writing',
      instruction: 'Составь предложение — нажимай слова по порядку.',
      tiles: ['usually', 'I', 'school', 'walk', 'to'],
      accepted: ['i usually walk to school']
    },
    {
      id: 'a912-p5-2',
      kind: 'ORDER',
      part: 5,
      title: 'Part 5. Sentence Writing',
      instruction: 'Составь предложение — нажимай слова по порядку.',
      tiles: ['playing', 'They', 'now', 'are', 'basketball'],
      accepted: ['they are playing basketball now']
    },
    {
      id: 'a912-p5-3',
      kind: 'ORDER',
      part: 5,
      title: 'Part 5. Sentence Writing',
      instruction: 'Составь предложение — нажимай слова по порядку.',
      tiles: ['yesterday', 'visited', 'grandmother', 'We', 'our'],
      accepted: ['we visited our grandmother yesterday']
    },
    {
      id: 'a912-p6',
      kind: 'OPEN',
      part: 6,
      title: 'Part 6. Writing',
      instruction: 'Напиши о себе 5–7 предложений.',
      prompt: 'What is your name? How old are you? Where do you live? What do you like doing? What is your favourite school subject?',
      minWords: 20
    }
  ]
}

// ─── 12–16 лет ───────────────────────────────────────────────────────────────

const AGE_12_16: PlacementTestDef = {
  ageBand: 'AGE_12_16',
  title: 'Placement Test (12–16 лет)',
  speakingQuestions: [
    'Tell me about yourself.',
    'What do you usually do after school?',
    'What are your future plans?',
    'What are the advantages and disadvantages of technology?',
    'Describe a memorable day in your life.'
  ],
  questions: [
    {
      id: 'a1216-p1',
      kind: 'MATCH',
      part: 1,
      title: 'Part 1. Vocabulary — Match the words',
      instruction: 'Сопоставь слово и перевод.',
      left: [
        { id: 'l1', label: 'achieve' },
        { id: 'l2', label: 'opportunity' },
        { id: 'l3', label: 'improve' },
        { id: 'l4', label: 'confident' },
        { id: 'l5', label: 'environment' }
      ],
      right: [
        { id: 'r1', label: 'возможность' },
        { id: 'r2', label: 'улучшать' },
        { id: 'r3', label: 'достигать' },
        { id: 'r4', label: 'уверенный' },
        { id: 'r5', label: 'окружающая среда' }
      ],
      key: { l1: 'r3', l2: 'r1', l3: 'r2', l4: 'r4', l5: 'r5' }
    },
    {
      id: 'a1216-p2-1',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'If you want to stay healthy, you should ______ regularly.',
      options: ['exercise', 'sleep late', 'shout'],
      correctIndex: 0
    },
    {
      id: 'a1216-p2-2',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'People should protect the ______.',
      options: ['homework', 'environment', 'classroom'],
      correctIndex: 1
    },
    {
      id: 'a1216-p2-3',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'My sister is very ______. She speaks to everyone easily.',
      options: ['shy', 'confident', 'lazy'],
      correctIndex: 1
    },
    {
      id: 'a1216-p2-4',
      kind: 'CHOICE',
      part: 2,
      title: 'Part 2. Vocabulary — Choose the correct answer',
      instruction: 'Выбери правильный вариант.',
      prompt: 'We use phones to ______ with friends.',
      options: ['communicate', 'hide', 'destroy'],
      correctIndex: 0
    },
    {
      id: 'a1216-p3-1',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'She ______ English for five years.',
      options: ['studies', 'has studied', 'studied'],
      correctIndex: 1
    },
    {
      id: 'a1216-p3-2',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'I ______ TV when my friend called me.',
      options: ['watched', 'was watching', 'am watching'],
      correctIndex: 1
    },
    {
      id: 'a1216-p3-3',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'If it rains, we ______ at home.',
      options: ['stay', 'stayed', 'will stay'],
      correctIndex: 2
    },
    {
      id: 'a1216-p3-4',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'This book ______ by millions of people.',
      options: ['reads', 'is read', 'read'],
      correctIndex: 1
    },
    {
      id: 'a1216-p3-5',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'He is ______ than his brother.',
      options: ['tall', 'taller', 'tallest'],
      correctIndex: 1
    },
    {
      id: 'a1216-p3-6',
      kind: 'CHOICE',
      part: 3,
      title: 'Part 3. Grammar',
      instruction: 'Выбери правильный вариант.',
      prompt: 'They ______ to the cinema yesterday.',
      options: ['go', 'went', 'gone'],
      correctIndex: 1
    },
    {
      id: 'a1216-p4-1',
      kind: 'OPEN',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Прочитай текст и ответь на вопросы.',
      passage: 'Teenagers today spend a lot of time online. They use the internet for studying, entertainment, and communication.\n'
        + 'There are many advantages to technology. Students can find information quickly, learn new skills online, and stay connected with friends and family.\n'
        + 'However, spending too much time online can also cause problems. Some teenagers sleep less, exercise less, and become less active.\n'
        + 'Experts say that balance is important. Technology is useful, but young people should also spend time offline, doing sports, reading, or meeting friends in real life.',
      prompt: 'What do teenagers use the internet for?'
    },
    {
      id: 'a1216-p4-2',
      kind: 'OPEN',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Ответь по тексту.',
      prompt: 'Name two advantages of technology.'
    },
    {
      id: 'a1216-p4-3',
      kind: 'OPEN',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Ответь по тексту.',
      prompt: 'What problems can too much screen time cause?'
    },
    {
      id: 'a1216-p4-4',
      kind: 'OPEN',
      part: 4,
      title: 'Part 4. Reading',
      instruction: 'Ответь по тексту.',
      prompt: 'What do experts recommend?'
    },
    {
      id: 'a1216-p5-1',
      kind: 'SHORT',
      part: 5,
      title: 'Part 5. Sentence Transformation',
      instruction: 'Перепиши предложение, не меняя смысл.',
      prompt: 'I started learning English three years ago. → I have ___',
      accepted: [
        'been learning english for three years',
        'been studying english for three years',
        'learned english for three years',
        'studied english for three years',
        'i have been learning english for three years',
        'i have been studying english for three years'
      ]
    },
    {
      id: 'a1216-p5-2',
      kind: 'SHORT',
      part: 5,
      title: 'Part 5. Sentence Transformation',
      instruction: 'Перепиши предложение, не меняя смысл.',
      prompt: 'My brother is taller than me. → I am ___',
      accepted: [
        'shorter than my brother',
        'not as tall as my brother',
        'i am shorter than my brother',
        'i am not as tall as my brother'
      ]
    },
    {
      id: 'a1216-p5-3',
      kind: 'SHORT',
      part: 5,
      title: 'Part 5. Sentence Transformation',
      instruction: 'Перепиши предложение, не меняя смысл.',
      prompt: 'People speak English in many countries. → English ___',
      accepted: [
        'is spoken in many countries',
        'english is spoken in many countries'
      ]
    },
    {
      id: 'a1216-p6',
      kind: 'OPEN',
      part: 6,
      title: 'Part 6. Writing',
      instruction: 'Напиши 80–120 слов на одну из тем: 1) Describe your daily routine. 2) Talk about your favourite hobby. '
        + '3) Do you think teenagers spend too much time online? Why / Why not?',
      prompt: 'Твой ответ',
      minWords: 60
    }
  ]
}

export const PLACEMENT_TESTS: Record<PlacementAgeBand, PlacementTestDef> = {
  AGE_6_9: AGE_6_9,
  AGE_9_12: AGE_9_12,
  AGE_12_16: AGE_12_16
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/** Ответ на один вопрос. `null` = «затрудняюсь ответить». */
export type PlacementAnswer
  = | { kind: 'MATCH', pairs: Record<string, string> }
    | { kind: 'CHOICE', index: number }
    | { kind: 'ORDER', order: string[] }
    | { kind: 'SHORT', text: string }
    | { kind: 'OPEN', text: string }
    | null

export type PlacementAnswers = Record<string, PlacementAnswer>

/** Регистр, пунктуация и лишние пробелы не должны валить верный ответ. */
export const normalizeText = (s: string): string =>
  s.toLowerCase()
    .replace(/[.,!?;:'"`’“”()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Сколько баллов даёт вопрос при полностью верном ответе. */
export const questionWeight = (q: PlacementQuestion): number =>
  q.kind === 'MATCH' ? q.left.length : q.kind === 'OPEN' ? 0 : 1

/** Балл за конкретный ответ. OPEN всегда 0 — его смотрит преподаватель. */
export const scoreQuestion = (q: PlacementQuestion, a: PlacementAnswer): number => {
  if (!a) return 0
  switch (q.kind) {
    case 'MATCH':
      if (a.kind !== 'MATCH') return 0
      // Слово без ключа (дистрактор или опечатка в банке) не должно давать балл
      // за «совпадение» undefined с undefined, т.е. за неотвеченную пару.
      return q.left.reduce((sum, l) => {
        const want = q.key[l.id]
        return sum + (want !== undefined && a.pairs[l.id] === want ? 1 : 0)
      }, 0)
    case 'CHOICE':
      return a.kind === 'CHOICE' && a.index === q.correctIndex ? 1 : 0
    case 'ORDER':
      return a.kind === 'ORDER' && q.accepted.includes(normalizeText(a.order.join(' '))) ? 1 : 0
    case 'SHORT':
      return a.kind === 'SHORT' && q.accepted.map(normalizeText).includes(normalizeText(a.text)) ? 1 : 0
    case 'OPEN':
      return 0
  }
}

export interface PlacementResult {
  autoScore: number
  autoMax: number
  percent: number
  skippedCount: number
  recommendedLevel: string
  openAnswers: { questionId: string, prompt: string, text: string }[]
}

/**
 * Порог уровня внутри возрастной группы. Один и тот же процент означает разный
 * уровень у семилетки и у подростка — тесты разной сложности.
 */
const LEVEL_BY_BAND: Record<PlacementAgeBand, [string, string, string]> = {
  AGE_6_9: ['Pre-A1', 'A1', 'A2'],
  AGE_9_12: ['A1', 'A2', 'B1'],
  AGE_12_16: ['A2', 'B1', 'B2']
}

export const levelFor = (band: PlacementAgeBand, percent: number): string => {
  const [low, mid, high] = LEVEL_BY_BAND[band]
  if (percent >= 70) return high
  if (percent >= 40) return mid
  return low
}

export const scorePlacement = (band: PlacementAgeBand, answers: PlacementAnswers): PlacementResult => {
  const def = PLACEMENT_TESTS[band]
  let autoScore = 0
  let autoMax = 0
  let skippedCount = 0
  const openAnswers: PlacementResult['openAnswers'] = []

  for (const q of def.questions) {
    const a = answers[q.id] ?? null
    if (a === null) skippedCount++
    autoMax += questionWeight(q)
    autoScore += scoreQuestion(q, a)
    if (q.kind === 'OPEN') {
      openAnswers.push({ questionId: q.id, prompt: q.prompt, text: a && a.kind === 'OPEN' ? a.text : '' })
    }
  }

  const percent = autoMax === 0 ? 0 : Math.round((autoScore / autoMax) * 100)
  return { autoScore, autoMax, percent, skippedCount, recommendedLevel: levelFor(band, percent), openAnswers }
}
