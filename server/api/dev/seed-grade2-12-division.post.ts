import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 4 lessons of «Смысл деления».
 *   1. Что такое деление
 *   2. Компоненты действия деления
 *   3. Связь умножения и деления
 *   4. Деление на 1 и само на себя
 *
 * S6: тема №12, theme-pack = 'zoo' (пара с темой 11 «Смысл умножения», theme=cafe).
 * Использует все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks,
 * tap-reveal, voice-terms, distractors, board-visual, tap-pair, boss+combo,
 * voiceFirst, trophyThresholds, share, questionPool, bugHunterBadge.
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Смысл деления')
  const L1 = lessonIds['Что такое деление']
  const L2 = lessonIds['Компоненты действия деления']
  const L3 = lessonIds['Связь умножения и деления']
  const L4 = lessonIds['Деление на 1 и само на себя']
  if (!L1 || !L2 || !L3 || !L4) throw createError({ statusCode: 500, message: 'Some lessons missing for «Смысл деления»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3, L4])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Что такое деление
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Делим поровну',
    subtitle: 'Зоопарк раздаёт бананы',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '12 бананов и 4 обезьянки. Поровну — это сколько каждой?',
      body: 'Раздаём по одному, по кругу. Когда бананы кончатся — посмотрим, сколько у каждой.',
      mascotEntry: 'greet',
      bgPattern: 'dots',
      successSfx: 'cheer',
      frames: [
        { emoji: '🍌', accent: 'amber', caption: '12 бананов на тарелке' },
        { emoji: '🐵', accent: 'rose', caption: '4 голодные обезьянки' },
        { emoji: '🤝', accent: 'emerald', caption: 'Поровну — каждой по 3!' }
      ],
      prompt: '12 ÷ 4 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '8' },
        { id: 'b', emoji: '🥇', label: '3', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '48' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь деление?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '6 конфет на 2 детей поровну. По сколько?', options: ['3', '4', '12', '8'], correctIndex: 0, conceptTag: 'базовое', explanation: '6 ÷ 2 = 3, каждому по 3 конфеты.' },
        { id: 'd2', prompt: 'Что значит знак «÷» или «:»?', options: ['Сложить', 'Умножить', 'Разделить', 'Сравнить'], correctIndex: 2, conceptTag: 'знак', explanation: 'Знак ÷ или : означает деление.' },
        { id: 'd3', prompt: '15 ÷ 5 = ?', options: ['3', '5', '10', '20'], correctIndex: 0, conceptTag: 'счёт', explanation: '15 ÷ 5 = 3, по 3 в каждой группе.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Раздаём поровну',
    subtitle: 'Группы и предметы внутри',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'grouping', totalItems: 12, groupsRange: [2, 4] },
      probes: [
        { id: 'p1', prompt: '12 точек на 3 группы. По сколько?', options: ['3', '4', '12', '36'], correctIndex: 1, explanation: '12 ÷ 3 = 4.' },
        { id: 'p2', prompt: '8 предметов на 2 группы — по сколько?', options: ['2', '4', '6', '10'], correctIndex: 1, explanation: '8 ÷ 2 = 4.' }
      ],
      copy: { headline: 'Деление — это раздача поровну', body: 'Сколько групп — на столько и делим.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Что такое деление',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Деление за 3 кадра',
          panels: [
            { emoji: '🍎', accent: 'rose', caption: '12 яблок' },
            { emoji: '👫', accent: 'sky', caption: 'Раздаём 4 детям' },
            { emoji: '🎯', accent: 'emerald', caption: 'Каждому по 3 — это и есть 12÷4=3' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Деление** — это разбиение на равные части. Знак «÷» или «:».',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '12 \\div 4 = 3' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А ещё деление — это «сколько раз помещается»?',
          revealedKind: 'text',
          revealedContent: 'Сколько раз по 4 в 12? Три раза! 4+4+4=12.',
          revealedHint: 'Это деление по содержанию.'
        },
        { id: 'c5', kind: 'text', content: 'Читается: «12 разделить на 4 равно 3».' }
      ],
      checks: [
        { id: 'ch1', prompt: '10 ÷ 2 = ?', options: ['5', '8', '12', '20'], correctIndex: 0 },
        { id: 'ch2', prompt: '20 ÷ 4 = ?', options: ['4', '5', '16', '24'], correctIndex: 1 },
        { id: 'ch3', prompt: '15 ÷ 5 = ?', options: ['3', '5', '10', '20'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись деления',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: '12 ÷ 4 = 3',
      anatomy: [
        { id: 'a1', label: '12', role: 'делимое — что делим', accent: 'sky' },
        { id: 'a2', label: '4', role: 'делитель — на сколько', accent: 'amber' },
        { id: 'a3', label: '3', role: 'частное — результат', accent: 'green' }
      ],
      terms: [
        { term: 'Деление', definition: 'Разбиение на равные части.', example: '12 ÷ 3 = 4', speakText: 'Деление — это раздача поровну' },
        { term: 'Знак деления', definition: 'Точка с двумя точками: ÷ или две точки : ', example: '8 ÷ 2 или 8 : 2', speakText: 'Знак деления' }
      ],
      buildTask: {
        prompt: '12 ÷ 4 = ___',
        template: '___',
        expected: ['3'],
        distractors: ['2', '4', '6', '8', '48']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем деление',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: «сколько раз второе число помещается в первом».',
      examples: [
        {
          id: 'ex1', problem: '15 ÷ 3 = ?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что мы ищем?', explanation: 'Сколько раз 3 помещается в 15.', visual: { kind: 'board', boardLines: ['15 ÷ 3 = ?', '\\downarrow', '3 + 3 + 3 + 3 + 3'] }, action: { kind: 'numeric', prompt: 'Сколько троек в 15?', expected: 5 } },
            { index: 2, title: 'Готово', explanation: '3+3+3+3+3=15. Пять раз — значит 15÷3=5.', visual: { kind: 'board', boardLines: ['15 ÷ 3 = 5'] }, action: { kind: 'numeric', prompt: '15 ÷ 3 = ?', expected: 5 } }
          ]
        },
        {
          id: 'ex2', problem: '20 ÷ 5 = ?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '5+5+5+5=20, четыре раза.', action: { kind: 'numeric', prompt: '20 ÷ 5 = ?', expected: 4 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем деление',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини пример с ответом',
          left: [
            { id: 'L1', label: '8 ÷ 2' },
            { id: 'L2', label: '10 ÷ 5' },
            { id: 'L3', label: '12 ÷ 3' },
            { id: 'L4', label: '20 ÷ 4' }
          ],
          right: [
            { id: 'R1', label: '4', pairId: 'L1' },
            { id: 'R2', label: '2', pairId: 'L2' },
            { id: 'R3', label: '4', pairId: 'L3' },
            { id: 'R4', label: '5', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '15 ÷ 3 = ?', correctAnswer: 5 },
        { kind: 'numeric', id: 't3', prompt: '18 ÷ 2 = ?', correctAnswer: 9 },
        { kind: 'numeric', id: 't4', prompt: '25 ÷ 5 = ?', correctAnswer: 5 },
        { kind: 'numeric', id: 't5', prompt: '16 ÷ 4 = ?', correctAnswer: 4 },
        { kind: 'numeric', id: 't6', prompt: '21 ÷ 3 = ?', correctAnswer: 7 }
      ],
      socraticHints: {
        t3: ['18 разделить на 2 — раздай поровну двум друзьям. По сколько?'],
        t4: ['Сколько раз по 5 нужно прибавить, чтобы получить 25?'],
        t6: ['Какое число × 3 = 21? Подумай о таблице.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Кормление в зоопарке',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Зоопарк «Самал»',
        roleplay: 'Ты помощник смотрителя. Раздай корм животным поровну.',
        characterName: 'Смотритель Аян',
        mascotLine: 'Поровну — значит делить!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Обезьянки', request: '20 бананов на 4 обезьянок поровну. По сколько?', correct: 5, wrongFeedback: '20 ÷ 4 = 5 бананов каждой.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Зебры', request: '12 морковок на 3 зебры. По сколько?', correct: 4, wrongFeedback: '12 ÷ 3 = 4.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Слоники', request: '18 яблок на 6 слоников. По сколько?', correct: 3, wrongFeedback: '18 ÷ 6 = 3.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Львята', request: '24 куска мяса на 8 львят. Поровну — по сколько?', correct: 3, wrongFeedback: '24 ÷ 8 = 3.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Стая жирафов',
        request: 'ФИНАЛ: 35 листьев акации на 5 жирафов. По сколько каждому?',
        correct: 7,
        wrongFeedback: '35 ÷ 5 = 7. Подсказка: 5 × 7 = 35.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай ÷ и −',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток деления', emoji: '➗' },
      intro: 'Деление — не вычитание и не умножение.',
      traps: [
        { id: 'tr1', wrongStatement: '«12 ÷ 4 = 8»', whyWrong: 'Это вычитание. ÷ — это деление: 12 разделить на 4 = 3.', correctStatement: '12 ÷ 4 = 3', rememberNote: 'Деление ≠ вычитание.' },
        { id: 'tr2', wrongStatement: '«6 ÷ 2 = 12»', whyWrong: 'Перепутал с умножением. ÷ — деление: 6÷2=3.', correctStatement: '6 ÷ 2 = 3', rememberNote: 'Деление ≤ делимого.' },
        { id: 'tr3', wrongStatement: 'Поделил неравными частями', whyWrong: 'Деление — это всегда **поровну**, не «как-нибудь».', correctStatement: 'Поровну = деление', rememberNote: 'Равные части.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни деление',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату',
      voicePrompt: 'Расскажи что такое деление',
      coverPrompts: ['Что такое деление?', 'Какие знаки используются?', 'Покажи на примере конфет.'],
      referenceAnswer: 'Деление — это разбиение поровну на равные части. Знаки: ÷ или :. Например, если 12 конфет разделить на 4 детей поровну, каждому достанется по 3 конфеты: 12 ÷ 4 = 3. Деление можно понять и так: сколько раз 4 помещается в 12 — три раза.',
      requiredConcepts: ['деление', 'поровну', 'части'],
      conceptKeywords: {
        деление: ['делен', 'делит', 'дели'],
        поровну: ['поровн', 'равн', 'одинаков'],
        части: ['част', 'групп']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['делен', 'поровн'] }
  })

  await insert({
    lessonId: L1, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Что такое деление · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '12 ÷ 4 = ?', correctAnswer: 3, conceptTag: 'деление', cognitiveLevel: 'recall', explanation: '12÷4=3, по 3 в каждой группе.' },
        { id: 'm2', kind: 'numeric', prompt: '20 ÷ 5 = ?', correctAnswer: 4, conceptTag: 'деление', cognitiveLevel: 'apply', explanation: '20÷5=4, потому что 5×4=20.' },
        { id: 'm3', kind: 'numeric', prompt: '18 ÷ 3 = ?', correctAnswer: 6, conceptTag: 'деление', cognitiveLevel: 'apply', explanation: '18÷3=6, потому что 3×6=18.' },
        { id: 'm4', kind: 'numeric', prompt: '15 яблок на 3 детей. По сколько?', correctAnswer: 5, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '15÷3=5.' },
        { id: 'm5', kind: 'numeric', prompt: 'Сколько раз по 5 в 25?', correctAnswer: 5, conceptTag: 'содержание', cognitiveLevel: 'apply', explanation: '25÷5=5.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '14 ÷ 2 = ?', correctAnswer: 7, conceptTag: 'деление', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '24 ÷ 6 = ?', correctAnswer: 4, conceptTag: 'деление', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '21 ÷ 7 = ?', correctAnswer: 3, conceptTag: 'деление', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '16 морковок на 4 зайцев. По сколько?', correctAnswer: 4, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Сколько раз по 3 в 27?', correctAnswer: 9, conceptTag: 'содержание', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Компоненты деления
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'У деления три «героя»',
    subtitle: 'Делимое, делитель, частное',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Делимое, делитель, частное — три имени в любом примере на деление.',
      body: 'Знаешь их — легко обсуждаешь решение и не путаешься.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🦒', accent: 'sky', caption: '20 — что делим (делимое)' },
        { emoji: '🦓', accent: 'amber', caption: '5 — на сколько (делитель)' },
        { emoji: '🎯', accent: 'emerald', caption: '4 — результат (частное)' }
      ],
      prompt: 'В 20 ÷ 5 = 4 — что такое 5?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Делимое' },
        { id: 'b', emoji: '🥇', label: 'Делитель', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Частное' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь имена?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Делимое — это:', options: ['Что делим', 'На что делим', 'Результат'], correctIndex: 0, conceptTag: 'делимое', explanation: 'Делимое — это число, которое делят.' },
        { id: 'd2', prompt: 'Делитель — это:', options: ['Что делим', 'На что делим', 'Результат'], correctIndex: 1, conceptTag: 'делитель', explanation: 'Делитель — на что делим, второе число.' },
        { id: 'd3', prompt: 'Частное — это:', options: ['Что делим', 'На что делим', 'Результат'], correctIndex: 2, conceptTag: 'частное', explanation: 'Частное — результат деления.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Имена в примере',
    subtitle: 'Слева → направо',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 30, step: 1 },
      probes: [
        { id: 'p1', prompt: 'В 18 ÷ 3 = 6 кто делимое?', options: ['18', '3', '6'], correctIndex: 0 },
        { id: 'p2', prompt: 'А кто частное?', options: ['18', '3', '6'], correctIndex: 2 }
      ],
      copy: { headline: 'Имена идут слева направо', body: 'Делимое ÷ делитель = частное. Запомни порядок.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Кто есть кто',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Три имени за 3 кадра',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: 'Делимое — слева' },
            { emoji: '2️⃣', accent: 'amber', caption: 'Делитель — после ÷' },
            { emoji: '3️⃣', accent: 'emerald', caption: 'Частное — после =' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Делимое** — что делим. **Делитель** — на что делим. **Частное** — результат.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '\\underbrace{20}_{\\text{делимое}} \\div \\underbrace{4}_{\\text{делитель}} = \\underbrace{5}_{\\text{частное}}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Как они расположены?',
          revealedKind: 'text',
          revealedContent: 'Делимое ВСЕГДА первое (слева), делитель — после знака ÷, частное — после =.',
          revealedHint: 'Слева → направо.'
        },
        { id: 'c5', kind: 'text', content: 'Помни: делимое **больше или равно** делителю (без остатка).' }
      ],
      checks: [
        { id: 'ch1', prompt: 'В 24 ÷ 6 = 4 — частное:', options: ['24', '6', '4'], correctIndex: 2 },
        { id: 'ch2', prompt: 'А делимое:', options: ['24', '6', '4'], correctIndex: 0 },
        { id: 'ch3', prompt: 'А делитель:', options: ['24', '6', '4'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Структура деления',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Имена в примере',
      anatomy: [
        { id: 'a1', label: 'Делимое', role: 'число, которое делят', accent: 'sky' },
        { id: 'a2', label: 'Делитель', role: 'число, на которое делят', accent: 'amber' },
        { id: 'a3', label: 'Частное', role: 'результат деления', accent: 'green' }
      ],
      terms: [
        { term: 'Делимое', definition: 'Что делим (первое число).', example: '20 в 20÷4', speakText: 'Делимое — что делим' },
        { term: 'Делитель', definition: 'На что делим (второе число).', example: '4 в 20÷4', speakText: 'Делитель — на что делим' },
        { term: 'Частное', definition: 'Результат.', example: '5 в 20÷4=5', speakText: 'Частное — результат' }
      ],
      buildTask: {
        prompt: 'В 30 ÷ 5 = 6 частное равно ___',
        template: '___',
        expected: ['6'],
        distractors: ['5', '30', '25', '35', '11']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Называем компоненты',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: смотри на позицию числа.',
      examples: [
        {
          id: 'ex1', problem: 'В 30 ÷ 5 = 6 — назови все компоненты.', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Делимое', explanation: '30 (первое).', visual: { kind: 'board', boardLines: ['\\textbf{30} ÷ 5 = 6', '↑ делимое'] }, action: { kind: 'numeric', prompt: 'Делимое:', expected: 30 } },
            { index: 2, title: 'Делитель', explanation: '5 (второе).', visual: { kind: 'board', boardLines: ['30 ÷ \\textbf{5} = 6', '\\;\\;\\;\\;\\; ↑ делитель'] }, action: { kind: 'numeric', prompt: 'Делитель:', expected: 5 } },
            { index: 3, title: 'Частное', explanation: '6 (результат).', visual: { kind: 'board', boardLines: ['30 ÷ 5 = \\textbf{6}', '\\;\\;\\;\\;\\;\\;\\;\\;\\; ↑ частное'] }, action: { kind: 'numeric', prompt: 'Частное:', expected: 6 } }
          ]
        },
        {
          id: 'ex2', problem: '14 ÷ 7 = 2', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Имена', explanation: '14 — делимое, 7 — делитель, 2 — частное.', action: { kind: 'numeric', prompt: 'Частное:', expected: 2 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем имена',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини имя с его описанием',
          left: [
            { id: 'L1', label: 'Делимое' },
            { id: 'L2', label: 'Делитель' },
            { id: 'L3', label: 'Частное' },
            { id: 'L4', label: 'Знак ÷' }
          ],
          right: [
            { id: 'R1', label: 'Что делим', pairId: 'L1' },
            { id: 'R2', label: 'На что делим', pairId: 'L2' },
            { id: 'R3', label: 'Результат', pairId: 'L3' },
            { id: 'R4', label: 'Действие деления', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: 'В 18÷2=9, делимое:', options: ['18', '2', '9'], correctIndex: 0 },
        { kind: 'numeric', id: 't3', prompt: 'Если делимое 16, делитель 4, частное?', correctAnswer: 4 },
        { kind: 'numeric', id: 't4', prompt: 'Делимое 20, частное 5. Делитель?', correctAnswer: 4 },
        { kind: 'numeric', id: 't5', prompt: 'Делитель 3, частное 6. Делимое?', correctAnswer: 18 },
        { kind: 'choice', id: 't6', prompt: 'Делимое всегда:', options: ['Меньше делителя', 'Больше или равно делителю', 'Равно нулю'], correctIndex: 1 }
      ],
      socraticHints: {
        t3: ['Сначала вспомни: что такое частное? Это первое, второе или результат?'],
        t4: ['Если 20 разложить на группы по 4, сколько групп получится? Это и есть делитель.'],
        t5: ['Делимое = делитель × частное. Какое число подходит?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Школа смотрителей',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Учебный класс зоопарка',
        roleplay: 'Помоги новеньким смотрителям определять имена компонентов в задачах о кормлении.',
        characterName: 'Главный зоолог Дина',
        mascotLine: 'Делимое ÷ делитель = частное!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Стажёр', request: '24 ÷ 6 = 4 (бананы для обезьян). Частное равно?', correct: 4, wrongFeedback: 'Частное — результат = 4.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Стажёр 2', request: '40 ÷ 8 = 5. Делитель равен?', correct: 8, wrongFeedback: 'Делитель = 8.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Стажёр 3', request: 'Делимое 30, делитель 5. Частное?', correct: 6, wrongFeedback: '30 ÷ 5 = 6.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Зоолог', request: 'Делитель 4, частное 7. Делимое?', correct: 28, wrongFeedback: '4 × 7 = 28.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Экзамен',
        request: 'ФИНАЛ: 56 рыбок на 8 пингвинов. Назови частное.',
        correct: 7,
        wrongFeedback: '56 ÷ 8 = 7. Это частное.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай позиции',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток имён', emoji: '🏷️' },
      intro: 'Каждое имя — на своём месте.',
      traps: [
        { id: 'tr1', wrongStatement: '«В 24÷6 делитель — 24»', whyWrong: '24 — это **делимое** (что делим). 6 — делитель (на что делим).', correctStatement: 'Делитель = 6', rememberNote: 'Делитель идёт после знака.' },
        { id: 'tr2', wrongStatement: 'Перепутал делимое и частное', whyWrong: 'Частное — это **результат**, оно после =. Делимое — слева.', correctStatement: 'Слева делимое, справа частное', rememberNote: 'Слева → справа.' },
        { id: 'tr3', wrongStatement: 'Считал делитель больше делимого', whyWrong: 'Так не бывает (без остатка). Делимое всегда ≥ делителя.', correctStatement: 'Делимое ≥ делителя', rememberNote: 'Большое делим на меньшее.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни компоненты',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Назови три имени в делении и объясни',
      coverPrompts: ['Назови три компонента деления', 'Где какой стоит?', 'Покажи на примере 24 ÷ 6 = 4.'],
      referenceAnswer: 'В делении три компонента: делимое (то, что делим), делитель (на что делим) и частное (результат). Запись: делимое ÷ делитель = частное. Например, 24 ÷ 6 = 4: 24 — делимое, 6 — делитель, 4 — частное.',
      requiredConcepts: ['делимое', 'делитель', 'частное'],
      conceptKeywords: {
        делимое: ['делим'],
        делитель: ['делитель'],
        частное: ['частн']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['делим', 'частн'] }
  })

  await insert({
    lessonId: L2, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Компоненты деления · Зоопарк',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'В 30÷5=6, делимое:', options: ['30', '5', '6'], correctIndex: 0, conceptTag: 'делимое', cognitiveLevel: 'recall', explanation: 'Делимое — 30.' },
        { id: 'm2', kind: 'choice', prompt: 'В 30÷5=6, делитель:', options: ['30', '5', '6'], correctIndex: 1, conceptTag: 'делитель', cognitiveLevel: 'recall', explanation: 'Делитель — 5.' },
        { id: 'm3', kind: 'choice', prompt: 'В 30÷5=6, частное:', options: ['30', '5', '6'], correctIndex: 2, conceptTag: 'частное', cognitiveLevel: 'recall', explanation: 'Частное — 6.' },
        { id: 'm4', kind: 'numeric', prompt: 'Делимое 36, делитель 6. Частное?', correctAnswer: 6, conceptTag: 'нахождение', cognitiveLevel: 'apply', explanation: '36÷6=6.' },
        { id: 'm5', kind: 'numeric', prompt: 'Делитель 4, частное 9. Делимое?', correctAnswer: 36, conceptTag: 'нахождение', cognitiveLevel: 'apply', explanation: '4×9=36.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: 'В 42÷7=6, делитель:', options: ['42', '7', '6'], correctIndex: 1, conceptTag: 'делитель', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'choice', prompt: 'В 28÷4=7, частное:', options: ['28', '4', '7'], correctIndex: 2, conceptTag: 'частное', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: 'Делимое 45, делитель 9. Частное?', correctAnswer: 5, conceptTag: 'нахождение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Делитель 6, частное 5. Делимое?', correctAnswer: 30, conceptTag: 'нахождение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: 'Делимое всегда:', options: ['Меньше делителя', '≥ делителя', '= 0'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Связь × и ÷
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Два действия — одна семья',
    subtitle: '× и ÷ — близнецы',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Умножение и деление — взаимообратные действия.',
      body: 'Если 4 × 5 = 20, то 20 ÷ 4 = 5 и 20 ÷ 5 = 4. Зная одну табличку — знаешь и два деления!',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🦋', accent: 'amber', caption: '6 × 4 = 24' },
        { emoji: '🔄', accent: 'rose', caption: 'Можно «отмотать» назад' },
        { emoji: '✨', accent: 'emerald', caption: '24 ÷ 6 = 4 — уже знаем!' }
      ],
      prompt: 'Из 6 × 4 = 24 какое деление получится?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '24 ÷ 6 = 4', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '24 + 6' },
        { id: 'c', emoji: '🤯', label: '6 + 4' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь связь?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Если 3×4=12, то 12÷3=?', options: ['4', '12', '7', '0'], correctIndex: 0, conceptTag: 'связь', explanation: 'Из 3×4=12 следует 12÷3=4.' },
        { id: 'd2', prompt: 'Умножение и деление — это:', options: ['Взаимообратные', 'Одно и то же', 'Не связаны', 'Сложение'], correctIndex: 0, conceptTag: 'теория', explanation: 'Умножение и деление отменяют друг друга.' },
        { id: 'd3', prompt: 'Если 5×6=30, то 30÷6=?', options: ['5', '6', '30', '180'], correctIndex: 0, conceptTag: 'применение', explanation: 'Из 5×6=30 следует 30÷6=5.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Семья из четырёх',
    subtitle: 'Из одного × — два ÷',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 5, minCols: 2, maxCols: 5, defaultRows: 4, defaultCols: 3 },
      probes: [
        { id: 'p1', prompt: 'Из 4 × 3 = 12 — деление 12 ÷ 4 = ?', options: ['3', '4', '12', '7'], correctIndex: 0 },
        { id: 'p2', prompt: 'И 12 ÷ 3 = ?', options: ['3', '4', '12', '36'], correctIndex: 1 }
      ],
      copy: { headline: 'Из одного × получаем два ÷', body: 'a×b=c, b×a=c, c÷a=b, c÷b=a — одна семья!' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Взаимообратные действия',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Связь за 3 кадра',
          panels: [
            { emoji: '✖️', accent: 'sky', caption: '6 × 4 = 24' },
            { emoji: '➗', accent: 'amber', caption: '24 ÷ 6 = 4' },
            { emoji: '➗', accent: 'emerald', caption: '24 ÷ 4 = 6' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Умножение и деление — взаимообратные.** Из любой формулы умножения можно сделать две формулы деления.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a \\times b = c \\Rightarrow c \\div a = b, \\quad c \\div b = a' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Зачем это нужно?',
          revealedKind: 'text',
          revealedContent: 'Если ты помнишь умножение — то и деление получишь автоматически. Один факт = три задачи!',
          revealedHint: 'Учить меньше — знать больше.'
        },
        { id: 'c5', kind: 'text', content: 'Например: 6 × 4 = 24. Тогда 24 ÷ 6 = 4 и 24 ÷ 4 = 6.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Из 7 × 5 = 35: 35 ÷ 7 = ?', options: ['5', '7', '35', '12'], correctIndex: 0 },
        { id: 'ch2', prompt: 'Из 8 × 3 = 24: 24 ÷ 8 = ?', options: ['3', '8', '24', '1'], correctIndex: 0 },
        { id: 'ch3', prompt: 'Из 9 × 2 = 18: 18 ÷ 2 = ?', options: ['2', '9', '18', '7'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Тройка чисел',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Семья из 3 чисел: 4, 5, 20',
      anatomy: [
        { id: 'a1', label: '4 × 5 = 20', role: '1-е умножение', accent: 'green' },
        { id: 'a2', label: '5 × 4 = 20', role: '2-е (переместительное)', accent: 'sky' },
        { id: 'a3', label: '20 ÷ 4 = 5', role: '1-е деление', accent: 'amber' },
        { id: 'a4', label: '20 ÷ 5 = 4', role: '2-е деление', accent: 'rose' }
      ],
      terms: [
        { term: 'Взаимообратные действия', definition: 'Действия, которые отменяют друг друга.', example: '× и ÷ взаимообратны', speakText: 'Взаимообратные — отменяют друг друга' }
      ],
      buildTask: {
        prompt: 'Если 6 × 4 = 24, то 24 ÷ 6 = ___',
        template: '___',
        expected: ['4'],
        distractors: ['6', '24', '10', '18', '2']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Получаем деление',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: знаешь умножение → получаешь два деления.',
      examples: [
        {
          id: 'ex1', problem: 'Дано: 4 × 6 = 24. Найди два примера на деление.', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Первое деление', explanation: '24 ÷ 4 = 6.', visual: { kind: 'board', boardLines: ['4 × 6 = 24', '\\downarrow', '24 ÷ 4 = 6'] }, action: { kind: 'numeric', prompt: '24 ÷ 4 = ?', expected: 6 } },
            { index: 2, title: 'Второе деление', explanation: '24 ÷ 6 = 4.', visual: { kind: 'board', boardLines: ['24 ÷ 6 = 4'] }, action: { kind: 'numeric', prompt: '24 ÷ 6 = ?', expected: 4 } }
          ]
        },
        {
          id: 'ex2', problem: '7 × 3 = 21', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Деления', explanation: '21÷7=3, 21÷3=7.', action: { kind: 'numeric', prompt: '21 ÷ 3 = ?', expected: 7 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем связь',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини умножение с делением (одной семьи)',
          left: [
            { id: 'L1', label: '5 × 3 = 15' },
            { id: 'L2', label: '4 × 6 = 24' },
            { id: 'L3', label: '7 × 4 = 28' },
            { id: 'L4', label: '9 × 2 = 18' }
          ],
          right: [
            { id: 'R1', label: '15 ÷ 5 = 3', pairId: 'L1' },
            { id: 'R2', label: '24 ÷ 6 = 4', pairId: 'L2' },
            { id: 'R3', label: '28 ÷ 4 = 7', pairId: 'L3' },
            { id: 'R4', label: '18 ÷ 9 = 2', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '36 ÷ 6 = ? (используй 6×?=36)', correctAnswer: 6 },
        { kind: 'numeric', id: 't3', prompt: '40 ÷ 5 = ?', correctAnswer: 8 },
        { kind: 'numeric', id: 't4', prompt: '54 ÷ 9 = ?', correctAnswer: 6 },
        { kind: 'numeric', id: 't5', prompt: '32 ÷ 8 = ?', correctAnswer: 4 },
        { kind: 'numeric', id: 't6', prompt: '63 ÷ 7 = ?', correctAnswer: 9 }
      ],
      socraticHints: {
        t2: ['Подсказка уже дана: 6 × ? = 36. Что подставить?'],
        t3: ['5 × сколько = 40?'],
        t4: ['Вспомни таблицу на 9: 9×6=? Если совпадает с 54 — нашёл ответ.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Зоомагазин',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Зоомагазин при зоопарке',
        roleplay: 'Помоги продавцу: одни клиенты считают × (всего), другие ÷ (поровну).',
        characterName: 'Продавец Бахытжан',
        mascotLine: 'Знаешь × — знаешь ÷!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Семья', request: '6 рядов клеток, в каждой 4 хомяка. Всего хомяков?', correct: 24, wrongFeedback: '6×4=24.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: '24 хомяка по 6 клеткам. По сколько в клетке?', correct: 4, wrongFeedback: '24÷6=4.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Покупатель', request: '5×7=35 рыбок в банках. 35÷5=?', correct: 7, wrongFeedback: '7.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Покупатель', request: '8×3=24 птички. 24÷8=?', correct: 3, wrongFeedback: '3.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой заказ',
        request: 'ФИНАЛ: 9×8=72 хвостиков. Сколько 72÷9?',
        correct: 8,
        wrongFeedback: '72÷9=8 (потому что 9×8=72).',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в связи',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Связной', emoji: '🔄' },
      intro: 'Не путай порядок чисел.',
      traps: [
        { id: 'tr1', wrongStatement: '«4×5=20, значит 4÷5=20»', whyWrong: 'Из 4×5=20 → 20÷4=5 и 20÷5=4. Не 4÷5=20.', correctStatement: '20 ÷ 4 = 5', rememberNote: 'Делимое — самое большое.' },
        { id: 'tr2', wrongStatement: 'Не использовал связь, считал заново', whyWrong: 'Если знаешь 8×7=56, то 56÷8=7 — без вычислений!', correctStatement: 'Используй умножение для деления', rememberNote: 'Связь — ускоритель.' },
        { id: 'tr3', wrongStatement: 'Делил большее на маленькое неправильно', whyWrong: 'Если 7×6=42, то 42÷7=6 (а не наоборот). Помни: делимое — большое.', correctStatement: 'Делимое — большое число', rememberNote: 'Большое сверху.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни связь',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как × связано с ÷',
      coverPrompts: ['Что такое взаимообратные действия?', 'Как из 6×4=24 получить деление?', 'Зачем знать связь?'],
      referenceAnswer: 'Умножение и деление — взаимообратные действия. Они «отменяют» друг друга. Из формулы умножения можно получить два деления: если 6×4=24, то 24÷6=4 и 24÷4=6. Это полезно: знаешь таблицу умножения — автоматически знаешь и деление.',
      requiredConcepts: ['взаимообратные', 'умножение', 'деление'],
      conceptKeywords: {
        взаимообратные: ['взаимо', 'обрат'],
        умножение: ['умнож'],
        деление: ['делен', 'дели']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['взаимо', 'обрат'] }
  })

  await insert({
    lessonId: L3, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Связь × и ÷ · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Если 5×4=20, то 20÷5=?', correctAnswer: 4, conceptTag: 'связь', cognitiveLevel: 'apply', explanation: 'Из 5×4=20 → 20÷5=4.' },
        { id: 'm2', kind: 'numeric', prompt: '6×7=42. 42÷7=?', correctAnswer: 6, conceptTag: 'связь', cognitiveLevel: 'apply', explanation: '42÷7=6.' },
        { id: 'm3', kind: 'numeric', prompt: '8×9=72. 72÷9=?', correctAnswer: 8, conceptTag: 'связь', cognitiveLevel: 'apply', explanation: '72÷9=8.' },
        { id: 'm4', kind: 'choice', prompt: 'Умножение и деление:', options: ['Одно и то же', 'Взаимообратные', 'Не связаны'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand', explanation: 'Они взаимообратные.' },
        { id: 'm5', kind: 'numeric', prompt: '63 ÷ 9 = ? (9×?=63)', correctAnswer: 7, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '9×7=63.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '4×7=28. 28÷4=?', correctAnswer: 7, conceptTag: 'связь', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '7×5=35. 35÷5=?', correctAnswer: 7, conceptTag: 'связь', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '9×6=54. 54÷6=?', correctAnswer: 9, conceptTag: 'связь', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '48 ÷ 6 = ?', correctAnswer: 8, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '81 ÷ 9 = ?', correctAnswer: 9, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 4 — Деление на 1 и само на себя
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L4, layerType: 'HOOK', orderIndex: 1,
    title: 'Два волшебных правила',
    subtitle: 'a÷1=a и a÷a=1',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Два железных правила деления.',
      body: 'На 1 — число не меняется. На самого себя — всегда 1. Запомнил — и не ошибёшься.',
      mascotEntry: 'trophy',
      bgPattern: 'stars',
      successSfx: 'cheer',
      frames: [
        { emoji: '🐘', accent: 'sky', caption: '7 яблок 🐘 одному слону' },
        { emoji: '🍎', accent: 'amber', caption: '= 7 яблок (a÷1=a)' },
        { emoji: '⭐', accent: 'emerald', caption: '7 яблок ÷ 7 слонам = по 1 (a÷a=1)' }
      ],
      prompt: '7 ÷ 1 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '0' },
        { id: 'b', emoji: '🤯', label: '1' },
        { id: 'c', emoji: '🥇', label: '7', isPrimary: true }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь особые случаи?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '9 ÷ 1 = ?', options: ['1', '0', '9', '90'], correctIndex: 2, conceptTag: 'на-1', explanation: 'a÷1=a, поэтому 9÷1=9.' },
        { id: 'd2', prompt: '6 ÷ 6 = ?', options: ['0', '1', '6', '12'], correctIndex: 1, conceptTag: 'само-на-себя', explanation: 'a÷a=1.' },
        { id: 'd3', prompt: 'a ÷ 1 = ?', options: ['1', 'a', '0', '2a'], correctIndex: 1, conceptTag: 'правило', explanation: 'Делим на 1 — число не меняется.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L4, layerType: 'INTUITION', orderIndex: 3,
    title: 'Поймём смысл',
    subtitle: 'Один или каждому по 1',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'grouping', totalItems: 8, groupsRange: [1, 8] },
      probes: [
        { id: 'p1', prompt: '8 конфет на 1 ребёнка. Сколько достанется?', options: ['1', '0', '8', '88'], correctIndex: 2, explanation: 'Один ребёнок получит все 8: 8÷1=8.' },
        { id: 'p2', prompt: '8 конфет на 8 детей поровну — по сколько?', options: ['0', '1', '8', '64'], correctIndex: 1, explanation: 'Каждому ровно по одной: 8÷8=1.' }
      ],
      copy: { headline: 'На 1 — всё одному. На самого себя — по 1 каждому.', body: 'Это и есть два особых правила.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L4, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Два правила',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Два правила за 3 кадра',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: 'a ÷ 1 = a (число не меняется)' },
            { emoji: '🟰', accent: 'amber', caption: 'a ÷ a = 1 (всегда 1)' },
            { emoji: '🚫', accent: 'rose', caption: 'a ÷ 0 — НЕЛЬЗЯ!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Правило 1.** Любое число, делённое на 1, равно самому себе.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a \\div 1 = a' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А второе правило?',
          revealedKind: 'formula',
          revealedContent: 'a \\div a = 1, \\quad a \\ne 0',
          revealedHint: 'Делим число на самого себя — всегда 1.'
        },
        { id: 'c5', kind: 'text', content: 'Проверка через умножение: 1 × a = a (поэтому a÷1=a) и a × 1 = a (поэтому a÷a=1).' }
      ],
      checks: [
        { id: 'ch1', prompt: '15 ÷ 1 = ?', options: ['1', '0', '15', '14'], correctIndex: 2 },
        { id: 'ch2', prompt: '12 ÷ 12 = ?', options: ['12', '0', '1', '24'], correctIndex: 2 },
        { id: 'ch3', prompt: '100 ÷ 1 = ?', options: ['1', '10', '100', '0'], correctIndex: 2 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L4, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Особые случаи',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Два правила',
      anatomy: [
        { id: 'a1', label: 'a ÷ 1 = a', role: 'на 1 — само число', accent: 'sky' },
        { id: 'a2', label: 'a ÷ a = 1', role: 'на самого себя — единица', accent: 'amber' }
      ],
      terms: [
        { term: 'Деление на 1', definition: 'Делитель = 1 → результат равен делимому.', example: '9 ÷ 1 = 9', speakText: 'Деление на единицу — число не меняется' },
        { term: 'Деление на самого себя', definition: 'Делимое = делителю → результат 1.', example: '7 ÷ 7 = 1', speakText: 'На самого себя — всегда единица' },
        { term: 'Деление на 0', definition: 'ЗАПРЕЩЕНО! Не имеет смысла.', example: 'a ÷ 0 — нельзя', speakText: 'На ноль делить нельзя' }
      ],
      buildTask: {
        prompt: 'Заполни: 8 ÷ 8 = ___',
        template: '___',
        expected: ['1'],
        distractors: ['8', '0', '16', '64', '7']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Применяем правила',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: смотри на делитель — это 1 или сам делимое?',
      examples: [
        {
          id: 'ex1', problem: '17 ÷ 1 = ?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Тип', explanation: 'Делитель = 1, значит a÷1=a. Ответ — само число 17.', visual: { kind: 'board', boardLines: ['17 ÷ 1 = 17', '\\text{(на 1 — не меняется)}'] }, action: { kind: 'numeric', prompt: 'Ответ?', expected: 17 } },
            { index: 2, title: 'Проверка', explanation: '1 × 17 = 17 — верно.', action: { kind: 'numeric', prompt: '1×17?', expected: 17 } }
          ]
        },
        {
          id: 'ex2', problem: '25 ÷ 25 = ?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Тип', explanation: 'Делимое = делителю, значит a÷a=1.', visual: { kind: 'board', boardLines: ['25 ÷ 25 = 1', '\\text{(на себя — всегда 1)}'] }, action: { kind: 'numeric', prompt: 'Ответ?', expected: 1 } },
            { index: 2, title: 'Проверка', explanation: '25 × 1 = 25 — верно.', action: { kind: 'numeric', prompt: '25×1?', expected: 25 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем особые случаи',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини пример с ответом',
          left: [
            { id: 'L1', label: '5 ÷ 1' },
            { id: 'L2', label: '8 ÷ 8' },
            { id: 'L3', label: '23 ÷ 1' },
            { id: 'L4', label: '14 ÷ 14' }
          ],
          right: [
            { id: 'R1', label: '5', pairId: 'L1' },
            { id: 'R2', label: '1', pairId: 'L2' },
            { id: 'R3', label: '23', pairId: 'L3' },
            { id: 'R4', label: '1', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '100 ÷ 1 = ?', correctAnswer: 100, hint: 'a÷1=a.' },
        { kind: 'numeric', id: 't3', prompt: '50 ÷ 50 = ?', correctAnswer: 1, hint: 'a÷a=1.' },
        { kind: 'numeric', id: 't4', prompt: '7 ÷ 7 = ?', correctAnswer: 1, hint: 'Делитель = делимому → 1.' },
        { kind: 'numeric', id: 't5', prompt: '36 ÷ 1 = ?', correctAnswer: 36, hint: 'На 1 — само число.' },
        { kind: 'numeric', id: 't6', prompt: '99 ÷ 99 = ?', correctAnswer: 1, hint: 'Любое число на себя — 1.' }
      ],
      socraticHints: {
        t2: ['Делитель — 1. Какое правило тут работает?'],
        t3: ['Делимое и делитель равны. Что это даёт?'],
        t6: ['99 разделено на 99 — это сколько раз 99 в 99?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L4, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Один или каждому по 1',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Раздача в зоопарке',
        roleplay: 'Помоги директору раздать награды животным по особым правилам.',
        characterName: 'Директор Гульнара',
        mascotLine: 'На 1 — всё одному, на самого себя — каждому по 1!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Слон', request: '15 яблок, 1 слон. По сколько ему?', correct: 15, wrongFeedback: '15÷1=15.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Стая', request: '20 рыбок на 20 пингвинов поровну — по сколько каждому?', correct: 1, wrongFeedback: '20÷20=1.', revenueReward: 40, reputationReward: 1 },
        { id: 'o3', customer: 'Жираф', request: '36 листьев и 1 жираф. Сколько у него?', correct: 36, wrongFeedback: '36÷1=36.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Стая', request: '12 морковок на 12 кроликов. По сколько?', correct: 1, wrongFeedback: '12÷12=1.', revenueReward: 40, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большая раздача',
        request: 'ФИНАЛ: 88 семечек на 88 попугаев поровну. По сколько?',
        correct: 1,
        wrongFeedback: 'a÷a=1. Каждому ровно по 1 семечке.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L4, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай правила',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток правил', emoji: '⚖️' },
      intro: 'Самые частые ошибки в особых случаях.',
      traps: [
        { id: 'tr1', wrongStatement: '«7 ÷ 1 = 1»', whyWrong: 'Перепутал правила. На 1 — число не меняется: 7÷1=7. На 1 получается, только когда a÷a.', correctStatement: '7 ÷ 1 = 7', rememberNote: 'a÷1=a, не 1!' },
        { id: 'tr2', wrongStatement: '«5 ÷ 5 = 5»', whyWrong: 'На самого себя всегда получается 1, а не само число. 5÷5=1.', correctStatement: '5 ÷ 5 = 1', rememberNote: 'a÷a=1, не a!' },
        { id: 'tr3', wrongStatement: '«5 ÷ 0 = 5» или «5 ÷ 0 = 0»', whyWrong: 'На ноль делить нельзя! Это не «как на 1». Деление на 0 — запрещено.', correctStatement: 'На 0 делить нельзя', rememberNote: 'a÷0 — запрещено!' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни правила',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату',
      voicePrompt: 'Расскажи два правила деления',
      coverPrompts: ['Что получается при делении на 1?', 'А при делении числа на самого себя?', 'Что нельзя делать?'],
      referenceAnswer: 'Когда мы делим любое число на 1, получаем то же самое число: a ÷ 1 = a. Например, 9 ÷ 1 = 9. Когда мы делим число на самого себя, всегда получаем 1: a ÷ a = 1. Например, 7 ÷ 7 = 1. На 0 делить нельзя — это запрещено.',
      requiredConcepts: ['деление', 'единица', 'правило'],
      conceptKeywords: {
        деление: ['делен', 'делит'],
        единица: ['едини', 'один', '1'],
        правило: ['правил']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['делен', 'едини'] }
  })

  await insert({
    lessonId: L4, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Деление на 1 и на себя · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '11 ÷ 1 = ?', correctAnswer: 11, conceptTag: 'на-1', cognitiveLevel: 'recall', explanation: 'a÷1=a.' },
        { id: 'm2', kind: 'numeric', prompt: '9 ÷ 9 = ?', correctAnswer: 1, conceptTag: 'само-на-себя', cognitiveLevel: 'recall', explanation: 'a÷a=1.' },
        { id: 'm3', kind: 'numeric', prompt: '45 ÷ 1 = ?', correctAnswer: 45, conceptTag: 'на-1', cognitiveLevel: 'apply', explanation: 'Делим на 1 — число не меняется.' },
        { id: 'm4', kind: 'numeric', prompt: '24 ÷ 24 = ?', correctAnswer: 1, conceptTag: 'само-на-себя', cognitiveLevel: 'apply', explanation: '24÷24=1.' },
        { id: 'm5', kind: 'choice', prompt: 'Что НЕЛЬЗЯ делать?', options: ['Делить на 1', 'Делить число на самого себя', 'Делить на 0'], correctIndex: 2, conceptTag: 'теория', cognitiveLevel: 'understand', explanation: 'На ноль делить нельзя.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '17 ÷ 1 = ?', correctAnswer: 17, conceptTag: 'на-1', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '13 ÷ 13 = ?', correctAnswer: 1, conceptTag: 'само-на-себя', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: '99 ÷ 1 = ?', correctAnswer: 99, conceptTag: 'на-1', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '50 ÷ 50 = ?', correctAnswer: 1, conceptTag: 'само-на-себя', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: 'a ÷ 1 = ?', options: ['1', 'a', '0'], correctIndex: 1, conceptTag: 'правило', cognitiveLevel: 'understand' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Смысл деления', layersInsertedByLesson: counter }
})
