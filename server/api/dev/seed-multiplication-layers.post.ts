import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * POST /api/dev/seed-multiplication-layers
 *
 * Authors all 11 capsule layers for every lesson inside topic
 * "Смысл умножения" (grade 2):
 *   1. Что такое умножение
 *   2. Переместительный закон умножения
 *   3. Умножение на 1 и на 0
 *   4. Первые задачи на умножение
 *
 * Re-running this endpoint wipes the CapsuleLayer rows for these four
 * lessons and re-inserts them — idempotent.
 */
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Not allowed in production' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // ──────────────────────────────────────────────────────────────
  // Locate the four lessons inside "Смысл умножения" (grade 2)
  // ──────────────────────────────────────────────────────────────
  const { data: subjectRow } = await supabase
    .from('Subject')
    .select('id')
    .eq('grade', 2)
    .single()
  if (!subjectRow) throw createError({ statusCode: 500, message: 'Grade 2 subject missing' })

  const { data: topicRow } = await supabase
    .from('PathTopic')
    .select('id')
    .eq('subjectId', (subjectRow as { id: string }).id)
    .eq('name', 'Смысл умножения')
    .single()
  if (!topicRow) throw createError({ statusCode: 500, message: 'Topic "Смысл умножения" missing' })

  const { data: lessonRows } = await supabase
    .from('PathLesson')
    .select('id, title, orderIndex')
    .eq('pathTopicId', (topicRow as { id: string }).id)
    .order('orderIndex')
  if (!lessonRows?.length) throw createError({ statusCode: 500, message: 'Lessons missing' })

  const byTitle = new Map<string, string>()
  for (const l of lessonRows as { id: string, title: string }[]) byTitle.set(l.title, l.id)

  const lessonIds = {
    main: byTitle.get('Что такое умножение'),
    commutative: byTitle.get('Переместительный закон умножения'),
    zeroOne: byTitle.get('Умножение на 1 и на 0'),
    firstProblems: byTitle.get('Первые задачи на умножение')
  }

  if (!lessonIds.main || !lessonIds.commutative || !lessonIds.zeroOne || !lessonIds.firstProblems) {
    throw createError({ statusCode: 500, message: 'Some sibling lessons missing' })
  }

  const allLessonIds = Object.values(lessonIds) as string[]

  // Wipe only the layer types we are about to insert (keeps other authored layers).
  await supabase
    .from('CapsuleLayer')
    .delete()
    .in('lessonId', allLessonIds)
    .in('layerType', [
      'HOOK', 'DIAGNOSTIC', 'INTUITION', 'EXPLANATION', 'FORMALIZATION', 'WALKTHROUGH',
      'TRAINER', 'SCENARIO', 'TRAPS', 'TEACH_BACK', 'MASTERY_CHECK'
    ])

  const insertedByLesson: Record<string, number> = {}
  const insertLayer = async (row: Record<string, unknown>) => {
    const { error } = await supabase.from('CapsuleLayer').insert(row as never)
    if (error) throw createError({ statusCode: 500, message: `Layer insert: ${error.message}` })
    const lid = row.lessonId as string
    insertedByLesson[lid] = (insertedByLesson[lid] ?? 0) + 1
  }

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Что такое умножение (full 11 layers)
  // ═════════════════════════════════════════════════════════════════════
  const MAIN = lessonIds.main

  await insertLayer({
    lessonId: MAIN,
    layerType: 'HOOK',
    orderIndex: 1,
    title: 'Быстрый счёт',
    subtitle: 'Есть способ считать одинаковые группы за секунду',
    icon: 'i-lucide-sparkles',
    accentColor: 'amber',
    estimatedMinutes: 1,
    xpReward: 10,
    content: {
      kind: 'HOOK',
      mediaKind: 'animation',
      headline: 'У тебя 5 коробок, в каждой по 6 конфет. Сколько всего?',
      body: 'Можно считать 6+6+6+6+6 и устать. А можно одним действием — умножением.',
      mascotEntry: 'greet',
      bgPattern: 'confetti',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📦', accent: 'amber', caption: 'У тебя 5 коробок' },
        { emoji: '🍬', accent: 'rose', caption: 'В каждой по 6 конфет' },
        { emoji: '⚡', accent: 'emerald', caption: '5 раз по 6 = умножение!' }
      ],
      prompt: 'Готов узнать короткий способ?',
      emojiChoices: [
        { id: 'go', emoji: '🚀', label: 'Да, хочу попробовать!', isPrimary: true },
        { id: 'later', emoji: '🤔', label: 'Сначала разберусь в сложении' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: MAIN,
    layerType: 'DIAGNOSTIC',
    orderIndex: 2,
    title: 'Короткая проверка',
    subtitle: 'Эти вопросы помогут подобрать следующие шаги',
    icon: 'i-lucide-stethoscope',
    accentColor: 'sky',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        {
          id: 'q1',
          prompt: 'В корзине 3 яблока. Ты положил ещё 3. Сколько стало?',
          options: ['5', '6', '9'],
          correctIndex: 1,
          explanation: '3 + 3 = 6. Это обычное сложение.',
          conceptTag: 'addition'
        },
        {
          id: 'q2',
          prompt: 'Сколько всего лап у 4 кошек, если у каждой по 4 лапы?',
          options: ['8', '12', '16'],
          correctIndex: 2,
          explanation: '4 + 4 + 4 + 4 = 16. Это ровно то, что делает умножение: 4 × 4 = 16.',
          conceptTag: 'groups'
        },
        {
          id: 'q3',
          prompt: 'Как понимается запись «3 × 4»?',
          options: ['Сложить 3 и 4', 'Взять число 3 четыре раза', 'Разделить 3 на 4'],
          correctIndex: 1,
          explanation: '«3 × 4» — это когда мы 3 берём 4 раза: 3 + 3 + 3 + 3 = 12.',
          conceptTag: 'meaning'
        },
        {
          id: 'q4',
          prompt: '2 пакета, в каждом по 5 конфет. Сколько конфет?',
          options: ['7', '10', '25'],
          correctIndex: 1,
          explanation: '2 пакета по 5 — это 5 + 5 = 10. По-умному: 2 × 5 = 10.',
          conceptTag: 'groups'
        }
      ]
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: MAIN,
    layerType: 'INTUITION',
    orderIndex: 3,
    title: 'Почувствуй умножение',
    subtitle: 'Собери картинку и посмотри, как меняется число',
    icon: 'i-lucide-wand-sparkles',
    accentColor: 'cyan',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: {
        type: 'array-grid',
        minRows: 1,
        maxRows: 6,
        minCols: 1,
        maxCols: 6,
        defaultRows: 3,
        defaultCols: 4
      },
      copy: {
        headline: 'Двигай ряды и «в ряду» — смотри, как картинка и число меняются одновременно.',
        body: 'Каждый ряд — это повторение одной и той же группы. Умножение считает такую картинку целиком.'
      },
      probes: [
        {
          id: 'p1',
          prompt: 'Поставь 3 × 4 (3 ряда, в каждом по 4). Сколько точек получилось?',
          options: ['7', '12', '34'],
          correctIndex: 1,
          explanation: '3 ряда по 4 точки — это 4 + 4 + 4 = 12.'
        },
        {
          id: 'p2',
          prompt: 'Теперь поставь 5 × 2. Сколько точек?',
          options: ['7', '10', '52'],
          correctIndex: 1,
          explanation: '5 рядов по 2 = 2 + 2 + 2 + 2 + 2 = 10.'
        },
        {
          id: 'p3',
          prompt: 'Сравни 4 × 3 и 3 × 4. Число точек одинаковое или разное?',
          options: ['Одинаковое', 'Разное'],
          correctIndex: 0,
          explanation: 'Одинаковое! От перемены мест множителей результат не меняется.'
        }
      ]
    },
    completionCriteria: { minInteractions: 3 }
  })

  await insertLayer({
    lessonId: MAIN,
    layerType: 'EXPLANATION',
    orderIndex: 4,
    title: 'Что это значит на самом деле',
    subtitle: 'Разбираем идею умножения по порядку',
    icon: 'i-lucide-graduation-cap',
    accentColor: 'emerald',
    estimatedMinutes: 6,
    xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1',
          kind: 'comic',
          content: 'Умножение за 3 кадра',
          panels: [
            { emoji: '➕', accent: 'amber', caption: '4 + 4 + 4 — долго писать' },
            { emoji: '✖️', accent: 'sky', caption: 'Лучше: 3 × 4 (короче!)' },
            { emoji: '🎯', accent: 'emerald', caption: 'Это и есть умножение' }
          ]
        },
        {
          id: 'c2',
          kind: 'text',
          content: 'Умножение — это короткий способ сложить несколько **одинаковых** частей. Вместо 4 + 4 + 4 пишут 3 × 4. Число 4 повторяется 3 раза.'
        },
        {
          id: 'c3',
          kind: 'callout',
          emphasis: true,
          speakable: true,
          content: 'Первое число говорит **сколько раз** повторить, второе — **что** повторяем.'
        },
        {
          id: 'c4',
          kind: 'formula',
          content: '2 \\times 5 = 5 + 5 = 10',
          note: '«Взять 5 два раза»'
        },
        {
          id: 'c5',
          kind: 'tap-reveal',
          content: 'А зачем вообще нужно умножение?',
          revealedKind: 'text',
          revealedContent: 'Если у тебя 5 пакетов по 6 конфет, считать по одной долго. А умножение 5 × 6 = 30 — за секунду.',
          revealedHint: 'Умножение экономит время.'
        }
      ],
      checks: [
        {
          id: 'ch1',
          prompt: '3 × 4 — это короткая запись для…',
          options: ['3 + 4', '4 + 4 + 4', '3 × 3 × 3 × 3'],
          correctIndex: 1,
          explanation: 'Первое число 3 — сколько раз. Значит, 4 повторяется 3 раза: 4 + 4 + 4.'
        },
        {
          id: 'ch2',
          prompt: 'В 4 коробках по 5 мячей. Сколько мячей всего?',
          options: ['9', '20', '45'],
          correctIndex: 1,
          explanation: '4 коробки по 5 = 5 + 5 + 5 + 5 = 20. Или короче: 4 × 5 = 20.'
        },
        {
          id: 'ch3',
          prompt: 'Что означает «2 × 7»?',
          options: ['2 прибавить 7', '2 раза по 7', '7 отнять 2'],
          correctIndex: 1,
          explanation: '2 × 7 — это «взять семёрку два раза»: 7 + 7 = 14.'
        }
      ]
    },
    completionCriteria: { minInteractions: 3, minAccuracy: 60 }
  })

  await insertLayer({
    lessonId: MAIN,
    layerType: 'FORMALIZATION',
    orderIndex: 5,
    title: 'Имена частей',
    subtitle: 'Называем части умножения по-научному',
    icon: 'i-lucide-book-open',
    accentColor: 'violet',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Анатомия умножения',
      anatomy: [
        { id: 'a', label: 'Множитель', role: 'сколько раз', value: 'a', accent: 'emerald' },
        { id: 'x', label: '×', role: 'знак', value: '×', accent: 'sky' },
        { id: 'b', label: 'Множитель', role: 'что повторяем', value: 'b', accent: 'violet' }
      ],
      terms: [
        {
          term: 'Множитель',
          definition: 'Одно из двух чисел, которые умножают. Первое — сколько раз, второе — что повторяем.',
          example: 'В 3 × 4 множители — это 3 и 4.',
          speakText: 'Множитель — одно из чисел в умножении'
        },
        {
          term: 'Произведение',
          definition: 'Результат умножения, то, что получилось.',
          example: 'В 3 × 4 = 12 произведение — это 12.',
          speakText: 'Произведение — это результат умножения'
        },
        {
          term: 'Знак ×',
          definition: 'Знак умножения. Можно писать как «×» или как точку «·».',
          example: '3 × 4 и 3 · 4 — это одно и то же.',
          speakText: 'Знак умножения'
        }
      ],
      buildTask: {
        prompt: 'Собери предложение: в записи 2 × 5 = 10, как называются 2, 5 и 10?',
        template: '___ × ___ = ___',
        expected: ['множитель', 'множитель', 'произведение'],
        distractors: ['сумма', 'разность', 'делитель', 'частное', 'знак']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: MAIN,
    layerType: 'WALKTHROUGH',
    orderIndex: 6,
    title: 'Разбор эталонных задач',
    subtitle: 'Идём от готового решения к самостоятельному',
    icon: 'i-lucide-lightbulb',
    accentColor: 'yellow',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Мы разберём три задачи. В первой всё покажу я. Во второй — часть сделаешь сам. В третьей — ты полностью.',
      examples: [
        {
          id: 'e1',
          problem: 'В классе 3 ряда парт. В каждом ряду по 6 парт. Сколько всего парт?',
          prefilledSteps: 4,
          steps: [
            { index: 1, title: 'Что повторяется', explanation: 'В каждом ряду по **6** парт. Значит, «что повторяем» — это 6.', action: { kind: 'numeric', prompt: 'Что повторяется?', expected: 6 } },
            { index: 2, title: 'Сколько раз повторяется', explanation: 'Рядов — **3**. Значит, 6 повторяется 3 раза.', action: { kind: 'numeric', prompt: 'Сколько раз?', expected: 3 } },
            { index: 3, title: 'Записываем умножение', explanation: 'Выражение: $3 \\times 6$.', action: { kind: 'choice', prompt: 'Какое выражение подходит?', options: ['3 + 6', '3 × 6', '6 − 3'], correctIndex: 1 } },
            { index: 4, title: 'Считаем', explanation: '$3 \\times 6 = 6 + 6 + 6 = 18$. Всего **18 парт**.', action: { kind: 'numeric', prompt: '3 × 6 =', expected: 18 } }
          ]
        },
        {
          id: 'e2',
          problem: 'В магазине 4 полки, на каждой по 5 книг. Сколько книг на всех полках?',
          prefilledSteps: 2,
          steps: [
            { index: 1, title: 'Что повторяется', explanation: 'На одной полке — **5 книг**. «Что повторяем» — это 5.', action: { kind: 'numeric', prompt: 'Что повторяется?', expected: 5 } },
            { index: 2, title: 'Сколько раз', explanation: 'Полок — **4**. Значит, повторяем 4 раза.', action: { kind: 'numeric', prompt: 'Сколько раз?', expected: 4 } },
            {
              index: 3,
              title: 'Какое выражение подходит',
              explanation: 'Попробуй сам выбрать запись.',
              action: {
                kind: 'choice',
                prompt: 'Какое из выражений равно «4 полки по 5 книг»?',
                options: ['5 + 5 + 5 + 5', '4 + 5', '4 × 4 × 5'],
                correctIndex: 0
              }
            },
            {
              index: 4,
              title: 'Считаем',
              explanation: 'Теперь посчитай результат.',
              action: {
                kind: 'numeric',
                prompt: 'Сколько книг всего?',
                expected: 20
              }
            }
          ]
        },
        {
          id: 'e3',
          problem: 'У тебя 2 пакета конфет, и в каждом по 8 конфет. Сколько у тебя конфет?',
          prefilledSteps: 0,
          steps: [
            {
              index: 1,
              title: 'Что повторяется',
              explanation: 'Подумай: «сколько конфет в одном пакете?».',
              action: { kind: 'numeric', prompt: 'В одном пакете:', expected: 8 }
            },
            {
              index: 2,
              title: 'Сколько раз',
              explanation: 'А сколько всего таких пакетов?',
              action: { kind: 'numeric', prompt: 'Пакетов:', expected: 2 }
            },
            {
              index: 3,
              title: 'Перемножь',
              explanation: 'Посчитай произведение.',
              action: { kind: 'numeric', prompt: '2 × 8 =', expected: 16 }
            }
          ]
        }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 · layer 7 — TRAINER
  // ═════════════════════════════════════════════════════════════════════
  await insertLayer({
    lessonId: MAIN,
    layerType: 'TRAINER',
    orderIndex: 7,
    title: 'Тренажёр умножения',
    subtitle: 'Набери 6 правильных — и можно дальше',
    icon: 'i-lucide-dumbbell',
    accentColor: 'emerald',
    estimatedMinutes: 5,
    xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair — соединить умножение с ответом
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини умножение с ответом',
          left: [
            { id: 'L1', label: '2 × 3' },
            { id: 'L2', label: '4 × 2' },
            { id: 'L3', label: '3 × 6' },
            { id: 'L4', label: '5 × 4' }
          ],
          right: [
            { id: 'R1', label: '6', pairId: 'L1' },
            { id: 'R2', label: '8', pairId: 'L2' },
            { id: 'R3', label: '18', pairId: 'L3' },
            { id: 'R4', label: '20', pairId: 'L4' }
          ],
          conceptTag: 'pairs'
        },
        { kind: 'choice', id: 't2', prompt: 'Какое выражение равно «3 коробки по 5 мячей»?', options: ['3 + 5', '3 × 5', '3 − 5'], correctIndex: 1, explanation: '3 раза по 5 — это 3 × 5.', conceptTag: 'meaning' },
        { kind: 'choice', id: 't3', prompt: 'Сколько всего ног у 4 кроликов (по 4 лапы у каждого)?', options: ['8', '16', '20'], correctIndex: 1, explanation: '4 × 4 = 16.', conceptTag: 'word' },
        { kind: 'numeric', id: 't4', prompt: '$2 \\times 8$ =', correctAnswer: 16, hint: '2 раза по 8 = 8 + 8 = 16.', conceptTag: 'basic' },
        { kind: 'numeric', id: 't5', prompt: '$3 \\times 7$ =', correctAnswer: 21, hint: '3 раза по 7 = 7 + 7 + 7.', conceptTag: 'basic' },
        { kind: 'choice', id: 't6', prompt: 'В 3 банках по 7 карамелек. Какое действие?', options: ['3 + 7', '3 × 7', '7 − 3'], correctIndex: 1, explanation: 'Одинаковые группы — это умножение.', conceptTag: 'meaning' },
        { kind: 'numeric', id: 't7', prompt: '$4 \\times 5$ =', correctAnswer: 20, hint: '4 раза по 5 = 5 + 5 + 5 + 5 = 20.', conceptTag: 'basic' }
      ],
      socraticHints: {
        t4: ['2 раза — значит просто сложи два одинаковых числа.'],
        t5: ['3 + 3 = 6 + 3 + 3 = ?', 'Считай по тройкам.'],
        t7: ['Раздели на маленькие: 5+5=10, +5+5=10. Сложи.']
      }
    },
    completionCriteria: { minCorrect: 6 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 · layer 8 — SCENARIO («Магазин игрушек»)
  // ═════════════════════════════════════════════════════════════════════
  await insertLayer({
    lessonId: MAIN,
    layerType: 'SCENARIO',
    orderIndex: 8,
    title: 'Магазин игрушек',
    subtitle: 'Ты продавец — умножение сделает работу быстрой',
    icon: 'i-lucide-store',
    accentColor: 'orange',
    estimatedMinutes: 6,
    xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Магазин «У Феми»',
        roleplay: 'Сегодня ты за прилавком. Клиенты приходят один за другим — посчитай правильно, и магазин получит выручку и репутацию.',
        characterName: 'Феми',
        mascotLine: 'Считай группы, а не по одному — я в тебя верю!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Алтынай', request: '3 коробки карандашей по 6 штук. Сколько карандашей всего?', correct: 18, unit: 'шт', wrongFeedback: '3 × 6 = 18.', revenueReward: 18, reputationReward: 1 },
        { id: 'o2', customer: 'Данияр', request: '4 пакетика наклеек по 5 штук. Сколько наклеек?', correct: 20, unit: 'шт', wrongFeedback: '4 × 5 = 20.', revenueReward: 20, reputationReward: 1 },
        { id: 'o3', customer: 'Мама с малышом', request: '2 упаковки по 8 кубиков. Сколько кубиков?', correct: 16, unit: 'шт', wrongFeedback: '2 × 8 = 16.', revenueReward: 16, reputationReward: 1 },
        { id: 'o4', customer: 'Айбек', request: '5 наборов фломастеров по 4 цвета. Сколько цветов?', correct: 20, unit: 'цвет.', wrongFeedback: '5 × 4 = 20.', revenueReward: 20, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Школьная закупка',
        request: 'Финал: 7 коробок по 8 ластиков. Сколько ластиков?',
        correct: 56,
        unit: 'шт',
        wrongFeedback: '7 × 8 = 56. Семь раз по восемь.',
        revenueReward: 100,
        reputationReward: 3
      }
    },
    completionCriteria: { minInteractions: 4 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 · layer 9 — TRAPS
  // ═════════════════════════════════════════════════════════════════════
  await insertLayer({
    lessonId: MAIN,
    layerType: 'TRAPS',
    orderIndex: 9,
    title: 'Частые ловушки',
    subtitle: 'Ошибки, которые подстерегают всех',
    icon: 'i-lucide-alert-triangle',
    accentColor: 'rose',
    estimatedMinutes: 3,
    xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Чемпион умножения', emoji: '✖️' },
      intro: 'Эти ошибки встречаются чаще всего — разберём каждую, чтобы ты не попался.',
      traps: [
        {
          id: 'trap1',
          wrongStatement: '$3 \\times 4 = 3 + 4 = 7$',
          whyWrong: 'Знак «×» — это **не** знак «+». Умножение — это повторение одной и той же группы.',
          correctStatement: '$3 \\times 4 = 4 + 4 + 4 = 12$',
          rememberNote: 'Умножение — это повторное сложение, а не обычное сложение.',
          example: '3 пакета по 4 яблока = 4 + 4 + 4 = 12, а вовсе не 7.'
        },
        {
          id: 'trap2',
          wrongStatement: '$5 \\times 0 = 5$',
          whyWrong: 'Если взять число 0 раз — значит не взять ни разу. Ничего не будет.',
          correctStatement: '$5 \\times 0 = 0$',
          rememberNote: 'Любое число, умноженное на 0, равно 0.',
          example: '0 коробок по 5 конфет = 0 конфет.'
        },
        {
          id: 'trap3',
          wrongStatement: '$7 \\times 1 = 1$',
          whyWrong: 'Взять число 1 раз — это само число. Умножение на 1 ничего не меняет.',
          correctStatement: '$7 \\times 1 = 7$',
          rememberNote: 'Умножение на 1 всегда даёт то же число.',
          example: '1 коробка с 7 яблоками — в ней и осталось 7 яблок.'
        },
        {
          id: 'trap4',
          wrongStatement: '$3 \\times 4$ — это **обязательно** $3$ рядов по $4$. Порядок важен.',
          whyWrong: 'От перемены мест множителей результат не меняется: 3 × 4 = 4 × 3 = 12.',
          correctStatement: '$3 \\times 4 = 4 \\times 3 = 12$',
          rememberNote: 'Умножение можно читать в любом порядке — ответ тот же.',
          example: '3 ряда по 4 точки и 4 ряда по 3 точки — картинки разные, а точек одинаково.'
        }
      ]
    },
    completionCriteria: { minInteractions: 4 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 · layer 10 — TEACH_BACK
  // ═════════════════════════════════════════════════════════════════════
  await insertLayer({
    lessonId: MAIN,
    layerType: 'TEACH_BACK',
    orderIndex: 10,
    title: 'Объясни своими словами',
    subtitle: 'Представь, что рассказываешь младшему брату',
    icon: 'i-lucide-megaphone',
    accentColor: 'pink',
    estimatedMinutes: 4,
    xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату-первокласснику',
      voicePrompt: 'Расскажи, что такое умножение',
      minSentences: 3,
      coverPrompts: [
        'Что такое умножение простыми словами',
        'Чем оно отличается от сложения',
        'Приведи свой пример из жизни',
        'Как называются числа в 2 × 5 = 10'
      ],
      requiredConcepts: ['повторение', 'одинаковые группы', 'множитель', 'произведение'],
      conceptKeywords: {
        'повторение': ['повтор', 'раз по', 'несколько раз'],
        'одинаковые группы': ['одинаков', 'групп', 'каждом'],
        'множитель': ['множитель', 'множ'],
        'произведение': ['произвед', 'результат', 'ответ']
      },
      referenceAnswer: 'Умножение — это быстрый способ сложить одинаковые группы. Если у меня 3 коробки, и в каждой по 5 конфет, я не считаю по одной. Я говорю: 3 раза по 5 — это 3 × 5 = 15. Числа 3 и 5 называются множителями, а ответ 15 — произведение. Сложение считает разные числа, а умножение — только когда группы одинаковые.',
      reflectionPrompt: 'Подумай: в какой ещё ситуации ты бы использовал умножение?'
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['повторение', 'одинаковые группы'] }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 · layer 11 — MASTERY_CHECK
  // ═════════════════════════════════════════════════════════════════════
  await insertLayer({
    lessonId: MAIN,
    layerType: 'MASTERY_CHECK',
    orderIndex: 11,
    title: 'Финальная проверка',
    subtitle: 'Набери 80% — и капсула твоя',
    icon: 'i-lucide-trophy',
    accentColor: 'amber',
    estimatedMinutes: 4,
    xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Что такое умножение · Урок 1',
      questions: [
        { id: 'm1', prompt: 'Сколько конфет в 4 коробках, если в каждой по 5 конфет?', kind: 'choice', options: ['9', '20', '45'], correctIndex: 1, conceptTag: 'word', cognitiveLevel: 'apply', explanation: '4 × 5 = 20.' },
        { id: 'm2', prompt: '$3 \\times 7$ =', kind: 'numeric', correctAnswer: 21, conceptTag: 'basic', cognitiveLevel: 'recall', explanation: '7 + 7 + 7 = 21.' },
        { id: 'm3', prompt: 'Как прочитать 6 × 2?', kind: 'choice', options: ['6 прибавить 2', '6 раз по 2', '6 минус 2'], correctIndex: 1, conceptTag: 'meaning', cognitiveLevel: 'understand' },
        { id: 'm4', prompt: '$9 \\times 0$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'm5', prompt: 'В записи 2 × 8 = 16 число 16 называется…', kind: 'choice', options: ['множитель', 'произведение', 'сумма'], correctIndex: 1, conceptTag: 'terms', cognitiveLevel: 'recall' },
        { id: 'm6', prompt: '$1 \\times 15$ =', kind: 'numeric', correctAnswer: 15, conceptTag: 'one', cognitiveLevel: 'recall' },
        { id: 'm7', prompt: 'У 5 пауков по 8 ног. Сколько ног?', kind: 'choice', options: ['13', '40', '48'], correctIndex: 1, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm8', prompt: 'Если 6 × 4 = 24, то 4 × 6 = ?', kind: 'numeric', correctAnswer: 24, conceptTag: 'commutative', cognitiveLevel: 'transfer' },
        { id: 'm9', prompt: 'Какая запись означает «7 повторяется 3 раза»?', kind: 'choice', options: ['7 + 3', '7 × 3', '7 − 3'], correctIndex: 1, conceptTag: 'meaning', cognitiveLevel: 'understand' },
        { id: 'm10', prompt: '$2 \\times 9$ =', kind: 'numeric', correctAnswer: 18, conceptTag: 'basic', cognitiveLevel: 'recall' }
      ],
      questionPool: [
        { id: 'p1', prompt: 'У 6 котят по 4 лапы. Сколько лап?', kind: 'choice', options: ['10', '20', '24'], correctIndex: 2, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p2', prompt: '$4 \\times 5$ =', kind: 'numeric', correctAnswer: 20, conceptTag: 'basic', cognitiveLevel: 'recall' },
        { id: 'p3', prompt: 'Как прочитать 3 × 8?', kind: 'choice', options: ['3 прибавить 8', '3 раза по 8', '3 минус 8'], correctIndex: 1, conceptTag: 'meaning', cognitiveLevel: 'understand' },
        { id: 'p4', prompt: '$11 \\times 0$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'p5', prompt: '$1 \\times 25$ =', kind: 'numeric', correctAnswer: 25, conceptTag: 'one', cognitiveLevel: 'recall' },
        { id: 'p6', prompt: 'В 3 банках по 9 печений. Сколько?', kind: 'numeric', correctAnswer: 27, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p7', prompt: 'Если 5 × 7 = 35, то 7 × 5 = ?', kind: 'numeric', correctAnswer: 35, conceptTag: 'commutative', cognitiveLevel: 'transfer' },
        { id: 'p8', prompt: '$6 \\times 3$ =', kind: 'numeric', correctAnswer: 18, conceptTag: 'basic', cognitiveLevel: 'recall' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Переместительный закон умножения (full 11 layers)
  // ═════════════════════════════════════════════════════════════════════
  const COMM = lessonIds.commutative

  await insertLayer({
    lessonId: COMM,
    layerType: 'HOOK',
    orderIndex: 1,
    title: 'Местами — не важно?',
    subtitle: 'Проверим одну странную штуку про умножение',
    icon: 'i-lucide-sparkles',
    accentColor: 'amber',
    estimatedMinutes: 1,
    xpReward: 10,
    content: {
      kind: 'HOOK',
      mediaKind: 'animation',
      headline: 'Поменять местами — изменится ли ответ?',
      body: '3 ряда по 4 ученика и 4 ряда по 3 ученика. Где людей больше?',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🔄', accent: 'sky', caption: 'Поменяем 3 × 4 на 4 × 3' },
        { emoji: '🤔', accent: 'amber', caption: 'Кажется, что ответы разные…' },
        { emoji: '🎯', accent: 'emerald', caption: '…но число одинаковое — 12!' }
      ],
      prompt: 'Где учеников больше?',
      emojiChoices: [
        { id: 'same', emoji: '🟰', label: 'Одинаково', isPrimary: true },
        { id: 'first', emoji: '3️⃣', label: '3 × 4 больше' },
        { id: 'second', emoji: '4️⃣', label: '4 × 3 больше' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'DIAGNOSTIC',
    orderIndex: 2,
    title: 'Быстрая проверка',
    subtitle: 'Вспомним, что ты уже знаешь про умножение',
    icon: 'i-lucide-stethoscope',
    accentColor: 'sky',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'q1', prompt: 'Сколько будет 5 × 3?', options: ['8', '15', '53'], correctIndex: 1, explanation: '5 × 3 = 5 + 5 + 5 = 15.' },
        { id: 'q2', prompt: 'Сколько будет 3 × 5?', options: ['8', '15', '35'], correctIndex: 1, explanation: '3 × 5 = 3 + 3 + 3 + 3 + 3 = 15 — тот же ответ.' },
        { id: 'q3', prompt: 'Верно ли, что 7 × 2 = 2 × 7?', options: ['Да', 'Нет', 'Зависит от порядка'], correctIndex: 0, explanation: 'Да! От перемены мест произведение не меняется.' },
        { id: 'q4', prompt: 'Если 6 × 7 = 42, то чему равно 7 × 6?', options: ['42', '49', '13'], correctIndex: 0, explanation: '7 × 6 = 42 — порядок не важен.' }
      ]
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'INTUITION',
    orderIndex: 3,
    title: 'Поверни картинку',
    subtitle: 'Один и тот же массив можно увидеть по-разному',
    icon: 'i-lucide-wand-sparkles',
    accentColor: 'cyan',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 6, minCols: 1, maxCols: 6, defaultRows: 3, defaultCols: 4 },
      copy: {
        headline: 'Поставь 3 × 4, а потом 4 × 3 — сравни количество точек.',
        body: 'Картинка разная, но точек — одинаково. Это и есть переместительный закон умножения.'
      },
      probes: [
        { id: 'p1', prompt: 'Поставь 3 × 4. Сколько точек?', options: ['7', '12', '34'], correctIndex: 1, explanation: '3 ряда по 4 = 12.' },
        { id: 'p2', prompt: 'Теперь 4 × 3. Сколько точек?', options: ['7', '12', '43'], correctIndex: 1, explanation: '4 ряда по 3 = 12. Тот же ответ!' },
        { id: 'p3', prompt: 'Значит, 3 × 4 и 4 × 3 — это…', options: ['Разные числа', 'Одно и то же число'], correctIndex: 1, explanation: 'Одинаково. От перемены мест множителей результат не меняется.' }
      ]
    },
    completionCriteria: { minInteractions: 3 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'EXPLANATION',
    orderIndex: 4,
    title: 'Главная идея',
    subtitle: 'Разбираем, почему порядок не важен',
    icon: 'i-lucide-graduation-cap',
    accentColor: 'emerald',
    estimatedMinutes: 6,
    xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c0', kind: 'comic',
          content: 'Поверни картинку — число то же',
          panels: [
            { emoji: '⬜', accent: 'sky', caption: '3 ряда по 4 = 12' },
            { emoji: '🔄', accent: 'amber', caption: 'Поверни на 90°' },
            { emoji: '⬛', accent: 'emerald', caption: '4 ряда по 3 = 12' }
          ]
        },
        { id: 'c1', kind: 'text', content: 'При умножении можно **менять множители местами** — результат не изменится. Это называется **переместительным законом умножения**.' },
        { id: 'c2', kind: 'callout', emphasis: true, speakable: true, content: '**a × b = b × a** — всегда, для любых чисел.' },
        { id: 'c3', kind: 'formula', content: '3 \\times 4 = 4 \\times 3 = 12', note: 'Одно и то же' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Зачем это нужно?',
          revealedKind: 'text',
          revealedContent: 'Если не помнишь 8 × 3, можно посчитать 3 × 8 — а это проще: 8 + 8 + 8 = 24.',
          revealedHint: 'Выбирай удобный порядок!'
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'Если 6 × 5 = 30, то чему равно 5 × 6?', options: ['11', '30', '65'], correctIndex: 1, explanation: 'Тому же числу — 30.' },
        { id: 'ch2', prompt: 'Верно ли, что 9 × 2 = 2 × 9?', options: ['Верно', 'Неверно'], correctIndex: 0, explanation: 'Верно. Порядок множителей можно менять.' },
        { id: 'ch3', prompt: 'Что удобнее посчитать: 7 × 2 или 2 × 7?', options: ['7 × 2', '2 × 7', 'Одинаково'], correctIndex: 1, explanation: '2 × 7 — проще: 7 + 7 = 14. Результат одинаков.' }
      ]
    },
    completionCriteria: { minInteractions: 3, minAccuracy: 60 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'FORMALIZATION',
    orderIndex: 5,
    title: 'Назовём по-научному',
    subtitle: 'Переместительный закон в символах',
    icon: 'i-lucide-book-open',
    accentColor: 'violet',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'a × b = b × a',
      anatomy: [
        { id: 'a', label: 'a', role: 'первый множитель', value: 'a', accent: 'emerald' },
        { id: 'x1', label: '×', role: 'знак', value: '×', accent: 'sky' },
        { id: 'b', label: 'b', role: 'второй множитель', value: 'b', accent: 'violet' },
        { id: 'eq', label: '=', role: 'равно', value: '=', accent: 'amber' },
        { id: 'b2', label: 'b', role: 'второй стал первым', value: 'b', accent: 'violet' },
        { id: 'x2', label: '×', role: 'знак', value: '×', accent: 'sky' },
        { id: 'a2', label: 'a', role: 'первый стал вторым', value: 'a', accent: 'emerald' }
      ],
      terms: [
        { term: 'Переместительный закон', definition: 'Множители можно менять местами — результат не изменится.', example: '7 × 3 = 3 × 7 = 21.', speakText: 'Переместительный закон умножения' },
        { term: 'Множители', definition: 'Числа, которые умножают.', example: 'В 5 × 4 множители — это 5 и 4.', speakText: 'Множители — числа в умножении' }
      ],
      buildTask: {
        prompt: 'Собери равенство на основе 3 × 8 = 24',
        template: '___ × ___ = ___',
        expected: ['8', '3', '24'],
        distractors: ['11', '38', '83', '5', '24', '0']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'WALKTHROUGH',
    orderIndex: 6,
    title: 'Разбор перестановки',
    subtitle: 'Применим закон в задачах',
    icon: 'i-lucide-lightbulb',
    accentColor: 'yellow',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Посмотрим, как перестановка множителей помогает считать быстрее.',
      examples: [
        {
          id: 'e1',
          problem: 'Сколько будет 9 × 2? Используем перестановку.',
          prefilledSteps: 3,
          steps: [
            { index: 1, title: 'Замечаем перестановку', explanation: '9 × 2 = 2 × 9 — по переместительному закону.', action: { kind: 'choice', prompt: 'Чему равно 9 × 2 после перестановки?', options: ['9 + 2', '2 × 9', '9 − 2'], correctIndex: 1 } },
            { index: 2, title: 'Считаем 2 × 9', explanation: '2 × 9 = 9 + 9 = 18.', action: { kind: 'numeric', prompt: '2 × 9 =', expected: 18 } },
            { index: 3, title: 'Ответ', explanation: '9 × 2 = **18**.', action: { kind: 'numeric', prompt: '9 × 2 =', expected: 18 } }
          ]
        },
        {
          id: 'e2',
          problem: 'Посчитай 8 × 3, используя перестановку.',
          prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Перестановка', explanation: '8 × 3 = 3 × 8 — закон позволяет.', action: { kind: 'choice', prompt: '8 × 3 равно…', options: ['8 + 3', '3 × 8', '3 − 8'], correctIndex: 1 } },
            { index: 2, title: 'Посчитай 3 × 8', explanation: '3 раза по 8.', action: { kind: 'numeric', prompt: '3 × 8 =', expected: 24 } },
            { index: 3, title: 'Ответ', explanation: 'Значит, и 8 × 3 равно…', action: { kind: 'numeric', prompt: '8 × 3 =', expected: 24 } }
          ]
        },
        {
          id: 'e3',
          problem: 'Посчитай 7 × 2 самостоятельно.',
          prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Перестановка', explanation: 'Что получится, если поменять множители местами?', action: { kind: 'choice', prompt: '7 × 2 = …', options: ['7 + 2', '2 × 7', '2 + 7'], correctIndex: 1 } },
            { index: 2, title: 'Считаем', explanation: 'Посчитай 2 × 7.', action: { kind: 'numeric', prompt: '2 × 7 =', expected: 14 } }
          ]
        }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'TRAINER',
    orderIndex: 7,
    title: 'Тренажёр перестановки',
    subtitle: '6 правильных — и дальше',
    icon: 'i-lucide-dumbbell',
    accentColor: 'emerald',
    estimatedMinutes: 5,
    xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair — пары переместительного
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини равные пары',
          left: [
            { id: 'L1', label: '3 × 5' },
            { id: 'L2', label: '7 × 2' },
            { id: 'L3', label: '4 × 6' },
            { id: 'L4', label: '9 × 3' }
          ],
          right: [
            { id: 'R1', label: '5 × 3', pairId: 'L1' },
            { id: 'R2', label: '2 × 7', pairId: 'L2' },
            { id: 'R3', label: '6 × 4', pairId: 'L3' },
            { id: 'R4', label: '3 × 9', pairId: 'L4' }
          ],
          conceptTag: 'commutative-pairs'
        },
        { kind: 'numeric', id: 't2', prompt: 'Если 4 × 6 = 24, то 6 × 4 = ?', correctAnswer: 24, hint: 'Результат тот же.', conceptTag: 'commutative' },
        { kind: 'numeric', id: 't3', prompt: '$2 \\times 7$ =', correctAnswer: 14, hint: '2 раза по 7.', conceptTag: 'basic' },
        { kind: 'choice', id: 't4', prompt: 'Какое равенство ВСЕГДА верно?', options: ['a × b = a + b', 'a × b = b × a', 'a × b = b − a'], correctIndex: 1, conceptTag: 'law' },
        { kind: 'numeric', id: 't5', prompt: '$5 \\times 3$ =', correctAnswer: 15, hint: '5 × 3 = 3 × 5.', conceptTag: 'basic' },
        { kind: 'numeric', id: 't6', prompt: 'Если 9 × 2 = 18, то 2 × 9 = ?', correctAnswer: 18, hint: 'Порядок не важен.', conceptTag: 'commutative' },
        { kind: 'choice', id: 't7', prompt: 'Что удобнее: 8 × 2 или 2 × 8?', options: ['8 × 2', '2 × 8', 'Одинаково по ответу'], correctIndex: 2, conceptTag: 'law' }
      ],
      socraticHints: {
        t1: ['Переставь — разве число изменится?'],
        t5: ['3 + 3 + 3 + 3 + 3 — сколько получится?'],
        t8: ['Попробуй 9 × 3: это три девятки — 9 + 9 + 9.']
      }
    },
    completionCriteria: { minCorrect: 6 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'SCENARIO',
    orderIndex: 8,
    title: 'Библиотека Феми',
    subtitle: 'Разложи книги — и посмотри, что числа не меняются',
    icon: 'i-lucide-store',
    accentColor: 'orange',
    estimatedMinutes: 5,
    xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Библиотека',
        roleplay: 'Ты помощник библиотекаря. Раскладывай книги — и убеждайся, что порядок не меняет общее число.',
        characterName: 'Феми',
        mascotLine: 'Смотри: если поставить иначе — всё равно столько же книг!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Айгерим', request: '5 полок по 3 книги. Сколько всего?', correct: 15, unit: 'шт', wrongFeedback: '5 × 3 = 15.', revenueReward: 15, reputationReward: 1 },
        { id: 'o2', customer: 'Данияр', request: 'Переставили: 3 полки по 5. А теперь?', correct: 15, unit: 'шт', wrongFeedback: 'Столько же — 15. Порядок не важен!', revenueReward: 15, reputationReward: 1 },
        { id: 'o3', customer: 'Арман', request: '4 ряда по 6 учебников. Сколько?', correct: 24, unit: 'шт', wrongFeedback: '4 × 6 = 24.', revenueReward: 24, reputationReward: 1 },
        { id: 'o4', customer: 'Малика', request: 'Переложили: 6 рядов по 4. Теперь?', correct: 24, unit: 'шт', wrongFeedback: 'Всё те же 24 — закон работает.', revenueReward: 24, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный библиотекарь',
        request: 'Финал: 7 × 8 vs 8 × 7. Введи число.',
        correct: 56,
        unit: 'шт',
        wrongFeedback: '7 × 8 = 8 × 7 = 56.',
        revenueReward: 100,
        reputationReward: 3
      }
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'TRAPS',
    orderIndex: 9,
    title: 'Осторожно — не везде можно',
    subtitle: 'Закон работает для умножения, но не для всего',
    icon: 'i-lucide-alert-triangle',
    accentColor: 'rose',
    estimatedMinutes: 3,
    xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток закона', emoji: '🔄' },
      intro: 'Переставлять можно только в умножении и сложении. Запомним где можно, а где нет.',
      traps: [
        { id: 'trap1', wrongStatement: '$10 - 3 = 3 - 10$ (можно же переставить)', whyWrong: 'Вычитание **не** работает как умножение. 10 − 3 = 7, а 3 − 10 в младших классах посчитать нельзя.', correctStatement: '$10 - 3 = 7$, а переставить тут нельзя', rememberNote: 'Переместительный закон — только для умножения и сложения.', example: '$7 × 2 = 2 × 7 = 14$ — так можно. А 7 − 2 ≠ 2 − 7.' },
        { id: 'trap2', wrongStatement: '$4 × 5 = 5 + 4 = 9$', whyWrong: 'Перестановка множителей не превращает умножение в сложение! Закон говорит только о смене ПОРЯДКА, знак остаётся.', correctStatement: '$4 × 5 = 5 × 4 = 20$', rememberNote: 'Закон меняет порядок — но не знак.', example: '4 × 5 = 20, 5 × 4 = 20. Знак × остаётся!' },
        { id: 'trap3', wrongStatement: '«$3 × 4$» и «$4 × 3$» — **картинки одинаковые**', whyWrong: 'Картинки разные! Но точек в них — одинаково. Не путай визуальную форму и число.', correctStatement: 'Картинки разные, результат — одинаковый: 12.', rememberNote: 'Закон — про число, а не про форму.', example: '3 ряда по 4 выглядят иначе, чем 4 ряда по 3 — но точек 12 и там, и там.' }
      ]
    },
    completionCriteria: { minInteractions: 3 }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'TEACH_BACK',
    orderIndex: 10,
    title: 'Расскажи закон своими словами',
    subtitle: 'Объясни другу, почему порядок не важен',
    icon: 'i-lucide-megaphone',
    accentColor: 'pink',
    estimatedMinutes: 4,
    xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи про переместительный закон',
      minSentences: 3,
      coverPrompts: [
        'Что такое переместительный закон умножения',
        'Почему 3 × 4 и 4 × 3 дают одно и то же',
        'Приведи свой пример, где перестановка удобна',
        'Где закон НЕ работает (подумай)'
      ],
      requiredConcepts: ['перестановка', 'множитель', 'не меняется', 'одинаковое'],
      conceptKeywords: {
        'перестановка': ['переставить', 'переставля', 'местами', 'поменять'],
        'множитель': ['множитель', 'множ'],
        'не меняется': ['не меняется', 'остаётся', 'тот же', 'одинаков'],
        'одинаковое': ['одинаков', 'равно']
      },
      referenceAnswer: 'Переместительный закон умножения говорит, что множители можно менять местами — ответ не изменится. Если у меня 3 ряда по 4 яблока и 4 ряда по 3 яблока — картинки разные, а всего 12 яблок и там, и там. Это удобно, потому что 8 × 2 лучше считать как 2 × 8 = 16. А вот в вычитании так нельзя: 10 − 3 ≠ 3 − 10.'
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['перестановка', 'не меняется'] }
  })

  await insertLayer({
    lessonId: COMM,
    layerType: 'MASTERY_CHECK',
    orderIndex: 11,
    title: 'Финал: переместительный закон',
    subtitle: '80% — и капсула пройдена',
    icon: 'i-lucide-trophy',
    accentColor: 'amber',
    estimatedMinutes: 4,
    xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Переместительный закон · Урок 2',
      questions: [
        { id: 'm1', prompt: 'Если 6 × 7 = 42, то 7 × 6 = ?', kind: 'numeric', correctAnswer: 42, conceptTag: 'commutative', cognitiveLevel: 'recall' },
        { id: 'm2', prompt: 'Какое равенство верно?', kind: 'choice', options: ['a × b = b + a', 'a × b = b × a', 'a × b = b − a'], correctIndex: 1, conceptTag: 'law', cognitiveLevel: 'understand' },
        { id: 'm3', prompt: '$9 \\times 2$ =', kind: 'numeric', correctAnswer: 18, conceptTag: 'basic', cognitiveLevel: 'recall' },
        { id: 'm4', prompt: '$2 \\times 9$ =', kind: 'numeric', correctAnswer: 18, conceptTag: 'commutative', cognitiveLevel: 'transfer' },
        { id: 'm5', prompt: 'В каком действии закон ТОЖЕ работает?', kind: 'choice', options: ['Вычитание', 'Сложение', 'Деление'], correctIndex: 1, conceptTag: 'boundary', cognitiveLevel: 'analyze' },
        { id: 'm6', prompt: '$5 \\times 3$ =', kind: 'numeric', correctAnswer: 15, conceptTag: 'basic', cognitiveLevel: 'recall' },
        { id: 'm7', prompt: 'Если 8 × 4 = 32, то 4 × 8 = ?', kind: 'numeric', correctAnswer: 32, conceptTag: 'commutative', cognitiveLevel: 'transfer' },
        { id: 'm8', prompt: 'Что удобнее: 12 × 2 или 2 × 12?', kind: 'choice', options: ['12 × 2', '2 × 12', 'Ответ одинаков'], correctIndex: 2, conceptTag: 'law', cognitiveLevel: 'apply' },
        { id: 'm9', prompt: 'Можно ли переставить $10 - 4$?', kind: 'choice', options: ['Да, ответ тот же', 'Нет, в вычитании нельзя'], correctIndex: 1, conceptTag: 'boundary', cognitiveLevel: 'analyze' },
        { id: 'm10', prompt: '$7 \\times 3$ =', kind: 'numeric', correctAnswer: 21, conceptTag: 'basic', cognitiveLevel: 'recall' }
      ],
      questionPool: [
        { id: 'p1', prompt: 'Если 4 × 9 = 36, то 9 × 4 = ?', kind: 'numeric', correctAnswer: 36, conceptTag: 'commutative', cognitiveLevel: 'recall' },
        { id: 'p2', prompt: 'Закон умножения называется…', kind: 'choice', options: ['Переместительный', 'Сочетательный', 'Распределительный'], correctIndex: 0, conceptTag: 'law', cognitiveLevel: 'understand' },
        { id: 'p3', prompt: '$8 \\times 3$ =', kind: 'numeric', correctAnswer: 24, conceptTag: 'basic', cognitiveLevel: 'recall' },
        { id: 'p4', prompt: '$3 \\times 8$ =', kind: 'numeric', correctAnswer: 24, conceptTag: 'commutative', cognitiveLevel: 'transfer' },
        { id: 'p5', prompt: 'Если 6 × 5 = 30, то 5 × 6 = ?', kind: 'numeric', correctAnswer: 30, conceptTag: 'commutative', cognitiveLevel: 'recall' },
        { id: 'p6', prompt: '$4 \\times 7$ =', kind: 'numeric', correctAnswer: 28, conceptTag: 'basic', cognitiveLevel: 'recall' },
        { id: 'p7', prompt: 'Где закон НЕ работает?', kind: 'choice', options: ['В сложении', 'В вычитании', 'В умножении'], correctIndex: 1, conceptTag: 'boundary', cognitiveLevel: 'analyze' },
        { id: 'p8', prompt: '$9 \\times 5$ =', kind: 'numeric', correctAnswer: 45, conceptTag: 'basic', cognitiveLevel: 'recall' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Умножение на 1 и на 0 (full 11 layers)
  // ═════════════════════════════════════════════════════════════════════
  const ZO = lessonIds.zeroOne

  await insertLayer({
    lessonId: ZO,
    layerType: 'HOOK',
    orderIndex: 1,
    title: 'Странный случай',
    subtitle: 'Что если умножить число на 0?',
    icon: 'i-lucide-sparkles',
    accentColor: 'amber',
    estimatedMinutes: 1,
    xpReward: 10,
    content: {
      kind: 'HOOK',
      mediaKind: 'animation',
      headline: 'Странные множители',
      body: 'Ноль коробок по 7 конфет — сколько у тебя? А одна коробка с 7 конфетами?',
      mascotEntry: 'think',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '0️⃣', accent: 'rose', caption: '0 коробок = 0 конфет' },
        { emoji: '📦', accent: 'sky', caption: '1 коробка = столько же, сколько в ней' },
        { emoji: '✨', accent: 'emerald', caption: '0 и 1 — особые числа в умножении' }
      ],
      prompt: 'Что получится: 7 × 1 = ?',
      emojiChoices: [
        { id: 'seven', emoji: '7️⃣', label: '7', isPrimary: true },
        { id: 'one', emoji: '1️⃣', label: '1' },
        { id: 'zero', emoji: '0️⃣', label: '0' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'DIAGNOSTIC',
    orderIndex: 2,
    title: 'Проверка особых случаев',
    subtitle: 'Четыре вопроса про 0 и 1',
    icon: 'i-lucide-stethoscope',
    accentColor: 'sky',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'q1', prompt: '5 × 1 = ?', options: ['0', '1', '5'], correctIndex: 2, explanation: 'Умножить на 1 — взять число один раз.' },
        { id: 'q2', prompt: '5 × 0 = ?', options: ['0', '1', '5'], correctIndex: 0, explanation: 'Взять пятёрку ноль раз = 0.' },
        { id: 'q3', prompt: 'Что происходит при умножении на 1?', options: ['Число удваивается', 'Число остаётся тем же', 'Получается 0'], correctIndex: 1, explanation: 'Умножение на 1 ничего не меняет.' },
        { id: 'q4', prompt: 'А при умножении на 0?', options: ['Получается то же число', 'Получается 0', 'Ответ неопределён'], correctIndex: 1, explanation: 'Любое число × 0 = 0.' }
      ]
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'INTUITION',
    orderIndex: 3,
    title: 'Что меняется?',
    subtitle: 'Поиграй с рядами по 1 и с пустыми рядами',
    icon: 'i-lucide-wand-sparkles',
    accentColor: 'cyan',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 0, maxRows: 6, minCols: 0, maxCols: 6, defaultRows: 1, defaultCols: 5 },
      copy: {
        headline: 'Поставь 1 ряд по 5 — а потом 5 рядов по 1. Сравни.',
        body: 'А теперь попробуй 0 рядов (или 0 в ряду). Что получится?'
      },
      probes: [
        { id: 'p1', prompt: '1 × 5 = ?', options: ['0', '1', '5'], correctIndex: 2, explanation: 'Один ряд из 5 точек — это 5 точек.' },
        { id: 'p2', prompt: '5 × 1 = ?', options: ['0', '1', '5'], correctIndex: 2, explanation: '5 рядов по 1 точке — снова 5 точек.' },
        { id: 'p3', prompt: '0 × 7 = ?', options: ['0', '1', '7'], correctIndex: 0, explanation: '0 рядов — ни одной точки нет.' },
        { id: 'p4', prompt: '7 × 0 = ?', options: ['0', '1', '7'], correctIndex: 0, explanation: '7 рядов по 0 точек — всё равно пусто.' }
      ]
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'EXPLANATION',
    orderIndex: 4,
    title: 'Два правила',
    subtitle: 'Коротко — и надолго',
    icon: 'i-lucide-graduation-cap',
    accentColor: 'emerald',
    estimatedMinutes: 5,
    xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c0', kind: 'comic',
          content: 'Особые случаи',
          panels: [
            { emoji: '1️⃣', accent: 'amber', caption: '× 1 — число не меняется' },
            { emoji: '0️⃣', accent: 'rose', caption: '× 0 — всегда 0' },
            { emoji: '🎯', accent: 'emerald', caption: 'Запомни эти 2 правила' }
          ]
        },
        { id: 'c1', kind: 'callout', emphasis: true, speakable: true, content: 'Правило 1: **Любое число, умноженное на 1, равно самому числу.**' },
        { id: 'c2', kind: 'formula', content: 'a \\times 1 = a \\quad \\text{и} \\quad 1 \\times a = a', note: 'Возьми один раз — ничего не поменяется' },
        { id: 'c3', kind: 'callout', emphasis: true, speakable: true, content: 'Правило 2: **Любое число, умноженное на 0, равно 0.**' },
        { id: 'c4', kind: 'formula', content: 'a \\times 0 = 0 \\quad \\text{и} \\quad 0 \\times a = 0', note: 'Ноль раз — это ничего' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'Почему 7 × 0 = 0?',
          revealedKind: 'text',
          revealedContent: 'Представь 7 коробок по 0 конфет — конфет нет. А 7 × 1 — это одна семёрка, то есть сама семёрка.',
          revealedHint: 'Ноль обнуляет, единица не меняет.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: '$34 \\times 1$ = ?', options: ['0', '1', '34'], correctIndex: 2, explanation: 'Умножение на 1 не меняет число.' },
        { id: 'ch2', prompt: '$56 \\times 0$ = ?', options: ['0', '56', '560'], correctIndex: 0, explanation: 'На 0 — всегда 0.' },
        { id: 'ch3', prompt: '$1 \\times 9$ = ?', options: ['0', '1', '9'], correctIndex: 2, explanation: 'И с этой стороны правило работает: 1 × 9 = 9.' }
      ]
    },
    completionCriteria: { minInteractions: 3, minAccuracy: 60 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'FORMALIZATION',
    orderIndex: 5,
    title: 'Особые случаи — в буквах',
    subtitle: 'Запомни формулы',
    icon: 'i-lucide-book-open',
    accentColor: 'violet',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      diagramTitle: 'Два особых случая',
      anatomy: [
        { id: 'a', label: 'a', role: 'любое число', value: 'a', accent: 'emerald' },
        { id: 'x1', label: '×', role: 'знак', value: '×', accent: 'sky' },
        { id: 'one', label: '1', role: 'единица', value: '1', accent: 'amber' },
        { id: 'eq', label: '=', role: 'равно', value: '=', accent: 'violet' },
        { id: 'a2', label: 'a', role: 'само число', value: 'a', accent: 'emerald' }
      ],
      terms: [
        { term: 'Единица (1)', definition: 'Множитель, который не меняет число. a × 1 = a.', example: '34 × 1 = 34.', speakText: 'Единица — нейтральный множитель' },
        { term: 'Ноль (0)', definition: 'Множитель, который обнуляет. a × 0 = 0.', example: '56 × 0 = 0.', speakText: 'Ноль обнуляет любое число' },
        { term: 'Нейтральный элемент', definition: 'Взрослое название 1 для умножения — «не влияет».', example: 'Умножение на 1 — как пропуск хода.', speakText: 'Нейтральный элемент' }
      ],
      voiceTerms: true,
      buildTask: {
        prompt: 'Собери верное равенство про умножение на 0.',
        template: '___ × ___ = ___',
        expected: ['15', '0', '0'],
        distractors: ['1', '15', '150', '5', '10']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'WALKTHROUGH',
    orderIndex: 6,
    title: 'Разбор особых случаев',
    subtitle: 'Пройдём по примерам',
    icon: 'i-lucide-lightbulb',
    accentColor: 'yellow',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Короткие разборы — чтобы закрепить правила.',
      examples: [
        {
          id: 'e1',
          problem: 'Посчитай 73 × 1.',
          prefilledSteps: 2,
          steps: [
            { index: 1, title: 'Применяем правило', explanation: 'Умножение на 1 не меняет число.', action: { kind: 'choice', prompt: 'Какое правило тут?', options: ['На 0 — всегда 0', 'На 1 — то же число', 'Перестановка'], correctIndex: 1 } },
            { index: 2, title: 'Ответ', explanation: '73 × 1 = **73**.', action: { kind: 'numeric', prompt: '73 × 1 =', expected: 73 } }
          ]
        },
        {
          id: 'e2',
          problem: 'Посчитай 1 × 48.',
          prefilledSteps: 1,
          steps: [
            { index: 1, title: 'С какой стороны 1?', explanation: 'Не важно — правило работает с обеих сторон.', action: { kind: 'choice', prompt: 'Влияет ли позиция 1 на результат?', options: ['Да, по-разному', 'Нет, ответ один', 'Зависит от числа'], correctIndex: 1 } },
            { index: 2, title: 'Ответ', explanation: 'Назови результат.', action: { kind: 'numeric', prompt: '1 × 48 =', expected: 48 } }
          ]
        },
        {
          id: 'e3',
          problem: 'Посчитай 99 × 0.',
          prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Какое правило тут работает?', explanation: 'Подумай: умножаем на 0.', action: { kind: 'choice', prompt: 'Что получится?', options: ['0', '99', '1'], correctIndex: 0 } },
            { index: 2, title: 'Ответ', explanation: 'Запиши результат.', action: { kind: 'numeric', prompt: '99 × 0 =', expected: 0 } }
          ]
        }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'TRAINER',
    orderIndex: 7,
    title: 'Тренажёр: 0 и 1',
    subtitle: 'Быстро и правильно',
    icon: 'i-lucide-dumbbell',
    accentColor: 'emerald',
    estimatedMinutes: 4,
    xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair — соединить выражения с ответами
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с ответом',
          left: [
            { id: 'L1', label: '12 × 1' },
            { id: 'L2', label: '87 × 0' },
            { id: 'L3', label: '1 × 45' },
            { id: 'L4', label: '0 × 33' }
          ],
          right: [
            { id: 'R1', label: '12', pairId: 'L1' },
            { id: 'R2', label: '0', pairId: 'L2' },
            { id: 'R3', label: '45', pairId: 'L3' },
            { id: 'R4', label: '0', pairId: 'L4' }
          ],
          conceptTag: '0-and-1'
        },
        { kind: 'choice', id: 't2', prompt: '$100 \\times 0$ = ?', options: ['100', '0', '1'], correctIndex: 1, conceptTag: 'zero' },
        { kind: 'choice', id: 't3', prompt: '$1 \\times 999$ = ?', options: ['0', '1', '999'], correctIndex: 2, conceptTag: 'one' },
        { kind: 'numeric', id: 't4', prompt: '$0 \\times 0$ =', correctAnswer: 0, hint: 'И тут ноль.', conceptTag: 'zero' },
        { kind: 'numeric', id: 't5', prompt: '$1 \\times 1$ =', correctAnswer: 1, hint: '1 раз по 1 = 1.', conceptTag: 'one' },
        { kind: 'numeric', id: 't6', prompt: '$25 \\times 1$ =', correctAnswer: 25, hint: 'Без изменений.', conceptTag: 'one' },
        { kind: 'numeric', id: 't7', prompt: '$0 \\times 50$ =', correctAnswer: 0, hint: 'Ноль обнуляет.', conceptTag: 'zero' }
      ],
      socraticHints: {
        t4: ['Если хоть один множитель ноль — ответ 0'],
        t5: ['1 раз по 1 — это просто единица']
      }
    },
    completionCriteria: { minCorrect: 6 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'SCENARIO',
    orderIndex: 8,
    title: 'Кафе Феми',
    subtitle: 'В меню есть бесплатные позиции и штучный товар',
    icon: 'i-lucide-store',
    accentColor: 'orange',
    estimatedMinutes: 5,
    xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе «У Феми»',
        roleplay: 'Сегодня ты кассир. Некоторые позиции — акционные (0 тг), другие — штучные. Посчитай стоимость.',
        characterName: 'Феми',
        mascotLine: 'Помни: × 0 — получится 0. А × 1 — само число.'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Ахмед', request: '1 булочка по 250 тг. Сколько к оплате?', correct: 250, unit: 'тг', wrongFeedback: '1 × 250 = 250.', revenueReward: 250, reputationReward: 1 },
        { id: 'o2', customer: 'Айнур (акция)', request: '3 стакана воды по 0 тг. Сколько?', correct: 0, unit: 'тг', wrongFeedback: '3 × 0 = 0.', revenueReward: 0, reputationReward: 1 },
        { id: 'o3', customer: 'Дамир', request: '5 пирожков по 1 пачке соли. Сколько пачек?', correct: 5, unit: 'пачк.', wrongFeedback: '5 × 1 = 5.', revenueReward: 5, reputationReward: 1 },
        { id: 'o4', customer: 'Групповой', request: '0 коробок пиццы (передумал). Сколько к оплате?', correct: 0, unit: 'тг', wrongFeedback: '0 × что угодно = 0.', revenueReward: 0, reputationReward: 0 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный заказчик',
        request: 'Финал: 1 × 99 пирожков по 1 акции. Сколько штук?',
        correct: 99,
        unit: 'шт',
        wrongFeedback: '1 × 99 = 99. Единица не меняет число.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'TRAPS',
    orderIndex: 9,
    title: 'Частые ошибки с 0 и 1',
    subtitle: 'Запомни эти три случая',
    icon: 'i-lucide-alert-triangle',
    accentColor: 'rose',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток 0 и 1', emoji: '⚖️' },
      intro: 'Именно на 0 и 1 часто ошибаются. Разберём.',
      traps: [
        { id: 'trap1', wrongStatement: '$7 \\times 0 = 7$ (ноль же ничего не меняет)', whyWrong: 'Это путают с правилом сложения ($7 + 0 = 7$). В умножении ноль **обнуляет**.', correctStatement: '$7 \\times 0 = 0$', rememberNote: 'Ноль не меняет при **сложении**. А при умножении — обнуляет.', example: '7 + 0 = 7, но 7 × 0 = 0.' },
        { id: 'trap2', wrongStatement: '$1 \\times 8 = 1$ (раз единица — значит 1)', whyWrong: 'Умножение на 1 оставляет **второе** число без изменений, а не превращает всё в 1.', correctStatement: '$1 \\times 8 = 8$', rememberNote: 'На 1 — само число, а не единица.', example: '1 пакет с 8 яблоками — всё ещё 8 яблок.' },
        { id: 'trap3', wrongStatement: '$0 \\times 0 = $ что-то непонятное', whyWrong: 'Никакой магии. 0 рядов по 0 точек — это тоже пусто.', correctStatement: '$0 \\times 0 = 0$', rememberNote: 'Если хоть один множитель 0 — ответ 0.', example: 'Ничего, помноженное на что угодно, — всегда ничего.' }
      ]
    },
    completionCriteria: { minInteractions: 3 }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'TEACH_BACK',
    orderIndex: 10,
    title: 'Расскажи правила своими словами',
    subtitle: 'Объясни младшему брату',
    icon: 'i-lucide-megaphone',
    accentColor: 'pink',
    estimatedMinutes: 3,
    xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату-первокласснику',
      voicePrompt: 'Расскажи правила умножения на 0 и 1',
      minSentences: 3,
      coverPrompts: [
        'Что получится, если умножить число на 1',
        'Что получится, если умножить число на 0',
        'Приведи свой пример с 1',
        'Приведи свой пример с 0'
      ],
      requiredConcepts: ['единица', 'ноль', 'не меняет', 'обнуляет'],
      conceptKeywords: {
        'единица': ['единиц', 'один', 'одну', 'единичк'],
        'ноль': ['ноль', 'нул', 'нет ни'],
        'не меняет': ['не меняет', 'остаётся', 'не меняется', 'тот же'],
        'обнуляет': ['обнуля', 'становится 0', 'станет 0']
      },
      referenceAnswer: 'При умножении на 1 число не меняется: 7 × 1 = 7. Это как взять одну коробку конфет — у тебя в ней столько, сколько было. А при умножении на 0 всегда получается 0: 7 × 0 = 0. Если у меня нет ни одной коробки — значит и конфет у меня нет.'
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['единица', 'ноль'] }
  })

  await insertLayer({
    lessonId: ZO,
    layerType: 'MASTERY_CHECK',
    orderIndex: 11,
    title: 'Финал: 0 и 1',
    subtitle: 'Порог 80%',
    icon: 'i-lucide-trophy',
    accentColor: 'amber',
    estimatedMinutes: 3,
    xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Умножение на 0 и 1 · Урок 3',
      questions: [
        { id: 'm1', prompt: '$17 \\times 1$ =', kind: 'numeric', correctAnswer: 17, conceptTag: 'one', cognitiveLevel: 'recall' },
        { id: 'm2', prompt: '$42 \\times 0$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'm3', prompt: '$1 \\times 89$ =', kind: 'numeric', correctAnswer: 89, conceptTag: 'one', cognitiveLevel: 'recall' },
        { id: 'm4', prompt: '$0 \\times 104$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'm5', prompt: 'Что происходит при × на 1?', kind: 'choice', options: ['Удваивается', 'Остаётся тем же', 'Становится 1'], correctIndex: 1, conceptTag: 'rule', cognitiveLevel: 'understand' },
        { id: 'm6', prompt: 'Что получается при × на 0?', kind: 'choice', options: ['Само число', '0', '1'], correctIndex: 1, conceptTag: 'rule', cognitiveLevel: 'understand' },
        { id: 'm7', prompt: '$0 \\times 0$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'm8', prompt: 'Если $36 \\times 1 = 36$, то $1 \\times 36$?', kind: 'numeric', correctAnswer: 36, conceptTag: 'commutative', cognitiveLevel: 'transfer' },
        { id: 'm9', prompt: 'Какое выражение даёт 0?', kind: 'choice', options: ['5 + 0', '5 × 0', '5 × 1'], correctIndex: 1, conceptTag: 'discriminate', cognitiveLevel: 'analyze' },
        { id: 'm10', prompt: '$1 \\times 1$ =', kind: 'numeric', correctAnswer: 1, conceptTag: 'one', cognitiveLevel: 'recall' }
      ],
      questionPool: [
        { id: 'p1', prompt: '$23 \\times 1$ =', kind: 'numeric', correctAnswer: 23, conceptTag: 'one', cognitiveLevel: 'recall' },
        { id: 'p2', prompt: '$58 \\times 0$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'p3', prompt: '$1 \\times 14$ =', kind: 'numeric', correctAnswer: 14, conceptTag: 'one', cognitiveLevel: 'recall' },
        { id: 'p4', prompt: '$0 \\times 200$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'zero', cognitiveLevel: 'recall' },
        { id: 'p5', prompt: 'Какое всегда даёт само число?', kind: 'choice', options: ['+ 0', '× 0', '× 1'], correctIndex: 2, conceptTag: 'rule', cognitiveLevel: 'understand' },
        { id: 'p6', prompt: 'Какое всегда даёт 0?', kind: 'choice', options: ['+ 1', '× 1', '× 0'], correctIndex: 2, conceptTag: 'rule', cognitiveLevel: 'understand' },
        { id: 'p7', prompt: '$1 \\times 0$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'mixed', cognitiveLevel: 'apply' },
        { id: 'p8', prompt: '$0 \\times 1$ =', kind: 'numeric', correctAnswer: 0, conceptTag: 'mixed', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 4 — Первые задачи на умножение (full 11 layers)
  // ═════════════════════════════════════════════════════════════════════
  const FP = lessonIds.firstProblems

  await insertLayer({
    lessonId: FP,
    layerType: 'HOOK',
    orderIndex: 1,
    title: 'Задача из жизни',
    subtitle: 'Где пригодится умножение',
    icon: 'i-lucide-sparkles',
    accentColor: 'amber',
    estimatedMinutes: 1,
    xpReward: 10,
    content: {
      kind: 'HOOK',
      mediaKind: 'animation',
      headline: 'Задача из жизни',
      body: 'В коробке 6 карандашей. Сколько в 4 таких коробках?',
      mascotEntry: 'cheer',
      bgPattern: 'confetti',
      successSfx: 'sparkle',
      frames: [
        { emoji: '✏️', accent: 'amber', caption: 'В коробке 6 карандашей' },
        { emoji: '📦', accent: 'sky', caption: '4 коробки — повторение!' },
        { emoji: '⚡', accent: 'emerald', caption: '4 × 6 = 24' }
      ],
      prompt: 'Сколько получится: 4 × 6?',
      emojiChoices: [
        { id: '24', emoji: '🥇', label: '24', isPrimary: true },
        { id: '10', emoji: '🤔', label: '10' },
        { id: '64', emoji: '🤷', label: '64' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'DIAGNOSTIC',
    orderIndex: 2,
    title: 'Смотрим задачи',
    subtitle: 'Четыре жизненные ситуации',
    icon: 'i-lucide-stethoscope',
    accentColor: 'sky',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'q1', prompt: 'В классе 4 ряда по 5 парт. Сколько парт?', options: ['9', '20', '45'], correctIndex: 1, explanation: '4 × 5 = 20.' },
        { id: 'q2', prompt: '1 книга стоит 200 тг. Сколько стоят 3?', options: ['203', '600', '2003'], correctIndex: 1, explanation: '3 × 200 = 600.' },
        { id: 'q3', prompt: 'У 5 кошек по 4 лапы. Какое действие?', options: ['5 + 4', '5 × 4', '5 − 4'], correctIndex: 1, explanation: 'Одинаковая группа повторяется 5 раз.' },
        { id: 'q4', prompt: '3 пакета, в каждом 8 яблок. Сколько?', options: ['11', '24', '38'], correctIndex: 1, explanation: '3 × 8 = 24.' }
      ]
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'INTUITION',
    orderIndex: 3,
    title: 'Почувствуй задачу',
    subtitle: 'Собери ответ по «кусочкам»',
    icon: 'i-lucide-wand-sparkles',
    accentColor: 'cyan',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 6, minCols: 1, maxCols: 6, defaultRows: 4, defaultCols: 5 },
      copy: {
        headline: 'Представь: в классе 4 ряда по 5 парт. Собери такую картинку.',
        body: 'А теперь «проиграй» задачу — картинка отвечает на вопрос «сколько всего».'
      },
      probes: [
        { id: 'p1', prompt: '4 ряда по 5 парт — сколько парт всего?', options: ['9', '20', '45'], correctIndex: 1, explanation: '4 × 5 = 20.' },
        { id: 'p2', prompt: 'А если будет 3 ряда по 5 — что изменится?', options: ['Ничего', 'Станет меньше', 'Станет больше'], correctIndex: 1, explanation: 'Меньше рядов — меньше парт: 3 × 5 = 15.' },
        { id: 'p3', prompt: 'Что повторяется в этой задаче?', options: ['Парты', 'Ряды'], correctIndex: 0, explanation: 'Парты повторяются в каждом ряду по 5 штук.' }
      ]
    },
    completionCriteria: { minInteractions: 3 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'EXPLANATION',
    orderIndex: 4,
    title: 'Три шага к ответу',
    subtitle: 'Алгоритм решения любой задачи',
    icon: 'i-lucide-graduation-cap',
    accentColor: 'emerald',
    estimatedMinutes: 6,
    xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c0', kind: 'comic',
          content: 'Алгоритм 3 шагов',
          panels: [
            { emoji: '🔍', accent: 'sky', caption: '1. Что повторяется?' },
            { emoji: '🔢', accent: 'amber', caption: '2. Сколько раз?' },
            { emoji: '✖️', accent: 'emerald', caption: '3. Перемножь!' }
          ]
        },
        { id: 'c1', kind: 'text', content: 'Чтобы решить задачу про одинаковые группы — действуй в **три шага**.' },
        { id: 'c2', kind: 'callout', emphasis: true, speakable: true, content: '**Шаг 1.** Найди что повторяется. **Шаг 2.** Найди сколько раз. **Шаг 3.** Перемножь.' },
        { id: 'c3', kind: 'text', content: 'Пример: «В 3 ящиках по 6 яблок. Сколько яблок?». Повторяется — 6 яблок. Сколько раз — 3. Умножаем: 3 × 6 = 18.' },
        { id: 'c4', kind: 'formula', content: '\\text{сколько раз} \\times \\text{что повторяется} = \\text{всего}' }
      ],
      checks: [
        { id: 'ch1', prompt: 'В 5 корзинах по 4 мяча. Что такое «4» в этой задаче?', options: ['Сколько групп', 'Что повторяется', 'Всего'], correctIndex: 1, explanation: '«4 мяча» — это то, что повторяется в каждой корзине.' },
        { id: 'ch2', prompt: 'В 5 корзинах по 4 мяча. Какое действие нужно?', options: ['5 + 4', '5 × 4', '5 − 4'], correctIndex: 1, explanation: 'Одинаковые группы — всегда умножение: 5 × 4 = 20.' },
        { id: 'ch3', prompt: 'В 5 корзинах по 4 мяча. Сколько мячей всего?', options: ['9', '20', '45'], correctIndex: 1, explanation: '5 × 4 = 20.' }
      ]
    },
    completionCriteria: { minInteractions: 3, minAccuracy: 60 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'FORMALIZATION',
    orderIndex: 5,
    title: 'Схема задачи',
    subtitle: 'Оформляем решение правильно',
    icon: 'i-lucide-book-open',
    accentColor: 'violet',
    estimatedMinutes: 2,
    xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      diagramTitle: 'Схема: группы × что в группе = всего',
      anatomy: [
        { id: 'groups', label: 'Сколько групп', role: 'первый множитель', value: '5', accent: 'emerald' },
        { id: 'x1', label: '×', role: 'знак', value: '×', accent: 'sky' },
        { id: 'per', label: 'Что в группе', role: 'второй множитель', value: '4', accent: 'violet' },
        { id: 'eq', label: '=', role: 'равно', value: '=', accent: 'amber' },
        { id: 'total', label: 'Всего', role: 'произведение', value: '20', accent: 'rose' }
      ],
      voiceTerms: true,
      terms: [
        { term: 'Что повторяется', definition: 'Объект одной группы.', example: 'В 5 корзинах по 4 мяча — повторяется 4.', speakText: 'Что повторяется — объект каждой группы' },
        { term: 'Сколько раз', definition: 'Количество одинаковых групп.', example: '5 корзин = 5 раз.', speakText: 'Сколько раз — количество групп' },
        { term: 'Всего', definition: 'Произведение — итог.', example: '5 × 4 = 20 мячей.', speakText: 'Всего — это произведение' }
      ],
      buildTask: {
        prompt: 'В 3 коробках по 6 яиц. Собери равенство.',
        template: '___ × ___ = ___',
        expected: ['3', '6', '18'],
        distractors: ['9', '36', '63', '0', '1']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'WALKTHROUGH',
    orderIndex: 6,
    title: 'Разбор задач',
    subtitle: 'С подсказками — и самостоятельно',
    icon: 'i-lucide-lightbulb',
    accentColor: 'yellow',
    estimatedMinutes: 4,
    xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Три задачи: первую — вместе, вторую — частично сам, третью — полностью сам.',
      examples: [
        {
          id: 'e1',
          problem: 'В автобусе 6 рядов, в каждом по 4 кресла. Сколько кресел в автобусе?',
          prefilledSteps: 4,
          steps: [
            { index: 1, title: 'Что повторяется', explanation: 'В каждом ряду по **4** кресла.', action: { kind: 'numeric', prompt: 'Что повторяется?', expected: 4 } },
            { index: 2, title: 'Сколько раз', explanation: 'Рядов **6**.', action: { kind: 'numeric', prompt: 'Сколько раз?', expected: 6 } },
            { index: 3, title: 'Составляем выражение', explanation: '$6 \\times 4$.', action: { kind: 'choice', prompt: 'Какое выражение подходит?', options: ['6 + 4', '6 × 4', '6 − 4'], correctIndex: 1 } },
            { index: 4, title: 'Считаем', explanation: '$6 \\times 4 = 24$. **24 кресла.**', action: { kind: 'numeric', prompt: '6 × 4 =', expected: 24 } }
          ]
        },
        {
          id: 'e2',
          problem: 'В 5 пачках по 8 печений. Сколько печений всего?',
          prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Что повторяется и сколько раз', explanation: 'В каждой пачке 8 печений, пачек 5.', action: { kind: 'numeric', prompt: 'Сколько печений в одной пачке?', expected: 8 } },
            { index: 2, title: 'Какое действие', explanation: 'Выбери подходящее.', action: { kind: 'choice', prompt: 'Как запишем?', options: ['5 + 8', '5 × 8', '8 − 5'], correctIndex: 1 } },
            { index: 3, title: 'Ответ', explanation: 'Посчитай результат.', action: { kind: 'numeric', prompt: '5 × 8 =', expected: 40 } }
          ]
        },
        {
          id: 'e3',
          problem: 'У 7 подруг по 3 заколки. Сколько всего заколок?',
          prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что повторяется', explanation: 'Что есть у каждой подруги?', action: { kind: 'numeric', prompt: 'У каждой:', expected: 3 } },
            { index: 2, title: 'Сколько раз', explanation: 'Сколько подруг?', action: { kind: 'numeric', prompt: 'Подруг:', expected: 7 } },
            { index: 3, title: 'Ответ', explanation: 'Перемножь.', action: { kind: 'numeric', prompt: '7 × 3 =', expected: 21 } }
          ]
        }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'TRAINER',
    orderIndex: 7,
    title: 'Тренажёр: задачи из жизни',
    subtitle: 'Набери 6 правильных',
    icon: 'i-lucide-dumbbell',
    accentColor: 'emerald',
    estimatedMinutes: 5,
    xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair — задача → ответ
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: '4 кор × 5 конфет' },
            { id: 'L2', label: '3 кот × 4 лапы' },
            { id: 'L3', label: '6 пак × 2 ябл' },
            { id: 'L4', label: '7 бук × 3 розы' }
          ],
          right: [
            { id: 'R1', label: '20', pairId: 'L1' },
            { id: 'R2', label: '12', pairId: 'L2' },
            { id: 'R3', label: '12', pairId: 'L3' },
            { id: 'R4', label: '21', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: 'В 6 пакетах по 2 яблока. Какое действие?', options: ['6 + 2', '6 × 2', '6 − 2'], correctIndex: 1, conceptTag: 'choose' },
        { kind: 'numeric', id: 't3', prompt: '1 тетрадь стоит 150 тг. Сколько 4 тетради?', correctAnswer: 600, hint: '4 × 150.', conceptTag: 'word' },
        { kind: 'numeric', id: 't4', prompt: 'В 2 пачках по 8 фломастеров. Сколько всего?', correctAnswer: 16, hint: '2 × 8.', conceptTag: 'word' },
        { kind: 'choice', id: 't5', prompt: 'В классе 3 группы по 5 учеников. Всего?', options: ['8', '15', '35'], correctIndex: 1, conceptTag: 'word' },
        { kind: 'numeric', id: 't6', prompt: 'У 5 пауков по 8 ног. Сколько ног?', correctAnswer: 40, hint: '5 × 8.', conceptTag: 'word' },
        { kind: 'numeric', id: 't7', prompt: 'В 4 ящиках по 9 яблок. Сколько?', correctAnswer: 36, hint: '4 × 9.', conceptTag: 'word' }
      ],
      socraticHints: {
        t3: ['Одна тетрадь — 150 тг. Повторить 4 раза.'],
        t6: ['8 + 8 + 8 + 8 + 8 = ?']
      }
    },
    completionCriteria: { minCorrect: 6 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'SCENARIO',
    orderIndex: 8,
    title: 'Школьный базар',
    subtitle: 'Продаёшь товары для первоклашек',
    icon: 'i-lucide-store',
    accentColor: 'orange',
    estimatedMinutes: 5,
    xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Школьный базар',
        roleplay: 'Ты за прилавком школьного базара. Товары продаются наборами — посчитай стоимость.',
        characterName: 'Феми',
        mascotLine: 'Думай: что повторяется и сколько раз. Это умножение!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Асан', request: '3 ручки по 80 тг. Сколько?', correct: 240, unit: 'тг', wrongFeedback: '3 × 80 = 240.', revenueReward: 240, reputationReward: 1 },
        { id: 'o2', customer: 'Динара', request: '5 наклеек по 20 тг. Сколько?', correct: 100, unit: 'тг', wrongFeedback: '5 × 20 = 100.', revenueReward: 100, reputationReward: 1 },
        { id: 'o3', customer: 'Кл. руководитель', request: '4 тетради по 150 тг. Сколько?', correct: 600, unit: 'тг', wrongFeedback: '4 × 150 = 600.', revenueReward: 600, reputationReward: 1 },
        { id: 'o4', customer: 'Мама с детьми', request: '2 ланч-бокса по 250 тг. Сколько?', correct: 500, unit: 'тг', wrongFeedback: '2 × 250 = 500.', revenueReward: 500, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный заказ',
        request: 'Финал: 6 рюкзаков по 800 тг. Итого?',
        correct: 4800,
        unit: 'тг',
        wrongFeedback: '6 × 800 = 4800.',
        revenueReward: 1000,
        reputationReward: 3
      }
    },
    completionCriteria: { minInteractions: 4 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'TRAPS',
    orderIndex: 9,
    title: 'Ловушки текстовых задач',
    subtitle: 'Не путай действия',
    icon: 'i-lucide-alert-triangle',
    accentColor: 'rose',
    estimatedMinutes: 3,
    xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток задач', emoji: '🎯' },
      intro: 'Самые частые ошибки в задачах. Научись их видеть сразу.',
      traps: [
        { id: 'trap1', wrongStatement: '«3 пакета по 5 конфет» → **3 + 5 = 8** конфет', whyWrong: 'Когда объект повторяется одинаковыми группами — это **умножение**, а не сложение.', correctStatement: '3 × 5 = 15 конфет', rememberNote: 'Слова «по» и «в каждом» — почти всегда подсказка к умножению.', example: '3 пакета **по** 5 → 3 × 5 = 15.' },
        { id: 'trap2', wrongStatement: '«В 4 ящиках 12 яблок» — значит в каждом **12**', whyWrong: '«Всего 12 в 4 ящиках» — это означает, что на ящик приходится меньше. Это уже другая задача (деление).', correctStatement: 'Если в КАЖДОМ по 12 — тогда всего 4 × 12 = 48.', rememberNote: 'Внимательно читай: «по 12 в каждом» ≠ «всего 12».', example: 'Разные условия — разные задачи.' },
        { id: 'trap3', wrongStatement: '«Саша купил 3 карандаша и 4 тетради. Сколько всего?» → $3 × 4 = 12$', whyWrong: 'Тут **разные** предметы. Умножение подходит, только когда группы **одинаковые**. Иначе — сложение.', correctStatement: '3 + 4 = 7 предметов', rememberNote: 'Умножение — это когда одна и та же группа повторяется.', example: '3 карандаша — это одна группа, 4 тетради — другая. Тогда просто сложение.' }
      ]
    },
    completionCriteria: { minInteractions: 3 }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'TEACH_BACK',
    orderIndex: 10,
    title: 'Расскажи, как решать задачу',
    subtitle: 'Объясни другу трёхшаговую схему',
    icon: 'i-lucide-megaphone',
    accentColor: 'pink',
    estimatedMinutes: 4,
    xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как решать задачу с одинаковыми группами',
      minSentences: 3,
      coverPrompts: [
        'Как узнать, что в задаче нужно умножение',
        'Назови три шага решения',
        'Приведи свой пример задачи',
        'Объясни, когда умножение НЕ подходит'
      ],
      requiredConcepts: ['одинаковые группы', 'что повторяется', 'сколько раз', 'всего'],
      conceptKeywords: {
        'одинаковые группы': ['одинаков', 'групп', 'каждом'],
        'что повторяется': ['повторя', 'повтор'],
        'сколько раз': ['сколько раз', 'сколько групп'],
        'всего': ['всего', 'итого', 'произведение']
      },
      referenceAnswer: 'Если в задаче одна и та же группа повторяется несколько раз — это умножение. Действовать надо в три шага: 1) найти, что повторяется, 2) найти, сколько раз, 3) перемножить — это «сколько всего». Например, в 4 ящиках по 5 яблок: повторяется 5, повторяется 4 раза, всего 4 × 5 = 20. А если группы разные — там сложение.'
    },
    completionCriteria: { minLength: 100, requiredConcepts: ['одинаковые группы', 'повторяется'] }
  })

  await insertLayer({
    lessonId: FP,
    layerType: 'MASTERY_CHECK',
    orderIndex: 11,
    title: 'Финал: задачи',
    subtitle: '80% — и капсула пройдена',
    icon: 'i-lucide-trophy',
    accentColor: 'amber',
    estimatedMinutes: 4,
    xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Первые задачи на умножение · Урок 4',
      questions: [
        { id: 'm1', prompt: 'В 5 коробках по 6 шариков. Сколько?', kind: 'choice', options: ['11', '30', '65'], correctIndex: 1, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm2', prompt: 'У 4 собак по 4 лапы. Сколько лап?', kind: 'numeric', correctAnswer: 16, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm3', prompt: 'В 3 вазах по 7 тюльпанов. Сколько?', kind: 'numeric', correctAnswer: 21, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm4', prompt: 'Какое действие: «8 рядов по 5 стульев»?', kind: 'choice', options: ['8 + 5', '8 × 5', '8 − 5'], correctIndex: 1, conceptTag: 'choose', cognitiveLevel: 'analyze' },
        { id: 'm5', prompt: '1 фломастер 120 тг. Сколько 3?', kind: 'numeric', correctAnswer: 360, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm6', prompt: 'В 2 упаковках по 9 печений. Сколько?', kind: 'numeric', correctAnswer: 18, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm7', prompt: '«Саша купил 4 яблока и 3 груши.» Действие?', kind: 'choice', options: ['4 + 3', '4 × 3', '4 − 3'], correctIndex: 0, conceptTag: 'trap', cognitiveLevel: 'analyze' },
        { id: 'm8', prompt: 'У 6 пауков по 8 ног. Сколько?', kind: 'numeric', correctAnswer: 48, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm9', prompt: 'В 3 коробках по 10 карандашей. Сколько?', kind: 'numeric', correctAnswer: 30, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'm10', prompt: 'Подсказка к умножению — это…', kind: 'choice', options: ['«всего разных»', '«по … в каждом»', '«осталось»'], correctIndex: 1, conceptTag: 'strategy', cognitiveLevel: 'understand' }
      ],
      questionPool: [
        { id: 'p1', prompt: 'В 6 пакетах по 5 яблок. Сколько?', kind: 'choice', options: ['11', '30', '60'], correctIndex: 1, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p2', prompt: 'У 5 пчёл по 6 ножек. Сколько?', kind: 'numeric', correctAnswer: 30, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p3', prompt: 'В 4 банках по 8 конфет. Сколько?', kind: 'numeric', correctAnswer: 32, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p4', prompt: 'Действие: «У 7 коз по 4 копыта»?', kind: 'choice', options: ['7 + 4', '7 × 4', '7 − 4'], correctIndex: 1, conceptTag: 'choose', cognitiveLevel: 'analyze' },
        { id: 'p5', prompt: '1 наклейка 30 тг. Сколько 5?', kind: 'numeric', correctAnswer: 150, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p6', prompt: 'В 3 пачках по 6 печенек. Сколько?', kind: 'numeric', correctAnswer: 18, conceptTag: 'word', cognitiveLevel: 'apply' },
        { id: 'p7', prompt: '«Аня купила 5 ручек и 2 ластика». Действие?', kind: 'choice', options: ['5 + 2', '5 × 2', '5 − 2'], correctIndex: 0, conceptTag: 'trap', cognitiveLevel: 'analyze' },
        { id: 'p8', prompt: 'В 8 коробках по 7 ластиков. Сколько?', kind: 'numeric', correctAnswer: 56, conceptTag: 'word', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return {
    ok: true,
    insertedByLesson,
    lessons: Object.entries(lessonIds).map(([k, v]) => ({ key: k, id: v }))
  }
})
