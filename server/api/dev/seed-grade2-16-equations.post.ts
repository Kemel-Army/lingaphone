import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Уравнения и неравенства».
 *   1. Простейшие уравнения
 *   2. Неравенства x < и x >
 *   3. Уравнения сложной структуры
 *
 * S6: тема №16, theme-pack = 'construction' (стройка, балансировка нагрузки).
 * Урок 1 использует уникальный BalanceScaleWidget (target='equal').
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges.
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Уравнения и неравенства')
  const L1 = lessonIds['Простейшие уравнения']
  const L2 = lessonIds['Неравенства x < и x >']
  const L3 = lessonIds['Уравнения сложной структуры']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Уравнения и неравенства»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Простейшие уравнения (★ BalanceScaleWidget)
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Найди неизвестное',
    subtitle: 'x — это спрятанный груз',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'x + 5 = 12. Что прячется за иксом?',
      body: 'Уравнение — это головоломка. Найди такое x, чтобы равенство было верным.',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '⚖️', accent: 'amber', caption: 'Слева x кирпичей и ещё 5' },
        { emoji: '🟰', accent: 'rose', caption: 'Справа 12 кирпичей' },
        { emoji: '🎯', accent: 'emerald', caption: 'Сколько должно быть x, чтобы было ровно?' }
      ],
      prompt: 'x + 5 = 12. Чему равен x?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '7', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '17' },
        { id: 'c', emoji: '🤯', label: '5' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к уравнениям?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'x + 3 = 10. x = ?', options: ['7', '13', '3', '30'], correctIndex: 0, conceptTag: 'уравнение', explanation: 'x = 10−3 = 7.' },
        { id: 'd2', prompt: 'x − 4 = 6. x = ?', options: ['2', '10', '4', '24'], correctIndex: 1, conceptTag: 'уравнение', explanation: 'x = 6+4 = 10.' },
        { id: 'd3', prompt: 'Уравнение — это:', options: ['Просто число', 'Равенство с буквой', 'Высказывание', 'Скобки'], correctIndex: 1, conceptTag: 'теория', explanation: 'Равенство с неизвестным.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  // ★ BalanceScaleWidget!
  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Балансируй весы',
    subtitle: 'Перетаскивай гири, чтобы уравновесить',
    icon: 'i-lucide-scale', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'INTUITION',
      widget: { type: 'balance-scale', maxWeight: 20, leftStart: 5, rightStart: 12, target: 'equal' },
      probes: [
        { id: 'p1', prompt: 'x + 5 = 12. Что нужно прибавить к x, чтобы получить 12?', options: ['5', '7', '12', '0'], correctIndex: 0 },
        { id: 'p2', prompt: 'Значит x = 12 − ?', options: ['12', '5', '7', '0'], correctIndex: 1, explanation: 'x = 12−5 = 7.' }
      ],
      copy: { headline: 'Уравнение — как весы: обе стороны равны', body: 'Найти x — найти такое число, при котором весы в равновесии.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как решать уравнение',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Алгоритм за 3 кадра',
          panels: [
            { emoji: '👀', accent: 'sky', caption: 'Найди что делали с x' },
            { emoji: '🔄', accent: 'amber', caption: 'Сделай обратное' },
            { emoji: '✅', accent: 'emerald', caption: 'Проверь — подставь обратно' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Чтобы найти x в x + a = b: x = b − a.** «Что прибавили — то и вычитаем».',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'x + 5 = 12 \\Rightarrow x = 12 - 5 = 7' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А если в уравнении вычитание?',
          revealedKind: 'formula',
          revealedContent: 'x - 4 = 6 \\Rightarrow x = 6 + 4 = 10',
          revealedHint: 'Вычитали — значит прибавляем обратно.'
        },
        { id: 'c5', kind: 'text', content: 'Проверка: подставь найденный x обратно. Должно быть верное равенство.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'x + 8 = 15. x = ?', options: ['7', '23', '8', '15'], correctIndex: 0 },
        { id: 'ch2', prompt: 'x − 3 = 9. x = ?', options: ['6', '12', '9', '3'], correctIndex: 1 },
        { id: 'ch3', prompt: '20 − x = 8. x = ?', options: ['12', '28', '8', '20'], correctIndex: 0, explanation: 'x = 20 − 8 = 12.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Уравнение и его части',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'x + 5 = 12',
      anatomy: [
        { id: 'a1', label: 'x', role: 'неизвестное', accent: 'rose' },
        { id: 'a2', label: '+ 5', role: 'известная часть', accent: 'amber' },
        { id: 'a3', label: '= 12', role: 'результат', accent: 'green' }
      ],
      terms: [
        { term: 'Уравнение', definition: 'Равенство, в котором есть неизвестное.', example: 'x + 5 = 12', speakText: 'Уравнение — равенство с буквой' },
        { term: 'Корень уравнения', definition: 'Значение неизвестного, при котором равенство верное.', example: 'Для x+5=12 корень — x=7', speakText: 'Корень — найденное значение икс' }
      ],
      buildTask: {
        prompt: 'x + 5 = 12, x = ___',
        template: '___',
        expected: ['7'],
        distractors: ['5', '12', '17', '0', '6']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем простое уравнение',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: понять связь → найти x → проверить.',
      examples: [
        {
          id: 'ex1', problem: 'x + 7 = 15', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Связь', explanation: 'Что-то + 7 = 15. Значит x = 15 − 7.', visual: { kind: 'board', boardLines: ['x + 7 = 15', '\\downarrow', 'x = 15 − 7'] }, action: { kind: 'numeric', prompt: 'Сколько получилось?', expected: 8 } },
            { index: 2, title: 'Считаем', explanation: '15 − 7 = 8.', visual: { kind: 'board', boardLines: ['x = 8'] }, action: { kind: 'numeric', prompt: 'x?', expected: 8 } },
            { index: 3, title: 'Проверка', explanation: '8 + 7 = 15. Верно!', action: { kind: 'numeric', prompt: '8 + 7 = ?', expected: 15 } }
          ]
        },
        {
          id: 'ex2', problem: 'x − 5 = 8', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Найди x', explanation: 'x = 8 + 5 = 13.', action: { kind: 'numeric', prompt: 'x?', expected: 13 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем уравнения',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини уравнение с корнем',
          left: [
            { id: 'L1', label: 'x + 6 = 14' },
            { id: 'L2', label: 'x − 9 = 11' },
            { id: 'L3', label: 'x + 4 = 10' },
            { id: 'L4', label: '25 − x = 13' }
          ],
          right: [
            { id: 'R1', label: '8', pairId: 'L1' },
            { id: 'R2', label: '20', pairId: 'L2' },
            { id: 'R3', label: '6', pairId: 'L3' },
            { id: 'R4', label: '12', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'x + 12 = 30. x?', correctAnswer: 18 },
        { kind: 'numeric', id: 't3', prompt: 'x − 7 = 25. x?', correctAnswer: 32 },
        { kind: 'numeric', id: 't4', prompt: '40 − x = 15. x?', correctAnswer: 25 },
        { kind: 'numeric', id: 't5', prompt: 'x + 50 = 100. x?', correctAnswer: 50 },
        { kind: 'numeric', id: 't6', prompt: 'x − 15 = 35. x?', correctAnswer: 50 }
      ],
      socraticHints: {
        t2: ['Какое число прибавили к x? Какое действие отменяет +?'],
        t3: ['Если x − 7 = 25, то x — это 25 и ещё что?'],
        t4: ['40 − x = 15. Сколько отняли от 40?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Загадки на стройке',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Стройплощадка',
        roleplay: 'Прораб ведёт учёт кирпичей. Где-то спрятались. Найди x — это сколько потерялось.',
        characterName: 'Прораб Айдар',
        mascotLine: 'x — это спрятанное число!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Прораб', request: 'Было x кирпичей, привезли 8 — стало 20. x = ?', correct: 12, wrongFeedback: '20−8=12.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Учёт', request: 'Было 30, забрали x — осталось 12. x?', correct: 18, wrongFeedback: '30−12=18.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Бригадир', request: 'x + 15 = 40. x?', correct: 25, wrongFeedback: '40−15=25.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Объект', request: 'x − 22 = 18. x?', correct: 40, wrongFeedback: '18+22=40.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой склад',
        request: 'ФИНАЛ: 100 − x = 37. Сколько кирпичей увезли?',
        correct: 63,
        wrongFeedback: 'x = 100 − 37 = 63.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай знаки',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток уравнений', emoji: '⚖️' },
      intro: 'Что прибавляют — то и вычитают, и наоборот.',
      traps: [
        { id: 'tr1', wrongStatement: '«x + 5 = 12, x = 12 + 5 = 17»', whyWrong: 'Если прибавляли 5, нужно вычесть 5: x = 12 − 5 = 7.', correctStatement: 'x = 7', rememberNote: 'Действие наоборот.' },
        { id: 'tr2', wrongStatement: '«x − 4 = 8, x = 8 − 4 = 4»', whyWrong: 'Если вычитали — нужно прибавить: x = 8 + 4 = 12.', correctStatement: 'x = 12', rememberNote: 'Обратное действие.' },
        { id: 'tr3', wrongStatement: 'Не проверил ответ', whyWrong: 'Подставь найденный x — должно получиться верное равенство.', correctStatement: 'Проверка обязательна', rememberNote: 'Подставь.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни уравнение',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как решать простое уравнение',
      coverPrompts: ['Что такое уравнение?', 'Как найти x в x + 5 = 12?', 'Зачем нужна проверка?'],
      referenceAnswer: 'Уравнение — это равенство с неизвестным, обычно его обозначают x. Чтобы найти x в x + 5 = 12, выполняем обратное действие: x = 12 − 5 = 7. Если было вычитание, прибавляем. Проверка нужна, чтобы убедиться: подставив x обратно, получаем верное равенство.',
      requiredConcepts: ['уравнение', 'неизвестное', 'обратное'],
      conceptKeywords: {
        уравнение: ['уравн', 'равенств'],
        неизвестное: ['неизвест', 'икс', 'x'],
        обратное: ['обрат', 'отмен']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['уравн', 'обрат'] }
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
      shareCapsuleName: 'Простейшие уравнения · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'x + 9 = 17. x?', correctAnswer: 8, conceptTag: 'уравнение', cognitiveLevel: 'apply', explanation: 'x = 17−9 = 8.' },
        { id: 'm2', kind: 'numeric', prompt: 'x − 6 = 14. x?', correctAnswer: 20, conceptTag: 'уравнение', cognitiveLevel: 'apply', explanation: 'x = 14+6 = 20.' },
        { id: 'm3', kind: 'numeric', prompt: '50 − x = 28. x?', correctAnswer: 22, conceptTag: 'уравнение', cognitiveLevel: 'apply', explanation: 'x = 50−28 = 22.' },
        { id: 'm4', kind: 'numeric', prompt: 'x + 35 = 60. x?', correctAnswer: 25, conceptTag: 'уравнение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Было x, прибавили 20, стало 75. x?', correctAnswer: 55, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'x + 7 = 13. x?', correctAnswer: 6, conceptTag: 'уравнение', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'x − 8 = 12. x?', correctAnswer: 20, conceptTag: 'уравнение', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '40 − x = 17. x?', correctAnswer: 23, conceptTag: 'уравнение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'x + 18 = 50. x?', correctAnswer: 32, conceptTag: 'уравнение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Было x, отдали 9, стало 26. x?', correctAnswer: 35, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Неравенства
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Не равно — и что?',
    subtitle: 'Знаки < и >',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'x < 5 — какие числа подходят?',
      body: '1, 2, 3, 4 — все они меньше 5. Это и есть решения неравенства.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '◀️', accent: 'sky', caption: 'Знак < — открыт к большему' },
        { emoji: '🔢', accent: 'amber', caption: 'x < 5: подходят 1, 2, 3, 4' },
        { emoji: '🚫', accent: 'rose', caption: 'Сама 5 — НЕ подходит' }
      ],
      prompt: 'Сколько натуральных чисел подходит под x < 5?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '5' },
        { id: 'b', emoji: '🥇', label: '4', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Бесконечно' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь неравенства?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'x < 4. Подходит ли x = 3?', options: ['Да', 'Нет'], correctIndex: 0, conceptTag: 'меньше', explanation: '3 < 4 — да.' },
        { id: 'd2', prompt: 'x > 7. Подходит ли x = 7?', options: ['Да', 'Нет'], correctIndex: 1, conceptTag: 'строгое', explanation: '7 не больше 7.' },
        { id: 'd3', prompt: 'x < 6. Какое число НЕ подходит?', options: ['1', '5', '6', '0'], correctIndex: 2, conceptTag: 'граница', explanation: 'Сама 6 не входит.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'На числовой прямой',
    subtitle: 'Левее границы / правее границы',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 10, step: 1 },
      probes: [
        { id: 'p1', prompt: 'x < 5. Это какие числа?', options: ['Левее 5', 'Правее 5', 'Только 5', 'Все'], correctIndex: 0 },
        { id: 'p2', prompt: 'x > 3. Это какие?', options: ['Левее 3', 'Правее 3', 'Только 3', 'Все'], correctIndex: 1 }
      ],
      copy: { headline: 'x < a — все числа левее a. x > a — все правее.', body: 'Сама a не входит.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как читать неравенства',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Знак подсказывает направление',
          panels: [
            { emoji: '🐭', accent: 'sky', caption: 'Острый угол — к меньшему' },
            { emoji: '🐘', accent: 'amber', caption: 'Широкая часть — к большему' },
            { emoji: '🎯', accent: 'emerald', caption: '«Жадная пасть» ест большее' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**x < a** — x меньше a. **x > a** — x больше a. Сама a не входит в решения.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Например: x < 5. Подходящие натуральные числа: 1, 2, 3, 4. Само 5 — нет.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А сколько решений у неравенства?',
          revealedKind: 'text',
          revealedContent: 'Обычно много! Если речь о всех числах — даже бесконечно. Среди натуральных — конечное число.',
          revealedHint: 'Не одно, как у уравнения.'
        },
        { id: 'c5', kind: 'text', content: 'x > 3 (натуральные до 10): 4, 5, 6, 7, 8, 9, 10. Само 3 — нет.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'x < 4. Подходит x =', options: ['4', '5', '3', '7'], correctIndex: 2 },
        { id: 'ch2', prompt: 'x > 6. Подходит x =', options: ['5', '6', '7', '0'], correctIndex: 2 },
        { id: 'ch3', prompt: 'Сколько натуральных чисел < 5?', options: ['4', '5', '3', '0'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Знаки сравнения',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Неравенства',
      anatomy: [
        { id: 'a1', label: '<', role: 'меньше', accent: 'rose' },
        { id: 'a2', label: '>', role: 'больше', accent: 'sky' },
        { id: 'a3', label: 'x < 7', role: 'все числа меньше 7', accent: 'green' }
      ],
      terms: [
        { term: 'Неравенство', definition: 'Запись с буквой и знаком < или >.', example: 'x < 10', speakText: 'Неравенство — со знаком меньше или больше' },
        { term: 'Решение неравенства', definition: 'Любое число, при котором неравенство верно.', example: '3 — решение x < 5', speakText: 'Решение — подходящее число' }
      ],
      buildTask: {
        prompt: 'Сколько натуральных чисел x < 5? ___',
        template: '___',
        expected: ['4'],
        distractors: ['5', '3', '0', '10', '1']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Подбираем числа',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: найди границу → подставь по очереди числа.',
      examples: [
        {
          id: 'ex1', problem: 'Какие натуральные числа подходят под x < 6?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Граница', explanation: '6 не входит. Меньше 6 — это 1, 2, 3, 4, 5.', visual: { kind: 'board', boardLines: ['x < 6 ⇒ \\{1, 2, 3, 4, 5\\}'] }, action: { kind: 'numeric', prompt: 'Сколько получилось?', expected: 5 } },
            { index: 2, title: 'Сколько?', explanation: 'Пять чисел.', action: { kind: 'numeric', prompt: 'Сколько?', expected: 5 } }
          ]
        },
        {
          id: 'ex2', problem: 'x > 8 (натуральные до 12). Сколько?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '9, 10, 11, 12 — четыре числа.', action: { kind: 'numeric', prompt: '?', expected: 4 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем неравенства',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини неравенство с подходящим числом',
          left: [
            { id: 'L1', label: 'x < 5' },
            { id: 'L2', label: 'x > 7' },
            { id: 'L3', label: 'x > 12' },
            { id: 'L4', label: 'x < 10' }
          ],
          right: [
            { id: 'R1', label: '3', pairId: 'L1' },
            { id: 'R2', label: '8', pairId: 'L2' },
            { id: 'R3', label: '15', pairId: 'L3' },
            { id: 'R4', label: '9', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: 'x < 10. НЕ подходит:', options: ['9', '5', '0', '11'], correctIndex: 3 },
        { kind: 'numeric', id: 't3', prompt: 'Сколько натуральных x < 4?', correctAnswer: 3 },
        { kind: 'numeric', id: 't4', prompt: 'Сколько натуральных x > 6 и ≤ 10?', correctAnswer: 4 },
        { kind: 'choice', id: 't5', prompt: 'x < 1. Натуральное число подходит?', options: ['Да', 'Нет, ни одно'], correctIndex: 1 },
        { kind: 'numeric', id: 't6', prompt: 'Какое наибольшее натуральное число < 9?', correctAnswer: 8 }
      ],
      socraticHints: {
        t3: ['Натуральные начинаются с 1. Какие меньше 4?'],
        t4: ['Перечисли: 7, 8, 9, 10.'],
        t6: ['Знак < строгий — само 9 не подходит. Что прямо перед?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Запись в кружок',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Допуск на стройку (по возрасту)',
        roleplay: 'На разные участки берут только определённые возрасты. Помоги отбирать.',
        characterName: 'Координатор Алия',
        mascotLine: 'Считай по числовой прямой!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Объект', request: 'Кружок для x < 10. Подойдёт ли 9? (1=да, 0=нет)', correct: 1, wrongFeedback: '9 < 10 — да.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Бригадир', request: 'x > 7. Подойдёт 7? (1/0)', correct: 0, wrongFeedback: '7 не >7.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'x < 12. Сколько подходит из {5,8,12,15}?', correct: 2, wrongFeedback: '5 и 8.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Прораб', request: 'x > 6. Из {3,7,9,5}, сколько подходит?', correct: 2, wrongFeedback: '7 и 9.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой набор',
        request: 'ФИНАЛ: x < 8 и x > 2. Сколько натуральных подходит?',
        correct: 5,
        wrongFeedback: '3, 4, 5, 6, 7 — пять чисел.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Граница не входит',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток границ', emoji: '📏' },
      intro: 'Главная ошибка — включить саму границу.',
      traps: [
        { id: 'tr1', wrongStatement: '«x < 5 включает x = 5»', whyWrong: 'Знак < — строгий. 5 не входит, только меньше.', correctStatement: 'Только < 5', rememberNote: 'Граница вне.' },
        { id: 'tr2', wrongStatement: 'Перепутал < и >', whyWrong: 'Острый угол — к меньшему. Широкая часть — к большему. «Пасть ест большее».', correctStatement: 'Открытая часть — к большему', rememberNote: 'Пасть ест.' },
        { id: 'tr3', wrongStatement: 'Включил 0 как натуральное', whyWrong: 'Натуральные начинаются с 1.', correctStatement: 'Натуральные = 1, 2, 3...', rememberNote: 'Без 0.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни неравенство',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи что такое неравенство',
      coverPrompts: ['Что такое неравенство?', 'Какие числа подходят под x < 7?', 'Входит ли сама граница?'],
      referenceAnswer: 'Неравенство — это запись с буквой и знаком < или >. Например, x < 7 означает, что x — любое число меньше 7. Сама граница (число 7) не входит в решения. Решения: 1, 2, 3, 4, 5, 6 (если речь о натуральных числах).',
      requiredConcepts: ['неравенство', 'граница'],
      conceptKeywords: {
        неравенство: ['нерав'],
        граница: ['гран', 'входит', 'строг']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['нерав', 'мень'] }
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
      shareCapsuleName: 'Неравенства · Стройка',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'x < 6. Подходит x =', options: ['6', '5', '7', '10'], correctIndex: 1, conceptTag: 'меньше', cognitiveLevel: 'apply', explanation: '5 < 6.' },
        { id: 'm2', kind: 'choice', prompt: 'x > 4. Подходит x =', options: ['4', '3', '5', '0'], correctIndex: 2, conceptTag: 'больше', cognitiveLevel: 'apply', explanation: '5 > 4.' },
        { id: 'm3', kind: 'numeric', prompt: 'Сколько натуральных x < 5?', correctAnswer: 4, conceptTag: 'счёт', cognitiveLevel: 'apply', explanation: '1,2,3,4.' },
        { id: 'm4', kind: 'choice', prompt: 'x < 1. Натуральных подходит:', options: ['Все', 'Ни одного', 'Одно'], correctIndex: 1, conceptTag: 'граница', cognitiveLevel: 'understand', explanation: 'Натуральные с 1.' },
        { id: 'm5', kind: 'numeric', prompt: 'Наибольшее натуральное < 8?', correctAnswer: 7, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '7.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: 'x < 9. Подходит x =', options: ['9', '8', '10', '15'], correctIndex: 1, conceptTag: 'меньше', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: 'x > 3. Подходит x =', options: ['1', '3', '5', '0'], correctIndex: 2, conceptTag: 'больше', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Сколько натуральных x < 7?', correctAnswer: 6, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Наибольшее натуральное < 12?', correctAnswer: 11, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Наименьшее натуральное > 6?', correctAnswer: 7, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Уравнения сложной структуры
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Со скобками',
    subtitle: 'Сначала упрости',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'x + (25 − 6) = 38. Сначала упрости скобки.',
      body: '25 − 6 = 19. Получается x + 19 = 38, и x = 19.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🎁', accent: 'sky', caption: 'Скобки — сначала' },
        { emoji: '✏️', accent: 'amber', caption: 'Упрости (25−6) = 19' },
        { emoji: '🎯', accent: 'emerald', caption: 'Простое уравнение: x+19=38' }
      ],
      prompt: 'Что делать со скобками сначала?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Игнорировать' },
        { id: 'b', emoji: '🥇', label: 'Упростить', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Удалить' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь сложные?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'x + (10 − 3) = 15. x?', options: ['8', '12', '5', '22'], correctIndex: 0, conceptTag: 'упрощение', explanation: '10−3=7, x=15−7=8.' },
        { id: 'd2', prompt: '(20 − 5) − x = 6. x?', options: ['9', '11', '15', '21'], correctIndex: 0, conceptTag: 'структура', explanation: '20−5=15, x=15−6=9.' },
        { id: 'd3', prompt: 'Что делать первым в скобках?', options: ['Найти x', 'Посчитать', 'Игнорировать'], correctIndex: 1, conceptTag: 'правило', explanation: 'Скобки упрощают первыми.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Упрощаем сначала',
    subtitle: 'Скобки → простое уравнение',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 50, step: 1 },
      probes: [
        { id: 'p1', prompt: 'В x + (20 − 8) что упрощается?', options: ['x', '20−8', 'x + 20', 'Ничего'], correctIndex: 1, explanation: '20−8=12.' },
        { id: 'p2', prompt: 'Стало x + 12 = 25. x?', options: ['13', '37', '12', '25'], correctIndex: 0 }
      ],
      copy: { headline: 'Сначала упрости скобки — потом обычное уравнение', body: 'Это сложнее простых, но идея та же.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Алгоритм решения',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Алгоритм за 3 кадра',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: 'Упрости скобки' },
            { emoji: '2️⃣', accent: 'amber', caption: 'Реши простое уравнение' },
            { emoji: '3️⃣', accent: 'emerald', caption: 'Проверь подстановкой' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Алгоритм:** 1) Упрости всё в скобках. 2) Реши простое уравнение.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'x + (25 - 6) = 38' },
        { id: 'c4', kind: 'formula', content: 'x + 19 = 38 \\Rightarrow x = 19' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'А если скобки слева от x?',
          revealedKind: 'text',
          revealedContent: '(24 − 3) − x = 8. Сначала: 24−3=21. Потом: 21 − x = 8, x = 21 − 8 = 13.',
          revealedHint: 'Скобки упрощаем где бы они ни стояли.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'x + (15 − 5) = 25. x?', options: ['10', '15', '5', '35'], correctIndex: 1 },
        { id: 'ch2', prompt: '(30 − 10) − x = 12. x?', options: ['8', '32', '20', '12'], correctIndex: 0 },
        { id: 'ch3', prompt: 'a + 6 = 7 + 80. a?', options: ['81', '87', '93', '6'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Структура',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'x + (25 − 6) = 38',
      anatomy: [
        { id: 'a1', label: '(25 − 6)', role: 'упрощается до 19', accent: 'rose' },
        { id: 'a2', label: 'x + 19 = 38', role: 'простое уравнение', accent: 'green' },
        { id: 'a3', label: 'x = 19', role: 'корень', accent: 'sky' }
      ],
      terms: [
        { term: 'Сложное уравнение', definition: 'Уравнение со скобками или несколькими действиями.', example: 'x + (25−6) = 38', speakText: 'Сложное — со скобками' }
      ],
      buildTask: {
        prompt: 'x + (25 − 6) = 38, x = ___',
        template: '___',
        expected: ['19'],
        distractors: ['25', '6', '38', '13', '57']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем по шагам',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: упрости → реши простое.',
      examples: [
        {
          id: 'ex1', problem: 'a + 6 = 7 + 80', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Правую часть', explanation: '7 + 80 = 87.', visual: { kind: 'board', boardLines: ['a + 6 = 87'] }, action: { kind: 'numeric', prompt: 'Сколько получилось?', expected: 87 } },
            { index: 2, title: 'Получаем', explanation: 'a + 6 = 87.', action: { kind: 'numeric', prompt: 'Сколько получилось?', expected: 87 } },
            { index: 3, title: 'Решаем', explanation: 'a = 87 − 6 = 81.', visual: { kind: 'board', boardLines: ['a = 81'] }, action: { kind: 'numeric', prompt: 'a?', expected: 81 } }
          ]
        },
        {
          id: 'ex2', problem: '(24 − 3) − x = 8', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '24−3=21, 21−x=8, x=13.', action: { kind: 'numeric', prompt: 'x?', expected: 13 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем сложные',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сложное уравнение с корнем',
          left: [
            { id: 'L1', label: 'x + (20−5) = 30' },
            { id: 'L2', label: '(40−10) − x = 12' },
            { id: 'L3', label: 'a + 8 = 5+50' },
            { id: 'L4', label: 'x − (10−3) = 5' }
          ],
          right: [
            { id: 'R1', label: '15', pairId: 'L1' },
            { id: 'R2', label: '18', pairId: 'L2' },
            { id: 'R3', label: '47', pairId: 'L3' },
            { id: 'R4', label: '12', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'x + (15+5) = 35. x?', correctAnswer: 15 },
        { kind: 'numeric', id: 't3', prompt: '(30+20) − x = 25. x?', correctAnswer: 25 },
        { kind: 'numeric', id: 't4', prompt: 'b + 10 = 8+12. b?', correctAnswer: 10 },
        { kind: 'numeric', id: 't5', prompt: 'x + (25−6) = 38. x?', correctAnswer: 19 },
        { kind: 'numeric', id: 't6', prompt: 'x − (5+3) = 12. x?', correctAnswer: 20 }
      ],
      socraticHints: {
        t2: ['Что в скобках? Упрости их сначала.'],
        t3: ['Сначала посчитай 30+20.'],
        t4: ['Правую часть тоже можно упростить — посчитай 8+12.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Учёт на стройке',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Складской учёт',
        roleplay: 'Помоги бухгалтеру стройки разобрать запутанные накладные с двумя действиями.',
        characterName: 'Бухгалтер Сауле',
        mascotLine: 'Сначала упрости — потом реши!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Объект-1', request: 'x + (40 − 15) = 60. x?', correct: 35, wrongFeedback: '40−15=25, x=35.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Объект-2', request: '(50 + 20) − x = 30. x?', correct: 40, wrongFeedback: '70−x=30, x=40.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Бригадир', request: 'a + 10 = 30 + 5. a?', correct: 25, wrongFeedback: 'a+10=35, a=25.', revenueReward: 25, reputationReward: 1 },
        { id: 'o4', customer: 'Прораб', request: 'x − (5 + 3) = 12. x?', correct: 20, wrongFeedback: 'x−8=12, x=20.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большая накладная',
        request: 'ФИНАЛ: x + (60 − 25) = 80. Сколько кирпичей?',
        correct: 45,
        wrongFeedback: '60−25=35, x=80−35=45.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не пропусти скобки',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток скобок', emoji: '🎁' },
      intro: 'Скобки — самый частый промах.',
      traps: [
        { id: 'tr1', wrongStatement: 'Решал, не упростив скобки', whyWrong: 'Сначала всё в скобках посчитай, потом ищи x.', correctStatement: 'Скобки → потом x', rememberNote: 'Порядок важен.' },
        { id: 'tr2', wrongStatement: 'Перепутал знаки в скобке', whyWrong: 'Если в скобке было −, посчитай как вычитание. Если +, как сложение.', correctStatement: 'Считай аккуратно', rememberNote: 'Знак внутри.' },
        { id: 'tr3', wrongStatement: 'Не проверил итог', whyWrong: 'Подставь x обратно — должно быть верное равенство.', correctStatement: 'Проверка', rememberNote: 'Финиш — проверка.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни алгоритм',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи как решать сложное уравнение со скобками',
      coverPrompts: ['Чем сложное уравнение отличается от простого?', 'Что делать первым?', 'Покажи на примере.'],
      referenceAnswer: 'В сложном уравнении могут быть скобки или несколько чисел в одной части. Сначала нужно упростить — посчитать всё в скобках или сумму чисел. Потом получится простое уравнение, и его решаем как обычно. Например, x + (25 − 6) = 38: сначала 25−6=19, потом x+19=38, x=19.',
      requiredConcepts: ['скобки', 'упрощение'],
      conceptKeywords: {
        скобки: ['скобк'],
        упрощение: ['упрост', 'сначал']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['скобк', 'упрост'] }
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
      shareCapsuleName: 'Сложные уравнения · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'x + (15 − 5) = 25. x?', correctAnswer: 15, conceptTag: 'упрощ', cognitiveLevel: 'apply', explanation: '15−5=10, x=15.' },
        { id: 'm2', kind: 'numeric', prompt: '(30 − 10) − x = 8. x?', correctAnswer: 12, conceptTag: 'упрощ', cognitiveLevel: 'apply', explanation: '20−x=8, x=12.' },
        { id: 'm3', kind: 'numeric', prompt: 'a + 6 = 7 + 80. a?', correctAnswer: 81, conceptTag: 'двоч', cognitiveLevel: 'apply', explanation: '7+80=87, a=81.' },
        { id: 'm4', kind: 'numeric', prompt: 'x − (5 + 4) = 6. x?', correctAnswer: 15, conceptTag: 'упрощ', cognitiveLevel: 'apply', explanation: '5+4=9, x=15.' },
        { id: 'm5', kind: 'numeric', prompt: 'x + (40 − 8) = 50. x?', correctAnswer: 18, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '40−8=32, x=18.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'x + (10+5) = 35. x?', correctAnswer: 20, conceptTag: 'упрощ', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '(50−20) − x = 11. x?', correctAnswer: 19, conceptTag: 'упрощ', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'b + 9 = 4+10. b?', correctAnswer: 5, conceptTag: 'двоч', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'x − (12−4) = 7. x?', correctAnswer: 15, conceptTag: 'упрощ', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'x + (35 − 10) = 60. x?', correctAnswer: 35, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Уравнения и неравенства', layersInsertedByLesson: counter }
})
