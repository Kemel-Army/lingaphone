import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 4 lessons of «Множества и их элементы».
 *   1. Множество и его элементы. Знаки ∈ и ∉
 *   2. Объединение и пересечение множеств
 *   3. Истинные и ложные высказывания
 *   4. Комбинации «по три»
 *
 * S6: тема №09, theme-pack = 'zoo' (классификация животных по множествам).
 * Урок 2 INTUITION использует уникальный SetVennWidget (Эйлера-Венна).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (∈/⚭/✓/🎯).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Множества и их элементы')
  const L1 = lessonIds['Множество и его элементы. Знаки ∈ и ∉']
  const L2 = lessonIds['Объединение и пересечение множеств']
  const L3 = lessonIds['Истинные и ложные высказывания']
  const L4 = lessonIds['Комбинации «по три»']
  if (!L1 || !L2 || !L3 || !L4) throw createError({ statusCode: 500, message: 'Some lessons missing for «Множества и их элементы»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3, L4])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Множество и его элементы
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Что такое множество?',
    subtitle: 'Группа предметов',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Все ученики класса — это множество. Все ручки в пенале — тоже.',
      body: 'Каждый предмет в множестве — его элемент. Знак ∈ — «принадлежит», ∉ — «не принадлежит».',
      mascotEntry: 'teach',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🦁', accent: 'sky', caption: 'Лев — хищник' },
        { emoji: '🐘', accent: 'amber', caption: 'Слон — травоядный' },
        { emoji: '🔵', accent: 'emerald', caption: 'Кружок группирует похожих!' }
      ],
      prompt: 'Что НЕ является множеством?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Все буквы алфавита' },
        { id: 'b', emoji: '🥇', label: 'Один карандаш', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Цифры от 1 до 9' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь о множествах?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'Множество — это:', options: ['Один предмет', 'Группа предметов', 'Число', 'Слово'], correctIndex: 1, conceptTag: 'определение', explanation: 'Группа.' },
        { id: 'd2', prompt: 'Знак ∈ означает:', options: ['Не равно', 'Принадлежит', 'Больше', 'Меньше'], correctIndex: 1, conceptTag: 'знаки', explanation: '∈ = принадлежит.' },
        { id: 'd3', prompt: '5 ∈ {1,2,3,4,5}. Это:', options: ['Истина', 'Ложь', 'Не знаю', 'Бессмыслица'], correctIndex: 0, conceptTag: 'применение', explanation: '5 есть → истина.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Кружок Эйлера',
    subtitle: 'Внутри vs снаружи',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'grouping', totalItems: 8, groupsRange: [2, 4] },
      probes: [
        { id: 'p1', prompt: 'Кружок: 1, 3, 5, 7. 3 принадлежит?', options: ['Да (∈)', 'Нет (∉)', 'Не знаю', 'Иногда'], correctIndex: 0 },
        { id: 'p2', prompt: 'А 4?', options: ['Да (∈)', 'Нет (∉)', 'Иногда', 'Не знаю'], correctIndex: 1 }
      ],
      copy: { headline: 'Множество рисуют как кружок (диаграмма Эйлера)', body: 'Внутри — элементы. Снаружи — НЕ принадлежащие.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Множество и элементы',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Множество за 3 кадра',
          panels: [
            { emoji: '🅰️', accent: 'sky', caption: 'A = имя множества' },
            { emoji: '🔢', accent: 'amber', caption: '{1,2,3} = элементы' },
            { emoji: '∈', accent: 'emerald', caption: '∈ = принадлежит' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Множество** — группа предметов с общим признаком. **Элемент** — один предмет внутри.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'A = \\{1, 3, 5, 7, 9\\}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А что значит ∉?',
          revealedKind: 'text',
          revealedContent: 'Перечёркнутый знак ∉ читается «не принадлежит». Например, 4 ∉ A, потому что в A нет четвёрки.',
          revealedHint: 'Перечёркнутая = НЕ.'
        },
        { id: 'c5', kind: 'text', content: 'Множества обозначаются заглавными буквами: A, B, C. Элементы пишут в фигурных скобках.' }
      ],
      checks: [
        { id: 'ch1', prompt: 'A = {2,4,6,8}. 6 ∈ A?', options: ['Да', 'Нет', 'Не знаю', 'Иногда'], correctIndex: 0 },
        { id: 'ch2', prompt: 'B = {собака, кошка}. рыба ∈ B?', options: ['Да', 'Нет', 'Иногда', 'Бывает'], correctIndex: 1 },
        { id: 'ch3', prompt: 'Знак «принадлежит»:', options: ['∉', '∈', '=', '<'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись множества',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Множество A = {1, 2, 3}',
      anatomy: [
        { id: 'a1', label: 'A', role: 'имя (заглавная)', accent: 'sky' },
        { id: 'a2', label: '{ }', role: 'фигурные скобки', accent: 'amber' },
        { id: 'a3', label: '1, 2, 3', role: 'элементы', accent: 'green' }
      ],
      terms: [
        { term: 'Множество', definition: 'Группа предметов с признаком.', example: 'A = {1,2,3}', speakText: 'Множество — группа' },
        { term: 'Элемент', definition: 'Один предмет внутри.', example: '5 — элемент {1,3,5}', speakText: 'Элемент — один из множества' }
      ],
      buildTask: {
        prompt: 'Запиши множество чётных чисел до 10:',
        template: 'A = {___}',
        expected: ['2, 4, 6, 8, 10'],
        distractors: ['1,2,3', '5,10', '0,2,4', '2,4,6,8', '10']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Проверяем принадлежность',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: смотри на множество → ищи элемент → есть = ∈, нет = ∉.',
      examples: [
        {
          id: 'ex1', problem: 'A = {1, 2, 3, 5, 8}. 5 ∈ A?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Что в множестве?', explanation: '1, 2, 3, 5, 8.', visual: { kind: 'board', boardLines: ['A = {1, 2, 3, 5, 8}'] }, action: { kind: 'choice', prompt: 'Сколько элементов?', options: ['4', '5', '6'], correctIndex: 1 } },
            { index: 2, title: 'Есть 5?', explanation: 'Да.', action: { kind: 'choice', prompt: 'Знак?', options: ['∈', '∉'], correctIndex: 0 } }
          ]
        },
        {
          id: 'ex2', problem: 'B = {яблоко, груша}. банан ∉ B?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Проверь', explanation: 'Банана нет — ∉. Истина.', action: { kind: 'choice', prompt: 'Истина?', options: ['Да', 'Нет'], correctIndex: 0 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем ∈ и ∉',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини утверждение со знаком',
          left: [
            { id: 'L1', label: '2 в {1,2,3}' },
            { id: 'L2', label: '5 в {1,2,3}' },
            { id: 'L3', label: 'd в {a,b,c}' },
            { id: 'L4', label: '4 в {2,4,6,8}' }
          ],
          right: [
            { id: 'R1', label: '∈', pairId: 'L1' },
            { id: 'R2', label: '∉', pairId: 'L2' },
            { id: 'R3', label: '∉', pairId: 'L3' },
            { id: 'R4', label: '∈', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: 'C = {2,4,6,8}. 7 ?? C', options: ['∈', '∉'], correctIndex: 1 },
        { kind: 'choice', id: 't3', prompt: 'Чётные. 9 ?? Чётные', options: ['∈', '∉'], correctIndex: 1 },
        { kind: 'choice', id: 't4', prompt: 'Гласные = {а,е,и,о,у}. о ?? Гласные', options: ['∈', '∉'], correctIndex: 0 },
        { kind: 'choice', id: 't5', prompt: '{1,2,3,4,5}. 5 ?? это', options: ['∈', '∉'], correctIndex: 0 },
        { kind: 'choice', id: 't6', prompt: '{дни недели}. суббота ?? это', options: ['∈', '∉'], correctIndex: 0 }
      ],
      socraticHints: {
        t2: ['Найди 7 в C — есть?'],
        t3: ['9 чётное?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Зоопарк',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Зоопарк',
        roleplay: 'Распределяй животных по вольерам — это разные множества.',
        characterName: 'Смотритель Канат',
        mascotLine: '∈ — внутри, ∉ — снаружи кружка!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Группа', request: 'Хищники = {лев, тигр, волк}. Заяц ∈ Хищники? (1=да, 0=нет)', correct: 0, wrongFeedback: 'Заяц не хищник.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Учитель', request: 'Птицы = {орёл, попугай, страус}. Орёл? (1/0)', correct: 1, wrongFeedback: 'Орёл — птица.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Школьник', request: 'Морские = {дельфин, акула, осьминог}. Лягушка? (1/0)', correct: 0, wrongFeedback: 'Лягушка не морская.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Группа', request: 'Кошачьи = {лев, тигр, кошка}. Тигр? (1/0)', correct: 1, wrongFeedback: 'Тигр — кошачье.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный смотритель',
        request: 'ФИНАЛ: Млекопитающие = {лев, слон, кит, дельфин}. Акула ∈? (1/0)',
        correct: 0,
        wrongFeedback: 'Акула — рыба, не млекопитающее.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в знаках',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток ∈', emoji: '🎯' },
      intro: 'Знаки ∈ и ∉ не путай с равенством.',
      traps: [
        { id: 'tr1', wrongStatement: '«5 = {1,2,3,4,5}»', whyWrong: 'Знак = между числами. Между элементом и множеством — ∈ или ∉.', correctStatement: '5 ∈ {1,2,3,4,5}', rememberNote: 'Между элементом — ∈.' },
        { id: 'tr2', wrongStatement: '«∈ = не принадлежит»', whyWrong: '∈ = принадлежит. ∉ (перечёркнутая) = не принадлежит.', correctStatement: '∈ принадлежит, ∉ не принадлежит', rememberNote: 'Перечёркнутая = не.' },
        { id: 'tr3', wrongStatement: 'Один элемент = множество', whyWrong: 'Множество = группа. Один — это просто элемент.', correctStatement: 'Множество = группа', rememberNote: 'Группа, не одиночка.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни множество',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи что такое множество',
      coverPrompts: ['Что такое множество?', 'Что такое элемент?', 'Объясни ∈ и ∉.'],
      referenceAnswer: 'Множество — это группа предметов или чисел, объединённая общим признаком. Например, A = {1, 2, 3}. Каждый предмет внутри множества — элемент. Знак ∈ читается «принадлежит» (если элемент в множестве), ∉ — «не принадлежит».',
      requiredConcepts: ['множество', 'элемент', 'принадлежит'],
      conceptKeywords: {
        множество: ['множеств', 'групп'],
        элемент: ['элемент', 'предмет'],
        принадлежит: ['принадл', '∈']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['множеств', 'элемент'] }
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
      shareCapsuleName: 'Множества · Зоопарк',
      questions: [
        { id: 'm1', kind: 'choice', prompt: 'A = {1,3,5,7}. 5 ?? A', options: ['∈', '∉'], correctIndex: 0, conceptTag: 'принадл', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'choice', prompt: 'A = {1,3,5,7}. 4 ?? A', options: ['∈', '∉'], correctIndex: 1, conceptTag: 'непринадл', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: 'Множество — это:', options: ['Один предмет', 'Группа', 'Число', 'Знак'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'recall' },
        { id: 'm4', kind: 'choice', prompt: '«∉» означает:', options: ['Принадл.', 'Не принадл.', 'Равно', 'Больше'], correctIndex: 1, conceptTag: 'знаки', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'choice', prompt: 'Чётные. 11 ?? Чётные', options: ['∈', '∉'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: '{1,3,5,7,9}. 7 ?? это', options: ['∈', '∉'], correctIndex: 0, conceptTag: 'принадл', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'choice', prompt: '{понедельник,...пятница}. суббота?', options: ['∈', '∉'], correctIndex: 1, conceptTag: 'непринадл', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: 'Гласные. ы ?? Гласные', options: ['∈', '∉'], correctIndex: 0, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: '∈ это:', options: ['Принадл.', 'Не принадл.'], correctIndex: 0, conceptTag: 'знаки', cognitiveLevel: 'recall' },
        { id: 'p5', kind: 'choice', prompt: 'Овощи. огурец?', options: ['∈', '∉'], correctIndex: 0, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Объединение и пересечение (★ SetVennWidget!)
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Два кружка',
    subtitle: '∪ и ∩',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Два множества можно «соединить» (∪) или «пересечь» (∩).',
      body: 'Объединение — всё вместе. Пересечение — только общее.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '🔵', accent: 'sky', caption: 'Кружок A' },
        { emoji: '🟢', accent: 'amber', caption: 'Кружок B' },
        { emoji: '🟡', accent: 'emerald', caption: 'Где пересекаются — общее!' }
      ],
      prompt: 'Что общего у А = {1,2,3} и В = {3,4,5}?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '1 и 5' },
        { id: 'b', emoji: '🥇', label: '3', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Ничего' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Понимаешь объединение?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'A = {1,2}, B = {3,4}. A ∪ B = ?', options: ['{1,2,3,4}', '{}', '{1,4}', '{2,3}'], correctIndex: 0, conceptTag: 'объединение', explanation: 'Все элементы.' },
        { id: 'd2', prompt: 'A = {1,2,3}, B = {2,3,4}. A ∩ B = ?', options: ['{1,4}', '{2,3}', '{1,2,3,4}', '{}'], correctIndex: 1, conceptTag: 'пересечение', explanation: 'Общие.' },
        { id: 'd3', prompt: 'Знак ∪ означает:', options: ['Пересечение', 'Объединение', 'Принадлежит', 'Равно'], correctIndex: 1, conceptTag: 'знаки', explanation: '∪ = объединение.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  // ★ SetVennWidget!
  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Диаграмма Венна',
    subtitle: 'Перетаскивай в кружки',
    icon: 'i-lucide-circle', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'INTUITION',
      widget: {
        type: 'set-venn',
        setALabel: 'Хищники',
        setBLabel: 'Дикие',
        items: [
          { id: 'i1', label: 'Лев', emoji: '🦁', in: 'BOTH' },
          { id: 'i2', label: 'Кошка', emoji: '🐱', in: 'A' },
          { id: 'i3', label: 'Заяц', emoji: '🐰', in: 'B' },
          { id: 'i4', label: 'Волк', emoji: '🐺', in: 'BOTH' },
          { id: 'i5', label: 'Корова', emoji: '🐄', in: 'NEITHER' }
        ]
      },
      probes: [
        { id: 'p1', prompt: 'А = красные {1,2,3}, В = синие {4,5,6}. Что общего?', options: ['Всё', 'Ничего', '{1,4}', 'Цвет'], correctIndex: 1, explanation: 'Пересечение пустое.' },
        { id: 'p2', prompt: 'А = {1,2,3}, В = {3,4,5}. Что в обоих?', options: ['1', '5', '3', 'Ничего'], correctIndex: 2, explanation: '3 — общее.' }
      ],
      copy: { headline: 'Где кружки накладываются — там пересечение', body: 'А вместе оба кружка — это объединение.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Объединение и пересечение',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Две операции',
          panels: [
            { emoji: '∪', accent: 'sky', caption: 'Объединение = всё вместе' },
            { emoji: '∩', accent: 'amber', caption: 'Пересечение = только общее' },
            { emoji: '∅', accent: 'rose', caption: 'Если общих нет — пусто!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Объединение (A ∪ B)** — все элементы из обоих. **Пересечение (A ∩ B)** — только общие.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: 'A \\cup B = \\{1,2,3,4,5\\}, \\quad A \\cap B = \\{3\\}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А если общих нет?',
          revealedKind: 'formula',
          revealedContent: 'A \\cap B = \\emptyset',
          revealedHint: 'Пустое множество — тоже множество.'
        },
        { id: 'c5', kind: 'text', content: 'В объединении каждый элемент пишут один раз, без повторов: {1,2,3} ∪ {3,4} = {1,2,3,4}.' }
      ],
      checks: [
        { id: 'ch1', prompt: '{1,2} ∪ {2,3} = ?', options: ['{1,2}', '{1,2,3}', '{2}', '{}'], correctIndex: 1 },
        { id: 'ch2', prompt: '{1,2} ∩ {2,3} = ?', options: ['{1,2}', '{1,3}', '{2}', '{}'], correctIndex: 2 },
        { id: 'ch3', prompt: '{1,2} ∩ {3,4} = ?', options: ['{}', '{1,2,3,4}', '{1,4}', '{2,3}'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Знаки операций',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Операции над множествами',
      anatomy: [
        { id: 'a1', label: '∪', role: 'объединение', accent: 'sky' },
        { id: 'a2', label: '∩', role: 'пересечение', accent: 'green' },
        { id: 'a3', label: '∅', role: 'пустое множество', accent: 'rose' }
      ],
      terms: [
        { term: 'Объединение', definition: 'Все элементы хотя бы из одного множества.', example: '{1,2}∪{2,3}={1,2,3}', speakText: 'Объединение — все вместе' },
        { term: 'Пересечение', definition: 'Элементы, которые есть в обоих множествах.', example: '{1,2}∩{2,3}={2}', speakText: 'Пересечение — общие' }
      ],
      buildTask: {
        prompt: '{1,2,3} ∩ {2,3,4} = ___',
        template: '___',
        expected: ['{2,3}'],
        distractors: ['{1,4}', '{1,2,3,4}', '∅', '{2}', '{3}']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем операции',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: для ∪ — все элементы. Для ∩ — только общие.',
      examples: [
        {
          id: 'ex1', problem: 'A = {1,3,5}, B = {3,5,7}. Найди A ∪ B и A ∩ B.', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Объединение', explanation: 'Все: 1, 3, 5, 7.', visual: { kind: 'board', boardLines: ['A ∪ B = {1, 3, 5, 7}'] }, action: { kind: 'choice', prompt: 'A ∪ B?', options: ['{1,3,5,7}', '{3,5}', '{1,7}'], correctIndex: 0 } },
            { index: 2, title: 'Пересечение', explanation: 'Общие: 3, 5.', action: { kind: 'choice', prompt: 'A ∩ B?', options: ['{1,3,5,7}', '{3,5}', '{1,7}'], correctIndex: 1 } }
          ]
        },
        {
          id: 'ex2', problem: 'A = {2,4,6}, B = {1,3,5}', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: 'Нет общих → пересечение ∅.', action: { kind: 'choice', prompt: 'A ∩ B?', options: ['{1,2,3,4,5,6}', '∅', '{2,4}'], correctIndex: 1 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем операции',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с результатом',
          left: [
            { id: 'L1', label: '{1,2} ∪ {3,4}' },
            { id: 'L2', label: '{1,2,3} ∩ {2,3,4}' },
            { id: 'L3', label: '{5,6,7} ∩ {6,7,8}' },
            { id: 'L4', label: '{1} ∩ {2}' }
          ],
          right: [
            { id: 'R1', label: '{1,2,3,4}', pairId: 'L1' },
            { id: 'R2', label: '{2,3}', pairId: 'L2' },
            { id: 'R3', label: '{6,7}', pairId: 'L3' },
            { id: 'R4', label: '∅', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: '{5,6,7} ∪ {6,7,8} = ?', options: ['{5,6,7,8}', '{6,7}', '{5,8}'], correctIndex: 0 },
        { kind: 'choice', id: 't3', prompt: '{1} ∪ {2} = ?', options: ['{1,2}', '{}', '{1}'], correctIndex: 0 },
        { kind: 'choice', id: 't4', prompt: '{a,b,c} ∪ {b,c,d} = ?', options: ['{a,b,c,d}', '{b,c}', '{a,d}'], correctIndex: 0 },
        { kind: 'choice', id: 't5', prompt: '{a,b,c} ∩ {b,c,d} = ?', options: ['{a,b,c,d}', '{b,c}', '{a,d}'], correctIndex: 1 },
        { kind: 'choice', id: 't6', prompt: '{1,2,3} ∪ {1,2,3} = ?', options: ['{1,2,3}', '{1,2,3,1,2,3}', '∅'], correctIndex: 0 }
      ],
      socraticHints: {
        t6: ['Повторов нет в множестве.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Школьные кружки',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Зоокласс',
        roleplay: 'Распредели животных по группам пересечений и объединений.',
        characterName: 'Учитель Сауле',
        mascotLine: '∪ — все. ∩ — только общие.'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Учитель', request: 'Хищники = {лев, волк, тигр}, Дикие = {волк, заяц}. Кто в обоих? (число)', correct: 1, wrongFeedback: 'Только волк.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Класс', request: 'Те же. Сколько всего разных животных? (объединение)', correct: 4, wrongFeedback: '{лев,волк,тигр,заяц} = 4.', revenueReward: 40, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'Птицы = {орёл, попугай}, Морские = {акула, дельфин}. В обоих? (число)', correct: 0, wrongFeedback: 'Нет общих.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Школа', request: 'Кошачьи = {лев, тигр, кот}, Дикие = {лев, тигр, волк}. Объединение?', correct: 4, wrongFeedback: '{лев,тигр,кот,волк} = 4.', revenueReward: 50, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Энциклопедия',
        request: 'ФИНАЛ: Африка = {лев, слон, жираф}, Хищники = {лев, тигр}. Пересечение — сколько?',
        correct: 1,
        wrongFeedback: 'Только лев.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не путай ∪ и ∩',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Венн-мастер', emoji: '⚭' },
      intro: 'Знаки похожи, но смыслы противоположны.',
      traps: [
        { id: 'tr1', wrongStatement: '«∪ — пересечение»', whyWrong: 'Наоборот: ∪ объединение, ∩ пересечение.', correctStatement: '∪ объединение, ∩ пересечение', rememberNote: '∪ как U в Union.' },
        { id: 'tr2', wrongStatement: 'В объединении считал общие дважды', whyWrong: 'В множестве не бывает повторов.', correctStatement: '{1,2,3} ∪ {3,4} = {1,2,3,4}', rememberNote: 'Без повторов.' },
        { id: 'tr3', wrongStatement: '«Пересечение всегда не пустое»', whyWrong: 'Если общих нет — пересечение ∅.', correctStatement: '{1,2} ∩ {3,4} = ∅', rememberNote: 'Пустое тоже бывает.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни операции',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи объединение и пересечение',
      coverPrompts: ['В чём разница ∪ и ∩?', 'Какие знаки?', 'Покажи на примере.'],
      referenceAnswer: 'Объединение двух множеств (A ∪ B) — это все элементы, которые есть хотя бы в одном из них. Пересечение (A ∩ B) — только те, что есть в обоих. Например, A = {1,2,3}, B = {3,4,5}: объединение = {1,2,3,4,5}, пересечение = {3}.',
      requiredConcepts: ['объединение', 'пересечение'],
      conceptKeywords: {
        объединение: ['объедин', '∪'],
        пересечение: ['пересеч', '∩']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['объедин', 'пересеч'] }
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
      shareCapsuleName: 'Объединение и пересечение · Зоопарк',
      questions: [
        { id: 'm1', kind: 'choice', prompt: '{1,2,3} ∪ {3,4,5} = ?', options: ['{1,2,3,4,5}', '{3}', '{1,5}'], correctIndex: 0, conceptTag: 'объединение', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'choice', prompt: '{1,2,3} ∩ {3,4,5} = ?', options: ['{3}', '{1,5}', '{1,2,3,4,5}'], correctIndex: 0, conceptTag: 'пересечение', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: '{1,2} ∩ {3,4} = ?', options: ['∅', '{1,4}', '{1,2,3,4}'], correctIndex: 0, conceptTag: 'пустое', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Знак объединения:', options: ['∪', '∩', '∈', '='], correctIndex: 0, conceptTag: 'знаки', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'choice', prompt: 'Хищники {лев,волк} ∩ Дикие {волк,заяц} = ?', options: ['{лев}', '{волк}', '{заяц}', '∅'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: '{2,4,6} ∪ {4,6,8} = ?', options: ['{2,4,6,8}', '{4,6}', '∅'], correctIndex: 0, conceptTag: 'объединение', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: '{2,4,6} ∩ {4,6,8} = ?', options: ['{4,6}', '{2,8}', '∅'], correctIndex: 0, conceptTag: 'пересечение', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'choice', prompt: 'Птицы {орёл,гусь} ∩ Морские {гусь,акула} = ?', options: ['{орёл}', '{гусь}', '∅'], correctIndex: 1, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: '{a,b} ∪ {b,c,d} = ?', options: ['{a,b,c,d}', '{b}', '∅'], correctIndex: 0, conceptTag: 'объединение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: '{1,3,5} ∩ {2,4,6} = ?', options: ['{1,2,3,4,5,6}', '∅', '{1,4}'], correctIndex: 1, conceptTag: 'пустое', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Истинные и ложные высказывания
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Правда или ложь?',
    subtitle: 'Истина vs ложь',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '«5 > 3» — правда. «5 < 3» — ложь.',
      body: 'Высказывание — утверждение, про которое можно сказать «истина» или «ложь».',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '✅', accent: 'sky', caption: 'Истина — верно' },
        { emoji: '❌', accent: 'rose', caption: 'Ложь — неверно' },
        { emoji: '❓', accent: 'amber', caption: 'Вопрос — НЕ высказывание' }
      ],
      prompt: '«У собаки 4 ноги» — это:',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: 'Истина', isPrimary: true },
        { id: 'b', emoji: '🤔', label: 'Ложь' },
        { id: 'c', emoji: '🤯', label: 'Не знаю' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что истинно?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '«2+2=4» — это:', options: ['Истина', 'Ложь', 'Не высказывание'], correctIndex: 0, conceptTag: 'истина', explanation: 'Верно.' },
        { id: 'd2', prompt: '«5 > 10» — это:', options: ['Истина', 'Ложь', 'Не знаю'], correctIndex: 1, conceptTag: 'ложь', explanation: '5<10.' },
        { id: 'd3', prompt: '«Который час?» — это:', options: ['Истина', 'Ложь', 'Не высказывание'], correctIndex: 2, conceptTag: 'не-высказ', explanation: 'Вопрос.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Светофор истины',
    subtitle: '✓ или ✗',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 10, step: 1 },
      probes: [
        { id: 'p1', prompt: '«7 + 3 = 10» — ?', options: ['Истина', 'Ложь'], correctIndex: 0 },
        { id: 'p2', prompt: '«5 − 2 = 8» — ?', options: ['Истина', 'Ложь'], correctIndex: 1 }
      ],
      copy: { headline: 'Каждое утверждение — истина или ложь', body: 'Третьего нет: либо ✓, либо ✗.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Что такое высказывание',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Три типа',
          panels: [
            { emoji: '✅', accent: 'sky', caption: 'Истина: «3+4=7»' },
            { emoji: '❌', accent: 'amber', caption: 'Ложь: «5+5=11»' },
            { emoji: '❓', accent: 'rose', caption: 'Не высказ: «Сколько лет?»' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Высказывание** — предложение, про которое можно сказать «истина» или «ложь».',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Истинные: «3+4=7», «У собаки 4 лапы», «10>5».' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А что НЕ высказывания?',
          revealedKind: 'text',
          revealedContent: 'Вопросы («Сколько лет?»), приказы («Иди!»), пожелания. Про них нельзя сказать «истина/ложь».',
          revealedHint: 'Не утверждения = не высказывания.'
        },
        { id: 'c5', kind: 'text', content: 'Ложные: «5+5=11», «У человека 6 рук», «3>100».' }
      ],
      checks: [
        { id: 'ch1', prompt: '«2 ∈ {1,2,3}» — это:', options: ['Истина', 'Ложь', 'Не высказ'], correctIndex: 0 },
        { id: 'ch2', prompt: '«Завтра дождь?» — это:', options: ['Истина', 'Ложь', 'Не высказ'], correctIndex: 2 },
        { id: 'ch3', prompt: '«50 > 100» — это:', options: ['Истина', 'Ложь', 'Не высказ'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Виды утверждений',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Типы предложений',
      anatomy: [
        { id: 'a1', label: 'Истинное', role: 'факт верный', accent: 'green' },
        { id: 'a2', label: 'Ложное', role: 'факт неверный', accent: 'rose' },
        { id: 'a3', label: 'Не высказывание', role: 'вопрос/приказ', accent: 'sky' }
      ],
      terms: [
        { term: 'Высказывание', definition: 'Предложение про истину/ложь.', example: '«3<5» — высказывание', speakText: 'Высказывание — утверждение' }
      ],
      buildTask: {
        prompt: '«7 + 3 = 10» — это ___ (истина/ложь)',
        template: '___',
        expected: ['истина'],
        distractors: ['ложь', 'вопрос', 'приказ', 'не знаю', 'неверно']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Определяем истину',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: проверь арифметику или факт → истина или ложь.',
      examples: [
        {
          id: 'ex1', problem: '«15 − 8 = 7». Истина или ложь?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Считаем', explanation: '15−8=7. Верно.', visual: { kind: 'board', boardLines: ['15 − 8 = 7 ✓'] }, action: { kind: 'numeric', prompt: '15−8?', expected: 7 } },
            { index: 2, title: 'Вердикт', explanation: 'Истина.', action: { kind: 'choice', prompt: '?', options: ['Истина', 'Ложь'], correctIndex: 0 } }
          ]
        },
        {
          id: 'ex2', problem: '«10 ∈ {1,2,3,4}»', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Проверяем', explanation: '10 нет в множестве. Ложь.', action: { kind: 'choice', prompt: '?', options: ['Истина', 'Ложь'], correctIndex: 1 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем оценку',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с истиной/ложью',
          left: [
            { id: 'L1', label: '«4 + 5 = 9»' },
            { id: 'L2', label: '«10 − 3 = 6»' },
            { id: 'L3', label: '«100 > 99»' },
            { id: 'L4', label: '«50 < 25»' }
          ],
          right: [
            { id: 'R1', label: 'Истина', pairId: 'L1' },
            { id: 'R2', label: 'Ложь', pairId: 'L2' },
            { id: 'R3', label: 'Истина', pairId: 'L3' },
            { id: 'R4', label: 'Ложь', pairId: 'L4' }
          ]
        },
        { kind: 'choice', id: 't2', prompt: '«1 января — первый день года»', options: ['Истина', 'Ложь'], correctIndex: 0 },
        { kind: 'choice', id: 't3', prompt: '«У человека 3 глаза»', options: ['Истина', 'Ложь'], correctIndex: 1 },
        { kind: 'choice', id: 't4', prompt: '«1 неделя = 7 дней»', options: ['Истина', 'Ложь'], correctIndex: 0 },
        { kind: 'choice', id: 't5', prompt: '«1 час = 100 минут»', options: ['Истина', 'Ложь'], correctIndex: 1 },
        { kind: 'choice', id: 't6', prompt: '«6 × 7 = 42»', options: ['Истина', 'Ложь'], correctIndex: 0 }
      ],
      socraticHints: {
        t5: ['1 час = 60 минут.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Викторина',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Викторина «Знай животных»',
        roleplay: 'Ведущий называет факты. Ты — судья: «истина» или «ложь».',
        characterName: 'Ведущий Адиль',
        mascotLine: 'Только истина или ложь — третьего нет!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Команда А', request: '«У слона 4 ноги». 1=истина, 0=ложь', correct: 1, wrongFeedback: 'Истина.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Команда Б', request: '«В неделе 5 дней». 1/0', correct: 0, wrongFeedback: 'Дней 7.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Команда В', request: '«Кошка — птица». 1/0', correct: 0, wrongFeedback: 'Кошка — млекопитающее.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Команда Г', request: '«6 × 7 = 41». 1/0', correct: 0, wrongFeedback: '42, ложь.', revenueReward: 30, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Финал',
        request: 'ФИНАЛ: «У жирафа самая длинная шея среди наземных животных». 1/0',
        correct: 1,
        wrongFeedback: 'Истина.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в оценке',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Судья истины', emoji: '✓' },
      intro: 'Главное — точность.',
      traps: [
        { id: 'tr1', wrongStatement: '«Не знаю» как ответ', whyWrong: 'Высказывание имеет точный ответ: истина или ложь.', correctStatement: 'Только истина или ложь', rememberNote: 'Без «может быть».' },
        { id: 'tr2', wrongStatement: 'Считал вопрос высказыванием', whyWrong: '«Сколько лет?» — вопрос, не утверждение.', correctStatement: 'Вопросы — НЕ высказывания', rememberNote: 'Только утверждения.' },
        { id: 'tr3', wrongStatement: 'Не проверил арифметику', whyWrong: 'Считай — и узнаешь истину/ложь.', correctStatement: 'Проверяй вычислением', rememberNote: 'Не верь на глаз.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни высказывания',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи что такое высказывание',
      coverPrompts: ['Что такое высказывание?', 'Что такое истина и ложь?', 'Какие предложения НЕ являются высказываниями?'],
      referenceAnswer: 'Высказывание — это предложение, про которое можно сказать «истина» или «ложь». Например, «5 + 3 = 8» — истина, а «2 > 10» — ложь. Вопросы и приказы НЕ являются высказываниями: про них нельзя сказать «истина» или «ложь».',
      requiredConcepts: ['высказывание', 'истина', 'ложь'],
      conceptKeywords: {
        высказывание: ['высказ', 'утвержд'],
        истина: ['истин', 'верно'],
        ложь: ['ложь', 'неверно']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['истин', 'ложь'] }
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
      shareCapsuleName: 'Высказывания · Зоопарк',
      questions: [
        { id: 'm1', kind: 'choice', prompt: '«25 + 5 = 30»', options: ['Истина', 'Ложь'], correctIndex: 0, conceptTag: 'арифметика', cognitiveLevel: 'apply' },
        { id: 'm2', kind: 'choice', prompt: '«В сутках 30 часов»', options: ['Истина', 'Ложь'], correctIndex: 1, conceptTag: 'факт', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'choice', prompt: '«Сколько лет тебе?»', options: ['Истина', 'Ложь', 'Не высказ'], correctIndex: 2, conceptTag: 'не-выск', cognitiveLevel: 'understand' },
        { id: 'm4', kind: 'choice', prompt: '«100 > 99»', options: ['Истина', 'Ложь'], correctIndex: 0, conceptTag: 'сравнение', cognitiveLevel: 'recall' },
        { id: 'm5', kind: 'choice', prompt: '«6 ∈ {2,4,6,8}»', options: ['Истина', 'Ложь'], correctIndex: 0, conceptTag: 'множества', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'choice', prompt: '«50 = 10 × 5»', options: ['Истина', 'Ложь'], correctIndex: 0, conceptTag: 'арифметика', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'choice', prompt: '«В году 13 месяцев»', options: ['Истина', 'Ложь'], correctIndex: 1, conceptTag: 'факт', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'choice', prompt: '«Иди сюда!»', options: ['Истина', 'Ложь', 'Не высказ'], correctIndex: 2, conceptTag: 'не-выск', cognitiveLevel: 'understand' },
        { id: 'p4', kind: 'choice', prompt: '«7 ∈ {1,3,5,7,9}»', options: ['Истина', 'Ложь'], correctIndex: 0, conceptTag: 'множества', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'choice', prompt: '«3 × 4 = 11»', options: ['Истина', 'Ложь'], correctIndex: 1, conceptTag: 'арифметика', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 4 — Комбинации
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L4, layerType: 'HOOK', orderIndex: 1,
    title: 'Сколько вариантов?',
    subtitle: 'Каждый с каждым',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '3 футболки и 2 штаны. Сколько разных образов?',
      body: 'Каждая футболка с каждыми штанами = новый образ. 3 × 2 = 6.',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '👕', accent: 'sky', caption: '3 футболки' },
        { emoji: '✖️', accent: 'amber', caption: '× 2 штанов' },
        { emoji: '🎽', accent: 'emerald', caption: '= 6 разных образов!' }
      ],
      prompt: '4 футболки и 3 штанов. Образов?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '7' },
        { id: 'b', emoji: '🥇', label: '12', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '4' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь комбинации?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '2 шапки × 3 шарфа. Комбинаций?', options: ['5', '6', '23', '2'], correctIndex: 1, conceptTag: 'умножение', explanation: '2×3=6.' },
        { id: 'd2', prompt: '2 куртки × 4 шапки. Сочетаний?', options: ['6', '8', '4', '2'], correctIndex: 1, conceptTag: 'умножение', explanation: '2×4=8.' },
        { id: 'd3', prompt: 'Чтобы найти комбинации:', options: ['Сложить', 'Вычесть', 'Умножить', 'Разделить'], correctIndex: 2, conceptTag: 'правило', explanation: '×.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L4, layerType: 'INTUITION', orderIndex: 3,
    title: 'Дерево вариантов',
    subtitle: 'Сетка комбинаций',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'array-grid', minRows: 2, maxRows: 4, minCols: 2, maxCols: 4, defaultRows: 3, defaultCols: 2 },
      probes: [
        { id: 'p1', prompt: '3 строки × 2 столбца = ? клеток', options: ['5', '6', '32', '2'], correctIndex: 1, explanation: '3×2=6.' },
        { id: 'p2', prompt: '4 × 3 = ?', options: ['7', '12', '4', '3'], correctIndex: 1, explanation: '4×3=12.' }
      ],
      copy: { headline: 'Каждое сочетание = клетка таблицы', body: 'Количество = строки × столбцы.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L4, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правило умножения',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Каждое с каждым',
          panels: [
            { emoji: '🔵', accent: 'sky', caption: 'Множество 1: a' },
            { emoji: '✖️', accent: 'amber', caption: '× Множество 2: b' },
            { emoji: '🎯', accent: 'emerald', caption: '= a × b комбинаций!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Если выбираем по одному из двух множеств — комбинаций = произведение.**',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '\\text{Комбинаций} = a \\times b' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А три множества?',
          revealedKind: 'formula',
          revealedContent: '\\text{Комбинаций} = a \\times b \\times c',
          revealedHint: 'Все умножаем.'
        },
        { id: 'c5', kind: 'text', content: 'Пример: 3 цвета × 4 размера = 12 разных шаров.' }
      ],
      checks: [
        { id: 'ch1', prompt: '5 ручек × 4 тетради = ?', options: ['9', '20', '54', '1'], correctIndex: 1 },
        { id: 'ch2', prompt: '2 шапки × 3 шарфа × 2 куртки = ?', options: ['7', '12', '6', '5'], correctIndex: 1 },
        { id: 'ch3', prompt: 'Какое действие для комбинаций?', options: ['+', '−', '×', '÷'], correctIndex: 2 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L4, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Дерево вариантов',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Считаем комбинации',
      anatomy: [
        { id: 'a1', label: 'Множество 1', role: 'a вариантов', accent: 'sky' },
        { id: 'a2', label: 'Множество 2', role: 'b вариантов', accent: 'amber' },
        { id: 'a3', label: 'a × b', role: 'комбинаций', accent: 'green' }
      ],
      terms: [
        { term: 'Комбинация', definition: 'Сочетание элементов из разных множеств.', example: 'Красная шапка + синий шарф', speakText: 'Комбинация — сочетание' }
      ],
      buildTask: {
        prompt: '3 футболки × 4 штанов = ___',
        template: '___',
        expected: ['12'],
        distractors: ['7', '34', '20', '9', '34']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем комбинации',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: посчитай элементы каждого множества → перемножь.',
      examples: [
        {
          id: 'ex1', problem: '3 платья и 4 туфель. Нарядов?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сколько в каждом?', explanation: '3 и 4.', visual: { kind: 'board', boardLines: ['3 × 4 = 12'] }, action: { kind: 'numeric', prompt: 'Туфель?', expected: 4 } },
            { index: 2, title: 'Умножаем', explanation: '3×4=12.', action: { kind: 'numeric', prompt: 'Вариантов?', expected: 12 } }
          ]
        },
        {
          id: 'ex2', problem: '2 первых × 3 вторых × 2 десерта. Обедов?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Считаем', explanation: '2×3×2=12.', action: { kind: 'numeric', prompt: '?', expected: 12 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем комбинации',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини с числом комбинаций',
          left: [
            { id: 'L1', label: '2 × 3' },
            { id: 'L2', label: '4 × 5' },
            { id: 'L3', label: '3 × 3' },
            { id: 'L4', label: '2 × 3 × 2' }
          ],
          right: [
            { id: 'R1', label: '6', pairId: 'L1' },
            { id: 'R2', label: '20', pairId: 'L2' },
            { id: 'R3', label: '9', pairId: 'L3' },
            { id: 'R4', label: '12', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '3 цвета × 4 размера = ?', correctAnswer: 12 },
        { kind: 'numeric', id: 't3', prompt: '5 × 2 = ?', correctAnswer: 10 },
        { kind: 'numeric', id: 't4', prompt: '4 закуски × 5 напитков = ?', correctAnswer: 20 },
        { kind: 'numeric', id: 't5', prompt: '6 × 3 комбинаций = ?', correctAnswer: 18 },
        { kind: 'numeric', id: 't6', prompt: '2 × 2 × 3 = ?', correctAnswer: 12 }
      ],
      socraticHints: {
        t6: ['2×2=4, ×3=12.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L4, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Магазин одежды',
    icon: 'i-lucide-paw-print', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'zoo',
      setting: {
        title: 'Магазин для зоокласса',
        roleplay: 'Помоги выбрать сочетания форм для разных животных.',
        characterName: 'Стилист Айгерим',
        mascotLine: 'Каждое с каждым → умножай!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Девушка', request: '4 футболки × 3 шорт. Образов?', correct: 12, wrongFeedback: '4×3=12.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Парень', request: '3 рубашки × 2 брюки. Образов?', correct: 6, wrongFeedback: '3×2=6.', revenueReward: 30, reputationReward: 1 },
        { id: 'o3', customer: 'Школьник', request: '5 кепок × 4 рюкзака. Сочетаний?', correct: 20, wrongFeedback: '5×4=20.', revenueReward: 50, reputationReward: 1 },
        { id: 'o4', customer: 'Семья', request: '2 куртки × 3 шарфа × 2 шапки. Комплектов?', correct: 12, wrongFeedback: '2×3×2=12.', revenueReward: 100, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой выбор',
        request: 'ФИНАЛ: 5 шапок × 4 шарфа × 3 куртки. Комплектов?',
        correct: 60,
        wrongFeedback: '5×4=20, ×3=60.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L4, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не складывай',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Комбинатор', emoji: '🎯' },
      intro: 'Сложение — не комбинации.',
      traps: [
        { id: 'tr1', wrongStatement: '«2 шапки + 3 шарфа = 5 комбинаций»', whyWrong: 'Это сложение, не комбинации. Сочетаний — 2×3=6.', correctStatement: '2 × 3 = 6 комбинаций', rememberNote: 'Каждое с каждым = ×.' },
        { id: 'tr2', wrongStatement: 'Сложил вместо умножения', whyWrong: 'Сложение — общее количество. Умножение — пары.', correctStatement: 'Комбинации = ×', rememberNote: '× для пар.' },
        { id: 'tr3', wrongStatement: 'Забыл третье множество', whyWrong: 'Если 3 множества — умножай все.', correctStatement: 'Все множества учитывай', rememberNote: 'Все по очереди.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни сочетания',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как считать комбинации',
      coverPrompts: ['Как считать комбинации?', 'Какое действие?', 'Покажи на примере одежды.'],
      referenceAnswer: 'Чтобы посчитать количество комбинаций, нужно умножить количества элементов в каждом множестве. Например, 3 футболки и 4 штанов: 3 × 4 = 12 разных образов. Если множеств три — умножаем все три. Не складываем!',
      requiredConcepts: ['комбинации', 'умножение'],
      conceptKeywords: {
        комбинации: ['комбин', 'сочет'],
        умножение: ['умнож', '×']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['комбин', 'умнож'] }
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
      shareCapsuleName: 'Комбинации · Зоопарк',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '3 × 4 = ?', correctAnswer: 12, conceptTag: 'умножение', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '5 цветов × 2 формы. Комбинаций?', correctAnswer: 10, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: '2 × 3 × 4 = ?', correctAnswer: 24, conceptTag: 'три-множ', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Чтобы найти комбинации:', options: ['Сложить', 'Умножить', 'Вычесть', 'Разделить'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'numeric', prompt: '4 куртки × 3 шапки = ?', correctAnswer: 12, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '6 × 5 = ?', correctAnswer: 30, conceptTag: 'умножение', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '7 шапок × 3 шарфа = ?', correctAnswer: 21, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '3 × 3 × 3 = ?', correctAnswer: 27, conceptTag: 'три-множ', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '4 × 8 = ?', correctAnswer: 32, conceptTag: 'умножение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: '6 закусок × 4 напитка = ?', correctAnswer: 24, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Множества и их элементы', layersInsertedByLesson: counter }
})
