/**
 * Extended mock data for Lingafon student role pages
 * (homework, materials, grades, events, certificates, messenger, word-of-day).
 *
 * Stays separate from data.ts to keep that file the core profile/group fixture
 * and this one a grab-bag of feature data.
 */

import type {
  HomeworkExtended, Material, VocabularyEntry, GradeEntry,
  SchoolEvent, StudentCertificate,
  ChatParticipant, ChatMessage, Conversation,
  WordOfTheDay, DailyQuest
} from './types'

import { MOCK_UPCOMING_LESSONS } from './data'

// ─── Homework deck (covers 4 of 6 formats — enough to demo) ──────────────

export const MOCK_HOMEWORK_LIST: HomeworkExtended[] = [
  {
    id: 'hw-test-1',
    lessonId: MOCK_UPCOMING_LESSONS[0]?.id ?? 'l-0',
    title: 'Past Simple — выбери правильную форму',
    description: '10 вопросов про употребление Past Simple. Выбери один правильный вариант.',
    format: 'TEST',
    dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    maxScore: 100,
    status: 'ASSIGNED',
    payload: {
      kind: 'TEST',
      data: {
        questions: [
          {
            id: 'q1',
            text: 'I _____ to London last summer.',
            options: [
              { id: 'a', text: 'go' },
              { id: 'b', text: 'went' },
              { id: 'c', text: 'gone' },
              { id: 'd', text: 'goes' }
            ],
            correctOptionId: 'b'
          },
          {
            id: 'q2',
            text: 'She _____ a book yesterday.',
            options: [
              { id: 'a', text: 'reads' },
              { id: 'b', text: 'read' },
              { id: 'c', text: 'readed' },
              { id: 'd', text: 'is reading' }
            ],
            correctOptionId: 'b'
          },
          {
            id: 'q3',
            text: 'We _____ at home last weekend.',
            options: [
              { id: 'a', text: 'was' },
              { id: 'b', text: 'were' },
              { id: 'c', text: 'are' },
              { id: 'd', text: 'be' }
            ],
            correctOptionId: 'b'
          },
          {
            id: 'q4',
            text: '_____ you see the new film?',
            options: [
              { id: 'a', text: 'Do' },
              { id: 'b', text: 'Did' },
              { id: 'c', text: 'Does' },
              { id: 'd', text: 'Are' }
            ],
            correctOptionId: 'b'
          }
        ]
      }
    }
  },

  {
    id: 'hw-input-1',
    lessonId: MOCK_UPCOMING_LESSONS[1]?.id ?? 'l-1',
    title: 'Vocabulary — впиши пропущенное слово',
    description: 'Заполни пропуски одним словом. Регистр не важен.',
    format: 'INPUT',
    dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    maxScore: 100,
    status: 'ASSIGNED',
    payload: {
      kind: 'INPUT',
      data: {
        questions: [
          { id: 'q1', prompt: 'A place where you can borrow books → ___', acceptableAnswers: ['library'] },
          { id: 'q2', prompt: 'The meal you eat in the morning → ___', acceptableAnswers: ['breakfast'] },
          { id: 'q3', prompt: 'Opposite of "hot" → ___', acceptableAnswers: ['cold'] },
          { id: 'q4', prompt: 'You drink it in the morning, often with milk → ___', acceptableAnswers: ['coffee', 'tea'] }
        ]
      }
    }
  },

  {
    id: 'hw-oral-1',
    lessonId: MOCK_UPCOMING_LESSONS[2]?.id ?? 'l-2',
    title: 'Speaking — повтори фразы для путешествия',
    description: 'Произнеси каждую фразу вслух. AI оценит произношение.',
    format: 'ORAL',
    dueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    maxScore: 100,
    status: 'IN_PROGRESS',
    payload: {
      kind: 'ORAL',
      data: {
        prompts: [
          { id: 'p1', target: 'Where is the bus stop?', ipa: '/weər ɪz ðə ˈbʌs stɒp/', translation: 'Где остановка автобуса?' },
          { id: 'p2', target: 'I would like a coffee, please.', ipa: '/aɪ wʊd laɪk ə ˈkɒfi pliːz/', translation: 'Я бы хотел кофе, пожалуйста.' },
          { id: 'p3', target: 'How much does it cost?', ipa: '/haʊ mʌtʃ dʌz ɪt kɒst/', translation: 'Сколько это стоит?' }
        ]
      }
    }
  },

  {
    id: 'hw-text-1',
    lessonId: MOCK_UPCOMING_LESSONS[3]?.id ?? 'l-3',
    title: 'Writing — My weekend',
    description: 'Напиши короткий текст про свои выходные. Минимум 40 слов.',
    format: 'TEXT',
    dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    maxScore: 100,
    status: 'ASSIGNED',
    payload: {
      kind: 'TEXT',
      data: {
        prompt: 'Tell me about your last weekend. What did you do? Who did you meet? Use Past Simple.',
        minWords: 40
      }
    }
  },

  {
    id: 'hw-done-1',
    lessonId: 'l-prev-1',
    title: 'Listening — пройдено на 4',
    description: 'Аудирование диалога в кафе.',
    format: 'TEST',
    dueAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    maxScore: 100,
    status: 'CHECKED',
    aiScore: 87,
    teacherGrade: 4,
    teacherComment: 'Хорошо! Внимательнее с предлогами времени.',
    payload: {
      kind: 'TEST',
      data: { questions: [] }
    }
  }
]

// ─── Materials library ───────────────────────────────────────────────────

export const MOCK_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    kind: 'AUDIO',
    title: 'Daily Routines — Listen & Repeat',
    description: 'Носитель произносит фразы. Слушай в наушниках, повторяй вслух.',
    url: '#',
    durationSec: 320,
    tag: 'headphones'
  },
  {
    id: 'mat-2',
    kind: 'AUDIO',
    title: 'Past Simple Drills',
    description: 'Слушай предложение → повторяй с правильной интонацией.',
    url: '#',
    durationSec: 480,
    tag: 'grammar'
  },
  {
    id: 'mat-3',
    kind: 'VIDEO',
    title: 'Запись урока · Past Simple (14 мая)',
    description: 'Видео прошедшего урока твоей группы. С разбором заданий.',
    url: '#',
    durationSec: 3600,
    tag: 'lesson-recording'
  },
  {
    id: 'mat-4',
    kind: 'PDF',
    title: 'Vocabulary Cards — Travel',
    description: 'Распечатай и тренируйся между уроками.',
    url: '#',
    tag: 'printable'
  },
  {
    id: 'mat-5',
    kind: 'VIDEO',
    title: 'British vs American — что выбрать?',
    description: 'Короткое видео про разницу акцентов от Lingaphone.',
    url: '#',
    durationSec: 240,
    tag: 'methodology'
  },
  {
    id: 'mat-6',
    kind: 'LINK',
    title: 'Cambridge Online Dictionary',
    description: 'Открой в новой вкладке — добавляй слова в свой словарь.',
    url: 'https://dictionary.cambridge.org',
    tag: 'reference'
  }
]

export const MOCK_VOCABULARY: VocabularyEntry[] = [
  { id: 'v1', word: 'Breakfast', ipa: '/ˈbrekfəst/', translation: 'завтрак', example: 'I have breakfast at 7.', addedAt: new Date(Date.now() - 1 * 86400000).toISOString(), reviewCount: 5, bestScore: 92 },
  { id: 'v2', word: 'Schedule', ipa: '/ˈʃedjuːl/', translation: 'расписание', example: 'My schedule is busy.', addedAt: new Date(Date.now() - 2 * 86400000).toISOString(), reviewCount: 3, bestScore: 78 },
  { id: 'v3', word: 'Library', ipa: '/ˈlaɪbrəri/', translation: 'библиотека', example: 'I read in the library.', addedAt: new Date(Date.now() - 3 * 86400000).toISOString(), reviewCount: 2, bestScore: 65 },
  { id: 'v4', word: 'Vegetable', ipa: '/ˈvedʒtəbl/', translation: 'овощ', example: 'I love vegetables.', addedAt: new Date(Date.now() - 5 * 86400000).toISOString(), reviewCount: 4, bestScore: 88 },
  { id: 'v5', word: 'Weather', ipa: '/ˈweðə/', translation: 'погода', example: 'The weather is lovely.', addedAt: new Date(Date.now() - 7 * 86400000).toISOString(), reviewCount: 6, bestScore: 95 }
]

// ─── Grade journal (last ~10 lessons) ───────────────────────────────────

export const MOCK_GRADE_HISTORY: GradeEntry[] = [
  { id: 'g1', lessonId: 'l-p-1', groupId: 'g-1', date: new Date(Date.now() - 1 * 86400000).toISOString(), topic: 'Past Simple', value: 5, comment: 'Прекрасная работа!', teacherName: 'Айсауле Б.' },
  { id: 'g2', lessonId: 'l-p-2', groupId: 'g-1', date: new Date(Date.now() - 3 * 86400000).toISOString(), topic: 'Daily routines', value: 4, teacherName: 'Айсауле Б.' },
  { id: 'g3', lessonId: 'l-p-3', groupId: 'g-2', date: new Date(Date.now() - 5 * 86400000).toISOString(), topic: 'IELTS Speaking', value: 5, comment: 'Чёткая речь, хорошая интонация.', teacherName: 'Жанель А.' },
  { id: 'g4', lessonId: 'l-p-4', groupId: 'g-1', date: new Date(Date.now() - 7 * 86400000).toISOString(), topic: 'Family vocabulary', value: 4, teacherName: 'Айсауле Б.' },
  { id: 'g5', lessonId: 'l-p-5', groupId: 'g-2', date: new Date(Date.now() - 9 * 86400000).toISOString(), topic: 'Phrasal verbs', value: 3, comment: 'Повторить материал ещё раз.', teacherName: 'Жанель А.' },
  { id: 'g6', lessonId: 'l-p-6', groupId: 'g-1', date: new Date(Date.now() - 11 * 86400000).toISOString(), topic: 'Travel phrases', value: 5, teacherName: 'Айсауле Б.' },
  { id: 'g7', lessonId: 'l-p-7', groupId: 'g-2', date: new Date(Date.now() - 14 * 86400000).toISOString(), topic: 'Conditionals', value: 4, teacherName: 'Жанель А.' },
  { id: 'g8', lessonId: 'l-p-8', groupId: 'g-1', date: new Date(Date.now() - 17 * 86400000).toISOString(), topic: 'Past Simple intro', value: 5, teacherName: 'Айсауле Б.' },
  { id: 'g9', lessonId: 'l-p-9', groupId: 'g-2', date: new Date(Date.now() - 20 * 86400000).toISOString(), topic: 'Business idioms', value: 4, teacherName: 'Жанель А.' },
  { id: 'g10', lessonId: 'l-p-10', groupId: 'g-1', date: new Date(Date.now() - 25 * 86400000).toISOString(), topic: 'Going shopping', value: 4, teacherName: 'Айсауле Б.' }
]

// ─── School events ──────────────────────────────────────────────────────

export const MOCK_EVENTS: SchoolEvent[] = [
  {
    id: 'e-summer-camp',
    kind: 'CAMP',
    title: 'Summer English Camp 2026',
    description: 'Двухнедельный языковой лагерь на Иссык-Куле. Полное погружение, носители языка, спорт и творчество.',
    startsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 44 * 86400000).toISOString(),
    price: 280000,
    capacity: 30,
    registered: 22,
    branchName: 'Выездной',
    posterEmoji: '🏕️',
    myStatus: 'OPEN'
  },
  {
    id: 'e-spring-vibes',
    kind: 'CONTEST',
    title: 'LINGA-VOICE: Spring Vibes 2026',
    description: 'Сними видео-открытку на английском к Наурызу. Победители получат сертификаты Меломан 15 000 ₸.',
    startsAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    price: 0,
    capacity: 100,
    registered: 47,
    branchName: 'Онлайн',
    posterEmoji: '🌸',
    myStatus: 'REGISTERED'
  },
  {
    id: 'e-halloween',
    kind: 'HOLIDAY',
    title: 'Halloween Workshop',
    description: 'Тематический урок с играми, костюмами и квестами. Только для учеников Lingaphone.',
    startsAt: new Date(Date.now() + 150 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 150 * 86400000).toISOString(),
    price: 5000,
    capacity: 40,
    registered: 12,
    branchName: 'Алматы — Достык',
    posterEmoji: '🎃',
    myStatus: 'OPEN'
  },
  {
    id: 'e-elf-workshop',
    kind: 'HOLIDAY',
    title: 'Elf\'s Workshop — Christmas',
    description: 'Новогодний воркшоп. Учим рождественские песни и фразы, делаем подарки.',
    startsAt: new Date(Date.now() + 220 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 220 * 86400000).toISOString(),
    price: 7500,
    capacity: 35,
    registered: 5,
    branchName: 'Алматы — Розыбакиева',
    posterEmoji: '🎄',
    myStatus: 'OPEN'
  }
]

// ─── Certificates ────────────────────────────────────────────────────────

export const MOCK_CERTIFICATES: StudentCertificate[] = [
  {
    id: 'cert-1',
    kind: 'LEVEL_COMPLETION',
    title: 'Завершение уровня A1',
    subtitle: 'Starter — все темы пройдены, экзамен сдан на 92%',
    issuedAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    level: 'A1',
    accent: 'blue'
  },
  {
    id: 'cert-2',
    kind: 'STREAK_BONUS',
    title: '3 месяца золота подряд',
    subtitle: 'Бонус за упорство — +5 000 ₸',
    issuedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    accent: 'gold'
  },
  {
    id: 'cert-3',
    kind: 'CONTEST_WINNER',
    title: 'Spring Vibes 2025 — 2 место',
    subtitle: 'Видео-открытка к Наурызу',
    issuedAt: new Date(Date.now() - 380 * 86400000).toISOString(),
    accent: 'silver'
  }
]

// ─── Messenger ───────────────────────────────────────────────────────────

const TEACHER_AYSAULE: ChatParticipant = {
  id: 't-1',
  name: 'Айсауле',
  surname: 'Бекжан',
  role: 'TEACHER',
  avatarInitials: 'АБ'
}

const TEACHER_ZHANEL: ChatParticipant = {
  id: 't-2',
  name: 'Жанель',
  surname: 'Аманова',
  role: 'TEACHER',
  avatarInitials: 'ЖА'
}

const ADMIN_SUPPORT: ChatParticipant = {
  id: 'admin-1',
  name: 'Lingaphone',
  surname: 'Support',
  role: 'ADMIN',
  avatarInitials: 'LP'
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'conv-1', with: TEACHER_AYSAULE, lastMessageAt: new Date(Date.now() - 30 * 60000).toISOString(), unreadCount: 1 },
  { id: 'conv-2', with: TEACHER_ZHANEL, lastMessageAt: new Date(Date.now() - 1 * 86400000).toISOString(), unreadCount: 0 },
  { id: 'conv-3', with: ADMIN_SUPPORT, lastMessageAt: new Date(Date.now() - 7 * 86400000).toISOString(), unreadCount: 0 }
]

export const MOCK_MESSAGES_BY_CONV: Record<string, ChatMessage[]> = {
  'conv-1': [
    { id: 'm1-1', conversationId: 'conv-1', senderId: TEACHER_AYSAULE.id, body: 'Hi! Did you do the Past Simple homework?', sentAt: new Date(Date.now() - 90 * 60000).toISOString(), isRead: true },
    { id: 'm1-2', conversationId: 'conv-1', senderId: 'st-current', body: 'Yes, almost done. Question 4 is tricky.', sentAt: new Date(Date.now() - 60 * 60000).toISOString(), isRead: true },
    { id: 'm1-3', conversationId: 'conv-1', senderId: TEACHER_AYSAULE.id, body: 'Look at the time marker — "yesterday" needs Past Simple, not Present Perfect.', sentAt: new Date(Date.now() - 30 * 60000).toISOString(), isRead: false }
  ],
  'conv-2': [
    { id: 'm2-1', conversationId: 'conv-2', senderId: TEACHER_ZHANEL.id, body: 'Great speaking practice today! Keep working on intonation.', sentAt: new Date(Date.now() - 1 * 86400000).toISOString(), isRead: true }
  ],
  'conv-3': [
    { id: 'm3-1', conversationId: 'conv-3', senderId: ADMIN_SUPPORT.id, body: 'Welcome to Lingaphone! Если возникнут вопросы — пиши сюда.', sentAt: new Date(Date.now() - 7 * 86400000).toISOString(), isRead: true }
  ]
}

export const STUDENT_CHAT_USER_ID = 'st-current'

// ─── Word of the day & daily quest ───────────────────────────────────────

export const MOCK_WORD_OF_DAY: WordOfTheDay = {
  word: 'Lovely',
  ipa: '/ˈlʌvli/',
  translation: 'прекрасный, чудесный',
  example: 'The weather is lovely today!',
  funFact: 'Британцы говорят "lovely" в среднем 12 раз в день — это их любимый комплимент 🇬🇧'
}

export const MOCK_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'dq-1',
    title: 'Произнеси 5 слов',
    description: 'Открой AI-тренажёр и пройди 5 карточек',
    icon: 'i-lucide-mic',
    progress: 0.6,
    rewardXp: 30,
    done: false
  },
  {
    id: 'dq-2',
    title: 'Зайди на урок',
    description: 'Будь в группе вовремя сегодня',
    icon: 'i-lucide-video',
    progress: 0,
    rewardXp: 40,
    done: false
  },
  {
    id: 'dq-3',
    title: 'Прослушай аудио',
    description: 'Прослушай хоть одно аудио в Материалах',
    icon: 'i-lucide-headphones',
    progress: 1,
    rewardXp: 20,
    done: true
  }
]
