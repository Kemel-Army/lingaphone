import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Периметр».
 *   1. Что такое периметр
 *   2. Формулы периметра прямоугольника, квадрата и треугольника
 *   3. Построение фигур по заданному периметру
 *
 * S6: тема №19, theme-pack = 'construction' (стройка заборов и участков).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (📐/📏/🏗️).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Периметр')
  const L1 = lessonIds['Что такое периметр']
  const L2 = lessonIds['Формулы периметра прямоугольника, квадрата и треугольника']
  const L3 = lessonIds['Построение фигур по заданному периметру']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Периметр»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Что такое периметр
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Обходим фигуру',
    subtitle: 'Длина границы',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Сколько ниток нужно, чтобы обойти фигуру по контуру?',
      body: 'Это и есть периметр — длина границы фигуры.',
      mascotEntry: 'teach',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🧵', accent: 'sky', caption: 'Нитка вокруг фигуры' },
        { emoji: '➕', accent: 'amber', caption: 'Складываем все стороны' },
        { emoji: '📏', accent: 'emerald', caption: 'Это и есть P!' }
      ],
      prompt: 'Если стороны 3, 4, 5 см, какой периметр?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '12 см', isPrimary: true },
        { id: 'b', emoji: '🤯', label: '60 см' },
        { id: 'c', emoji: '🤔', label: '4 см' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь периметр?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Периметр — это:', options: ['Длина одной стороны', 'Сумма всех сторон', 'Площадь', 'Угол'], correctIndex: 1, conceptTag: 'определение', explanation: 'Сумма сторон.' },
        { id: 'd2', prompt: 'Стороны 4, 5, 6. P?', options: ['11', '15', '20', '120'], correctIndex: 1, conceptTag: 'треугольник', explanation: '4+5+6=15.' },
        { id: 'd3', prompt: 'Знак P означает:', options: ['Пара', 'Периметр', 'Плюс', 'Параллельно'], correctIndex: 1, conceptTag: 'знак', explanation: 'P — периметр.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Нитка по контуру',
    subtitle: 'Считаем клетки границы',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 5, minCols: 2, maxCols: 5, defaultRows: 3, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: 'Прямоугольник 3×4. P?', options: ['7', '14', '12', '24'], correctIndex: 1, explanation: '2(3+4)=14.' },
        { id: 'p2', prompt: 'Квадрат стороной 5. P?', options: ['10', '20', '25', '5'], correctIndex: 1, explanation: '4×5=20.' }
      ],
      copy: { headline: 'Периметр — это «нить вокруг»', body: 'Сложи длины всех сторон.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Что такое P',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Периметр за 3 кадра',
          panels: [
            { emoji: '🟦', accent: 'sky', caption: 'Фигура' },
            { emoji: '🧵', accent: 'amber', caption: 'Обведи по контуру' },
            { emoji: '📏', accent: 'emerald', caption: 'Длина нити = P!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Периметр (P)** — это сумма длин всех сторон фигуры.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'P_{\\triangle} = a + b + c' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А единицы измерения?',
          revealedKind: 'text',
          revealedContent: 'У периметра всегда есть единица: см, м, дм. Не забывай — без неё ответ неполный!',
          revealedHint: 'P = ... см или м.'
        },
        { id: 'c5', kind: 'text', content: 'Например: треугольник со сторонами 3, 4, 5 см. P = 3+4+5 = 12 см.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Стороны 5, 6, 7 см. P?', options: ['18 см', '210', '12', '13'], correctIndex: 0 },
        { id: 'ch2', prompt: 'Стороны 10, 10, 10 см. P?', options: ['10', '30 см', '100', '20'], correctIndex: 1 },
        { id: 'ch3', prompt: 'Если все стороны разные — сложи:', options: ['Только две', 'Все', 'Одну', 'Никакую'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись периметра',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'P = a + b + c',
      anatomy: [
        { id: 'a1', label: 'P', role: 'обозначение периметра', accent: 'sky' },
        { id: 'a2', label: 'a, b, c', role: 'длины сторон', accent: 'amber' },
        { id: 'a3', label: 'единицы', role: 'см, м, дм', accent: 'green' }
      ],
      terms: [
        { term: 'Периметр', definition: 'Сумма длин всех сторон.', example: 'P=3+4+5=12 см', speakText: 'Периметр — сумма сторон' }
      ],
      buildTask: {
        prompt: 'Стороны 4, 5, 6 см. P = ___',
        template: '___',
        expected: ['15'],
        distractors: ['9', '11', '120', '20', '10']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем периметр',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: измерь стороны → сложи.',
      examples: [
        {
          id: 'ex1', problem: 'Треугольник 6, 8, 10 см', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сложи', explanation: '6+8+10=24.', visual: { kind: 'board', boardLines: ['P = 6 + 8 + 10 = 24 см'] }, action: { kind: 'numeric', prompt: 'P в см?', expected: 24 } }
          ]
        },
        {
          id: 'ex2', problem: 'Пятиугольник 2, 3, 4, 5, 6 см', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Сумма', explanation: '2+3+4+5+6=20.', action: { kind: 'numeric', prompt: 'P?', expected: 20 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем P',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини стороны с P',
          left: [
            { id: 'L1', label: '3+4+5' },
            { id: 'L2', label: '7+7+7' },
            { id: 'L3', label: '5+6+7+8' },
            { id: 'L4', label: '4+4+4+4' }
          ],
          right: [
            { id: 'R1', label: '12', pairId: 'L1' },
            { id: 'R2', label: '21', pairId: 'L2' },
            { id: 'R3', label: '26', pairId: 'L3' },
            { id: 'R4', label: '16', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '10+12+15. P?', correctAnswer: 37 },
        { kind: 'numeric', id: 't3', prompt: '9+9+9. P?', correctAnswer: 27 },
        { kind: 'numeric', id: 't4', prompt: '2+3+4+5+6. P?', correctAnswer: 20 },
        { kind: 'numeric', id: 't5', prompt: '8+5+6+10. P?', correctAnswer: 29 },
        { kind: 'numeric', id: 't6', prompt: '6+6+6+6+6. P?', correctAnswer: 30 }
      ],
      socraticHints: {
        t2: ['Сложи все 3 стороны.'],
        t4: ['5 сторон — все по очереди.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Стройка забора',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Стройка забора',
        roleplay: 'Сколько метров забора нужно? Считай периметр участка!',
        characterName: 'Бригадир Айдар',
        mascotLine: 'Сложи все стороны — получишь длину забора!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Заказчик', request: 'Участок: 10, 8, 10, 8 м. Сколько метров забора?', correct: 36, wrongFeedback: '10+8+10+8=36.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Дача', request: 'Стороны 12, 15, 12, 15. P?', correct: 54, wrongFeedback: '12+15+12+15=54.', revenueReward: 100, reputationReward: 1 },
        { id: 'o3', customer: 'Сосед', request: 'Треугольный участок: 6, 7, 8 м. P?', correct: 21, wrongFeedback: '6+7+8=21.', revenueReward: 80, reputationReward: 1 },
        { id: 'o4', customer: 'Ферма', request: 'Шестиугольник: 6 сторон по 5 м. P?', correct: 30, wrongFeedback: '6×5=30.', revenueReward: 60, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой объект',
        request: 'ФИНАЛ: Участок 25+18+25+18 м. Сколько забора?',
        correct: 86,
        wrongFeedback: '25+18+25+18=86.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай с площадью',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Сторонник', emoji: '📐' },
      intro: 'Периметр — про границу, не внутренность.',
      traps: [
        { id: 'tr1', wrongStatement: '«Стороны 3 и 4. P = 3·4 = 12»', whyWrong: 'Это площадь. Периметр — сумма сторон.', correctStatement: 'P = сумма', rememberNote: 'Сумма, не произведение.' },
        { id: 'tr2', wrongStatement: 'Забыл стороны', whyWrong: 'Все стороны нужно сложить.', correctStatement: 'Все стороны', rememberNote: 'Не теряй.' },
        { id: 'tr3', wrongStatement: 'Не записал единицы', whyWrong: 'Без см/м — неполный ответ.', correctStatement: 'Пиши единицы', rememberNote: 'см или м.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни P',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи что такое периметр',
      coverPrompts: ['Что такое периметр?', 'Как его найти?', 'Покажи на треугольнике.'],
      referenceAnswer: 'Периметр — это длина всей границы фигуры, или сумма длин всех сторон. Чтобы найти периметр треугольника со сторонами a, b, c, складываем: P = a + b + c. Например, у треугольника со сторонами 3, 4, 5 см периметр равен 12 см.',
      requiredConcepts: ['периметр', 'стороны'],
      conceptKeywords: {
        периметр: ['пери', 'P'],
        стороны: ['стор']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['пери', 'стор'] }
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
      shareCapsuleName: 'Что такое периметр · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Стороны 4, 5, 6. P?', correctAnswer: 15, conceptTag: 'треуг', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'Квадрат a=6. P?', correctAnswer: 24, conceptTag: 'квадрат', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'Прям-к 5×8. P?', correctAnswer: 26, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Периметр — это:', options: ['Сумма сторон', 'Произведение', 'Угол'], correctIndex: 0, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: 'Квадрат a=9. P?', correctAnswer: 36, conceptTag: 'квадрат', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Стороны 7, 8, 9. P?', correctAnswer: 24, conceptTag: 'треуг', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Квадрат a=11. P?', correctAnswer: 44, conceptTag: 'квадрат', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Прям-к 6×9. P?', correctAnswer: 30, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Стороны 10, 12, 8. P?', correctAnswer: 30, conceptTag: 'треуг', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Участок 15+20+15+20. P?', correctAnswer: 70, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Формулы P
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Готовые формулы',
    subtitle: 'P = 4a, 2(a+b), a+b+c',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'P = 4a — для квадрата. P = 2(a+b) — для прямоугольника.',
      body: 'Не нужно складывать вручную — формула быстрее.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '⬛', accent: 'sky', caption: 'Квадрат: P = 4a' },
        { emoji: '▭', accent: 'amber', caption: 'Прям-к: P = 2(a+b)' },
        { emoji: '🔺', accent: 'emerald', caption: 'Треуг: P = a+b+c' }
      ],
      prompt: 'P квадрата со стороной 7?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '14' },
        { id: 'b', emoji: '🥇', label: '28', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '7' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь формулы?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Формула P квадрата:', options: ['a+b', '4·a', '2·a', 'a·a'], correctIndex: 1, conceptTag: 'квадрат', explanation: '4 равные стороны.' },
        { id: 'd2', prompt: 'Формула P прямоугольника:', options: ['a+b', '4a', '2(a+b)', 'a·b'], correctIndex: 2, conceptTag: 'прямоуг', explanation: '2 пары равных.' },
        { id: 'd3', prompt: 'Формула P треугольника:', options: ['a+b+c', 'a·b·c', '3a', '2a'], correctIndex: 0, conceptTag: 'треугольник', explanation: 'Сумма 3 сторон.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Все стороны',
    subtitle: 'Формула — скоростной способ',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 5, minCols: 2, maxCols: 5, defaultRows: 3, defaultCols: 5 },
      probes: [
        { id: 'p1', prompt: 'Квадрат 6: 4 стороны по 6. P?', options: ['12', '24', '36', '6'], correctIndex: 1 },
        { id: 'p2', prompt: 'Прям-к 5×8: 2 по 5 и 2 по 8. P?', options: ['13', '40', '26', '20'], correctIndex: 2 }
      ],
      copy: { headline: 'Формулы — это «скоростной способ»', body: 'Они избавляют от сложения вручную.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Три формулы',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Три формулы — три фигуры',
          panels: [
            { emoji: '⬛', accent: 'sky', caption: 'Квадрат → 4a' },
            { emoji: '▭', accent: 'amber', caption: 'Прям-к → 2(a+b)' },
            { emoji: '🔺', accent: 'emerald', caption: 'Треуг → a+b+c' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**P квадрата = 4·a**, где a — сторона.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'callout', content: '**P прямоугольника = 2·(a + b)**, где a и b — стороны.' },
        { id: 'c4', kind: 'callout', content: '**P треугольника = a + b + c**.' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Почему именно так?',
          revealedKind: 'text',
          revealedContent: 'У квадрата 4 равные стороны (×4). У прямоугольника 2 пары равных, поэтому удваиваем сумму. У треугольника все 3 стороны разные — складываем.',
          revealedHint: 'Логика, не магия.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'Квадрат a=8. P?', options: ['16', '32', '64', '8'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Прям-к 6×10. P?', options: ['16', '32', '60', '26'], correctIndex: 1 },
        { id: 'ch3', prompt: 'Треуг 3,4,5. P?', options: ['12', '60', '15', '20'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Сборник формул',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Формулы P',
      anatomy: [
        { id: 'a1', label: 'Квадрат: P=4a', role: '4 равных стороны', accent: 'sky' },
        { id: 'a2', label: 'Прямоуг: P=2(a+b)', role: '2 пары равных', accent: 'amber' },
        { id: 'a3', label: 'Треуг: P=a+b+c', role: '3 разные стороны', accent: 'green' }
      ],
      terms: [
        { term: 'Формула периметра', definition: 'Готовое выражение для подсчёта.', example: 'P=4a для квадрата', speakText: 'Формула периметра' }
      ],
      buildTask: {
        prompt: 'P = 2(a+b). При a=4, b=3 P = ___',
        template: '___',
        expected: ['14'],
        distractors: ['7', '12', '10', '24', '70']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Применяем формулы',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Подставь в формулу — получи ответ.',
      examples: [
        {
          id: 'ex1', problem: 'Квадрат a=9 см', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Формула', explanation: 'P=4a=4·9.', visual: { kind: 'board', boardLines: ['P = 4·9 = 36 см'] }, action: { kind: 'numeric', prompt: '4·9?', expected: 36 } },
            { index: 2, title: 'Считаем', explanation: '4·9=36 см.', action: { kind: 'numeric', prompt: 'P?', expected: 36 } }
          ]
        },
        {
          id: 'ex2', problem: 'Прям-к 7×12 см', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: 'P=2(7+12)=2·19=38.', action: { kind: 'numeric', prompt: '?', expected: 38 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем формулы',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с P',
          left: [
            { id: 'L1', label: 'Квадрат a=5' },
            { id: 'L2', label: 'Прям-к 3×7' },
            { id: 'L3', label: 'Треуг 5+7+9' },
            { id: 'L4', label: 'Квадрат a=10' }
          ],
          right: [
            { id: 'R1', label: '20', pairId: 'L1' },
            { id: 'R2', label: '20', pairId: 'L2' },
            { id: 'R3', label: '21', pairId: 'L3' },
            { id: 'R4', label: '40', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'Квадрат a=12. P?', correctAnswer: 48 },
        { kind: 'numeric', id: 't3', prompt: 'Прям-к 8×15. P?', correctAnswer: 46 },
        { kind: 'numeric', id: 't4', prompt: 'Треуг 6+8+10. P?', correctAnswer: 24 },
        { kind: 'numeric', id: 't5', prompt: 'Прям-к 6×4. P?', correctAnswer: 20 },
        { kind: 'numeric', id: 't6', prompt: 'Квадрат a=15. P?', correctAnswer: 60 }
      ],
      socraticHints: {
        t2: ['4·12 = ?'],
        t3: ['2·(8+15) = 2·23 = ?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Дизайнер ковров',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Строй-мастерская ковров',
        roleplay: 'Считай длину окантовки. Формулы помогают.',
        characterName: 'Дизайнер Гульнур',
        mascotLine: 'Знаешь форму — знаешь формулу!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Клиент', request: 'Квадратный ковёр a=4 м. Окантовка?', correct: 16, wrongFeedback: 'P=4·4=16.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: 'Прям-к 5×8. Окантовка?', correct: 26, wrongFeedback: 'P=2(5+8)=26.', revenueReward: 100, reputationReward: 1 },
        { id: 'o3', customer: 'Школа', request: 'Большой квадрат a=10. P?', correct: 40, wrongFeedback: '4·10=40.', revenueReward: 200, reputationReward: 1 },
        { id: 'o4', customer: 'Гость', request: 'Треуг ковёр 4+5+7. P?', correct: 16, wrongFeedback: '4+5+7=16.', revenueReward: 80, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой зал',
        request: 'ФИНАЛ: Прям-к 12×18 м. Окантовка?',
        correct: 60,
        wrongFeedback: 'P=2(12+18)=60.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не забудь умножить',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Формул-эксперт', emoji: '📏' },
      intro: 'Формулы — точные.',
      traps: [
        { id: 'tr1', wrongStatement: '«Квадрат a=5. P=5»', whyWrong: '4 стороны, P=4·5=20.', correctStatement: 'P=4a, не a', rememberNote: '×4 для квадрата.' },
        { id: 'tr2', wrongStatement: '«Прям-к 3×4. P = 3+4 = 7»', whyWrong: '2 пары: P=2·(3+4)=14.', correctStatement: '2(a+b)', rememberNote: 'Удвой сумму.' },
        { id: 'tr3', wrongStatement: 'Не использовал формулу', whyWrong: 'Формулы быстрее.', correctStatement: 'Используй формулу', rememberNote: 'Скорость и точность.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни формулы',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи формулы периметра',
      coverPrompts: ['Какие формулы P ты знаешь?', 'Откуда у квадрата 4a?', 'Покажи на примере.'],
      referenceAnswer: 'P квадрата = 4a, потому что у него 4 равных стороны. P прямоугольника = 2(a+b), потому что 2 пары противоположных равных сторон. P треугольника = a+b+c — все стороны разные. Например, квадрат a=5: P=4·5=20.',
      requiredConcepts: ['формула', 'квадрат', 'прямоугольник'],
      conceptKeywords: {
        формула: ['формул'],
        квадрат: ['квадрат'],
        прямоугольник: ['прямоуг', 'прямоугольник']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['формул', 'квадрат'] }
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
      shareCapsuleName: 'Формулы P · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Квадрат a=8. P?', correctAnswer: 32, conceptTag: 'квадрат', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'Прям-к 5×9. P?', correctAnswer: 28, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'Треуг 4+6+8. P?', correctAnswer: 18, conceptTag: 'треуг', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Формула P квадрата:', options: ['4a', 'a+b', 'a·b'], correctIndex: 0, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: 'Прям-к 7×10. P?', correctAnswer: 34, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Квадрат a=14. P?', correctAnswer: 56, conceptTag: 'квадрат', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Прям-к 9×11. P?', correctAnswer: 40, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Треуг 5+5+8. P?', correctAnswer: 18, conceptTag: 'треуг', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Прям-к 12×15. P?', correctAnswer: 54, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Квадрат a=20. P?', correctAnswer: 80, conceptTag: 'квадрат', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Построение по периметру
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Обратная задача',
    subtitle: 'Из P в сторону',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Если P квадрата = 24 см, какая сторона?',
      body: 'a = P÷4 = 24÷4 = 6 см. Действуй обратно.',
      mascotEntry: 'think',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🔍', accent: 'sky', caption: 'P известен' },
        { emoji: '➗', accent: 'amber', caption: '÷ 4 для квадрата' },
        { emoji: '✨', accent: 'emerald', caption: 'Сторона найдена!' }
      ],
      prompt: 'P квадрата = 32. a = ?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '8', isPrimary: true },
        { id: 'b', emoji: '🤯', label: '128' },
        { id: 'c', emoji: '🤔', label: '32' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь обратное?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'P квадрата 20. a?', options: ['5', '4', '80', '20'], correctIndex: 0, conceptTag: 'обратное', explanation: '20÷4=5.' },
        { id: 'd2', prompt: 'Прям-к: P=24, a=4. Найди b', options: ['8', '20', '6', '4'], correctIndex: 0, conceptTag: 'прямоуг', explanation: '24÷2−4=8.' },
        { id: 'd3', prompt: 'Чтобы найти сторону квадрата:', options: ['×4', '÷4', '+4', '−4'], correctIndex: 1, conceptTag: 'правило', explanation: 'a = P÷4.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Делим периметр',
    subtitle: 'P → сторона',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 50, step: 1 },
      probes: [
        { id: 'p1', prompt: 'P=40, квадрат. Сторона?', options: ['4', '10', '160', '8'], correctIndex: 1, explanation: '40÷4=10.' },
        { id: 'p2', prompt: 'P=28, прям-к, b=5. a?', options: ['9', '23', '14', '5'], correctIndex: 0, explanation: '14−5=9.' }
      ],
      copy: { headline: 'Если P известен — действуй обратно к формуле', body: 'Квадрат: ÷4. Прям-к: P/2 − известная.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Обратные формулы',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Обратное действие',
          panels: [
            { emoji: '🔍', accent: 'sky', caption: 'Дано P' },
            { emoji: '➗', accent: 'amber', caption: 'Применяй обратное' },
            { emoji: '📐', accent: 'emerald', caption: 'Получишь сторону' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Сторона квадрата = P ÷ 4**, если периметр известен.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a = P \\div 4' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А прямоугольник?',
          revealedKind: 'formula',
          revealedContent: 'b = P \\div 2 - a',
          revealedHint: 'P÷2 — это сумма (a+b). Из неё вычти известную.'
        },
        { id: 'c5', kind: 'text', content: 'Это применение обратных операций — деления и вычитания.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'P=16, квадрат. a?', options: ['4', '8', '64', '16'], correctIndex: 0 },
        { id: 'ch2', prompt: 'P=30, прям-к, a=5. b?', options: ['10', '15', '25', '5'], correctIndex: 0 },
        { id: 'ch3', prompt: 'P=36, квадрат. a?', options: ['9', '6', '8', '12'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Обратные формулы',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Из P в сторону',
      anatomy: [
        { id: 'a1', label: 'Квадрат', role: 'a = P ÷ 4', accent: 'sky' },
        { id: 'a2', label: 'Прям-к', role: 'b = P÷2 − a', accent: 'amber' }
      ],
      terms: [
        { term: 'Обратная задача', definition: 'Когда известен результат — найти исходное.', example: 'P → сторона', speakText: 'Обратная задача' }
      ],
      buildTask: {
        prompt: 'У квадрата P = 24 см. Сторона a = ___',
        template: '___',
        expected: ['6'],
        distractors: ['96', '20', '12', '24', '4']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Строим по P',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: знаешь P → найди сторону → построй.',
      examples: [
        {
          id: 'ex1', problem: 'Построй квадрат с P=20', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сторона', explanation: '20÷4=5.', visual: { kind: 'board', boardLines: ['a = 20 ÷ 4 = 5'] }, action: { kind: 'numeric', prompt: 'a?', expected: 5 } },
            { index: 2, title: 'Чертим', explanation: 'Каждая сторона по 5 клеток.', action: { kind: 'numeric', prompt: 'Сторон?', expected: 5 } }
          ]
        },
        {
          id: 'ex2', problem: 'Прям-к P=24, a=4. b?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: 'b=24÷2−4=12−4=8.', action: { kind: 'numeric', prompt: 'b?', expected: 8 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем обратное',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с ответом',
          left: [
            { id: 'L1', label: 'P=24, квадрат' },
            { id: 'L2', label: 'P=40, квадрат' },
            { id: 'L3', label: 'P=20, прям-к, a=4' },
            { id: 'L4', label: 'P=30, прям-к, a=5' }
          ],
          right: [
            { id: 'R1', label: 'a=6', pairId: 'L1' },
            { id: 'R2', label: 'a=10', pairId: 'L2' },
            { id: 'R3', label: 'b=6', pairId: 'L3' },
            { id: 'R4', label: 'b=10', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'P=36, квадрат. a?', correctAnswer: 9 },
        { kind: 'numeric', id: 't3', prompt: 'P=44, прям-к, a=6. b?', correctAnswer: 16 },
        { kind: 'numeric', id: 't4', prompt: 'P=12, квадрат. a?', correctAnswer: 3 },
        { kind: 'numeric', id: 't5', prompt: 'P=50, прям-к, a=10. b?', correctAnswer: 15 },
        { kind: 'numeric', id: 't6', prompt: 'P=60, квадрат. a?', correctAnswer: 15 }
      ],
      socraticHints: {
        t3: ['44÷2=22, −6=16.'],
        t5: ['50÷2=25, −10=15.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Архитектор',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Студия архитектуры',
        roleplay: 'Знаешь периметр участка — найди стороны.',
        characterName: 'Архитектор Бахытжан',
        mascotLine: 'Из P в сторону: ÷4 для квадрата!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Заказчик', request: 'Квадратный участок P=40 м. Сторона?', correct: 10, wrongFeedback: '40÷4=10.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Дача', request: 'Прям-к P=30, a=5. b?', correct: 10, wrongFeedback: '30÷2−5=10.', revenueReward: 100, reputationReward: 1 },
        { id: 'o3', customer: 'Школа', request: 'Двор квадратный P=80. a?', correct: 20, wrongFeedback: '80÷4=20.', revenueReward: 200, reputationReward: 1 },
        { id: 'o4', customer: 'Город', request: 'Прям-к P=44, a=8. b?', correct: 14, wrongFeedback: '44÷2−8=14.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой проект',
        request: 'ФИНАЛ: Квадратный объект P=120 м. Сторона?',
        correct: 30,
        wrongFeedback: '120÷4=30.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Обратное действие!',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Архитектор', emoji: '🏗️' },
      intro: 'Не умножай вместо деления.',
      traps: [
        { id: 'tr1', wrongStatement: '«P=24 квадрата, a=24×4=96»', whyWrong: 'Если P известен — нужно делить.', correctStatement: '24÷4=6', rememberNote: 'Обратное действие.' },
        { id: 'tr2', wrongStatement: '«Прям-к P=20, a=4. b=20−4=16»', whyWrong: 'Сначала P÷2=10, потом 10−4=6.', correctStatement: 'b=P÷2−a', rememberNote: '÷2 первым.' },
        { id: 'tr3', wrongStatement: 'Не проверил', whyWrong: 'Подставь обратно — должно сходиться.', correctStatement: 'Проверка', rememberNote: 'Подставь.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни обратное',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи как из периметра найти сторону',
      coverPrompts: ['Как из P найти сторону квадрата?', 'А прямоугольника?', 'Покажи пример.'],
      referenceAnswer: 'Если периметр квадрата известен, сторона = P ÷ 4. Например, P=24, сторона=6. У прямоугольника, если известна одна сторона: вторая = P÷2 − известная. Например, P=30, a=5: b = 15 − 5 = 10.',
      requiredConcepts: ['обратное', 'периметр'],
      conceptKeywords: {
        обратное: ['обрат'],
        периметр: ['пери', 'P']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['обрат', 'P'] }
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
      shareCapsuleName: 'Построение по P · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'P=36 квадрата. a?', correctAnswer: 9, conceptTag: 'квадрат-обр', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'P=20, прям-к, a=3. b?', correctAnswer: 7, conceptTag: 'прямоуг-обр', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'P=48 квадрата. a?', correctAnswer: 12, conceptTag: 'квадрат-обр', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: 'P=40, прям-к, a=8. b?', correctAnswer: 12, conceptTag: 'прямоуг-обр', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Двор квадратный P=100. a?', correctAnswer: 25, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'P=28 квадрата. a?', correctAnswer: 7, conceptTag: 'квадрат-обр', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'P=22, прям-к, a=4. b?', correctAnswer: 7, conceptTag: 'прямоуг-обр', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'P=64 квадрата. a?', correctAnswer: 16, conceptTag: 'квадрат-обр', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'P=50, прям-к, a=12. b?', correctAnswer: 13, conceptTag: 'прямоуг-обр', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Поле квадратное P=200. a?', correctAnswer: 50, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Периметр', layersInsertedByLesson: counter }
})
