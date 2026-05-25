import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Время и римская нумерация».
 *   1. Римская нумерация чисел до 12
 *   2. Часы и минуты. Определение времени по циферблату
 *   3. Единицы времени и их преобразование
 *
 * S6: тема №08, theme-pack = 'railway' (вокзал, расписание поездов).
 * Урок 2 использует уникальный ClockWidget (set-time mode).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges.
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Время и римская нумерация')
  const L1 = lessonIds['Римская нумерация чисел до 12']
  const L2 = lessonIds['Часы и минуты. Определение времени по циферблату']
  const L3 = lessonIds['Единицы времени и их преобразование']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Время и римская нумерация»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Римская нумерация
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Загадочные буквы вместо цифр',
    subtitle: 'Древние часы на вокзале',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'На циферблате старинных часов на вокзале — буквы I, V, X.',
      body: 'Это римские цифры. Им больше двух тысяч лет — а они до сих пор живут на часах.',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🚂', accent: 'amber', caption: 'Вокзал. Над платформой — часы' },
        { emoji: '🕰️', accent: 'rose', caption: 'Циферблат: I, II, III... вместо 1, 2, 3' },
        { emoji: '🎩', accent: 'sky', caption: 'Так писали ещё римляне 2000 лет назад!' }
      ],
      prompt: 'Что означает римское «V»?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '1' },
        { id: 'b', emoji: '🥇', label: '5', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '10' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что знаешь о римских цифрах?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Что значит «I»?', options: ['1', '5', '10', '100'], correctIndex: 0, conceptTag: 'базовое', explanation: 'I = 1.' },
        { id: 'd2', prompt: 'А «X»?', options: ['1', '5', '10', '50'], correctIndex: 2, conceptTag: 'базовое', explanation: 'X = 10.' },
        { id: 'd3', prompt: 'Что значит «III»?', options: ['1', '3', '13', '30'], correctIndex: 1, conceptTag: 'сложение', explanation: 'I+I+I = 3.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Циферблат часов',
    subtitle: 'Числа от 1 до 12 — римскими',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 1, max: 12, step: 1 },
      probes: [
        { id: 'p1', prompt: 'Какая римская цифра соответствует 4?', options: ['IIII', 'IV', 'VI', 'IX'], correctIndex: 1, explanation: 'IV — это 5−1.' },
        { id: 'p2', prompt: 'А 9?', options: ['IX', 'XI', 'IIIIIIIII', 'VII'], correctIndex: 0, explanation: 'IX = 10−1.' }
      ],
      copy: { headline: 'I=1, V=5, X=10', body: 'Из этих трёх букв собираются все числа до 12.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правила римских цифр',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Три волшебные буквы',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: 'I = один' },
            { emoji: '5️⃣', accent: 'amber', caption: 'V = пять' },
            { emoji: '🔟', accent: 'emerald', caption: 'X = десять' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Если меньшая буква справа — складываем.** VI = 5+1 = 6, VIII = 5+3 = 8.',
          emphasis: true, speakable: true
        },
        {
          id: 'c3', kind: 'tap-reveal',
          content: 'А если меньшая стоит слева?',
          revealedKind: 'text',
          revealedContent: 'Тогда вычитаем! IV = 5−1 = 4, IX = 10−1 = 9.',
          revealedHint: 'Слева = «вычесть».'
        },
        { id: 'c4', kind: 'formula', content: '\\text{XII} = 10 + 2 = 12' },
        { id: 'c5', kind: 'text', content: 'Подряд можно повторять не больше трёх раз: III = 3, но 4 — это IV, а не IIII.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'VII = ?', options: ['7', '5', '12', '6'], correctIndex: 0 },
        { id: 'ch2', prompt: 'IX = ?', options: ['11', '9', '10', '1'], correctIndex: 1 },
        { id: 'ch3', prompt: 'XII = ?', options: ['12', '10', '20', '13'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Таблица римских цифр',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Римские цифры до 12',
      anatomy: [
        { id: 'a1', label: 'I=1, II=2, III=3', role: 'счёт единицами', accent: 'sky' },
        { id: 'a2', label: 'IV=4, V=5, VI=6', role: 'около пяти', accent: 'green' },
        { id: 'a3', label: 'VII=7, VIII=8, IX=9', role: 'до десяти', accent: 'amber' },
        { id: 'a4', label: 'X=10, XI=11, XII=12', role: 'десятки и сверх', accent: 'rose' }
      ],
      terms: [
        { term: 'Римская цифра', definition: 'Древняя система записи чисел буквами.', example: 'XII = 12', speakText: 'Римская цифра — буква вместо числа' },
        { term: 'Правило вычитания', definition: 'Меньшая буква слева — это минус.', example: 'IV = 4', speakText: 'Меньшая слева — минус' }
      ],
      buildTask: {
        prompt: 'Запиши число 8 римскими цифрами:',
        template: '___',
        expected: ['VIII'],
        distractors: ['VII', 'IX', 'IIIV', 'VV', 'IIIIIIII']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Расшифровываем',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: разбиваем на группы и считаем.',
      examples: [
        {
          id: 'ex1', problem: 'Что значит XI?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Большая буква', explanation: 'X = 10.', visual: { kind: 'board', boardLines: ['X = 10'] }, action: { kind: 'numeric', prompt: 'X = ?', expected: 10 } },
            { index: 2, title: 'Маленькая справа', explanation: 'I = 1, справа значит +1.', action: { kind: 'choice', prompt: 'I справа — это:', options: ['+', '−'], correctIndex: 0 } },
            { index: 3, title: 'Сложение', explanation: '10 + 1 = 11.', visual: { kind: 'board', boardLines: ['XI = X + I = 10 + 1 = 11'] }, action: { kind: 'numeric', prompt: 'XI = ?', expected: 11 } }
          ]
        },
        {
          id: 'ex2', problem: 'IV', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Слева меньшая', explanation: 'I = 1 слева от V = 5. Это вычитание.', action: { kind: 'choice', prompt: 'I слева — это:', options: ['+', '−'], correctIndex: 1 } },
            { index: 2, title: 'Считаем', explanation: '5 − 1 = 4.', visual: { kind: 'board', boardLines: ['IV = V − I = 5 − 1 = 4'] }, action: { kind: 'numeric', prompt: 'IV = ?', expected: 4 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем перевод',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини римское с арабским',
          left: [
            { id: 'L1', label: 'III' },
            { id: 'L2', label: 'IV' },
            { id: 'L3', label: 'VII' },
            { id: 'L4', label: 'IX' }
          ],
          right: [
            { id: 'R1', label: '3', pairId: 'L1' },
            { id: 'R2', label: '4', pairId: 'L2' },
            { id: 'R3', label: '7', pairId: 'L3' },
            { id: 'R4', label: '9', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'XI = ?', correctAnswer: 11 },
        { kind: 'numeric', id: 't3', prompt: 'XII = ?', correctAnswer: 12 },
        { kind: 'choice', id: 't4', prompt: '8 = ?', options: ['VIII', 'VV', 'IIIIV', 'XX'], correctIndex: 0 },
        { kind: 'choice', id: 't5', prompt: '6 = ?', options: ['VI', 'IV', 'IIVI', 'VV'], correctIndex: 0 },
        { kind: 'numeric', id: 't6', prompt: 'VIII = ?', correctAnswer: 8 }
      ],
      socraticHints: {
        t2: ['X = 10. Что добавляет I справа?'],
        t3: ['XII — сколько I после X?'],
        t4: ['8 = V + III. Запиши: VIII.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Часовщик на вокзале',
    icon: 'i-lucide-train-front', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'railway',
      setting: {
        title: 'Мастерская часовщика',
        roleplay: 'Пассажиры спрашивают про время по старым часам с римскими цифрами.',
        characterName: 'Мастер Калиолла',
        mascotLine: 'I=1, V=5, X=10. Остальное — комбинации!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Школьник', request: 'На часах VII. Какое время?', correct: 7, wrongFeedback: 'VII = 5+2 = 7.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Бабушка', request: 'IX часов — это сколько?', correct: 9, wrongFeedback: 'IX = 10−1 = 9.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'XII — какое число?', correct: 12, wrongFeedback: 'XII = 10+2 = 12.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Турист', request: 'IV часа — сколько?', correct: 4, wrongFeedback: 'IV = 5−1 = 4.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Старинные часы',
        request: 'ФИНАЛ: На башенных часах XI. Какое число?',
        correct: 11,
        wrongFeedback: 'XI = X + I = 10 + 1 = 11.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в римских цифрах',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток римских', emoji: '🏛️' },
      intro: 'Главное — направление чтения.',
      traps: [
        { id: 'tr1', wrongStatement: '«IIII = 4»', whyWrong: 'Подряд I не повторяется больше 3 раз. 4 — это IV.', correctStatement: '4 = IV', rememberNote: 'Не более 3 одинаковых.' },
        { id: 'tr2', wrongStatement: '«IV = 6»', whyWrong: 'Меньшая слева — это вычитание, не сложение.', correctStatement: 'IV = 5−1 = 4', rememberNote: 'Слева = минус.' },
        { id: 'tr3', wrongStatement: '«VI и IV — одно и то же»', whyWrong: 'Совсем нет. VI=6 (5+1), IV=4 (5−1).', correctStatement: 'Порядок важен', rememberNote: 'Сначала смотри, кто слева.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни римские',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи правила римских цифр',
      coverPrompts: ['Какие три главные римские цифры?', 'Что значит, если маленькая буква стоит слева?', 'Запиши 9 римскими цифрами и объясни.'],
      referenceAnswer: 'Главные римские цифры: I = 1, V = 5, X = 10. Если маленькая буква стоит справа — складываем (VI = 6), если слева — вычитаем (IV = 4). Например, 9 пишется как IX: I слева от X, значит 10 − 1 = 9.',
      requiredConcepts: ['I', 'V', 'X'],
      conceptKeywords: {
        I: ['I', 'один', 'единиц'],
        V: ['V', 'пят', 'V=5'],
        X: ['X', 'десят']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['I', 'V'] }
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
      shareCapsuleName: 'Римские цифры · Вокзал',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'VIII = ?', correctAnswer: 8, conceptTag: 'сложение', cognitiveLevel: 'recall', explanation: 'V+III = 5+3 = 8.' },
        { id: 'm2', kind: 'numeric', prompt: 'XI = ?', correctAnswer: 11, conceptTag: 'сложение', cognitiveLevel: 'apply', explanation: 'X+I = 11.' },
        { id: 'm3', kind: 'numeric', prompt: 'IV = ?', correctAnswer: 4, conceptTag: 'вычитание', cognitiveLevel: 'apply', explanation: 'I перед V: 5−1 = 4.' },
        { id: 'm4', kind: 'choice', prompt: 'Какая запись для 7?', options: ['VII', 'IIV', 'VVI', 'VIIIII'], correctIndex: 0, conceptTag: 'запись', cognitiveLevel: 'apply', explanation: '7 = VII.' },
        { id: 'm5', kind: 'choice', prompt: 'А для 12?', options: ['XII', 'IIX', 'XX', 'IXII'], correctIndex: 0, conceptTag: 'запись', cognitiveLevel: 'apply', explanation: '12 = XII.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'VI = ?', correctAnswer: 6, conceptTag: 'сложение', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: 'IX = ?', correctAnswer: 9, conceptTag: 'вычитание', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'XII = ?', correctAnswer: 12, conceptTag: 'сложение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: '11 = ?', options: ['XI', 'IX', 'IIX', 'VVI'], correctIndex: 0, conceptTag: 'запись', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: '4 = ?', options: ['IV', 'IIII', 'VI', 'VIIII'], correctIndex: 0, conceptTag: 'запись', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Часы и минуты (★ ClockWidget!)
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Две стрелки',
    subtitle: 'Часовая и минутная',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Маленькая стрелка показывает часы, большая — минуты.',
      body: 'За один час большая стрелка делает полный круг — это 60 минут.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '⏰', accent: 'sky', caption: 'Маленькая = часы (короткая)' },
        { emoji: '⏱️', accent: 'amber', caption: 'Большая = минуты (длинная)' },
        { emoji: '🔄', accent: 'emerald', caption: 'Полный круг большой = 60 минут' }
      ],
      prompt: 'Сколько минут в одном часе?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '24' },
        { id: 'b', emoji: '🥇', label: '60', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '100' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что знаешь о часах?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Какая стрелка больше?', options: ['Часовая', 'Минутная', 'Одинаковые', 'Нет стрелок'], correctIndex: 1, conceptTag: 'стрелки', explanation: 'Минутная длиннее.' },
        { id: 'd2', prompt: 'Что показывает большая?', options: ['Часы', 'Минуты', 'Секунды', 'Дни'], correctIndex: 1, conceptTag: 'минуты', explanation: 'Длинная стрелка — минуты.' },
        { id: 'd3', prompt: '1 час = ? минут', options: ['10', '60', '100', '24'], correctIndex: 1, conceptTag: 'преобр', explanation: '1 час = 60 минут.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  // ★ Используем ClockWidget!
  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Покрути стрелки сам',
    subtitle: 'Поставь часы на нужное время',
    icon: 'i-lucide-clock', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'INTUITION',
      widget: { type: 'clock', mode: 'set-time', targetHour: 3, targetMinute: 30, snap: 5 },
      probes: [
        { id: 'p1', prompt: 'Поставь стрелки на 3:30. Большая на «6» — сколько минут?', options: ['6', '30', '60', '12'], correctIndex: 1, explanation: 'На «6» = 30 минут (полкруга).' },
        { id: 'p2', prompt: 'Минутная на 12, часовая на 3. Сколько времени?', options: ['12:03', '3:00', '3:12', '15:00'], correctIndex: 1, explanation: 'Ровно 3 часа.' }
      ],
      copy: { headline: 'Каждая цифра на циферблате — это 5 минут', body: 'От 12 до 1 — 5 мин, до 2 — 10 мин, до 3 — 15 мин и так далее.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как читать время',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Чтение часов за 3 шага',
          panels: [
            { emoji: '👀', accent: 'sky', caption: 'Смотри на маленькую — это часы' },
            { emoji: '🔢', accent: 'amber', caption: 'Большая × 5 = минуты' },
            { emoji: '🎯', accent: 'emerald', caption: 'Записываем «часы:минуты»' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Маленькая стрелка** = часы. **Большая стрелка** = минуты. Каждая цифра на циферблате = 5 минут (для большой).',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Если большая на 12 — это «ровно столько-то часов». Например, маленькая на 4, большая на 12 — это 4:00.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А что если большая на 3, 6 или 9?',
          revealedKind: 'text',
          revealedContent: 'Большая на «3» = 15 минут (четверть часа). На «6» = 30 минут (полчаса). На «9» = 45 минут (без четверти).',
          revealedHint: '15, 30, 45 — четверти часа.'
        },
        { id: 'c5', kind: 'formula', content: '1\\ \\text{час} = 60\\ \\text{минут}' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Большая стрелка на «3». Сколько прошло минут?', options: ['3', '15', '30', '45'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Большая на «6», маленькая на «5». Время:', options: ['5:30', '6:30', '5:06', '6:05'], correctIndex: 0 },
        { id: 'ch3', prompt: 'Сколько минут в полтора часа?', options: ['90', '60', '30', '120'], correctIndex: 0, explanation: '60 + 30 = 90.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Циферблат',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Циферблат',
      anatomy: [
        { id: 'a1', label: 'Часовая (короткая)', role: 'медленнее, показывает часы', accent: 'sky' },
        { id: 'a2', label: 'Минутная (длинная)', role: 'быстрая, показывает минуты', accent: 'amber' },
        { id: 'a3', label: '12 цифр', role: 'каждая = 5 минут', accent: 'green' }
      ],
      terms: [
        { term: 'Час', definition: '60 минут.', example: 'Урок 45 мин — меньше часа', speakText: 'Час — это шестьдесят минут' },
        { term: 'Минута', definition: 'Маленькая единица.', example: '60 минут = 1 час', speakText: 'Минута' },
        { term: 'Циферблат', definition: 'Круг с цифрами 1-12.', example: 'На вокзальных часах', speakText: 'Циферблат' }
      ],
      buildTask: {
        prompt: 'Большая стрелка на «6». Сколько минут? ___',
        template: '___',
        expected: ['30'],
        distractors: ['6', '60', '12', '15', '45']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Читаем время',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Шаги: маленькая → большая → запись «часы:минуты».',
      examples: [
        {
          id: 'ex1', problem: 'Маленькая на «3», большая на «6». Сколько времени?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Часы', explanation: 'Маленькая на «3» = 3 часа.', visual: { kind: 'board', boardLines: ['Часы: 3'] }, action: { kind: 'numeric', prompt: 'Сколько часов?', expected: 3 } },
            { index: 2, title: 'Минуты', explanation: 'Большая на «6» × 5 = 30 минут.', visual: { kind: 'board', boardLines: ['Минут: 6 × 5 = 30'] }, action: { kind: 'numeric', prompt: 'Минут?', expected: 30 } },
            { index: 3, title: 'Запись', explanation: '3:30.', action: { kind: 'choice', prompt: 'Запись:', options: ['3:30', '6:00', '3:06'], correctIndex: 0 } }
          ]
        },
        {
          id: 'ex2', problem: 'Маленькая на «8», большая на «12»', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Часы и минуты', explanation: 'Большая на 12 — ровно 8:00.', visual: { kind: 'board', boardLines: ['8:00'] }, action: { kind: 'numeric', prompt: 'Сколько часов?', expected: 8 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем циферблат',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини положение большой стрелки с минутами',
          left: [
            { id: 'L1', label: 'на 3' },
            { id: 'L2', label: 'на 6' },
            { id: 'L3', label: 'на 9' },
            { id: 'L4', label: 'на 12' }
          ],
          right: [
            { id: 'R1', label: '15 мин', pairId: 'L1' },
            { id: 'R2', label: '30 мин', pairId: 'L2' },
            { id: 'R3', label: '45 мин', pairId: 'L3' },
            { id: 'R4', label: '0 мин (ровно)', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'В 1 часе сколько минут?', correctAnswer: 60 },
        { kind: 'numeric', id: 't3', prompt: 'В 2 часах сколько минут?', correctAnswer: 120 },
        { kind: 'numeric', id: 't4', prompt: 'Большая на «4» = ? минут', correctAnswer: 20 },
        { kind: 'numeric', id: 't5', prompt: '90 минут = 1 час и ? мин', correctAnswer: 30 },
        { kind: 'numeric', id: 't6', prompt: 'От 12 до 5 (по большой) — сколько минут?', correctAnswer: 25 }
      ],
      socraticHints: {
        t3: ['Сколько минут в одном часе? Умножь на 2.'],
        t4: ['Каждая цифра — 5 минут. Цифра 4 — это сколько?'],
        t5: ['90 минут — это 1 час и сколько минут сверх?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Расписание поезда',
    icon: 'i-lucide-train-front', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'railway',
      setting: {
        title: 'Вокзал «Сарыарка»',
        roleplay: 'Помоги пассажирам определить время по часам на платформе.',
        characterName: 'Дежурный Олжас',
        mascotLine: 'Большая на 12 — «ровно».'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Пассажир', request: 'Сейчас 3:00. Сколько минут до 4:00?', correct: 60, wrongFeedback: '4:00 − 3:00 = 60 мин.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Турист', request: 'Сейчас 5:30. Через сколько минут 6:00?', correct: 30, wrongFeedback: 'Половина до часа = 30 мин.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Школьник', request: '1 час 30 минут = ? минут', correct: 90, wrongFeedback: '60+30=90.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Дежурный', request: '2 часа 15 минут = ? минут', correct: 135, wrongFeedback: '120+15=135.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Экспресс №007',
        request: 'ФИНАЛ: Поезд идёт 3 часа 25 минут. Сколько это минут?',
        correct: 205,
        wrongFeedback: '3 × 60 + 25 = 180 + 25 = 205.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где путаются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Часовых дел мастер', emoji: '⏰' },
      intro: 'Не путай стрелки и цифры.',
      traps: [
        { id: 'tr1', wrongStatement: '«Большая на 6 = 6 минут»', whyWrong: 'Большая стрелка считает по 5: «6» = 30 минут, не 6.', correctStatement: '«6» = 30 минут', rememberNote: 'Минут: цифра × 5.' },
        { id: 'tr2', wrongStatement: 'Считал по часовой минуты', whyWrong: 'Часовая показывает только часы. Минуты — большая.', correctStatement: 'Маленькая = часы, большая = минуты', rememberNote: 'Не путай стрелки.' },
        { id: 'tr3', wrongStatement: '«1 час = 100 минут»', whyWrong: '1 час = 60 минут.', correctStatement: '1 час = 60 мин', rememberNote: '60, не 100.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни циферблат',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату',
      voicePrompt: 'Расскажи как читать время по часам',
      coverPrompts: ['Какая стрелка показывает часы?', 'Сколько минут в одном часе?', 'Сколько минут, если большая на «6»?'],
      referenceAnswer: 'На циферблате две стрелки. Маленькая — часовая, она показывает часы. Большая — минутная, показывает минуты. Каждая цифра на циферблате — это 5 минут для большой стрелки. Если большая на «6», прошло 30 минут. В одном часе 60 минут.',
      requiredConcepts: ['стрелки', 'часы', 'минуты'],
      conceptKeywords: {
        стрелки: ['стрелк'],
        часы: ['час'],
        минуты: ['минут']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['стрелк', 'минут'] }
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
      shareCapsuleName: 'Часы и минуты · Вокзал',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '1 час = ? минут', correctAnswer: 60, conceptTag: 'преобр', cognitiveLevel: 'recall', explanation: '1 час = 60 минут.' },
        { id: 'm2', kind: 'numeric', prompt: 'Большая на «9» = ? минут', correctAnswer: 45, conceptTag: 'циферблат', cognitiveLevel: 'apply', explanation: '9 × 5 = 45.' },
        { id: 'm3', kind: 'numeric', prompt: '2 часа 20 минут = ? минут', correctAnswer: 140, conceptTag: 'преобр', cognitiveLevel: 'apply', explanation: '120+20 = 140.' },
        { id: 'm4', kind: 'choice', prompt: 'Какая стрелка больше?', options: ['Часовая', 'Минутная', 'Одинаковые'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: 'Сейчас 3:45. Сколько минут до 4:00?', correctAnswer: 15, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '60−45 = 15.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '3 часа = ? минут', correctAnswer: 180, conceptTag: 'преобр', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Большая на «5» = ? минут', correctAnswer: 25, conceptTag: 'циферблат', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '1 час 45 минут = ? минут', correctAnswer: 105, conceptTag: 'преобр', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Сейчас 7:15. Через сколько минут 8:00?', correctAnswer: 45, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '90 минут = 1 час и ? мин', correctAnswer: 30, conceptTag: 'преобр', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Единицы времени
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Лестница времени',
    subtitle: 'От минут до года',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Минуты, часы, сутки, недели, месяцы, годы — все они связаны.',
      body: 'Сегодня узнаешь, как переходить между ними и сравнивать.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '⏱️', accent: 'sky', caption: 'Минута → Час (×60)' },
        { emoji: '🌅', accent: 'amber', caption: 'Час → Сутки (×24)' },
        { emoji: '📅', accent: 'emerald', caption: 'Сутки → Год (×365)' }
      ],
      prompt: 'Сколько часов в одних сутках?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '12' },
        { id: 'b', emoji: '🥇', label: '24', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '60' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Сколько в чём?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '1 сутки = ? часов', options: ['12', '24', '60', '7'], correctIndex: 1, conceptTag: 'сутки', explanation: 'День + ночь = 24 часа.' },
        { id: 'd2', prompt: '1 неделя = ? дней', options: ['5', '7', '10', '30'], correctIndex: 1, conceptTag: 'неделя', explanation: 'Пн-Вс = 7 дней.' },
        { id: 'd3', prompt: '1 год = ? месяцев', options: ['10', '12', '52', '365'], correctIndex: 1, conceptTag: 'год', explanation: 'В году 12 месяцев.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Календарь',
    subtitle: 'Лестница единиц',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 1, max: 12, step: 1 },
      probes: [
        { id: 'p1', prompt: 'Сколько недель в одном месяце (примерно)?', options: ['1', '4', '12', '24'], correctIndex: 1, explanation: '~30 дней / 7 ≈ 4 недели.' },
        { id: 'p2', prompt: 'Сколько часов в двух сутках?', options: ['24', '48', '60', '72'], correctIndex: 1, explanation: '24 × 2 = 48.' }
      ],
      copy: { headline: 'Каждая единица времени — лестница вверх', body: 'мин → ч → сутки → нед → мес → год.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Единицы времени',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Лестница за 3 кадра',
          panels: [
            { emoji: '⏱️', accent: 'sky', caption: '60 мин = 1 час' },
            { emoji: '🌗', accent: 'amber', caption: '24 ч = 1 сутки' },
            { emoji: '📆', accent: 'emerald', caption: '7 дней = 1 неделя' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Запомни лестницу:** 1 ч = 60 мин, 1 сут = 24 ч, 1 нед = 7 дней, 1 мес ≈ 30 дней, 1 год = 12 месяцев = 365 дней.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1\\ \\text{сут} = 24\\ \\text{ч}, \\quad 1\\ \\text{нед} = 7\\ \\text{дн}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Как перевести единицы?',
          revealedKind: 'text',
          revealedContent: 'Из большой в меньшую — умножай. Из меньшей в большую — дели. Например: 3 ч = 3 × 60 = 180 мин.',
          revealedHint: 'Большое → малое = ×; малое → большое = ÷.'
        },
        { id: 'c5', kind: 'text', content: 'В неделе 7 дней: пн, вт, ср, чт, пт, сб, вс. В году 12 месяцев: январь, февраль, март, апрель, май, июнь, июль, август, сентябрь, октябрь, ноябрь, декабрь.' }
      ],
      checks: [
        { id: 'ch1', prompt: '2 сутки = ? часов', options: ['24', '48', '60', '120'], correctIndex: 1 },
        { id: 'ch2', prompt: '3 недели = ? дней', options: ['10', '21', '30', '37'], correctIndex: 1 },
        { id: 'ch3', prompt: '2 года = ? месяцев', options: ['12', '24', '14', '52'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Связи единиц',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Лестница времени',
      anatomy: [
        { id: 'a1', label: '60 мин = 1 ч', role: 'минуты в часе', accent: 'sky' },
        { id: 'a2', label: '24 ч = 1 сут', role: 'часы в сутках', accent: 'green' },
        { id: 'a3', label: '7 дн = 1 нед', role: 'дни в неделе', accent: 'amber' },
        { id: 'a4', label: '12 мес = 1 год', role: 'месяцы в году', accent: 'rose' }
      ],
      terms: [
        { term: 'Сутки', definition: 'Промежуток в 24 часа — день и ночь.', example: 'Пн → Пн = 7 суток', speakText: 'Сутки — это двадцать четыре часа' },
        { term: 'Год', definition: '12 месяцев = 365 дней.', example: 'Январь → декабрь = 1 год', speakText: 'Год — двенадцать месяцев' }
      ],
      buildTask: {
        prompt: '2 сутки = ___ часов',
        template: '___',
        expected: ['48'],
        distractors: ['24', '12', '60', '72', '120']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Переводим время',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: вспомни связь, умножь или поделись.',
      examples: [
        {
          id: 'ex1', problem: '3 сутки = ? часов', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Связь', explanation: '1 сутки = 24 часа.', visual: { kind: 'board', boardLines: ['1 сут = 24 ч'] }, action: { kind: 'numeric', prompt: '1 сутки = ? часов', expected: 24 } },
            { index: 2, title: 'Считаем', explanation: '3 × 24 = 72.', visual: { kind: 'board', boardLines: ['3 × 24 = 72'] }, action: { kind: 'numeric', prompt: 'Часов?', expected: 72 } }
          ]
        },
        {
          id: 'ex2', problem: '2 недели = ? дней', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '2 × 7 = 14.', action: { kind: 'numeric', prompt: 'Дней?', expected: 14 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем единицы',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини единицу с её значением',
          left: [
            { id: 'L1', label: '1 сутки' },
            { id: 'L2', label: '1 неделя' },
            { id: 'L3', label: '1 год' },
            { id: 'L4', label: '1 час' }
          ],
          right: [
            { id: 'R1', label: '24 часа', pairId: 'L1' },
            { id: 'R2', label: '7 дней', pairId: 'L2' },
            { id: 'R3', label: '12 месяцев', pairId: 'L3' },
            { id: 'R4', label: '60 минут', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '2 часа = ? минут', correctAnswer: 120 },
        { kind: 'numeric', id: 't3', prompt: '3 недели = ? дней', correctAnswer: 21 },
        { kind: 'numeric', id: 't4', prompt: '5 часов = ? минут', correctAnswer: 300 },
        { kind: 'numeric', id: 't5', prompt: '2 сутки = ? часов', correctAnswer: 48 },
        { kind: 'numeric', id: 't6', prompt: '4 недели = ? дней', correctAnswer: 28 }
      ],
      socraticHints: {
        t2: ['Сколько минут в одном часе? Умножь на 2.'],
        t3: ['Сколько дней в одной неделе? × 3.'],
        t4: ['5 × 60 = ?'],
        t5: ['24 + 24 = ?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Планируем поездку',
    icon: 'i-lucide-train-front', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'railway',
      setting: {
        title: 'Билетная касса',
        roleplay: 'Помоги пассажирам планировать поездки. Считай часы, дни, недели.',
        characterName: 'Кассир Жанара',
        mascotLine: 'Сначала вспомни связь, потом умножь!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Семья', request: 'Поездка 3 дня. Сколько часов в дороге максимум?', correct: 72, wrongFeedback: '3×24=72.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Турист', request: 'Каникулы 2 недели. Сколько дней?', correct: 14, wrongFeedback: '2×7=14.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Класс', request: 'Поход 5 часов. Сколько минут?', correct: 300, wrongFeedback: '5×60=300.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Семья', request: 'Командировка 28 дней. Сколько недель?', correct: 4, wrongFeedback: '28÷7=4.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Транссибирский экспресс',
        request: 'ФИНАЛ: Поездка 1 неделя 3 дня. Сколько всего дней?',
        correct: 10,
        wrongFeedback: '7 + 3 = 10 дней.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай единицы',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Хранитель времени', emoji: '📅' },
      intro: 'Связи времени запоминай как таблицу.',
      traps: [
        { id: 'tr1', wrongStatement: '«1 сутки = 12 часов»', whyWrong: 'Сутки — это полный день+ночь = 24 часа. 12 — это полсуток.', correctStatement: '1 сутки = 24 часа', rememberNote: 'Сутки = день+ночь.' },
        { id: 'tr2', wrongStatement: '«1 неделя = 5 дней»', whyWrong: '5 — рабочих, но в неделе **7** дней с выходными.', correctStatement: '1 неделя = 7 дней', rememberNote: '7, всегда 7.' },
        { id: 'tr3', wrongStatement: '«1 год = 100 дней»', whyWrong: 'В году 365 (или 366) дней. Не путай со 100.', correctStatement: '1 год = 365 дней = 12 месяцев', rememberNote: 'Год большой.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни единицы',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи единицы времени и связи',
      coverPrompts: ['Какие единицы времени ты знаешь?', 'Сколько часов в сутках?', 'Сколько дней в неделе и месяцев в году?'],
      referenceAnswer: 'Единицы времени по возрастанию: минута, час, сутки, неделя, месяц, год. 1 час = 60 минут, 1 сутки = 24 часа, 1 неделя = 7 дней, 1 месяц ≈ 30 дней, 1 год = 12 месяцев. Чтобы перевести единицы, нужно знать связь и умножить или разделить.',
      requiredConcepts: ['час', 'сутки', 'неделя'],
      conceptKeywords: {
        час: ['час'],
        сутки: ['сут'],
        неделя: ['недел']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['час', 'недел'] }
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
      shareCapsuleName: 'Единицы времени · Вокзал',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '3 сутки = ? часов', correctAnswer: 72, conceptTag: 'сутки', cognitiveLevel: 'apply', explanation: '3×24=72.' },
        { id: 'm2', kind: 'numeric', prompt: '2 недели = ? дней', correctAnswer: 14, conceptTag: 'неделя', cognitiveLevel: 'apply', explanation: '2×7=14.' },
        { id: 'm3', kind: 'numeric', prompt: '4 часа = ? минут', correctAnswer: 240, conceptTag: 'час', cognitiveLevel: 'apply', explanation: '4×60=240.' },
        { id: 'm4', kind: 'numeric', prompt: '1 год = ? месяцев', correctAnswer: 12, conceptTag: 'год', cognitiveLevel: 'recall', explanation: '12 месяцев.' },
        { id: 'm5', kind: 'numeric', prompt: 'Поход 5 дней. Сколько часов?', correctAnswer: 120, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '5×24=120.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '4 сутки = ? часов', correctAnswer: 96, conceptTag: 'сутки', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '5 недель = ? дней', correctAnswer: 35, conceptTag: 'неделя', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '3 часа = ? минут', correctAnswer: 180, conceptTag: 'час', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '2 года = ? месяцев', correctAnswer: 24, conceptTag: 'год', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '14 дней = ? недель', correctAnswer: 2, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Время и римская нумерация', layersInsertedByLesson: counter }
})
