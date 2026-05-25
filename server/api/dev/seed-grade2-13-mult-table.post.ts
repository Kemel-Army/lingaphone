import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 4 lessons of «Таблица умножения на 2, 3, 4, 5».
 *   1. Умножение на 2
 *   2. Умножение на 3
 *   3. Умножение на 4
 *   4. Умножение на 5
 *
 * S6: тема №13, theme-pack = 'cafe' (продолжение блока ×÷ после темы 11).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (👯/🎂/🚗/✋).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Таблица умножения на 2, 3, 4, 5')
  const L1 = lessonIds['Умножение на 2']
  const L2 = lessonIds['Умножение на 3']
  const L3 = lessonIds['Умножение на 4']
  const L4 = lessonIds['Умножение на 5']
  if (!L1 || !L2 || !L3 || !L4) throw createError({ statusCode: 500, message: 'Some lessons missing for «Таблица умножения на 2, 3, 4, 5»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3, L4])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Умножение на 2
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Удвоить — это просто!',
    subtitle: 'Парами по 2',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Умножить на 2 = сложить число с самим собой.',
      body: '7 × 2 = 7 + 7 = 14. Самая лёгкая строчка таблицы умножения!',
      mascotEntry: 'greet',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🧦', accent: 'amber', caption: 'Носки продают парами' },
        { emoji: '👯', accent: 'rose', caption: '6 пар = 6 + 6 = 12' },
        { emoji: '⚡', accent: 'emerald', caption: 'Удвоить = ×2' }
      ],
      prompt: '6 × 2 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '12', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '8' },
        { id: 'c', emoji: '🤯', label: '62' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '3 × 2 = ?', options: ['5', '6', '8', '32'], correctIndex: 1, conceptTag: 'таблица2', explanation: '3+3=6.' },
        { id: 'd2', prompt: '5 × 2 = ?', options: ['7', '10', '25', '52'], correctIndex: 1, conceptTag: 'таблица2', explanation: '5+5=10.' },
        { id: 'd3', prompt: 'Умножить на 2 — это:', options: ['Удвоить', 'Сложить с самим собой', 'Оба ответа верны', 'Не знаю'], correctIndex: 2, conceptTag: 'смысл', explanation: 'Удвоение = +себя.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Парами!',
    subtitle: 'Кружки в массиве',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 10, minCols: 2, maxCols: 2, defaultRows: 5, defaultCols: 2 },
      probes: [
        { id: 'p1', prompt: '5 пар обуви = ? ботинок', options: ['7', '10', '52', '5'], correctIndex: 1, explanation: '5×2=10.' },
        { id: 'p2', prompt: '8 пар = ? предметов', options: ['10', '16', '8', '82'], correctIndex: 1 }
      ],
      copy: { headline: 'Каждая пара — это 2', body: 'Считая пары, удваиваешь.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Таблица умножения на 2',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Самая лёгкая таблица',
          panels: [
            { emoji: '➕', accent: 'sky', caption: 'a × 2 = a + a' },
            { emoji: '🟰', accent: 'amber', caption: '7 × 2 = 14' },
            { emoji: '🎯', accent: 'emerald', caption: 'Все ответы — чётные!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Умножение на 2 = удвоение числа.** Самая лёгкая часть таблицы.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1·2=2,\\ 2·2=4,\\ 3·2=6,\\ 4·2=8,\\ 5·2=10' },
        { id: 'c4', kind: 'formula', content: '6·2=12,\\ 7·2=14,\\ 8·2=16,\\ 9·2=18,\\ 10·2=20' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Заметил паттерн?',
          revealedKind: 'text',
          revealedContent: 'Все ответы — чётные числа: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20. Если результат нечётный — это ошибка!',
          revealedHint: 'Чётный = делится на 2.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: '7 × 2 = ?', options: ['9', '14', '12', '72'], correctIndex: 1 },
        { id: 'ch2', prompt: '4 × 2 = ?', options: ['6', '8', '42', '24'], correctIndex: 1 },
        { id: 'ch3', prompt: '9 × 2 = ?', options: ['11', '18', '92', '20'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Строка 2',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Таблица × 2',
      anatomy: [
        { id: 'a1', label: '2,4,6,8,10', role: 'первая половина', accent: 'sky' },
        { id: 'a2', label: '12,14,16,18,20', role: 'вторая половина', accent: 'amber' },
        { id: 'a3', label: 'все чётные', role: 'результаты ×2', accent: 'green' }
      ],
      terms: [
        { term: 'Удвоение', definition: 'Умножение на 2 — сложение числа с собой.', example: '7×2 = 7+7 = 14', speakText: 'Удвоение — сложить с собой' },
        { term: 'Чётное число', definition: 'Делится на 2 без остатка.', example: '14 — чётное', speakText: 'Чётное — делится на два' }
      ],
      buildTask: {
        prompt: '7 × 2 = ___',
        template: '___',
        expected: ['14'],
        distractors: ['9', '12', '16', '72', '7']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем парами',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Удвоение через сложение.',
      examples: [
        {
          id: 'ex1', problem: '8 × 2', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Удваиваем', explanation: '8 + 8 = 16.', visual: { kind: 'board', boardLines: ['8 × 2 = 8 + 8 = 16'] }, action: { kind: 'numeric', prompt: '8+8?', expected: 16 } }
          ]
        },
        {
          id: 'ex2', problem: '6 пар носков. Сколько носков?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '6×2=12.', action: { kind: 'numeric', prompt: '?', expected: 12 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем ×2',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини × 2 с ответом',
          left: [
            { id: 'L1', label: '4 × 2' },
            { id: 'L2', label: '6 × 2' },
            { id: 'L3', label: '8 × 2' },
            { id: 'L4', label: '9 × 2' }
          ],
          right: [
            { id: 'R1', label: '8', pairId: 'L1' },
            { id: 'R2', label: '12', pairId: 'L2' },
            { id: 'R3', label: '16', pairId: 'L3' },
            { id: 'R4', label: '18', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '7 × 2 = ?', correctAnswer: 14 },
        { kind: 'numeric', id: 't3', prompt: '5 × 2 = ?', correctAnswer: 10 },
        { kind: 'numeric', id: 't4', prompt: '10 × 2 = ?', correctAnswer: 20 },
        { kind: 'numeric', id: 't5', prompt: '3 × 2 = ?', correctAnswer: 6 },
        { kind: 'numeric', id: 't6', prompt: '11 × 2 = ?', correctAnswer: 22 }
      ],
      socraticHints: {
        t2: ['7 + 7 = ?'],
        t4: ['10 удвоить — какой круглый ответ?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Кафе «Парные блюда»',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе с парными блюдами',
        roleplay: 'Помоги бариста: всё подаётся парами (две пироги, два сока...).',
        characterName: 'Бариста Айдос',
        mascotLine: 'Пары — удваивай!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Семья', request: '4 пары пирогов. Сколько штук?', correct: 8, wrongFeedback: '4×2=8.', revenueReward: 40, reputationReward: 1 },
        { id: 'o2', customer: 'Класс', request: '7 пар стаканов. Сколько штук?', correct: 14, wrongFeedback: '7×2=14.', revenueReward: 70, reputationReward: 1 },
        { id: 'o3', customer: 'Гости', request: '6 пар салатов. Сколько порций?', correct: 12, wrongFeedback: '6×2=12.', revenueReward: 60, reputationReward: 1 },
        { id: 'o4', customer: 'Банкет', request: '10 пар. Сколько штук?', correct: 20, wrongFeedback: '10×2=20.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой заказ',
        request: 'ФИНАЛ: 12 пар пирогов. Сколько штук?',
        correct: 24,
        wrongFeedback: '12×2=24.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай ×2 и +2',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Удваиватель', emoji: '👯' },
      intro: 'Удвоить — не прибавить.',
      traps: [
        { id: 'tr1', wrongStatement: '«5 × 2 = 7»', whyWrong: 'Это сложение 5+2. Умножение: 5+5=10.', correctStatement: '5 × 2 = 10', rememberNote: '× ≠ +.' },
        { id: 'tr2', wrongStatement: '«4 × 2 = 24»', whyWrong: 'Слил цифры. 4+4=8.', correctStatement: '4 × 2 = 8', rememberNote: 'Считай, не приписывай.' },
        { id: 'tr3', wrongStatement: 'Получил нечётный ответ', whyWrong: 'Все результаты ×2 — чётные. Нечётный = ошибка.', correctStatement: 'Только чётные', rememberNote: 'Чётные — ориентир.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни ×2',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как умножать на 2',
      coverPrompts: ['Что такое умножение на 2?', 'Какие у него все ответы?', 'Покажи на примере.'],
      referenceAnswer: 'Умножить число на 2 — значит удвоить его, или сложить с самим собой. Все ответы — чётные: 2, 4, 6, 8, 10. Например, 7×2=7+7=14. Это самая лёгкая строчка таблицы умножения.',
      requiredConcepts: ['удвоение', 'чётные'],
      conceptKeywords: {
        удвоение: ['удв', 'два раза'],
        чётные: ['чётн', 'чет']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['удв', 'чётн'] }
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
      shareCapsuleName: 'Таблица × 2 · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '3 × 2 = ?', correctAnswer: 6, conceptTag: 'таблица2', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '7 × 2 = ?', correctAnswer: 14, conceptTag: 'таблица2', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: '9 × 2 = ?', correctAnswer: 18, conceptTag: 'таблица2', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '5 пар = ? предметов', correctAnswer: 10, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '8 × 2 = ?', correctAnswer: 16, conceptTag: 'таблица2', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '4 × 2 = ?', correctAnswer: 8, conceptTag: 'таблица2', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '6 × 2 = ?', correctAnswer: 12, conceptTag: 'таблица2', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: '10 × 2 = ?', correctAnswer: 20, conceptTag: 'таблица2', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '7 пар яблок = ?', correctAnswer: 14, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '11 × 2 = ?', correctAnswer: 22, conceptTag: 'таблица2', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Умножение на 3
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Тройками!',
    subtitle: 'Через ×2 + ещё раз',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Умножить на 3 = взять число три раза.',
      body: '4 × 3 = 4 + 4 + 4 = 12. Хитрость: ×2, потом ещё раз +.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🧁', accent: 'amber', caption: 'Кексы упакованы по 3' },
        { emoji: '📦', accent: 'rose', caption: '5 коробок × 3 = 15 кексов' },
        { emoji: '⚡', accent: 'emerald', caption: 'Лайфхак: ×2 + ещё раз' }
      ],
      prompt: '5 × 3 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '15', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '8' },
        { id: 'c', emoji: '🤯', label: '53' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь тройки?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '3 × 3 = ?', options: ['6', '9', '33', '12'], correctIndex: 1, conceptTag: 'таблица3', explanation: '3+3+3=9.' },
        { id: 'd2', prompt: '6 × 3 = ?', options: ['9', '18', '63', '21'], correctIndex: 1, conceptTag: 'таблица3', explanation: '6+6+6=18.' },
        { id: 'd3', prompt: '×3 можно посчитать как:', options: ['+ число 3 раза', '+ 3', '× 2', 'Не знаю'], correctIndex: 0, conceptTag: 'смысл', explanation: '×3 — взять 3 раза.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Тройные пучки',
    subtitle: 'Ряды по 3',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 10, minCols: 3, maxCols: 3, defaultRows: 4, defaultCols: 3 },
      probes: [
        { id: 'p1', prompt: '4 ряда по 3 точки. Точек?', options: ['7', '12', '34', '4'], correctIndex: 1 },
        { id: 'p2', prompt: '5 рядов по 3?', options: ['8', '15', '53', '5'], correctIndex: 1 }
      ],
      copy: { headline: 'Каждый ряд — 3 предмета', body: 'Считая ряды, умножаем на 3.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Таблица × 3',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Хитрость через ×2',
          panels: [
            { emoji: '✖️', accent: 'sky', caption: '7 × 2 = 14' },
            { emoji: '➕', accent: 'amber', caption: '+ 7 ещё раз' },
            { emoji: '🎯', accent: 'emerald', caption: '= 21 — это 7 × 3!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**×3 = взять число 3 раза.** Удобно: ×2 + ещё один раз.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1·3=3,\\ 2·3=6,\\ 3·3=9,\\ 4·3=12,\\ 5·3=15' },
        { id: 'c4', kind: 'formula', content: '6·3=18,\\ 7·3=21,\\ 8·3=24,\\ 9·3=27,\\ 10·3=30' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'А самые сложные?',
          revealedKind: 'text',
          revealedContent: 'Запомни: 7×3=21 и 8×3=24. Их часто путают. Учи отдельно — это ключевые!',
          revealedHint: '21 и 24 — топ-2 опасные.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: '4 × 3 = ?', options: ['7', '12', '43', '15'], correctIndex: 1 },
        { id: 'ch2', prompt: '8 × 3 = ?', options: ['11', '24', '83', '16'], correctIndex: 1 },
        { id: 'ch3', prompt: '6 × 3 = ?', options: ['9', '18', '63', '15'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Строка 3',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Таблица × 3',
      anatomy: [
        { id: 'a1', label: '3,6,9,12,15', role: '1-5 раз', accent: 'sky' },
        { id: 'a2', label: '18,21,24,27,30', role: '6-10 раз', accent: 'amber' }
      ],
      terms: [
        { term: 'Утроение', definition: 'Умножение на 3 — взять число три раза.', example: '5×3 = 5+5+5 = 15', speakText: 'Утроение — взять три раза' }
      ],
      buildTask: {
        prompt: '7 × 3 = ___',
        template: '___',
        expected: ['21'],
        distractors: ['18', '24', '14', '73', '10']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем тройками',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Через ×2 удобнее.',
      examples: [
        {
          id: 'ex1', problem: '7 × 3', prefilledSteps: 0,
          steps: [
            { index: 1, title: '×2 первое', explanation: '7×2=14.', visual: { kind: 'board', boardLines: ['7 × 2 = 14'] }, action: { kind: 'numeric', prompt: 'Сколько?', expected: 14 } },
            { index: 2, title: '+ ещё раз', explanation: '14+7=21.', visual: { kind: 'board', boardLines: ['14 + 7 = 21'] }, action: { kind: 'numeric', prompt: '?', expected: 21 } }
          ]
        },
        {
          id: 'ex2', problem: '8 × 3', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '8+8+8=24.', action: { kind: 'numeric', prompt: '?', expected: 24 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем ×3',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини × 3 с ответом',
          left: [
            { id: 'L1', label: '4 × 3' },
            { id: 'L2', label: '6 × 3' },
            { id: 'L3', label: '7 × 3' },
            { id: 'L4', label: '9 × 3' }
          ],
          right: [
            { id: 'R1', label: '12', pairId: 'L1' },
            { id: 'R2', label: '18', pairId: 'L2' },
            { id: 'R3', label: '21', pairId: 'L3' },
            { id: 'R4', label: '27', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '5 × 3 = ?', correctAnswer: 15 },
        { kind: 'numeric', id: 't3', prompt: '8 × 3 = ?', correctAnswer: 24 },
        { kind: 'numeric', id: 't4', prompt: '10 × 3 = ?', correctAnswer: 30 },
        { kind: 'numeric', id: 't5', prompt: '3 × 3 = ?', correctAnswer: 9 },
        { kind: 'numeric', id: 't6', prompt: '11 × 3 = ?', correctAnswer: 33 }
      ],
      socraticHints: {
        t3: ['8+8+8 — раздели на пары: 8+8=16, плюс ещё 8.'],
        t4: ['×3 у круглых: умножь и допиши.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Кондитерская',
    icon: 'i-lucide-cake', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кондитерская «Три желания»',
        roleplay: 'Помоги мастеру: пирожные упакованы по 3 в коробке.',
        characterName: 'Кондитер Айгерим',
        mascotLine: 'По 3 в коробке — × 3!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Семья', request: '5 коробок по 3 пирожных. Сколько всего?', correct: 15, wrongFeedback: '5×3=15.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'День рождения', request: '7 коробок по 3. Сколько?', correct: 21, wrongFeedback: '7×3=21.', revenueReward: 70, reputationReward: 1 },
        { id: 'o3', customer: 'Школа', request: '8 коробок по 3. Сколько пирожных?', correct: 24, wrongFeedback: '8×3=24.', revenueReward: 80, reputationReward: 1 },
        { id: 'o4', customer: 'Свадьба', request: '9 коробок по 3. Сколько?', correct: 27, wrongFeedback: '9×3=27.', revenueReward: 90, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Юбилейный заказ',
        request: 'ФИНАЛ: 12 коробок по 3 пирожных. Сколько штук?',
        correct: 36,
        wrongFeedback: '12×3=36.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Будь точен',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Кондитер тройки', emoji: '🎂' },
      intro: 'Чаще ошибаются с 7 и 8.',
      traps: [
        { id: 'tr1', wrongStatement: '«7 × 3 = 24»', whyWrong: '7×3=21. 24 — это 8×3.', correctStatement: '7 × 3 = 21', rememberNote: 'Через ×2: 14+7.' },
        { id: 'tr2', wrongStatement: '«6 × 3 = 24»', whyWrong: '6×3=18. Не путай с 8×3.', correctStatement: '6 × 3 = 18', rememberNote: 'Считай, не угадывай.' },
        { id: 'tr3', wrongStatement: 'Считал в столбик', whyWrong: 'Таблицу нужно знать наизусть.', correctStatement: 'Учи наизусть', rememberNote: 'Память — друг.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни ×3',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как умножать на 3',
      coverPrompts: ['Что значит ×3?', 'Какая хитрость через ×2?', 'Покажи на 7×3.'],
      referenceAnswer: 'Умножить число на 3 — значит сложить его три раза. Например, 7×3 = 7+7+7 = 21. Хитрость: можно посчитать через ×2 и добавить ещё раз: 7×2=14, +7=21. Это быстрее, чем складывать три раза.',
      requiredConcepts: ['умножение', 'три раза'],
      conceptKeywords: {
        'умножение': ['умнож'],
        'три раза': ['три', '3 раз']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['три', 'умн'] }
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
      shareCapsuleName: 'Таблица × 3 · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '4 × 3 = ?', correctAnswer: 12, conceptTag: 'таблица3', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '7 × 3 = ?', correctAnswer: 21, conceptTag: 'таблица3', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: '9 × 3 = ?', correctAnswer: 27, conceptTag: 'таблица3', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '6 коробок по 3 = ?', correctAnswer: 18, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '8 × 3 = ?', correctAnswer: 24, conceptTag: 'таблица3', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '5 × 3 = ?', correctAnswer: 15, conceptTag: 'таблица3', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '3 × 3 = ?', correctAnswer: 9, conceptTag: 'таблица3', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: '10 × 3 = ?', correctAnswer: 30, conceptTag: 'таблица3', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '11 × 3 = ?', correctAnswer: 33, conceptTag: 'таблица3', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '12 пирожных в 3 коробках = ?', correctAnswer: 12, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Умножение на 4
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Удвоить ещё раз',
    subtitle: '×4 = ×2 ×2',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '×4 — это удвоить два раза.',
      body: '6 × 4 = 6×2×2 = 12×2 = 24. Лайфхак для запоминания.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🚗', accent: 'sky', caption: 'У машины 4 колеса' },
        { emoji: '✖️', accent: 'amber', caption: 'Удвоил, потом ещё удвоил' },
        { emoji: '🏁', accent: 'emerald', caption: '×4 = быстрый трюк' }
      ],
      prompt: '5 × 4 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '20', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '9' },
        { id: 'c', emoji: '🤯', label: '54' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к 4?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '3 × 4 = ?', options: ['7', '12', '34', '15'], correctIndex: 1, conceptTag: 'таблица4', explanation: '3×4=12.' },
        { id: 'd2', prompt: '7 × 4 = ?', options: ['11', '28', '74', '32'], correctIndex: 1, conceptTag: 'таблица4', explanation: '7×2=14, ×2=28.' },
        { id: 'd3', prompt: '×4 можно сделать через:', options: ['×2 дважды', '+4 один раз', '−2', 'Не знаю'], correctIndex: 0, conceptTag: 'хитрость', explanation: '×4 = двойное удвоение.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Четвёрки в массиве',
    subtitle: 'Ряды по 4',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 10, minCols: 4, maxCols: 4, defaultRows: 5, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: '5 рядов по 4. Сколько?', options: ['9', '20', '54', '5'], correctIndex: 1 },
        { id: 'p2', prompt: '6 рядов по 4?', options: ['10', '24', '64', '6'], correctIndex: 1 }
      ],
      copy: { headline: 'По 4 в ряду — × 4', body: 'Удобно представить через двойное удвоение.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Таблица × 4',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Двойное удвоение',
          panels: [
            { emoji: '✖️', accent: 'sky', caption: '7 × 2 = 14' },
            { emoji: '✖️', accent: 'amber', caption: '14 × 2 = 28' },
            { emoji: '🎯', accent: 'emerald', caption: '= 7 × 4!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**×4 = удвоить дважды (×2 ×2).**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1·4=4,\\ 2·4=8,\\ 3·4=12,\\ 4·4=16,\\ 5·4=20' },
        { id: 'c4', kind: 'formula', content: '6·4=24,\\ 7·4=28,\\ 8·4=32,\\ 9·4=36,\\ 10·4=40' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Ещё одна хитрость?',
          revealedKind: 'text',
          revealedContent: '×4 = ×2 + ×2 (то же число дважды складываем). Например, 7×4 = 7×2 + 7×2 = 14+14 = 28.',
          revealedHint: 'Два варианта — выбирай удобный.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: '4 × 4 = ?', options: ['8', '16', '12', '24'], correctIndex: 1 },
        { id: 'ch2', prompt: '6 × 4 = ?', options: ['10', '24', '20', '36'], correctIndex: 1 },
        { id: 'ch3', prompt: '9 × 4 = ?', options: ['13', '36', '94', '40'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Строка 4',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Таблица × 4',
      anatomy: [
        { id: 'a1', label: '4,8,12,16,20', role: '1-5', accent: 'sky' },
        { id: 'a2', label: '24,28,32,36,40', role: '6-10', accent: 'amber' }
      ],
      terms: [
        { term: '×4', definition: 'Умножение на 4 — двойное удвоение.', example: '7×4 = 14×2 = 28', speakText: 'Умножить на 4 — удвоить дважды' }
      ],
      buildTask: {
        prompt: '7 × 4 = ___',
        template: '___',
        expected: ['28'],
        distractors: ['24', '32', '21', '74', '14']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем ×4',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Двойное удвоение — самый быстрый способ.',
      examples: [
        {
          id: 'ex1', problem: '8 × 4', prefilledSteps: 0,
          steps: [
            { index: 1, title: '×2 первое', explanation: '8×2=16.', visual: { kind: 'board', boardLines: ['8 × 2 = 16'] }, action: { kind: 'numeric', prompt: 'Сколько?', expected: 16 } },
            { index: 2, title: '×2 второе', explanation: '16×2=32.', visual: { kind: 'board', boardLines: ['16 × 2 = 32'] }, action: { kind: 'numeric', prompt: '?', expected: 32 } }
          ]
        },
        {
          id: 'ex2', problem: '6 × 4', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '6×2=12, 12×2=24.', action: { kind: 'numeric', prompt: '?', expected: 24 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем ×4',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини × 4 с ответом',
          left: [
            { id: 'L1', label: '5 × 4' },
            { id: 'L2', label: '7 × 4' },
            { id: 'L3', label: '8 × 4' },
            { id: 'L4', label: '9 × 4' }
          ],
          right: [
            { id: 'R1', label: '20', pairId: 'L1' },
            { id: 'R2', label: '28', pairId: 'L2' },
            { id: 'R3', label: '32', pairId: 'L3' },
            { id: 'R4', label: '36', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '6 × 4 = ?', correctAnswer: 24 },
        { kind: 'numeric', id: 't3', prompt: '4 × 4 = ?', correctAnswer: 16 },
        { kind: 'numeric', id: 't4', prompt: '10 × 4 = ?', correctAnswer: 40 },
        { kind: 'numeric', id: 't5', prompt: '3 × 4 = ?', correctAnswer: 12 },
        { kind: 'numeric', id: 't6', prompt: '11 × 4 = ?', correctAnswer: 44 }
      ],
      socraticHints: {
        t2: ['6×2=12, удвой 12.'],
        t3: ['4×2=8, удвой 8.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Кафе на колёсах',
    icon: 'i-lucide-car', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Фуд-трак с 4-местными столиками',
        roleplay: 'Помоги хостес: за каждым столиком 4 места.',
        characterName: 'Хостес Серик',
        mascotLine: '4 места = ×4!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Гости', request: '5 столиков. Сколько мест?', correct: 20, wrongFeedback: '5×4=20.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Свадьба', request: '7 столиков. Мест?', correct: 28, wrongFeedback: '7×4=28.', revenueReward: 70, reputationReward: 1 },
        { id: 'o3', customer: 'Корпоратив', request: '8 столиков. Мест?', correct: 32, wrongFeedback: '8×4=32.', revenueReward: 80, reputationReward: 1 },
        { id: 'o4', customer: 'Праздник', request: '9 столиков. Мест?', correct: 36, wrongFeedback: '9×4=36.', revenueReward: 90, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой банкет',
        request: 'ФИНАЛ: 12 столиков. Сколько гостей поместится?',
        correct: 48,
        wrongFeedback: '12×4=48.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Будь точен',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Гонщик ×4', emoji: '🚗' },
      intro: 'Часто путают 7×4 и 8×4.',
      traps: [
        { id: 'tr1', wrongStatement: '«7 × 4 = 32»', whyWrong: '7×4=28. 32 — это 8×4.', correctStatement: '7 × 4 = 28', rememberNote: '7→28, 8→32.' },
        { id: 'tr2', wrongStatement: '«6 × 4 = 28»', whyWrong: '6×4=24. 28 — это 7×4.', correctStatement: '6 × 4 = 24', rememberNote: '6→24.' },
        { id: 'tr3', wrongStatement: 'Угадывал', whyWrong: 'Используй ×2 ×2 — точно.', correctStatement: 'Двойное удвоение', rememberNote: 'Метод надёжный.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни ×4',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи быстрый способ ×4',
      coverPrompts: ['Что значит ×4?', 'Какой быстрый способ?', 'Покажи на примере 6×4.'],
      referenceAnswer: 'Умножение на 4 — это двойное удвоение. Сначала умножаем на 2, потом ещё раз на 2. Например, 6×4: 6×2=12, 12×2=24. Это быстрее, чем складывать число 4 раза.',
      requiredConcepts: ['×4', 'удвоение'],
      conceptKeywords: {
        '×4': ['×4', 'на 4', 'на четыре'],
        'удвоение': ['удв', 'два раза', 'дваж']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['удвоен', '4'] }
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
      shareCapsuleName: 'Таблица × 4 · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '5 × 4 = ?', correctAnswer: 20, conceptTag: 'таблица4', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '8 × 4 = ?', correctAnswer: 32, conceptTag: 'таблица4', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: '7 × 4 = ?', correctAnswer: 28, conceptTag: 'таблица4', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '6 машин. Сколько колёс?', correctAnswer: 24, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '9 × 4 = ?', correctAnswer: 36, conceptTag: 'таблица4', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '4 × 4 = ?', correctAnswer: 16, conceptTag: 'таблица4', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '6 × 4 = ?', correctAnswer: 24, conceptTag: 'таблица4', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: '10 × 4 = ?', correctAnswer: 40, conceptTag: 'таблица4', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '3 × 4 = ?', correctAnswer: 12, conceptTag: 'таблица4', cognitiveLevel: 'recall' },
        { id: 'p5', kind: 'numeric', prompt: '11 столов по 4 = ?', correctAnswer: 44, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 4 — Умножение на 5
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L4, layerType: 'HOOK', orderIndex: 1,
    title: 'Самая лёгкая!',
    subtitle: 'Все на 0 или 5',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '×5 — все ответы на 0 или 5.',
      body: '5, 10, 15, 20, 25 ... удобно как монеты по 5.',
      mascotEntry: 'trophy',
      bgPattern: 'stars',
      successSfx: 'cheer',
      frames: [
        { emoji: '🪙', accent: 'amber', caption: 'Монеты по 5' },
        { emoji: '🖐️', accent: 'rose', caption: '5 пальцев на руке' },
        { emoji: '🎯', accent: 'emerald', caption: 'Все ответы кончаются 0 или 5' }
      ],
      prompt: '7 × 5 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '35', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '12' },
        { id: 'c', emoji: '🤯', label: '57' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь пятёрки?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '3 × 5 = ?', options: ['8', '15', '35', '12'], correctIndex: 1, conceptTag: 'таблица5', explanation: '3×5=15.' },
        { id: 'd2', prompt: '6 × 5 = ?', options: ['11', '30', '65', '36'], correctIndex: 1, conceptTag: 'таблица5', explanation: '6×5=30.' },
        { id: 'd3', prompt: 'Все ответы ×5 заканчиваются на:', options: ['1 или 6', '0 или 5', '2 или 7', 'разные'], correctIndex: 1, conceptTag: 'паттерн', explanation: 'На 0 или 5.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L4, layerType: 'INTUITION', orderIndex: 3,
    title: 'Пятёрки',
    subtitle: 'Ряды по 5',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 10, minCols: 5, maxCols: 5, defaultRows: 4, defaultCols: 5 },
      probes: [
        { id: 'p1', prompt: '4 ряда по 5. Сколько?', options: ['9', '20', '45', '4'], correctIndex: 1 },
        { id: 'p2', prompt: '6 рядов по 5?', options: ['11', '30', '65', '6'], correctIndex: 1 }
      ],
      copy: { headline: 'По 5 в ряду — добавляй по 5', body: '5, 10, 15, 20, 25 ... все на 0 или 5.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L4, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Таблица × 5',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Лайфхак ×5',
          panels: [
            { emoji: '🔟', accent: 'sky', caption: 'Умножь на 10' },
            { emoji: '✂️', accent: 'amber', caption: 'Раздели пополам' },
            { emoji: '✨', accent: 'emerald', caption: 'Готово! 7×10÷2=35' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Все результаты ×5 заканчиваются на 5 или 0.** Если число чётное → ответ на 0. Нечётное → на 5.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1·5=5,\\ 2·5=10,\\ 3·5=15,\\ 4·5=20,\\ 5·5=25' },
        { id: 'c4', kind: 'formula', content: '6·5=30,\\ 7·5=35,\\ 8·5=40,\\ 9·5=45,\\ 10·5=50' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Лайфхак?',
          revealedKind: 'text',
          revealedContent: 'Возьми число × 10 и поделить пополам. 7×10=70, 70÷2=35. Это и есть 7×5.',
          revealedHint: '×10 ÷ 2 = ×5.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: '7 × 5 = ?', options: ['12', '35', '75', '40'], correctIndex: 1 },
        { id: 'ch2', prompt: '4 × 5 = ?', options: ['9', '20', '45', '24'], correctIndex: 1 },
        { id: 'ch3', prompt: '9 × 5 = ?', options: ['14', '45', '95', '50'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L4, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Строка 5',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Таблица × 5',
      anatomy: [
        { id: 'a1', label: '5,10,15,20,25', role: '1-5', accent: 'sky' },
        { id: 'a2', label: '30,35,40,45,50', role: '6-10', accent: 'amber' }
      ],
      terms: [
        { term: 'Лайфхак ×5', definition: 'Умножь на 10 и подели пополам.', example: '8×5 = 8×10÷2 = 40', speakText: 'Умножь на десять, подели пополам' }
      ],
      buildTask: {
        prompt: '7 × 5 = ___',
        template: '___',
        expected: ['35'],
        distractors: ['30', '40', '25', '75', '12']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем ×5',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Через ×10 быстрее.',
      examples: [
        {
          id: 'ex1', problem: '8 × 5', prefilledSteps: 0,
          steps: [
            { index: 1, title: '×10', explanation: '8×10=80.', visual: { kind: 'board', boardLines: ['8 × 10 = 80'] }, action: { kind: 'numeric', prompt: '8×10?', expected: 80 } },
            { index: 2, title: '÷2', explanation: '80÷2=40.', visual: { kind: 'board', boardLines: ['80 ÷ 2 = 40'] }, action: { kind: 'numeric', prompt: '?', expected: 40 } }
          ]
        },
        {
          id: 'ex2', problem: '7 × 5', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '7×10=70, 70÷2=35.', action: { kind: 'numeric', prompt: '?', expected: 35 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем ×5',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини × 5 с ответом',
          left: [
            { id: 'L1', label: '4 × 5' },
            { id: 'L2', label: '6 × 5' },
            { id: 'L3', label: '7 × 5' },
            { id: 'L4', label: '9 × 5' }
          ],
          right: [
            { id: 'R1', label: '20', pairId: 'L1' },
            { id: 'R2', label: '30', pairId: 'L2' },
            { id: 'R3', label: '35', pairId: 'L3' },
            { id: 'R4', label: '45', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '5 × 5 = ?', correctAnswer: 25 },
        { kind: 'numeric', id: 't3', prompt: '8 × 5 = ?', correctAnswer: 40 },
        { kind: 'numeric', id: 't4', prompt: '10 × 5 = ?', correctAnswer: 50 },
        { kind: 'numeric', id: 't5', prompt: '3 × 5 = ?', correctAnswer: 15 },
        { kind: 'numeric', id: 't6', prompt: '11 × 5 = ?', correctAnswer: 55 }
      ],
      socraticHints: {
        t3: ['8×10=80, ÷2=?'],
        t4: ['Половина от 100 — какое круглое число?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L4, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Касса с мелочью',
    icon: 'i-lucide-coins', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе принимает мелочь',
        roleplay: 'У клиентов монеты по 5 и 50 тг. Помоги считать.',
        characterName: 'Кассир Адиль',
        mascotLine: 'Все на 0 или 5!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Школьник', request: '6 монет по 5 тг. Сколько?', correct: 30, wrongFeedback: '6×5=30.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Бабушка', request: '8 монет по 5. Сколько?', correct: 40, wrongFeedback: '8×5=40.', revenueReward: 40, reputationReward: 1 },
        { id: 'o3', customer: 'Турист', request: '7 монет по 5. Сколько?', correct: 35, wrongFeedback: '7×5=35.', revenueReward: 35, reputationReward: 1 },
        { id: 'o4', customer: 'Гость', request: '9 монет по 50 тг. Сколько?', correct: 450, wrongFeedback: '9×50=450.', revenueReward: 450, reputationReward: 2 }
      ],
      boss: {
        id: 'boss',
        customer: 'Юбилей',
        request: 'ФИНАЛ: 12 банкнот по 5 тг + 5 банкнот по 5 тг. Сколько?',
        correct: 85,
        wrongFeedback: '17×5=85.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L4, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай конец',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Пятёрный мастер', emoji: '✋' },
      intro: 'Все правильные ×5 заканчиваются на 0 или 5.',
      traps: [
        { id: 'tr1', wrongStatement: '«6 × 5 = 32»', whyWrong: 'Не на 0 или 5 — точно ошибка. 6×5=30.', correctStatement: '6 × 5 = 30', rememberNote: 'Конец 0 или 5.' },
        { id: 'tr2', wrongStatement: '«7 × 5 = 30»', whyWrong: '30 — это 6×5. 7×5=35.', correctStatement: '7 × 5 = 35', rememberNote: 'Чёт→0, нечёт→5.' },
        { id: 'tr3', wrongStatement: 'Не знал лайфхак', whyWrong: 'Через ×10÷2 — быстрее.', correctStatement: 'Используй лайфхак', rememberNote: '×10÷2.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни ×5',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи лайфхак для умножения на 5',
      coverPrompts: ['Какая особенность результатов ×5?', 'Какой быстрый способ?', 'Приведи пример.'],
      referenceAnswer: 'Все результаты умножения на 5 заканчиваются на 0 или 5: 5, 10, 15, 20, 25... Если число чётное — ответ на 0, если нечётное — на 5. Быстрый способ: умножь на 10 и подели пополам. Например, 8×5 = 80÷2 = 40.',
      requiredConcepts: ['×5', '0 или 5'],
      conceptKeywords: {
        '×5': ['×5', 'на 5', 'пять'],
        '0 или 5': ['0', '5', 'ноль', 'кончает']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['5', '0'] }
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
      shareCapsuleName: 'Таблица × 5 · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '4 × 5 = ?', correctAnswer: 20, conceptTag: 'таблица5', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '7 × 5 = ?', correctAnswer: 35, conceptTag: 'таблица5', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: '9 × 5 = ?', correctAnswer: 45, conceptTag: 'таблица5', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '8 монет по 5 тг = ?', correctAnswer: 40, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '6 × 5 = ?', correctAnswer: 30, conceptTag: 'таблица5', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '5 × 5 = ?', correctAnswer: 25, conceptTag: 'таблица5', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '3 × 5 = ?', correctAnswer: 15, conceptTag: 'таблица5', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: '10 × 5 = ?', correctAnswer: 50, conceptTag: 'таблица5', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '8 × 5 = ?', correctAnswer: 40, conceptTag: 'таблица5', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '11 банкнот по 5 = ?', correctAnswer: 55, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Таблица умножения на 2, 3, 4, 5', layersInsertedByLesson: counter }
})
