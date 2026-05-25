import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 1 lesson of «Деньги. Монеты и купюры».
 *   1. Монеты и купюры. Покупки и сдача
 *
 * S6: тема №14, theme-pack = 'cafe' (естественное продолжение 17 — стоимость).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badge 💰.
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Деньги. Монеты и купюры')
  const L1 = lessonIds['Монеты и купюры. Покупки и сдача']
  if (!L1) throw createError({ statusCode: 500, message: 'Lesson missing for «Деньги. Монеты и купюры»' })

  await wipeLayersForLessons(supabase, [L1])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Тенге в кошельке',
    subtitle: 'Монеты и купюры Казахстана',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Монеты: 50 и 100 тг. Купюры: 200, 500, 1000, 5000 тг.',
      body: 'Зная это, ты сам ходишь в магазин и считаешь сдачу.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'cheer',
      frames: [
        { emoji: '🪙', accent: 'amber', caption: 'Монеты: 50 и 100 тг' },
        { emoji: '💵', accent: 'sky', caption: 'Купюры: 200, 500, 1000...' },
        { emoji: '💰', accent: 'emerald', caption: 'Считаем как обычные числа!' }
      ],
      prompt: 'Сколько 50-тенговых монет в 200 тенге?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '2' },
        { id: 'b', emoji: '🥇', label: '4', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '5' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что знаешь о тенге?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Сколько 100-тенговых монет в 500 тг?', options: ['3', '5', '10', '50'], correctIndex: 1, conceptTag: 'размен', explanation: '500÷100=5.' },
        { id: 'd2', prompt: 'Купил на 30 тг, дал 100. Сдача?', options: ['70', '130', '30', '100'], correctIndex: 0, conceptTag: 'сдача', explanation: '100−30=70.' },
        { id: 'd3', prompt: 'Какая самая большая монета (не купюра)?', options: ['50 тг', '100 тг', '200 тг', '500 тг'], correctIndex: 1, conceptTag: 'теория', explanation: 'Самая крупная монета — 100 тг.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Размен в кошельке',
    subtitle: 'Купюры и сдача',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'grouping', totalItems: 10, groupsRange: [2, 5] },
      probes: [
        { id: 'p1', prompt: 'У тебя 200 тг купюрой. Купил на 80. Сдача?', options: ['80', '120', '200', '20'], correctIndex: 1, explanation: '200−80=120.' },
        { id: 'p2', prompt: '5 монет по 100 тг. Сколько всего?', options: ['100', '500', '50', '5'], correctIndex: 1, explanation: '5×100=500.' }
      ],
      copy: { headline: 'Складываем номиналы как обычные числа', body: 'Не важно, монета это или купюра — главное, правильно сложить.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Считаем тенге',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Покупка за 3 кадра',
          panels: [
            { emoji: '🛒', accent: 'sky', caption: 'Сложи цены товаров' },
            { emoji: '💵', accent: 'amber', caption: 'Дай купюру кассиру' },
            { emoji: '🪙', accent: 'emerald', caption: 'Получи сдачу!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Тенге — деньги Казахстана.** Монеты: 50, 100 тг. Купюры: 200, 500, 1000, 2000, 5000, 10000, 20000 тг.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '\\text{Сдача} = \\text{дано} - \\text{чек}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Что такое размен?',
          revealedKind: 'text',
          revealedContent: 'Размен — превращение крупной купюры в мелкие. 1 купюра 500 тг = 5 монет по 100 или 10 монет по 50.',
          revealedHint: 'Сумма не меняется, форма меняется.'
        },
        { id: 'c5', kind: 'text', content: 'Чтобы посчитать сдачу — из суммы, которую ты дал, вычитаем стоимость покупки.' }
      ],
      checks: [
        { id: 'ch1', prompt: '2 купюры по 200 + 1 монета 100 = ?', options: ['400', '500', '300', '700'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Купил на 65 тг, дал 100. Сдача?', options: ['35', '135', '65', '100'], correctIndex: 0 },
        { id: 'ch3', prompt: '500 тг = ? монет по 100', options: ['2', '5', '10', '50'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Номиналы тенге',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Деньги Казахстана',
      anatomy: [
        { id: 'a1', label: '50 и 100 тг', role: 'монеты', accent: 'sky' },
        { id: 'a2', label: '200, 500, 1000 тг', role: 'купюры', accent: 'green' },
        { id: 'a3', label: '2000, 5000, 10000', role: 'крупные купюры', accent: 'amber' }
      ],
      terms: [
        { term: 'Сдача', definition: 'Разница между уплаченной суммой и стоимостью.', example: 'Дал 100, чек 70 → сдача 30', speakText: 'Сдача — дано минус чек' },
        { term: 'Размен', definition: 'Замена купюры на мелкие той же суммы.', example: '500 = 5 × 100', speakText: 'Размен — обмен на мелкие' }
      ],
      buildTask: {
        prompt: 'Дал 200 тг, чек 75 тг. Сдача = ___',
        template: '___',
        expected: ['125'],
        distractors: ['275', '75', '100', '150', '25']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем покупки',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм покупки: сложи цены → отдай деньги → получи сдачу.',
      examples: [
        {
          id: 'ex1', problem: 'Хлеб 80 тг, молоко 120 тг. Заплатил 500. Сдача?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сумма покупки', explanation: '80 + 120 = 200.', visual: { kind: 'board', boardLines: ['Чек = 80 + 120 = 200'] }, action: { kind: 'numeric', prompt: 'Чек:', expected: 200 } },
            { index: 2, title: 'Сдача', explanation: '500 − 200 = 300.', visual: { kind: 'board', boardLines: ['Сдача = 500 − 200 = 300'] }, action: { kind: 'numeric', prompt: 'Сдача:', expected: 300 } }
          ]
        },
        {
          id: 'ex2', problem: '3 монеты по 100 тг. Хватит на товар за 250?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '3×100=300, 300>250 — хватит. Сдача 50.', action: { kind: 'numeric', prompt: 'Сдача:', expected: 50 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем тенге',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини покупку со сдачей',
          left: [
            { id: 'L1', label: 'Чек 30, дал 100' },
            { id: 'L2', label: 'Чек 250, дал 500' },
            { id: 'L3', label: 'Чек 750, дал 1000' },
            { id: 'L4', label: 'Чек 65+35, дал 200' }
          ],
          right: [
            { id: 'R1', label: '70 тг', pairId: 'L1' },
            { id: 'R2', label: '250 тг', pairId: 'L2' },
            { id: 'R3', label: '250 тг', pairId: 'L3' },
            { id: 'R4', label: '100 тг', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '50 + 50 = ? тг', correctAnswer: 100 },
        { kind: 'numeric', id: 't3', prompt: '200 + 200 + 100 = ? тг', correctAnswer: 500 },
        { kind: 'numeric', id: 't4', prompt: '500 тг = ? монет по 50', correctAnswer: 10 },
        { kind: 'numeric', id: 't5', prompt: '3 купюры по 200 = ? тг', correctAnswer: 600 },
        { kind: 'numeric', id: 't6', prompt: '1000 тг = ? купюр по 200', correctAnswer: 5 }
      ],
      socraticHints: {
        t4: ['Сколько раз по 50 в 500?'],
        t6: ['Сколько раз по 200 в 1000?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Магазин у дома',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе-магазин «У дома»',
        roleplay: 'Ты на месте кассира. Считай чеки и сдачу.',
        characterName: 'Кассир Айгуль',
        mascotLine: 'Сдача = дано − чек!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Бабушка', request: 'Хлеб 80 + молоко 120. Дала 500. Сдача?', correct: 300, wrongFeedback: '500−200=300.', revenueReward: 200, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Сок 90 + конфеты 60. Дал 200. Сдача?', correct: 50, wrongFeedback: '200−150=50.', revenueReward: 150, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'Чай 250 + сахар 250. Дал 1000. Сдача?', correct: 500, wrongFeedback: '1000−500=500.', revenueReward: 500, reputationReward: 1 },
        { id: 'o4', customer: 'Гость', request: 'Купил на 175, дал 200. Сдача?', correct: 25, wrongFeedback: '200−175=25.', revenueReward: 175, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большая корзина',
        request: 'ФИНАЛ: 350 + 220 + 130 = чек. Дали 1000 тг. Сдача?',
        correct: 300,
        wrongFeedback: 'Чек 700, сдача 1000−700=300.',
        revenueReward: 700,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в кассе',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Финансовый гений', emoji: '💰' },
      intro: 'Касса не прощает ошибок.',
      traps: [
        { id: 'tr1', wrongStatement: '«Сдача = чек − дано»', whyWrong: 'Наоборот: дано − чек. Иначе сдача отрицательная.', correctStatement: 'Сдача = дано − чек', rememberNote: 'Дано первое, чек второе.' },
        { id: 'tr2', wrongStatement: 'Не сложил все товары перед сдачей', whyWrong: 'Сначала найди общий чек, потом считай сдачу.', correctStatement: '1) Чек, 2) Сдача', rememberNote: 'Два шага.' },
        { id: 'tr3', wrongStatement: '«500 тг = 50 монет по 10»', whyWrong: '10 тг — таких нет. Самая мелкая — 50 тг. 500 = 10 по 50 или 5 по 100.', correctStatement: 'Помни номиналы', rememberNote: '50, 100 — монеты.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни тенге',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи про деньги и сдачу',
      coverPrompts: ['Какие монеты и купюры тенге?', 'Как посчитать сдачу?', 'Сколько 100-тенговых монет в 500?'],
      referenceAnswer: 'В Казахстане монеты: 50 и 100 тенге. Купюры: 200, 500, 1000, 2000, 5000, 10000 тенге. Сдача — это разница: дано минус чек. Например, дал 200 тг при чеке 70 → сдача 130 тг. В 500 тг — 5 монет по 100 или 10 монет по 50.',
      requiredConcepts: ['тенге', 'сдача', 'монеты'],
      conceptKeywords: {
        тенге: ['тенг'],
        сдача: ['сдач'],
        монеты: ['монет', 'купюр']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['тенг', 'сдач'] }
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
      shareCapsuleName: 'Деньги · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '100 + 100 + 50 = ? тг', correctAnswer: 250, conceptTag: 'сложение', cognitiveLevel: 'recall', explanation: '250.' },
        { id: 'm2', kind: 'numeric', prompt: 'Купил на 80, дал 200. Сдача?', correctAnswer: 120, conceptTag: 'сдача', cognitiveLevel: 'apply', explanation: '200−80=120.' },
        { id: 'm3', kind: 'numeric', prompt: '1000 тг = ? купюр по 200', correctAnswer: 5, conceptTag: 'размен', cognitiveLevel: 'apply', explanation: '1000÷200=5.' },
        { id: 'm4', kind: 'numeric', prompt: 'Хлеб 70 + молоко 130. Дал 500. Сдача?', correctAnswer: 300, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '500−200=300.' },
        { id: 'm5', kind: 'numeric', prompt: 'Дал 1000, чек 875. Сдача?', correctAnswer: 125, conceptTag: 'сдача', cognitiveLevel: 'apply', explanation: '1000−875=125.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '200 + 100 + 50 = ? тг', correctAnswer: 350, conceptTag: 'сложение', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: 'Купил на 45, дал 100. Сдача?', correctAnswer: 55, conceptTag: 'сдача', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '1000 тг = ? монет по 100', correctAnswer: 10, conceptTag: 'размен', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Сок 80 + хлеб 120. Дал 500. Сдача?', correctAnswer: 300, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '2000 тг = ? купюр по 500', correctAnswer: 4, conceptTag: 'размен', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Деньги. Монеты и купюры', layersInsertedByLesson: counter }
})
