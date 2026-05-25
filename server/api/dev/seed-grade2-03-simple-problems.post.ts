import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Решение простых задач».
 *   1. Задачи на нахождение суммы и остатка
 *   2. Задачи на увеличение и уменьшение на несколько единиц
 *   3. Задачи на разностное сравнение
 *
 * S6: тема №03, theme-pack = 'cafe' (магазин/ярмарка/спортивные результаты).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (🔍/➕/➖).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Решение простых задач')
  const L1 = lessonIds['Задачи на нахождение суммы и остатка']
  const L2 = lessonIds['Задачи на увеличение и уменьшение на несколько единиц']
  const L3 = lessonIds['Задачи на разностное сравнение']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Решение простых задач»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Сумма и остаток
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Слова-сигналы',
    subtitle: '«Всего» и «осталось»',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '«Всего» — это +. «Осталось» — это −.',
      body: 'Если научиться видеть эти слова, задачи решаются сами.',
      mascotEntry: 'teach',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '➕', accent: 'sky', caption: '«Всего», «вместе» → +' },
        { emoji: '➖', accent: 'amber', caption: '«Осталось», «съели» → −' },
        { emoji: '🔍', accent: 'emerald', caption: 'Найди слово — найдёшь действие!' }
      ],
      prompt: 'Какое действие нужно для слова «осталось»?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Сложение' },
        { id: 'b', emoji: '🥇', label: 'Вычитание', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Не знаю' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Узнаёшь действие?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'У А. 5 яблок и 3 груши. Сколько ВСЕГО?', options: ['Сложить', 'Вычесть', 'Сравнить', 'Не знаю'], correctIndex: 0, conceptTag: 'сумма', explanation: '«Всего» = +.' },
        { id: 'd2', prompt: 'Было 10, съели 4. Сколько ОСТАЛОСЬ?', options: ['Сложить', 'Вычесть', 'Не знаю', 'Удвоить'], correctIndex: 1, conceptTag: 'остаток', explanation: '«Осталось» = −.' },
        { id: 'd3', prompt: '7 + 3 = ?', options: ['10', '4', '21', '7'], correctIndex: 0, conceptTag: 'арифметика', explanation: '7+3=10.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Картинка задачи',
    subtitle: 'Точки помогают увидеть',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'grouping', totalItems: 12, groupsRange: [2, 3] },
      probes: [
        { id: 'p1', prompt: 'Слева 5 точек, справа 3. Сколько всего?', options: ['8', '2', '15', '5'], correctIndex: 0, explanation: '5+3=8.' },
        { id: 'p2', prompt: 'Было 10 точек, убрали 4. Осталось?', options: ['6', '14', '4', '10'], correctIndex: 0, explanation: '10−4=6.' }
      ],
      copy: { headline: 'Складываем — больше. Вычитаем — меньше.', body: 'Картинка помогает увидеть.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Алгоритм решения задачи',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Алгоритм за 3 кадра',
          panels: [
            { emoji: '👀', accent: 'sky', caption: 'Прочитай задачу' },
            { emoji: '🔍', accent: 'amber', caption: 'Найди слово-сигнал' },
            { emoji: '✏️', accent: 'emerald', caption: 'Запиши и посчитай' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Шаги:** прочитать → понять, что известно → понять вопрос → выбрать действие → посчитать → ответ.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Слова-сигналы для **+**: всего, вместе, общее количество, прибавили, добавили.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А для вычитания?',
          revealedKind: 'text',
          revealedContent: 'Слова-сигналы для **−**: осталось, ушло, потратили, на сколько меньше, разница.',
          revealedHint: 'Запомни — пригодится во всех задачах.'
        },
        { id: 'c5', kind: 'formula', content: '\\text{Было: } 10. \\text{ Съели: } 4. \\text{ Осталось: } 10 - 4 = 6' }
      ],
      checks: [
        { id: 'ch1', prompt: '«У Армана 6 машинок и 4 кубика. Игрушек всего?»', options: ['10', '2', '24', '6'], correctIndex: 0 },
        { id: 'ch2', prompt: '«15 печений, съели 7. Осталось?»', options: ['22', '8', '7', '15'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Краткая запись',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Шаблон краткой записи',
      anatomy: [
        { id: 'a1', label: 'Было', role: 'известное число', accent: 'sky' },
        { id: 'a2', label: 'Стало / Съели', role: 'изменение', accent: 'amber' },
        { id: 'a3', label: 'Вопрос', role: 'что найти', accent: 'rose' },
        { id: 'a4', label: 'Решение', role: '+ или −', accent: 'green' },
        { id: 'a5', label: 'Ответ', role: 'предложение', accent: 'lime' }
      ],
      terms: [
        { term: 'Краткая запись', definition: 'Сжатая схема: что известно и что найти.', example: 'Было: 8, ушло: 3, осталось: ?', speakText: 'Краткая запись — схема задачи' },
        { term: 'Простая задача', definition: 'Задача в одно действие.', example: '5 + 3 — простая', speakText: 'Простая — одно действие' }
      ],
      buildTask: {
        prompt: 'Было 8, ушло 3. Осталось ___',
        template: '___',
        expected: ['5'],
        distractors: ['11', '83', '38', '3', '8']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем образцовую задачу',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Эталон решения с краткой записью.',
      examples: [
        {
          id: 'ex1', problem: 'У Айгуль 7 наклеек, ей подарили ещё 5. Сколько стало?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Краткая запись', explanation: 'Было: 7. Подарили: 5. Стало: ?', visual: { kind: 'board', boardLines: ['Было: 7', 'Подарили: 5', 'Стало: ?'] }, action: { kind: 'numeric', prompt: 'Сколько было?', expected: 7 } },
            { index: 2, title: 'Действие', explanation: '«Подарили» = +.', action: { kind: 'choice', prompt: 'Какое действие?', options: ['Сложение', 'Вычитание'], correctIndex: 0 } },
            { index: 3, title: 'Считаем', explanation: '7 + 5 = 12.', action: { kind: 'numeric', prompt: '7 + 5 = ?', expected: 12 } },
            { index: 4, title: 'Ответ', explanation: 'Стало 12 наклеек.', action: { kind: 'numeric', prompt: 'Сколько стало?', expected: 12 } }
          ]
        },
        {
          id: 'ex2', problem: 'Было 13 конфет, дети съели 5. Осталось?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Запись', explanation: 'Было: 13. Съели: 5. Осталось: ?', action: { kind: 'numeric', prompt: 'Было?', expected: 13 } },
            { index: 2, title: 'Считаем', explanation: '13 − 5 = 8.', action: { kind: 'numeric', prompt: '13 − 5 = ?', expected: 8 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируемся на задачах',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: '9 яблок + 6 груш' },
            { id: 'L2', label: '20 печений − 8 съели' },
            { id: 'L3', label: '12 м + 14 д' },
            { id: 'L4', label: '30 тг − 14' }
          ],
          right: [
            { id: 'R1', label: '15', pairId: 'L1' },
            { id: 'R2', label: '12', pairId: 'L2' },
            { id: 'R3', label: '26', pairId: 'L3' },
            { id: 'R4', label: '16', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '7+4 ребят. Всего?', correctAnswer: 11 },
        { kind: 'numeric', id: 't3', prompt: '16 тарелок, унесли 9. Осталось?', correctAnswer: 7 },
        { kind: 'numeric', id: 't4', prompt: '8 машинок + 5 у брата. Вместе?', correctAnswer: 13 },
        { kind: 'numeric', id: 't5', prompt: '25 цветов − 7 завяло. Осталось?', correctAnswer: 18 },
        { kind: 'numeric', id: 't6', prompt: '15 ручек + 9 карандашей. Всего?', correctAnswer: 24 }
      ],
      socraticHints: {
        t2: ['«Всего» = +.'],
        t3: ['«Унесли» = −.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Школьная ярмарка',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Ярмарка-кафе в школе',
        roleplay: 'Помоги продавцу. Считай покупки и сдачу.',
        characterName: 'Учительница Айман',
        mascotLine: 'Слово-сигнал — твой ключ к действию!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Мама', request: 'Купили на 18 и ещё на 12 тг. ВСЕГО?', correct: 30, wrongFeedback: '18+12=30.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Было 50, потратил 24. ОСТАЛОСЬ?', correct: 26, wrongFeedback: '50−24=26.', revenueReward: 24, reputationReward: 1 },
        { id: 'o3', customer: 'Семья', request: 'Торт 35 + сок 15. Сумма?', correct: 50, wrongFeedback: '35+15=50.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Ученик', request: 'Дал 40, чек 28. Сдача?', correct: 12, wrongFeedback: '40−28=12.', revenueReward: 28, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большая семья',
        request: 'ФИНАЛ: Купили 65 + 45 + 30 тг. Дали 200. Сдача?',
        correct: 60,
        wrongFeedback: 'Чек 140, сдача 200−140=60.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ловушки в задачах',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Сигнальщик', emoji: '🔍' },
      intro: 'Не торопись. Сначала пойми, что спрашивают.',
      traps: [
        { id: 'tr1', wrongStatement: '«Было 15, съели 5, стало 20»', whyWrong: '«Съели» = меньше. Нужно вычитать.', correctStatement: '15 − 5 = 10', rememberNote: '«Съели/потратили» = −.' },
        { id: 'tr2', wrongStatement: '«5 машинок и 3 кубика — у него 5 игрушек»', whyWrong: 'Не учёл кубики. «Всего» = всё вместе.', correctStatement: '5 + 3 = 8 игрушек', rememberNote: 'Считай ВСЁ.' },
        { id: 'tr3', wrongStatement: 'Записал просто «10»', whyWrong: 'Ответ — **предложение**: «У А. 10 наклеек».', correctStatement: 'Полный ответ предложением', rememberNote: 'Число + смысл = ответ.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни алгоритм',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату — он первоклассник',
      voicePrompt: 'Расскажи как решать простые задачи',
      coverPrompts: ['Какие шаги решения задачи?', 'Какое слово — сигнал к +?', 'А к −?'],
      referenceAnswer: 'Сначала читаю задачу, делаю краткую запись: что известно и что найти. Потом смотрю на слова-сигналы. «Всего», «вместе», «прибавили» — это сложение. «Осталось», «ушло», «съели» — вычитание. Считаю и пишу ответ предложением.',
      requiredConcepts: ['краткая запись', 'действие', 'ответ'],
      conceptKeywords: {
        'краткая запись': ['кратк', 'запис'],
        'действие': ['действ'],
        'ответ': ['ответ', 'предлож']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['слов', 'действ'] }
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
      shareCapsuleName: 'Сумма и остаток · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'У Алии 7 ручек + 5 карандашей. Всего?', correctAnswer: 12, conceptTag: 'сумма', cognitiveLevel: 'apply', explanation: '7+5.' },
        { id: 'm2', kind: 'numeric', prompt: 'Было 24, осталось 9. Съели?', correctAnswer: 15, conceptTag: 'остаток', cognitiveLevel: 'apply', explanation: '24−9.' },
        { id: 'm3', kind: 'numeric', prompt: 'В классе 13 м + 15 д. Сколько детей?', correctAnswer: 28, conceptTag: 'сумма', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: 'Было 40 тг, потратил 17. Осталось?', correctAnswer: 23, conceptTag: 'остаток', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'choice', prompt: 'Какое слово = +?', options: ['осталось', 'всего', 'разница', 'меньше'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '15 яблок + 8 груш = ?', correctAnswer: 23, conceptTag: 'сумма', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Было 50, ушло 23. Осталось?', correctAnswer: 27, conceptTag: 'остаток', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '18 м + 12 д = ?', correctAnswer: 30, conceptTag: 'сумма', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '70 тг − 35 потратили = ?', correctAnswer: 35, conceptTag: 'остаток', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: 'Какое слово = −?', options: ['всего', 'осталось', 'вместе', 'прибавили'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — На N больше/меньше
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'На сколько больше?',
    subtitle: '«На N» — это +/−',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '«Больше на», «меньше на» — это про разницу.',
      body: 'НЕ путай «больше НА» и «больше В». Сегодня — про «НА».',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '➕', accent: 'sky', caption: '«На N больше» = + N' },
        { emoji: '➖', accent: 'amber', caption: '«На N меньше» = − N' },
        { emoji: '🚫', accent: 'rose', caption: 'НЕ путать с «в N раз»!' }
      ],
      prompt: 'У Армана 5 машинок, у брата на 3 больше. У брата?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '8', isPrimary: true },
        { id: 'b', emoji: '🤯', label: '15' },
        { id: 'c', emoji: '🤔', label: '2' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Понимаешь «на»?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'У А. 7, у Б. на 4 больше. У Б.?', options: ['11', '3', '28', '4'], correctIndex: 0, conceptTag: 'больше-на', explanation: '7+4=11.' },
        { id: 'd2', prompt: 'У М. 20, у дочки на 5 меньше. У дочки?', options: ['25', '15', '5', '20'], correctIndex: 1, conceptTag: 'меньше-на', explanation: '20−5=15.' },
        { id: 'd3', prompt: '«На 3 больше» — это:', options: ['+ 3', '× 3', '− 3', '÷ 3'], correctIndex: 0, conceptTag: 'теория', explanation: '«На N» = +.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Полоски сравнения',
    subtitle: 'Разница на единицы',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 2, minCols: 3, maxCols: 10, defaultRows: 2, defaultCols: 5 },
      probes: [
        { id: 'p1', prompt: 'Верх: 5, низ на 2 длиннее. Низ?', options: ['7', '3', '10', '2'], correctIndex: 0, explanation: '5+2=7.' },
        { id: 'p2', prompt: 'Верх: 8, низ на 3 короче. Низ?', options: ['11', '5', '8', '3'], correctIndex: 1, explanation: '8−3=5.' }
      ],
      copy: { headline: 'Больше на — длиннее. Меньше на — короче.', body: 'Полоска делает разницу зрительной.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правило «на ...»',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Два правила',
          panels: [
            { emoji: '➕', accent: 'sky', caption: '«На N больше» = + N' },
            { emoji: '➖', accent: 'amber', caption: '«На N меньше» = − N' },
            { emoji: '🎯', accent: 'emerald', caption: 'Запомни навсегда!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**«На N больше» = + N.** **«На N меньше» = − N.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a \\text{ на } N \\text{ больше} \\Rightarrow a + N' },
        { id: 'c4', kind: 'formula', content: 'a \\text{ на } N \\text{ меньше} \\Rightarrow a - N' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Кто базовый — у кого число дано?',
          revealedKind: 'text',
          revealedContent: 'Внимательно! Если задача говорит «у Дины на 4 меньше, чем у А. (12)», то у Дины 12−4=8. У кого ИЗВЕСТНО — тот база.',
          revealedHint: 'База — у кого число дано.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'У Б. 9, у А. на 5 больше. У А.?', options: ['14', '4', '45', '9'], correctIndex: 0 },
        { id: 'ch2', prompt: '17 яблок, в сумке на 8 меньше. Сумка?', options: ['25', '9', '17', '8'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Слова-сигналы',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Сигналы для «больше/меньше на»',
      anatomy: [
        { id: 'a1', label: 'на N больше', role: '+ N', accent: 'green' },
        { id: 'a2', label: 'на N меньше', role: '− N', accent: 'rose' },
        { id: 'a3', label: 'столько же', role: '=', accent: 'sky' }
      ],
      terms: [
        { term: 'Увеличение на N', definition: 'Добавить N.', example: '5 на 3 больше = 8', speakText: 'Увеличение — прибавить' },
        { term: 'Уменьшение на N', definition: 'Вычесть N.', example: '10 на 4 меньше = 6', speakText: 'Уменьшение — вычесть' }
      ],
      buildTask: {
        prompt: 'У А. 7, у Б. на 4 больше. У Б. = ___',
        template: '___',
        expected: ['11'],
        distractors: ['3', '28', '4', '7', '74']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем по образцу',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Главное — не запутаться, у кого больше.',
      examples: [
        {
          id: 'ex1', problem: 'У А. 14, у Дины на 6 меньше. У Дины?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Кто базовый?', explanation: 'А. — 14. Сравниваем с ней.', visual: { kind: 'board', boardLines: ['А = 14', 'Д = 14 − 6 = ?'] }, action: { kind: 'numeric', prompt: 'У А?', expected: 14 } },
            { index: 2, title: 'Действие', explanation: '«На 6 меньше» = − 6.', action: { kind: 'choice', prompt: '+ или −?', options: ['+ 6', '− 6'], correctIndex: 1 } },
            { index: 3, title: 'Считаем', explanation: '14 − 6 = 8.', action: { kind: 'numeric', prompt: '14 − 6 = ?', expected: 8 } }
          ]
        },
        {
          id: 'ex2', problem: 'У А. 23 года. Папа на 17 старше. Сколько папе?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'База — Арман', explanation: '23 + 17 = 40.', action: { kind: 'numeric', prompt: '23 + 17 = ?', expected: 40 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем «на ...»',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: '6 + (на 4 больше)' },
            { id: 'L2', label: '15 − (на 6 меньше)' },
            { id: 'L3', label: '8 + (на 5 больше)' },
            { id: 'L4', label: '20 − (на 7 меньше)' }
          ],
          right: [
            { id: 'R1', label: '10', pairId: 'L1' },
            { id: 'R2', label: '9', pairId: 'L2' },
            { id: 'R3', label: '13', pairId: 'L3' },
            { id: 'R4', label: '13', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '24 + 9 = ?', correctAnswer: 33 },
        { kind: 'numeric', id: 't3', prompt: '36 − 8 = ?', correctAnswer: 28 },
        { kind: 'numeric', id: 't4', prompt: 'У Д. 17, у сестры на 4 больше. Сестра?', correctAnswer: 21 },
        { kind: 'numeric', id: 't5', prompt: '50 цветов, на 18 меньше = ?', correctAnswer: 32 },
        { kind: 'numeric', id: 't6', prompt: 'У М. 25 тг, у П. на 8 больше. У П.?', correctAnswer: 33 }
      ],
      socraticHints: {
        t4: ['Сестра больше или меньше? + или −?'],
        t5: ['«На 18 меньше» = −.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Сравнение в магазине',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе с акциями',
        roleplay: 'Цены часто «на N больше» или «на N меньше». Помоги!',
        characterName: 'Менеджер Мадина',
        mascotLine: '«На» — это «плюс» или «минус», но не «умножить»!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: 'Сок 18, лимонад на 5 больше. Сколько лимонад?', correct: 23, wrongFeedback: '18+5=23.', revenueReward: 23, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Кофе 25, чай на 17 меньше. Сколько чай?', correct: 8, wrongFeedback: '25−17=8.', revenueReward: 8, reputationReward: 1 },
        { id: 'o3', customer: 'Мама', request: 'Торт 50, пирог на 12 дешевле. Пирог?', correct: 38, wrongFeedback: '50−12=38.', revenueReward: 38, reputationReward: 1 },
        { id: 'o4', customer: 'Гость', request: 'Салат 45, стейк на 30 дороже. Стейк?', correct: 75, wrongFeedback: '45+30=75.', revenueReward: 75, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'VIP',
        request: 'ФИНАЛ: Завтрак 60, обед на 25 дороже, ужин на 15 дешевле обеда. Ужин?',
        correct: 70,
        wrongFeedback: 'Обед 60+25=85, ужин 85−15=70.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай «больше В» и «больше НА»',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'НА-эксперт', emoji: '➕' },
      intro: 'Это самая частая ошибка во всём 2 классе.',
      traps: [
        { id: 'tr1', wrongStatement: '«На 3 больше» = умножить на 3', whyWrong: '«На N» = **сложить**. «В N раз» — умножить.', correctStatement: '5 на 3 больше = 5 + 3 = 8', rememberNote: 'НА = +. В = ×.' },
        { id: 'tr2', wrongStatement: '«У А. 10, у Б. на 4 меньше — у Б. 14»', whyWrong: '«Меньше» = вычитать. 10−4=6.', correctStatement: 'У Б. 6', rememberNote: 'Меньше = −.' },
        { id: 'tr3', wrongStatement: 'Не понял, кто базовый', whyWrong: 'Если число одного дано — это база. Сравнение от него.', correctStatement: 'Внимательно читай', rememberNote: 'База — у кого известно.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни «на»',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи «на больше» и «на меньше»',
      coverPrompts: ['Что значит «на 5 больше»?', 'А «на 5 меньше»?', 'Чем «на» отличается от «в»?'],
      referenceAnswer: '«На N больше» означает добавить N. «На N меньше» означает вычесть N. Например, «у А. 7, у брата на 3 больше» — у брата 7 + 3 = 10. «На» — это всегда плюс или минус, а не умножение, в отличие от «в N раз».',
      requiredConcepts: ['больше', 'меньше', 'единиц'],
      conceptKeywords: {
        больше: ['больш', 'плюс'],
        меньше: ['меньш', 'минус'],
        единиц: ['единиц', 'на']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['больш', 'меньш'] }
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
      shareCapsuleName: 'На N больше/меньше · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'У А. 12, у Б. на 5 больше. У Б.?', correctAnswer: 17, conceptTag: 'больше-на', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'У М. 30, у П. на 12 меньше. У П.?', correctAnswer: 18, conceptTag: 'меньше-на', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: '«На 5 больше» — какой знак?', options: ['+', '−', '×', '÷'], correctIndex: 0, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm4', kind: 'numeric', prompt: 'А. 9, брат на 3 младше. Брату?', correctAnswer: 6, conceptTag: 'меньше-на', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: '22 ученика, в соседнем на 4 больше. Соседний?', correctAnswer: 26, conceptTag: 'больше-на', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'У А. 8, у Б. на 7 больше. У Б.?', correctAnswer: 15, conceptTag: 'больше-на', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'У М. 50, у П. на 18 меньше. У П.?', correctAnswer: 32, conceptTag: 'меньше-на', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: '«На 4 меньше» — какой знак?', options: ['+', '−', '×', '÷'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'p4', kind: 'numeric', prompt: 'А. 14, сестра на 5 старше. Сколько сестре?', correctAnswer: 19, conceptTag: 'больше-на', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '36 яблок, груш на 9 меньше. Груш?', correctAnswer: 27, conceptTag: 'меньше-на', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Разностное сравнение
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'На сколько больше?',
    subtitle: 'Разница = вычитание',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Когда вопрос «На сколько больше?» — это всегда вычитание.',
      body: 'Из бо́льшего числа вычитаем меньшее, и получаем разницу.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🐹', accent: 'sky', caption: 'У А. 12 яблок' },
        { emoji: '🐰', accent: 'amber', caption: 'У Б. 8 яблок' },
        { emoji: '➖', accent: 'emerald', caption: 'Разница = 12 − 8 = 4!' }
      ],
      prompt: 'У А. 12, у Б. 8. На сколько больше у А.?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '4', isPrimary: true },
        { id: 'b', emoji: '🤯', label: '20' },
        { id: 'c', emoji: '🤔', label: '12' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что такое разница?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '15 и 9. На сколько 15 больше?', options: ['6', '24', '15', '9'], correctIndex: 0, conceptTag: 'разность', explanation: '15−9=6.' },
        { id: 'd2', prompt: 'На сколько 7 меньше 20?', options: ['13', '27', '20', '7'], correctIndex: 0, conceptTag: 'разность', explanation: '20−7=13.' },
        { id: 'd3', prompt: 'Разница — это:', options: ['Сложить', 'Большее − меньшее', 'Умножить', 'Сравнить'], correctIndex: 1, conceptTag: 'правило', explanation: 'Большее минус меньшее.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Разница на полосках',
    subtitle: 'Хвостик длинной полоски',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 2, minCols: 3, maxCols: 12, defaultRows: 2, defaultCols: 8 },
      probes: [
        { id: 'p1', prompt: 'А — 8, Б — 5. На сколько А длиннее?', options: ['3', '13', '5', '8'], correctIndex: 0, explanation: '8−5=3.' },
        { id: 'p2', prompt: 'А=10, Б=10. На сколько А длиннее?', options: ['0', '20', '10', '5'], correctIndex: 0, explanation: 'Они равны — 0.' }
      ],
      copy: { headline: 'Разница — «торчащий» хвостик', body: 'Большее − меньшее = разница.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правило разностного сравнения',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Разница за 3 кадра',
          panels: [
            { emoji: '🔍', accent: 'sky', caption: '1. Найди большее' },
            { emoji: '🔍', accent: 'amber', caption: '2. Найди меньшее' },
            { emoji: '➖', accent: 'emerald', caption: '3. Большее − меньшее' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Чтобы узнать, на сколько одно число больше или меньше другого, нужно из бо́льшего вычесть меньшее.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a - b = \\text{разность}, \\quad a > b' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А «на сколько меньше» — другое действие?',
          revealedKind: 'text',
          revealedContent: 'Нет! Вопросы «на сколько больше» и «на сколько меньше» — отвечаются ОДНИМ действием — вычитанием большего из меньшего.',
          revealedHint: 'И «больше» и «меньше» — одна разница.'
        },
        { id: 'c5', kind: 'text', content: 'Например: 15 и 9. Разница: 15 − 9 = 6. И «на 6 больше», и «на 6 меньше» — одна цифра.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'У А. 18, у Б. 11. На сколько у А. больше?', options: ['7', '29', '11', '18'], correctIndex: 0 },
        { id: 'ch2', prompt: 'На сколько 30 меньше 50?', options: ['80', '20', '30', '50'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Сравнение чисел',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Разница 15 и 9',
      anatomy: [
        { id: 'a1', label: '15', role: 'большее', accent: 'green' },
        { id: 'a2', label: '9', role: 'меньшее', accent: 'rose' },
        { id: 'a3', label: '15 − 9 = 6', role: 'разность', accent: 'sky' }
      ],
      terms: [
        { term: 'Разность', definition: 'Результат вычитания.', example: '15−9=6 — разность', speakText: 'Разность — результат вычитания' },
        { term: 'Разностное сравнение', definition: 'Поиск разницы между числами.', example: 'На сколько 20 больше 13?', speakText: 'Разностное сравнение' }
      ],
      buildTask: {
        prompt: 'На сколько 15 больше 9? ___',
        template: '___',
        expected: ['6'],
        distractors: ['24', '15', '9', '5', '7']
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
      intro: 'Алгоритм: найди большее, найди меньшее, вычти.',
      examples: [
        {
          id: 'ex1', problem: 'У Дины 24 марки, у А. 16. На сколько у Дины больше?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Большее', explanation: '24 > 16. Большее — 24.', visual: { kind: 'board', boardLines: ['24 − 16 = ?'] }, action: { kind: 'numeric', prompt: 'Большее?', expected: 24 } },
            { index: 2, title: 'Вычти', explanation: '24 − 16 = 8.', action: { kind: 'numeric', prompt: '24 − 16 = ?', expected: 8 } },
            { index: 3, title: 'Ответ', explanation: 'У Дины на 8 марок больше.', action: { kind: 'numeric', prompt: 'На сколько?', expected: 8 } }
          ]
        },
        {
          id: 'ex2', problem: 'У А. 35, у Б. 50. На сколько у А. меньше?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Большее — 50', explanation: '50−35=15.', action: { kind: 'numeric', prompt: '50 − 35?', expected: 15 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем сравнение',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с разницей',
          left: [
            { id: 'L1', label: '17 и 9' },
            { id: 'L2', label: '25 и 14' },
            { id: 'L3', label: '7 и 30' },
            { id: 'L4', label: '50 и 26' }
          ],
          right: [
            { id: 'R1', label: '8', pairId: 'L1' },
            { id: 'R2', label: '11', pairId: 'L2' },
            { id: 'R3', label: '23', pairId: 'L3' },
            { id: 'R4', label: '24', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'На сколько 100 больше 65?', correctAnswer: 35 },
        { kind: 'numeric', id: 't3', prompt: 'А = 18, Б = 9. Разница?', correctAnswer: 9 },
        { kind: 'numeric', id: 't4', prompt: 'На сколько 40 больше 40?', correctAnswer: 0 },
        { kind: 'numeric', id: 't5', prompt: 'Разница 99 и 50?', correctAnswer: 49 },
        { kind: 'numeric', id: 't6', prompt: 'На сколько 70 больше 38?', correctAnswer: 32 }
      ],
      socraticHints: {
        t4: ['Числа равны → разница 0.'],
        t5: ['99−50.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Спортивный зал',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Школьные соревнования',
        roleplay: 'Помоги тренеру сравнивать результаты учеников.',
        characterName: 'Тренер Серик',
        mascotLine: 'Из бо́льшего вычти меньшее — найдёшь разницу!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Тренер', request: 'А. 18 отжиманий, Д. 12. На сколько А. больше?', correct: 6, wrongFeedback: '18−12=6.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Тренер', request: 'А. 25 приседаний, Б. 14. На сколько Б. меньше?', correct: 11, wrongFeedback: '25−14=11.', revenueReward: 25, reputationReward: 1 },
        { id: 'o3', customer: 'Финал', request: 'Лучший: 50 баллов, средний: 32. Разница?', correct: 18, wrongFeedback: '50−32=18.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Тренер', request: 'Динара 100м за 20с, Алия за 17с. На сколько Алия быстрее?', correct: 3, wrongFeedback: '20−17=3.', revenueReward: 40, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Чемпион',
        request: 'ФИНАЛ: Рекорд 95 баллов, мой 67. Разница?',
        correct: 28,
        wrongFeedback: '95−67=28.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ловушки сравнения',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Разностник', emoji: '➖' },
      intro: 'Не сложить вместо вычесть!',
      traps: [
        { id: 'tr1', wrongStatement: '«На сколько больше — это сложить»', whyWrong: 'Нет. Это вычитание: бо́льшее − меньшее.', correctStatement: 'Разница — всегда вычитание', rememberNote: 'На сколько = −.' },
        { id: 'tr2', wrongStatement: '«25 − 14 = 21»', whyWrong: 'Считал по разрядам неверно. 25−14: 20−10=10, 5−4=1, итого 11.', correctStatement: '25 − 14 = 11', rememberNote: 'Раздельно по разрядам.' },
        { id: 'tr3', wrongStatement: 'Вычел из меньшего бо́льшее', whyWrong: 'Большое всегда сверху.', correctStatement: 'Большее − меньшее', rememberNote: 'Большое сверху.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни разницу',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи как найти разницу',
      coverPrompts: ['Какое действие отвечает на «на сколько больше»?', 'Чем разностное отличается от увеличения «на N»?', 'Покажи пример.'],
      referenceAnswer: 'Разностное сравнение — это поиск разницы между двумя числами. Чтобы узнать, на сколько одно число больше другого, надо из бо́льшего вычесть меньшее. Например, у А. 18, у Б. 11 — разница 18 − 11 = 7. Это вычитание, а не сложение.',
      requiredConcepts: ['разница', 'больше', 'вычитание'],
      conceptKeywords: {
        разница: ['разн'],
        больше: ['больш'],
        вычитание: ['вычит', 'минус']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['разн', 'больш'] }
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
      shareCapsuleName: 'Разностное сравнение · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'На сколько 23 больше 14?', correctAnswer: 9, conceptTag: 'разность', cognitiveLevel: 'apply', explanation: '23−14.' },
        { id: 'm2', kind: 'numeric', prompt: 'Разница 50 и 35?', correctAnswer: 15, conceptTag: 'разность', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'На сколько 12 меньше 40?', correctAnswer: 28, conceptTag: 'разность', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: '«На сколько больше» — это:', options: ['+', '−', '×', '÷'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'numeric', prompt: 'У А. 32, у Б. 17 тг. Разница?', correctAnswer: 15, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'На сколько 45 больше 28?', correctAnswer: 17, conceptTag: 'разность', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Разница 80 и 53?', correctAnswer: 27, conceptTag: 'разность', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'На сколько 19 меньше 56?', correctAnswer: 37, conceptTag: 'разность', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'А=63, Б=37. Разница?', correctAnswer: 26, conceptTag: 'разность', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Лучший 100 м/с, мой 78. Разница?', correctAnswer: 22, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Решение простых задач', layersInsertedByLesson: counter }
})
