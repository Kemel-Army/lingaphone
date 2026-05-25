import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Числовые и буквенные выражения».
 *   1. Числовые выражения и порядок действий
 *   2. Буквенные выражения
 *   3. Свойства сложения и умножения
 *
 * S6: тема №15, theme-pack = 'cafe' (применение в чеках, скидках).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (🪜/🔤/🔄).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Числовые и буквенные выражения')
  const L1 = lessonIds['Числовые выражения и порядок действий']
  const L2 = lessonIds['Буквенные выражения']
  const L3 = lessonIds['Свойства сложения и умножения']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Числовые и буквенные выражения»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Порядок действий
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Кто первый?',
    subtitle: 'Порядок действий',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '12 + 3 × 2 — это 30 или 18? Кто прав?',
      body: 'Сначала умножение, потом сложение. Получится 18.',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🥇', accent: 'rose', caption: '1. Скобки' },
        { emoji: '✖️', accent: 'amber', caption: '2. × и ÷' },
        { emoji: '➕', accent: 'sky', caption: '3. + и −' }
      ],
      prompt: 'Какое действие выполняется первым?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Сложение' },
        { id: 'b', emoji: '🥇', label: 'Умножение', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Слева направо' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь порядок?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '5 + 3 × 2 = ?', options: ['16', '11', '13', '30'], correctIndex: 1, conceptTag: 'приоритет', explanation: '3×2=6, 5+6=11.' },
        { id: 'd2', prompt: '(5 + 3) × 2 = ?', options: ['16', '11', '13', '30'], correctIndex: 0, conceptTag: 'скобки', explanation: 'Скобки 8, 8×2=16.' },
        { id: 'd3', prompt: 'Что первее: × или +?', options: ['×', '+', 'Любое', 'Не знаю'], correctIndex: 0, conceptTag: 'правило', explanation: '× раньше +.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Очерёдность',
    subtitle: 'Кто сильнее в выражении',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 30, step: 1 },
      probes: [
        { id: 'p1', prompt: '12 − 4 + 3. Слева направо — что в конце?', options: ['11', '5', '19', '12'], correctIndex: 0 },
        { id: 'p2', prompt: '4 × 2 + 3. Что первое?', options: ['4×2', '2+3', '4+3', 'Любое'], correctIndex: 0 }
      ],
      copy: { headline: 'Сначала × и ÷, потом + и −. Скобки — самые первые.', body: 'Это и есть порядок действий.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правила порядка',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Лестница приоритетов',
          panels: [
            { emoji: '🥇', accent: 'rose', caption: '1. Скобки ()' },
            { emoji: '🥈', accent: 'amber', caption: '2. × и ÷' },
            { emoji: '🥉', accent: 'sky', caption: '3. + и −' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Порядок действий:** 1) Скобки. 2) × и ÷. 3) + и −.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '5 + 3 \\times 2 = 5 + 6 = 11' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А несколько одинаковых?',
          revealedKind: 'text',
          revealedContent: 'Если несколько × и ÷ или несколько + и − — действуем слева направо.',
          revealedHint: 'Одинаковые — по очереди.'
        },
        { id: 'c5', kind: 'formula', content: '(5 + 3) \\times 2 = 8 \\times 2 = 16' }
      ],
      checks: [
        { id: 'ch1', prompt: '7 + 4 × 2 = ?', options: ['22', '15', '11', '14'], correctIndex: 1 },
        { id: 'ch2', prompt: '20 − 3 × 4 = ?', options: ['68', '8', '17', '23'], correctIndex: 1 },
        { id: 'ch3', prompt: '(6 + 2) × 3 = ?', options: ['12', '24', '20', '18'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Лестница приоритетов',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Порядок действий',
      anatomy: [
        { id: 'a1', label: '1. Скобки', role: 'самые первые', accent: 'rose' },
        { id: 'a2', label: '2. × и ÷', role: 'умножение и деление', accent: 'amber' },
        { id: 'a3', label: '3. + и −', role: 'сложение и вычитание', accent: 'sky' }
      ],
      terms: [
        { term: 'Числовое выражение', definition: 'Запись из чисел и знаков действий.', example: '5 + 3 × 2', speakText: 'Числовое выражение' },
        { term: 'Значение выражения', definition: 'Число, которое получается после вычисления.', example: '5+3×2=11', speakText: 'Значение — результат' }
      ],
      buildTask: {
        prompt: '5 + 3 × 2 = ___',
        template: '___',
        expected: ['11'],
        distractors: ['16', '13', '30', '8', '6']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем выражения',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: скобки → × и ÷ → + и −.',
      examples: [
        {
          id: 'ex1', problem: '20 − 4 × 3', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сначала ×', explanation: '4 × 3 = 12.', visual: { kind: 'board', boardLines: ['20 − 4 × 3', '\\downarrow', '20 − 12'] }, action: { kind: 'numeric', prompt: '4×3?', expected: 12 } },
            { index: 2, title: 'Потом −', explanation: '20 − 12 = 8.', action: { kind: 'numeric', prompt: 'Итого:', expected: 8 } }
          ]
        },
        {
          id: 'ex2', problem: '(15 − 5) × 2', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Скобки', explanation: '15−5=10. Потом 10×2=20.', action: { kind: 'numeric', prompt: '?', expected: 20 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем порядок',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини выражение с ответом',
          left: [
            { id: 'L1', label: '5 + 3 × 2' },
            { id: 'L2', label: '(5 + 3) × 2' },
            { id: 'L3', label: '20 − 4 × 3' },
            { id: 'L4', label: '(10 − 4) × 3' }
          ],
          right: [
            { id: 'R1', label: '11', pairId: 'L1' },
            { id: 'R2', label: '16', pairId: 'L2' },
            { id: 'R3', label: '8', pairId: 'L3' },
            { id: 'R4', label: '18', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '6 × 2 + 5 = ?', correctAnswer: 17 },
        { kind: 'numeric', id: 't3', prompt: '15 − (6 + 4) = ?', correctAnswer: 5 },
        { kind: 'numeric', id: 't4', prompt: '8 ÷ 2 + 3 = ?', correctAnswer: 7 },
        { kind: 'numeric', id: 't5', prompt: '4 × 5 − 8 = ?', correctAnswer: 12 },
        { kind: 'numeric', id: 't6', prompt: '(8 + 2) × 3 = ?', correctAnswer: 30 }
      ],
      socraticHints: {
        t2: ['Сначала умножение, потом +.'],
        t3: ['Скобки сначала.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Чек в кафе',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе с заказами',
        roleplay: 'Считай чеки, когда несколько товаров одного вида и разные.',
        characterName: 'Кассир Алия',
        mascotLine: 'Сначала умножение цен, потом сложение!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: '3 ручки по 20 тг + блокнот 50 тг. Чек?', correct: 110, wrongFeedback: '3×20+50=110.', revenueReward: 110, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: '5 яблок по 10 + 2 банана по 30. Чек?', correct: 110, wrongFeedback: '50+60=110.', revenueReward: 110, reputationReward: 1 },
        { id: 'o3', customer: 'Школьник', request: '4 шоколадки по 25. Заплатил 100, дал на сдачу 20. Стоит?', correct: 80, wrongFeedback: '4×25=100, 100−20=80.', revenueReward: 80, reputationReward: 1 },
        { id: 'o4', customer: 'Турист', request: '(8 + 2) × 5 (10 фруктов по 5). Сколько?', correct: 50, wrongFeedback: '10×5=50.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой стол',
        request: 'ФИНАЛ: 6 кофе по 200 + 4 десерта по 150. Чек?',
        correct: 1800,
        wrongFeedback: '1200+600=1800.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Игнорировал × — ошибся',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Хранитель порядка', emoji: '🪜' },
      intro: 'Самая частая ошибка — считать слева направо.',
      traps: [
        { id: 'tr1', wrongStatement: '«5 + 3 × 2 = 16»', whyWrong: 'Сначала умножение: 3×2=6, потом 5+6=11.', correctStatement: '11', rememberNote: '× раньше +.' },
        { id: 'tr2', wrongStatement: 'Игнорировал скобки', whyWrong: 'Скобки — приоритет. Не пропускай.', correctStatement: 'Скобки сначала', rememberNote: '() — №1.' },
        { id: 'tr3', wrongStatement: '«2 × 3 + 1 = 8»', whyWrong: 'Сначала 2×3=6, потом +1=7. Не 8.', correctStatement: '7', rememberNote: 'Считай аккуратно.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни порядок',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи порядок действий',
      coverPrompts: ['Какой порядок действий?', 'Что первее: × или +?', 'Покажи на 5 + 3 × 2.'],
      referenceAnswer: 'Сначала выполняем то, что в скобках. Потом умножение и деление. И только в конце сложение и вычитание. Например, 5 + 3 × 2: сначала 3×2=6, потом 5+6=11. Если есть скобки, всё, что в них — самое первое.',
      requiredConcepts: ['порядок', 'скобки', 'умножение'],
      conceptKeywords: {
        порядок: ['порядок', 'очеред'],
        скобки: ['скобк'],
        умножение: ['умнож', '×']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['скобк', 'умнож'] }
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
      shareCapsuleName: 'Порядок действий · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '4 + 2 × 3 = ?', correctAnswer: 10, conceptTag: 'приоритет', cognitiveLevel: 'apply', explanation: '2×3=6, 4+6=10.' },
        { id: 'm2', kind: 'numeric', prompt: '(4 + 2) × 3 = ?', correctAnswer: 18, conceptTag: 'скобки', cognitiveLevel: 'apply', explanation: '6×3.' },
        { id: 'm3', kind: 'numeric', prompt: '15 − 2 × 4 = ?', correctAnswer: 7, conceptTag: 'приоритет', cognitiveLevel: 'apply', explanation: '15−8.' },
        { id: 'm4', kind: 'numeric', prompt: '10 + 6 ÷ 2 = ?', correctAnswer: 13, conceptTag: 'приоритет', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '3 ручки по 15 + 5 тг = ?', correctAnswer: 50, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '7 + 3 × 4 = ?', correctAnswer: 19, conceptTag: 'приоритет', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '(7 + 3) × 4 = ?', correctAnswer: 40, conceptTag: 'скобки', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '20 − 5 × 2 = ?', correctAnswer: 10, conceptTag: 'приоритет', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '12 ÷ 3 + 5 = ?', correctAnswer: 9, conceptTag: 'приоритет', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '4 кофе по 200 + 50 тг чай = ?', correctAnswer: 850, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Буквенные выражения
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Буква вместо числа',
    subtitle: 'a, b, x — переменные',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'a + 5 — это пока неизвестное число плюс 5.',
      body: 'Если a = 3, тогда a + 5 = 8. Буквы делают математику гибкой!',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🔤', accent: 'sky', caption: 'a — буква-переменная' },
        { emoji: '✏️', accent: 'amber', caption: 'a = 4 (подставили)' },
        { emoji: '🎯', accent: 'emerald', caption: 'a + 6 = 4 + 6 = 10!' }
      ],
      prompt: 'Если a = 4, чему равно a + 6?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '10', isPrimary: true },
        { id: 'b', emoji: '🤯', label: '46' },
        { id: 'c', emoji: '🤔', label: '4' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Понимаешь буквы?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Если b = 5, то b + 2 = ?', options: ['52', '7', '5', '25'], correctIndex: 1, conceptTag: 'подстановка', explanation: '5+2=7.' },
        { id: 'd2', prompt: 'Если x = 10, то x − 3 = ?', options: ['7', '13', '103', '30'], correctIndex: 0, conceptTag: 'подстановка', explanation: '10−3=7.' },
        { id: 'd3', prompt: 'a + b — это:', options: ['Число', 'Слово', 'Выражение с буквами', 'Не знаю'], correctIndex: 2, conceptTag: 'теория', explanation: 'Буквенное выражение.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Подставляем число',
    subtitle: 'a — место для числа',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 20, step: 1 },
      probes: [
        { id: 'p1', prompt: 'a + 3, если a = 5. Чему равно?', options: ['8', '15', '53', '5'], correctIndex: 0 },
        { id: 'p2', prompt: 'a + 3, если a = 7?', options: ['10', '7', '37', '13'], correctIndex: 0 }
      ],
      copy: { headline: 'a — это «пока не знаем». Подставь число — узнаешь.', body: 'Каждое значение a даёт свой результат.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Что такое буквенное выражение',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Подстановка за 3 кадра',
          panels: [
            { emoji: '📝', accent: 'sky', caption: 'Дано: a + 5' },
            { emoji: '✏️', accent: 'amber', caption: 'a = 3 (пишем число)' },
            { emoji: '🎯', accent: 'emerald', caption: '3 + 5 = 8!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Буквенное выражение** — запись с числами, буквами и знаками действий. Буква — это пока неизвестное число.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a + 5,\\quad x - 3,\\quad 2 \\cdot b' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Зачем нужны буквы?',
          revealedKind: 'text',
          revealedContent: 'При разных значениях буквы выражение даёт разные результаты. Это позволяет описать одну формулу для многих случаев — например, скидку при любой цене.',
          revealedHint: 'Гибкость = универсальность.'
        },
        { id: 'c5', kind: 'text', content: 'Чтобы вычислить, нужно подставить число вместо буквы. Если b = 4, то 2·b = 8.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'x + 7, при x = 3', options: ['10', '37', '7', '4'], correctIndex: 0 },
        { id: 'ch2', prompt: '2·a, при a = 6', options: ['12', '8', '26', '4'], correctIndex: 0 },
        { id: 'ch3', prompt: 'a − b при a=10, b=4', options: ['14', '6', '40', '104'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Структура',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'a + 5 при a = 3',
      anatomy: [
        { id: 'a1', label: 'a', role: 'буква-переменная', accent: 'sky' },
        { id: 'a2', label: '5', role: 'число', accent: 'amber' },
        { id: 'a3', label: 'a + 5', role: 'выражение', accent: 'green' },
        { id: 'a4', label: 'a = 3 → 8', role: 'значение', accent: 'rose' }
      ],
      terms: [
        { term: 'Переменная', definition: 'Буква, которая может принимать разные значения.', example: 'a, b, x', speakText: 'Переменная — буква' },
        { term: 'Подстановка', definition: 'Замена буквы числом для вычисления.', example: 'a+5 при a=3 → 8', speakText: 'Подстановка — заменить буквой число' }
      ],
      buildTask: {
        prompt: 'a + 5 при a = 3, значение = ___',
        template: '___',
        expected: ['8'],
        distractors: ['35', '53', '15', '2', '5']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Подставляем и считаем',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: вместо буквы запиши число → посчитай.',
      examples: [
        {
          id: 'ex1', problem: 'Найди значение x + 12 при x = 8', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Подставь', explanation: 'Вместо x пишем 8: 8 + 12.', visual: { kind: 'board', boardLines: ['x + 12 \\\\ x = 8 \\\\ \\downarrow \\\\ 8 + 12'] }, action: { kind: 'numeric', prompt: 'Что подставить?', expected: 8 } },
            { index: 2, title: 'Считай', explanation: '8 + 12 = 20.', action: { kind: 'numeric', prompt: '?', expected: 20 } }
          ]
        },
        {
          id: 'ex2', problem: '2·a − 3 при a = 5', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '2·5=10, 10−3=7.', action: { kind: 'numeric', prompt: '?', expected: 7 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем подстановку',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини выражение со значением',
          left: [
            { id: 'L1', label: 'a + 7 при a=3' },
            { id: 'L2', label: 'b − 5 при b=12' },
            { id: 'L3', label: '2·x при x=4' },
            { id: 'L4', label: 'a + b при a=6, b=9' }
          ],
          right: [
            { id: 'R1', label: '10', pairId: 'L1' },
            { id: 'R2', label: '7', pairId: 'L2' },
            { id: 'R3', label: '8', pairId: 'L3' },
            { id: 'R4', label: '15', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'x + 10 при x=15', correctAnswer: 25 },
        { kind: 'numeric', id: 't3', prompt: '3·a при a=5', correctAnswer: 15 },
        { kind: 'numeric', id: 't4', prompt: 'b − 8 при b=20', correctAnswer: 12 },
        { kind: 'numeric', id: 't5', prompt: 'a + b − 5 при a=4, b=8', correctAnswer: 7 },
        { kind: 'numeric', id: 't6', prompt: '2·a + 1 при a=6', correctAnswer: 13 }
      ],
      socraticHints: {
        t2: ['Замени x на 15.'],
        t5: ['Замени обе буквы.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Магазин с переменной ценой',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе с акциями',
        roleplay: 'Цены меняются. Используй буквы для скидок.',
        characterName: 'Менеджер Жанна',
        mascotLine: 'Подставь число — получишь цену!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: 'Цена a + 5 (бонус). Если a = 30, чек?', correct: 35, wrongFeedback: '30+5=35.', revenueReward: 35, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: 'a − 10 (скидка). При a = 50, чек?', correct: 40, wrongFeedback: '50−10=40.', revenueReward: 40, reputationReward: 1 },
        { id: 'o3', customer: 'Школьник', request: '2·a (двойная цена). При a = 15, чек?', correct: 30, wrongFeedback: '2×15=30.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Турист', request: 'a + b. При a=20, b=30, чек?', correct: 50, wrongFeedback: '20+30=50.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Юбилей',
        request: 'ФИНАЛ: 3·a − 50 (скидка по карте). При a = 100, чек?',
        correct: 250,
        wrongFeedback: '300−50=250.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не приклеивай',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Подставщик', emoji: '🔤' },
      intro: 'Подставь, не приклей.',
      traps: [
        { id: 'tr1', wrongStatement: '«a + 5 при a=3 = 35»', whyWrong: 'Не приклеивай! Это сложение: 3+5=8.', correctStatement: '8', rememberNote: 'Подстановка, не склейка.' },
        { id: 'tr2', wrongStatement: 'Считал, что буква = 0', whyWrong: 'Буква = то, что задали. Если a=5, то a — это 5.', correctStatement: 'Подставь заданное', rememberNote: 'Какое число — такое и подставь.' },
        { id: 'tr3', wrongStatement: 'Не подставил все буквы', whyWrong: 'Если a и b — обе буквы, обе нужно подставить.', correctStatement: 'Замени все буквы', rememberNote: 'Все по очереди.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни буквы',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как считать буквенное выражение',
      coverPrompts: ['Что такое буквенное выражение?', 'Как найти его значение?', 'Покажи на a + 7 при a = 3.'],
      referenceAnswer: 'Буквенное выражение — это запись с буквами, числами и знаками действий. Буква — это пока неизвестное число. Чтобы найти значение, подставляем число вместо буквы и считаем. Например, a + 7 при a = 3: подставляем 3 вместо a, получаем 3 + 7 = 10.',
      requiredConcepts: ['буква', 'подстановка'],
      conceptKeywords: {
        буква: ['букв', 'переменн'],
        подстановка: ['подстав', 'замени']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['букв', 'подстав'] }
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
      shareCapsuleName: 'Буквенные выражения · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'a + 9 при a = 4', correctAnswer: 13, conceptTag: 'подст', cognitiveLevel: 'recall', explanation: '4+9.' },
        { id: 'm2', kind: 'numeric', prompt: 'b − 6 при b = 15', correctAnswer: 9, conceptTag: 'подст', cognitiveLevel: 'apply', explanation: '15−6.' },
        { id: 'm3', kind: 'numeric', prompt: '2·x при x = 7', correctAnswer: 14, conceptTag: 'подст', cognitiveLevel: 'apply', explanation: '2×7.' },
        { id: 'm4', kind: 'numeric', prompt: 'a + b при a = 5, b = 8', correctAnswer: 13, conceptTag: 'две-перем', cognitiveLevel: 'apply', explanation: '5+8.' },
        { id: 'm5', kind: 'numeric', prompt: 'Цена a + 10. При a = 25, чек?', correctAnswer: 35, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'a + 12 при a = 8', correctAnswer: 20, conceptTag: 'подст', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: 'b − 7 при b = 18', correctAnswer: 11, conceptTag: 'подст', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '3·x при x = 6', correctAnswer: 18, conceptTag: 'подст', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'a − b при a = 14, b = 5', correctAnswer: 9, conceptTag: 'две-перем', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '2·a + 5 при a = 6', correctAnswer: 17, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Свойства сложения и умножения
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'a + b = b + a',
    subtitle: 'Переместительный закон',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Можно поменять числа местами при сложении и умножении.',
      body: 'a + b = b + a и a · b = b · a.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🔄', accent: 'sky', caption: '5 + 3 = 3 + 5' },
        { emoji: '✖️', accent: 'amber', caption: '4 · 6 = 6 · 4' },
        { emoji: '🚫', accent: 'rose', caption: 'НО: 5 − 3 ≠ 3 − 5!' }
      ],
      prompt: 'Можно поменять числа местами при вычитании?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Да' },
        { id: 'b', emoji: '🥇', label: 'Нет', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Иногда' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь свойства?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '5 + 3 = ?', options: ['Так же, как 3 + 5', 'Нельзя поменять', 'Не знаю'], correctIndex: 0, conceptTag: 'перемест', explanation: 'a+b=b+a.' },
        { id: 'd2', prompt: '4 · 6 = ?', options: ['Так же, как 6 · 4', 'Нет', 'Иногда'], correctIndex: 0, conceptTag: 'перемест', explanation: 'a·b=b·a.' },
        { id: 'd3', prompt: '(2+3)+4 равно 2+(3+4)?', options: ['Да', 'Нет', 'Зависит'], correctIndex: 0, conceptTag: 'сочетат', explanation: 'Сочетательный.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Меняем местами',
    subtitle: 'Массив одинаков',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 5, minCols: 2, maxCols: 5, defaultRows: 3, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: '3×4 и 4×3 — одинаково?', options: ['Да', 'Нет'], correctIndex: 0 },
        { id: 'p2', prompt: '12−5 и 5−12?', options: ['Одинаково', 'Разное'], correctIndex: 1 }
      ],
      copy: { headline: 'При + и × — можно менять. При − и ÷ — нельзя.', body: 'Запомни различие!' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Свойства',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Два закона',
          panels: [
            { emoji: '🔄', accent: 'sky', caption: 'Перемест: a+b=b+a' },
            { emoji: '🤝', accent: 'amber', caption: 'Сочетат: (a+b)+c=a+(b+c)' },
            { emoji: '🚫', accent: 'rose', caption: 'НЕ для − и ÷!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Переместительный:** a + b = b + a и a · b = b · a.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'callout', content: '**Сочетательный:** (a + b) + c = a + (b + c). Группируем как удобно.' },
        { id: 'c4', kind: 'formula', content: '5 + 7 = 7 + 5 = 12' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Зачем это нужно?',
          revealedKind: 'text',
          revealedContent: 'Удобная группировка экономит время. 25 + 17 + 75 → лучше (25+75)+17 = 100+17 = 117.',
          revealedHint: 'Ищи пары, дающие круглое.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: '8 + 6 = ? + 8', options: ['8', '6', '14', '0'], correctIndex: 1 },
        { id: 'ch2', prompt: '5·9 = 9·?', options: ['5', '9', '45', '1'], correctIndex: 0 },
        { id: 'ch3', prompt: '(7+3)+5 = 7+(3+5)?', options: ['Да', 'Нет', 'Иногда'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Два закона',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Свойства + и ×',
      anatomy: [
        { id: 'a1', label: 'a + b = b + a', role: 'переместительный для +', accent: 'sky' },
        { id: 'a2', label: 'a·b = b·a', role: 'переместительный для ×', accent: 'green' },
        { id: 'a3', label: '(a+b)+c = a+(b+c)', role: 'сочетательный', accent: 'amber' }
      ],
      terms: [
        { term: 'Переместительный закон', definition: 'Слагаемые/множители можно менять местами.', example: '5+3=3+5', speakText: 'Перемещай местами' },
        { term: 'Сочетательный закон', definition: 'Слагаемые/множители можно группировать.', example: '(2+3)+4 = 2+(3+4)', speakText: 'Сочетай как удобно' }
      ],
      buildTask: {
        prompt: '25 + 17 + 75 = ___ (группируй удобно)',
        template: '___',
        expected: ['117'],
        distractors: ['100', '92', '127', '17', '175']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Применяем свойства',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Удобная группировка экономит время.',
      examples: [
        {
          id: 'ex1', problem: 'Посчитай 25 + 17 + 75 умно', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сгруппируй', explanation: 'Сначала 25+75=100, потом +17.', visual: { kind: 'board', boardLines: ['(25 + 75) + 17 = 100 + 17'] }, action: { kind: 'numeric', prompt: '25+75?', expected: 100 } },
            { index: 2, title: 'Считаем', explanation: '100+17=117.', action: { kind: 'numeric', prompt: '?', expected: 117 } }
          ]
        },
        {
          id: 'ex2', problem: '4 · 17 · 25', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Группа', explanation: '4×25=100, ×17=1700.', action: { kind: 'numeric', prompt: '?', expected: 1700 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем свойства',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сумму с ответом',
          left: [
            { id: 'L1', label: '8 + 6 + 2 (умно)' },
            { id: 'L2', label: '5 · 4 · 2' },
            { id: 'L3', label: '15 + 7 + 5' },
            { id: 'L4', label: '50 + 23 + 50' }
          ],
          right: [
            { id: 'R1', label: '16', pairId: 'L1' },
            { id: 'R2', label: '40', pairId: 'L2' },
            { id: 'R3', label: '27', pairId: 'L3' },
            { id: 'R4', label: '123', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '4 + 8 = ? + 4', correctAnswer: 8 },
        { kind: 'numeric', id: 't3', prompt: '20 + 17 + 30 = ?', correctAnswer: 67 },
        { kind: 'numeric', id: 't4', prompt: '2·6·5 = ?', correctAnswer: 60 },
        { kind: 'numeric', id: 't5', prompt: '7 + 9 + 3 = ?', correctAnswer: 19 },
        { kind: 'numeric', id: 't6', prompt: '4 · 9 · 25 = ?', correctAnswer: 900 }
      ],
      socraticHints: {
        t3: ['20+30=50, +17=67.'],
        t4: ['2·5=10, ×6=60.'],
        t6: ['4·25=100, ×9=900.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Учёт груза',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе на перевозках',
        roleplay: 'Помоги бухгалтеру считать суммы — группируй удобно!',
        characterName: 'Бухгалтер Айтуар',
        mascotLine: 'Группируй удобные числа!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Заказ', request: '15 + 8 + 25. Сколько (умно)?', correct: 48, wrongFeedback: '15+25=40, +8.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Учёт', request: '2 · 9 · 5 (группируй)', correct: 90, wrongFeedback: '2×5=10, ×9.', revenueReward: 90, reputationReward: 1 },
        { id: 'o3', customer: 'Поставка', request: '17 + 12 + 13', correct: 42, wrongFeedback: '17+13=30, +12.', revenueReward: 40, reputationReward: 1 },
        { id: 'o4', customer: 'Ревизия', request: '4 · 6 · 5', correct: 120, wrongFeedback: '4×5=20, ×6.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой счёт',
        request: 'ФИНАЛ: 75 + 45 + 25 = ? (умно)',
        correct: 145,
        wrongFeedback: '75+25=100, +45=145.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не для − и ÷',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Группировщик', emoji: '🔄' },
      intro: 'Только для + и ×.',
      traps: [
        { id: 'tr1', wrongStatement: '«5 − 3 = 3 − 5»', whyWrong: 'Для вычитания нельзя! 5−3=2, а 3−5 — отрицательное.', correctStatement: 'Только для + и ×', rememberNote: 'Не для −.' },
        { id: 'tr2', wrongStatement: '«10 ÷ 2 = 2 ÷ 10»', whyWrong: 'Для деления тоже нельзя.', correctStatement: 'Не для ÷', rememberNote: 'Только × и +.' },
        { id: 'tr3', wrongStatement: 'Не использовал группировку', whyWrong: 'Группировка экономит время — пользуйся!', correctStatement: 'Группируй удобно', rememberNote: 'Удобство — твой друг.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни свойства',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи переместительный и сочетательный',
      coverPrompts: ['Что такое переместительный закон?', 'А сочетательный?', 'Для каких действий это работает?'],
      referenceAnswer: 'Переместительный закон: a + b = b + a и a · b = b · a — слагаемые и множители можно менять местами. Сочетательный: (a+b)+c = a+(b+c) — числа можно группировать как удобно. Это работает только для сложения и умножения. Для вычитания и деления — нельзя.',
      requiredConcepts: ['переместительный', 'сочетательный'],
      conceptKeywords: {
        переместительный: ['перемест', 'местам'],
        сочетательный: ['сочетат', 'группир']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['перемест', 'сочет'] }
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
      shareCapsuleName: 'Свойства + и × · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '6 + 8 = ? + 6', correctAnswer: 8, conceptTag: 'перемест', cognitiveLevel: 'apply', explanation: 'a+b=b+a.' },
        { id: 'm2', kind: 'numeric', prompt: '5 · 7 = 7 · ?', correctAnswer: 5, conceptTag: 'перемест', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: '15 + 6 + 5 = ? (умно)', correctAnswer: 26, conceptTag: 'сочетат', cognitiveLevel: 'apply', explanation: '15+5+6.' },
        { id: 'm4', kind: 'choice', prompt: 'Можно поменять местами в 7 − 3?', options: ['Да', 'Нет'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'numeric', prompt: '2 · 9 · 5 = ?', correctAnswer: 90, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '3 + 9 = ? + 3', correctAnswer: 9, conceptTag: 'перемест', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '4 · 8 = 8 · ?', correctAnswer: 4, conceptTag: 'перемест', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '12 + 5 + 8 = ? (умно)', correctAnswer: 25, conceptTag: 'сочетат', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: 'Можно ли менять в 20 ÷ 4?', options: ['Да', 'Нет'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'p5', kind: 'numeric', prompt: '5 · 8 · 2 = ? (группируй)', correctAnswer: 80, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Числовые и буквенные выражения', layersInsertedByLesson: counter }
})
