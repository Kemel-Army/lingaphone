import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Рациональные способы вычислений».
 *   1. Сравнение числовых выражений
 *   2. Сравнение буквенных выражений
 *   3. Применение свойств для рационализации
 * Theme: cafe (арифметический блок). S2-S5 enrichments полностью.
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Рациональные способы вычислений')
  const L1 = lessonIds['Сравнение числовых выражений']
  const L2 = lessonIds['Сравнение буквенных выражений']
  const L3 = lessonIds['Применение свойств для рационализации']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Сравнение числовых выражений
  // ═════════════════════════════════════════════════════════════════════
  await insert({ lessonId: L1, layerType: 'HOOK', orderIndex: 1, title: 'Кто больше?', icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: { kind: 'HOOK', mediaKind: 'fact', headline: '20 + 5 vs 30 − 10 — что больше?', body: 'Считаем каждое и ставим знак.',
      frames: [
        { emoji: '➕', accent: 'sky', caption: '20 + 5 = 25' },
        { emoji: '➖', accent: 'amber', caption: '30 − 10 = 20' },
        { emoji: '⚖️', accent: 'emerald', caption: '25 > 20 — левая больше!' }
      ],
      successSfx: 'sparkle',
      mascotEntry: 'think',
      prompt: 'Что больше: 20+5 или 30−10?',
      emojiChoices: [
        { id: 'a', emoji: '🍰', label: '20+5', isPrimary: true },
        { id: 'b', emoji: '☕', label: '30−10' },
        { id: 'c', emoji: '🤝', label: 'Равны' }
      ] },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2, title: 'Знаешь сравнение?', icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'DIAGNOSTIC', mode: 'mcq', lives: 3,
      questions: [
        { id: 'd1', prompt: '15 + 5 ?? 12 + 8', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равно', explanation: '20 = 20.' },
        { id: 'd2', prompt: '40 − 10 ?? 25', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'больше', explanation: '30 > 25.' },
        { id: 'd3', prompt: '5 · 3 ?? 4 · 4', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'произвед', explanation: '15 < 16.' }
      ] }, completionCriteria: { minAccuracy: 50 } })

  await insert({ lessonId: L1, layerType: 'INTUITION', orderIndex: 3, title: 'Сравниваем результаты', icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'INTUITION', widget: { type: 'number-line', min: 0, max: 50, step: 1 },
      probes: [
        { id: 'p1', prompt: '12+5 = 17. 13+4 = 17. Какой знак между ними?', options: ['>', '<', '='], correctIndex: 2 },
        { id: 'p2', prompt: '20−5 = ?, vs 10+3 = ?. Знак?', options: ['>', '<', '='], correctIndex: 0, explanation: '15 > 13.' }
      ],
      copy: { headline: 'Посчитай каждое — потом сравни', body: 'Это самый простой способ.' } },
    completionCriteria: { minInteractions: 2 } })

  await insert({ lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4, title: 'Как сравнивать выражения', icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: { kind: 'EXPLANATION', chunks: [
      { id: 'c1', kind: 'callout', content: '**Чтобы сравнить два выражения:** 1) Посчитай каждое. 2) Поставь знак.', emphasis: true },
      { id: 'c2', kind: 'formula', content: '20 + 15 \\quad\\text{vs}\\quad 10 \\cdot 3' },
      { id: 'c3', kind: 'formula', content: '35 > 30' },
      { id: 'c4', kind: 'tap-reveal', content: 'Иногда можно сравнить **без полного расчёта**.', revealedContent: 'Например, 25+5 и 25+3: видно, что первое больше — прибавили больше.', revealedKind: 'text' },
      { id: 'c5', kind: 'tap-reveal', content: 'Это и называется **рациональный способ**.', revealedContent: 'Без лишних вычислений — мы сравниваем то, что разное, а одинаковое игнорируем.', revealedKind: 'text' }
    ], checks: [
      { id: 'ch1', prompt: '40+10 ?? 30+15', options: ['>', '<', '='], correctIndex: 0 },
      { id: 'ch2', prompt: '6·5 ?? 3·10', options: ['>', '<', '='], correctIndex: 2 },
      { id: 'ch3', prompt: '50−25 ?? 30−10', options: ['>', '<', '='], correctIndex: 0 }
    ] }, completionCriteria: { minAccuracy: 67 } })

  await insert({ lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5, title: 'Алгоритм', icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'FORMALIZATION', diagramTitle: 'Сравнение выражений',
      anatomy: [
        { id: 'a1', label: '1. Посчитать', role: 'значение каждого', accent: 'sky' },
        { id: 'a2', label: '2. Сравнить', role: 'поставить знак', accent: 'green' },
        { id: 'a3', label: '3. Записать', role: 'выражение со знаком', accent: 'amber' }
      ],
      terms: [
        { term: 'Рациональный способ', definition: 'Сравнение без полного вычисления — через свойства.', example: '50+5 > 50+3 без расчёта' },
        { term: 'Знак больше', definition: 'Открыт к большему числу.', example: '35 > 30', speakText: 'больше' }
      ],
      voiceTerms: true,
      buildTask: { prompt: 'Поставь знак: 35 + 8 ___ 35 + 5 (>, <, =)', template: '___', expected: ['>'] } },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6, title: 'Сравниваем умно', icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'WALKTHROUGH', intro: 'Иногда не нужно считать всё.',
      examples: [
        { id: 'ex1', problem: 'Сравни 35 + 8 и 35 + 5', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Замечаем общее', explanation: 'Слева и справа — 35.', visual: { kind: 'board', boardLines: ['35 + 8', '35 + 5', '↑↑ одинаково'] }, action: { kind: 'choice', prompt: 'Что одинаковое?', options: ['35', '8', '5'], correctIndex: 0 } },
            { index: 2, title: 'Сравним разное', explanation: '8 > 5.', action: { kind: 'choice', prompt: 'Знак?', options: ['>', '<', '='], correctIndex: 0 } }
          ] },
        { id: 'ex2', problem: '20 · 5 vs 10 · 10', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '100 vs 100 — равны.', action: { kind: 'choice', prompt: 'Знак?', options: ['>', '<', '='], correctIndex: 2 } }
          ] }
      ] }, completionCriteria: {} })

  await insert({ lessonId: L1, layerType: 'TRAINER', orderIndex: 7, title: 'Тренируем сравнение', icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: { kind: 'TRAINER', targetCorrect: 6, problems: [
      { kind: 'tap-pair', id: 't0', prompt: 'Соедини равные выражения',
        left: [
          { id: 'l1', label: '20+10' },
          { id: 'l2', label: '6·5' },
          { id: 'l3', label: '50−5' }
        ],
        right: [
          { id: 'r1', label: '15+15', pairId: 'l1' },
          { id: 'r2', label: '3·10', pairId: 'l2' },
          { id: 'r3', label: '40+5', pairId: 'l3' }
        ] },
      { kind: 'choice', id: 't1', prompt: '12+8 vs 15+5', options: ['>', '<', '='], correctIndex: 2 },
      { kind: 'choice', id: 't2', prompt: '40+10 vs 30+15', options: ['>', '<', '='], correctIndex: 0 },
      { kind: 'choice', id: 't3', prompt: '20−5 vs 10+3', options: ['>', '<', '='], correctIndex: 0 },
      { kind: 'choice', id: 't4', prompt: '6·5 vs 4·8', options: ['>', '<', '='], correctIndex: 1 },
      { kind: 'choice', id: 't5', prompt: '100−20 vs 50+30', options: ['>', '<', '='], correctIndex: 2 },
      { kind: 'choice', id: 't6', prompt: '15·2 vs 12·3', options: ['>', '<', '='], correctIndex: 1 },
      { kind: 'choice', id: 't7', prompt: '25+25 vs 30+20', options: ['>', '<', '='], correctIndex: 2 },
      { kind: 'choice', id: 't8', prompt: '8·4 vs 5·6', options: ['>', '<', '='], correctIndex: 0 }
    ],
    socraticHints: {
      t1: ['Посчитай каждое выражение. Что получилось слева и справа?'],
      t3: ['20−5 — посчитай. 10+3 — посчитай. Какое больше?'],
      t4: ['Найди произведения. 6·5 и 4·8 — что больше?'],
      t5: ['Найди значения слева и справа. Они одинаковые?'],
      t6: ['Какое произведение больше: 15·2 или 12·3?'],
      t8: ['Посчитай оба произведения и сравни.']
    } }, completionCriteria: { minCorrect: 6 } })

  await insert({ lessonId: L1, layerType: 'SCENARIO', orderIndex: 8, title: 'Касса кафе', icon: 'i-lucide-store', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: { kind: 'SCENARIO', theme: 'cafe',
      setting: { title: 'Касса кафе', roleplay: 'Помоги кассиру быстро сравнивать чеки.', characterName: 'Кассир Айман', mascotLine: 'Иногда без расчёта быстрее!' },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Гость', request: '50+25 vs 60+15. Знак (1=>, 0==, -1=<)?', correct: 0, wrongFeedback: '75=75. Равны.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: '30+12 vs 30+15. Знак?', correct: -1, wrongFeedback: '12 < 15.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: '7·6 vs 8·5. Знак?', correct: 1, wrongFeedback: '42 > 40.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Турист', request: '100−30 vs 50+20. Знак?', correct: 0, wrongFeedback: '70 = 70.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: { id: 'boss', customer: '🏆 Босс-чек', request: '8·9 vs 7·10 + 5. Знак (1=>, 0==, -1=<)?', correct: -1, wrongFeedback: '72 < 75.', revenueReward: 200, reputationReward: 3 } },
    completionCriteria: { minCorrect: 3 } })

  await insert({ lessonId: L1, layerType: 'TRAPS', orderIndex: 9, title: 'Ошибки сравнения', icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'TRAPS', intro: 'Не угадывай.', mode: 'flip',
      traps: [
        { id: 'tr1', wrongStatement: '25+5 > 25+5', whyWrong: 'Если выражения одинаковы — то =.', correctStatement: '25+5 = 25+5', rememberNote: 'Одинаково = равно.' },
        { id: 'tr2', wrongStatement: 'Сравнил «по виду», не считая', whyWrong: 'Можно ошибиться.', correctStatement: 'Сначала посчитай', rememberNote: 'Не доверяй виду.' },
        { id: 'tr3', wrongStatement: 'Открыл знак не в ту сторону', whyWrong: '> открыт к большему.', correctStatement: 'Открыто = к большому', rememberNote: 'Куда смотрит — там больше.' }
      ],
      bugHunterBadge: { label: 'Охотник за ошибками', emoji: '🔍' } },
    completionCriteria: {} })

  await insert({ lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10, title: 'Объясни сравнение', icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: { kind: 'TEACH_BACK', audiencePersona: 'другу',
      coverPrompts: ['Как сравнить 40+10 и 30+15?', 'Можно ли без вычисления?', 'Что значит «рационально»?'],
      referenceAnswer: 'Чтобы сравнить выражения, нужно посчитать каждое и поставить знак. Иногда можно сделать рационально — без полного вычисления. Например, 35+8 и 35+5: видно, что первое больше, потому что прибавили больше. Это и есть рациональный способ.',
      requiredConcepts: ['сравн', 'выраж'], minSentences: 3,
      voiceFirst: true,
      conceptKeywords: { сравн: ['сравн', 'больше', 'меньше'], выраж: ['выраж', 'значение', 'число'] },
      voicePrompt: 'Расскажи, как сравнивать выражения' },
    completionCriteria: { minLength: 80, requiredConcepts: ['сравн', 'выраж'] } })

  await insert({ lessonId: L1, layerType: 'MASTERY_CHECK', orderIndex: 11, title: 'Финальная проверка', icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: { kind: 'MASTERY_CHECK', passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Мастер сравнений',
      questions: [
        { id: 'm1', kind: 'choice', prompt: '20+10 vs 25+5', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равно', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'choice', prompt: '50−15 vs 30+10', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'сравн', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: '7·5 vs 6·6', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'произвед', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: '40+8 vs 40+12', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'рацион', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'choice', prompt: '100 vs 90+10', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равно', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: '60+20 vs 50+30', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равно', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: '9·4 vs 6·6', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'произвед', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: '45+15 vs 40+25', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'сравн', cognitiveLevel: 'apply' }
      ] }, completionCriteria: { minAccuracy: 80 } })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Сравнение буквенных выражений
  // ═════════════════════════════════════════════════════════════════════
  await insert({ lessonId: L2, layerType: 'HOOK', orderIndex: 1, title: 'a + 5 vs a + 3', icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: { kind: 'HOOK', mediaKind: 'fact', headline: 'Если a — одно и то же число, что больше: a + 5 или a + 3?', body: 'Не нужно знать само a — сравни «лишние» части.',
      frames: [
        { emoji: '🔤', accent: 'sky', caption: 'a — одно и то же' },
        { emoji: '➕', accent: 'amber', caption: 'a + 5 vs a + 3' },
        { emoji: '⚖️', accent: 'emerald', caption: '5 > 3 → a+5 больше!' }
      ],
      successSfx: 'sparkle',
      mascotEntry: 'think',
      prompt: 'a + 8 vs a + 4. Что больше?',
      emojiChoices: [
        { id: 'a', emoji: '🔤', label: 'a + 8', isPrimary: true },
        { id: 'b', emoji: '🔤', label: 'a + 4' },
        { id: 'c', emoji: '❓', label: 'Зависит от a' }
      ] },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2, title: 'Знаешь буквенные?', icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'DIAGNOSTIC', mode: 'mcq', lives: 3,
      questions: [
        { id: 'd1', prompt: 'a + 5 vs a + 8', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'буквенные', explanation: '5 < 8, значит сумма меньше.' },
        { id: 'd2', prompt: 'a · 3 vs a · 5 (a > 0)', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'произведение', explanation: '3 < 5, произведение меньше.' },
        { id: 'd3', prompt: 'a − 5 vs a − 2', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'вычитание', explanation: 'Вычли больше — осталось меньше.' }
      ] }, completionCriteria: { minAccuracy: 50 } })

  await insert({ lessonId: L2, layerType: 'INTUITION', orderIndex: 3, title: 'Подставляем разные', icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'INTUITION', widget: { type: 'number-line', min: 0, max: 30, step: 1 },
      probes: [
        { id: 'p1', prompt: 'При a=5: a+8 = 13, a+3 = 8. Знак?', options: ['>', '<', '='], correctIndex: 0 },
        { id: 'p2', prompt: 'При a=10: тот же знак?', options: ['>', '<', '='], correctIndex: 0, explanation: 'Знак не зависит от a.' }
      ],
      copy: { headline: 'Знак между буквенными выражениями обычно не зависит от значения буквы', body: 'Если a одно и то же — сравнивай по «лишним» частям.' } },
    completionCriteria: { minInteractions: 2 } })

  await insert({ lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4, title: 'Как сравнивать с буквой', icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: { kind: 'EXPLANATION', chunks: [
      { id: 'c1', kind: 'callout', content: '**Если выражения отличаются только числами — сравнивай эти числа.** Букву одинаковую «вычеркиваем мысленно».', emphasis: true },
      { id: 'c2', kind: 'formula', content: 'a + 8 > a + 3 \\quad\\text{(всегда, при любом } a)' },
      { id: 'c3', kind: 'formula', content: 'a \\cdot 5 > a \\cdot 3 \\quad (\\text{если } a > 0)' },
      { id: 'c4', kind: 'tap-reveal', content: 'Можно проверить: подставь любое число вместо a.', revealedContent: 'Знак останется тот же — это и доказывает рассуждение.', revealedKind: 'text' }
    ], checks: [
      { id: 'ch1', prompt: 'a + 12 vs a + 7', options: ['>', '<', '='], correctIndex: 0 },
      { id: 'ch2', prompt: 'a · 6 vs a · 9 (a > 0)', options: ['>', '<', '='], correctIndex: 1 },
      { id: 'ch3', prompt: 'a − 3 vs a − 8', options: ['>', '<', '='], correctIndex: 0 }
    ] }, completionCriteria: { minAccuracy: 67 } })

  await insert({ lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5, title: 'Принцип сравнения', icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'FORMALIZATION', diagramTitle: 'a + b vs a + c',
      anatomy: [
        { id: 'a1', label: 'Одинаковая часть', role: 'a — её сравнивать не нужно', accent: 'sky' },
        { id: 'a2', label: 'Разные части', role: 'b и c — сравниваем их', accent: 'amber' },
        { id: 'a3', label: 'Знак между b и c', role: 'переходит на всё выражение', accent: 'green' }
      ],
      terms: [
        { term: 'Буквенное выражение', definition: 'Выражение, в котором есть буква (переменная).', example: 'a + 5, x − 3' },
        { term: 'Эквивалентные выражения', definition: 'Те, что равны при любых значениях буквы.', example: 'a + b = b + a' }
      ],
      voiceTerms: true,
      buildTask: { prompt: 'Поставь знак: 25 + 7 ___ 25 + 9', template: '___', expected: ['<'] } },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6, title: 'Сравниваем без счёта', icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'WALKTHROUGH', intro: 'Найди разные части — и сравни.',
      examples: [
        { id: 'ex1', problem: 'a + 12 vs a + 5', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что одинаково', explanation: 'a в обоих.', visual: { kind: 'board', boardLines: ['a + 12', 'a + 5', '↑↑ одинаковое a'] }, action: { kind: 'choice', prompt: 'Что одинаковое?', options: ['a', '12', '5'], correctIndex: 0 } },
            { index: 2, title: 'Сравни числа', explanation: '12 > 5.', action: { kind: 'choice', prompt: 'Знак?', options: ['>', '<', '='], correctIndex: 0 } }
          ] },
        { id: 'ex2', problem: 'a · 4 vs a · 7 (a > 0)', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Сравни множители', explanation: '4 < 7, значит первое меньше.', action: { kind: 'choice', prompt: 'Знак?', options: ['>', '<', '='], correctIndex: 1 } }
          ] }
      ] }, completionCriteria: {} })

  await insert({ lessonId: L2, layerType: 'TRAINER', orderIndex: 7, title: 'Тренируем буквенные', icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: { kind: 'TRAINER', targetCorrect: 6, problems: [
      { kind: 'tap-pair', id: 't0', prompt: 'Соедини равные',
        left: [
          { id: 'l1', label: 'a + 5' },
          { id: 'l2', label: 'a · 3' },
          { id: 'l3', label: 'a + 0' }
        ],
        right: [
          { id: 'r1', label: '5 + a', pairId: 'l1' },
          { id: 'r2', label: '3 · a', pairId: 'l2' },
          { id: 'r3', label: 'a', pairId: 'l3' }
        ] },
      { kind: 'choice', id: 't1', prompt: 'a+5 vs a+8', options: ['>', '<', '='], correctIndex: 1 },
      { kind: 'choice', id: 't2', prompt: 'a−3 vs a−7', options: ['>', '<', '='], correctIndex: 0 },
      { kind: 'choice', id: 't3', prompt: 'a·2 vs a·9 (a>0)', options: ['>', '<', '='], correctIndex: 1 },
      { kind: 'choice', id: 't4', prompt: 'a+10 vs a+10', options: ['>', '<', '='], correctIndex: 2 },
      { kind: 'choice', id: 't5', prompt: '2·a vs 7·a (a>0)', options: ['>', '<', '='], correctIndex: 1 },
      { kind: 'choice', id: 't6', prompt: 'a+15 vs a+12', options: ['>', '<', '='], correctIndex: 0 },
      { kind: 'choice', id: 't7', prompt: 'a−8 vs a−4', options: ['>', '<', '='], correctIndex: 1 },
      { kind: 'choice', id: 't8', prompt: 'a·5 vs a·5', options: ['>', '<', '='], correctIndex: 2 }
    ],
    socraticHints: {
      t1: ['a одинаковое — значит сравни 5 и 8. Что больше?'],
      t2: ['Если из a вычитают меньше — что в итоге больше?'],
      t3: ['a одинаковое и положительное. Сравни 2 и 9.'],
      t4: ['Выражения совсем одинаковые. Какой знак?'],
      t5: ['a одинаковое. Сравни множители 2 и 7.'],
      t6: ['Что больше — 15 или 12? a одинаковое.'],
      t7: ['Чем больше вычли — тем меньше осталось. Что вычитают больше?']
    } }, completionCriteria: { minCorrect: 6 } })

  await insert({ lessonId: L2, layerType: 'SCENARIO', orderIndex: 8, title: 'Меню с переменной ценой', icon: 'i-lucide-store', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: { kind: 'SCENARIO', theme: 'cafe',
      setting: { title: 'Меню с переменной ценой', roleplay: 'Цены — буквы. Помоги выбрать выгоднее.', characterName: 'Менеджер Динара', mascotLine: 'Сравнивай только разное!' },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: 'A: x + 30. B: x + 50. Какая дешевле? (A=1, B=-1)', correct: 1, wrongFeedback: '+30 < +50, A дешевле.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: 'A: x − 5. B: x − 10. Какая дешевле?', correct: -1, wrongFeedback: '−10 даёт меньше — B дешевле.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Школьник', request: 'A: 2·x. B: 5·x. Какая больше? (A=1, B=-1)', correct: -1, wrongFeedback: 'B больше: 5x > 2x.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Гость', request: 'A: x + 100. B: x + 100. Знак (1=>, -1=<, 0==)', correct: 0, wrongFeedback: 'Равны.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: { id: 'boss', customer: '🏆 Босс-меню', request: 'A: x · 4 + 20. B: x · 4 + 15. Какая дороже? (A=1, B=-1)', correct: 1, wrongFeedback: 'x·4 одинаковое, +20 > +15.', revenueReward: 200, reputationReward: 3 } },
    completionCriteria: { minCorrect: 3 } })

  await insert({ lessonId: L2, layerType: 'TRAPS', orderIndex: 9, title: 'Не пугайся буквы', icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'TRAPS', intro: 'Буква — это просто число.', mode: 'flip',
      traps: [
        { id: 'tr1', wrongStatement: '«Не знаю a, не могу сравнить»', whyWrong: 'Если выражения отличаются только числами — знак не зависит от a.', correctStatement: 'Сравни разные части', rememberNote: 'Буква не помеха.' },
        { id: 'tr2', wrongStatement: 'a + 8 = a + 5', whyWrong: 'Левое больше на 3.', correctStatement: 'a + 8 > a + 5', rememberNote: 'Разные числа — разный результат.' },
        { id: 'tr3', wrongStatement: 'Подставил, ошибся в счёте', whyWrong: 'Подстановку делай аккуратно.', correctStatement: 'Лучше анализ без подстановки', rememberNote: 'Сравнивай разное.' }
      ],
      bugHunterBadge: { label: 'Мастер букв', emoji: '🔤' } },
    completionCriteria: {} })

  await insert({ lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10, title: 'Объясни буквенные', icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: { kind: 'TEACH_BACK', audiencePersona: 'другу',
      coverPrompts: ['Как сравнить a+5 и a+8?', 'Зависит ли знак от a?', 'Покажи на примере.'],
      referenceAnswer: 'Если буквенные выражения отличаются только числами, можно сравнивать только эти числа. Например, a+5 < a+8, потому что 5 < 8. Знак не зависит от значения a — он одинаков при любом a.',
      requiredConcepts: ['букв', 'сравн'], minSentences: 3,
      voiceFirst: true,
      conceptKeywords: { букв: ['букв', 'переменная', 'a'], сравн: ['сравн', 'больше', 'меньше'] },
      voicePrompt: 'Расскажи, как сравнивать буквенные выражения' },
    completionCriteria: { minLength: 80, requiredConcepts: ['букв', 'сравн'] } })

  await insert({ lessonId: L2, layerType: 'MASTERY_CHECK', orderIndex: 11, title: 'Финальная проверка', icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: { kind: 'MASTERY_CHECK', passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Мастер буквенных выражений',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'a+7 vs a+12', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'буквенные', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'choice', prompt: 'a−4 vs a−9', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'буквенные', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: 'a·3 vs a·8 (a>0)', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'произвед', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'a+10 vs a+10', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равно', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'choice', prompt: '5·a vs 2·a (a>0)', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: 'a+20 vs a+15', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'буквенные', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: 'a·6 vs a·9 (a>0)', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'произвед', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: 'a−2 vs a−6', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'буквенные', cognitiveLevel: 'apply' }
      ] }, completionCriteria: { minAccuracy: 80 } })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Применение свойств для рационализации
  // ═════════════════════════════════════════════════════════════════════
  await insert({ lessonId: L3, layerType: 'HOOK', orderIndex: 1, title: 'Хитрая группировка', icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: { kind: 'HOOK', mediaKind: 'fact', headline: 'Сложить 17 + 25 + 13 — попробуй умно.', body: '17 + 13 = 30, потом 30 + 25 = 55. В разы быстрее!',
      frames: [
        { emoji: '🧮', accent: 'sky', caption: '17 + 25 + 13' },
        { emoji: '🤝', accent: 'amber', caption: '17 + 13 = 30' },
        { emoji: '⚡', accent: 'emerald', caption: '30 + 25 = 55' }
      ],
      successSfx: 'sparkle',
      mascotEntry: 'celebrate',
      prompt: 'Какой ответ?',
      emojiChoices: [
        { id: 'a', emoji: '🏆', label: '55', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '52' },
        { id: 'c', emoji: '❌', label: '45' }
      ] },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2, title: 'Знаешь группировку?', icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'DIAGNOSTIC', mode: 'mcq', lives: 3,
      questions: [
        { id: 'd1', prompt: 'Удобнее: 17+25+13. Какие 2 числа сложить первыми?', options: ['17+25', '17+13', '25+13', 'Любые'], correctIndex: 1, conceptTag: 'группировка', explanation: '17+13=30 — круглое.' },
        { id: 'd2', prompt: 'Удобнее: 4·25·5. Что первым?', options: ['4·25', '25·5', '4·5', 'Любое'], correctIndex: 0, conceptTag: 'группировка', explanation: '4·25=100 — круглое.' },
        { id: 'd3', prompt: 'Зачем группировать?', options: ['Для красоты', 'Для скорости', 'Не нужно', 'Не знаю'], correctIndex: 1, conceptTag: 'смысл', explanation: 'Группировка ускоряет счёт.' }
      ] }, completionCriteria: { minAccuracy: 50 } })

  await insert({ lessonId: L3, layerType: 'INTUITION', orderIndex: 3, title: 'Удобные пары', icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'INTUITION', widget: { type: 'number-line', min: 0, max: 100, step: 10 },
      probes: [
        { id: 'p1', prompt: '23 + 17 = ?', options: ['30', '40', '50', '20'], correctIndex: 1, explanation: '23+17=40 — круглое.' },
        { id: 'p2', prompt: '25 + 75 = ?', options: ['100', '90', '50', '125'], correctIndex: 0 }
      ],
      copy: { headline: 'Ищи пары, дающие круглое число', body: 'Например, 13+17=30, 25+75=100, 4·25=100.' } },
    completionCriteria: { minInteractions: 2 } })

  await insert({ lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4, title: 'Хитрости группировки', icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: { kind: 'EXPLANATION', chunks: [
      { id: 'c1', kind: 'callout', content: '**Группируй удобно!** Сначала пары, дающие круглое число — потом всё остальное.', emphasis: true },
      { id: 'c2', kind: 'formula', content: '17 + 25 + 13 = (17 + 13) + 25 = 30 + 25 = 55' },
      { id: 'c3', kind: 'formula', content: '4 \\cdot 25 \\cdot 5 = (4 \\cdot 25) \\cdot 5 = 100 \\cdot 5 = 500' },
      { id: 'c4', kind: 'tap-reveal', content: 'Можно использовать **переместительный закон**', revealedContent: 'a + b = b + a, a · b = b · a — для удобной перестановки.', revealedKind: 'text' },
      { id: 'c5', kind: 'tap-reveal', content: 'И **сочетательный закон**', revealedContent: '(a + b) + c = a + (b + c) — выбираем удобную скобку.', revealedKind: 'text' }
    ], checks: [
      { id: 'ch1', prompt: '23 + 18 + 17 = ?', options: ['58', '50', '40', '78'], correctIndex: 0 },
      { id: 'ch2', prompt: '5 · 3 · 4 = ?', options: ['12', '60', '7', '20'], correctIndex: 1 },
      { id: 'ch3', prompt: '50 + 28 + 50 = ?', options: ['100', '128', '108', '78'], correctIndex: 1 }
    ] }, completionCriteria: { minAccuracy: 67 } })

  await insert({ lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5, title: 'Свойства в применении', icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'FORMALIZATION', diagramTitle: 'Хитрости',
      anatomy: [
        { id: 'a1', label: 'Перестановка', role: 'a + b = b + a', accent: 'sky' },
        { id: 'a2', label: 'Группировка', role: '(a + b) + c = a + (b + c)', accent: 'green' },
        { id: 'a3', label: 'Удобные пары', role: '17 + 13 = 30, 25 + 75 = 100', accent: 'amber' }
      ],
      terms: [
        { term: 'Переместительный закон', definition: 'Числа можно менять местами в + и ·.', example: '3+5 = 5+3' },
        { term: 'Сочетательный закон', definition: 'Можно по-разному ставить скобки в + и ·.', example: '(2+3)+4 = 2+(3+4)' },
        { term: 'Рационализация', definition: 'Использование свойств для быстрого счёта.', example: '17+25+13 = 30+25 = 55' }
      ],
      voiceTerms: true,
      buildTask: { prompt: '17 + 25 + 13 = ___ (группируй удобно)', template: '___', expected: ['55'] } },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6, title: 'Считаем хитро', icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'WALKTHROUGH', intro: 'Ищи удобные пары перед расчётом.',
      examples: [
        { id: 'ex1', problem: '38 + 17 + 12 = ?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Удобная пара', explanation: '38 + 12 = 50 (круглое).', visual: { kind: 'board', boardLines: ['38 + 17 + 12', '↘     ↙', '38 + 12 = 50', '+17 = 67'] }, action: { kind: 'numeric', prompt: '38+12 = ?', expected: 50 } },
            { index: 2, title: 'Доплюсуй', explanation: '50 + 17 = 67.', action: { kind: 'numeric', prompt: '50+17 = ?', expected: 67 } }
          ] },
        { id: 'ex2', problem: '4 · 17 · 5', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Группа 4·5', explanation: '4·5=20, 20·17=340.', action: { kind: 'numeric', prompt: '?', expected: 340 } }
          ] }
      ] }, completionCriteria: {} })

  await insert({ lessonId: L3, layerType: 'TRAINER', orderIndex: 7, title: 'Тренируем хитрости', icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: { kind: 'TRAINER', targetCorrect: 6, problems: [
      { kind: 'tap-pair', id: 't0', prompt: 'Соедини удобные пары → их сумму',
        left: [
          { id: 'l1', label: '17 + 13' },
          { id: 'l2', label: '25 + 75' },
          { id: 'l3', label: '4 · 25' },
          { id: 'l4', label: '5 · 2' }
        ],
        right: [
          { id: 'r1', label: '30', pairId: 'l1' },
          { id: 'r2', label: '100', pairId: 'l2' },
          { id: 'r3', label: '100', pairId: 'l3' },
          { id: 'r4', label: '10', pairId: 'l4' }
        ] },
      { kind: 'numeric', id: 't1', prompt: '17 + 25 + 13 = ?', correctAnswer: 55 },
      { kind: 'numeric', id: 't2', prompt: '4 · 25 · 5 = ?', correctAnswer: 500 },
      { kind: 'numeric', id: 't3', prompt: '38 + 12 + 50 = ?', correctAnswer: 100 },
      { kind: 'numeric', id: 't4', prompt: '50 + 25 + 50 = ?', correctAnswer: 125 },
      { kind: 'numeric', id: 't5', prompt: '5 · 14 · 2 = ?', correctAnswer: 140 },
      { kind: 'numeric', id: 't6', prompt: '23 + 19 + 17 = ?', correctAnswer: 59 },
      { kind: 'numeric', id: 't7', prompt: '8 · 2 · 5 = ?', correctAnswer: 80 },
      { kind: 'numeric', id: 't8', prompt: '37 + 28 + 13 = ?', correctAnswer: 78 }
    ],
    socraticHints: {
      t1: ['Какие два числа дают круглое 30? Сложи их первыми.'],
      t2: ['4·25 — это сколько? Что получится за круглое число?'],
      t3: ['Какие два слагаемых дают круглое? 38 + 12 — это сколько?'],
      t5: ['5·2 — сколько? Какое круглое число получишь первым?'],
      t6: ['Найди пару, дающую круглое. 23 + 17 — это сколько?'],
      t7: ['Какие два множителя дают 10? Сгруппируй их.'],
      t8: ['37 + 13 — это сколько? Это даст круглое число.']
    } }, completionCriteria: { minCorrect: 6 } })

  await insert({ lessonId: L3, layerType: 'SCENARIO', orderIndex: 8, title: 'Бухгалтер кафе', icon: 'i-lucide-store', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: { kind: 'SCENARIO', theme: 'cafe',
      setting: { title: 'Бухгалтерия кафе', roleplay: 'Считай чеки умно — клиенты ждут.', characterName: 'Бухгалтер Сабина', mascotLine: 'Группируй удобно!' },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: '25 + 30 + 75. Чек?', correct: 130, wrongFeedback: '25+75=100, +30=130.', revenueReward: 130, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: '4 · 9 · 25. Чек?', correct: 900, wrongFeedback: '4·25=100, ·9=900.', revenueReward: 900, reputationReward: 2 },
        { id: 'o3', customer: 'Учитель', request: '18 + 36 + 12. Чек?', correct: 66, wrongFeedback: '18+12=30, +36=66.', revenueReward: 66, reputationReward: 1 },
        { id: 'o4', customer: 'Студент', request: '50 + 27 + 50. Чек?', correct: 127, wrongFeedback: '50+50=100, +27=127.', revenueReward: 127, reputationReward: 1 }
      ],
      boss: { id: 'boss', customer: '🏆 Босс-чек: банкет', request: '8 · 17 · 5 + 6 = ?', correct: 686, wrongFeedback: '8·5=40, ·17=680, +6=686.', revenueReward: 200, reputationReward: 3 } },
    completionCriteria: { minCorrect: 3 } })

  await insert({ lessonId: L3, layerType: 'TRAPS', orderIndex: 9, title: 'Не теряй слагаемые', icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'TRAPS', intro: 'Группировка — не пропуск.', mode: 'flip',
      traps: [
        { id: 'tr1', wrongStatement: 'Сгруппировал 2 числа, забыл третье', whyWrong: 'Все слагаемые должны быть в результате.', correctStatement: 'Учитывай все', rememberNote: 'Не теряй.' },
        { id: 'tr2', wrongStatement: 'Поменял местами в вычитании: 10−3=3−10', whyWrong: 'Менять местами можно только при + и ·.', correctStatement: 'Только для + и ·', rememberNote: 'Не для −, ÷.' },
        { id: 'tr3', wrongStatement: 'Не искал удобные пары — считал слева направо', whyWrong: 'Удобные пары экономят время.', correctStatement: 'Ищи 100, 50, 30…', rememberNote: 'Круглые числа — твой друг.' }
      ],
      bugHunterBadge: { label: 'Хитрый счетовод', emoji: '⚡' } },
    completionCriteria: {} })

  await insert({ lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10, title: 'Объясни хитрости', icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: { kind: 'TEACH_BACK', audiencePersona: 'однокласснику',
      coverPrompts: ['Зачем группировать?', 'Какие свойства использовать?', 'Покажи на примере.'],
      referenceAnswer: 'Группировка экономит время. Использую переместительный и сочетательный законы — переставляю и группирую числа удобно. Например, 17+25+13: лучше сначала 17+13=30, потом 30+25=55. Так быстрее, чем считать слева направо.',
      requiredConcepts: ['групп', 'свойств'], minSentences: 3,
      voiceFirst: true,
      conceptKeywords: { групп: ['групп', 'пара', 'круглое'], свойств: ['свойств', 'переместит', 'сочетат'] },
      voicePrompt: 'Расскажи, как группировать удобно' },
    completionCriteria: { minLength: 80, requiredConcepts: ['групп', 'свойств'] } })

  await insert({ lessonId: L3, layerType: 'MASTERY_CHECK', orderIndex: 11, title: 'Финальная проверка', icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: { kind: 'MASTERY_CHECK', passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Мастер рациональных вычислений',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '23 + 19 + 17 = ?', correctAnswer: 59, conceptTag: 'группа', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: '4 · 25 = ?', correctAnswer: 100, conceptTag: 'круглое', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: '5 · 7 · 2 = ?', correctAnswer: 70, conceptTag: 'группа', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '50 + 36 + 50 = ?', correctAnswer: 136, conceptTag: 'группа', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '38 + 14 + 12 = ?', correctAnswer: 64, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '15 + 27 + 25 = ?', correctAnswer: 67, conceptTag: 'группа', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '4 · 13 · 25 = ?', correctAnswer: 1300, conceptTag: 'группа', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '70 + 18 + 30 = ?', correctAnswer: 118, conceptTag: 'группа', cognitiveLevel: 'apply' }
      ] }, completionCriteria: { minAccuracy: 80 } })

  return { ok: true, topic: 'Рациональные способы вычислений', layersInsertedByLesson: counter }
})
