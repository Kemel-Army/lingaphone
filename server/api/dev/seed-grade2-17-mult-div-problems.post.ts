import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 5 lessons of «Задачи на умножение и деление».
 *   1. Задачи на нахождение неизвестных компонентов
 *   2. Задачи на увеличение и уменьшение в несколько раз
 *   3. Задачи на кратное сравнение
 *   4. Задачи с косвенным вопросом
 *   5. Цена, количество, стоимость
 *
 * S6: тема №17, theme-pack = 'zoo' (закрывает блок ×÷ после 11/12/13).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (🔍/⚖️/➗/🪤/🛒).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Задачи на умножение и деление')
  const L1 = lessonIds['Задачи на нахождение неизвестных компонентов']
  const L2 = lessonIds['Задачи на увеличение и уменьшение в несколько раз']
  const L3 = lessonIds['Задачи на кратное сравнение']
  const L4 = lessonIds['Задачи с косвенным вопросом']
  const L5 = lessonIds['Цена, количество, стоимость']
  if (!L1 || !L2 || !L3 || !L4 || !L5) throw createError({ statusCode: 500, message: 'Some lessons missing for «Задачи на умножение и деление»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3, L4, L5])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Неизвестные компоненты
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Найди множитель',
    subtitle: 'Связь × и ÷',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'x · 4 = 24. Сколько коробок, если в каждой 4 яблока?',
      body: 'Это деление: x = 24 ÷ 4 = 6 коробок.',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🍎', accent: 'amber', caption: 'Всего 24 яблока' },
        { emoji: '📦', accent: 'rose', caption: 'По 4 в коробке' },
        { emoji: '🔍', accent: 'emerald', caption: 'Сколько коробок? 24÷4=6' }
      ],
      prompt: 'x · 5 = 35. Чему равен x?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '7', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '40' },
        { id: 'c', emoji: '🤯', label: '5' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь, как искать?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'x · 3 = 18. x?', options: ['6', '15', '21', '54'], correctIndex: 0, conceptTag: 'множитель', explanation: '18 ÷ 3 = 6.' },
        { id: 'd2', prompt: '12 ÷ x = 4. x?', options: ['3', '8', '48', '16'], correctIndex: 0, conceptTag: 'делитель', explanation: '12 ÷ 4 = 3.' },
        { id: 'd3', prompt: 'Чтобы найти неизвестный множитель, нужно:', options: ['Сложить', 'Вычесть', 'Произведение ÷ известный', 'Не знаю'], correctIndex: 2, conceptTag: 'правило', explanation: 'Множитель = произведение ÷ известный.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Связь × и ÷',
    subtitle: 'Массивы и группы',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 6, minCols: 2, maxCols: 6, defaultRows: 3, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: 'Если 4 ряда по x = 12 предметов. Сколько в ряду?', options: ['3', '8', '12', '4'], correctIndex: 0, explanation: '12÷4=3.' },
        { id: 'p2', prompt: 'Если x рядов по 5 = 30. Рядов?', options: ['6', '25', '35', '5'], correctIndex: 0 }
      ],
      copy: { headline: 'Чтобы найти множитель — раздели произведение на известный множитель', body: 'Это связь × и ÷ в действии.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правила нахождения',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Три формулы за 3 кадра',
          panels: [
            { emoji: '✖️', accent: 'sky', caption: 'a · x = c → x = c÷a' },
            { emoji: '➗', accent: 'amber', caption: 'a ÷ x = c → x = a÷c' },
            { emoji: '🎯', accent: 'emerald', caption: 'x ÷ a = c → x = a·c' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Неизвестный множитель = произведение ÷ известный множитель.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'x \\cdot 4 = 24 \\Rightarrow x = 24 \\div 4 = 6' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А если неизвестен делитель или делимое?',
          revealedKind: 'text',
          revealedContent: 'Делитель = делимое ÷ частное. Делимое = делитель × частное. Используй связь!',
          revealedHint: 'Знаешь ×÷ — найдёшь любой компонент.'
        },
        { id: 'c5', kind: 'formula', content: '12 \\div x = 4 \\Rightarrow x = 12 \\div 4 = 3' }
      ],
      checks: [
        { id: 'ch1', prompt: 'x · 6 = 30. x?', options: ['5', '24', '36', '180'], correctIndex: 0 },
        { id: 'ch2', prompt: '20 ÷ x = 5. x?', options: ['4', '15', '25', '100'], correctIndex: 0 },
        { id: 'ch3', prompt: 'x ÷ 3 = 8. x?', options: ['24', '5', '11', '2'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Правила в формулах',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Поиск компонентов',
      anatomy: [
        { id: 'a1', label: 'a · x = c', role: 'x = c ÷ a', accent: 'sky' },
        { id: 'a2', label: 'a ÷ x = c', role: 'x = a ÷ c', accent: 'amber' },
        { id: 'a3', label: 'x ÷ a = c', role: 'x = a · c', accent: 'green' }
      ],
      terms: [
        { term: 'Неизвестный компонент', definition: 'Любая неизвестная часть равенства.', example: 'x · 5 = 30, ищем x', speakText: 'Неизвестный компонент' }
      ],
      buildTask: {
        prompt: 'x · 7 = 42, x = ___',
        template: '___',
        expected: ['6'],
        distractors: ['7', '42', '49', '35', '5']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем по формулам',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: определи тип → примени формулу.',
      examples: [
        {
          id: 'ex1', problem: 'x · 7 = 42', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Тип', explanation: 'Ищем неизвестный множитель.', visual: { kind: 'board', boardLines: ['x · 7 = 42', '\\downarrow', 'x = 42 ÷ 7'] }, action: { kind: 'numeric', prompt: 'Сколько?', expected: 6 } },
            { index: 2, title: 'Применяем', explanation: 'x = 42 ÷ 7 = 6.', action: { kind: 'numeric', prompt: 'x?', expected: 6 } }
          ]
        },
        {
          id: 'ex2', problem: '40 ÷ x = 8', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: 'x = 40 ÷ 8 = 5.', action: { kind: 'numeric', prompt: 'x?', expected: 5 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем поиск',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини уравнение с корнем',
          left: [
            { id: 'L1', label: 'x · 4 = 28' },
            { id: 'L2', label: '24 ÷ x = 6' },
            { id: 'L3', label: 'x ÷ 5 = 6' },
            { id: 'L4', label: 'x · 8 = 40' }
          ],
          right: [
            { id: 'R1', label: '7', pairId: 'L1' },
            { id: 'R2', label: '4', pairId: 'L2' },
            { id: 'R3', label: '30', pairId: 'L3' },
            { id: 'R4', label: '5', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'x · 5 = 45. x?', correctAnswer: 9 },
        { kind: 'numeric', id: 't3', prompt: '36 ÷ x = 4. x?', correctAnswer: 9 },
        { kind: 'numeric', id: 't4', prompt: 'x ÷ 3 = 9. x?', correctAnswer: 27 },
        { kind: 'numeric', id: 't5', prompt: '50 ÷ x = 10. x?', correctAnswer: 5 },
        { kind: 'numeric', id: 't6', prompt: 'x · 6 = 54. x?', correctAnswer: 9 }
      ],
      socraticHints: {
        t2: ['Чтобы найти множитель — что нужно поделить?'],
        t3: ['Делитель = делимое ÷ частное.'],
        t4: ['x — делимое, найди через ×.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Зоопарк: учёт корма',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Склад кормов',
        roleplay: 'Помоги завхозу зоопарка: где-то спрятана часть информации.',
        characterName: 'Завхоз Бекжан',
        mascotLine: 'Используй связь × и ÷!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Цех', request: 'В x коробках по 4 банана — всего 24. x?', correct: 6, wrongFeedback: '24÷4=6.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Учёт', request: 'Если 30 рыбок раздать по 5 в ведре — сколько вёдер?', correct: 6, wrongFeedback: '30÷5=6.', revenueReward: 60, reputationReward: 1 },
        { id: 'o3', customer: 'Доставка', request: 'x морковок поделили на 4 — по 7 каждой. x?', correct: 28, wrongFeedback: '4×7=28.', revenueReward: 70, reputationReward: 1 },
        { id: 'o4', customer: 'Менеджер', request: 'x · 6 = 54. Сколько порций в каждой группе?', correct: 9, wrongFeedback: '54÷6=9.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой склад',
        request: 'ФИНАЛ: 72 кг корма поделили по 8 кг на клетку. Сколько клеток?',
        correct: 9,
        wrongFeedback: '72÷8=9.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай ÷ и ×',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Поисковик', emoji: '🔍' },
      intro: 'Нужно знать связь.',
      traps: [
        { id: 'tr1', wrongStatement: '«x · 4 = 24, x = 24 · 4 = 96»', whyWrong: 'Чтобы найти множитель, нужно поделить, не умножать.', correctStatement: 'x = 24 ÷ 4 = 6', rememberNote: 'Действие наоборот.' },
        { id: 'tr2', wrongStatement: '«x ÷ 3 = 6, x = 6 ÷ 3 = 2»', whyWrong: 'Если делимое неизвестное, умножай: x = 3 · 6 = 18.', correctStatement: 'x = 18', rememberNote: 'Делимое = делитель × частное.' },
        { id: 'tr3', wrongStatement: 'Не определил тип', whyWrong: 'Сначала пойми, кто неизвестный — множитель, делитель или делимое.', correctStatement: 'Определи тип', rememberNote: 'Имя × правило.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни поиск',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как найти неизвестный множитель',
      coverPrompts: ['Как найти неизвестный множитель?', 'А делитель?', 'Покажи на примере x · 4 = 28.'],
      referenceAnswer: 'Если неизвестный множитель — нужно произведение разделить на известный множитель. Если неизвестный делитель — делимое разделить на частное. Если неизвестное делимое — делитель умножить на частное. Например, x · 4 = 28: x = 28 ÷ 4 = 7.',
      requiredConcepts: ['множитель', 'делитель', 'произведение'],
      conceptKeywords: {
        множитель: ['множ'],
        делитель: ['делитель'],
        произведение: ['произвед', 'умнож']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['множ', 'делит'] }
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
      shareCapsuleName: 'Поиск компонентов · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'x · 4 = 36. x?', correctAnswer: 9, conceptTag: 'множитель', cognitiveLevel: 'apply', explanation: '36÷4=9.' },
        { id: 'm2', kind: 'numeric', prompt: '40 ÷ x = 5. x?', correctAnswer: 8, conceptTag: 'делитель', cognitiveLevel: 'apply', explanation: '40÷5=8.' },
        { id: 'm3', kind: 'numeric', prompt: 'x ÷ 4 = 9. x?', correctAnswer: 36, conceptTag: 'делимое', cognitiveLevel: 'apply', explanation: '4·9=36.' },
        { id: 'm4', kind: 'numeric', prompt: 'x · 7 = 21. x?', correctAnswer: 3, conceptTag: 'множитель', cognitiveLevel: 'apply', explanation: '21÷7=3.' },
        { id: 'm5', kind: 'numeric', prompt: 'В x коробках по 5 яблок = 35. x?', correctAnswer: 7, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '35÷5=7.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'x · 6 = 48. x?', correctAnswer: 8, conceptTag: 'множитель', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '54 ÷ x = 9. x?', correctAnswer: 6, conceptTag: 'делитель', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'x ÷ 7 = 5. x?', correctAnswer: 35, conceptTag: 'делимое', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'x · 9 = 63. x?', correctAnswer: 7, conceptTag: 'множитель', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'В x клетках по 6 кроликов = 42. x?', correctAnswer: 7, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — В несколько раз больше/меньше
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: '«В 3 раза больше» — не сложение!',
    subtitle: '«В» = ×, «на» = +',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '«В N раз больше» — это умножение, а не сложение.',
      body: 'У А. 4 марки, у Б. в 3 раза больше = 4 × 3 = 12.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🐹', accent: 'sky', caption: 'У хомяка 4 семечки' },
        { emoji: '🐘', accent: 'amber', caption: 'У слона в 3 раза больше' },
        { emoji: '✖️', accent: 'emerald', caption: '4 × 3 = 12 — это умножение!' }
      ],
      prompt: 'У М. 5 яблок, у П. в 2 раза больше. У П.?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '7' },
        { id: 'b', emoji: '🥇', label: '10', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '3' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: '«В» или «На»?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'У А. 6, у Б. в 3 раза больше. У Б.?', options: ['9', '18', '3', '63'], correctIndex: 1, conceptTag: 'в-больше', explanation: '6·3=18.' },
        { id: 'd2', prompt: 'У М. 20, у П. в 4 раза меньше. У П.?', options: ['16', '5', '24', '80'], correctIndex: 1, conceptTag: 'в-меньше', explanation: '20÷4=5.' },
        { id: 'd3', prompt: '«В N раз больше» — это:', options: ['+ N', '× N', '− N', '÷ N'], correctIndex: 1, conceptTag: 'правило', explanation: '«В раз» = умножение.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Полоски в N раз',
    subtitle: 'Длиннее = ×, короче = ÷',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 4, minCols: 2, maxCols: 8, defaultRows: 2, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: 'А = 3, Б в 4 раза длиннее. Сколько в Б?', options: ['7', '12', '34', '4'], correctIndex: 1, explanation: '3×4=12.' },
        { id: 'p2', prompt: 'А = 20, Б в 5 раз короче. Б?', options: ['25', '4', '15', '100'], correctIndex: 1, explanation: '20÷5=4.' }
      ],
      copy: { headline: 'В N раз больше = ×N. В N раз меньше = ÷N.', body: 'Запомни эти два правила навсегда.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правило «в … раз»',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'В vs На',
          panels: [
            { emoji: '✖️', accent: 'sky', caption: '«В» = умножение' },
            { emoji: '➕', accent: 'amber', caption: '«На» = сложение' },
            { emoji: '🎯', accent: 'emerald', caption: 'Слово важно!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**«В N раз больше» = умножить на N.** **«В N раз меньше» = разделить на N.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a \\text{ в } N \\text{ раз больше} \\Rightarrow a \\cdot N' },
        { id: 'c4', kind: 'formula', content: 'a \\text{ в } N \\text{ раз меньше} \\Rightarrow a \\div N' },
        {
          id: 'c5', kind: 'tap-reveal',
          content: 'А что с «на N»?',
          revealedKind: 'text',
          revealedContent: '«на N больше» = +N (сложение). «на N меньше» = −N (вычитание). Всего одно слово меняет действие!',
          revealedHint: '«В» — ×÷. «На» — +−.'
        }
      ],
      checks: [
        { id: 'ch1', prompt: 'У А. 7, у Б. в 4 раза больше. У Б.?', options: ['11', '28', '7', '74'], correctIndex: 1 },
        { id: 'ch2', prompt: 'У М. 36, у П. в 6 раза меньше. У П.?', options: ['30', '6', '42', '216'], correctIndex: 1 },
        { id: 'ch3', prompt: 'У К. 5, у Л. в 9 раз больше. У Л.?', options: ['14', '45', '4', '50'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Сравнение «в» и «на»',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: '«В N раз» vs «На N»',
      anatomy: [
        { id: 'a1', label: 'на N больше', role: '+ N', accent: 'sky' },
        { id: 'a2', label: 'на N меньше', role: '− N', accent: 'amber' },
        { id: 'a3', label: 'в N раз больше', role: '× N', accent: 'green' },
        { id: 'a4', label: 'в N раз меньше', role: '÷ N', accent: 'rose' }
      ],
      terms: [
        { term: 'Кратное увеличение', definition: 'Умножение на число — «в N раз больше».', example: '4 в 3 раза = 12', speakText: 'Кратное увеличение — умножение' }
      ],
      buildTask: {
        prompt: 'У А. 6 наклеек, у Б. в 4 раза больше. У Б. = ___',
        template: '___',
        expected: ['24'],
        distractors: ['10', '2', '64', '12', '46']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем «в раз»',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: ищи слово «в … раз».',
      examples: [
        {
          id: 'ex1', problem: 'У Айгуль 6 наклеек, у брата в 4 раза больше. Сколько у брата?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сигнал', explanation: '«в 4 раза больше» = ×4.', visual: { kind: 'board', boardLines: ['В 4 раза → × 4'] }, action: { kind: 'numeric', prompt: 'На что умножать?', expected: 4 } },
            { index: 2, title: 'Считаем', explanation: '6×4=24.', action: { kind: 'numeric', prompt: '?', expected: 24 } }
          ]
        },
        {
          id: 'ex2', problem: 'У Армана 30 марок, у сестры в 6 раз меньше. Сколько у сестры?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '30÷6=5.', action: { kind: 'numeric', prompt: '?', expected: 5 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем «в раз»',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задание с ответом',
          left: [
            { id: 'L1', label: '5 в 3 раза' },
            { id: 'L2', label: '24 в 4 раза меньше' },
            { id: 'L3', label: '8 в 5 раз' },
            { id: 'L4', label: '36 в 6 раз меньше' }
          ],
          right: [
            { id: 'R1', label: '15', pairId: 'L1' },
            { id: 'R2', label: '6', pairId: 'L2' },
            { id: 'R3', label: '40', pairId: 'L3' },
            { id: 'R4', label: '6', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'У А. 7, у Б. в 4 раза больше. У Б.?', correctAnswer: 28 },
        { kind: 'numeric', id: 't3', prompt: 'У М. 45, у П. в 5 раза меньше. У П.?', correctAnswer: 9 },
        { kind: 'numeric', id: 't4', prompt: '9 в 3 раза = ?', correctAnswer: 27 },
        { kind: 'numeric', id: 't5', prompt: '20 в 2 раза меньше = ?', correctAnswer: 10 },
        { kind: 'numeric', id: 't6', prompt: '7 в 6 раз = ?', correctAnswer: 42 }
      ],
      socraticHints: {
        t2: ['«В 4 раза больше» — умножить на что?'],
        t3: ['«В 5 раза меньше» — какое действие?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Сравнение животных',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'В зоопарке',
        roleplay: 'Зоолог сравнивает рацион животных. Помоги.',
        characterName: 'Зоолог Сауле',
        mascotLine: '«В» = ×, «на» = +!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Зоолог', request: 'Кролик ест 6 морковок. Слон в 5 раз больше. Сколько ест слон?', correct: 30, wrongFeedback: '6×5=30.', revenueReward: 60, reputationReward: 1 },
        { id: 'o2', customer: 'Смотритель', request: 'Лев ест 50 кг мяса в неделю, тигр в 5 раз меньше. Тигр?', correct: 10, wrongFeedback: '50÷5=10.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Бухгалтер', request: 'Жираф 9 кг листьев. Бегемот в 6 раз больше. Бегемот?', correct: 54, wrongFeedback: '9×6=54.', revenueReward: 80, reputationReward: 1 },
        { id: 'o4', customer: 'Гость', request: 'Слон 80 литров воды, антилопа в 8 раз меньше. Антилопа?', correct: 10, wrongFeedback: '80÷8=10.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный зоолог',
        request: 'ФИНАЛ: Кит ест 200 кг рыбы, дельфин в 4 раза меньше. Сколько дельфин?',
        correct: 50,
        wrongFeedback: '200÷4=50.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай «в» и «на»',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Сравниватель', emoji: '⚖️' },
      intro: 'Самая частая ошибка во 2 классе.',
      traps: [
        { id: 'tr1', wrongStatement: '«В 3 раза больше» = +3', whyWrong: '«В» — это умножение. «На» — сложение.', correctStatement: '×3', rememberNote: 'В = ×, на = +.' },
        { id: 'tr2', wrongStatement: '«В 4 раза меньше» = −4', whyWrong: '«В меньше» = ÷.', correctStatement: '÷ 4', rememberNote: 'В меньше = ÷.' },
        { id: 'tr3', wrongStatement: 'Делил большее на меньшее наоборот', whyWrong: 'Если в 5 раз меньше — нужно поделить большее, а не наоборот.', correctStatement: 'Большое ÷ N', rememberNote: 'Дели большое.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни «в раз»',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи разницу между «в раз» и «на»',
      coverPrompts: ['Что значит «в N раз больше»?', 'А «в N раз меньше»?', 'Чем это отличается от «на N»?'],
      referenceAnswer: 'Если в задаче говорят «в N раз больше», нужно умножить на N. Если «в N раз меньше» — разделить на N. Это отличается от «на N»: там сложение или вычитание. Например, «в 3 раза больше» = ×3, а «на 3 больше» = +3.',
      requiredConcepts: ['в раз', 'умножение', 'деление'],
      conceptKeywords: {
        'в раз': ['раз', 'кратн'],
        'умножение': ['умнож', 'больш'],
        'деление': ['делен', 'мень']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['раз', 'больш'] }
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
      shareCapsuleName: 'В N раз · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '6 в 4 раза = ?', correctAnswer: 24, conceptTag: 'в-больше', cognitiveLevel: 'apply', explanation: '6·4=24.' },
        { id: 'm2', kind: 'numeric', prompt: '40 в 5 раз меньше = ?', correctAnswer: 8, conceptTag: 'в-меньше', cognitiveLevel: 'apply', explanation: '40÷5=8.' },
        { id: 'm3', kind: 'numeric', prompt: 'У А. 7 ручек, у Б. в 3 раза больше. У Б.?', correctAnswer: 21, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '7·3=21.' },
        { id: 'm4', kind: 'choice', prompt: '«В 5 раз больше» — это:', options: ['+5', '−5', '×5', '÷5'], correctIndex: 2, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'numeric', prompt: 'У М. 50 тг, у П. в 2 раза меньше. У П.?', correctAnswer: 25, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '50÷2=25.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '8 в 6 раз = ?', correctAnswer: 48, conceptTag: 'в-больше', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '42 в 7 раз меньше = ?', correctAnswer: 6, conceptTag: 'в-меньше', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'У А. 5, у Б. в 9 раз больше. У Б.?', correctAnswer: 45, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: '«В 3 раза меньше» — это:', options: ['+3', '−3', '×3', '÷3'], correctIndex: 3, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'p5', kind: 'numeric', prompt: '60 в 4 раза меньше = ?', correctAnswer: 15, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Кратное сравнение
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Во сколько раз?',
    subtitle: 'Кратное сравнение',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '«Во сколько раз больше?» — это деление: 12 ÷ 4 = 3.',
      body: 'Не путай с «на сколько больше» — там вычитание.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🐭', accent: 'sky', caption: 'Мышка съела 4 семечки' },
        { emoji: '🦫', accent: 'amber', caption: 'Бобр съел 20' },
        { emoji: '➗', accent: 'emerald', caption: 'В 5 раз больше! 20÷4=5' }
      ],
      prompt: 'Во сколько раз 20 больше 5?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '4', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '15' },
        { id: 'c', emoji: '🤯', label: '25' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь кратность?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Во сколько раз 18 больше 6?', options: ['3', '12', '24', '108'], correctIndex: 0, conceptTag: 'кратное', explanation: '18÷6=3.' },
        { id: 'd2', prompt: 'Во сколько раз 7 меньше 35?', options: ['5', '28', '42', '245'], correctIndex: 0, conceptTag: 'кратное', explanation: '35÷7=5.' },
        { id: 'd3', prompt: 'Чтобы сравнить «во сколько раз», нужно:', options: ['Сложить', 'Вычесть', 'Поделить', 'Умножить'], correctIndex: 2, conceptTag: 'правило', explanation: 'Кратное = деление.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Сколько раз помещается',
    subtitle: 'Большое ÷ меньшее',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 30, step: 1 },
      probes: [
        { id: 'p1', prompt: 'Сколько раз 4 помещается в 12?', options: ['2', '3', '4', '8'], correctIndex: 1 },
        { id: 'p2', prompt: 'Сколько раз 5 помещается в 25?', options: ['4', '5', '6', '20'], correctIndex: 1 }
      ],
      copy: { headline: 'Во сколько раз больше = сколько раз помещается', body: 'Это и есть деление.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правило кратного',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: '«Во сколько» vs «На сколько»',
          panels: [
            { emoji: '➗', accent: 'sky', caption: '«Во сколько» — деление' },
            { emoji: '➖', accent: 'amber', caption: '«На сколько» — вычитание' },
            { emoji: '🎯', accent: 'emerald', caption: 'Слово важно!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Чтобы узнать, во сколько раз одно число больше другого, нужно бо́льшее разделить на меньшее.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'a \\div b = \\text{во сколько раз}, \\quad a > b' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А «на сколько»?',
          revealedKind: 'text',
          revealedContent: '«На сколько больше/меньше» — вычитание: бо́льшее − меньшее. Не путай с «во сколько раз»!',
          revealedHint: '«Раз» — деление. Без «раз» — вычитание.'
        },
        { id: 'c5', kind: 'text', content: 'Например: 24 и 6. Во сколько раз 24 больше? 24 ÷ 6 = 4 раза. На сколько больше? 24 − 6 = 18.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Во сколько раз 30 больше 5?', options: ['6', '25', '35', '150'], correctIndex: 0 },
        { id: 'ch2', prompt: 'Во сколько раз 9 меньше 27?', options: ['3', '18', '36', '243'], correctIndex: 0 },
        { id: 'ch3', prompt: 'Во сколько раз 40 больше 8?', options: ['5', '32', '48', '320'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Кратное сравнение',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Сравнения',
      anatomy: [
        { id: 'a1', label: 'На сколько больше?', role: 'разностное (−)', accent: 'sky' },
        { id: 'a2', label: 'Во сколько раз больше?', role: 'кратное (÷)', accent: 'amber' }
      ],
      terms: [
        { term: 'Кратное сравнение', definition: 'Сравнение через деление: «во сколько раз».', example: '24 ÷ 6 = 4 раза', speakText: 'Кратное сравнение через деление' }
      ],
      buildTask: {
        prompt: 'У А. 32 марок, у Б. 8. Во сколько раз у А. больше? ___',
        template: '___',
        expected: ['4'],
        distractors: ['24', '40', '8', '32', '6']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем кратное',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: бо́льшее ÷ меньшее.',
      examples: [
        {
          id: 'ex1', problem: 'У А. 32 марок, у Б. 8. Во сколько раз у А. больше?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Большее', explanation: '32 > 8. Большее — 32.', visual: { kind: 'board', boardLines: ['32 ÷ 8 = ?'] }, action: { kind: 'numeric', prompt: 'Большее?', expected: 32 } },
            { index: 2, title: 'Считаем', explanation: '32 ÷ 8 = 4.', action: { kind: 'numeric', prompt: '?', expected: 4 } }
          ]
        },
        {
          id: 'ex2', problem: 'У М. 5, у П. 30. Во сколько раз у М. меньше?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '30 ÷ 5 = 6.', action: { kind: 'numeric', prompt: '?', expected: 6 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем кратное',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задание с ответом',
          left: [
            { id: 'L1', label: '24 и 6 (во сколько раз больше?)' },
            { id: 'L2', label: '5 и 30 (во сколько раз меньше?)' },
            { id: 'L3', label: '36 и 4' },
            { id: 'L4', label: '9 и 45' }
          ],
          right: [
            { id: 'R1', label: '4', pairId: 'L1' },
            { id: 'R2', label: '6', pairId: 'L2' },
            { id: 'R3', label: '9', pairId: 'L3' },
            { id: 'R4', label: '5', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: 'Во сколько раз 40 больше 5?', correctAnswer: 8 },
        { kind: 'numeric', id: 't3', prompt: 'Во сколько раз 7 меньше 28?', correctAnswer: 4 },
        { kind: 'numeric', id: 't4', prompt: 'Во сколько раз 50 больше 10?', correctAnswer: 5 },
        { kind: 'numeric', id: 't5', prompt: 'Во сколько раз 21 больше 3?', correctAnswer: 7 },
        { kind: 'numeric', id: 't6', prompt: 'Во сколько раз 6 меньше 54?', correctAnswer: 9 }
      ],
      socraticHints: {
        t2: ['Сколько раз 5 помещается в 40?'],
        t3: ['28÷7=?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Сравнение животных',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Спортивный день в зоопарке',
        roleplay: 'Помоги тренеру сравнивать достижения животных.',
        characterName: 'Тренер Адиль',
        mascotLine: 'Большое ÷ меньшее = во сколько раз!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Тренер', request: 'Гепард 18 м/с, черепаха 6 м/с. Во сколько раз быстрее гепард?', correct: 3, wrongFeedback: '18÷6=3.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Тренер', request: 'Бакыт 4 круга, Кайрат 32. Во сколько раз меньше у Бакыта?', correct: 8, wrongFeedback: '32÷4=8.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Тренер', request: 'Динара 50 м/с, Сабина 10 м/с. Во сколько раз быстрее Динара?', correct: 5, wrongFeedback: '50÷10=5.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Финал', request: 'Лучший результат 45, средний 5. Во сколько раз?', correct: 9, wrongFeedback: '45÷5=9.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Чемпион',
        request: 'ФИНАЛ: Орёл летит 80 км/ч, голубь 8 км/ч. Во сколько раз быстрее орёл?',
        correct: 10,
        wrongFeedback: '80÷8=10.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай с «на»',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Кратный мастер', emoji: '➗' },
      intro: '«На сколько» и «во сколько» — разные вопросы.',
      traps: [
        { id: 'tr1', wrongStatement: '«Во сколько раз 24 больше 6 = 18»', whyWrong: 'Это «на сколько», а не «во сколько». Кратное — деление: 24÷6=4.', correctStatement: 'В 4 раза', rememberNote: 'Во раз = ÷.' },
        { id: 'tr2', wrongStatement: 'Делил меньшее на бо́льшее', whyWrong: 'В кратном сравнении большое сверху: 24÷6, а не 6÷24.', correctStatement: 'Большое ÷ меньшее', rememberNote: 'Большое сверху.' },
        { id: 'tr3', wrongStatement: 'Не определил тип вопроса', whyWrong: '«На сколько» = вычитание. «Во сколько раз» = деление.', correctStatement: 'Читай вопрос', rememberNote: 'Тип = действие.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни кратное',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи разницу «во сколько раз» и «на сколько»',
      coverPrompts: ['Что значит «во сколько раз больше»?', 'Какое действие?', 'Чем отличается от «на сколько больше»?'],
      referenceAnswer: 'Кратное сравнение отвечает на вопрос «во сколько раз». Действие — деление: бо́льшее число делим на меньшее. Например, 24 и 6: 24 ÷ 6 = 4 раза. Это отличается от «на сколько», где используется вычитание.',
      requiredConcepts: ['кратное', 'деление'],
      conceptKeywords: {
        кратное: ['кратн', 'раз'],
        деление: ['делен', 'дели']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['кратн', 'делен'] }
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
      shareCapsuleName: 'Кратное сравнение · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: 'Во сколько раз 35 больше 5?', correctAnswer: 7, conceptTag: 'кратное', cognitiveLevel: 'apply', explanation: '35÷5=7.' },
        { id: 'm2', kind: 'numeric', prompt: 'Во сколько раз 6 меньше 24?', correctAnswer: 4, conceptTag: 'кратное', cognitiveLevel: 'apply', explanation: '24÷6=4.' },
        { id: 'm3', kind: 'choice', prompt: '«Во сколько раз» — действие:', options: ['+', '−', '×', '÷'], correctIndex: 3, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm4', kind: 'numeric', prompt: 'Бакыт 8, Адиль 40. Во сколько раз больше у Адиля?', correctAnswer: 5, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '40÷8=5.' },
        { id: 'm5', kind: 'numeric', prompt: 'Во сколько раз 4 меньше 36?', correctAnswer: 9, conceptTag: 'кратное', cognitiveLevel: 'apply', explanation: '36÷4=9.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: 'Во сколько раз 48 больше 6?', correctAnswer: 8, conceptTag: 'кратное', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: 'Во сколько раз 7 меньше 63?', correctAnswer: 9, conceptTag: 'кратное', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Во сколько раз 50 больше 10?', correctAnswer: 5, conceptTag: 'кратное', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'Во сколько раз 9 меньше 81?', correctAnswer: 9, conceptTag: 'кратное', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'А: 56, Б: 7. Во сколько раз у А больше?', correctAnswer: 8, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 4 — Косвенный вопрос
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L4, layerType: 'HOOK', orderIndex: 1,
    title: 'Не торопись!',
    subtitle: 'Косвенный вопрос — ловушка',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '«У А. 12, это в 3 раза больше Б. Сколько у Б?»',
      body: 'Здесь нужно делить, не умножать. У Б. = 12 ÷ 3 = 4.',
      mascotEntry: 'warn',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🪤', accent: 'rose', caption: 'Это ловушка!' },
        { emoji: '🔍', accent: 'sky', caption: 'Большое уже дано — 12' },
        { emoji: '➗', accent: 'emerald', caption: 'Ищем меньшее → делим' }
      ],
      prompt: 'А чему равно у Б, если 12 в 3 раза больше у Б?',
      emojiChoices: [
        { id: 'a', emoji: '🤯', label: '36' },
        { id: 'b', emoji: '🥇', label: '4', isPrimary: true },
        { id: 'c', emoji: '🤔', label: '15' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Понимаешь косвенный?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '«У А. 20, это на 5 больше, чем у Б». У Б?', options: ['25', '15', '4', '100'], correctIndex: 1, conceptTag: 'косв-на', explanation: '20−5=15.' },
        { id: 'd2', prompt: '«У М. 30, это в 5 раз больше, чем у П». У П?', options: ['6', '150', '25', '35'], correctIndex: 0, conceptTag: 'косв-в', explanation: '30÷5=6.' },
        { id: 'd3', prompt: 'В косвенной задаче нужно действовать:', options: ['Прямо', 'Обратно', 'Не знаю', 'Любо'], correctIndex: 1, conceptTag: 'правило', explanation: 'Косвенный = обратное.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L4, layerType: 'INTUITION', orderIndex: 3,
    title: 'Меньшее — то, что ищем',
    subtitle: 'Если дано большое — делай обратное',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 30, step: 1 },
      probes: [
        { id: 'p1', prompt: '«У А. 24 (это в 4 раза больше Б). У Б?»', options: ['28', '6', '20', '96'], correctIndex: 1, explanation: '24÷4=6.' },
        { id: 'p2', prompt: '«У М. 18 (это на 6 больше П). У П?»', options: ['24', '12', '3', '108'], correctIndex: 1, explanation: '18−6=12.' }
      ],
      copy: { headline: 'Если в задаче дано бо́льшее число — действуй наоборот', body: 'Прямая: ищем больше → +, ×. Косвенная: ищем меньше при данном больше → −, ÷.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L4, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Прямой и косвенный вопрос',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Прямой vs косвенный',
          panels: [
            { emoji: '➡️', accent: 'sky', caption: 'Прямой: дано меньшее → ищем больше' },
            { emoji: '⬅️', accent: 'amber', caption: 'Косвенный: дано большее → ищем меньше' },
            { emoji: '🎯', accent: 'emerald', caption: 'Действия — обратные!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Прямой вопрос:** даётся меньшее число, нужно найти бо́льшее. Действие — прямое (+, ×).',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'callout', content: '**Косвенный вопрос:** даётся бо́льшее, нужно найти меньшее. Действие — обратное (−, ÷).' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Как различить?',
          revealedKind: 'text',
          revealedContent: 'Спроси: «Чьё число дано — большего или меньшего?». Если большего — это косвенная задача, действуй наоборот.',
          revealedHint: 'Чьё число — то и подсказка.'
        },
        { id: 'c5', kind: 'text', content: 'Прямой: «У А. 5, у Б. в 3 раза больше» → Б = 5×3=15. Косвенный: «У А. 15, это в 3 раза больше Б» → Б = 15÷3=5.' }
      ],
      checks: [
        { id: 'ch1', prompt: '«У А. 30, это на 8 больше Б». У Б?', options: ['38', '22', '4', '240'], correctIndex: 1 },
        { id: 'ch2', prompt: '«У М. 27, это в 3 раза больше П». У П?', options: ['9', '24', '30', '81'], correctIndex: 0 },
        { id: 'ch3', prompt: '«У К. 12, это в 4 раза меньше Л». У Л?', options: ['3', '8', '48', '16'], correctIndex: 2 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L4, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Прямой vs косвенный',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Виды вопросов',
      anatomy: [
        { id: 'a1', label: 'Прямой', role: 'дано меньшее, ищем большее (+, ×)', accent: 'green' },
        { id: 'a2', label: 'Косвенный', role: 'дано большее, ищем меньшее (−, ÷)', accent: 'rose' }
      ],
      terms: [
        { term: 'Косвенный вопрос', definition: 'Когда сравнение даётся не относительно искомого числа.', example: '«у А. 12, это в 3 раза больше Б»', speakText: 'Косвенный — обратное действие' }
      ],
      buildTask: {
        prompt: 'У А. 24, это в 4 раза больше Б. У Б = ___',
        template: '___',
        expected: ['6'],
        distractors: ['96', '20', '28', '4', '24']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем косвенный',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: пойми, кто известен → делай обратное действие.',
      examples: [
        {
          id: 'ex1', problem: 'У Алии 24, это в 4 раза больше, чем у Дины. Сколько у Дины?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Кто известен?', explanation: 'У Алии 24 — это бо́льшее.', visual: { kind: 'board', boardLines: ['Алия = 24 (большое)', 'Дина = ? (меньшее)'] }, action: { kind: 'numeric', prompt: 'Алия?', expected: 24 } },
            { index: 2, title: 'Действие', explanation: 'Раз даётся «больше», ищем «меньше» — делим. 24÷4=6.', action: { kind: 'numeric', prompt: 'У Дины?', expected: 6 } }
          ]
        },
        {
          id: 'ex2', problem: 'У М. 18, это на 5 больше, чем у П. Сколько у П?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: 'Меньшее = 18−5=13.', action: { kind: 'numeric', prompt: '?', expected: 13 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем косвенный',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: 'А=12, в 3 раза > Б' },
            { id: 'L2', label: 'М=20, на 8 > П' },
            { id: 'L3', label: 'К=30, в 5 раз > Л' },
            { id: 'L4', label: 'Д=15, в 5 раз < С' }
          ],
          right: [
            { id: 'R1', label: 'Б=4', pairId: 'L1' },
            { id: 'R2', label: 'П=12', pairId: 'L2' },
            { id: 'R3', label: 'Л=6', pairId: 'L3' },
            { id: 'R4', label: 'С=75', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '«А=40, на 15 > С». С?', correctAnswer: 25 },
        { kind: 'numeric', id: 't3', prompt: '«А=18, в 3 раза > Б». Б?', correctAnswer: 6 },
        { kind: 'numeric', id: 't4', prompt: '«М=50, на 25 > П». П?', correctAnswer: 25 },
        { kind: 'numeric', id: 't5', prompt: '«К=42, в 6 раз > Л». Л?', correctAnswer: 7 },
        { kind: 'numeric', id: 't6', prompt: '«Д=8, в 4 раза < С». С?', correctAnswer: 32 }
      ],
      socraticHints: {
        t2: ['А — большее. Что сделать с 40?'],
        t3: ['А известно — большее. Какое действие?'],
        t6: ['Тут наоборот: Д — меньшее. Чтобы найти С — какое действие?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L4, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Олимпиада в зоопарке',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Олимпиада среди животных',
        roleplay: 'Сравнения в задачах могут быть косвенными. Помоги решать.',
        characterName: 'Судья Дина',
        mascotLine: 'Если дано большое — ищи меньшее обратно!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Зоолог 1', request: '«Лев 35 кг мяса, это в 5 раз больше тигра». Тигр?', correct: 7, wrongFeedback: '35÷5=7.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Зоолог 2', request: '«Слон 28 л воды, это на 12 больше антилопы». Антилопа?', correct: 16, wrongFeedback: '28−12=16.', revenueReward: 50, reputationReward: 1 },
        { id: 'o3', customer: 'Зоолог 3', request: '«Заяц 9 морковок, это в 4 раза меньше лося». Лось?', correct: 36, wrongFeedback: '9×4=36.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Финал', request: '«Кит 50 м, это на 18 больше дельфина». Дельфин?', correct: 32, wrongFeedback: '50−18=32.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Чемпионат',
        request: 'ФИНАЛ: «Орёл 90 км/ч, это в 9 раз больше курицы». Курица?',
        correct: 10,
        wrongFeedback: '90÷9=10.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L4, layerType: 'TRAPS', orderIndex: 9,
    title: 'Главный капкан',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Ловушкоустойчивый', emoji: '🪤' },
      intro: 'Косвенный вопрос — мощная ловушка.',
      traps: [
        { id: 'tr1', wrongStatement: '«У А. 12, это в 3 раза больше Б. У Б = 12·3 = 36»', whyWrong: 'Раз большее уже дано (12), а Б — меньшее, нужно делить: 12÷3=4.', correctStatement: '4', rememberNote: 'Большое дано — обратное.' },
        { id: 'tr2', wrongStatement: 'Не понял, кто больше', whyWrong: 'Перечитай задачу 2 раза. Найди, чьё число дано.', correctStatement: 'Внимательное чтение', rememberNote: 'Не торопись.' },
        { id: 'tr3', wrongStatement: 'Применил прямое правило', whyWrong: 'Если даётся «А — больше Б на/в N», нужно делать обратное действие.', correctStatement: 'Обратное действие', rememberNote: 'Косвенно = обратно.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни косвенный',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как решать косвенные задачи',
      coverPrompts: ['Что такое косвенный вопрос?', 'Чем он отличается от прямого?', 'Покажи пример.'],
      referenceAnswer: 'В косвенной задаче дано не меньшее число, как обычно, а большее. И сравнение «больше» относится к нему. Чтобы найти меньшее, нужно делать обратное действие. Например, «У А. 24, это в 4 раза больше, чем у Б». Тут А — большее. У Б = 24÷4 = 6.',
      requiredConcepts: ['косвенный', 'обратное'],
      conceptKeywords: {
        косвенный: ['косв'],
        обратное: ['обрат', 'наоборот']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['косв', 'обрат'] }
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
      shareCapsuleName: 'Косвенный вопрос · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '«У А. 18, это в 6 раз больше Б». У Б?', correctAnswer: 3, conceptTag: 'косв-в', cognitiveLevel: 'apply', explanation: '18÷6=3.' },
        { id: 'm2', kind: 'numeric', prompt: '«У М. 25, это на 10 больше П». У П?', correctAnswer: 15, conceptTag: 'косв-на', cognitiveLevel: 'apply', explanation: '25−10=15.' },
        { id: 'm3', kind: 'numeric', prompt: '«У К. 45, это в 5 раз больше Л». У Л?', correctAnswer: 9, conceptTag: 'косв-в', cognitiveLevel: 'apply', explanation: '45÷5=9.' },
        { id: 'm4', kind: 'numeric', prompt: '«У Д. 6, это в 4 раза меньше С». У С?', correctAnswer: 24, conceptTag: 'косв-меньше', cognitiveLevel: 'apply', explanation: '6·4=24.' },
        { id: 'm5', kind: 'choice', prompt: 'В косвенной задаче действие:', options: ['Прямое', 'Обратное', 'Любое'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '«У А. 40, это в 8 раз больше Б». У Б?', correctAnswer: 5, conceptTag: 'косв-в', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '«У М. 30, это на 12 больше П». У П?', correctAnswer: 18, conceptTag: 'косв-на', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '«У К. 7, это в 5 раз меньше Л». У Л?', correctAnswer: 35, conceptTag: 'косв-меньше', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '«У А. 50, это на 35 больше Б». У Б?', correctAnswer: 15, conceptTag: 'косв-на', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '«У Д. 8, это в 6 раз меньше С». У С?', correctAnswer: 48, conceptTag: 'косв-меньше', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 5 — Цена, количество, стоимость
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L5, layerType: 'HOOK', orderIndex: 1,
    title: 'Тройка из магазина',
    subtitle: 'Цена · Количество = Стоимость',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Цена × Количество = Стоимость. Простая формула — но решает кучу задач!',
      body: 'Карандаш — 30 тг. Купил 4. Стоимость = 30 × 4 = 120 тг.',
      mascotEntry: 'trophy',
      bgPattern: 'stars',
      successSfx: 'cheer',
      frames: [
        { emoji: '🍎', accent: 'sky', caption: 'Цена за 1: 20 тг' },
        { emoji: '🛒', accent: 'amber', caption: 'Количество: 5 шт' },
        { emoji: '💰', accent: 'emerald', caption: 'К оплате: 100 тг!' }
      ],
      prompt: '5 яблок по 20 тг. Сколько заплатить?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '25 тг' },
        { id: 'b', emoji: '🥇', label: '100 тг', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '15 тг' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L5, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь формулу?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '3 ручки по 50 тг. Стоимость?', options: ['53 тг', '150 тг', '47 тг', '15 тг'], correctIndex: 1, conceptTag: 'стоимость', explanation: '50×3=150.' },
        { id: 'd2', prompt: 'Заплатил 200 тг за 4 тетради. Цена?', options: ['50 тг', '204 тг', '800 тг', '196 тг'], correctIndex: 0, conceptTag: 'цена', explanation: '200÷4=50.' },
        { id: 'd3', prompt: 'Карандаш 20 тг, заплатил 100 тг. Сколько штук?', options: ['5', '120', '80', '4'], correctIndex: 0, conceptTag: 'количество', explanation: '100÷20=5.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L5, layerType: 'INTUITION', orderIndex: 3,
    title: 'Чек из магазина',
    subtitle: 'Тройка цена-количество-стоимость',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 1, maxRows: 5, minCols: 1, maxCols: 8, defaultRows: 1, defaultCols: 4 },
      probes: [
        { id: 'p1', prompt: '4 шоколадки по 25 тг. Сколько всего?', options: ['29 тг', '100 тг', '21 тг', '8 тг'], correctIndex: 1, explanation: '25×4=100.' },
        { id: 'p2', prompt: '6 жвачек по 10 тг. Стоимость?', options: ['16 тг', '60 тг', '4 тг', '600 тг'], correctIndex: 1, explanation: '10×6=60.' }
      ],
      copy: { headline: 'Чек = цена за штуку × количество штук', body: 'Это умножение в магазине.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L5, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Тройка цена–количество–стоимость',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Главная формула покупок',
          panels: [
            { emoji: '🏷️', accent: 'sky', caption: 'Цена: 30 тг' },
            { emoji: '✖️', accent: 'amber', caption: '× Количество: 4' },
            { emoji: '💰', accent: 'emerald', caption: '= Стоимость: 120 тг' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Стоимость = Цена × Количество.** Это главная формула покупок.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'C = \\text{цена} \\times \\text{количество}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А как найти цену или количество?',
          revealedKind: 'text',
          revealedContent: 'Цена = Стоимость ÷ Количество. Количество = Стоимость ÷ Цена. Зная любые два — найдёшь третье!',
          revealedHint: 'Связь × и ÷ снова в действии.'
        },
        { id: 'c5', kind: 'text', content: 'Пример: тетрадь 40 тг, купил 5 штук → стоимость 40 × 5 = 200 тг. Если знаешь, что 5 тетрадей стоят 200 тг → цена одной = 200 ÷ 5 = 40 тг.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'Цена 30, количество 4. Стоимость?', options: ['34', '120', '26', '7'], correctIndex: 1 },
        { id: 'ch2', prompt: 'Стоимость 180, количество 6. Цена?', options: ['30', '186', '174', '1080'], correctIndex: 0 },
        { id: 'ch3', prompt: 'Стоимость 90, цена 15. Количество?', options: ['6', '105', '75', '1350'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L5, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Формулы тройки',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Цена × Количество = Стоимость',
      anatomy: [
        { id: 'a1', label: 'Цена', role: 'сколько стоит 1 штука (тг)', accent: 'sky' },
        { id: 'a2', label: 'Количество', role: 'сколько штук купили', accent: 'amber' },
        { id: 'a3', label: 'Стоимость', role: 'сколько заплатили всего (тг)', accent: 'green' }
      ],
      terms: [
        { term: 'Цена', definition: 'Стоимость одной штуки.', example: 'Хлеб — 80 тг за буханку', speakText: 'Цена — сколько за одну штуку' },
        { term: 'Количество', definition: 'Сколько штук куплено.', example: '3 буханки', speakText: 'Количество — сколько штук' },
        { term: 'Стоимость', definition: 'Сумма к оплате.', example: '80 × 3 = 240 тг', speakText: 'Стоимость — общая сумма' }
      ],
      buildTask: {
        prompt: 'Цена 25 тг, количество 4. Стоимость?',
        template: '___ тг',
        expected: ['100'],
        distractors: ['29', '21', '254', '50', '400']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L5, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем задачи',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: определи, что неизвестно → выбери формулу.',
      examples: [
        {
          id: 'ex1', problem: 'Конфета — 15 тг, купил 6 штук. Сколько заплатил?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что ищем?', explanation: 'Неизвестна стоимость. Цена × количество.', visual: { kind: 'board', boardLines: ['С = 15 × 6'] }, action: { kind: 'numeric', prompt: 'Цена?', expected: 15 } },
            { index: 2, title: 'Считаем', explanation: '15 × 6 = 90 тг.', action: { kind: 'numeric', prompt: 'Стоимость?', expected: 90 } }
          ]
        },
        {
          id: 'ex2', problem: 'Заплатил 120 тг за 4 ручки. Цена одной?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что ищем?', explanation: 'Неизвестна цена. Стоимость ÷ количество.', visual: { kind: 'board', boardLines: ['Цена = 120 ÷ 4'] }, action: { kind: 'numeric', prompt: 'Стоимость?', expected: 120 } },
            { index: 2, title: 'Считаем', explanation: '120 ÷ 4 = 30 тг.', action: { kind: 'numeric', prompt: 'Цена?', expected: 30 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L5, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем формулы',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: '4 шт по 30 тг' },
            { id: 'L2', label: '5 шт по 20 тг' },
            { id: 'L3', label: '90 тг за 3 шт. Цена?' },
            { id: 'L4', label: 'Книга 50 тг, заплатил 200. Шт?' }
          ],
          right: [
            { id: 'R1', label: '120 тг', pairId: 'L1' },
            { id: 'R2', label: '100 тг', pairId: 'L2' },
            { id: 'R3', label: '30 тг', pairId: 'L3' },
            { id: 'R4', label: '4', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '6 конфет на 60 тг. Цена одной?', correctAnswer: 10 },
        { kind: 'numeric', id: 't3', prompt: 'Жвачка 5 тг, заплатил 40. Шт?', correctAnswer: 8 },
        { kind: 'numeric', id: 't4', prompt: '7 шоколадок по 25 тг. Стоимость?', correctAnswer: 175 },
        { kind: 'numeric', id: 't5', prompt: 'Заплатил 80 тг за 8 жвачек. Цена?', correctAnswer: 10 },
        { kind: 'numeric', id: 't6', prompt: '4 пакета по 150 тг. Стоимость?', correctAnswer: 600 }
      ],
      socraticHints: {
        t2: ['Стоимость ÷ количество = ?'],
        t3: ['Стоимость ÷ цена = ?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L5, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Зоомагазин',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Зоомагазин «У зоопарка»',
        roleplay: 'Стань кассиром: продавай корма, ошейники, игрушки.',
        characterName: 'Кассир Айгерим',
        mascotLine: 'Цена × количество = к оплате!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Хозяин', request: '6 пачек корма по 80 тг. К оплате?', correct: 480, wrongFeedback: '80×6=480.', revenueReward: 480, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Заплатил 100 тг за 5 косточек. Цена одной?', correct: 20, wrongFeedback: '100÷5=20.', revenueReward: 100, reputationReward: 1 },
        { id: 'o3', customer: 'Мама', request: 'Игрушка 60 тг, заплатила 300 тг. Сколько штук?', correct: 5, wrongFeedback: '300÷60=5.', revenueReward: 300, reputationReward: 1 },
        { id: 'o4', customer: 'Папа', request: '4 ошейника по 150 тг. К оплате?', correct: 600, wrongFeedback: '150×4=600.', revenueReward: 600, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой заказ',
        request: 'ФИНАЛ: 8 мешков корма по 250 тг. К оплате?',
        correct: 2000,
        wrongFeedback: '250×8=2000.',
        revenueReward: 2000,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L5, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в формулах',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Кассир-эксперт', emoji: '🛒' },
      intro: 'Главное — определить, что неизвестно.',
      traps: [
        { id: 'tr1', wrongStatement: '«5 ручек по 20 тг = 25 тг»', whyWrong: 'Сложил вместо умножения. 20×5=100.', correctStatement: '100 тг', rememberNote: 'Цена × количество = ×, не +!' },
        { id: 'tr2', wrongStatement: '«100 тг за 4 шт. Цена = 100×4 = 400»', whyWrong: 'Чтобы найти цену — нужно делить. 100÷4=25 тг.', correctStatement: '25 тг', rememberNote: 'Стоимость ÷ количество = цена.' },
        { id: 'tr3', wrongStatement: '«80 тг, по 10 за штуку. Штук = 80×10 = 800»', whyWrong: 'Количество = стоимость ÷ цена = 80÷10=8.', correctStatement: '8 штук', rememberNote: 'Стоимость ÷ цена = количество.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L5, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни формулу',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшей сестре',
      voicePrompt: 'Расскажи формулу цена-количество-стоимость',
      coverPrompts: ['Что такое цена, количество, стоимость?', 'Как найти стоимость?', 'Как найти цену или количество?'],
      referenceAnswer: 'Цена — это сколько стоит одна штука товара. Количество — сколько штук мы покупаем. Стоимость — общая сумма к оплате. Стоимость = цена × количество. Чтобы найти цену, нужно стоимость разделить на количество. Чтобы найти количество — стоимость разделить на цену. Например, 4 ручки по 30 тг стоят 30 × 4 = 120 тг.',
      requiredConcepts: ['цена', 'количество', 'стоимость'],
      conceptKeywords: {
        цена: ['цен'],
        количество: ['количеств', 'штук'],
        стоимость: ['стоимост', 'оплат']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['цен', 'стоимост'] }
  })

  await insert({
    lessonId: L5, layerType: 'MASTERY_CHECK', orderIndex: 11,
    title: 'Финальная проверка',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, xpReward: 40,
    content: {
      kind: 'MASTERY_CHECK',
      passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Цена-Количество-Стоимость · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '5 ручек по 40 тг. Стоимость?', correctAnswer: 200, conceptTag: 'стоимость', cognitiveLevel: 'apply', explanation: '40×5=200.' },
        { id: 'm2', kind: 'numeric', prompt: '6 тетрадей на 180 тг. Цена?', correctAnswer: 30, conceptTag: 'цена', cognitiveLevel: 'apply', explanation: '180÷6=30.' },
        { id: 'm3', kind: 'numeric', prompt: 'Конфета 15 тг, заплатил 90 тг. Шт?', correctAnswer: 6, conceptTag: 'количество', cognitiveLevel: 'apply', explanation: '90÷15=6.' },
        { id: 'm4', kind: 'numeric', prompt: '3 пачки по 250 тг. К оплате?', correctAnswer: 750, conceptTag: 'стоимость', cognitiveLevel: 'apply', explanation: '250×3=750.' },
        { id: 'm5', kind: 'choice', prompt: 'Чтобы найти цену:', options: ['Сложить', 'Стоимость × количество', 'Стоимость ÷ количество', 'Стоимость − количество'], correctIndex: 2, conceptTag: 'теория', cognitiveLevel: 'understand' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '7 тетрадей по 35 тг. Стоимость?', correctAnswer: 245, conceptTag: 'стоимость', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '4 шт на 240 тг. Цена?', correctAnswer: 60, conceptTag: 'цена', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: 'Жвачка 8 тг, заплатил 64 тг. Шт?', correctAnswer: 8, conceptTag: 'количество', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '6 шт по 75 тг. К оплате?', correctAnswer: 450, conceptTag: 'стоимость', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Книга 120 тг, заплатил 600 тг. Шт?', correctAnswer: 5, conceptTag: 'количество', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Задачи на умножение и деление', layersInsertedByLesson: counter }
})
