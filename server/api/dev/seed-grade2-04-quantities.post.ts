import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Величины и их измерение».
 *   1. Длина: сантиметр, дециметр, метр
 *   2. Масса: килограмм, центнер
 *   3. Объём: литр
 *
 * S6: тема №04, theme-pack = 'construction' (стройка — измерения везде).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (📏/⚖️/💧).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Величины и их измерение')
  const L1 = lessonIds['Длина: сантиметр, дециметр, метр']
  const L2 = lessonIds['Масса: килограмм, центнер']
  const L3 = lessonIds['Объём: литр']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Величины и их измерение»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Длина
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Чем измеряют?',
    subtitle: 'Лестница длины',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '1 м = 10 дм = 100 см. Это твоя «лестница длины».',
      body: 'Один и тот же отрезок можно записать тремя способами.',
      mascotEntry: 'teach',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📏', accent: 'amber', caption: 'Линейка — 1 дм = 10 см' },
        { emoji: '📐', accent: 'sky', caption: 'Метр — 100 см' },
        { emoji: '🧱', accent: 'emerald', caption: 'Стройка: всё измеряется!' }
      ],
      prompt: '1 дм = ? см',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '1' },
        { id: 'b', emoji: '🥇', label: '10', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '100' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что знаешь о длине?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'В 1 метре сколько см?', options: ['10', '100', '1000', '1'], correctIndex: 1, conceptTag: 'м-см', explanation: '1 м = 100 см.' },
        { id: 'd2', prompt: '1 дм = ? см', options: ['1', '10', '100', '1000'], correctIndex: 1, conceptTag: 'дм-см', explanation: '1 дм = 10 см.' },
        { id: 'd3', prompt: 'Чем удобнее измерять парту?', options: ['см', 'дм', 'м', 'км'], correctIndex: 0, conceptTag: 'выбор', explanation: 'Парта небольшая → см.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Линейка и метр',
    subtitle: 'Каждая ступень в 10 раз больше',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 100, step: 10, highlights: [10, 50, 100] },
      probes: [
        { id: 'p1', prompt: '50 см — это сколько дм?', options: ['5', '50', '500', '0.5'], correctIndex: 0, explanation: '50÷10=5.' },
        { id: 'p2', prompt: '3 м — сколько см?', options: ['30', '300', '3', '3000'], correctIndex: 1, explanation: '3×100=300.' }
      ],
      copy: { headline: 'Длина: 1 м = 10 дм = 100 см', body: 'Каждая единица в 10 раз больше предыдущей.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Лестница длины',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Лестница из 3 ступенек',
          panels: [
            { emoji: '1️⃣', accent: 'sky', caption: 'см — самая мелкая' },
            { emoji: '🔟', accent: 'amber', caption: 'дм = 10 см' },
            { emoji: '💯', accent: 'emerald', caption: 'м = 100 см' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Запомни:** 1 м = 10 дм = 100 см. Лестница из трёх ступенек.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1\\ \\text{м} = 10\\ \\text{дм} = 100\\ \\text{см}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Как переводить?',
          revealedKind: 'text',
          revealedContent: 'В меньшую — умножаем (вниз). В бо́льшую — делим (вверх). 2 м = 200 см. 50 см = 5 дм.',
          revealedHint: 'Вниз × 10, вверх ÷ 10.'
        },
        { id: 'c5', kind: 'text', content: 'Складывать длины можно только в одинаковых единицах: 30 см + 2 дм = 30 + 20 = 50 см.' }
      ],
      checks: [
        { id: 'ch1', prompt: '4 дм = ? см', options: ['4', '40', '400', '0.4'], correctIndex: 1 },
        { id: 'ch2', prompt: '200 см = ? м', options: ['2', '20', '200', '0.2'], correctIndex: 0 },
        { id: 'ch3', prompt: '15 см + 2 дм = ? см', options: ['17', '35', '215', '5'], correctIndex: 1, explanation: '2 дм=20, 15+20=35.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Единицы длины',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Лестница длины',
      anatomy: [
        { id: 'a1', label: 'м', role: '1 м = 100 см', accent: 'green' },
        { id: 'a2', label: 'дм', role: '1 дм = 10 см', accent: 'sky' },
        { id: 'a3', label: 'см', role: 'самая маленькая ступень', accent: 'amber' }
      ],
      terms: [
        { term: 'Сантиметр', definition: 'Маленькая единица длины.', example: 'Длина ручки — 15 см', speakText: 'Сантиметр — для мелкого' },
        { term: 'Дециметр', definition: '10 сантиметров.', example: 'Длина книги — 3 дм', speakText: 'Дециметр — десять сантиметров' },
        { term: 'Метр', definition: '100 сантиметров.', example: 'Рост ребёнка — 1 м', speakText: 'Метр — сто сантиметров' }
      ],
      buildTask: {
        prompt: '5 м = ___ см',
        template: '___',
        expected: ['500'],
        distractors: ['50', '5', '5000', '105', '50000']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Переводим длины',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Перевод единиц — два вида: «вниз» и «вверх» по лестнице.',
      examples: [
        {
          id: 'ex1', problem: '3 м 25 см — сколько это сантиметров?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Метры в см', explanation: '3 м = 3 × 100 = 300 см.', visual: { kind: 'board', boardLines: ['3 м = 300 см'] }, action: { kind: 'numeric', prompt: '3 м = ? см', expected: 300 } },
            { index: 2, title: 'Прибавляем остаток', explanation: '300 + 25 = 325.', visual: { kind: 'board', boardLines: ['300 + 25 = 325'] }, action: { kind: 'numeric', prompt: 'Итого:', expected: 325 } }
          ]
        },
        {
          id: 'ex2', problem: '70 см — сколько дм?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Делим на 10', explanation: '70 ÷ 10 = 7 дм.', action: { kind: 'numeric', prompt: 'Сколько дм?', expected: 7 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем единицы',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини единицу с её эквивалентом',
          left: [
            { id: 'L1', label: '2 м' },
            { id: 'L2', label: '5 дм' },
            { id: 'L3', label: '300 см' },
            { id: 'L4', label: '40 см' }
          ],
          right: [
            { id: 'R1', label: '200 см', pairId: 'L1' },
            { id: 'R2', label: '50 см', pairId: 'L2' },
            { id: 'R3', label: '3 м', pairId: 'L3' },
            { id: 'R4', label: '4 дм', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '1 м 50 см = ? см', correctAnswer: 150 },
        { kind: 'numeric', id: 't3', prompt: '8 дм = ? см', correctAnswer: 80 },
        { kind: 'numeric', id: 't4', prompt: '20 дм = ? м', correctAnswer: 2 },
        { kind: 'numeric', id: 't5', prompt: '6 м 30 см = ? см', correctAnswer: 630 },
        { kind: 'numeric', id: 't6', prompt: '7 дм = ? см', correctAnswer: 70 }
      ],
      socraticHints: {
        t2: ['1 м = 100 см, +50.'],
        t5: ['6×100=600, +30.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Стройка комнаты',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Стройплощадка',
        roleplay: 'Помоги мастеру выбрать материалы. Длина в разных единицах.',
        characterName: 'Мастер Талгат',
        mascotLine: '1 м = 10 дм = 100 см. Не путай ступени!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Заказчик', request: 'Стена 4 м длиной. Сколько см?', correct: 400, wrongFeedback: '4×100=400.', revenueReward: 100, reputationReward: 1 },
        { id: 'o2', customer: 'Дизайнер', request: 'Доска 80 см. Сколько дм?', correct: 8, wrongFeedback: '80÷10=8.', revenueReward: 80, reputationReward: 1 },
        { id: 'o3', customer: 'Мама', request: 'Окно 2 м 30 см. В см?', correct: 230, wrongFeedback: '200+30=230.', revenueReward: 230, reputationReward: 1 },
        { id: 'o4', customer: 'Сосед', request: 'Лента 50 + 30 см. Длина?', correct: 80, wrongFeedback: '50+30=80.', revenueReward: 80, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой проект',
        request: 'ФИНАЛ: Кабель 5 м 60 см + 2 м 80 см. В см?',
        correct: 840,
        wrongFeedback: '560+280=840.',
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
      bugHunterBadge: { label: 'Мастер длины', emoji: '📏' },
      intro: 'Главное — не складывать разные единицы.',
      traps: [
        { id: 'tr1', wrongStatement: '«15 см + 2 дм = 17»', whyWrong: 'Сложил разные единицы! 2 дм = 20 см. 15+20=35.', correctStatement: '15 см + 2 дм = 35 см', rememberNote: 'Сначала переведи в одну.' },
        { id: 'tr2', wrongStatement: '«3 м = 30 см»', whyWrong: '1 м = 100 см. 3 м = 300 см.', correctStatement: '3 м = 300 см', rememberNote: 'м → см: ×100.' },
        { id: 'tr3', wrongStatement: '«400 см = 40 м»', whyWrong: 'см → м: ÷100. 400÷100=4 м.', correctStatement: '400 см = 4 м', rememberNote: 'см → м: ÷100.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни лестницу',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи единицы длины',
      coverPrompts: ['Какие единицы длины?', 'Как перевести метры в см?', 'Как сложить 30 см и 2 дм?'],
      referenceAnswer: 'Единицы длины: сантиметр (см), дециметр (дм) и метр (м). 1 м = 10 дм = 100 см. Чтобы перевести метры в сантиметры, умножаем на 100. Чтобы сложить разные единицы, сначала переводим всё в одну: 30 см + 2 дм = 30 + 20 = 50 см.',
      requiredConcepts: ['см', 'дм', 'метр'],
      conceptKeywords: {
        см: ['см', 'сантиметр'],
        дм: ['дм', 'дециметр'],
        метр: ['метр', 'м']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['см', 'м'] }
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
      shareCapsuleName: 'Длина · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '5 м = ? см', correctAnswer: 500, conceptTag: 'м-см', cognitiveLevel: 'recall', explanation: '5×100.' },
        { id: 'm2', kind: 'numeric', prompt: '60 см = ? дм', correctAnswer: 6, conceptTag: 'см-дм', cognitiveLevel: 'apply', explanation: '60÷10.' },
        { id: 'm3', kind: 'numeric', prompt: '2 м 40 см = ? см', correctAnswer: 240, conceptTag: 'смешанное', cognitiveLevel: 'apply', explanation: '200+40.' },
        { id: 'm4', kind: 'numeric', prompt: '50 см + 30 см = ? см', correctAnswer: 80, conceptTag: 'сложение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Высота двери 2 м = ? см', correctAnswer: 200, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '3 м = ? см', correctAnswer: 300, conceptTag: 'м-см', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '90 см = ? дм', correctAnswer: 9, conceptTag: 'см-дм', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '4 м 75 см = ? см', correctAnswer: 475, conceptTag: 'смешанное', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '12 дм = ? см', correctAnswer: 120, conceptTag: 'дм-см', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Кабель 8 м = ? см', correctAnswer: 800, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Масса
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Сколько весит арбуз?',
    subtitle: 'Кг и центнеры',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '1 центнер = 100 кг. Арбуз — 5–8 кг. А мешок муки — 1 ц.',
      body: 'Маленькое — в кг, большие грузы — в центнерах.',
      mascotEntry: 'celebrate',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🍉', accent: 'rose', caption: 'Арбуз: 5-8 кг' },
        { emoji: '⚖️', accent: 'amber', caption: '1 центнер = 100 кг' },
        { emoji: '📦', accent: 'emerald', caption: 'Мешок муки = 1 ц!' }
      ],
      prompt: 'Что измеряют в центнерах?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Конфету' },
        { id: 'b', emoji: '🥇', label: 'Мешок картошки', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Каплю воды' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь о массе?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'В 1 ц сколько кг?', options: ['10', '100', '1000', '1'], correctIndex: 1, conceptTag: 'ц-кг', explanation: '1 ц = 100 кг.' },
        { id: 'd2', prompt: 'Что больше: 50 кг или 1 ц?', options: ['50 кг', '1 ц', 'равны', 'нельзя'], correctIndex: 1, conceptTag: 'сравнение', explanation: '1 ц = 100 кг.' },
        { id: 'd3', prompt: '2 ц = ? кг', options: ['20', '200', '2', '2000'], correctIndex: 1, conceptTag: 'перевод', explanation: '2×100=200.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Чашечные весы',
    subtitle: 'Уравновешиваем грузы',
    icon: 'i-lucide-scale', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'INTUITION',
      widget: { type: 'balance-scale', maxWeight: 100, leftStart: 50, rightStart: 50, target: 'equal' },
      probes: [
        { id: 'p1', prompt: 'На одной чаше — 50 кг. На второй — мешки по 10 кг. Сколько мешков?', options: ['5', '50', '500', '10'], correctIndex: 0, explanation: '50÷10=5.' },
        { id: 'p2', prompt: '3 ц — это сколько мешков по 10 кг?', options: ['3', '30', '300', '10'], correctIndex: 1, explanation: '300÷10=30.' }
      ],
      copy: { headline: '1 ц = 100 кг — большая единица', body: 'Центнер — для груза: муки, сахара, картошки.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Килограмм и центнер',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Лестница массы',
          panels: [
            { emoji: '🍎', accent: 'sky', caption: 'кг — для обычного' },
            { emoji: '📦', accent: 'amber', caption: '1 ц = 100 кг' },
            { emoji: '🚚', accent: 'emerald', caption: 'Грузы — в ц!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**1 ц = 100 кг.** Запомни так же, как 1 м = 100 см.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '1\\ \\text{ц} = 100\\ \\text{кг}' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Как переводить?',
          revealedKind: 'text',
          revealedContent: 'ц → кг: × 100. кг → ц: ÷ 100. Складывай только в одинаковых единицах: 2 ц + 50 кг = 200 + 50 = 250 кг.',
          revealedHint: 'Сначала перевод, потом сложение.'
        },
        { id: 'c5', kind: 'text', content: 'Перевод ц → кг: 5 ц = 500 кг. кг → ц: 600 кг = 6 ц.' }
      ],
      checks: [
        { id: 'ch1', prompt: '5 ц = ? кг', options: ['5', '50', '500', '5000'], correctIndex: 2 },
        { id: 'ch2', prompt: '300 кг = ? ц', options: ['3', '30', '300', '0.3'], correctIndex: 0 },
        { id: 'ch3', prompt: '2 ц + 30 кг = ? кг', options: ['32', '230', '203', '50'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Единицы массы',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Масса: ц и кг',
      anatomy: [
        { id: 'a1', label: 'центнер (ц)', role: '100 кг', accent: 'green' },
        { id: 'a2', label: 'килограмм (кг)', role: 'базовая единица массы', accent: 'sky' }
      ],
      terms: [
        { term: 'Килограмм', definition: 'Основная единица массы.', example: 'Картошка — 5 кг', speakText: 'Килограмм — для обычных вещей' },
        { term: 'Центнер', definition: 'Большая единица. 1 ц = 100 кг.', example: 'Мешок муки — 1 ц', speakText: 'Центнер — сто килограммов' }
      ],
      buildTask: {
        prompt: '4 ц = ___ кг',
        template: '___',
        expected: ['400'],
        distractors: ['40', '4', '4000', '104', '14']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем массу',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм перевода и сложения масс.',
      examples: [
        {
          id: 'ex1', problem: '3 ц 40 кг = сколько кг?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Переводим ц', explanation: '3 ц = 300 кг.', visual: { kind: 'board', boardLines: ['3 ц = 300 кг'] }, action: { kind: 'numeric', prompt: '3 ц = ? кг', expected: 300 } },
            { index: 2, title: 'Прибавляем', explanation: '300 + 40 = 340.', action: { kind: 'numeric', prompt: 'Итого:', expected: 340 } }
          ]
        },
        {
          id: 'ex2', problem: '500 кг = сколько ц?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Делим', explanation: '500 ÷ 100 = 5 ц.', action: { kind: 'numeric', prompt: 'Сколько ц?', expected: 5 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем массу',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини массу с эквивалентом',
          left: [
            { id: 'L1', label: '2 ц' },
            { id: 'L2', label: '7 ц' },
            { id: 'L3', label: '400 кг' },
            { id: 'L4', label: '900 кг' }
          ],
          right: [
            { id: 'R1', label: '200 кг', pairId: 'L1' },
            { id: 'R2', label: '700 кг', pairId: 'L2' },
            { id: 'R3', label: '4 ц', pairId: 'L3' },
            { id: 'R4', label: '9 ц', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '1 ц 25 кг = ? кг', correctAnswer: 125 },
        { kind: 'numeric', id: 't3', prompt: '3 ц + 50 кг = ? кг', correctAnswer: 350 },
        { kind: 'numeric', id: 't4', prompt: '600 кг − 2 ц = ? кг', correctAnswer: 400 },
        { kind: 'numeric', id: 't5', prompt: '5 ц 18 кг = ? кг', correctAnswer: 518 },
        { kind: 'numeric', id: 't6', prompt: '8 ц = ? кг', correctAnswer: 800 }
      ],
      socraticHints: {
        t2: ['1×100 = ? +25.'],
        t4: ['2 ц = 200 кг, 600−200.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Склад на стройке',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Склад стройматериалов',
        roleplay: 'Помоги кладовщику вести учёт. Грузы — в ц и кг.',
        characterName: 'Кладовщик Гульназ',
        mascotLine: '1 ц = 100 кг!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Поставщик', request: 'Привезли 2 ц цемента. Сколько кг?', correct: 200, wrongFeedback: '2×100=200.', revenueReward: 200, reputationReward: 1 },
        { id: 'o2', customer: 'Бригадир', request: 'Забрали 350 кг. Сколько кг это?', correct: 350, wrongFeedback: '3 ц 50 кг = 350 кг.', revenueReward: 350, reputationReward: 1 },
        { id: 'o3', customer: 'Учёт', request: 'На складе 5 ц 40 кг песка. Всего кг?', correct: 540, wrongFeedback: '500+40=540.', revenueReward: 540, reputationReward: 1 },
        { id: 'o4', customer: 'Транспорт', request: 'Грузовик берёт 1 ц. Сколько поездок для 800 кг?', correct: 8, wrongFeedback: '800÷100=8.', revenueReward: 80, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой объект',
        request: 'ФИНАЛ: Привезли 7 ц 50 кг кирпичей. Сколько всего кг?',
        correct: 750,
        wrongFeedback: '700+50=750.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где ошибаются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Весовщик', emoji: '⚖️' },
      intro: 'Не путай ц и кг.',
      traps: [
        { id: 'tr1', wrongStatement: '«1 ц = 10 кг»', whyWrong: '**1 ц = 100 кг**. Часто путают с дециметром.', correctStatement: '1 ц = 100 кг', rememberNote: 'Центнер = сотня кг.' },
        { id: 'tr2', wrongStatement: '«2 ц + 30 кг = 32»', whyWrong: 'Сложил без перевода. 2 ц = 200 кг, 200+30=230.', correctStatement: '2 ц + 30 кг = 230 кг', rememberNote: 'Сначала перевод!' },
        { id: 'tr3', wrongStatement: '«500 кг = 50 ц»', whyWrong: 'Делим на 100, не на 10. 500÷100=5 ц.', correctStatement: '500 кг = 5 ц', rememberNote: 'кг → ц: ÷ 100.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни единицы',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи разницу ц и кг',
      coverPrompts: ['Что больше: ц или кг?', 'Сколько кг в 1 ц?', 'Как сложить 3 ц и 50 кг?'],
      referenceAnswer: 'Центнер — большая единица массы, в нём 100 кг. Чтобы сложить 3 ц и 50 кг, сначала переведу 3 ц в кг (это 300 кг), а потом сложу: 300 + 50 = 350 кг. Можно складывать только в одинаковых единицах.',
      requiredConcepts: ['центнер', 'килограмм', 'перевод'],
      conceptKeywords: {
        центнер: ['центнер', 'ц'],
        килограмм: ['кг', 'килограмм'],
        перевод: ['перевод', 'переведу']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['центнер', 'кг'] }
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
      shareCapsuleName: 'Масса · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '4 ц = ? кг', correctAnswer: 400, conceptTag: 'ц-кг', cognitiveLevel: 'recall', explanation: '4×100.' },
        { id: 'm2', kind: 'numeric', prompt: '700 кг = ? ц', correctAnswer: 7, conceptTag: 'кг-ц', cognitiveLevel: 'apply', explanation: '700÷100.' },
        { id: 'm3', kind: 'numeric', prompt: '2 ц 30 кг = ? кг', correctAnswer: 230, conceptTag: 'смешанное', cognitiveLevel: 'apply', explanation: '200+30.' },
        { id: 'm4', kind: 'numeric', prompt: '600 кг − 1 ц = ? кг', correctAnswer: 500, conceptTag: 'вычитание', cognitiveLevel: 'apply', explanation: '600−100.' },
        { id: 'm5', kind: 'numeric', prompt: 'Мешок 50 кг. Сколько в 5 ц?', correctAnswer: 10, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '500÷50.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '6 ц = ? кг', correctAnswer: 600, conceptTag: 'ц-кг', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '900 кг = ? ц', correctAnswer: 9, conceptTag: 'кг-ц', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '4 ц 75 кг = ? кг', correctAnswer: 475, conceptTag: 'смешанное', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '800 кг − 3 ц = ? кг', correctAnswer: 500, conceptTag: 'вычитание', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'В 1 мешке 25 кг. Сколько мешков в 1 ц?', correctAnswer: 4, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Объём
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Сколько литров?',
    subtitle: 'Литр — главная единица',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Молоко — 1 л, ведро — 10 л, бочка — 100 л.',
      body: 'Литр — главная единица объёма. С неё начинается любой счёт жидкости.',
      mascotEntry: 'teach',
      bgPattern: 'waves',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🍶', accent: 'sky', caption: 'Бутылка молока: ~1 л' },
        { emoji: '🪣', accent: 'amber', caption: 'Ведро: 10 л' },
        { emoji: '🛢️', accent: 'emerald', caption: 'Бочка: 100 л!' }
      ],
      prompt: 'Сколько литров обычно в одной бутылке воды?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '0.5–1 л', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '10 л' },
        { id: 'c', emoji: '🤯', label: '100 л' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что знаешь о литрах?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: 'В каких единицах меряют сок?', options: ['кг', 'см', 'л', 'м'], correctIndex: 2, conceptTag: 'единицы', explanation: 'Жидкости — в литрах.' },
        { id: 'd2', prompt: '5 л − 2 л = ?', options: ['7', '3', '10', '5'], correctIndex: 1, conceptTag: 'арифметика', explanation: '5−2=3.' },
        { id: 'd3', prompt: 'Ведро 10 л + 5 л = ?', options: ['10', '15', '50', '5'], correctIndex: 1, conceptTag: 'сложение', explanation: '10+5=15.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Кувшины и вёдра',
    subtitle: 'Объём как количество',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'grouping', totalItems: 12, groupsRange: [2, 4] },
      probes: [
        { id: 'p1', prompt: '3 кувшина по 2 л. Всего?', options: ['5', '6', '23', '8'], correctIndex: 1, explanation: '3×2=6.' },
        { id: 'p2', prompt: 'Из ведра 10 л вылили 3. Осталось?', options: ['7', '13', '3', '10'], correctIndex: 0, explanation: '10−3=7.' }
      ],
      copy: { headline: 'Литры складываются и вычитаются как числа', body: 'Объём — количество жидкости. Главная единица — литр (л).' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Литр — единица объёма',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Литры в жизни',
          panels: [
            { emoji: '🍼', accent: 'sky', caption: 'Бутылка: 0.5–2 л' },
            { emoji: '🪣', accent: 'amber', caption: 'Ведро: 8–12 л' },
            { emoji: '🛁', accent: 'emerald', caption: 'Ванна: ~100 л' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: 'Объём (или вместимость) — сколько жидкости помещается в сосуд. Главная единица — **литр (л)**.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'text', content: 'Литры можно складывать и вычитать как числа: 3 л + 5 л = 8 л.' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А как сравнивать?',
          revealedKind: 'text',
          revealedContent: 'Со знаками >, <, =. Например: 5 л > 3 л; 10 л = 10 л.',
          revealedHint: 'Как обычные числа.'
        },
        { id: 'c5', kind: 'text', content: 'Главное правило: складывать только литры с литрами. Не путать с массой и длиной.' }
      ],
      checks: [
        { id: 'ch1', prompt: '4 л + 6 л = ?', options: ['10', '24', '46', '2'], correctIndex: 0 },
        { id: 'ch2', prompt: '15 л − 7 л = ?', options: ['8', '22', '15', '7'], correctIndex: 0 },
        { id: 'ch3', prompt: 'Что больше: 3 л или 30 л?', options: ['3 л', '30 л', 'равны', 'нельзя'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Объём в задачах',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Объём',
      anatomy: [
        { id: 'a1', label: 'Литр (л)', role: 'основная единица объёма', accent: 'sky' },
        { id: 'a2', label: 'Вместимость', role: 'сколько помещается', accent: 'green' }
      ],
      terms: [
        { term: 'Литр', definition: 'Единица объёма жидкости.', example: 'В чайнике 2 л', speakText: 'Литр — для жидкости' },
        { term: 'Вместимость', definition: 'Объём, помещающийся в сосуд.', example: 'Ведро 10 л', speakText: 'Вместимость — что влезет' }
      ],
      buildTask: {
        prompt: '5 л + 3 л = ___ л',
        template: '___',
        expected: ['8'],
        distractors: ['2', '15', '53', '53', '12']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем объёмы',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Решаем простые задачи на объём.',
      examples: [
        {
          id: 'ex1', problem: 'В ведре 10 л. Долили 4 л. Сколько стало?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Действие', explanation: '«Долили» — это сложение.', action: { kind: 'choice', prompt: '+ или −?', options: ['+', '−'], correctIndex: 0 } },
            { index: 2, title: 'Считаем', explanation: '10 + 4 = 14.', visual: { kind: 'board', boardLines: ['10 + 4 = 14 л'] }, action: { kind: 'numeric', prompt: '10 + 4 = ?', expected: 14 } }
          ]
        },
        {
          id: 'ex2', problem: 'В бочке 50 л. Использовали 18 л. Осталось?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Действие', explanation: '«Использовали» — вычитание.', action: { kind: 'choice', prompt: '+ или −?', options: ['+', '−'], correctIndex: 1 } },
            { index: 2, title: 'Считаем', explanation: '50 − 18 = 32.', action: { kind: 'numeric', prompt: '50 − 18 = ?', expected: 32 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем литры',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини задачу с ответом',
          left: [
            { id: 'L1', label: '7 л + 3 л' },
            { id: 'L2', label: '20 л − 8 л' },
            { id: 'L3', label: '2 ведра по 10 л' },
            { id: 'L4', label: '5 бутылей по 3 л' }
          ],
          right: [
            { id: 'R1', label: '10 л', pairId: 'L1' },
            { id: 'R2', label: '12 л', pairId: 'L2' },
            { id: 'R3', label: '20 л', pairId: 'L3' },
            { id: 'R4', label: '15 л', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '15 л + 25 л = ? л', correctAnswer: 40 },
        { kind: 'numeric', id: 't3', prompt: '50 л − 17 л = ? л', correctAnswer: 33 },
        { kind: 'numeric', id: 't4', prompt: '6 л − 2 л = ? л', correctAnswer: 4 },
        { kind: 'numeric', id: 't5', prompt: '40 л − 25 л = ? л', correctAnswer: 15 },
        { kind: 'numeric', id: 't6', prompt: '3 канистры по 5 л = ? л', correctAnswer: 15 }
      ],
      socraticHints: {
        t3: ['Из 50 убери 17.'],
        t6: ['3 × 5 = ?']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Стройка: вода и краска',
    icon: 'i-lucide-hard-hat', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'construction',
      setting: {
        title: 'Расход материалов',
        roleplay: 'Помоги прорабу: считай литры воды, краски, цемента.',
        characterName: 'Прораб Айдар',
        mascotLine: 'Литры — как обычные числа!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Маляр', request: 'В банке 5 л краски, использовали 2 л. Осталось?', correct: 3, wrongFeedback: '5−2=3.', revenueReward: 30, reputationReward: 1 },
        { id: 'o2', customer: 'Бригада', request: '3 л воды + 4 л раствора. Всего?', correct: 7, wrongFeedback: '3+4=7.', revenueReward: 70, reputationReward: 1 },
        { id: 'o3', customer: 'Объект', request: 'В бочке 30 л, использовали 12. Осталось?', correct: 18, wrongFeedback: '30−12=18.', revenueReward: 30, reputationReward: 1 },
        { id: 'o4', customer: 'Доставка', request: '4 канистры по 5 л. Всего?', correct: 20, wrongFeedback: '4×5=20.', revenueReward: 80, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой ремонт',
        request: 'ФИНАЛ: Купили 50 л краски, потратили 18 + 14 + 7 л. Остаток?',
        correct: 11,
        wrongFeedback: '50−39=11.',
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
      bugHunterBadge: { label: 'Литровый эксперт', emoji: '💧' },
      intro: 'Объём — это литры. Не путай с массой и длиной.',
      traps: [
        { id: 'tr1', wrongStatement: 'Сок измеряют в кг', whyWrong: 'Жидкости — в литрах, не в кг.', correctStatement: 'Сок — в литрах', rememberNote: 'Жидкость = литры.' },
        { id: 'tr2', wrongStatement: 'Складывал литры с кг', whyWrong: 'Это разные величины. Не складываются.', correctStatement: 'Только одинаковые единицы', rememberNote: 'л + кг — нельзя.' },
        { id: 'tr3', wrongStatement: '«Бутылка молока — 100 л»', whyWrong: 'Это слишком много. Бутылка — обычно 1 л.', correctStatement: 'Бутылка — 1 л', rememberNote: 'Прикидывай разумно.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи про литр',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'младшему брату',
      voicePrompt: 'Расскажи что такое литр',
      coverPrompts: ['Что измеряют в литрах?', 'Приведи пример из жизни.', 'Как сложить 5 л и 7 л?'],
      referenceAnswer: 'В литрах измеряют объём жидкости — например, воду, молоко, сок. Бутылка воды обычно 1 л, ведро — около 10 л. Литры складываются как обычные числа: 5 л + 7 л = 12 л. Главное — обе величины должны быть в литрах.',
      requiredConcepts: ['литр', 'объём', 'жидкость'],
      conceptKeywords: {
        литр: ['литр', 'л'],
        объём: ['объём', 'вместим'],
        жидкость: ['жидк', 'вод', 'сок', 'молок']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['литр', 'жидк'] }
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
      shareCapsuleName: 'Объём · Стройка',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '8 л + 4 л = ? л', correctAnswer: 12, conceptTag: 'сложение', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '25 л − 13 л = ? л', correctAnswer: 12, conceptTag: 'вычитание', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'choice', prompt: 'Что больше: 5 л или 50 л?', options: ['5 л', '50 л', 'равны'], correctIndex: 1, conceptTag: 'сравнение', cognitiveLevel: 'understand' },
        { id: 'm4', kind: 'numeric', prompt: 'В аквариуме 30 л, долили 15. Стало?', correctAnswer: 45, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'В бочке 100 л. Использовали 38. Осталось?', correctAnswer: 62, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '12 л + 9 л = ? л', correctAnswer: 21, conceptTag: 'сложение', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '40 л − 22 л = ? л', correctAnswer: 18, conceptTag: 'вычитание', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '6 канистр по 5 л = ? л', correctAnswer: 30, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: 'В чайнике 3 л, налили из бутыли 2 л. Стало?', correctAnswer: 5, conceptTag: 'применение', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'В бочке 80 л, использовали 45 л. Осталось?', correctAnswer: 35, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Величины и их измерение', layersInsertedByLesson: counter }
})
