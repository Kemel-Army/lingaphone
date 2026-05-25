import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 2 lessons of «Сотни. Числа до 1000».
 *   1. Счёт сотнями. Круглые сотни до 1000
 *   2. Сложение и вычитание круглых сотен
 *
 * S6: тема №06, theme-pack = 'construction' (расширение разрядов).
 * Использует PlaceValueBlocksWidget с сотнями (10×10 квадратами).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (💯/➕).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Сотни. Числа до 1000')
  const L1 = lessonIds['Счёт сотнями. Круглые сотни до 1000']
  const L2 = lessonIds['Сложение и вычитание круглых сотен']
  if (!L1 || !L2) throw createError({ statusCode: 500, message: 'Some lessons missing for «Сотни. Числа до 1000»' })

  await wipeLayersForLessons(supabase, [L1, L2])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Счёт сотнями
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Сотня — новый «пучок»',
    subtitle: 'Десятки связали в сотни',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Сотня — это 10 десятков, или 100 единиц.',
      body: 'Когда десятков много, мы связываем их в сотни.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '1️⃣', accent: 'sky', caption: '1 единица' },
        { emoji: '🔟', accent: 'amber', caption: '10 единиц = 1 десяток' },
        { emoji: '💯', accent: 'emerald', caption: '10 десятков = 1 сотня!' }
      ],
      prompt: 'Сколько десятков в одной сотне?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '10', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '100' },
        { id: 'c', emoji: '🤯', label: '1' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь сотни?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Какое число идёт после 100?', options: ['200', '101', '110', '99'], correctIndex: 1, conceptTag: 'после-100', explanation: 'После 100 → 101.' },
        { id: 'd2', prompt: 'Сколько единиц в 1 сотне?', options: ['10', '100', '1000', '1'], correctIndex: 1, conceptTag: 'сотня', explanation: '1 с. = 100.' },
        { id: 'd3', prompt: '300 — это сколько сотен?', options: ['1', '3', '30', '300'], correctIndex: 1, conceptTag: 'счёт-сотнями', explanation: '300 = 3 с.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Сотни в блоках',
    subtitle: 'Сотня — это квадрат 10×10',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'INTUITION',
      widget: { type: 'place-value-blocks', maxHundreds: 9, maxTens: 9, maxOnes: 9, target: 358 },
      probes: [
        { id: 'p1', prompt: 'Положи 3 квадрата (сотни). Сколько единиц?', options: ['30', '300', '3', '3000'], correctIndex: 1, explanation: '3×100=300.' },
        { id: 'p2', prompt: 'Какое число идёт после 700 при счёте сотнями?', options: ['701', '710', '800', '600'], correctIndex: 2, explanation: 'Шаг сотнями: 700 → 800.' }
      ],
      copy: { headline: '100, 200, 300 ... 1000 — счёт сотнями', body: 'Каждый шаг — 100 единиц.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Что такое сотня',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Эволюция счёта',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: '10 единиц → десяток' },
            { emoji: '🔟', accent: 'amber', caption: '10 десятков → сотня' },
            { emoji: '💯', accent: 'emerald', caption: '10 сотен → 1000!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**1 сотня = 10 десятков = 100 единиц.** Сотня — новая укрупнённая единица счёта.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1\\ \\text{сотня} = 100' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А что после 999?',
          revealedKind: 'text',
          revealedContent: '1000! Это 10 сотен, новое число с четырьмя цифрами. Самое маленькое четырёхзначное.',
          revealedHint: '1000 = 10 сотен.'
        },
        { id: 'c5', kind: 'text', content: 'Круглые сотни: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000.' }
      ],
      checks: [
        { id: 'ch1', prompt: '5 сотен = ? единиц', options: ['5', '50', '500', '5000'], correctIndex: 2 },
        { id: 'ch2', prompt: 'Что больше: 700 или 8 сотен?', options: ['700', '8 сотен', 'равны', 'нельзя'], correctIndex: 1 },
        { id: 'ch3', prompt: '1000 = ? сотен', options: ['10', '100', '1', '1000'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Разряд сотен',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Число 358',
      anatomy: [
        { id: 'a1', label: '3', role: 'разряд сотен (300)', accent: 'rose' },
        { id: 'a2', label: '5', role: 'разряд десятков (50)', accent: 'sky' },
        { id: 'a3', label: '8', role: 'разряд единиц (8)', accent: 'amber' }
      ],
      terms: [
        { term: 'Сотня', definition: 'Единица счёта = 100 единиц = 10 десятков.', example: '300 = 3 сотни', speakText: 'Сотня — сто единиц' },
        { term: 'Трёхзначное число', definition: 'Число от 100 до 999.', example: '358, 100, 999', speakText: 'Трёхзначное — три цифры' }
      ],
      buildTask: {
        prompt: 'Сколько сотен в 600?',
        template: '___',
        expected: ['6'],
        distractors: ['60', '600', '1', '10', '0']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Раскладываем сотни',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Учимся читать круглые сотни и видеть их в числах.',
      examples: [
        {
          id: 'ex1', problem: 'Запиши число «4 сотни»', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что такое сотня?', explanation: '1 сотня = 100.', visual: { kind: 'board', boardLines: ['1 с. = 100'] }, action: { kind: 'numeric', prompt: '1 с. = ?', expected: 100 } },
            { index: 2, title: 'Считаем', explanation: '4 × 100 = 400.', action: { kind: 'numeric', prompt: 'Запиши:', expected: 400 } }
          ]
        },
        {
          id: 'ex2', problem: 'Сколько сотен в 800?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Делим на 100', explanation: '800 ÷ 100 = 8.', action: { kind: 'numeric', prompt: 'Сотен?', expected: 8 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем сотни',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сотни с числом',
          left: [
            { id: 'L1', label: '3 сотни' },
            { id: 'L2', label: '7 сотен' },
            { id: 'L3', label: '500 (сотен?)' },
            { id: 'L4', label: '1000 (сотен?)' }
          ],
          right: [
            { id: 'R1', label: '300', pairId: 'L1' },
            { id: 'R2', label: '700', pairId: 'L2' },
            { id: 'R3', label: '5', pairId: 'L3' },
            { id: 'R4', label: '10', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'Какое число после 600 при счёте сотнями?', correctAnswer: 700 },
        { kind: 'numeric', id: 't3', prompt: '5 сотен = ? единиц', correctAnswer: 500 },
        { kind: 'numeric', id: 't4', prompt: 'Сколько десятков в 1 сотне?', correctAnswer: 10 },
        { kind: 'numeric', id: 't5', prompt: '900 + 100 = ?', correctAnswer: 1000 },
        { kind: 'numeric', id: 't6', prompt: 'Сколько единиц в 9 сотнях?', correctAnswer: 900 }
      ],
      socraticHints: {
        t2: ['К 600 + 100.'],
        t5: ['9 + 1 сотен = ?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Склад на стройке',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Склад кирпичей',
        roleplay: 'Помоги кладовщику считать кирпичи в коробках по 100.',
        characterName: 'Кладовщик Бекзат',
        mascotLine: '1 коробка = 1 сотня = 100 кирпичей!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Бригада', request: 'Привезли 4 коробки по 100 кирпичей. Всего?', correct: 400, wrongFeedback: '4×100=400.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Объект', request: '6 сотен блоков. Сколько штук?', correct: 600, wrongFeedback: '6 с. = 600.', revenueReward: 150, reputationReward: 1 },
        { id: 'o3', customer: 'Учёт', request: '800 кирпичей — сколько коробок по 100?', correct: 8, wrongFeedback: '800÷100=8.', revenueReward: 80, reputationReward: 1 },
        { id: 'o4', customer: 'Ревизия', request: '10 коробок по 100. Сколько штук?', correct: 1000, wrongFeedback: '10×100=1000.', revenueReward: 200, reputationReward: 2 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большая поставка',
        request: 'ФИНАЛ: Привезли 7 сотен и ещё 3 сотни. Сколько всего?',
        correct: 1000,
        wrongFeedback: '7+3=10 сотен = 1000.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где путаются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Сотенный мастер', emoji: '💯' },
      intro: 'Не путай сотни с десятками.',
      traps: [
        { id: 'tr1', wrongStatement: '«1 сотня = 10»', whyWrong: '1 сотня = 100. С 10 ты путаешь десяток.', correctStatement: '1 сотня = 100', rememberNote: 'Сотня — два нуля.' },
        { id: 'tr2', wrongStatement: '«500 = 5 десятков»', whyWrong: '500 — это 5 сотен или 50 десятков. Не 5.', correctStatement: '500 = 5 сотен = 50 десятков', rememberNote: 'Считай нули.' },
        { id: 'tr3', wrongStatement: '«После 900 идёт 901»', whyWrong: 'При счёте **сотнями** после 900 → 1000.', correctStatement: 'Счёт сотнями: 900 → 1000', rememberNote: 'Шаг важен.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни сотню',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи что такое сотня',
      coverPrompts: ['Что такое сотня?', 'Сколько в ней десятков?', 'Перечисли круглые сотни до 1000.'],
      referenceAnswer: 'Сотня — это 100 единиц или 10 десятков. Это укрупнённая единица счёта, как раньше десяток. Круглые сотни до 1000: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000. Каждая следующая больше на 100.',
      requiredConcepts: ['сотня', 'десяток', '100'],
      conceptKeywords: {
        сотня: ['сотн', 'сот'],
        десяток: ['десят'],
        100: ['100', 'сто']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['сот', '100'] }
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
      shareCapsuleName: 'Счёт сотнями · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '7 сотен = ?', correctAnswer: 700, conceptTag: 'сотни', cognitiveLevel: 'recall', explanation: '7×100.' },
        { id: 'm2', kind: 'numeric', prompt: '900 = ? сотен', correctAnswer: 9, conceptTag: 'сотни', cognitiveLevel: 'apply', explanation: '900÷100=9.' },
        { id: 'm3', kind: 'numeric', prompt: 'Что больше на 100, чем 600?', correctAnswer: 700, conceptTag: 'счёт', cognitiveLevel: 'apply', explanation: '600+100.' },
        { id: 'm4', kind: 'numeric', prompt: 'Сколько десятков в 4 сотнях?', correctAnswer: 40, conceptTag: 'связь', cognitiveLevel: 'understand', explanation: '4×10.' },
        { id: 'm5', kind: 'numeric', prompt: 'В 10 коробках по 100 яблок. Всего?', correctAnswer: 1000, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '10×100.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '6 сотен = ?', correctAnswer: 600, conceptTag: 'сотни', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '400 = ? сотен', correctAnswer: 4, conceptTag: 'сотни', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'После 500 шаг сотнями?', correctAnswer: 600, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Десятков в 7 сотнях?', correctAnswer: 70, conceptTag: 'связь', cognitiveLevel: 'understand' },
        { id: 'p5', kind: 'numeric', prompt: '5 коробок по 100 = ?', correctAnswer: 500, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Сложение и вычитание круглых сотен
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Считаем сотнями',
    subtitle: 'Как обычные числа',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '300 + 200 — а где трудность? Никакой!',
      body: '3 сотни + 2 сотни = 5 сотен = 500.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🧮', accent: 'sky', caption: 'Забудь про нули' },
        { emoji: '➕', accent: 'amber', caption: 'Считай как 3+2=5' },
        { emoji: '💯', accent: 'emerald', caption: 'Припиши нули → 500!' }
      ],
      prompt: '300 + 200 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '5' },
        { id: 'b', emoji: '🥇', label: '500', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '50' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов считать сотнями?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '3 + 2 = ?', options: ['5', '4', '6', '32'], correctIndex: 0, conceptTag: 'базовое', explanation: '3+2=5.' },
        { id: 'd2', prompt: '300 + 200 = ?', options: ['5', '500', '50', '5000'], correctIndex: 1, conceptTag: 'сотни+', explanation: '3+2=5 с.' },
        { id: 'd3', prompt: '700 − 400 = ?', options: ['3', '300', '30', '3000'], correctIndex: 1, conceptTag: 'сотни−', explanation: '7−4=3 с.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Сотни — те же десятки',
    subtitle: 'Шагаем сотнями по прямой',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 1000, step: 100 },
      probes: [
        { id: 'p1', prompt: 'Шагай от 200 на 3 сотни вперёд. Где остановишься?', options: ['500', '203', '230', '700'], correctIndex: 0, explanation: '200+300=500.' },
        { id: 'p2', prompt: 'От 800 шагни на 3 сотни назад', options: ['500', '600', '300', '700'], correctIndex: 0, explanation: '800−300=500.' }
      ],
      copy: { headline: 'Сложение и вычитание сотен — как с десятками или единицами', body: 'Просто работаем не с цифрой 1, а с сотней.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Сложение и вычитание сотен',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Приём «забудь нули»',
          panels: [
            { emoji: '✂️', accent: 'sky', caption: '1. Убери нули' },
            { emoji: '➕', accent: 'amber', caption: '2. Сложи как обычно' },
            { emoji: '🔢', accent: 'emerald', caption: '3. Припиши нули' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Складываем сотни как обычные числа.** 3 с. + 2 с. = 5 с. → 300 + 200 = 500.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '300 + 200 = 500' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А вычитание?',
          revealedKind: 'formula',
          revealedContent: '700 - 400 = 300',
          revealedHint: 'То же самое: 7−4=3 сотни = 300.'
        },
        { id: 'c5', kind: 'text', content: 'Главное — забыть про два нуля и работать с сотнями как с обычными цифрами. Потом дописать нули.' }
      ],
      checks: [
        { id: 'ch1', prompt: '500 + 400 = ?', options: ['9', '900', '90', '9000'], correctIndex: 1 },
        { id: 'ch2', prompt: '800 − 300 = ?', options: ['500', '5', '50', '5000'], correctIndex: 0 },
        { id: 'ch3', prompt: '600 + 400 = ?', options: ['10', '100', '1000', '10000'], correctIndex: 2 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Действия с сотнями',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: '300 + 200 = 500',
      anatomy: [
        { id: 'a1', label: '3 с. + 2 с.', role: 'считаем сотнями', accent: 'sky' },
        { id: 'a2', label: '5 сотен', role: 'результат', accent: 'amber' },
        { id: 'a3', label: '500', role: 'дописываем нули', accent: 'green' }
      ],
      terms: [
        { term: 'Круглая сотня', definition: 'Число вида 100, 200, ... 900, 1000.', example: '500 — круглая сотня', speakText: 'Круглая сотня' }
      ],
      buildTask: {
        prompt: '600 + 200 = ___',
        template: '___',
        expected: ['800'],
        distractors: ['8', '80', '8000', '6200', '602']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем сотни',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Простой приём: считай как с обычными числами, потом припиши нули.',
      examples: [
        {
          id: 'ex1', problem: '400 + 300', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Без нулей', explanation: '4 + 3 = 7.', visual: { kind: 'board', boardLines: ['4 + 3 = 7'] }, action: { kind: 'numeric', prompt: '4 + 3 = ?', expected: 7 } },
            { index: 2, title: 'Дописываем сотни', explanation: '7 сотен = 700.', visual: { kind: 'board', boardLines: ['400 + 300 = 700'] }, action: { kind: 'numeric', prompt: 'Итого:', expected: 700 } }
          ]
        },
        {
          id: 'ex2', problem: '900 − 600', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Без нулей', explanation: '9 − 6 = 3.', action: { kind: 'numeric', prompt: '9 − 6 = ?', expected: 3 } },
            { index: 2, title: 'Дописываем', explanation: '3 сотни = 300.', action: { kind: 'numeric', prompt: 'Итого:', expected: 300 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем сотни',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сумму/разность с ответом',
          left: [
            { id: 'L1', label: '300 + 200' },
            { id: 'L2', label: '700 − 400' },
            { id: 'L3', label: '500 + 500' },
            { id: 'L4', label: '900 − 200' }
          ],
          right: [
            { id: 'R1', label: '500', pairId: 'L1' },
            { id: 'R2', label: '300', pairId: 'L2' },
            { id: 'R3', label: '1000', pairId: 'L3' },
            { id: 'R4', label: '700', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '600 + 300 = ?', correctAnswer: 900 },
        { kind: 'numeric', id: 't3', prompt: '800 − 500 = ?', correctAnswer: 300 },
        { kind: 'numeric', id: 't4', prompt: '400 + 400 = ?', correctAnswer: 800 },
        { kind: 'numeric', id: 't5', prompt: '1000 − 700 = ?', correctAnswer: 300 },
        { kind: 'numeric', id: 't6', prompt: '200 + 700 = ?', correctAnswer: 900 }
      ],
      socraticHints: {
        t2: ['6+3 = 9 сотен = 900.'],
        t5: ['1000 = 10 сотен. 10−7=3.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Большой магазин',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Стройбаза',
        roleplay: 'Помоги владелице считать большие суммы. Цены — круглыми сотнями.',
        characterName: 'Хозяйка Айман',
        mascotLine: 'Сотни — те же числа, только больше!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: 'Цемент 400 + краска 300 тг. Чек?', correct: 700, wrongFeedback: '400+300=700.', revenueReward: 700, reputationReward: 1 },
        { id: 'o2', customer: 'Касса', request: 'Было 900 тг, ушло 500. Остаток?', correct: 400, wrongFeedback: '900−500=400.', revenueReward: 400, reputationReward: 1 },
        { id: 'o3', customer: 'Поставщик', request: '600 + 400 = ?', correct: 1000, wrongFeedback: '600+400=1000.', revenueReward: 1000, reputationReward: 2 },
        { id: 'o4', customer: 'Сотрудник', request: 'Зарплата 800 − налог 200. На руки?', correct: 600, wrongFeedback: '800−200=600.', revenueReward: 600, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой клиент',
        request: 'ФИНАЛ: Чек 700 + 200 + 100. К оплате?',
        correct: 1000,
        wrongFeedback: '700+200+100=1000.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки с сотнями',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Сотенный счетовод', emoji: '➕' },
      intro: 'Самое частое — потерять нули.',
      traps: [
        { id: 'tr1', wrongStatement: '«300 + 200 = 5»', whyWrong: 'Забыл, что считаем сотнями. 3+2=5 сотен = **500**.', correctStatement: '300 + 200 = 500', rememberNote: 'Не забывай нули!' },
        { id: 'tr2', wrongStatement: '«700 − 400 = 30»', whyWrong: '7−4=3 сотни = 300, не 30.', correctStatement: '700 − 400 = 300', rememberNote: 'Сотни, не десятки.' },
        { id: 'tr3', wrongStatement: '«500 + 500 = 100»', whyWrong: '5+5=10 сотен = 1000.', correctStatement: '500 + 500 = 1000', rememberNote: '10 с. = 1000.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи приём',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как складывать сотни',
      coverPrompts: ['Как сложить 400 и 500?', 'Какой приём?', 'Что не забыть?'],
      referenceAnswer: 'Чтобы сложить или вычесть круглые сотни, я считаю их как обычные числа без нулей: 400+500 — это 4+5=9 сотен, то есть 900. Главное — не забыть приписать обратно два нуля. Это работает и для вычитания.',
      requiredConcepts: ['сотни', 'нули', 'счёт'],
      conceptKeywords: {
        сотни: ['сотн', 'сот'],
        нули: ['нул', 'ноль'],
        счёт: ['счёт', 'счит']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['сот', 'нул'] }
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
      shareCapsuleName: 'Сотни +/− · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '400 + 500 = ?', correctAnswer: 900, conceptTag: 'сотни+', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '800 − 300 = ?', correctAnswer: 500, conceptTag: 'сотни−', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: '600 + 400 = ?', correctAnswer: 1000, conceptTag: 'круглое-1000', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '1000 − 600 = ?', correctAnswer: 400, conceptTag: 'сотни−', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Школа: 700 тг, потратили 400. Осталось?', correctAnswer: 300, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '300 + 600 = ?', correctAnswer: 900, conceptTag: 'сотни+', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '1000 − 400 = ?', correctAnswer: 600, conceptTag: 'сотни−', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '500 + 300 = ?', correctAnswer: 800, conceptTag: 'сотни+', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '700 + 300 = ?', correctAnswer: 1000, conceptTag: 'круглое-1000', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Магазин: 1000 − 350 = ?', correctAnswer: 650, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Сотни. Числа до 1000', layersInsertedByLesson: counter }
})
