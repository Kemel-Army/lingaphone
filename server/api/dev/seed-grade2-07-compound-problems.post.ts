import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Составные задачи».
 *   1. Что такое составная задача
 *   2. Решение составных задач в два действия
 *   3. Преобразование простой задачи в составную
 *
 * S6: тема №07, theme-pack = 'cafe' (продолжение задачного блока после темы 03).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (🪜/📋/🔄).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Составные задачи')
  const L1 = lessonIds['Что такое составная задача']
  const L2 = lessonIds['Решение составных задач в два действия']
  const L3 = lessonIds['Преобразование простой задачи в составную']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Составные задачи»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Что такое составная задача
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Один шаг или два?',
    subtitle: 'Промежуточный вопрос',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Иногда нельзя решить задачу одним действием. Нужны два!',
      body: 'Например: у А. 5, у Б. на 3 больше. Вместе? Сначала +3, потом сложение.',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '1️⃣', accent: 'sky', caption: 'Шаг 1: найди скрытое' },
        { emoji: '2️⃣', accent: 'amber', caption: 'Шаг 2: ответь на главный' },
        { emoji: '🎯', accent: 'emerald', caption: 'Готово!' }
      ],
      prompt: 'Сколько действий нужно для составной задачи?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '1' },
        { id: 'b', emoji: '🥇', label: '2', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '3' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к составным?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Простая задача — это:', options: ['В одно действие', 'В два действия', 'Без решения', 'Без чисел'], correctIndex: 0, conceptTag: 'простая', explanation: 'Одно действие.' },
        { id: 'd2', prompt: 'Сколько действий в составной?', options: ['1', '2 или больше', '0', '10'], correctIndex: 1, conceptTag: 'составная', explanation: 'Минимум 2.' },
        { id: 'd3', prompt: 'У А. 5, у Б. на 2 больше. Б = ?', options: ['Сложить', 'Вычесть', 'Сравнить', 'Не знаю'], correctIndex: 0, conceptTag: 'действие', explanation: '«На больше» = +.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Скрытый второй вопрос',
    subtitle: 'Между условием и главным',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 2, minCols: 3, maxCols: 8, defaultRows: 2, defaultCols: 5 },
      probes: [
        { id: 'p1', prompt: 'У А. 5, у Б. на 3 больше. Сначала найди Б. Какое действие?', options: ['+', '−', '×', '÷'], correctIndex: 0, explanation: '5+3=8.' },
        { id: 'p2', prompt: 'Теперь сколько вместе. Какое действие?', options: ['+', '−'], correctIndex: 0, explanation: '5+8=13.' }
      ],
      copy: { headline: 'В составной — скрытый промежуточный вопрос', body: 'Сначала отвечаем на него, потом на главный.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как устроена составная задача',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Анатомия за 3 кадра',
          panels: [
            { emoji: '📋', accent: 'sky', caption: 'Условие' },
            { emoji: '🔍', accent: 'amber', caption: 'Промежуточный вопрос' },
            { emoji: '🎯', accent: 'emerald', caption: 'Главный вопрос' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Составная задача** — это задача, которую нельзя решить одним действием. Минимум два.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Между условием и вопросом всегда есть **промежуточный вопрос** — то, что нужно найти первым.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Пример?',
          revealedKind: 'text',
          revealedContent: '«У А. 5 марок, у Б. на 3 больше. Сколько у них вместе?» Промежуточный: «Сколько у Б.?» Главный: «Сколько вместе?»',
          revealedHint: 'Два вопроса в одной задаче.'
        },
        { id: 'c5', kind: 'formula', content: '\\text{1) } 5 + 3 = 8 \\quad \\text{2) } 5 + 8 = 13' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Какая задача составная?', options: ['5 + 3', 'У А. 5, у Б. на 2 меньше. Вместе?', '10 − 4', 'Никакая'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Промежуточный вопрос — это:', options: ['Главный', 'Скрытый, отвечаем сначала', 'Не нужен', 'Любой'], correctIndex: 1 },
        { id: 'ch3', prompt: 'У М. 12, у П. на 4 меньше. У П.? Это:', options: ['Простая', 'Составная', 'Невозможно', 'Без ответа'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Структура составной задачи',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Анатомия составной задачи',
      anatomy: [
        { id: 'a1', label: 'Условие', role: 'что известно', accent: 'sky' },
        { id: 'a2', label: 'Промежуточный вопрос', role: 'находим первым', accent: 'amber' },
        { id: 'a3', label: 'Главный вопрос', role: 'что спрашивают', accent: 'rose' },
        { id: 'a4', label: '2 действия', role: 'два шага', accent: 'green' }
      ],
      terms: [
        { term: 'Составная задача', definition: 'Задача в два или больше действий.', example: 'У А. 5, у Б. на 3 больше. Вместе?', speakText: 'Составная — два действия' },
        { term: 'Промежуточный вопрос', definition: 'Скрытый вопрос между условием и главным.', example: '«Сколько у Б.?»', speakText: 'Промежуточный — между' }
      ],
      buildTask: {
        prompt: 'У А. 5, у Б. на 3 больше. Вместе ___',
        template: '___',
        expected: ['13'],
        distractors: ['8', '15', '2', '5', '53']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Разбираем составную',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: найди промежуточный вопрос → реши его → ответь на главный.',
      examples: [
        {
          id: 'ex1', problem: 'У Айгуль 7 наклеек, у А. на 4 больше. Сколько у них вместе?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Промежуточный', explanation: 'Сколько у А.? Не сказано прямо.', visual: { kind: 'board', boardLines: ['Айгуль = 7', 'Арман = ?', 'Вместе = ?'] }, action: { kind: 'choice', prompt: 'Что найти первым?', options: ['Сколько у А.', 'Сколько вместе'], correctIndex: 0 } },
            { index: 2, title: '1-е', explanation: '7+4=11 — у А.', action: { kind: 'numeric', prompt: '7+4?', expected: 11 } },
            { index: 3, title: '2-е', explanation: '7+11=18 — вместе.', action: { kind: 'numeric', prompt: '7+11?', expected: 18 } },
            { index: 4, title: 'Ответ', explanation: 'Вместе 18 наклеек.', action: { kind: 'numeric', prompt: 'Сколько?', expected: 18 } }
          ]
        },
        {
          id: 'ex2', problem: 'В библиотеке 25 книг. +12, −8. Осталось?', prefilledSteps: 1,
          steps: [
            { index: 1, title: '1-е', explanation: '25+12=37.', action: { kind: 'numeric', prompt: '25+12?', expected: 37 } },
            { index: 2, title: '2-е', explanation: '37−8=29.', action: { kind: 'numeric', prompt: '37−8?', expected: 29 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем составные',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: 'А=6, Б на 3>. Вместе?' },
            { id: 'L2', label: 'М=10, П на 4<. М+П?' },
            { id: 'L3', label: '30 яблок +8 −5' },
            { id: 'L4', label: '4 ручки + 6 карандашей − 3' }
          ],
          right: [
            { id: 'R1', label: '15', pairId: 'L1' },
            { id: 'R2', label: '16', pairId: 'L2' },
            { id: 'R3', label: '33', pairId: 'L3' },
            { id: 'R4', label: '7', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '12 м + 4 ещё девочек больше. Всего детей?', correctAnswer: 28 },
        { kind: 'numeric', id: 't3', prompt: 'У Д. 15, у С. на 5 меньше. Вместе?', correctAnswer: 25 },
        { kind: 'numeric', id: 't4', prompt: 'Было 50 +20 −35 = ?', correctAnswer: 35 },
        { kind: 'numeric', id: 't5', prompt: 'У А. 9 шаров, у Б. на 2 больше. У Б.+А.?', correctAnswer: 20 },
        { kind: 'numeric', id: 't6', prompt: '20 + 15 − 8 = ?', correctAnswer: 27 }
      ],
      socraticHints: {
        t2: ['Сколько девочек? +4 к мальчикам.'],
        t3: ['С=15−5=10. М+С=15+10.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'День рождения',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Подготовка к ДР',
        roleplay: 'Помоги маме: считай гостей, конфеты и подарки. Часто 2 действия.',
        characterName: 'Мама Алия',
        mascotLine: 'Сначала найди промежуточное число!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Гости', request: '8 одноклассников + в 2 раза меньше родителей. Всего?', correct: 12, wrongFeedback: '8÷2=4, 8+4=12.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Сладости', request: '30 конфет +12 −15. Осталось?', correct: 27, wrongFeedback: '42−15=27.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Подарки', request: 'А=6, Б на 3 больше. Вместе?', correct: 15, wrongFeedback: 'Б=9, 6+9=15.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Шары', request: '20 шаров −4 +7. Осталось?', correct: 23, wrongFeedback: '16+7=23.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой ДР',
        request: 'ФИНАЛ: 50 пирожных + 20 + 15 − 25 съели. Осталось?',
        correct: 60,
        wrongFeedback: '50+35=85, −25=60.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ловушки составных',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Двухшаговик', emoji: '🪜' },
      intro: 'Здесь чаще всего «срезаются».',
      traps: [
        { id: 'tr1', wrongStatement: '«А=5, Б на 3>. Вместе 8»', whyWrong: 'Дал ответ только на промежуточный (Б=8). А вопрос — про вместе.', correctStatement: 'Б=8, вместе 5+8=13', rememberNote: 'Дочитывай главный вопрос!' },
        { id: 'tr2', wrongStatement: 'Решил одним действием', whyWrong: 'Два числа + сравнение = два действия.', correctStatement: 'Найди промежуточное и потом главное', rememberNote: 'Два числа = два действия.' },
        { id: 'tr3', wrongStatement: 'Не записал план', whyWrong: 'План: 1) ... 2) ... — помогает не запутаться.', correctStatement: 'Записывай по шагам', rememberNote: 'План — твой друг.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи о составной',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи что такое составная задача',
      coverPrompts: ['Чем составная отличается от простой?', 'Что такое промежуточный вопрос?', 'Покажи пример.'],
      referenceAnswer: 'Составная задача решается не одним, а двумя или больше действиями. В ней есть промежуточный вопрос — то, что нужно узнать сначала. Например: «У А. 5 марок, у Б. на 3 больше. Сколько вместе?» Сначала находим, сколько у Б. (5+3=8), потом — сколько вместе (5+8=13).',
      requiredConcepts: ['составная', 'промежуточный', 'два действия'],
      conceptKeywords: {
        'составная': ['состав'],
        'промежуточный': ['промеж', 'скрыт'],
        'два действия': ['два', 'действ']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['состав', 'действ'] }
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
      shareCapsuleName: 'Что такое составная · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'А=7, Б на 2>. Вместе?', correctAnswer: 16, conceptTag: 'составная', cognitiveLevel: 'apply', explanation: 'Б=9, 7+9.' },
        { id: 'm2', kind: 'numeric', prompt: 'Было 20 +8 −5. Сколько?', correctAnswer: 23, conceptTag: 'составная', cognitiveLevel: 'apply', explanation: '28−5.' },
        { id: 'm3', kind: 'numeric', prompt: 'М=18, П на 6<. П+М?', correctAnswer: 30, conceptTag: 'составная', cognitiveLevel: 'apply', explanation: 'П=12, 12+18.' },
        { id: 'm4', kind: 'choice', prompt: 'Действий в составной?', options: ['1', '2+', '0', 'Любое'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: '4 яблока + 6 груш − 3 = ?', correctAnswer: 7, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'А=10, Б на 4>. Вместе?', correctAnswer: 24, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Было 35 +12 −8. Сколько?', correctAnswer: 39, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'М=25, П на 9<. М+П?', correctAnswer: 41, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '5 ручек + 7 карандашей − 4 = ?', correctAnswer: 8, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '12 м + (на 3 больше девочек). Всего?', correctAnswer: 27, conceptTag: 'составная', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Решение в два действия
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'План решения',
    subtitle: '1) ... 2) ...',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Сначала план — потом решение.',
      body: 'Составил план в два пункта — не запутаешься. Это секрет всех старшеклассников.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📝', accent: 'sky', caption: 'План: 1) ... 2) ...' },
        { emoji: '✏️', accent: 'amber', caption: 'Решение по шагам' },
        { emoji: '✅', accent: 'emerald', caption: 'Полный ответ предложением!' }
      ],
      prompt: 'Что важнее всего перед решением?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Скорость' },
        { id: 'b', emoji: '🥇', label: 'Записать план', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Угадать' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Проверим',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Действие первое в «5, +3, −2»?', options: ['Вычесть', 'Сложить', 'Любое', 'Не знаю'], correctIndex: 1, conceptTag: 'порядок', explanation: 'По тексту первое +.' },
        { id: 'd2', prompt: 'Зачем план?', options: ['Не запутаться', 'Никакой', 'Только в школе', 'Лишнее'], correctIndex: 0, conceptTag: 'план', explanation: 'План = страховка.' },
        { id: 'd3', prompt: '20 + 5 − 8 = ?', options: ['17', '23', '13', '7'], correctIndex: 0, conceptTag: 'арифметика', explanation: '25−8=17.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Шаги на числовой',
    subtitle: 'Маршрут по прямой',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 50, step: 1 },
      probes: [
        { id: 'p1', prompt: 'Старт 25. +10. Где?', options: ['35', '15', '25', '50'], correctIndex: 0 },
        { id: 'p2', prompt: 'Из 35 ещё −7. Где?', options: ['28', '42', '32', '24'], correctIndex: 0 }
      ],
      copy: { headline: 'Каждое действие — шаг по прямой', body: 'Так задача превращается в маршрут.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Алгоритм решения',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'План за 3 кадра',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: 'Промежуточное число' },
            { emoji: '2️⃣', accent: 'amber', caption: 'Главный вопрос' },
            { emoji: '✅', accent: 'emerald', caption: 'Ответ предложением' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**План:** 1) Найти промежуточное. 2) Использовать его для главного вопроса.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Краткая запись: пиши «1) ... 2) ...» — это твой план.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Можно ли одним выражением?',
          revealedKind: 'text',
          revealedContent: 'Да! 25 + 12 − 8 = 29. Без скобок — слева направо.',
          revealedHint: 'Одно выражение = два действия.'
        },
        { id: 'c5', kind: 'text', content: 'Слова-сигналы для каждого шага: «прибавили» = +, «съели» = −, «больше» = +.' }
      ],
      checks: [
        { id: 'ch1', prompt: '12 + 8 − 5 = ?', options: ['15', '25', '5', '20'], correctIndex: 0 },
        { id: 'ch2', prompt: 'Что в плане первое?', options: ['Главное', 'Промежуточное', 'Ответ', 'Любое'], correctIndex: 1 },
        { id: 'ch3', prompt: '«5 + 3, съели 4». Осталось?', options: ['4', '12', '5', '8'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись составной',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Запись решения',
      anatomy: [
        { id: 'a1', label: '1) промежуточное', role: 'первый шаг', accent: 'sky' },
        { id: 'a2', label: '2) главный', role: 'второй шаг', accent: 'amber' },
        { id: 'a3', label: 'Ответ:', role: 'предложение', accent: 'green' }
      ],
      terms: [
        { term: 'План решения', definition: 'Список шагов для решения.', example: '1) 5+3=8; 2) 5+8=13', speakText: 'План — последовательность шагов' }
      ],
      buildTask: {
        prompt: '25 + 12 − 8 = ___',
        template: '___',
        expected: ['29'],
        distractors: ['37', '21', '45', '13', '5']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем по плану',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Эталон: план + два действия + полный ответ.',
      examples: [
        {
          id: 'ex1', problem: '25 карандашей +12 −8. Сколько?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'План', explanation: '1) 25+12=? 2) ?−8=ответ.', visual: { kind: 'board', boardLines: ['1) 25+12=37', '2) 37−8=29'] }, action: { kind: 'choice', prompt: 'Сколько действий?', options: ['1', '2', '3'], correctIndex: 1 } },
            { index: 2, title: '1-е', explanation: '25+12=37.', action: { kind: 'numeric', prompt: '25+12?', expected: 37 } },
            { index: 3, title: '2-е', explanation: '37−8=29.', action: { kind: 'numeric', prompt: '37−8?', expected: 29 } }
          ]
        },
        {
          id: 'ex2', problem: 'У А. 9, у Б. на 5 больше. Вместе?', prefilledSteps: 1,
          steps: [
            { index: 1, title: '1-е', explanation: 'Б=9+5=14.', action: { kind: 'numeric', prompt: '9+5?', expected: 14 } },
            { index: 2, title: '2-е', explanation: 'Вместе=9+14=23.', action: { kind: 'numeric', prompt: 'Итого:', expected: 23 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем 2 действия',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с ответом',
          left: [
            { id: 'L1', label: '15 + 8 − 6' },
            { id: 'L2', label: 'А=12, Б на 7>. Вместе' },
            { id: 'L3', label: '40 +15 −20' },
            { id: 'L4', label: 'М=25, П на 8<. Сумма' }
          ],
          right: [
            { id: 'R1', label: '17', pairId: 'L1' },
            { id: 'R2', label: '31', pairId: 'L2' },
            { id: 'R3', label: '35', pairId: 'L3' },
            { id: 'R4', label: '42', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '6 + 4 + 5 = ?', correctAnswer: 15 },
        { kind: 'numeric', id: 't3', prompt: '50 − 12 − 8 = ?', correctAnswer: 30 },
        { kind: 'numeric', id: 't4', prompt: 'А=14, мама дала 6, подарил 4. Осталось?', correctAnswer: 16 },
        { kind: 'numeric', id: 't5', prompt: '20 + 30 − 15 = ?', correctAnswer: 35 },
        { kind: 'numeric', id: 't6', prompt: 'М=20, П на 6 больше. Вместе?', correctAnswer: 46 }
      ],
      socraticHints: {
        t3: ['50−12=38, −8=30.'],
        t4: ['14+6=20, −4=16.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Магазин с акцией',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе со скидками',
        roleplay: 'Цены меняются, скидки появляются. Нужно 2 действия.',
        characterName: 'Менеджер Дина',
        mascotLine: 'Сначала промежуточный шаг!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: 'Купил на 35 + 18, скидка 10. Чек?', correct: 43, wrongFeedback: '53−10=43.', revenueReward: 43, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: 'Мама 50 тг, папа на 20 больше. Сколько у обоих?', correct: 120, wrongFeedback: 'Папа=70, 50+70=120.', revenueReward: 120, reputationReward: 1 },
        { id: 'o3', customer: 'Касса', request: 'Было 100, +25 +15. В кассе?', correct: 140, wrongFeedback: '100+40=140.', revenueReward: 40, reputationReward: 1 },
        { id: 'o4', customer: 'Учёт', request: '80 коробок +25 −30. Сколько?', correct: 75, wrongFeedback: '105−30=75.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большая семья',
        request: 'ФИНАЛ: Мама 60 тг, папа на 30>, ребёнок на 25< папы. Все вместе?',
        correct: 215,
        wrongFeedback: 'П=90, Р=65, 60+90+65=215.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где сбиваются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'План-мастер', emoji: '📋' },
      intro: 'Спешка — главный враг.',
      traps: [
        { id: 'tr1', wrongStatement: 'Сразу сложил все числа в задаче', whyWrong: 'Не каждое действие — сложение. Читай слова-сигналы.', correctStatement: 'Каждое действие отдельно', rememberNote: 'Сигналы важны.' },
        { id: 'tr2', wrongStatement: 'Использовал не то промежуточное число', whyWrong: 'Если на 1-м шаге ошибка — всё дальше неверно.', correctStatement: 'Проверь промежуточное', rememberNote: 'Проверка спасает.' },
        { id: 'tr3', wrongStatement: 'Не дал полный ответ', whyWrong: 'Запиши предложение: «Осталось 35 яблок».', correctStatement: 'Полный ответ', rememberNote: 'Предложение, не цифра.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни план',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи зачем нужен план',
      coverPrompts: ['Зачем план перед решением?', 'Что в плане первое?', 'Что важно после решения?'],
      referenceAnswer: 'План — это два пронумерованных шага: сначала промежуточное число, потом главное. Например: 1) 25+12=37; 2) 37−8=29. План помогает не запутаться. После решения обязательно пишу полный ответ предложением.',
      requiredConcepts: ['план', 'шаги', 'ответ'],
      conceptKeywords: {
        план: ['план'],
        шаги: ['шаг'],
        ответ: ['ответ', 'предлож']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['план', 'шаг'] }
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
      shareCapsuleName: 'Решение в 2 действия · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '18 + 6 − 9 = ?', correctAnswer: 15, conceptTag: 'два-действия', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'А=14, Б на 5>. Вместе?', correctAnswer: 33, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'Было 60 −25 +13. Стало?', correctAnswer: 48, conceptTag: 'три-числа', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: 'М=30, П на 10<. Сумма?', correctAnswer: 50, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '5 ручек по 10 + тетрадь 12 = ?', correctAnswer: 62, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '25 + 8 − 14 = ?', correctAnswer: 19, conceptTag: 'два-действия', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'А=20, Б на 7>. Вместе?', correctAnswer: 47, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '70 −15 +8 = ?', correctAnswer: 63, conceptTag: 'три-числа', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '4 шоколадки по 15 + сок 25 = ?', correctAnswer: 85, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'М=45, П на 12<. Сумма?', correctAnswer: 78, conceptTag: 'составная', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Преобразование простой в составную
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Добавим один шаг',
    subtitle: 'Простая → составная',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Любую простую задачу можно «вырастить» — добавить условие.',
      body: 'Это полезно для тренировки: реальные задачи редко бывают простыми.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🌱', accent: 'sky', caption: 'Простая задача' },
        { emoji: '➕', accent: 'amber', caption: '+ доп. условие' },
        { emoji: '🌳', accent: 'emerald', caption: 'Составная!' }
      ],
      prompt: 'Что значит «преобразовать в составную»?',
      emojiChoices: [
        { id: 'a', emoji: '🤯', label: 'Удалить условие' },
        { id: 'b', emoji: '🥇', label: 'Добавить шаг', isPrimary: true },
        { id: 'c', emoji: '🤔', label: 'Изменить ответ' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь разницу?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Простая задача — это:', options: ['В одно действие', 'В два', 'В десять', 'Никакая'], correctIndex: 0, conceptTag: 'простая', explanation: 'Одно.' },
        { id: 'd2', prompt: 'Чтобы из простой сделать составную, надо:', options: ['Удалить условие', 'Добавить условие', 'Изменить ответ', 'Удалить вопрос'], correctIndex: 1, conceptTag: 'преобр', explanation: 'Добавить условие.' },
        { id: 'd3', prompt: 'У А. 5 марок. Это задача?', options: ['Да, простая', 'Да, составная', 'Нет, без вопроса', 'Нет'], correctIndex: 2, conceptTag: 'структура', explanation: 'Без вопроса нет задачи.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'От одного к двум',
    subtitle: 'Эволюция задачи',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 30, step: 1 },
      probes: [
        { id: 'p1', prompt: '«Было 10 +5». Сколько стало?', options: ['15', '5', '50', '10'], correctIndex: 0 },
        { id: 'p2', prompt: '«… потом съели 3». Сколько?', options: ['12', '15', '13', '8'], correctIndex: 0 }
      ],
      copy: { headline: 'Простая → +условие → составная', body: 'Один лишний шаг.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как добавить шаг',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Эволюция за 3 кадра',
          panels: [
            { emoji: '🌱', accent: 'sky', caption: 'Простая: 1 действие' },
            { emoji: '➕', accent: 'amber', caption: 'Добавь условие' },
            { emoji: '🌳', accent: 'emerald', caption: 'Стало 2 действия!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Чтобы преобразовать простую в составную, нужно добавить ещё одно условие.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Простая: «А=5, Б=3. Вместе?» (1 действие).' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Что добавить?',
          revealedKind: 'text',
          revealedContent: 'Любое: «потом подарил 2», «купил ещё 4», «у В. на 6 больше». Каждое условие = ещё одно действие.',
          revealedHint: 'Условие = действие.'
        },
        { id: 'c5', kind: 'text', content: 'Составная: «А=5, Б на 3 больше. Вместе?» (теперь надо найти Б).' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Какая составная?', options: ['5 + 3', 'Было 10, +5, −2. Сколько?', 'Сумма 4 и 6', 'Никакая'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Простую делают составной...', options: ['Только умножением', 'Добавив условие', 'Удалив вопрос', 'Никак'], correctIndex: 1 },
        { id: 'ch3', prompt: 'Действий после преобразования?', options: ['1', '2+', '0', 'Любое'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Преобразование',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Простая → Составная',
      anatomy: [
        { id: 'a1', label: 'Простая', role: 'одно действие', accent: 'sky' },
        { id: 'a2', label: '+ условие', role: 'добавляем', accent: 'amber' },
        { id: 'a3', label: 'Составная', role: 'два действия', accent: 'green' }
      ],
      terms: [
        { term: 'Преобразование', definition: 'Изменение условия так, чтобы тип задачи поменялся.', example: 'Добавили шаг — стала составной', speakText: 'Преобразование задачи' }
      ],
      buildTask: {
        prompt: 'Было 10, +5, −3. Стало ___',
        template: '___',
        expected: ['12'],
        distractors: ['18', '8', '15', '2', '20']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Преобразуем по шагам',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Берём простую, добавляем условие, решаем уже как составную.',
      examples: [
        {
          id: 'ex1', problem: 'Простая: «А=6, Б=4. Сколько?» Преобразуй.', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Добавим условие', explanation: '«У В. на 5 больше А.» Узнаем В.', visual: { kind: 'board', boardLines: ['А=6, Б=4, В=А+5'] }, action: { kind: 'choice', prompt: 'У В. больше или меньше?', options: ['Больше', 'Меньше'], correctIndex: 0 } },
            { index: 2, title: 'Промежуточное', explanation: 'В=6+5=11.', action: { kind: 'numeric', prompt: 'В=?', expected: 11 } },
            { index: 3, title: 'Главное', explanation: 'У всех 6+4+11=21.', action: { kind: 'numeric', prompt: 'Итого:', expected: 21 } }
          ]
        },
        {
          id: 'ex2', problem: '«12 печений, съели 5». Преобразуй.', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Добавим', explanation: '«… мама принесла 8». 12−5=7, 7+8=15.', action: { kind: 'numeric', prompt: 'Сколько?', expected: 15 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем преобразование',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с ответом',
          left: [
            { id: 'L1', label: '15 +6 −4' },
            { id: 'L2', label: 'А=8, Б на 3>, В=Б' },
            { id: 'L3', label: '20 яблок −5 −4' },
            { id: 'L4', label: 'М=12, П на 4<. Вместе' }
          ],
          right: [
            { id: 'R1', label: '17', pairId: 'L1' },
            { id: 'R2', label: '11', pairId: 'L2' },
            { id: 'R3', label: '11', pairId: 'L3' },
            { id: 'R4', label: '20', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '30 + 10 − 8 = ?', correctAnswer: 32 },
        { kind: 'numeric', id: 't3', prompt: '50 − 15 − 5 = ?', correctAnswer: 30 },
        { kind: 'numeric', id: 't4', prompt: 'Было 40 +12 −22. Стало?', correctAnswer: 30 },
        { kind: 'numeric', id: 't5', prompt: 'А=9, Б на 5>. Сумма?', correctAnswer: 23 },
        { kind: 'numeric', id: 't6', prompt: '60 − 20 + 5 = ?', correctAnswer: 45 }
      ],
      socraticHints: {
        t2: ['30+10=40, −8=32.'],
        t4: ['40+12=52, −22=30.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Кружок изобретателей',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе при кружке',
        roleplay: 'Каждое условие меняет задачу. Реши обновлённые версии.',
        characterName: 'Учитель Серик',
        mascotLine: 'Добавь шаг — стало интереснее!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Конструктор', request: '12 деталей +8 −5. Осталось?', correct: 15, wrongFeedback: '20−5=15.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Робототехника', request: 'А=10, Б на 6>. Вместе?', correct: 26, wrongFeedback: 'Б=16, 10+16=26.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Электроника', request: '25 батареек −12 +8. В коробке?', correct: 21, wrongFeedback: '13+8=21.', revenueReward: 40, reputationReward: 1 },
        { id: 'o4', customer: '3D-печать', request: '18 +5 −4 деталей. Хороших?', correct: 19, wrongFeedback: '23−4=19.', revenueReward: 60, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Конкурс',
        request: 'ФИНАЛ: 30 проектов +15 +12 −18. Допущено?',
        correct: 39,
        wrongFeedback: '57−18=39.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не забудь второй шаг',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Преобразователь', emoji: '🔄' },
      intro: 'Преобразовал — но забыл сделать второе действие.',
      traps: [
        { id: 'tr1', wrongStatement: 'Решил как простую — игнорировал условие', whyWrong: 'Условие не для красоты. Каждое условие — действие.', correctStatement: 'Каждое условие → действие', rememberNote: 'Не пропускай.' },
        { id: 'tr2', wrongStatement: 'Сделал слишком много действий', whyWrong: 'Иногда условие — описание, не действие.', correctStatement: 'Думай, что считать', rememberNote: 'Не спеши.' },
        { id: 'tr3', wrongStatement: 'Перепутал порядок действий', whyWrong: 'Читай слева направо. Какое событие раньше — то первым.', correctStatement: 'Порядок по тексту', rememberNote: 'Хронология.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни преобразование',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи как сделать составную из простой',
      coverPrompts: ['Что значит «преобразовать»?', 'Какое условие добавить?', 'Почему задача становится сложнее?'],
      referenceAnswer: 'Преобразовать простую задачу в составную — значит добавить ещё одно условие. Например, к задаче «А=5, Б=3. Вместе?» можно добавить «у В. на 6 больше А.». Теперь нужно сначала найти, сколько у В., а потом ответить на главный вопрос. Появляется промежуточный шаг — поэтому задача становится составной.',
      requiredConcepts: ['простая', 'составная', 'условие'],
      conceptKeywords: {
        простая: ['прост'],
        составная: ['состав'],
        условие: ['услов']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['прост', 'состав'] }
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
      shareCapsuleName: 'Преобразование задач · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Было 25 +10 −15. Стало?', correctAnswer: 20, conceptTag: 'три-числа', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'А=10, Б на 5>, В на 2< Б. У В?', correctAnswer: 13, conceptTag: 'цепочка', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'М=30 тг, П на 8<. Вместе?', correctAnswer: 52, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Простая отличается от составной:', options: ['Числами', 'Числом действий', 'Длиной', 'Картинкой'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'numeric', prompt: '8 ручек + 4 тетради − 3 = ?', correctAnswer: 9, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '40 +12 −15 = ?', correctAnswer: 37, conceptTag: 'три-числа', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'А=15, Б на 4>, В на 5< Б. У В?', correctAnswer: 14, conceptTag: 'цепочка', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'М=40, П на 7<. Сумма?', correctAnswer: 73, conceptTag: 'составная', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '6 ручек + 9 карандашей − 5 = ?', correctAnswer: 10, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Было 50 −8 +12. Стало?', correctAnswer: 54, conceptTag: 'три-числа', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Составные задачи', layersInsertedByLesson: counter }
})
