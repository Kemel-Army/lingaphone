import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Геометрические построения и логика».
 *   1. Обозначение фигур латинскими буквами
 *   2. Деление и составление композиций фигур
 *   3. Логические задачи и головоломки
 * Theme: construction (финальный блок). S2-S5 enrichments полностью.
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Геометрические построения и логика')
  const L1 = lessonIds['Обозначение фигур латинскими буквами']
  const L2 = lessonIds['Деление и составление композиций фигур']
  const L3 = lessonIds['Логические задачи и головоломки']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Обозначения латинскими буквами
  // ═════════════════════════════════════════════════════════════════════
  await insert({ lessonId: L1, layerType: 'HOOK', orderIndex: 1, title: 'Точка A, отрезок BC', icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: { kind: 'HOOK', mediaKind: 'fact', headline: 'Точки на чертеже — заглавные буквы: A, B, C.', body: 'Отрезок между ними — двумя буквами: AB, BC.',
      frames: [
        { emoji: '📍', accent: 'sky', caption: 'Точка A' },
        { emoji: '➖', accent: 'amber', caption: 'Отрезок AB' },
        { emoji: '🔺', accent: 'emerald', caption: 'Треугольник ABC' }
      ],
      successSfx: 'sparkle',
      mascotEntry: 'teach',
      prompt: 'Как назвать отрезок между точками M и N?',
      emojiChoices: [
        { id: 'a', emoji: '📍', label: 'M' },
        { id: 'b', emoji: '📍', label: 'N' },
        { id: 'c', emoji: '📐', label: 'MN', isPrimary: true }
      ] },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2, title: 'Знаешь обозначения?', icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'DIAGNOSTIC', mode: 'mcq', lives: 3,
      questions: [
        { id: 'd1', prompt: 'Точку обозначают:', options: ['Цифрой', 'Заглавной латинской буквой', 'Кружком', 'Не знаю'], correctIndex: 1, conceptTag: 'точка', explanation: 'Точки — заглавные латинские буквы.' },
        { id: 'd2', prompt: 'Отрезок между A и B:', options: ['A', 'AB', 'a-b', 'A·B'], correctIndex: 1, conceptTag: 'отрезок', explanation: 'Отрезок — две заглавные буквы.' },
        { id: 'd3', prompt: 'Какая буква НЕ латинская?', options: ['A', 'B', 'Ж', 'C'], correctIndex: 2, conceptTag: 'буквы', explanation: 'Ж — русская буква.' }
      ] }, completionCriteria: { minAccuracy: 50 } })

  await insert({ lessonId: L1, layerType: 'INTUITION', orderIndex: 3, title: 'Точки на чертеже', icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'INTUITION', widget: { type: 'array-grid', minRows: 2, maxRows: 4, minCols: 2, maxCols: 4, defaultRows: 3, defaultCols: 3 },
      probes: [
        { id: 'p1', prompt: 'Сколько отрезков между 3 точками A, B, C, если все соединены?', options: ['2', '3', '6', '9'], correctIndex: 1, explanation: 'AB, BC, AC — три.' },
        { id: 'p2', prompt: 'Можно ли точку обозначить «g»?', options: ['Да', 'Нет — точка ЗАГЛАВНАЯ'], correctIndex: 1 }
      ],
      copy: { headline: 'Точка — заглавная. Прямая — строчная.', body: 'Это правило аккуратности.' } },
    completionCriteria: { minInteractions: 2 } })

  await insert({ lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4, title: 'Правила обозначений', icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: { kind: 'EXPLANATION', chunks: [
      { id: 'c1', kind: 'callout', content: '**Точки** — заглавными: A, B, C, D. **Прямые** — строчными: a, b, c.', emphasis: true },
      { id: 'c2', kind: 'tap-reveal', content: '**Отрезок** между точками A и B', revealedContent: 'обозначается как AB или BA — две заглавные буквы рядом.', revealedKind: 'text' },
      { id: 'c3', kind: 'tap-reveal', content: '**Луч** — это часть прямой', revealedContent: 'начинается в одной точке и идёт бесконечно. Луч AB: начало в A, проходит через B.', revealedKind: 'text' },
      { id: 'c4', kind: 'text', content: 'Так удобно говорить о фигурах: «Прямоугольник ABCD имеет сторону AB длиной 5».' }
    ], checks: [
      { id: 'ch1', prompt: 'Как обозначить точку?', options: ['a', 'A', '1', 'X1'], correctIndex: 1 },
      { id: 'ch2', prompt: 'Отрезок между M и N — это:', options: ['M', 'MN', 'mn', 'M+N'], correctIndex: 1 },
      { id: 'ch3', prompt: 'У треугольника ABC сколько вершин?', options: ['1', '2', '3', '6'], correctIndex: 2 }
    ] }, completionCriteria: { minAccuracy: 67 } })

  await insert({ lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5, title: 'Латинский алфавит', icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'FORMALIZATION', diagramTitle: 'Обозначения',
      anatomy: [
        { id: 'a1', label: 'A, B, C', role: 'точки (заглавные)', accent: 'sky' },
        { id: 'a2', label: 'a, b, c', role: 'прямые (строчные)', accent: 'amber' },
        { id: 'a3', label: 'AB', role: 'отрезок A-B', accent: 'green' },
        { id: 'a4', label: 'ABC', role: 'треугольник', accent: 'rose' }
      ],
      terms: [
        { term: 'Латинская буква', definition: 'Буква латинского алфавита (A, B, C, D...).', example: 'Точка A' },
        { term: 'Вершина', definition: 'Точка-угол многоугольника.', example: 'У ABCD вершины A, B, C, D' }
      ],
      voiceTerms: true,
      buildTask: { prompt: 'Отрезок с концами A и B обозначают как ___', template: '___', expected: ['AB'] } },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6, title: 'Читаем чертёж', icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'WALKTHROUGH', intro: 'Алгоритм: вижу буквы → понимаю фигуру.',
      examples: [
        { id: 'ex1', problem: 'Прямоугольник ABCD. Сколько у него вершин?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Считаем буквы', explanation: 'A, B, C, D — четыре.', visual: { kind: 'board', boardLines: ['A───────B', '│       │', '│       │', 'D───────C'] }, action: { kind: 'numeric', prompt: '?', expected: 4 } }
          ] },
        { id: 'ex2', problem: 'Треугольник MNK. Назови все стороны.', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Стороны', explanation: 'MN, NK, MK — три отрезка.', action: { kind: 'numeric', prompt: 'Сколько сторон?', expected: 3 } }
          ] }
      ] }, completionCriteria: {} })

  await insert({ lessonId: L1, layerType: 'TRAINER', orderIndex: 7, title: 'Тренируем буквы', icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: { kind: 'TRAINER', targetCorrect: 6, problems: [
      { kind: 'tap-pair', id: 't0', prompt: 'Соедини обозначение с тем, что оно значит',
        left: [
          { id: 'l1', label: 'A' },
          { id: 'l2', label: 'AB' },
          { id: 'l3', label: 'ABC' },
          { id: 'l4', label: 'ABCD' }
        ],
        right: [
          { id: 'r1', label: 'точка', pairId: 'l1' },
          { id: 'r2', label: 'отрезок', pairId: 'l2' },
          { id: 'r3', label: 'треугольник', pairId: 'l3' },
          { id: 'r4', label: 'четырёхугольник', pairId: 'l4' }
        ] },
      { kind: 'choice', id: 't1', prompt: 'Точка обозначается:', options: ['Заглавной', 'Строчной', 'Цифрой'], correctIndex: 0 },
      { kind: 'choice', id: 't2', prompt: 'Прямая обозначается:', options: ['Заглавной', 'Строчной', 'Иногда'], correctIndex: 1 },
      { kind: 'numeric', id: 't3', prompt: 'У ABCD сколько вершин?', correctAnswer: 4 },
      { kind: 'numeric', id: 't4', prompt: 'У MNK сколько вершин?', correctAnswer: 3 },
      { kind: 'numeric', id: 't5', prompt: 'У пятиугольника ABCDE сколько сторон?', correctAnswer: 5 },
      { kind: 'choice', id: 't6', prompt: 'Отрезок AB — это:', options: ['Точка', 'Линия от A до B', 'Угол'], correctIndex: 1 },
      { kind: 'numeric', id: 't7', prompt: 'У шестиугольника сколько вершин?', correctAnswer: 6 },
      { kind: 'choice', id: 't8', prompt: 'Какая запись правильная для точки?', options: ['m', 'M', '5', '«мама»'], correctIndex: 1 }
    ],
    socraticHints: {
      t1: ['Точка — это заглавная или строчная буква?'],
      t2: ['А прямая — какой регистр?'],
      t3: ['Сколько букв в названии — столько и вершин. Посчитай: A, B, C, D.'],
      t5: ['Сколько букв в ABCDE? Это и количество сторон.'],
      t6: ['AB — это две точки. Что между ними проводят?'],
      t7: ['Шесть-угольник. Сколько вершин подсказывает само слово?'],
      t8: ['Точка — заглавная латинская. Какой вариант подходит?']
    } }, completionCriteria: { minCorrect: 6 } })

  await insert({ lessonId: L1, layerType: 'SCENARIO', orderIndex: 8, title: 'Чертёжная мастерская', icon: 'i-lucide-store', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: { kind: 'SCENARIO', theme: 'construction',
      setting: { title: 'Чертёжная мастерская', roleplay: 'Помоги читать чертежи.', characterName: 'Чертёжник Серик', mascotLine: 'Заглавные — точки, строчные — прямые!' },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Студент', request: 'У треугольника ABC сколько вершин?', correct: 3, wrongFeedback: '3 буквы = 3 вершины.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'У прям-ка ABCD сколько сторон?', correct: 4, wrongFeedback: '4 стороны.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'У 5-угольника ABCDE сколько вершин?', correct: 5, wrongFeedback: '5.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Архитектор', request: 'У 7-угольника ABCDEFG сколько сторон?', correct: 7, wrongFeedback: '7.', revenueReward: 70, reputationReward: 1 }
      ],
      boss: { id: 'boss', customer: '🏆 Босс-чертёж', request: 'У 10-угольника ABCDEFGHIJ сколько вершин?', correct: 10, wrongFeedback: '10 букв = 10 вершин.', revenueReward: 200, reputationReward: 3 } },
    completionCriteria: { minCorrect: 3 } })

  await insert({ lessonId: L1, layerType: 'TRAPS', orderIndex: 9, title: 'Не путай регистр', icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'TRAPS', intro: 'Заглавные ≠ строчные.', mode: 'flip',
      traps: [
        { id: 'tr1', wrongStatement: 'Точка a', whyWrong: 'Точки — только заглавными: A.', correctStatement: 'Точка A', rememberNote: 'Точка = ЗАГЛАВНАЯ.' },
        { id: 'tr2', wrongStatement: 'Использовал русские буквы (Ж, Ю)', whyWrong: 'Только латинские: A, B, C, D...', correctStatement: 'Латинский алфавит', rememberNote: 'Не Ж и не Ю.' },
        { id: 'tr3', wrongStatement: 'Перепутал точку и отрезок: A = отрезок', whyWrong: 'A — точка. AB — отрезок.', correctStatement: '1 буква = точка, 2 = отрезок', rememberNote: 'Считай буквы.' }
      ],
      bugHunterBadge: { label: 'Точный чертёжник', emoji: '📐' } },
    completionCriteria: {} })

  await insert({ lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10, title: 'Объясни обозначения', icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: { kind: 'TEACH_BACK', audiencePersona: 'однокласснику',
      coverPrompts: ['Как обозначают точки?', 'А прямые?', 'Что такое отрезок AB?'],
      referenceAnswer: 'Точки в геометрии обозначают заглавными латинскими буквами: A, B, C. Прямые — строчными: a, b, c. Отрезок AB — это часть прямой между точками A и B. Если у фигуры 4 буквы, как ABCD, то это четырёхугольник с 4 вершинами.',
      requiredConcepts: ['точк', 'отрез'], minSentences: 3,
      voiceFirst: true,
      conceptKeywords: { точк: ['точк', 'A', 'B', 'вершин'], отрез: ['отрез', 'AB', 'сторон'] },
      voicePrompt: 'Расскажи о геометрических обозначениях' },
    completionCriteria: { minLength: 80, requiredConcepts: ['точк', 'отрез'] } })

  await insert({ lessonId: L1, layerType: 'MASTERY_CHECK', orderIndex: 11, title: 'Финальная проверка', icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: { kind: 'MASTERY_CHECK', passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Мастер чертежей',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'Точку обозначают:', options: ['Заглавной', 'Строчной', 'Цифрой'], correctIndex: 0, conceptTag: 'точка', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: 'Отрезок A-B запишут как:', options: ['A', 'B', 'AB', 'A·B'], correctIndex: 2, conceptTag: 'отрезок', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: 'У ABCDEF сколько вершин?', correctAnswer: 6, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Прямую можно обозначить:', options: ['B', 'BC', 'b', 'B5'], correctIndex: 2, conceptTag: 'прямая', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: 'Сколько сторон у треугольника MNK?', correctAnswer: 3, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'У ABCDEFGH сколько вершин?', correctAnswer: 8, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: 'У прямоугольника KLMN сколько сторон?', options: ['2', '3', '4', '5'], correctIndex: 2, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: 'Какая запись для прямой правильная?', options: ['A', 'B', 'c', 'AB'], correctIndex: 2, conceptTag: 'прямая', cognitiveLevel: 'recall' }
      ] }, completionCriteria: { minAccuracy: 80 } })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Деление и композиции
  // ═════════════════════════════════════════════════════════════════════
  await insert({ lessonId: L2, layerType: 'HOOK', orderIndex: 1, title: 'Танграм', icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: { kind: 'HOOK', mediaKind: 'fact', headline: 'Из квадрата можно сделать кошку, лодку и дом — складывая части.', body: 'Это композиция фигур. Танграм — известная игра с такой идеей.',
      frames: [
        { emoji: '⬜', accent: 'sky', caption: 'Квадрат' },
        { emoji: '✂️', accent: 'amber', caption: 'Разрезали' },
        { emoji: '🏠', accent: 'emerald', caption: 'Получился дом!' }
      ],
      successSfx: 'sparkle',
      mascotEntry: 'celebrate',
      prompt: 'Из чего сделан танграм?',
      emojiChoices: [
        { id: 'a', emoji: '⬜', label: 'Квадратов' },
        { id: 'b', emoji: '🔺', label: 'Треугольников и др.', isPrimary: true },
        { id: 'c', emoji: '⭕', label: 'Кругов' }
      ] },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2, title: 'Готов к делению?', icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'DIAGNOSTIC', mode: 'mcq', lives: 3,
      questions: [
        { id: 'd1', prompt: 'Если квадрат разделить пополам — что получится?', options: ['Два прямоугольника', 'Два круга', 'Треугольник', 'Квадрат'], correctIndex: 0, conceptTag: 'деление', explanation: 'Два равных прямоугольника.' },
        { id: 'd2', prompt: 'Из 4 одинаковых треугольников можно сложить:', options: ['Квадрат', 'Прямоугольник', 'Большой треугольник', 'Любое из этого'], correctIndex: 3, conceptTag: 'композиция', explanation: 'Возможны разные комбинации.' },
        { id: 'd3', prompt: 'Деление квадрата по диагонали даёт:', options: ['Прямоугольники', 'Треугольники', 'Круги', 'Никаких'], correctIndex: 1, conceptTag: 'диагональ', explanation: 'Два треугольника.' }
      ] }, completionCriteria: { minAccuracy: 50 } })

  await insert({ lessonId: L2, layerType: 'INTUITION', orderIndex: 3, title: 'Разрезаем и складываем', icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'INTUITION', widget: { type: 'array-grid', minRows: 2, maxRows: 4, minCols: 2, maxCols: 4, defaultRows: 2, defaultCols: 2 },
      probes: [
        { id: 'p1', prompt: 'Квадрат 4×4. Разделили пополам по горизонтали. Сколько прямоугольников?', options: ['1', '2', '4', '8'], correctIndex: 1 },
        { id: 'p2', prompt: 'Из 2 одинаковых прямоугольников 2×4 — какую фигуру можно сложить?', options: ['Квадрат 4×4', 'Треугольник', 'Круг', 'Овал'], correctIndex: 0 }
      ],
      copy: { headline: 'Из частей собираем целое', body: 'Это как пазл — детали стыкуются по размеру.' } },
    completionCriteria: { minInteractions: 2 } })

  await insert({ lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4, title: 'Деление и сборка', icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: { kind: 'EXPLANATION', chunks: [
      { id: 'c1', kind: 'callout', content: '**Любую фигуру можно разделить на части и сложить из частей новую фигуру.**', emphasis: true },
      { id: 'c2', kind: 'tap-reveal', content: 'Квадрат можно разделить **тремя способами**', revealedContent: 'по горизонтали, по вертикали, по диагонали — получаются прямоугольники или треугольники.', revealedKind: 'text' },
      { id: 'c3', kind: 'tap-reveal', content: 'Из частей **собирают новые фигуры**', revealedContent: '2 равных треугольника = квадрат; 2 квадрата = прямоугольник; 4 треугольника = большой квадрат.', revealedKind: 'text' },
      { id: 'c4', kind: 'text', content: 'Это используется в архитектуре, дизайне и плитке.' }
    ], checks: [
      { id: 'ch1', prompt: 'Квадрат разделили по диагонали. Что получили?', options: ['Прямоугольники', 'Треугольники', 'Круги'], correctIndex: 1 },
      { id: 'ch2', prompt: '2 одинаковых квадрата составили вместе. Получили:', options: ['Прямоугольник', 'Треугольник', 'Круг'], correctIndex: 0 },
      { id: 'ch3', prompt: 'Из квадрата 6×6 разрезом пополам — сколько прямоугольников?', options: ['1', '2', '4', '6'], correctIndex: 1 }
    ] }, completionCriteria: { minAccuracy: 67 } })

  await insert({ lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5, title: 'Способы деления', icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'FORMALIZATION', diagramTitle: 'Виды деления',
      anatomy: [
        { id: 'a1', label: 'Горизонтально', role: 'разделили по горизонтали', accent: 'sky' },
        { id: 'a2', label: 'Вертикально', role: 'по вертикали', accent: 'amber' },
        { id: 'a3', label: 'По диагонали', role: 'через углы', accent: 'green' }
      ],
      terms: [
        { term: 'Композиция фигур', definition: 'Соединение нескольких частей в новую фигуру.', example: '4 треугольника → квадрат' },
        { term: 'Диагональ', definition: 'Отрезок, соединяющий несоседние вершины.', example: 'AC у квадрата ABCD' }
      ],
      voiceTerms: true,
      buildTask: { prompt: 'Если квадрат разделить по диагонали, получится ___ треугольника', template: '___', expected: ['2'] } },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6, title: 'Делим по-разному', icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'WALKTHROUGH', intro: 'Можно делить разными способами.',
      examples: [
        { id: 'ex1', problem: 'Прямоугольник 6×4. Разделим по середине по длинной стороне.', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что получим?', explanation: 'Два прям-ка 3×4.', visual: { kind: 'board', boardLines: ['┌──6──┐', '│ │  │', '│ │  │  → 2 прям-ка 3×4', '└──┴──┘'] }, action: { kind: 'numeric', prompt: 'Сколько фигур?', expected: 2 } }
          ] },
        { id: 'ex2', problem: 'Квадрат разделили по диагонали', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '2 треугольника.', action: { kind: 'numeric', prompt: '?', expected: 2 } }
          ] }
      ] }, completionCriteria: {} })

  await insert({ lessonId: L2, layerType: 'TRAINER', orderIndex: 7, title: 'Тренируем композиции', icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: { kind: 'TRAINER', targetCorrect: 6, problems: [
      { kind: 'tap-pair', id: 't0', prompt: 'Соедини: что разделили → что получили',
        left: [
          { id: 'l1', label: 'Квадрат пополам' },
          { id: 'l2', label: 'Квадрат по диагонали' },
          { id: 'l3', label: '2 квадрата 3×3 рядом' }
        ],
        right: [
          { id: 'r1', label: '2 прям-ка', pairId: 'l1' },
          { id: 'r2', label: '2 треуг', pairId: 'l2' },
          { id: 'r3', label: 'прям-к 3×6', pairId: 'l3' }
        ] },
      { kind: 'numeric', id: 't1', prompt: 'Квадрат разделили пополам. Сколько прямоугольников?', correctAnswer: 2 },
      { kind: 'numeric', id: 't2', prompt: 'Квадрат по диагонали. Сколько треугольников?', correctAnswer: 2 },
      { kind: 'numeric', id: 't3', prompt: 'Прямоугольник разделили на 4 одинаковые части. Сколько фигур?', correctAnswer: 4 },
      { kind: 'choice', id: 't4', prompt: 'Из 2 квадратов 3×3 — что можно сложить?', options: ['Прям-к', 'Круг', 'Треуг'], correctIndex: 0 },
      { kind: 'choice', id: 't5', prompt: 'Из 4 одинаковых треуг — что?', options: ['Квадрат', 'Большой треуг', 'Любое'], correctIndex: 2 },
      { kind: 'numeric', id: 't6', prompt: 'Если квадрат 8×8 разделили на квадратики 2×2, сколько штук?', correctAnswer: 16 },
      { kind: 'numeric', id: 't7', prompt: 'Из 6 квадратиков 2×2 — площадь прям-ка?', correctAnswer: 24 },
      { kind: 'numeric', id: 't8', prompt: 'Прям-к 4×6 разделить на 6 квадратов 2×2. Возможно? (1-да, 0-нет)', correctAnswer: 1 }
    ],
    socraticHints: {
      t3: ['На сколько частей делим? Сколько фигур получится?'],
      t4: ['Если положить два квадрата рядом — какая длина и ширина получаются?'],
      t6: ['Площадь квадрата 8×8 — сколько? Площадь маленького — сколько? Подели.'],
      t7: ['6 квадратиков, каждый 2×2. Площадь каждого? Общая площадь?'],
      t8: ['Площадь 4×6 = 24. Площадь маленького квадрата 2×2 = 4. Делится 24 на 4?']
    } }, completionCriteria: { minCorrect: 6 } })

  await insert({ lessonId: L2, layerType: 'SCENARIO', orderIndex: 8, title: 'Кружок мозаики', icon: 'i-lucide-store', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: { kind: 'SCENARIO', theme: 'construction',
      setting: { title: 'Мозаичная мастерская', roleplay: 'Создаём картины из плиток.', characterName: 'Мастер Айдос', mascotLine: 'Из частей — целое!' },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Школьник', request: 'Стена 6×4. Сколько плиток 2×2 нужно?', correct: 6, wrongFeedback: '24÷4=6.', revenueReward: 60, reputationReward: 1 },
        { id: 'o2', customer: 'Учитель', request: 'Из 4 одинаковых плиток 3×3 — площадь нового?', correct: 36, wrongFeedback: '4×9=36.', revenueReward: 80, reputationReward: 1 },
        { id: 'o3', customer: 'Дизайнер', request: 'Квадрат 8×8 — сколько квадратиков 4×4 поместится?', correct: 4, wrongFeedback: '64÷16=4.', revenueReward: 100, reputationReward: 1 },
        { id: 'o4', customer: 'Архитектор', request: 'Прям-к 10×6 покрыть квадратами 2×2. Сколько?', correct: 15, wrongFeedback: '60÷4=15.', revenueReward: 150, reputationReward: 1 }
      ],
      boss: { id: 'boss', customer: '🏆 Босс-мозаика', request: 'Зал 12×8 покрыть плитками 2×2. Сколько плиток?', correct: 24, wrongFeedback: '96÷4=24.', revenueReward: 300, reputationReward: 3 } },
    completionCriteria: { minCorrect: 3 } })

  await insert({ lessonId: L2, layerType: 'TRAPS', orderIndex: 9, title: 'Точные размеры', icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'TRAPS', intro: 'Не любые части соединяются.', mode: 'flip',
      traps: [
        { id: 'tr1', wrongStatement: 'Любые 2 фигуры дают любую', whyWrong: 'Размеры должны совпадать. Не любая комбинация работает.', correctStatement: 'Размеры должны подходить', rememberNote: 'Совпадение нужно.' },
        { id: 'tr2', wrongStatement: 'Округлял размеры (2,5 → 3)', whyWrong: 'Если плитка 2×2, она точно 2×2.', correctStatement: 'Точные числа', rememberNote: 'Не округляй.' },
        { id: 'tr3', wrongStatement: 'Не учёл углы при сборке', whyWrong: 'При сборке углы должны совпадать.', correctStatement: 'Углы важны', rememberNote: 'Геометрия точна.' }
      ],
      bugHunterBadge: { label: 'Мозаичник', emoji: '🧩' } },
    completionCriteria: {} })

  await insert({ lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10, title: 'Объясни композицию', icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: { kind: 'TEACH_BACK', audiencePersona: 'другу',
      coverPrompts: ['Как разделить фигуру?', 'Как сложить новую?', 'Покажи пример.'],
      referenceAnswer: 'Любую фигуру можно разделить на части — горизонтально, вертикально или по диагонали. Из частей можно сложить новую фигуру. Например, из 2 квадратов 3×3 получится прямоугольник 3×6, а из квадрата по диагонали — два треугольника.',
      requiredConcepts: ['делен', 'фигур'], minSentences: 3,
      voiceFirst: true,
      conceptKeywords: { делен: ['делен', 'разрез', 'пополам'], фигур: ['фигур', 'квадрат', 'треуг'] },
      voicePrompt: 'Расскажи про деление и сборку фигур' },
    completionCriteria: { minLength: 80, requiredConcepts: ['делен', 'фигур'] } })

  await insert({ lessonId: L2, layerType: 'MASTERY_CHECK', orderIndex: 11, title: 'Финальная проверка', icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: { kind: 'MASTERY_CHECK', passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Мастер композиций',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Квадрат пополам = ? прямоуг-ка', correctAnswer: 2, conceptTag: 'деление', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'Квадрат 6×6, плитки 2×2. Сколько плиток?', correctAnswer: 9, conceptTag: 'плитки', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'Квадрат по диагонали = ? треугольника', correctAnswer: 2, conceptTag: 'диагональ', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'numeric', prompt: 'Прям-к 8×4, плитки 2×2. Сколько плиток?', correctAnswer: 8, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Из 9 квадратов 2×2 — площадь общая?', correctAnswer: 36, conceptTag: 'композ', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Прям-к 10×8, плитки 2×2. Сколько плиток?', correctAnswer: 20, conceptTag: 'плитки', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Из 16 квадратов 2×2 — площадь общая?', correctAnswer: 64, conceptTag: 'композ', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Квадрат 10×10, плитки 5×5. Сколько?', correctAnswer: 4, conceptTag: 'плитки', cognitiveLevel: 'apply' }
      ] }, completionCriteria: { minAccuracy: 80 } })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Логические задачи
  // ═════════════════════════════════════════════════════════════════════
  await insert({ lessonId: L3, layerType: 'HOOK', orderIndex: 1, title: 'Хитрые задачки', icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: { kind: 'HOOK', mediaKind: 'fact', headline: 'У тебя 3-литровое и 5-литровое ведро. Как отмерить ровно 4 литра?', body: 'Логика и сообразительность — твои инструменты.',
      frames: [
        { emoji: '🪣', accent: 'sky', caption: 'Ведро 3 л' },
        { emoji: '🫗', accent: 'amber', caption: 'Ведро 5 л' },
        { emoji: '🤔', accent: 'emerald', caption: 'Получить 4 л' }
      ],
      successSfx: 'sparkle',
      mascotEntry: 'think',
      prompt: 'А сразу 4 л можно набрать в одно из вёдер?',
      emojiChoices: [
        { id: 'a', emoji: '✅', label: 'Да' },
        { id: 'b', emoji: '🔄', label: 'Нет, нужно переливать', isPrimary: true },
        { id: 'c', emoji: '❓', label: 'Не знаю' }
      ] },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2, title: 'Любишь головоломки?', icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'DIAGNOSTIC', mode: 'mcq', lives: 3,
      questions: [
        { id: 'd1', prompt: 'Сколько прыжков нужно лягушке для 10 м, прыгая по 2 м?', options: ['5', '10', '20', '12'], correctIndex: 0, conceptTag: 'счёт', explanation: '10÷2=5.' },
        { id: 'd2', prompt: 'У 3 котят 12 ног. Это нормально?', options: ['Да', 'Нет', 'Не знаю'], correctIndex: 0, conceptTag: 'логика', explanation: '3·4=12.' },
        { id: 'd3', prompt: 'Если переливать жидкость, можно получить любое количество?', options: ['Иногда', 'Никогда', 'Всегда'], correctIndex: 0, conceptTag: 'переливание', explanation: 'Зависит от объёмов.' }
      ] }, completionCriteria: { minAccuracy: 50 } })

  await insert({ lessonId: L3, layerType: 'INTUITION', orderIndex: 3, title: 'Думаем нестандартно', icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'INTUITION', widget: { type: 'number-line', min: 0, max: 10, step: 1 },
      probes: [
        { id: 'p1', prompt: 'Лягушка делает прыжок 2 м. Сколько прыжков до отметки 8?', options: ['2', '4', '6', '8'], correctIndex: 1 },
        { id: 'p2', prompt: 'Если каждые 3 минуты приходит автобус, сколько за 15 минут?', options: ['3', '5', '15', '45'], correctIndex: 1 }
      ],
      copy: { headline: 'Логика — это здравый смысл с числами', body: 'Не всегда нужна формула. Иногда — здравый смысл.' } },
    completionCriteria: { minInteractions: 2 } })

  await insert({ lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4, title: 'Логические приёмы', icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: { kind: 'EXPLANATION', chunks: [
      { id: 'c1', kind: 'callout', content: '**Логические задачи** требуют не формул, а сообразительности. Главное — внимательно прочитать.', emphasis: true },
      { id: 'c2', kind: 'tap-reveal', content: '**Переливания**: «4 л при ёмкостях 3 и 5 л»', revealedContent: 'Набираем 5, переливаем 3 в маленькое, остаётся 2 в большом. Сливаем маленькое, кладём 2 туда. Снова 5 в большое, доливаем 1 в маленькое — в большом ровно 4!', revealedKind: 'text' },
      { id: 'c3', kind: 'tap-reveal', content: '**Идти от конца**', revealedContent: 'Если знаем результат, восстанавливаем по цепочке: «через 3 года будет 10 → сейчас 7».', revealedKind: 'text' },
      { id: 'c4', kind: 'text', content: 'Главное — пробуй, представляй, проверяй. Не бойся ошибок.' }
    ], checks: [
      { id: 'ch1', prompt: 'Сколько прыжков лягушке для 12 м, прыжок 3 м?', options: ['3', '4', '12', '15'], correctIndex: 1 },
      { id: 'ch2', prompt: 'У 5 курочек по 2 ноги. Всего ног?', options: ['7', '10', '5', '2'], correctIndex: 1 },
      { id: 'ch3', prompt: '3 кошки за 3 часа поймали 3 мышей. За сколько 6 кошек поймают 6 мышей?', options: ['1 час', '3 часа', '6 часов', '9 часов'], correctIndex: 1 }
    ] }, completionCriteria: { minAccuracy: 67 } })

  await insert({ lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5, title: 'Виды задач', icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'FORMALIZATION', diagramTitle: 'Логические задачи',
      anatomy: [
        { id: 'a1', label: 'На переливание', role: 'через ёмкости', accent: 'sky' },
        { id: 'a2', label: 'На взвешивание', role: 'с весами', accent: 'amber' },
        { id: 'a3', label: 'От конца к началу', role: 'обратный счёт', accent: 'green' }
      ],
      terms: [
        { term: 'Логическая задача', definition: 'Задача на сообразительность, без готовых формул.', example: 'Переливания, взвешивания' },
        { term: 'Обратный ход', definition: 'Восстановление с конца к началу.', example: 'Через 3 года будет 10 → сейчас 7' }
      ],
      voiceTerms: true,
      buildTask: { prompt: 'У 5 курочек по 2 ноги. Всего ног ___', template: '___', expected: ['10'] } },
    completionCriteria: { minInteractions: 1 } })

  await insert({ lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6, title: 'Решаем нестандартно', icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: { kind: 'WALKTHROUGH', intro: 'Алгоритм: представь → пробуй → проверяй.',
      examples: [
        { id: 'ex1', problem: 'Маша съела половину конфет, потом ещё 3. Осталось 5. Сколько было сначала?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Идём от конца', explanation: 'Прибавляем 3 к 5 = 8 (это после половины съедания).', visual: { kind: 'board', boardLines: ['? → ½ → −3 → 5', '5 + 3 = 8 (половина)', '8 · 2 = 16 (всё)'] }, action: { kind: 'numeric', prompt: 'Сколько после ½?', expected: 8 } },
            { index: 2, title: 'Половина', explanation: '8 — это половина начального. Значит начальное = 16.', action: { kind: 'numeric', prompt: 'Сначала?', expected: 16 } }
          ] },
        { id: 'ex2', problem: 'Сколько 2-копеечных монет в 1 рубле?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '100 коп ÷ 2 = 50 монет.', action: { kind: 'numeric', prompt: '?', expected: 50 } }
          ] }
      ] }, completionCriteria: {} })

  await insert({ lessonId: L3, layerType: 'TRAINER', orderIndex: 7, title: 'Тренируем логику', icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: { kind: 'TRAINER', targetCorrect: 5, problems: [
      { kind: 'tap-pair', id: 't0', prompt: 'Соедини задачу → способ',
        left: [
          { id: 'l1', label: 'Через 3 года будет 10' },
          { id: 'l2', label: 'Половина = 8' },
          { id: 'l3', label: '4 кошки, всего ног?' }
        ],
        right: [
          { id: 'r1', label: 'обратный ход', pairId: 'l1' },
          { id: 'r2', label: '×2', pairId: 'l2' },
          { id: 'r3', label: '×4', pairId: 'l3' }
        ] },
      { kind: 'numeric', id: 't1', prompt: 'У 4 гусей всего ног?', correctAnswer: 8 },
      { kind: 'numeric', id: 't2', prompt: 'Лягушка прыгнула 5 раз по 3 м. Сколько метров?', correctAnswer: 15 },
      { kind: 'numeric', id: 't3', prompt: 'Половина числа — 12. Само число?', correctAnswer: 24 },
      { kind: 'numeric', id: 't4', prompt: 'У 6 жуков ног?', correctAnswer: 36 },
      { kind: 'numeric', id: 't5', prompt: '3 кошки + 2 курицы = ? ног (кошка=4, курица=2)', correctAnswer: 16 },
      { kind: 'numeric', id: 't6', prompt: 'Маше столько лет, сколько 3 раза по 4 минус 5. Сколько лет?', correctAnswer: 7 },
      { kind: 'numeric', id: 't7', prompt: '5+5+5 = ?', correctAnswer: 15 },
      { kind: 'numeric', id: 't8', prompt: 'Через 3 года Лёше будет 10 лет. Сколько сейчас?', correctAnswer: 7 }
    ],
    socraticHints: {
      t3: ['Если половина = 12, что нужно сделать с 12, чтобы получить целое?'],
      t4: ['Сколько ног у одного жука? У насекомых — 6.'],
      t5: ['У кошки сколько ног? У курицы? Сложи всё.'],
      t6: ['Сначала найди 3·4. Потом отними 5.'],
      t8: ['Через 3 года будет 10. Какое действие — обратное к «прибавили 3»?']
    } }, completionCriteria: { minCorrect: 5 } })

  await insert({ lessonId: L3, layerType: 'SCENARIO', orderIndex: 8, title: 'Олимпиада логики', icon: 'i-lucide-store', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: { kind: 'SCENARIO', theme: 'construction',
      setting: { title: 'Олимпиада по логике', roleplay: 'Решай хитрые задачи на сообразительность.', characterName: 'Ведущий Канат', mascotLine: 'Думай нестандартно!' },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Команда А', request: 'У 7 петухов сколько ног? (петух=2)', correct: 14, wrongFeedback: '7×2=14.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Команда Б', request: 'Половина моих лет = 5. Сколько мне лет?', correct: 10, wrongFeedback: '5×2=10.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Команда В', request: 'Кенгуру прыгнула 8 раз по 2 м. Расстояние?', correct: 16, wrongFeedback: '8×2=16.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Финал', request: 'У Алии 3 кошки и 2 собаки. Всего ног?', correct: 20, wrongFeedback: '5×4=20.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: { id: 'boss', customer: '🏆 Гранд-финал', request: 'У Серика было N конфет. Съел половину, потом ещё 4. Осталось 6. Сколько было?', correct: 20, wrongFeedback: '6+4=10 (половина), ·2=20.', revenueReward: 300, reputationReward: 3 } },
    completionCriteria: { minCorrect: 3 } })

  await insert({ lessonId: L3, layerType: 'TRAPS', orderIndex: 9, title: 'Не торопись!', icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: { kind: 'TRAPS', intro: 'Логика любит внимательность.', mode: 'flip',
      traps: [
        { id: 'tr1', wrongStatement: 'Прочитал задачу один раз — ответил', whyWrong: 'Логика требует чтения дважды.', correctStatement: 'Перечитай', rememberNote: '2 раза.' },
        { id: 'tr2', wrongStatement: 'Применил формулу, не подумав', whyWrong: 'В логических задачах формул может не быть. Думай!', correctStatement: 'Сначала логика', rememberNote: 'Не торопись.' },
        { id: 'tr3', wrongStatement: 'Сдался, не попробовав', whyWrong: 'Просто пробуй разные подходы. Получится!', correctStatement: 'Пробуй', rememberNote: 'Не сдавайся.' }
      ],
      bugHunterBadge: { label: 'Логик-чемпион', emoji: '🧩' } },
    completionCriteria: {} })

  await insert({ lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10, title: 'Объясни логику', icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: { kind: 'TEACH_BACK', audiencePersona: 'другу',
      coverPrompts: ['Что такое логическая задача?', 'Чем отличается от обычной?', 'Какой совет дашь?'],
      referenceAnswer: 'Логическая задача — это задача на сообразительность. В ней не всегда есть готовая формула, нужно думать самому. Главные советы: внимательно перечитать условие, попробовать представить задачу, не бояться ошибок и пробовать разные подходы.',
      requiredConcepts: ['логи', 'задач'], minSentences: 3,
      voiceFirst: true,
      conceptKeywords: { логи: ['логи', 'думать', 'смысл'], задач: ['задач', 'условие', 'попроб'] },
      voicePrompt: 'Расскажи, как решать логические задачи' },
    completionCriteria: { minLength: 80, requiredConcepts: ['логи', 'задач'] } })

  await insert({ lessonId: L3, layerType: 'MASTERY_CHECK', orderIndex: 11, title: 'Финальная проверка', icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: { kind: 'MASTERY_CHECK', passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Я прошёл 2 класс',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'У 5 котов всего ног?', correctAnswer: 20, conceptTag: 'логика', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'numeric', prompt: 'Половина = 9. Само число?', correctAnswer: 18, conceptTag: 'обратное', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: 'Заяц прыгнул 6 раз по 4 м. Метров?', correctAnswer: 24, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: 'Через 4 года Дане будет 12. Сколько сейчас?', correctAnswer: 8, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'У 4 петухов и 2 коров всего ног (петух=2, корова=4)?', correctAnswer: 16, conceptTag: 'комбинация', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'У 7 пчёл всего ног (пчела=6)?', correctAnswer: 42, conceptTag: 'счёт', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Через 2 года Ане будет 11. Сейчас?', correctAnswer: 9, conceptTag: 'обратное', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'У 3 курочек и 2 кошек ног?', correctAnswer: 14, conceptTag: 'комбинация', cognitiveLevel: 'apply' }
      ] }, completionCriteria: { minAccuracy: 80 } })

  return { ok: true, topic: 'Геометрические построения и логика', layersInsertedByLesson: counter }
})
