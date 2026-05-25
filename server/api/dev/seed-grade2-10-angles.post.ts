import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Углы и многоугольники».
 *   1. Виды углов: прямой, острый, тупой
 *   2. Классификация многоугольников
 *   3. Построение геометрических фигур и прямого угла
 *
 * S6: тема №10, theme-pack = 'construction' (геометрия в стройке).
 * Урок 1 INTUITION использует уникальный AngleProtractor виджет.
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (📐/🔷/✏️).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Углы и многоугольники')
  const L1 = lessonIds['Виды углов: прямой, острый, тупой']
  const L2 = lessonIds['Классификация многоугольников']
  const L3 = lessonIds['Построение геометрических фигур и прямого угол']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Углы и многоугольники»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Виды углов
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Угол вокруг тебя',
    subtitle: 'Прямой, острый, тупой',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Углы — везде. Уголок книги, угол комнаты, между стрелками часов.',
      body: 'Самый «правильный» — прямой угол. Меньше — острый, больше — тупой.',
      mascotEntry: 'teach',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📐', accent: 'sky', caption: 'Прямой = 90°' },
        { emoji: '◀️', accent: 'amber', caption: 'Острый < 90°' },
        { emoji: '🌙', accent: 'emerald', caption: 'Тупой > 90°' }
      ],
      prompt: 'У книги уголки какие?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Острые' },
        { id: 'b', emoji: '🥇', label: 'Прямые', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Тупые' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь углы?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Угол у уголка тетради?', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0, conceptTag: 'прямой', explanation: 'Эталон 90°.' },
        { id: 'd2', prompt: 'Угол меньше прямого:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1, conceptTag: 'острый', explanation: '<90°.' },
        { id: 'd3', prompt: 'Угол больше прямого:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2, conceptTag: 'тупой', explanation: '>90°.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Угол как раскрытие',
    subtitle: 'Транспортир показывает',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'INTUITION',
      widget: { type: 'angle-protractor', mode: 'classify', target: 90, snap: 15 },
      probes: [
        { id: 'p1', prompt: 'Прямой угол — 90°. Меньше 90 — это:', options: ['Острый', 'Тупой', 'Прямой'], correctIndex: 0 },
        { id: 'p2', prompt: 'Что больше 90?', options: ['Острый', 'Тупой', 'Прямой'], correctIndex: 1 }
      ],
      copy: { headline: 'Прямой = 90°. Острый < 90°. Тупой > 90°.', body: 'Самое важное правило про углы.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Три вида углов',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Три вида за 3 кадра',
          panels: [
            { emoji: '📐', accent: 'sky', caption: 'Прямой = 90° (эталон)' },
            { emoji: '◀️', accent: 'amber', caption: 'Острый — узкий' },
            { emoji: '🌙', accent: 'emerald', caption: 'Тупой — раскрытый' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Прямой угол** — как уголок тетради или книги. Самый «правильный» = 90°.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: '**Острый угол** меньше прямого — узкий, как клювик.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А тупой?',
          revealedKind: 'text',
          revealedContent: 'Тупой угол больше прямого — раскрытый шире, чем уголок книги. Например, угол стрелок часов в 5:00.',
          revealedHint: 'Тупой = широко.'
        },
        { id: 'c5', kind: 'text', content: 'Чтобы определить, сравни с уголком тетради. Совпадает — прямой. Уже — острый. Шире — тупой.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Угол стрелок часов на 3:00:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0 },
        { id: 'ch2', prompt: 'На 5:00:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2 },
        { id: 'ch3', prompt: 'На 1:00:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Сравнение с прямым',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Виды углов',
      anatomy: [
        { id: 'a1', label: 'Прямой', role: '= уголок тетради', accent: 'green' },
        { id: 'a2', label: 'Острый', role: '< прямого, узкий', accent: 'sky' },
        { id: 'a3', label: 'Тупой', role: '> прямого, раскрытый', accent: 'amber' }
      ],
      terms: [
        { term: 'Прямой угол', definition: '90°. Уголок книги.', example: 'Углы тетради', speakText: 'Прямой — девяносто градусов' },
        { term: 'Острый угол', definition: 'Меньше прямого.', example: '12 и 2 на часах', speakText: 'Острый — узкий' },
        { term: 'Тупой угол', definition: 'Больше прямого.', example: '12 и 5 на часах', speakText: 'Тупой — раскрытый' }
      ],
      buildTask: {
        prompt: 'Угол меньше 90° называют ___',
        template: '___',
        expected: ['острый'],
        distractors: ['прямой', 'тупой', 'круглый', 'обычный', 'плоский']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Определяем виды',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: возьми уголок тетради и сравни.',
      examples: [
        {
          id: 'ex1', problem: 'Угол между двумя дорогами «как у уголка квадрата». Какой?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сравниваем', explanation: 'Совпадает с уголком — прямой.', visual: { kind: 'board', boardLines: ['= 90° → прямой'] }, action: { kind: 'choice', prompt: 'Какой?', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0 } }
          ]
        },
        {
          id: 'ex2', problem: 'Раскрытая книга, шире уголка', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Думаем', explanation: 'Шире уголка — тупой.', action: { kind: 'choice', prompt: 'Тип?', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем виды',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини угол с типом',
          left: [
            { id: 'L1', label: 'Уголок тетради' },
            { id: 'L2', label: 'Острие карандаша' },
            { id: 'L3', label: 'Раскрытая дверь' },
            { id: 'L4', label: 'Стрелки на 3:00' }
          ],
          right: [
            { id: 'R1', label: 'Прямой', pairId: 'L1' },
            { id: 'R2', label: 'Острый', pairId: 'L2' },
            { id: 'R3', label: 'Тупой', pairId: 'L3' },
            { id: 'R4', label: 'Прямой', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: 'Угол > 90°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2 },
        { kind: 'choice', id: 't3', prompt: 'Угол = 90°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0 },
        { kind: 'choice', id: 't4', prompt: 'Угол < 90°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1 },
        { kind: 'choice', id: 't5', prompt: 'Стрелки на 6:00 (между 12 и 6):', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2 },
        { kind: 'choice', id: 't6', prompt: 'Угол на 1:00:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1 }
      ],
      socraticHints: {
        t2: ['Больше 90 — это какой?'],
        t3: ['Ровно 90 — какой?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Дизайнер интерьера',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Студия дизайна',
        roleplay: 'Помоги дизайнеру оценивать углы в комнатах и мебели.',
        characterName: 'Дизайнер Лейла',
        mascotLine: 'Сравни с уголком тетради!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Клиент', request: 'Стены 90°. (1=прям, 2=остр, 3=туп)', correct: 1, wrongFeedback: '90°=прямой.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Архитектор', request: 'Угол крыши 60°. (1/2/3)', correct: 2, wrongFeedback: '<90 острый.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Заказчик', request: 'Угол навеса 120°. (1/2/3)', correct: 3, wrongFeedback: '>90 тупой.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Студент', request: 'Стрелки на 3:00. (1/2/3)', correct: 1, wrongFeedback: 'Прямой.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный заказ',
        request: 'ФИНАЛ: Угол башни 135°. (1/2/3)',
        correct: 3,
        wrongFeedback: '135 > 90 = тупой.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай острый и тупой',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Угловед', emoji: '📐' },
      intro: 'Главное — сравнить с прямым.',
      traps: [
        { id: 'tr1', wrongStatement: '«Острый = большой»', whyWrong: 'Наоборот: острый узкий, тупой раскрытый.', correctStatement: 'Острый < 90 < Тупой', rememberNote: 'Острый = клювик.' },
        { id: 'tr2', wrongStatement: '«Прямой = только в квадрате»', whyWrong: 'Прямой угол везде, где 90°.', correctStatement: 'Прямой угол — везде, где 90°', rememberNote: 'Не только в квадрате.' },
        { id: 'tr3', wrongStatement: 'Не сравнил с уголком', whyWrong: 'Уголок тетради — самый надёжный способ.', correctStatement: 'Сравни с уголком', rememberNote: 'Тетрадь — линейка для углов.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни углы',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи три вида углов',
      coverPrompts: ['Какие три вида углов?', 'Какой эталон?', 'Покажи пример каждого.'],
      referenceAnswer: 'Есть три вида углов: прямой, острый и тупой. Прямой угол — это эталон, как уголок тетради или книги, ровно 90°. Острый угол меньше прямого, узкий. Тупой — больше прямого, раскрытый шире. Например, на часах в 3:00 — прямой угол.',
      requiredConcepts: ['прямой', 'острый', 'тупой'],
      conceptKeywords: {
        прямой: ['прям'],
        острый: ['остр'],
        тупой: ['туп']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['прям', 'остр'] }
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
      shareCapsuleName: 'Виды углов · Стройка',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'Угол < 90°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1, conceptTag: 'острый', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: 'Угол = 90°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0, conceptTag: 'прямой', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'choice', prompt: 'Угол > 90°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2, conceptTag: 'тупой', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'choice', prompt: 'Угол кубика:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'choice', prompt: 'Стрелки в 1:00:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: 'Угол 45°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1, conceptTag: 'острый', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: 'Угол 100°:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2, conceptTag: 'тупой', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: 'Угол стола:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 0, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: 'Стрелки в 4:00:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 2, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: 'Угол ножниц закрытых:', options: ['Прямой', 'Острый', 'Тупой'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Многоугольники
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Сколько сторон?',
    subtitle: 'Имена по числу углов',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Многоугольники называют по числу углов: треугольник = 3, четырёхугольник = 4.',
      body: 'А ещё бывают пятиугольники, шестиугольники... до бесконечности!',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🔺', accent: 'sky', caption: '3 угла = треугольник' },
        { emoji: '🔷', accent: 'amber', caption: '4 угла = четырёхугольник' },
        { emoji: '🛑', accent: 'emerald', caption: '8 углов = восьмиугольник!' }
      ],
      prompt: 'Сколько углов у пятиугольника?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '4' },
        { id: 'b', emoji: '🥇', label: '5', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '6' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь фигуры?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Сторон у треугольника?', options: ['2', '3', '4', '5'], correctIndex: 1, conceptTag: 'треугольник', explanation: '«Три-угольник» = 3.' },
        { id: 'd2', prompt: 'Квадрат — это:', options: ['Треугольник', 'Четырёхугольник', 'Круг', 'Овал'], correctIndex: 1, conceptTag: 'квадрат', explanation: '4 угла.' },
        { id: 'd3', prompt: 'Чем отличается квадрат от прямоугольника?', options: ['Все стороны равны', 'Цветом', 'Размером', 'Ничем'], correctIndex: 0, conceptTag: 'различия', explanation: 'Стороны равны.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Имена по числу углов',
    subtitle: 'N углов = N-угольник',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 3, max: 8, step: 1 },
      probes: [
        { id: 'p1', prompt: '4 угла — это:', options: ['Треугольник', 'Четырёхугольник', 'Пятиугольник'], correctIndex: 1 },
        { id: 'p2', prompt: '6 углов — это:', options: ['Пятиугольник', 'Шестиугольник', 'Семиугольник'], correctIndex: 1 }
      ],
      copy: { headline: 'Имя — это «N-угольник», где N = число углов', body: '3 → треугольник, 4 → четырёхугольник.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Классификация фигур',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Семья многоугольников',
          panels: [
            { emoji: '🔺', accent: 'sky', caption: '3 — треугольник' },
            { emoji: '🟦', accent: 'amber', caption: '4 — четырёхугольник' },
            { emoji: '⬢', accent: 'emerald', caption: '6 — шестиугольник' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Многоугольник** — фигура из прямых линий и углов между ними.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Названия: 3 — треугольник, 4 — четырёхугольник, 5 — пятиугольник, 6 — шестиугольник.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А в чём разница квадрата и прямоугольника?',
          revealedKind: 'text',
          revealedContent: 'У квадрата ВСЕ стороны равны и углы прямые. У прямоугольника углы прямые, но стороны попарно равны.',
          revealedHint: 'Квадрат = особый прямоугольник.'
        },
        { id: 'c5', kind: 'text', content: 'Треугольники: с прямым углом — прямоугольный, с равными сторонами — равносторонний.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Углов у шестиугольника?', options: ['5', '6', '7', '8'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Углы квадрата:', options: ['Острые', 'Тупые', 'Прямые', 'Разные'], correctIndex: 2 },
        { id: 'ch3', prompt: 'Прямоугольный треугольник имеет прямых углов:', options: ['3', '1', '2', '0'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Виды многоугольников',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Многоугольники',
      anatomy: [
        { id: 'a1', label: 'Треугольник', role: '3 стороны и угла', accent: 'green' },
        { id: 'a2', label: 'Четырёхугольник', role: '4 стороны и угла', accent: 'sky' },
        { id: 'a3', label: 'Квадрат', role: 'все стороны равны, углы прямые', accent: 'amber' },
        { id: 'a4', label: 'Прямоугольник', role: 'углы прямые, стороны попарно равны', accent: 'rose' }
      ],
      terms: [
        { term: 'Многоугольник', definition: 'Замкнутая фигура из прямых линий.', example: 'Квадрат — четырёхугольник', speakText: 'Многоугольник — из прямых' }
      ],
      buildTask: {
        prompt: 'Фигура с 5 углами — это ___',
        template: '___',
        expected: ['пятиугольник'],
        distractors: ['треугольник', 'квадрат', 'круг', 'шестиугольник', 'овал']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Узнаём фигуры',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: посчитай углы → назови фигуру.',
      examples: [
        {
          id: 'ex1', problem: '3 угла и 3 стороны', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Имя', explanation: '3 угла → треугольник.', visual: { kind: 'board', boardLines: ['3 угла = треугольник'] }, action: { kind: 'choice', prompt: 'Это:', options: ['Треугольник', 'Квадрат', 'Овал'], correctIndex: 0 } }
          ]
        },
        {
          id: 'ex2', problem: '4 равных стороны, 4 прямых угла', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Имя', explanation: 'Квадрат.', action: { kind: 'choice', prompt: 'Это:', options: ['Прямоугольник', 'Квадрат', 'Треугольник'], correctIndex: 1 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем фигуры',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини фигуру с числом углов',
          left: [
            { id: 'L1', label: 'Треугольник' },
            { id: 'L2', label: 'Квадрат' },
            { id: 'L3', label: 'Пятиугольник' },
            { id: 'L4', label: 'Шестиугольник' }
          ],
          right: [
            { id: 'R1', label: '3', pairId: 'L1' },
            { id: 'R2', label: '4', pairId: 'L2' },
            { id: 'R3', label: '5', pairId: 'L3' },
            { id: 'R4', label: '6', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: 'Углы квадрата:', options: ['Острые', 'Прямые', 'Тупые'], correctIndex: 1 },
        { kind: 'choice', id: 't3', prompt: 'Прямоугольник — это:', options: ['Треугольник', 'Четырёхугольник', 'Круг'], correctIndex: 1 },
        { kind: 'choice', id: 't4', prompt: 'У прямоугольного треугольника прямых углов:', options: ['0', '1', '3'], correctIndex: 1 },
        { kind: 'numeric', id: 't5', prompt: 'У семиугольника углов?', correctAnswer: 7 },
        { kind: 'numeric', id: 't6', prompt: 'У восьмиугольника сторон?', correctAnswer: 8 }
      ],
      socraticHints: {
        t5: ['Семь = 7. Сколько углов у «семи-угольника»?'],
        t6: ['Восемь = 8.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Школа архитекторов',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Школа архитекторов',
        roleplay: 'Помоги детям различать фигуры в зданиях и предметах.',
        characterName: 'Архитектор Бакыт',
        mascotLine: 'Считай углы — узнавай фигуру!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Ученик', request: 'Окно квадратной формы. Углов?', correct: 4, wrongFeedback: '4.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Знак «уступи дорогу» — треугольник. Сторон?', correct: 3, wrongFeedback: '3.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Дизайнер', request: 'Знак-шестиугольник. Углов?', correct: 6, wrongFeedback: '6.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Студент', request: 'Дверь прямоугольная. Углов?', correct: 4, wrongFeedback: '4.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Дизайн купола',
        request: 'ФИНАЛ: Восьмиугольный павильон. Сторон?',
        correct: 8,
        wrongFeedback: '8.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай похожие',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Геометр', emoji: '🔷' },
      intro: 'Похожие фигуры — частые ловушки.',
      traps: [
        { id: 'tr1', wrongStatement: '«Квадрат и прямоугольник — разные»', whyWrong: 'Квадрат — частный случай прямоугольника. У обоих 4 прямых угла, но у квадрата стороны равны.', correctStatement: 'Квадрат = особый прямоугольник', rememberNote: 'Все квадраты — прямоугольники.' },
        { id: 'tr2', wrongStatement: '«Овал — многоугольник»', whyWrong: 'У овала закруглённые стороны, не прямые.', correctStatement: 'Многоугольник = только из прямых', rememberNote: 'Кривое — не многоугольник.' },
        { id: 'tr3', wrongStatement: 'Не посчитал углы аккуратно', whyWrong: 'У шестиугольника 6, не 5. Считай дважды.', correctStatement: 'Считай аккуратно', rememberNote: 'Перепроверь.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни фигуры',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату',
      voicePrompt: 'Расскажи про многоугольники',
      coverPrompts: ['Какие фигуры ты знаешь?', 'Чем квадрат отличается от прямоугольника?', 'Как назвать фигуру с 5 углами?'],
      referenceAnswer: 'Многоугольники — фигуры из прямых сторон и углов. Имя зависит от числа углов: треугольник (3), четырёхугольник (4), пятиугольник (5). Среди четырёхугольников квадрат — у него все стороны равны и углы прямые. Прямоугольник — углы прямые, но стороны попарно равны.',
      requiredConcepts: ['треугольник', 'квадрат', 'углы'],
      conceptKeywords: {
        треугольник: ['треуг', 'три угла'],
        квадрат: ['квадрат'],
        углы: ['углов', 'углы']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['углов', 'сторон'] }
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
      shareCapsuleName: 'Многоугольники · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Углов у пятиугольника?', correctAnswer: 5, conceptTag: 'счёт', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: 'У квадрата стороны:', options: ['Все равны', 'Разные', 'Кривые'], correctIndex: 0, conceptTag: 'квадрат', cognitiveLevel: 'understand' },
        { id: 'm3', kind: 'choice', prompt: 'Углы прямоугольника:', options: ['Острые', 'Прямые', 'Тупые'], correctIndex: 1, conceptTag: 'прямоуг', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'numeric', prompt: 'У восьмиугольника сторон?', correctAnswer: 8, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'choice', prompt: '1 прямой угол + 3 стороны:', options: ['Квадрат', 'Прямоуг.треуг', 'Овал'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Углов у девятиугольника?', correctAnswer: 9, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Сторон у треугольника?', correctAnswer: 3, conceptTag: 'счёт', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'choice', prompt: 'Является ли квадрат прямоугольником?', options: ['Да', 'Нет'], correctIndex: 0, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'p4', kind: 'numeric', prompt: 'У десятиугольника углов?', correctAnswer: 10, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: 'Овал — многоугольник?', options: ['Да', 'Нет'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Построение
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Линейка и угольник',
    subtitle: 'Инструменты построения',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Прямой угол можно нарисовать угольником или клеточками тетради.',
      body: 'Каждая клеточка — маленький квадратик с прямыми углами.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📏', accent: 'sky', caption: 'Линейка — для прямых' },
        { emoji: '📐', accent: 'amber', caption: 'Угольник — для прямого угла' },
        { emoji: '📓', accent: 'emerald', caption: 'Клетки — встроенная сетка' }
      ],
      prompt: 'Что используют для прямого угла?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Циркуль' },
        { id: 'b', emoji: '🥇', label: 'Угольник', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Карандаш' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к построениям?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Чем чертят отрезок?', options: ['Линейка', 'Циркуль', 'Карандаш', 'Любое'], correctIndex: 0, conceptTag: 'инструмент', explanation: 'Линейка для прямых.' },
        { id: 'd2', prompt: 'Чем — прямой угол?', options: ['Линейкой', 'Угольником', 'Карандашом', 'Циркулем'], correctIndex: 1, conceptTag: 'угольник', explanation: 'Угольник.' },
        { id: 'd3', prompt: 'Прямых углов в квадрате?', options: ['1', '2', '3', '4'], correctIndex: 3, conceptTag: 'квадрат', explanation: 'Все 4.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Точечная бумага',
    subtitle: 'Тетрадь = сетка',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 5, minCols: 2, maxCols: 5, defaultRows: 4, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: 'Квадрат 3×3. Сторон по сколько клеток?', options: ['3', '4', '6', '9'], correctIndex: 0 },
        { id: 'p2', prompt: 'Клеток внутри квадрата 3×3?', options: ['9', '6', '12', '3'], correctIndex: 0 }
      ],
      copy: { headline: 'В тетради клетки — твой строительный инструмент', body: 'Считая клетки, можно строить любые прямоугольники.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Строим фигуры',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Квадрат за 3 шага',
          panels: [
            { emoji: '➖', accent: 'sky', caption: '1. Низ' },
            { emoji: '🟦', accent: 'amber', caption: '2. Стороны вверх' },
            { emoji: '⬛', accent: 'emerald', caption: '3. Соедини верх!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Прямой угол** строят угольником или с помощью клеток тетради.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Алгоритм квадрата: 1) Низ из 4 клеток. 2) Из концов — вверх 4 клетки. 3) Соединяем верх.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А прямоугольник?',
          revealedKind: 'text',
          revealedContent: 'То же, но стороны разные: горизонталь 5, вертикаль 3. Получаем прямоугольник 5×3.',
          revealedHint: 'Только размеры разные.'
        },
        { id: 'c5', kind: 'text', content: 'Прямой угол можно проверить уголком тетради — без зазора.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Сторон квадрата 5×5?', options: ['5', '10', '25', '4'], correctIndex: 0 },
        { id: 'ch2', prompt: 'Чем проверяют прямой угол?', options: ['Циркулем', 'Угольником', 'Часами', 'Карандашом'], correctIndex: 1 },
        { id: 'ch3', prompt: 'Прямоугольник 3×4 — клеток внутри?', options: ['7', '12', '34', '6'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Инструменты',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Инструменты построения',
      anatomy: [
        { id: 'a1', label: 'Линейка', role: 'для прямых линий', accent: 'sky' },
        { id: 'a2', label: 'Угольник', role: 'для прямого угла', accent: 'green' },
        { id: 'a3', label: 'Клетки тетради', role: 'удобная сетка', accent: 'amber' }
      ],
      terms: [
        { term: 'Угольник', definition: 'Инструмент с прямым углом для построений.', example: 'Школьный угольник', speakText: 'Угольник — для прямого угла' }
      ],
      buildTask: {
        prompt: 'Квадрат 4×4 содержит ___ клеток',
        template: '___',
        expected: ['16'],
        distractors: ['8', '4', '12', '20', '24']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Строим квадрат',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Учимся строить квадрат 4×4 в клеточках.',
      examples: [
        {
          id: 'ex1', problem: 'Квадрат 4 клетки', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Низ', explanation: 'Горизонтально 4 клетки.', visual: { kind: 'board', boardLines: ['─ ─ ─ ─ (4 клетки)'] }, action: { kind: 'numeric', prompt: 'Сторон?', expected: 4 } },
            { index: 2, title: 'Стороны', explanation: 'От концов вверх по 4.', action: { kind: 'numeric', prompt: 'По сколько?', expected: 4 } },
            { index: 3, title: 'Верх', explanation: 'Соединить — квадрат готов.', action: { kind: 'numeric', prompt: 'Углов?', expected: 4 } }
          ]
        },
        {
          id: 'ex2', problem: 'Прямоугольник 5×3', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Размеры', explanation: '5×3 = 15 клеток.', action: { kind: 'numeric', prompt: 'Клеток?', expected: 15 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем построения',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с числом клеток внутри',
          left: [
            { id: 'L1', label: 'Квадрат 3×3' },
            { id: 'L2', label: 'Прям-к 4×6' },
            { id: 'L3', label: 'Прям-к 2×3' },
            { id: 'L4', label: 'Квадрат 6×6' }
          ],
          right: [
            { id: 'R1', label: '9', pairId: 'L1' },
            { id: 'R2', label: '24', pairId: 'L2' },
            { id: 'R3', label: '6', pairId: 'L3' },
            { id: 'R4', label: '36', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'Углов в квадрате 5×5?', correctAnswer: 4 },
        { kind: 'choice', id: 't3', prompt: 'Угольник для:', options: ['Прямого угла', 'Кругов', 'Длины'], correctIndex: 0 },
        { kind: 'choice', id: 't4', prompt: 'Длину измеряют:', options: ['Угольником', 'Линейкой', 'Транспортиром'], correctIndex: 1 },
        { kind: 'numeric', id: 't5', prompt: 'Прям-к 7×3. Клеток?', correctAnswer: 21 },
        { kind: 'numeric', id: 't6', prompt: 'Сторон у любого квадрата?', correctAnswer: 4 }
      ],
      socraticHints: {
        t5: ['7×3=21.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Юный конструктор',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Кружок конструирования',
        roleplay: 'Помоги детям рисовать прямоугольники для деталей.',
        characterName: 'Учитель Бахытжан',
        mascotLine: 'Считай клеточки — стороны точные!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Ученик', request: 'Квадрат 4. Клеток внутри?', correct: 16, wrongFeedback: '4×4=16.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Прям-к 5×3. Клеток?', correct: 15, wrongFeedback: '5×3=15.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Юный архитектор', request: 'Квадрат стороной 6. Клеток?', correct: 36, wrongFeedback: '6×6=36.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Конструктор', request: 'Прям-к 7×2. Клеток?', correct: 14, wrongFeedback: '7×2=14.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой проект',
        request: 'ФИНАЛ: Прям-к 9×8. Клеток?',
        correct: 72,
        wrongFeedback: '9×8=72.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Аккуратность важна',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Чертёжник', emoji: '✏️' },
      intro: 'Кривые линии — не углы.',
      traps: [
        { id: 'tr1', wrongStatement: 'Чертил без линейки', whyWrong: 'От руки кривая. Используй линейку.', correctStatement: 'Прямые — линейкой', rememberNote: 'Линейка — обязательно.' },
        { id: 'tr2', wrongStatement: 'Не считал клетки точно', whyWrong: '«Примерно» не работает. Считай по одной.', correctStatement: 'Считай каждую клеточку', rememberNote: 'Точность.' },
        { id: 'tr3', wrongStatement: '«Сторона 4 = 4 точки»', whyWrong: 'Сторона — отрезок между точками. 4 клетки = расстояние.', correctStatement: '4 клетки — расстояние', rememberNote: 'Клетки между точками.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни построение',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как построить квадрат',
      coverPrompts: ['Какие инструменты нужны?', 'Как нарисовать прямой угол?', 'Опиши шаги.'],
      referenceAnswer: 'Для построения нужна линейка для прямых линий и угольник для прямого угла. В тетради удобно строить, считая клетки. Чтобы нарисовать квадрат: рисую низ нужной длины, потом из концов вверх такие же стороны, потом соединяю верхушки.',
      requiredConcepts: ['линейка', 'угольник', 'клетки'],
      conceptKeywords: {
        линейка: ['линейк'],
        угольник: ['угольн', 'угол'],
        клетки: ['клет']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['линейк', 'угол'] }
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
      shareCapsuleName: 'Построение фигур · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Квадрат 4×4. Клеток?', correctAnswer: 16, conceptTag: 'квадрат', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'Прям-к 6×3. Клеток?', correctAnswer: 18, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: 'Прямой угол строят:', options: ['Линейкой', 'Угольником', 'Карандашом'], correctIndex: 1, conceptTag: 'инстр', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'numeric', prompt: 'Прямых углов в квадрате?', correctAnswer: 4, conceptTag: 'квадрат', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: 'Прям-к 8×2. Клеток?', correctAnswer: 16, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Квадрат 5×5. Клеток?', correctAnswer: 25, conceptTag: 'квадрат', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Прям-к 7×4. Клеток?', correctAnswer: 28, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Прям-к 9×3. Клеток?', correctAnswer: 27, conceptTag: 'прямоуг', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: 'Длину измеряют:', options: ['Угольником', 'Линейкой', 'Циркулем'], correctIndex: 1, conceptTag: 'инстр', cognitiveLevel: 'recall' },
        { id: 'p5', kind: 'numeric', prompt: 'Квадрат 7×7. Клеток?', correctAnswer: 49, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Углы и многоугольники', layersInsertedByLesson: counter }
})
