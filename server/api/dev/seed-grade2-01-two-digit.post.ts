import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * Seeds all 11 capsule layers for every lesson of «Двузначные числа» (2 класс).
 *
 *   1. Образование двузначных чисел и счёт десятками
 *   2. Чтение, запись и сравнение двузначных
 *   3. Разрядный состав и графические модели
 *
 * S6-PILOT: эталонная тема, использует все новые возможности 2-го класса:
 *   - HOOK с cinematic frames + эмодзи-плитками (S2)
 *   - DIAGNOSTIC с hearts + tap-correct (S2)
 *   - INTUITION на place-value-blocks и balance-scale виджетах (S2)
 *   - EXPLANATION с comic-chunks и tap-reveal (S3)
 *   - FORMALIZATION с voice-озвучкой и distractors (S3)
 *   - WALKTHROUGH с visual.kind='board' пошаговая анимация (S3)
 *   - TRAINER с tap-pair (S4)
 *   - SCENARIO theme='space' + boss + combo (S4)
 *   - TRAPS mode='spot' + bug-hunter (S4)
 *   - TEACH_BACK voice-first + conceptKeywords (S5)
 *   - MASTERY trophyThresholds + questionPool + share (S5)
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Двузначные числа')

  const L1 = lessonIds['Образование двузначных чисел и счёт десятками']
  const L2 = lessonIds['Чтение, запись и сравнение двузначных']
  const L3 = lessonIds['Разрядный состав и графические модели']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Двузначные числа»' })

  const allIds = [L1, L2, L3]
  await wipeLayersForLessons(supabase, allIds)

  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Образование двузначных чисел и счёт десятками
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Сколько яблок в коробке?',
    subtitle: 'И зачем нам новая единица счёта',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Считать поштучно — долго!',
      body: 'Когда предметов много, удобно связывать их в десятки.',
      mascotEntry: 'greet',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🍎', accent: 'rose', caption: '50 яблок поштучно — это очень долго!', subCaption: 'Раз, два, три... запутаешься' },
        { emoji: '📦', accent: 'amber', caption: 'А если связать их в коробки по 10?', subCaption: '5 коробок — и всё посчитано' },
        { emoji: '⚡', accent: 'sky', caption: 'Десяток = 10 единиц в одном пучке', subCaption: 'Это быстрее в 10 раз' }
      ],
      prompt: 'Что быстрее посчитать?',
      emojiChoices: [
        { id: 'a', emoji: '🐌', label: 'По одной — точно' },
        { id: 'b', emoji: '🚀', label: 'Десятками — быстро', isPrimary: true },
        { id: 'c', emoji: '🤷', label: 'На глаз' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что ты уже знаешь про десятки?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Сколько единиц в одном десятке?', options: ['5', '10', '20', '100'], correctIndex: 1, explanation: 'Десяток — это ровно 10 единиц.', conceptTag: 'десяток' },
        { id: 'd2', prompt: 'В числе 30 сколько десятков?', options: ['1', '3', '30', '0'], correctIndex: 1, explanation: '30 — это три десятка по 10 единиц.', conceptTag: 'круглые-десятки' },
        { id: 'd3', prompt: 'Сколько единиц в числе 50?', options: ['5', '50', '500', '0'], correctIndex: 1, explanation: '50 — это 5 десятков, или 50 единиц.', conceptTag: 'единицы-в-десятках' },
        { id: 'd4', prompt: 'Какое число идёт сразу после 39?', options: ['30', '40', '49', '50'], correctIndex: 1, explanation: 'После 39 идёт 40 — целый новый десяток.', conceptTag: 'переход' }
      ],
      adaptiveHints: [{ onMissConcept: 'десяток', followUpIds: ['d2', 'd3'] }]
    },
    completionCriteria: { minAccuracy: 50, minCorrect: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Собери число из блоков',
    subtitle: 'Добавляй десятки и единицы — наблюдай как растёт число',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      // S2: новый виджет place-value-blocks (блоки Дьенеша)
      widget: { type: 'place-value-blocks', maxHundreds: 0, maxTens: 9, maxOnes: 9, target: 47 },
      probes: [
        { id: 'p1', prompt: 'Если у тебя 4 пучка по 10 карандашей — сколько всего?', options: ['14', '40', '4', '44'], correctIndex: 1, explanation: '4 десятка = 40 карандашей.' },
        { id: 'p2', prompt: 'Сколько десятков нужно набрать, чтобы получить 70?', options: ['7', '70', '17', '0'], correctIndex: 0, explanation: '70 содержит 7 десятков.' },
        { id: 'p3', prompt: 'Собери число 47 на блоках. Сколько десятков?', options: ['4', '7', '40', '47'], correctIndex: 0, explanation: '47 = 4 десятка + 7 единиц.' }
      ],
      copy: {
        headline: 'Десяток — пучок из 10 единиц',
        body: 'Большие количества удобно объединять в десятки. Тогда любое двузначное число легко собрать как сумму десятков и единиц.'
      }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как образуются двузначные числа',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        // S3: comic-strip — 3 панели вместо стены текста
        {
          id: 'c1', kind: 'comic',
          content: 'Как «рождается» двузначное число',
          panels: [
            { emoji: '1️⃣', accent: 'amber', caption: 'Считаем поштучно — это единицы' },
            { emoji: '🔟', accent: 'sky', caption: 'Связали 10 в пучок — это десяток' },
            { emoji: '🔢', accent: 'emerald', caption: 'Десятки + единицы = двузначное' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: 'Левая цифра показывает **десятки**, правая — **единицы**.',
          emphasis: true,
          speakable: true
        },
        // S3: tap-reveal — спрятали детальное правило за тапом
        {
          id: 'c3', kind: 'tap-reveal',
          content: 'А что значит число 47?',
          revealedKind: 'formula',
          revealedContent: '47 = 4 \\cdot 10 + 7',
          revealedHint: '4 десятка плюс 7 единиц',
          speakable: true
        },
        { id: 'c4', kind: 'text', content: 'Если считать десятками: 10, 20, 30 ... — это **счёт десятками**. Аналогично можно считать пятёрками или двойками.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'В числе 62 сколько десятков?', options: ['2', '6', '60', '62'], correctIndex: 1, explanation: 'Левая цифра — 6, значит 6 десятков.' },
        { id: 'ch2', prompt: 'Какое число равно 8 десятков и 5 единиц?', options: ['58', '85', '13', '805'], correctIndex: 1, explanation: '8 десятков = 80, плюс 5 единиц = 85.' },
        { id: 'ch3', prompt: 'Что больше: 9 десятков или 90 единиц?', options: ['9 десятков больше', 'Поровну', '90 единиц больше', 'Нельзя сравнить'], correctIndex: 1, explanation: '9 десятков = 90 единиц. Это одно и то же.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Анатомия двузначного числа',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Разряды числа 47',
      anatomy: [
        { id: 'a1', label: '4', role: 'разряд десятков', value: '40', accent: 'sky' },
        { id: 'a2', label: '7', role: 'разряд единиц', value: '7', accent: 'amber' }
      ],
      terms: [
        {
          term: 'Двузначное число',
          definition: 'Натуральное число от 10 до 99 — записывается двумя цифрами.',
          example: '13, 47, 99',
          speakText: 'Двузначное число — это число от десяти до девяноста девяти'
        },
        {
          term: 'Разряд десятков',
          definition: 'Левая цифра в двузначном числе. Показывает число полных десятков.',
          example: 'В 56 разряд десятков — 5',
          speakText: 'Разряд десятков — левая цифра, показывает сколько полных десятков'
        },
        {
          term: 'Разряд единиц',
          definition: 'Правая цифра в двузначном числе. Показывает оставшиеся единицы.',
          example: 'В 56 разряд единиц — 6',
          speakText: 'Разряд единиц — правая цифра, показывает оставшиеся единицы'
        }
      ],
      buildTask: {
        prompt: 'Собери число «3 десятка и 8 единиц»:',
        template: '___ десятков и ___ единиц = ___',
        expected: ['3', '8', '38'],
        distractors: ['30', '5', '83', '0', '13']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Как считать десятками',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Разберём, как быстро считать двузначные числа десятками — на примере карандашей в коробках.',
      examples: [
        {
          id: 'ex1',
          problem: 'В коробке 10 карандашей. У Айгерим 6 таких коробок. Сколько у неё карандашей всего?',
          prefilledSteps: 0,
          steps: [
            {
              index: 1, title: 'Что нам известно?',
              explanation: 'В каждой коробке — 10 карандашей. Коробок — 6.',
              // S3: визуал шага — эмодзи иллюстрация
              visual: { kind: 'emoji', emoji: '📦' },
              action: { kind: 'numeric', prompt: 'Сколько коробок?', expected: 6 }
            },
            {
              index: 2, title: 'Считаем десятками',
              explanation: 'Каждая коробка = 1 десяток. Тогда 6 коробок = 6 десятков.',
              visual: {
                kind: 'board',
                boardLines: ['1 коробка = 10 карандашей', '6 коробок = 6 \\cdot 10', '= 60 карандашей']
              },
              action: { kind: 'choice', prompt: '6 десятков — это сколько единиц?', options: ['6', '60', '16', '600'], correctIndex: 1 }
            },
            {
              index: 3, title: 'Записываем ответ',
              explanation: '6 десятков = 60. У Айгерим 60 карандашей.',
              action: { kind: 'numeric', prompt: 'Сколько карандашей у Айгерим?', expected: 60 }
            }
          ]
        },
        {
          id: 'ex2',
          problem: 'У Армана 3 пачки печенья по 10 штук и ещё 4 печенья отдельно. Сколько всего?',
          prefilledSteps: 1,
          steps: [
            {
              index: 1, title: 'Раскладываем на десятки и единицы',
              explanation: '3 пачки по 10 = 3 десятка. Плюс 4 единицы.',
              visual: { kind: 'board', boardLines: ['3 пачки = 3 \\cdot 10 = 30', '+ 4 единицы', '= 34'] },
              action: { kind: 'numeric', prompt: 'Сколько десятков?', expected: 3 }
            },
            {
              index: 2, title: 'Собираем число',
              explanation: '3 десятка и 4 единицы — это 34.',
              visual: { kind: 'emoji', emoji: '🍪' },
              action: { kind: 'numeric', prompt: 'Сколько печенья всего?', expected: 34 }
            }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируемся: десятки и единицы',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: новый kind tap-pair — соединить десятки с их значениями
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини запись с её значением',
          left: [
            { id: 'L3', label: '3 десятка' },
            { id: 'L5', label: '5 десятков' },
            { id: 'L7', label: '7 десятков' },
            { id: 'L9', label: '9 десятков' }
          ],
          right: [
            { id: 'R30', label: '30', pairId: 'L3' },
            { id: 'R50', label: '50', pairId: 'L5' },
            { id: 'R70', label: '70', pairId: 'L7' },
            { id: 'R90', label: '90', pairId: 'L9' }
          ],
          conceptTag: 'десятки↔значение'
        },
        { kind: 'numeric', id: 't2', prompt: '5 десятков и 2 единицы — какое это число?', correctAnswer: 52 },
        { kind: 'numeric', id: 't3', prompt: 'Сколько десятков в 70?', correctAnswer: 7 },
        { kind: 'choice', id: 't4', prompt: 'Какое число идёт после 49?', options: ['40', '50', '59', '500'], correctIndex: 1 },
        { kind: 'numeric', id: 't5', prompt: '8 десятков — это сколько?', correctAnswer: 80 },
        { kind: 'choice', id: 't6', prompt: 'В числе 73 разряд единиц — это:', options: ['7', '3', '70', '30'], correctIndex: 1 },
        { kind: 'numeric', id: 't7', prompt: 'Запиши число «9 десятков»', correctAnswer: 90 },
        { kind: 'choice', id: 't8', prompt: 'Какое число НЕ круглое?', options: ['20', '50', '47', '90'], correctIndex: 2 }
      ],
      socraticHints: {
        t2: ['Пять десятков — это 50', 'К 50 прибавь 2'],
        t3: ['Левая цифра показывает десятки', 'Считай пучки по 10'],
        t5: ['Каждый десяток = 10', '8 раз по 10 — это сколько?']
      }
    },
    completionCriteria: { minCorrect: 6 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Космическая база',
    icon: 'i-lucide-rocket', accentColor: 'violet', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      // S4: theme='space' — космос для двузначных
      theme: 'space',
      setting: {
        title: 'Космодром «Байконур»',
        roleplay: 'Ты бортинженер. Готовишь груз для запуска: считаешь припасы пачками по 10 — так быстрее.',
        location: 'Орбитальная станция',
        characterName: 'Капитан Алишер',
        mascotLine: '1 контейнер = 1 десяток. Считай пучками — сэкономишь топливо!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      // S4: combo-bonus за подряд верные
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Командир Алия', request: 'Загрузи 4 контейнера тетрадей по 10. Сколько тетрадей всего?', correct: 40, wrongFeedback: '4 десятка = 40 тетрадей.', revenueReward: 200, reputationReward: 1 },
        { id: 'o2', customer: 'Биолог Дана', request: '2 пачки семян по 10 шт + 5 одиночных. Сколько всего?', correct: 25, wrongFeedback: '2 десятка = 20, плюс 5 = 25.', revenueReward: 150, reputationReward: 1 },
        { id: 'o3', customer: 'Инженер Бакыт', request: 'Заказ — 8 модулей по 10 болтов. Сколько болтов?', correct: 80, wrongFeedback: '8 десятков = 80.', revenueReward: 400, reputationReward: 1 },
        { id: 'o4', customer: 'Доктор Арман', request: '3 десятка таблеток для аптечки. Сколько штук?', correct: 30, wrongFeedback: '3 десятка = 30 штук.', revenueReward: 100, reputationReward: 1 }
      ],
      // S4: финальный «босс» с x2 наградой
      boss: {
        id: 'boss',
        customer: 'ЦУП — Центр управления',
        request: 'Финал: загрузи 9 десятков провианта плюс 9 одиночных. Сколько всего штук?',
        correct: 99,
        wrongFeedback: '9 десятков = 90, плюс 9 = 99.',
        revenueReward: 300,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Частые ошибки',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      // S4: классический flip остаётся, но добавим bug-hunter
      mode: 'flip',
      bugHunterBadge: { label: 'Охотник на ошибки', emoji: '🐞' },
      intro: 'Вот ошибки, которые делают почти все. Запомни — и не повторяй.',
      traps: [
        { id: 'tr1', wrongStatement: '«4 десятка — это 4»', whyWrong: 'Десяток — это пучок из 10 единиц, а не одна единица. 4 десятка = 4 \\cdot 10 = 40.', correctStatement: '4 десятка = 40', rememberNote: 'Десяток ≠ единица. 1 десяток = 10 единиц.', example: '5 десятков = 50, а не 5' },
        { id: 'tr2', wrongStatement: '«В 52 — пять единиц и два десятка»', whyWrong: 'Перепутаны разряды. **Левая** цифра — десятки, **правая** — единицы.', correctStatement: 'В 52 — пять десятков и две единицы', rememberNote: 'Слева десятки, справа единицы.' },
        { id: 'tr3', wrongStatement: '«После 29 идёт 20»', whyWrong: 'После 29 десятки увеличиваются: 29 → 30. 20 шло раньше.', correctStatement: 'После 29 идёт 30', rememberNote: 'На «9» в единицах десяток меняется.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи младшему брату',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату — он только пошёл в первый класс',
      voicePrompt: 'Нажми на микрофон и расскажи, что такое десяток',
      coverPrompts: [
        'Что такое десяток?',
        'Зачем нужен счёт десятками?',
        'Как из десятков и единиц получить двузначное число?'
      ],
      referenceAnswer: 'Десяток — это пучок из 10 единиц. Когда предметов много, считать поштучно долго, поэтому удобно связывать их в десятки. Любое двузначное число — это сколько-то десятков плюс сколько-то единиц. Например, 47 — это 4 пучка по 10 (40) и ещё 7 отдельных (7), вместе 47.',
      requiredConcepts: ['десяток', 'единицы', 'двузначное'],
      // S5: ключевые слова для realtime подсветки concept-чипов
      conceptKeywords: {
        десяток: ['десят', 'пучок', 'десяток'],
        единицы: ['единиц', 'единичк', 'штук'],
        двузначное: ['двузначн', 'два знак', 'две цифр']
      },
      minSentences: 3,
      reflectionPrompt: 'Какой пример ты бы сам придумал, чтобы объяснить десяток через предметы дома?'
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['десят', 'единиц'] }
  })

  await insert({
    lessonId: L1, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      // S5: пороги трофеев и share
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Двузначные числа · Урок 1',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Сколько единиц в 6 десятках?', correctAnswer: 60, conceptTag: 'десяток-единицы', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: 'В числе 84 сколько десятков?', options: ['4', '8', '80', '84'], correctIndex: 1, conceptTag: 'разряд', cognitiveLevel: 'understand' },
        { id: 'm3', kind: 'numeric', prompt: 'Запиши число «7 десятков и 3 единицы»', correctAnswer: 73, conceptTag: 'сборка', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Какое число идёт после 59?', options: ['50', '60', '69', '5'], correctIndex: 1, conceptTag: 'переход', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'choice', prompt: 'У Дамира 5 коробок по 10 печений и ещё 2 печенья. Сколько всего?', options: ['52', '7', '25', '70'], correctIndex: 0, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      // S5: pool для retry — другие вопросы при второй попытке
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Сколько единиц в 9 десятках?', correctAnswer: 90, conceptTag: 'десяток-единицы', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'choice', prompt: 'В числе 26 сколько десятков?', options: ['2', '6', '20', '26'], correctIndex: 0, conceptTag: 'разряд', cognitiveLevel: 'understand' },
        { id: 'p3', kind: 'numeric', prompt: 'Запиши число «4 десятка и 5 единиц»', correctAnswer: 45, conceptTag: 'сборка', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: 'Какое число идёт перед 70?', options: ['60', '69', '71', '79'], correctIndex: 1, conceptTag: 'переход', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'У бабушки 7 пачек чая по 10 и ещё 5 пакетиков. Сколько всего?', correctAnswer: 75, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Чтение, запись и сравнение двузначных
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Кто старше?',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Цифры почти одинаковые, числа разные',
      body: 'Бабушке 74, дедушке 47. Кто старше?',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '👵', accent: 'rose', caption: 'Бабушке 74 года' },
        { emoji: '👴', accent: 'sky', caption: 'Дедушке 47 лет' },
        { emoji: '⚖️', accent: 'amber', caption: 'Кто старше — узнаем по разрядам!' }
      ],
      prompt: 'Какое число больше: 47 или 74?',
      emojiChoices: [
        { id: 'a', emoji: '4️⃣', label: '47 — там 7' },
        { id: 'b', emoji: '7️⃣', label: '74 — больше десятков', isPrimary: true },
        { id: 'c', emoji: '🤝', label: 'Они равны' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что ты знаешь о записи чисел?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Как читается число 25?', options: ['два пять', 'двадцать пять', 'два десятка', 'пятьдесят'], correctIndex: 1, conceptTag: 'чтение', explanation: '25 — это 2 десятка (двадцать) и 5 единиц.' },
        { id: 'd2', prompt: 'Что больше: 38 или 83?', options: ['38', '83', 'равны', 'нельзя сказать'], correctIndex: 1, conceptTag: 'сравнение', explanation: 'У 83 восемь десятков — это больше трёх.' },
        { id: 'd3', prompt: 'Запись «12» означает:', options: ['1 десяток и 2 единицы', '2 десятка и 1 единица', '12 десятков', 'двенадцать десятков'], correctIndex: 0, conceptTag: 'запись', explanation: 'Левая цифра — десятки, правая — единицы.' },
        { id: 'd4', prompt: 'Какой знак нужен: 56 ___ 65', options: ['>', '<', '=', '+'], correctIndex: 1, conceptTag: 'знаки', explanation: 'У 56 пять десятков, у 65 — шесть.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Кто перевесит?',
    subtitle: 'Положи числа на чаши весов',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      // S2: balance-scale — для интуиции сравнения
      widget: { type: 'balance-scale', maxWeight: 99, leftStart: 47, rightStart: 74 },
      probes: [
        { id: 'p1', prompt: 'Кто перевесил при значениях 47 и 74?', options: ['Левая', 'Правая', 'Поровну', 'Не понять'], correctIndex: 1, explanation: 'Правая чаша (74) тяжелее, потому что десятков больше.' },
        { id: 'p2', prompt: 'Что больше: 19 или 91?', options: ['19', '91', 'одинаково', 'нельзя'], correctIndex: 1, explanation: '91 — 9 десятков, 19 — только 1.' }
      ],
      copy: { headline: 'Больше — значит тяжелее на весах', body: 'Чтобы сравнить два числа, представь их на чашах весов. Большее перевешивает.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Как сравнивать двузначные числа',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'callout',
          content: 'Главное правило: сначала смотрим на десятки. У кого больше десятков — то число больше.',
          emphasis: true,
          speakable: true
        },
        {
          id: 'c2', kind: 'comic',
          content: 'Алгоритм сравнения за 2 шага',
          panels: [
            { emoji: '👀', accent: 'sky', caption: 'Шаг 1: смотрим на десятки' },
            { emoji: '🔢', accent: 'amber', caption: 'Если поровну — на единицы' },
            { emoji: '✅', accent: 'emerald', caption: 'Тот, у кого больше — тот больше' }
          ]
        },
        {
          id: 'c3', kind: 'tap-reveal',
          content: 'Что делать если десятков поровну?',
          revealedKind: 'text',
          revealedContent: 'Тогда смотрим на **единицы**. У кого больше — то число и больше.',
          revealedHint: 'Например: 47 < 49, потому что у 49 единиц больше.'
        },
        {
          id: 'c4', kind: 'callout',
          content: 'Знаки сравнения: **>** (больше), **<** (меньше), **=** (равно).',
          speakable: true
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'Что больше: 67 или 76?', options: ['67', '76', 'равны', 'нельзя'], correctIndex: 1, explanation: 'У 76 — 7 десятков.' },
        { id: 'ch2', prompt: 'Сравни 34 и 38', options: ['34 > 38', '34 < 38', '34 = 38', 'нельзя'], correctIndex: 1, explanation: 'Десятков поровну, единиц больше у 38.' },
        { id: 'ch3', prompt: 'Какой знак: 50 ___ 50', options: ['>', '<', '=', '+'], correctIndex: 2, explanation: 'Числа равны.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись и чтение по разрядам',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Как читается число 56',
      anatomy: [
        { id: 'a1', label: '5 дес.', role: 'читаем как «пятьдесят»', value: '50', accent: 'sky' },
        { id: 'a2', label: '6 ед.', role: 'читаем как «шесть»', value: '6', accent: 'amber' },
        { id: 'a3', label: '56', role: 'итого: «пятьдесят шесть»', accent: 'green' }
      ],
      terms: [
        { term: '>', definition: 'Больше. Открытая часть смотрит на бо́льшее число.', example: '7 > 3', speakText: 'Знак больше' },
        { term: '<', definition: 'Меньше. Острый угол — к меньшему.', example: '3 < 7', speakText: 'Знак меньше' },
        { term: '=', definition: 'Равно. Числа одинаковые.', example: '5 = 5', speakText: 'Знак равно' }
      ],
      buildTask: {
        prompt: 'Поставь правильный знак: 41 ___ 14',
        template: '___',
        expected: ['>'],
        distractors: ['<', '=', '+', '-']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Сравниваем шаг за шагом',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм сравнения двузначных чисел в 2 шага.',
      examples: [
        {
          id: 'ex1', problem: 'Сравни числа 62 и 58',
          prefilledSteps: 0,
          steps: [
            {
              index: 1, title: 'Сравни десятки',
              explanation: 'У 62 — 6 десятков, у 58 — 5 десятков.',
              visual: { kind: 'board', boardLines: ['62 → 6 десятков', '58 → 5 десятков', '6 > 5'] },
              action: { kind: 'choice', prompt: 'У какого числа больше десятков?', options: ['62', '58', 'поровну'], correctIndex: 0 }
            },
            {
              index: 2, title: 'Делаем вывод',
              explanation: '6 > 5, значит 62 > 58. На единицы можно даже не смотреть.',
              action: { kind: 'choice', prompt: 'Какой знак?', options: ['62 > 58', '62 < 58', '62 = 58'], correctIndex: 0 }
            }
          ]
        },
        {
          id: 'ex2', problem: 'Сравни 73 и 79',
          prefilledSteps: 1,
          steps: [
            {
              index: 1, title: 'Десятки поровну',
              explanation: 'У обоих чисел по 7 десятков — значит, нужно идти к единицам.',
              visual: { kind: 'board', boardLines: ['73 → 7 десятков', '79 → 7 десятков', 'поровну → к единицам'] },
              action: { kind: 'choice', prompt: 'Десятков поровну?', options: ['Да', 'Нет'], correctIndex: 0 }
            },
            {
              index: 2, title: 'Сравни единицы',
              explanation: 'У 73 — 3 единицы, у 79 — 9. 9 > 3.',
              visual: { kind: 'board', boardLines: ['ед: 3 vs 9', '3 < 9', '⇒ 73 < 79'] },
              action: { kind: 'choice', prompt: 'Какой знак?', options: ['73 > 79', '73 < 79', '73 = 79'], correctIndex: 1 }
            }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем сравнение',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair — числа со знаками
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сравнение со знаком',
          left: [
            { id: 'L1', label: '45 vs 54' },
            { id: 'L2', label: '38 vs 38' },
            { id: 'L3', label: '90 vs 89' },
            { id: 'L4', label: '17 vs 71' }
          ],
          right: [
            { id: 'R1', label: '<', pairId: 'L1' },
            { id: 'R2', label: '=', pairId: 'L2' },
            { id: 'R3', label: '>', pairId: 'L3' },
            { id: 'R4', label: '<', pairId: 'L4' }
          ],
          conceptTag: 'сравнение'
        },
        { kind: 'choice', id: 't2', prompt: '60 ___ 6', options: ['>', '<', '='], correctIndex: 0 },
        { kind: 'numeric', id: 't3', prompt: 'На сколько 50 больше, чем 30?', correctAnswer: 20 },
        { kind: 'choice', id: 't4', prompt: 'Какое число между 40 и 50?', options: ['39', '45', '54', '60'], correctIndex: 1 },
        { kind: 'choice', id: 't5', prompt: '99 ___ 100', options: ['>', '<', '='], correctIndex: 1 },
        { kind: 'numeric', id: 't6', prompt: 'На сколько 80 больше, чем 70?', correctAnswer: 10 },
        { kind: 'choice', id: 't7', prompt: '23 ___ 32', options: ['>', '<', '='], correctIndex: 1 }
      ],
      socraticHints: {
        t2: ['60 — два знака; 6 — один', 'Что больше: 6 десятков или 6 единиц?'],
        t5: ['100 — это уже не двузначное', 'Где 99 на числовой прямой?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Робототехнический турнир',
    icon: 'i-lucide-rocket', accentColor: 'violet', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'space',
      setting: {
        title: 'Турнир инженеров',
        roleplay: 'Ты помощник судьи. Команды собирают модули — нужно быстро определять, кто впереди.',
        characterName: 'Тренер Бакыт',
        mascotLine: 'Сравнивай по разрядам — сначала десятки, потом единицы!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Команда А', request: 'А — 45 модулей, Б — 54. Введи число лидера.', correct: 54, wrongFeedback: 'У 54 пять десятков — больше четырёх.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Команда В', request: 'В — 67, Г — 76. Введи лидера.', correct: 76, wrongFeedback: 'У 76 семь десятков — больше шести.', revenueReward: 100, reputationReward: 1 },
        { id: 'o3', customer: 'Жюри', request: 'Алия — 38, Дана — 38. Введи 0 если ничья.', correct: 0, wrongFeedback: 'Числа равны — это ничья.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Финалисты', request: 'Финал: 89 vs 98. Лидер?', correct: 98, wrongFeedback: '98 имеет 9 десятков — больше восьми.', revenueReward: 200, reputationReward: 2 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный судья',
        request: 'Решающий: 70 vs 7. Кто перевесит? Введи бо́льшее.',
        correct: 70,
        wrongFeedback: '70 — это 7 десятков, а 7 — только 7 единиц.',
        revenueReward: 300,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где обычно ошибаются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      // S4: пробуем mode='spot' — найди где ошибка
      mode: 'spot',
      bugHunterBadge: { label: 'Охотник', emoji: '🔍' },
      intro: 'В каждом наборе одно решение неправильное. Найди его!',
      traps: [
        {
          id: 'tr1',
          wrongStatement: 'Ошибочное сравнение чисел',
          whyWrong: 'Сравнивать надо сначала **десятки**.',
          correctStatement: '47 < 74',
          rememberNote: 'Десятки решают первыми.',
          spotOptions: ['47 < 74', '47 > 74', '38 < 83', '12 < 21'],
          spotWrongIndex: 1
        },
        {
          id: 'tr2',
          wrongStatement: 'Неправильно поставлен знак',
          whyWrong: 'Открытая часть «>» смотрит на бо́льшее число.',
          correctStatement: '7 > 3',
          rememberNote: 'Открыто = большое.',
          spotOptions: ['7 > 3', '5 > 9', '4 < 8', '2 < 6'],
          spotWrongIndex: 1
        },
        {
          id: 'tr3',
          wrongStatement: 'Спутаны разные по разрядности числа',
          whyWrong: '30 — это три десятка, а 3 — только три единицы.',
          correctStatement: '30 > 3',
          rememberNote: '0 справа меняет смысл цифры.',
          spotOptions: ['30 > 3', '40 > 4', '50 = 5', '20 > 2'],
          spotWrongIndex: 2
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни другу алгоритм',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу-однокласснику, который путается в знаках',
      voicePrompt: 'Расскажи как сравнить два числа',
      coverPrompts: [
        'С чего начать сравнение двух двузначных чисел?',
        'Что делать, если десятков поровну?',
        'Как не путать знаки больше и меньше?'
      ],
      referenceAnswer: 'Чтобы сравнить два двузначных числа, сначала смотрим на десятки. У кого десятков больше — то число больше. Если десятки одинаковые, тогда смотрим на единицы. Знак «>» открыт в сторону большего числа.',
      requiredConcepts: ['десятки', 'единицы', 'сравнение'],
      conceptKeywords: {
        десятки: ['десят', 'десятк', 'пучк'],
        единицы: ['единиц', 'единичк'],
        сравнение: ['сравн', 'больше', 'меньше']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['десятк', 'единиц'] }
  })

  await insert({
    lessonId: L2, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Двузначные числа · Урок 2',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'Сравни: 36 ___ 63', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'сравнение', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: 'Сравни: 70 ___ 7', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'сравнение', cognitiveLevel: 'understand' },
        { id: 'm3', kind: 'choice', prompt: 'Сравни: 49 ___ 49', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равенство', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'numeric', prompt: 'Какое число больше на 10, чем 35?', correctAnswer: 45, conceptTag: 'счёт-десятками', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'choice', prompt: 'У Айнур 58 наклеек, у Дины — 85. Кто впереди?', options: ['Айнур', 'Дина', 'Поровну'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: 'Сравни: 24 ___ 42', options: ['>', '<', '='], correctIndex: 1, conceptTag: 'сравнение', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'choice', prompt: 'Сравни: 90 ___ 9', options: ['>', '<', '='], correctIndex: 0, conceptTag: 'сравнение', cognitiveLevel: 'understand' },
        { id: 'p3', kind: 'choice', prompt: 'Сравни: 27 ___ 27', options: ['>', '<', '='], correctIndex: 2, conceptTag: 'равенство', cognitiveLevel: 'recall' },
        { id: 'p4', kind: 'numeric', prompt: 'Какое число меньше на 10, чем 65?', correctAnswer: 55, conceptTag: 'счёт-десятками', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: 'У Тимура 47 машинок, у Самата — 74. Кто впереди?', options: ['Тимур', 'Самат', 'Поровну'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Разрядный состав и графические модели
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Спрятанные слагаемые',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Каждое число — это сумма двух «секретов»',
      body: 'Например, 47 = 40 + 7. Это разрядное разложение.',
      mascotEntry: 'teach',
      bgPattern: 'confetti',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🔍', accent: 'sky', caption: 'У каждого числа есть «секреты»' },
        { emoji: '🧩', accent: 'amber', caption: '47 = 40 + 7 — это секрет 47' },
        { emoji: '⚡', accent: 'emerald', caption: 'С секретами легче считать в уме!' }
      ],
      prompt: 'Разложи число 63',
      emojiChoices: [
        { id: 'a', emoji: '➕', label: '6 + 3' },
        { id: 'b', emoji: '⭐', label: '60 + 3', isPrimary: true },
        { id: 'c', emoji: '0️⃣', label: '63 + 0' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что ты помнишь о разрядах?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Сколько разрядов в двузначном числе?', options: ['1', '2', '3', '10'], correctIndex: 1, explanation: 'Две цифры — два разряда.' },
        { id: 'd2', prompt: 'Число 56 = ?', options: ['5 + 6', '50 + 6', '5 + 60', '500 + 6'], correctIndex: 1, explanation: '5 десятков = 50, плюс 6.' },
        { id: 'd3', prompt: '40 + 3 = ?', options: ['7', '43', '34', '403'], correctIndex: 1, explanation: '4 десятка и 3 единицы — это 43.' },
        { id: 'd4', prompt: 'В 70 сколько единиц?', options: ['0', '7', '70', '17'], correctIndex: 0, explanation: '70 — круглое: 7 десятков и 0 единиц.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Раскладываем число на блоки',
    subtitle: 'Собери число из десятков и единиц',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      // S2: place-value-blocks с конкретной целью
      widget: { type: 'place-value-blocks', maxHundreds: 0, maxTens: 9, maxOnes: 9, target: 56 },
      probes: [
        { id: 'p1', prompt: 'Раздели 24 точки на десятки и единицы. Сколько в остатке?', options: ['2', '4', '14', '20'], correctIndex: 1, explanation: '24 = 20 + 4. Остаток — 4.' },
        { id: 'p2', prompt: 'Сколько полных десятков в 37?', options: ['3', '7', '4', '37'], correctIndex: 0, explanation: '37 = 30 + 7. Получается 3.' },
        { id: 'p3', prompt: 'Собери число 56 на блоках. 56 = ?', options: ['5 + 6', '50 + 6', '5 + 60'], correctIndex: 1, explanation: '5 десятков (= 50) + 6 единиц.' }
      ],
      copy: { headline: 'Любое двузначное = десятки + единицы', body: 'Двузначное число — это сумма пучков по 10 и оставшихся единиц.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Разрядное разложение',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'callout',
          content: 'Разрядные слагаемые — это десятки и единицы числа, записанные отдельно.',
          emphasis: true,
          speakable: true
        },
        { id: 'c2', kind: 'formula', content: '47 = 40 + 7' },
        { id: 'c3', kind: 'formula', content: '83 = 80 + 3' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Что особенного у круглых чисел вроде 50?',
          revealedKind: 'text',
          revealedContent: '50 = 50 + 0. Единиц нет, поэтому второе слагаемое — 0.',
          revealedHint: 'Круглые числа кончаются на 0.'
        },
        {
          id: 'c5', kind: 'comic',
          content: 'Графическая модель числа',
          panels: [
            { emoji: '📏', accent: 'sky', caption: 'Десятки — палочки' },
            { emoji: '⬤', accent: 'amber', caption: 'Единицы — точки' },
            { emoji: '🎨', accent: 'emerald', caption: 'Так число становится наглядным' }
          ]
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'Разложи: 64 = ?', options: ['60 + 4', '6 + 4', '40 + 6', '600 + 4'], correctIndex: 0, explanation: '6 десятков = 60.' },
        { id: 'ch2', prompt: '20 + 9 = ?', options: ['29', '92', '11', '209'], correctIndex: 0, explanation: '2 десятка и 9 — это 29.' },
        { id: 'ch3', prompt: '4 палочки и 7 точек — это:', options: ['47', '74', '11', '407'], correctIndex: 0, explanation: '4 десятка + 7 единиц = 47.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Таблица разрядов',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Число 38 в таблице разрядов',
      anatomy: [
        { id: 'a1', label: '3', role: 'разряд десятков', value: '30', accent: 'sky' },
        { id: 'a2', label: '8', role: 'разряд единиц', value: '8', accent: 'amber' },
        { id: 'a3', label: '38', role: 'итого: 30 + 8', accent: 'green' }
      ],
      terms: [
        {
          term: 'Разрядное слагаемое',
          definition: 'Число, состоящее из единиц одного разряда.',
          example: 'В 47 — 40 и 7.',
          speakText: 'Разрядное слагаемое — часть числа из одного разряда'
        },
        {
          term: 'Графическая модель',
          definition: 'Запись числа в виде палочек и точек.',
          example: '23 = 2 палочки + 3 точки',
          speakText: 'Графическая модель — это рисунок числа палочками и точками'
        }
      ],
      buildTask: {
        prompt: 'Разложи 75 на разрядные слагаемые:',
        template: '___ + ___',
        expected: ['70', '5'],
        distractors: ['7', '50', '0', '75', '15']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Раскладываем по образцу',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Разложение числа на разрядные слагаемые — два простых шага.',
      examples: [
        {
          id: 'ex1', problem: 'Разложи число 56',
          prefilledSteps: 0,
          steps: [
            {
              index: 1, title: 'Найди десятки',
              explanation: 'Левая цифра — 5. Это 5 десятков, то есть 50.',
              visual: { kind: 'board', boardLines: ['56', 'Левая → 5 десятков = 50'] },
              action: { kind: 'numeric', prompt: 'Сколько десятков?', expected: 5 }
            },
            {
              index: 2, title: 'Найди единицы',
              explanation: 'Правая цифра — 6. Это 6 единиц.',
              visual: { kind: 'board', boardLines: ['56', 'Правая → 6 единиц'] },
              action: { kind: 'numeric', prompt: 'Сколько единиц?', expected: 6 }
            },
            {
              index: 3, title: 'Соедини плюсом',
              explanation: '50 + 6 = 56.',
              visual: { kind: 'board', boardLines: ['50 + 6 = 56'] },
              action: { kind: 'choice', prompt: 'Запись:', options: ['50 + 6', '5 + 6', '50 + 60'], correctIndex: 0 }
            }
          ]
        },
        {
          id: 'ex2', problem: 'Разложи число 90',
          prefilledSteps: 1,
          steps: [
            {
              index: 1, title: 'Десятки',
              explanation: '9 десятков = 90.',
              action: { kind: 'numeric', prompt: 'Сколько десятков в 90?', expected: 9 }
            },
            {
              index: 2, title: 'Единицы',
              explanation: 'В 90 единиц 0 — поэтому слагаемое равно 0.',
              visual: { kind: 'board', boardLines: ['90 = 90 + 0'] },
              action: { kind: 'choice', prompt: 'Запись:', options: ['90 + 0', '9 + 0', '90 + 9'], correctIndex: 0 }
            }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем разложение',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини число с его разложением',
          left: [
            { id: 'L45', label: '45' },
            { id: 'L68', label: '68' },
            { id: 'L30', label: '30' },
            { id: 'L72', label: '72' }
          ],
          right: [
            { id: 'R1', label: '40 + 5', pairId: 'L45' },
            { id: 'R2', label: '60 + 8', pairId: 'L68' },
            { id: 'R3', label: '30 + 0', pairId: 'L30' },
            { id: 'R4', label: '70 + 2', pairId: 'L72' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '40 + 5 = ?', correctAnswer: 45 },
        { kind: 'numeric', id: 't3', prompt: '60 + 8 = ?', correctAnswer: 68 },
        { kind: 'choice', id: 't4', prompt: '15 = ?', options: ['10 + 5', '1 + 5', '5 + 10'], correctIndex: 0 },
        { kind: 'numeric', id: 't5', prompt: '80 + 9 = ?', correctAnswer: 89 },
        { kind: 'choice', id: 't6', prompt: 'У 90 разрядные слагаемые:', options: ['90 + 0', '9 + 0', '90 + 9'], correctIndex: 0 },
        { kind: 'numeric', id: 't7', prompt: '30 + 0 = ?', correctAnswer: 30 }
      ],
      socraticHints: { t4: ['1 десяток = 10', 'А 5 — единиц'] }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Касса в космической столовой',
    icon: 'i-lucide-rocket', accentColor: 'violet', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'space',
      setting: {
        title: 'Космическая столовая',
        roleplay: 'Ты помогаешь кассиру. Цена обеда — двузначное. Нужно говорить, сколько купюр по 10 и сколько монет по 1.',
        characterName: 'Кассир Гульнар',
        mascotLine: '47 тг = 4 купюры × 10 + 7 монет × 1.'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Космонавт-3', request: 'Обед 35 тг. Сколько десятков купюр?', correct: 3, wrongFeedback: '35 = 3 десятка + 5.', revenueReward: 35, reputationReward: 1 },
        { id: 'o2', customer: 'Учитель', request: 'Обед 60 тг. Сколько единиц?', correct: 0, wrongFeedback: '60 = 6 десятков и 0 единиц.', revenueReward: 60, reputationReward: 1 },
        { id: 'o3', customer: 'Гость', request: 'Чек 78 тг. Сколько десятков?', correct: 7, wrongFeedback: '78 = 70 + 8.', revenueReward: 78, reputationReward: 1 },
        { id: 'o4', customer: 'Класс', request: 'Чек 90 тг. Сколько десятков?', correct: 9, wrongFeedback: '90 = 9 десятков.', revenueReward: 90, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Командир',
        request: 'Финал: 99 тг. Сколько единиц во второй части?',
        correct: 9,
        wrongFeedback: '99 = 90 + 9. Единиц — 9.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ловушки разложения',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Глаз-алмаз', emoji: '💎' },
      intro: 'Часто здесь ошибаются — будь внимателен.',
      traps: [
        { id: 'tr1', wrongStatement: '«47 = 4 + 7»', whyWrong: '4 — это десятки (40), а не 4. Полное разложение: 40 + 7.', correctStatement: '47 = 40 + 7', rememberNote: 'Левая цифра — десятки, не единицы.' },
        { id: 'tr2', wrongStatement: '«60 = 6 + 0 = 6»', whyWrong: 'Цифра 6 в 60 означает 6 десятков, то есть 60.', correctStatement: '60 = 60 + 0', rememberNote: 'Ноль справа делает число в 10 раз больше.' },
        { id: 'tr3', wrongStatement: '«В 50 — 5 единиц»', whyWrong: 'В 50 — 5 десятков и 0 единиц. Единиц нет.', correctStatement: 'В 50 — 5 десятков, 0 единиц', rememberNote: 'Круглое число — единиц 0.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни родителю',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'маме или папе — расскажи, как ты раскладываешь числа',
      voicePrompt: 'Расскажи, что такое разрядные слагаемые',
      coverPrompts: [
        'Что такое разрядные слагаемые?',
        'Как разложить число 56?',
        'Что особенного у круглых чисел?'
      ],
      referenceAnswer: 'Разрядные слагаемые — это десятки и единицы числа отдельно. Например, 56 = 50 + 6: 50 — это 5 десятков, 6 — единицы. У круглых чисел вроде 30 единиц нет: 30 = 30 + 0.',
      requiredConcepts: ['разрядные', 'десятки', 'единицы'],
      conceptKeywords: {
        разрядные: ['разряд', 'разрядн', 'слагаем'],
        десятки: ['десят', 'десятк'],
        единицы: ['единиц', 'штук']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['разряд', 'десятк'] }
  })

  await insert({
    lessonId: L3, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80,
      retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Двузначные числа · Урок 3',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '40 + 7 = ?', correctAnswer: 47, conceptTag: 'сборка', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: '63 = ?', options: ['6 + 3', '60 + 3', '6 + 30', '63 + 0'], correctIndex: 1, conceptTag: 'разложение', cognitiveLevel: 'understand' },
        { id: 'm3', kind: 'numeric', prompt: 'В 80 сколько единиц?', correctAnswer: 0, conceptTag: 'круглые', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'numeric', prompt: 'Сколько десятков в 56?', correctAnswer: 5, conceptTag: 'разряды', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'choice', prompt: '7 палочек и 4 точки — это:', options: ['11', '74', '47', '704'], correctIndex: 1, conceptTag: 'графмодель', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '50 + 8 = ?', correctAnswer: 58, conceptTag: 'сборка', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'choice', prompt: '29 = ?', options: ['2 + 9', '20 + 9', '2 + 90', '29 + 0'], correctIndex: 1, conceptTag: 'разложение', cognitiveLevel: 'understand' },
        { id: 'p3', kind: 'numeric', prompt: 'В 40 сколько единиц?', correctAnswer: 0, conceptTag: 'круглые', cognitiveLevel: 'recall' },
        { id: 'p4', kind: 'numeric', prompt: 'Сколько десятков в 83?', correctAnswer: 8, conceptTag: 'разряды', cognitiveLevel: 'understand' },
        { id: 'p5', kind: 'choice', prompt: '3 палочки и 9 точек — это:', options: ['12', '93', '39', '309'], correctIndex: 2, conceptTag: 'графмодель', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Двузначные числа', layersInsertedByLesson: counter }
})
