/**
 * Mini-game level catalogue for /student/game.
 *
 * 10 worlds of growing difficulty (A1 → S2). Each level's question pool is
 * ≥ 2× the sample size so retries don't repeat the same set (anti-abuse).
 *
 * Four task formats mixed:
 *   - QUIZ_CHOICE   — pick one of 4 options (instant grading)
 *   - TYPE_ANSWER   — free-text input, matched against acceptedAnswers (case-insensitive)
 *   - SPEAK_PROMPT  — speak the target phrase (Web Speech API, similarity ≥ 75)
 *   - LISTEN_TYPE   — TTS plays audio, student types what they heard
 *
 * Pass threshold per level: 80% correct.
 * IDs of the original 4 levels (level-1-greetings, level-2-daily-life,
 * level-3-past-present, level-4-conversations) are preserved so existing
 * GameAttempt history stays linked; their `order` is shuffled to fit the
 * new difficulty curve.
 */

export type GameLevelTier = 'A1' | 'A2' | 'S1' | 'S2'

export type GameQuestion
  = | {
    id: string
    format: 'QUIZ_CHOICE'
    prompt: string
    promptRu?: string
    options: string[]
    correctIndex: number
    explanation?: string
  }
  | {
    id: string
    format: 'TYPE_ANSWER'
    prompt: string
    promptRu?: string
    /** Lower-cased and trimmed before comparison. List all valid spellings. */
    acceptedAnswers: string[]
    explanation?: string
  }
  | {
    id: string
    format: 'SPEAK_PROMPT'
    prompt: string
    promptRu?: string
    /** What the student must say aloud. */
    target: string
    explanation?: string
  }
  | {
    id: string
    format: 'LISTEN_TYPE'
    /** Russian instruction shown to student */
    prompt: string
    promptRu?: string
    /** English text TTS speaks (the audio). Student must type this (or any acceptedAnswer). */
    audio: string
    /** Lower-cased and trimmed before comparison. */
    acceptedAnswers: string[]
    explanation?: string
  }

export interface GameLevel {
  id: string
  order: number
  tier: GameLevelTier
  title: string
  emoji: string
  /** Short Russian description shown on the path */
  description: string
  /** XP awarded for first pass (≥80%) */
  xpReward: number
  /** Bonus XP for perfect run (100%) */
  perfectBonusXp: number
  /** N random questions sampled per attempt */
  questionsPerAttempt: number
  /** Full question pool — must be ≥ 2× questionsPerAttempt */
  questions: GameQuestion[]
}

export const GAME_LEVELS: GameLevel[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — A1 — First Words & Greetings (easiest, choice + type only)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-1-greetings',
    order: 1,
    tier: 'A1',
    title: 'First Words & Greetings',
    emoji: '👋',
    description: 'Поздоровайся и представься по-английски',
    xpReward: 50,
    perfectBonusXp: 25,
    questionsPerAttempt: 5,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: 'How do you say «Привет» in English?', options: ['Goodbye', 'Hello', 'Thanks', 'Sorry'], correctIndex: 1 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: 'What does «My name is Anna» mean?', options: ['Меня зовут Анна', 'Я ищу Анну', 'Это Анна', 'Анна здесь?'], correctIndex: 0 },
      { id: 'q3', format: 'QUIZ_CHOICE', prompt: 'Choose the correct greeting in the morning:', options: ['Good night', 'Good evening', 'Good morning', 'Good luck'], correctIndex: 2 },
      { id: 'q4', format: 'QUIZ_CHOICE', prompt: '«Nice to meet you» — это…', options: ['До скорой встречи', 'Приятно познакомиться', 'Извини, не помню', 'Давно не виделись'], correctIndex: 1 },
      { id: 'q5', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «Спасибо»', acceptedAnswers: ['thanks', 'thank you', 'thank you very much'] },
      { id: 'q6', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «До свидания»', acceptedAnswers: ['goodbye', 'bye', 'bye-bye', 'see you'] },
      { id: 'q7', format: 'QUIZ_CHOICE', prompt: 'How are you? — …', options: ['I am 10', 'I am fine, thanks', 'My name is Tom', 'Yes, please'], correctIndex: 1 },
      { id: 'q8', format: 'QUIZ_CHOICE', prompt: '«Sorry» — это…', options: ['Спасибо', 'Пожалуйста', 'Извини', 'Привет'], correctIndex: 2 },
      { id: 'q9', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «Да»', acceptedAnswers: ['yes', 'yeah', 'yep'] },
      { id: 'q10', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «Нет»', acceptedAnswers: ['no', 'nope'] },
      { id: 'q11', format: 'QUIZ_CHOICE', prompt: 'Choose: «Меня зовут Том»', options: ['Tom is here', 'I am Tom', 'It is Tom', 'My name is Tom'], correctIndex: 3 },
      { id: 'q12', format: 'QUIZ_CHOICE', prompt: 'Choose: «Сколько тебе лет?»', options: ['Where are you?', 'How are you?', 'How old are you?', 'What is your name?'], correctIndex: 2 }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — A1 — Daily Life (adds SPEAK)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-2-daily-life',
    order: 2,
    tier: 'A1',
    title: 'Daily Life',
    emoji: '☀️',
    description: 'Утро, еда, школа — простые слова на каждый день',
    xpReward: 75,
    perfectBonusXp: 35,
    questionsPerAttempt: 6,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: 'What does «I wake up at 7» mean?', options: ['Я ужинаю в 7', 'Я просыпаюсь в 7', 'Я работаю с 7', 'Мне 7 лет'], correctIndex: 1 },
      { id: 'q2', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «завтрак»', acceptedAnswers: ['breakfast'] },
      { id: 'q3', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «школа»', acceptedAnswers: ['school'] },
      { id: 'q4', format: 'QUIZ_CHOICE', prompt: 'Choose the correct sentence:', options: ['I eats breakfast', 'I eat breakfast', 'I eating breakfast', 'I am eat breakfast'], correctIndex: 1 },
      { id: 'q5', format: 'QUIZ_CHOICE', prompt: '«It is sunny today» = ?', options: ['Сегодня дождь', 'Сегодня солнечно', 'Сегодня снег', 'Сегодня ветрено'], correctIndex: 1 },
      { id: 'q6', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'I have breakfast at eight' },
      { id: 'q7', format: 'TYPE_ANSWER', prompt: 'Напиши: «вода»', acceptedAnswers: ['water'] },
      { id: 'q8', format: 'QUIZ_CHOICE', prompt: '«I go to school by bus» — это…', options: ['Я хожу в школу пешком', 'Я еду в школу на автобусе', 'Я еду на автобусе в город', 'Я люблю автобусы'], correctIndex: 1 },
      { id: 'q9', format: 'TYPE_ANSWER', prompt: 'Напиши по-английски: «обед»', acceptedAnswers: ['lunch'] },
      { id: 'q10', format: 'QUIZ_CHOICE', prompt: 'Choose: «У меня есть собака»', options: ['I am a dog', 'I have a dog', 'I has a dog', 'I have dog'], correctIndex: 1 },
      { id: 'q11', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'My favourite colour is blue' },
      { id: 'q12', format: 'QUIZ_CHOICE', prompt: '«After lunch I play football» = ?', options: ['До обеда я играю в футбол', 'После обеда я играю в футбол', 'Я обедаю и играю в футбол', 'Я не играю в футбол'], correctIndex: 1 }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — A1/A2 — Numbers, Time & Dates (introduces LISTEN_TYPE)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-numbers-time',
    order: 3,
    tier: 'A1',
    title: 'Numbers, Time & Dates',
    emoji: '🔢',
    description: 'Учись слышать числа, время и даты на слух',
    xpReward: 90,
    perfectBonusXp: 40,
    questionsPerAttempt: 6,
    questions: [
      { id: 'q1', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай число', audio: 'fifteen', acceptedAnswers: ['fifteen', '15'] },
      { id: 'q2', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай число', audio: 'twenty-three', acceptedAnswers: ['twenty-three', 'twenty three', '23'] },
      { id: 'q3', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай число', audio: 'one hundred', acceptedAnswers: ['one hundred', '100', 'a hundred'] },
      { id: 'q4', format: 'QUIZ_CHOICE', prompt: 'How do you say 8:30 in English?', options: ['Eight thirty', 'Half past nine', 'Quarter to nine', 'Eight fifteen'], correctIndex: 0 },
      { id: 'q5', format: 'QUIZ_CHOICE', prompt: '«Quarter past six» — это…', options: ['5:45', '6:15', '6:45', '6:30'], correctIndex: 1 },
      { id: 'q6', format: 'QUIZ_CHOICE', prompt: '«Half past ten» — это…', options: ['10:00', '10:15', '10:30', '10:45'], correctIndex: 2 },
      { id: 'q7', format: 'TYPE_ANSWER', prompt: 'Напиши число словами: 12', acceptedAnswers: ['twelve'] },
      { id: 'q8', format: 'TYPE_ANSWER', prompt: 'Напиши число словами: 30', acceptedAnswers: ['thirty'] },
      { id: 'q9', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай день недели', audio: 'Wednesday', acceptedAnswers: ['wednesday'] },
      { id: 'q10', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай месяц', audio: 'September', acceptedAnswers: ['september'] },
      { id: 'q11', format: 'QUIZ_CHOICE', prompt: 'What is «вторник» in English?', options: ['Monday', 'Tuesday', 'Thursday', 'Saturday'], correctIndex: 1 },
      { id: 'q12', format: 'TYPE_ANSWER', prompt: 'Напиши: «March» по-русски', acceptedAnswers: ['март'] }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — A2 — Listening Lab (heavy LISTEN_TYPE focus)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-listening-lab',
    order: 4,
    tier: 'A2',
    title: 'Listening Lab',
    emoji: '🎧',
    description: 'Прокачай ухо: слушай фразу — печатай услышанное',
    xpReward: 100,
    perfectBonusXp: 50,
    questionsPerAttempt: 6,
    questions: [
      { id: 'q1', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай слово', audio: 'mountain', acceptedAnswers: ['mountain'] },
      { id: 'q2', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай слово', audio: 'restaurant', acceptedAnswers: ['restaurant'] },
      { id: 'q3', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай слово', audio: 'beautiful', acceptedAnswers: ['beautiful'] },
      { id: 'q4', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай фразу', audio: 'I have a cat', acceptedAnswers: ['i have a cat'] },
      { id: 'q5', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай фразу', audio: 'The book is on the table', acceptedAnswers: ['the book is on the table'] },
      { id: 'q6', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай фразу', audio: 'She likes coffee', acceptedAnswers: ['she likes coffee'] },
      { id: 'q7', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'umbrella', acceptedAnswers: ['umbrella'] },
      { id: 'q8', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'science', acceptedAnswers: ['science'] },
      { id: 'q9', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай фразу', audio: 'My brother plays football', acceptedAnswers: ['my brother plays football'] },
      { id: 'q10', format: 'TYPE_ANSWER', prompt: 'Напиши слово: «зонт» по-английски', acceptedAnswers: ['umbrella'] },
      { id: 'q11', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'We are at school', acceptedAnswers: ['we are at school'] },
      { id: 'q12', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'chocolate cake', acceptedAnswers: ['chocolate cake'] },
      { id: 'q13', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'Tuesday morning', acceptedAnswers: ['tuesday morning'] },
      { id: 'q14', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'beach holiday', acceptedAnswers: ['beach holiday'] }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — A2 — Past Simple (was the original L3 — keeps its ID)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-3-past-present',
    order: 5,
    tier: 'A2',
    title: 'Talking About Yesterday',
    emoji: '⏪',
    description: 'Past Simple — неправильные глаголы и истории из вчера',
    xpReward: 110,
    perfectBonusXp: 55,
    questionsPerAttempt: 7,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: 'I _____ to London last summer.', options: ['go', 'went', 'gone', 'going'], correctIndex: 1 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: 'She _____ a book yesterday.', options: ['reads', 'readed', 'read', 'is reading'], correctIndex: 2, explanation: '«Read» в past simple пишется так же, но звучит как /red/' },
      { id: 'q3', format: 'TYPE_ANSWER', prompt: 'Past simple of «buy» — ?', acceptedAnswers: ['bought'] },
      { id: 'q4', format: 'TYPE_ANSWER', prompt: 'Past simple of «think» — ?', acceptedAnswers: ['thought'] },
      { id: 'q5', format: 'QUIZ_CHOICE', prompt: '«We saw a great film» = ?', options: ['Мы посмотрим фильм', 'Мы посмотрели отличный фильм', 'Мы пишем о фильме', 'Мы любим фильмы'], correctIndex: 1 },
      { id: 'q6', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'I went to school yesterday' },
      { id: 'q7', format: 'QUIZ_CHOICE', prompt: 'They _____ home at six.', options: ['comed', 'came', 'come', 'comming'], correctIndex: 1 },
      { id: 'q8', format: 'TYPE_ANSWER', prompt: 'Past simple of «catch» — ?', acceptedAnswers: ['caught'] },
      { id: 'q9', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'She bought new shoes' },
      { id: 'q10', format: 'QUIZ_CHOICE', prompt: '_____ you see Tom yesterday?', options: ['Do', 'Did', 'Does', 'Are'], correctIndex: 1 },
      { id: 'q11', format: 'TYPE_ANSWER', prompt: 'Past simple of «speak» — ?', acceptedAnswers: ['spoke'] },
      { id: 'q12', format: 'QUIZ_CHOICE', prompt: '«My father taught me» = ?', options: ['Папа меня тронул', 'Папа меня научил', 'Папа меня позвал', 'Папа меня услышал'], correctIndex: 1 },
      { id: 'q13', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай Past Simple', audio: 'I went to the cinema', acceptedAnswers: ['i went to the cinema'] },
      { id: 'q14', format: 'TYPE_ANSWER', prompt: 'Past simple of «bring» — ?', acceptedAnswers: ['brought'] }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 6 — S1 — Present Perfect & Continuous (new tense territory)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-present-perfect',
    order: 6,
    tier: 'S1',
    title: 'Present Perfect & Continuous',
    emoji: '⏳',
    description: 'Уже сделал или ещё делаю? «Have you ever…?» и компания',
    xpReward: 130,
    perfectBonusXp: 60,
    questionsPerAttempt: 7,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: 'I _____ already _____ my homework.', options: ['have / done', 'has / done', 'am / doing', 'did / do'], correctIndex: 0 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: 'She _____ to Paris three times.', options: ['has been', 'has gone', 'have been', 'is being'], correctIndex: 0 },
      { id: 'q3', format: 'TYPE_ANSWER', prompt: 'Past participle of «see» — ?', acceptedAnswers: ['seen'] },
      { id: 'q4', format: 'TYPE_ANSWER', prompt: 'Past participle of «take» — ?', acceptedAnswers: ['taken'] },
      { id: 'q5', format: 'QUIZ_CHOICE', prompt: '«Have you ever been to London?» = ?', options: ['Ты сейчас в Лондоне?', 'Ты когда-нибудь был в Лондоне?', 'Ты любишь Лондон?', 'Ты собираешься в Лондон?'], correctIndex: 1 },
      { id: 'q6', format: 'QUIZ_CHOICE', prompt: 'How long _____ you _____ here?', options: ['do / live', 'are / live', 'have / lived', 'did / live'], correctIndex: 2 },
      { id: 'q7', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'I have just finished my work' },
      { id: 'q8', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'I have been waiting for an hour', acceptedAnswers: ['i have been waiting for an hour'] },
      { id: 'q9', format: 'QUIZ_CHOICE', prompt: 'Choose the right form: «She _____ TV for two hours.»', options: ['watches', 'has watched', 'has been watching', 'is watch'], correctIndex: 2 },
      { id: 'q10', format: 'TYPE_ANSWER', prompt: 'Past participle of «write» — ?', acceptedAnswers: ['written'] },
      { id: 'q11', format: 'QUIZ_CHOICE', prompt: '«I have lost my keys» — это про…', options: ['Прошлый день', 'Будущее', 'Сейчас (потерял и не нашёл)', 'Долгое прошлое'], correctIndex: 2 },
      { id: 'q12', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'They have known each other for years' },
      { id: 'q13', format: 'QUIZ_CHOICE', prompt: 'I _____ him since 2020.', options: ['know', 'knew', 'have known', 'am knowing'], correctIndex: 2 },
      { id: 'q14', format: 'TYPE_ANSWER', prompt: 'Past participle of «break» — ?', acceptedAnswers: ['broken'] }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 7 — S1 — Conditionals & Modals
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-conditionals',
    order: 7,
    tier: 'S1',
    title: 'If, Could, Should',
    emoji: '🌀',
    description: 'Условные предложения и модальные глаголы',
    xpReward: 150,
    perfectBonusXp: 70,
    questionsPerAttempt: 7,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: 'If it _____ tomorrow, we _____ stay home.', options: ['rain / will', 'rains / will', 'will rain / will', 'rains / would'], correctIndex: 1 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: 'If I _____ rich, I _____ travel the world.', options: ['am / will', 'were / would', 'was / will', 'be / would'], correctIndex: 1 },
      { id: 'q3', format: 'QUIZ_CHOICE', prompt: 'You _____ smoke here — it is forbidden.', options: ['can', 'must not', 'should', 'might'], correctIndex: 1 },
      { id: 'q4', format: 'QUIZ_CHOICE', prompt: '«You should see a doctor» = ?', options: ['Тебе нужно видеть врача', 'Тебе стоит сходить к врачу', 'Ты увидишь врача', 'Ты можешь к врачу'], correctIndex: 1 },
      { id: 'q5', format: 'TYPE_ANSWER', prompt: 'Закончи: «If I were you, I _____ go» (would?)', acceptedAnswers: ['would'] },
      { id: 'q6', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'If I had time, I would help you', acceptedAnswers: ['if i had time i would help you'] },
      { id: 'q7', format: 'QUIZ_CHOICE', prompt: '«I might come later» — это про…', options: ['Точно приду', 'Возможно приду', 'Не приду', 'Уже пришёл'], correctIndex: 1 },
      { id: 'q8', format: 'QUIZ_CHOICE', prompt: 'Choose: «Ему пришлось работать»', options: ['He must work', 'He had to work', 'He should work', 'He can work'], correctIndex: 1 },
      { id: 'q9', format: 'TYPE_ANSWER', prompt: 'Past form of «can» — ?', acceptedAnswers: ['could'] },
      { id: 'q10', format: 'QUIZ_CHOICE', prompt: 'If you _____ studied, you _____ passed.', options: ['had / would have', 'have / would', 'were / would', 'did / will'], correctIndex: 0 },
      { id: 'q11', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'You should have called me', acceptedAnswers: ['you should have called me'] },
      { id: 'q12', format: 'QUIZ_CHOICE', prompt: '«You could have told me» — это про…', options: ['Будущее', 'Упущенную возможность', 'Настоящее', 'Просьбу'], correctIndex: 1 },
      { id: 'q13', format: 'TYPE_ANSWER', prompt: 'Полная форма «can\'t» — ?', acceptedAnswers: ['cannot', 'can not'] },
      { id: 'q14', format: 'QUIZ_CHOICE', prompt: '«Could you pass me the salt?» — это…', options: ['Команда', 'Вежливая просьба', 'Угроза', 'Вопрос о способности'], correctIndex: 1 }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 8 — S1 — British Idioms & Conversations (original L4 — keeps ID)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-4-conversations',
    order: 8,
    tier: 'S1',
    title: 'Real Conversations & Idioms',
    emoji: '💬',
    description: 'Фразы и идиомы из британского английского',
    xpReward: 170,
    perfectBonusXp: 80,
    questionsPerAttempt: 7,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: '«It is raining cats and dogs» = ?', options: ['Идёт дождь из животных', 'Льёт как из ведра', 'Кошки и собаки на улице', 'Холодно как у собаки'], correctIndex: 1 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: '«A piece of cake» = ?', options: ['Кусочек торта', 'Проще простого', 'Дорого', 'Очень вкусно'], correctIndex: 1 },
      { id: 'q3', format: 'TYPE_ANSWER', prompt: 'Закончи: «Break a ___!»  (Удачи!)', acceptedAnswers: ['leg'] },
      { id: 'q4', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух (вежливый ответ):', target: 'I am afraid I have to disagree' },
      { id: 'q5', format: 'QUIZ_CHOICE', prompt: '«Could you elaborate?» = ?', options: ['Можешь повторить?', 'Можешь говорить тише?', 'Можешь уточнить?', 'Можешь подождать?'], correctIndex: 2 },
      { id: 'q6', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'I look forward to hearing from you' },
      { id: 'q7', format: 'TYPE_ANSWER', prompt: 'Закончи: «Let us touch ___ next week»  (свяжемся на след. неделе)', acceptedAnswers: ['base'] },
      { id: 'q8', format: 'QUIZ_CHOICE', prompt: '«Under the weather» = ?', options: ['Прячусь от погоды', 'Неважно себя чувствую', 'Жду хорошей погоды', 'Промок насквозь'], correctIndex: 1 },
      { id: 'q9', format: 'QUIZ_CHOICE', prompt: '«We are on the same page» = ?', options: ['Мы читаем одну книгу', 'Мы понимаем друг друга', 'Мы согласились на встрече', 'Мы на одной странице сайта'], correctIndex: 1 },
      { id: 'q10', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'It depends on the situation' },
      { id: 'q11', format: 'TYPE_ANSWER', prompt: 'Закончи фразу: «In my ___, it is the best option»  (по моему мнению)', acceptedAnswers: ['opinion'] },
      { id: 'q12', format: 'QUIZ_CHOICE', prompt: '«Once in a blue moon» = ?', options: ['Однажды ночью', 'Очень редко', 'Часто', 'Никогда'], correctIndex: 1 },
      { id: 'q13', format: 'QUIZ_CHOICE', prompt: '«Hit the nail on the head» = ?', options: ['Удариться головой', 'Попасть в точку', 'Молотком работать', 'Запутаться'], correctIndex: 1 },
      { id: 'q14', format: 'TYPE_ANSWER', prompt: 'Закончи: «Spill the ___»  (выдать секрет)', acceptedAnswers: ['beans'] }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 9 — S2 — Phrasal Verbs
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-phrasal-verbs',
    order: 9,
    tier: 'S2',
    title: 'Phrasal Verbs',
    emoji: '🧩',
    description: 'Get up, look after, run out of… фразовые глаголы по-настоящему',
    xpReward: 200,
    perfectBonusXp: 100,
    questionsPerAttempt: 8,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: 'I usually _____ at 7am.', options: ['get up', 'get on', 'get out', 'get off'], correctIndex: 0 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: 'She _____ her grandmother every weekend.', options: ['looks at', 'looks after', 'looks for', 'looks up'], correctIndex: 1 },
      { id: 'q3', format: 'QUIZ_CHOICE', prompt: 'We _____ milk. Can you buy some?', options: ['ran out of', 'ran into', 'ran up to', 'ran over'], correctIndex: 0 },
      { id: 'q4', format: 'TYPE_ANSWER', prompt: 'Phrasal verb: «отменить» — call ___', acceptedAnswers: ['off'] },
      { id: 'q5', format: 'TYPE_ANSWER', prompt: 'Phrasal verb: «продолжать» — carry ___', acceptedAnswers: ['on'] },
      { id: 'q6', format: 'QUIZ_CHOICE', prompt: '«Turn down the music» = ?', options: ['Включи громче', 'Сделай тише', 'Выключи совсем', 'Поменяй песню'], correctIndex: 1 },
      { id: 'q7', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'Please look after my dog' },
      { id: 'q8', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'I give up trying', acceptedAnswers: ['i give up trying'] },
      { id: 'q9', format: 'QUIZ_CHOICE', prompt: '«Put off the meeting» = ?', options: ['Отменить встречу', 'Перенести встречу', 'Начать встречу', 'Уйти со встречи'], correctIndex: 1 },
      { id: 'q10', format: 'TYPE_ANSWER', prompt: 'Phrasal verb: «вырасти» — grow ___', acceptedAnswers: ['up'] },
      { id: 'q11', format: 'QUIZ_CHOICE', prompt: '«I came across an old photo» = ?', options: ['Я выбросил фото', 'Я случайно нашёл фото', 'Я сфотографировал', 'Я ищу фото'], correctIndex: 1 },
      { id: 'q12', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'She broke up with him', acceptedAnswers: ['she broke up with him'] },
      { id: 'q13', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'I will pick you up at six' },
      { id: 'q14', format: 'QUIZ_CHOICE', prompt: '«Make up your mind» = ?', options: ['Запомни', 'Прими решение', 'Придумай историю', 'Поменяй мнение'], correctIndex: 1 },
      { id: 'q15', format: 'TYPE_ANSWER', prompt: 'Phrasal verb: «забрать (с собой)» — take ___', acceptedAnswers: ['away'] },
      { id: 'q16', format: 'QUIZ_CHOICE', prompt: '«The plane took off at noon» — «took off» = ?', options: ['приземлился', 'взлетел', 'опоздал', 'был задержан'], correctIndex: 1 }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LEVEL 10 — S2 — Business & Formal English (hardest, all formats)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'level-business',
    order: 10,
    tier: 'S2',
    title: 'Business & Formal English',
    emoji: '💼',
    description: 'Презентации, email, переговоры — взрослый английский',
    xpReward: 250,
    perfectBonusXp: 125,
    questionsPerAttempt: 8,
    questions: [
      { id: 'q1', format: 'QUIZ_CHOICE', prompt: '«We need to think outside the box» = ?', options: ['Нужно думать в коробке', 'Нужно мыслить нестандартно', 'Нужно работать дома', 'Нужно сменить работу'], correctIndex: 1 },
      { id: 'q2', format: 'QUIZ_CHOICE', prompt: '«It is a win-win situation» = ?', options: ['Все проиграют', 'Все выиграют', 'Я выиграю', 'Сложная ситуация'], correctIndex: 1 },
      { id: 'q3', format: 'TYPE_ANSWER', prompt: 'Закончи email: «Best ___»  (С наилучшими пожеланиями)', acceptedAnswers: ['regards'] },
      { id: 'q4', format: 'TYPE_ANSWER', prompt: 'Закончи email: «Yours ___»  (С уважением, формально)', acceptedAnswers: ['sincerely', 'faithfully'] },
      { id: 'q5', format: 'QUIZ_CHOICE', prompt: '«Let us touch base next week» = ?', options: ['Встретимся вживую', 'Свяжемся на след. неделе', 'Подпишем договор', 'Сменим тему'], correctIndex: 1 },
      { id: 'q6', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух (фраза с презентации):', target: 'Let us get started, shall we' },
      { id: 'q7', format: 'LISTEN_TYPE', prompt: 'Прослушай формальную фразу и напечатай', audio: 'I look forward to hearing from you', acceptedAnswers: ['i look forward to hearing from you'] },
      { id: 'q8', format: 'QUIZ_CHOICE', prompt: '«Could you elaborate on that?» = ?', options: ['Можешь это сделать?', 'Можешь уточнить?', 'Можешь повторить?', 'Можешь забыть?'], correctIndex: 1 },
      { id: 'q9', format: 'QUIZ_CHOICE', prompt: '«We are on the same page» means…', options: ['Мы читаем книгу', 'Мы понимаем друг друга', 'Мы согласны не во всём', 'Мы на одном сайте'], correctIndex: 1 },
      { id: 'q10', format: 'TYPE_ANSWER', prompt: 'Business word: «заинтересованная сторона»', acceptedAnswers: ['stakeholder', 'stakeholders'] },
      { id: 'q11', format: 'SPEAK_PROMPT', prompt: 'Скажи вслух:', target: 'I am afraid I have to disagree' },
      { id: 'q12', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'Let me get back to you on that', acceptedAnswers: ['let me get back to you on that'] },
      { id: 'q13', format: 'QUIZ_CHOICE', prompt: '«To meet a deadline» = ?', options: ['Опоздать', 'Уложиться в срок', 'Встретиться лично', 'Закончить проект'], correctIndex: 1 },
      { id: 'q14', format: 'TYPE_ANSWER', prompt: 'Business word: «ежеквартально»', acceptedAnswers: ['quarterly'] },
      { id: 'q15', format: 'QUIZ_CHOICE', prompt: '«It is in our pipeline» = ?', options: ['Уже сделано', 'В планах', 'Отменено', 'Утеряно'], correctIndex: 1 },
      { id: 'q16', format: 'LISTEN_TYPE', prompt: 'Прослушай и напечатай', audio: 'Could you please clarify your point', acceptedAnswers: ['could you please clarify your point'] }
    ]
  }
]

export const getGameLevel = (id: string) => GAME_LEVELS.find(l => l.id === id)
