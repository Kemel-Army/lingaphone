import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * 11 layers × 3 lessons of «Письменное сложение и вычитание».
 *   1. Сложение в столбик без перехода через разряд
 *   2. Сложение в столбик с переходом через разряд
 *   3. Вычитание в столбик с переходом через разряд
 *
 * S6: тема №05, theme-pack = 'cafe' (продолжение арифметического блока после темы 02).
 * Все обогащения S2-S5: frames, emojiChoices, hearts, comic-chunks, tap-reveal,
 * voice-terms, distractors, board-visual, tap-pair, boss+combo, voiceFirst,
 * trophyThresholds, share, questionPool, bug-hunter badges (📐/📦/🤝).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Письменное сложение и вычитание')
  const L1 = lessonIds['Сложение в столбик без перехода через разряд']
  const L2 = lessonIds['Сложение в столбик с переходом через разряд']
  const L3 = lessonIds['Вычитание в столбик с переходом через разряд']
  if (!L1 || !L2 || !L3) throw createError({ statusCode: 500, message: 'Some lessons missing for «Письменное сложение и вычитание»' })

  await wipeLayersForLessons(supabase, [L1, L2, L3])
  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Сложение в столбик без перехода
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Столбиком — это магия',
    subtitle: 'Подписываем по разрядам',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Столбиком можно сложить даже огромные числа — главное правильно подписать.',
      body: 'Поставь десятки под десятками, единицы под единицами. И всё.',
      mascotEntry: 'teach',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📋', accent: 'sky', caption: 'Чек кассира: 34 + 23' },
        { emoji: '📐', accent: 'amber', caption: 'Единицы под единицами' },
        { emoji: '✨', accent: 'emerald', caption: '7 + 50 = 57. Готово!' }
      ],
      prompt: 'Что важнее всего при записи столбиком?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Красивый почерк' },
        { id: 'b', emoji: '🥇', label: 'Правильно подписать разряды', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Скорость' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к столбику?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '4 + 3 = ?', options: ['7', '12', '1', '34'], correctIndex: 0, conceptTag: 'единицы', explanation: '4+3=7.' },
        { id: 'd2', prompt: 'В числе 34 какая цифра в разряде десятков?', options: ['3', '4', '34', '0'], correctIndex: 0, conceptTag: 'разряд', explanation: 'Левая цифра = разряд десятков.' },
        { id: 'd3', prompt: '34 + 23 = ?', options: ['11', '57', '47', '67'], correctIndex: 1, conceptTag: 'двузнач+двузнач', explanation: '30+20=50, 4+3=7, итого 57.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Подписываем по разрядам',
    subtitle: 'Десятки + десятки, единицы + единицы',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'place-value-blocks', maxHundreds: 0, maxTens: 9, maxOnes: 9, target: 57 },
      probes: [
        { id: 'p1', prompt: '3 десятка + 2 десятка = сколько десятков?', options: ['3', '5', '7', '34'], correctIndex: 1, explanation: '3+2=5 десятков.' },
        { id: 'p2', prompt: '4 единицы + 5 единиц = ?', options: ['9', '7', '4', '5'], correctIndex: 0, explanation: '4+5=9.' }
      ],
      copy: { headline: 'Складываем разряды отдельно: десятки с десятками, единицы с единицами', body: 'Это и есть смысл столбика.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Алгоритм столбика',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Столбик за 3 шага',
          panels: [
            { emoji: '📐', accent: 'sky', caption: '1. Подпиши разряды' },
            { emoji: '➕', accent: 'amber', caption: '2. Сложи единицы' },
            { emoji: '🎯', accent: 'emerald', caption: '3. Сложи десятки' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Столбиком пишем так:** единицы под единицами, десятки под десятками. Сначала складываем единицы, потом десятки.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '34 + 23 = 57' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Что значит «без перехода»?',
          revealedKind: 'text',
          revealedContent: 'Это значит, что сумма единиц меньше 10 — десяток никуда не уезжает. Самый простой случай.',
          revealedHint: 'Без перехода = ≤ 9 в единицах.'
        },
        { id: 'c5', kind: 'text', content: 'Пример: 34 + 23. Подписываем 4 под 3, 3 под 2. Единицы: 4 + 3 = 7. Десятки: 3 + 2 = 5. Ответ: 57.' }
      ],
      checks: [
        { id: 'ch1', prompt: '52 + 34 = ?', options: ['86', '76', '96', '56'], correctIndex: 0 },
        { id: 'ch2', prompt: '41 + 26 = ?', options: ['57', '67', '63', '17'], correctIndex: 1 },
        { id: 'ch3', prompt: 'С чего начинаем?', options: ['С десятков', 'С единиц', 'С нулей', 'С любого'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись столбиком',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Столбик 34 + 23',
      anatomy: [
        { id: 'a1', label: 'Единицы (4 + 3)', role: 'правый столбец: 7', accent: 'amber' },
        { id: 'a2', label: 'Десятки (3 + 2)', role: 'левый столбец: 5', accent: 'sky' },
        { id: 'a3', label: 'Ответ: 57', role: 'итог', accent: 'green' }
      ],
      terms: [
        { term: 'Столбик', definition: 'Способ записи «друг под другом» по разрядам.', example: '34 + 23 в столбик', speakText: 'Столбик — запись по разрядам' },
        { term: 'Разряд', definition: 'Место цифры в числе: единицы, десятки, сотни.', example: 'В 34: 3 — десятки, 4 — единицы', speakText: 'Разряд — место цифры' }
      ],
      buildTask: {
        prompt: 'Сложи столбиком 25 + 31',
        template: '___',
        expected: ['56'],
        distractors: ['46', '66', '54', '85', '25']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем шаг за шагом',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм в 3 шага: подпиши, сложи единицы, сложи десятки.',
      examples: [
        {
          id: 'ex1', problem: '52 + 34', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Подписываем разряды', explanation: 'Под 2 пишем 4. Под 5 — 3.', visual: { kind: 'board', boardLines: ['\\;\\;52', '+34', '----'] }, action: { kind: 'choice', prompt: 'Что под 2?', options: ['4', '3', '34'], correctIndex: 0 } },
            { index: 2, title: 'Складываем единицы', explanation: '2 + 4 = 6.', visual: { kind: 'board', boardLines: ['\\;\\;52', '+34', '----', '\\;\\;\\;\\;6'] }, action: { kind: 'numeric', prompt: '2 + 4 = ?', expected: 6 } },
            { index: 3, title: 'Складываем десятки', explanation: '5 + 3 = 8.', visual: { kind: 'board', boardLines: ['\\;\\;52', '+34', '----', '\\;\\;86'] }, action: { kind: 'numeric', prompt: '5 + 3 = ?', expected: 8 } },
            { index: 4, title: 'Ответ', explanation: '52 + 34 = 86.', action: { kind: 'numeric', prompt: 'Итого:', expected: 86 } }
          ]
        },
        {
          id: 'ex2', problem: '46 + 23', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Единицы', explanation: '6 + 3 = 9.', action: { kind: 'numeric', prompt: '6 + 3 = ?', expected: 9 } },
            { index: 2, title: 'Десятки', explanation: '4 + 2 = 6. Итого 69.', action: { kind: 'numeric', prompt: 'Итого:', expected: 69 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируемся в столбике',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сумму с ответом',
          left: [
            { id: 'L1', label: '23 + 14' },
            { id: 'L2', label: '52 + 36' },
            { id: 'L3', label: '41 + 25' },
            { id: 'L4', label: '60 + 38' }
          ],
          right: [
            { id: 'R1', label: '37', pairId: 'L1' },
            { id: 'R2', label: '88', pairId: 'L2' },
            { id: 'R3', label: '66', pairId: 'L3' },
            { id: 'R4', label: '98', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '64 + 13 = ?', correctAnswer: 77 },
        { kind: 'numeric', id: 't3', prompt: '30 + 27 = ?', correctAnswer: 57 },
        { kind: 'numeric', id: 't4', prompt: '15 + 24 = ?', correctAnswer: 39 },
        { kind: 'numeric', id: 't5', prompt: '17 + 22 = ?', correctAnswer: 39 },
        { kind: 'numeric', id: 't6', prompt: '46 + 32 = ?', correctAnswer: 78 }
      ],
      socraticHints: {
        t2: ['Единицы: 4+3. Десятки: 6+1.'],
        t3: ['Единицы: 0+7=7. Десятки: 3+2=5.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Касса супермаркета',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Супермаркет «Дастархан»',
        roleplay: 'Помоги кассиру: считай чеки в столбик. Покупатели рассчитываются.',
        characterName: 'Кассир Жанар',
        mascotLine: 'Единицы под единицами, десятки под десятками!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Молодая мама', request: 'Хлеб 23 тг + молоко 14 тг. Итого?', correct: 37, wrongFeedback: '23+14=37.', revenueReward: 37, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Сок 35 тг + булочка 24 тг. Сумма?', correct: 59, wrongFeedback: '35+24=59.', revenueReward: 59, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'Сыр 42 тг + колбаса 36 тг. Чек?', correct: 78, wrongFeedback: '42+36=78.', revenueReward: 78, reputationReward: 1 },
        { id: 'o4', customer: 'Бабушка', request: 'Творог 25 тг + сметана 33 тг. Всего?', correct: 58, wrongFeedback: '25+33=58.', revenueReward: 58, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой чек',
        request: 'ФИНАЛ: 53 тг + 46 тг. К оплате?',
        correct: 99,
        wrongFeedback: '53+46=99.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Главные ошибки',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Ровные столбики', emoji: '📐' },
      intro: 'Ошибки в столбике все одинаковые — невнимательность к разрядам.',
      traps: [
        { id: 'tr1', wrongStatement: 'Подписал единицы под десятками', whyWrong: 'Если разряды съехали, ответ будет неверным.', correctStatement: 'Единицы под единицами, десятки под десятками', rememberNote: 'Прямые столбики.' },
        { id: 'tr2', wrongStatement: '«23 + 14 = 73»', whyWrong: 'Сложил неправильно. Перепроверь: 3+4=7, 2+1=3, ответ 37.', correctStatement: '23 + 14 = 37', rememberNote: 'Сначала единицы, потом десятки.' },
        { id: 'tr3', wrongStatement: 'Начал складывать с десятков', whyWrong: 'При переходе через разряд это приведёт к ошибке. Привыкай — справа налево.', correctStatement: 'Сначала единицы (справа)', rememberNote: 'Справа налево.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни столбик',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как складывать столбиком',
      coverPrompts: ['Как правильно подписать числа?', 'С какого разряда начинаем?', 'Покажи на примере 35 + 24'],
      referenceAnswer: 'Числа подписываем друг под другом: единицы под единицами, десятки под десятками. Складываем сначала единицы (правый столбец), потом десятки (левый). Например, 35 + 24: 5 + 4 = 9 единиц, 3 + 2 = 5 десятков, ответ 59.',
      requiredConcepts: ['разряды', 'единицы', 'десятки'],
      conceptKeywords: {
        разряды: ['разряд'],
        единицы: ['единиц'],
        десятки: ['десят']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['разряд', 'единиц'] }
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
      shareCapsuleName: 'Столбик без перехода · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '34 + 25 = ?', correctAnswer: 59, conceptTag: 'столбик', cognitiveLevel: 'apply', explanation: '4+5=9, 3+2=5.' },
        { id: 'm2', kind: 'numeric', prompt: '52 + 36 = ?', correctAnswer: 88, conceptTag: 'столбик', cognitiveLevel: 'apply', explanation: '2+6=8, 5+3=8.' },
        { id: 'm3', kind: 'numeric', prompt: '70 + 23 = ?', correctAnswer: 93, conceptTag: 'столбик', cognitiveLevel: 'apply', explanation: '0+3=3, 7+2=9.' },
        { id: 'm4', kind: 'choice', prompt: 'С чего начинаем?', options: ['С десятков', 'С единиц', 'С большего', 'Неважно'], correctIndex: 1, conceptTag: 'теория', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'numeric', prompt: 'У Айгуль 34 наклейки, мама подарила 22. Стало?', correctAnswer: 56, conceptTag: 'применение', cognitiveLevel: 'apply', explanation: '34+22=56.' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '45 + 32 = ?', correctAnswer: 77, conceptTag: 'столбик', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '60 + 25 = ?', correctAnswer: 85, conceptTag: 'столбик', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '23 + 51 = ?', correctAnswer: 74, conceptTag: 'столбик', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '13 + 62 = ?', correctAnswer: 75, conceptTag: 'столбик', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Магазин: 41 + 28 = ? тг', correctAnswer: 69, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Сложение в столбик с переходом
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Запоминаем десяток',
    subtitle: 'Перенос наверх',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Если в единицах больше 9 — десяток «уезжает» в соседний столбик.',
      body: 'Над десятками пишем маленькую 1 — «уехавший десяток».',
      mascotEntry: 'celebrate',
      bgPattern: 'confetti',
      successSfx: 'levelup',
      frames: [
        { emoji: '7️⃣', accent: 'amber', caption: 'Единицы: 7 + 5 = 12' },
        { emoji: '📦', accent: 'rose', caption: 'Десяток упаковали!' },
        { emoji: '⬆️', accent: 'emerald', caption: '+1 уезжает наверх' }
      ],
      prompt: 'Если 7 + 5 = 12, то сколько уйдёт в десятки?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: '0' },
        { id: 'b', emoji: '🥇', label: '1', isPrimary: true },
        { id: 'c', emoji: '🤯', label: '12' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Проверим готовность',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '8 + 7 = ?', options: ['15', '14', '16', '1'], correctIndex: 0, conceptTag: 'через-10', explanation: '8+2=10, +5=15.' },
        { id: 'd2', prompt: 'В сумме 15 — сколько единиц?', options: ['1', '5', '15', '8'], correctIndex: 1, conceptTag: 'разряд-сумм', explanation: '15: единицы=5, десятки=1.' },
        { id: 'd3', prompt: '34 + 9 = ?', options: ['43', '13', '343', '33'], correctIndex: 0, conceptTag: 'переход-двузн', explanation: '34+6=40, +3=43.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: '10 единиц = 1 десяток',
    subtitle: 'Группируем по 10',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'place-value-blocks', maxHundreds: 0, maxTens: 9, maxOnes: 14, target: 75 },
      probes: [
        { id: 'p1', prompt: 'У тебя 14 точек. Сколько полных десятков?', options: ['1', '4', '14', '0'], correctIndex: 0, explanation: '14 = 10 + 4.' },
        { id: 'p2', prompt: 'Сколько единиц останется?', options: ['4', '10', '14', '0'], correctIndex: 0, explanation: '14 − 10 = 4.' }
      ],
      copy: { headline: 'Каждые 10 единиц мы заменяем на 1 десяток', body: 'Этот десяток уходит наверх, в соседний столбик.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Переход через разряд',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Перенос за 3 кадра',
          panels: [
            { emoji: '7️⃣', accent: 'sky', caption: '7+8=15: пишем 5' },
            { emoji: '⬆️', accent: 'amber', caption: '1 уходит в десятки' },
            { emoji: '🎯', accent: 'emerald', caption: 'Десятки: 4+2+1=7. Ответ 75!' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Если в единицах сумма ≥ 10 — отдай 1 десяток наверх.** В единицах оставь только то, что больше 10.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '47 + 28 = 75' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Где помечают перенос?',
          revealedKind: 'text',
          revealedContent: 'Над разрядом десятков ставят маленькую +1. Это страховка, чтобы не забыть прибавить.',
          revealedHint: 'Маленькая 1 наверху — твой друг.'
        },
        { id: 'c5', kind: 'text', content: 'Пример: 47 + 28. Единицы: 7+8=15. Записываем 5 в единицы, 1 несём наверх. Десятки: 4+2+1=7. Ответ: 75.' }
      ],
      checks: [
        { id: 'ch1', prompt: '36 + 28 = ?', options: ['64', '54', '14', '614'], correctIndex: 0, explanation: '6+8=14, +1; 3+2+1=6.' },
        { id: 'ch2', prompt: '45 + 19 = ?', options: ['54', '64', '24', '34'], correctIndex: 1 },
        { id: 'ch3', prompt: '57 + 33 = ?', options: ['80', '90', '70', '88'], correctIndex: 1 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: '«Принесённый» десяток',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: '47 + 28: переход',
      anatomy: [
        { id: 'a1', label: '7 + 8 = 15', role: 'единицы: записываем 5, переносим 1', accent: 'amber' },
        { id: 'a2', label: '4 + 2 + 1', role: 'десятки + перенос = 7', accent: 'sky' },
        { id: 'a3', label: '75', role: 'ответ', accent: 'green' }
      ],
      terms: [
        { term: 'Переход через разряд', definition: 'Когда сумма ≥ 10 и десяток уходит в следующий разряд.', example: '47+28: единицы 15, десяток наверх', speakText: 'Переход — десяток уезжает' },
        { term: 'Перенос', definition: 'Маленькая +1 над разрядом — «принесённый» десяток.', example: 'Маленькая 1 над десятками', speakText: 'Перенос — маленькая единица' }
      ],
      buildTask: {
        prompt: '38 + 24 = ___',
        template: '___',
        expected: ['62'],
        distractors: ['52', '72', '512', '514', '13']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем с переходом',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Шаги: единицы → если ≥10, перенос → десятки + перенос.',
      examples: [
        {
          id: 'ex1', problem: '47 + 28', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Единицы', explanation: '7 + 8 = 15.', visual: { kind: 'board', boardLines: ['\\;\\;\\overset{1}{4}7', '+28', '----'] }, action: { kind: 'numeric', prompt: '7 + 8 = ?', expected: 15 } },
            { index: 2, title: 'Запись', explanation: 'Пишем 5, 1 несём в десятки.', visual: { kind: 'board', boardLines: ['\\;\\;\\overset{1}{4}7', '+28', '----', '\\;\\;\\;\\;5'] }, action: { kind: 'choice', prompt: 'Что в единицы?', options: ['5', '15', '1'], correctIndex: 0 } },
            { index: 3, title: 'Десятки + перенос', explanation: '4 + 2 + 1 = 7.', visual: { kind: 'board', boardLines: ['\\;\\;\\overset{1}{4}7', '+28', '----', '\\;\\;75'] }, action: { kind: 'numeric', prompt: 'Десятки = ?', expected: 7 } },
            { index: 4, title: 'Ответ', explanation: '75.', action: { kind: 'numeric', prompt: 'Итого:', expected: 75 } }
          ]
        },
        {
          id: 'ex2', problem: '36 + 47', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Единицы', explanation: '6+7=13. Пишем 3, переносим 1.', action: { kind: 'numeric', prompt: '6+7=?', expected: 13 } },
            { index: 2, title: 'Десятки', explanation: '3+4+1=8. Ответ 83.', action: { kind: 'numeric', prompt: 'Итого:', expected: 83 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем переход',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини сумму с ответом',
          left: [
            { id: 'L1', label: '47 + 28' },
            { id: 'L2', label: '36 + 47' },
            { id: 'L3', label: '58 + 24' },
            { id: 'L4', label: '67 + 13' }
          ],
          right: [
            { id: 'R1', label: '75', pairId: 'L1' },
            { id: 'R2', label: '83', pairId: 'L2' },
            { id: 'R3', label: '82', pairId: 'L3' },
            { id: 'R4', label: '80', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '45 + 19 = ?', correctAnswer: 64 },
        { kind: 'numeric', id: 't3', prompt: '29 + 36 = ?', correctAnswer: 65 },
        { kind: 'numeric', id: 't4', prompt: '57 + 33 = ?', correctAnswer: 90 },
        { kind: 'numeric', id: 't5', prompt: '74 + 18 = ?', correctAnswer: 92 },
        { kind: 'numeric', id: 't6', prompt: '38 + 26 = ?', correctAnswer: 64 }
      ],
      socraticHints: {
        t2: ['5+9=14, перенос +1.'],
        t3: ['9+6=15, перенос +1; 2+3+1=6.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Маркет на рынке',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Зелёный базар',
        roleplay: 'Помоги продавцу овощей считать чеки. Часто бывает переход.',
        characterName: 'Продавец Канат',
        mascotLine: 'Десяток уходит наверх — не забывай его прибавить!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Бабушка', request: 'Огурцы 47 + помидоры 28. Чек?', correct: 75, wrongFeedback: '47+28=75.', revenueReward: 75, reputationReward: 1 },
        { id: 'o2', customer: 'Семья', request: 'Картошка 58 + лук 24. Сумма?', correct: 82, wrongFeedback: '58+24=82.', revenueReward: 82, reputationReward: 1 },
        { id: 'o3', customer: 'Гость', request: 'Морковь 36 + капуста 47. Итого?', correct: 83, wrongFeedback: '36+47=83.', revenueReward: 83, reputationReward: 1 },
        { id: 'o4', customer: 'Школьник', request: 'Яблоко 29 + банан 36. Чек?', correct: 65, wrongFeedback: '29+36=65.', revenueReward: 65, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой заказ',
        request: 'ФИНАЛ: 78 тг + 65 тг = ? тг',
        correct: 143,
        wrongFeedback: '78+65=143 (с переносом).',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Не забудь перенос!',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Носитель десятков', emoji: '📦' },
      intro: 'Самая частая ошибка — забыть прибавить «принесённый» десяток.',
      traps: [
        { id: 'tr1', wrongStatement: '«47 + 28 = 65» (забыл +1 в десятках)', whyWrong: 'Записал 7+8=15, в единицы 5, но забыл +1. Десятки: 4+2+**1**=7, не 6.', correctStatement: '47 + 28 = 75', rememberNote: '+1 над десятками — обязательно!' },
        { id: 'tr2', wrongStatement: '«36 + 47 = 713»', whyWrong: 'Записал в единицах сразу 13. В единицах должна быть только 3, а 1 идёт наверх.', correctStatement: '36 + 47 = 83', rememberNote: 'В клетке только одна цифра.' },
        { id: 'tr3', wrongStatement: 'Не отметил перенос, забыл', whyWrong: 'Привыкай ставить маленькую 1 над разрядом десятков. Это страховка.', correctStatement: 'Маленький +1 наверху — твой друг', rememberNote: 'Помечай перенос всегда.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни переход',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу',
      voicePrompt: 'Расскажи как складывать с переходом',
      coverPrompts: ['Что значит «переход через разряд»?', 'Куда идёт лишний десяток?', 'Покажи на примере 47 + 28.'],
      referenceAnswer: 'Если в единицах получилось больше 9, то один десяток «уезжает» в столбик десятков. В единицах остаётся только остаток. Например, 47 + 28: единицы 7+8=15, пишем 5, переносим 1 наверх. Десятки 4+2+1=7. Ответ 75.',
      requiredConcepts: ['переход', 'десяток', 'перенос'],
      conceptKeywords: {
        переход: ['переход'],
        десяток: ['десят'],
        перенос: ['перенос', 'наверх']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['переход', 'десят'] }
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
      shareCapsuleName: 'Столбик с переходом · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '38 + 24 = ?', correctAnswer: 62, conceptTag: 'переход+', cognitiveLevel: 'apply', explanation: '8+4=12; 3+2+1=6.' },
        { id: 'm2', kind: 'numeric', prompt: '46 + 27 = ?', correctAnswer: 73, conceptTag: 'переход+', cognitiveLevel: 'apply', explanation: '6+7=13; 4+2+1=7.' },
        { id: 'm3', kind: 'numeric', prompt: '57 + 35 = ?', correctAnswer: 92, conceptTag: 'переход+', cognitiveLevel: 'apply', explanation: '7+5=12; 5+3+1=9.' },
        { id: 'm4', kind: 'numeric', prompt: '67 + 23 = ?', correctAnswer: 90, conceptTag: 'переход+', cognitiveLevel: 'apply', explanation: '7+3=10; 6+2+1=9.' },
        { id: 'm5', kind: 'numeric', prompt: 'Купили на 48 тг и 35 тг. Потратили?', correctAnswer: 83, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '29 + 47 = ?', correctAnswer: 76, conceptTag: 'переход+', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '58 + 16 = ?', correctAnswer: 74, conceptTag: 'переход+', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '76 + 18 = ?', correctAnswer: 94, conceptTag: 'переход+', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '49 + 31 = ?', correctAnswer: 80, conceptTag: 'переход+', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Магазин: 65 тг + 27 тг = ?', correctAnswer: 92, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Вычитание в столбик с переходом (заём)
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Занимаем десяток',
    subtitle: 'Когда не хватает единиц',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '52 − 17. В единицах не хватает! Что делать?',
      body: 'Занимаем 1 десяток. 12 − 7 = 5. И в десятках теперь не 5, а 4.',
      mascotEntry: 'think',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '😟', accent: 'rose', caption: '52 − 17: 2 < 7 — не хватает!' },
        { emoji: '🤝', accent: 'amber', caption: 'Занимаем 1 десяток у соседа' },
        { emoji: '✨', accent: 'emerald', caption: '12−7=5, 4−1=3 → 35!' }
      ],
      prompt: 'Откуда взять не хватающие единицы при вычитании?',
      emojiChoices: [
        { id: 'a', emoji: '🤔', label: 'Списать у соседа' },
        { id: 'b', emoji: '🥇', label: 'Занять 1 десяток', isPrimary: true },
        { id: 'c', emoji: '🤯', label: 'Пропустить' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к занимам?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '12 − 7 = ?', options: ['5', '7', '19', '15'], correctIndex: 0, conceptTag: 'через-10', explanation: '12−2=10, 10−5=5.' },
        { id: 'd2', prompt: '52 − 17. Можно вычесть единицы напрямую (2 − 7)?', options: ['Да', 'Нет, нужно занять', 'Нет, написать 5', 'Нельзя'], correctIndex: 1, conceptTag: 'занимание', explanation: '2 < 7 — нужно занять.' },
        { id: 'd3', prompt: '50 − 14 = ?', options: ['36', '46', '64', '14'], correctIndex: 0, conceptTag: 'двузнач', explanation: '50−10=40, 40−4=36.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Пучок развязан',
    subtitle: '1 десяток = 10 единиц',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'place-value-blocks', maxHundreds: 0, maxTens: 9, maxOnes: 14, target: 35 },
      probes: [
        { id: 'p1', prompt: '5 десятков и 2 единицы. Не хватает 5 единиц. Что делать?', options: ['Развязать 1 пучок', 'Пропустить', 'Прибавить', 'Оставить'], correctIndex: 0, explanation: '1 десяток развязали → 12 единиц, 4 десятка.' },
        { id: 'p2', prompt: '4 десятка и 12 единиц. Можно вычесть 7 единиц?', options: ['Да', 'Нет', 'Может быть', 'Никогда'], correctIndex: 0, explanation: '12−7=5.' }
      ],
      copy: { headline: 'Не хватает единиц — развяжи десяток', body: 'Это и есть «занять у соседа». Десятков −1, единиц +10.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Алгоритм с занимом',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Заём за 3 кадра',
          panels: [
            { emoji: '🚫', accent: 'rose', caption: '2 − 7: не хватает' },
            { emoji: '🤝', accent: 'amber', caption: 'Заняли 1 десяток' },
            { emoji: '🎯', accent: 'emerald', caption: '12−7=5, 4−1=3 → 35' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Если в верхнем числе единиц меньше — занимаем 1 десяток.** Десятков −1, единиц +10.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '52 - 17 = 35' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'Как это записывают?',
          revealedKind: 'text',
          revealedContent: 'Зачёркивают цифру десятков и пишут на 1 меньше. А над единицами — маленькую 1 (или 10 единиц + старая цифра).',
          revealedHint: 'Зачёркивай — чтобы не забыть.'
        },
        { id: 'c5', kind: 'text', content: 'Пример: 52 − 17. Единицы: 2−7 нельзя. Заняли: 12−7=5. Десятки: 4 (было 5, отдали 1) − 1 = 3. Ответ: 35.' }
      ],
      checks: [
        { id: 'ch1', prompt: '63 − 28 = ?', options: ['35', '45', '85', '25'], correctIndex: 0 },
        { id: 'ch2', prompt: '40 − 14 = ?', options: ['26', '34', '54', '36'], correctIndex: 0 },
        { id: 'ch3', prompt: '70 − 35 = ?', options: ['35', '45', '105', '25'], correctIndex: 0 }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись «занят 1 десяток»',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: '52 − 17',
      anatomy: [
        { id: 'a1', label: '12 − 7 = 5', role: 'единицы (после заёма)', accent: 'amber' },
        { id: 'a2', label: '4 − 1 = 3', role: 'десятки (5−1 за занятый)', accent: 'sky' },
        { id: 'a3', label: '35', role: 'ответ', accent: 'green' }
      ],
      terms: [
        { term: 'Занять десяток', definition: 'Взять 1 десяток у соседнего разряда, превратив его в 10 единиц.', example: '52−17: 5 → 4, единиц 12', speakText: 'Занять десяток — превратить в 10 единиц' }
      ],
      buildTask: {
        prompt: '60 − 24 = ___',
        template: '___',
        expected: ['36'],
        distractors: ['46', '34', '46', '24', '84']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем с занимом',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Шаги: посмотри на единицы → если не хватает, займи → вычти единицы → вычти десятки (на 1 меньше).',
      examples: [
        {
          id: 'ex1', problem: '52 − 17', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Хватает единиц?', explanation: '2 < 7. Не хватает.', visual: { kind: 'board', boardLines: ['\\;\\;52', '-17', '----', '2 < 7 — занимай!'] }, action: { kind: 'choice', prompt: '2 ≥ 7?', options: ['Да', 'Нет'], correctIndex: 1 } },
            { index: 2, title: 'Занимаем', explanation: 'Десятков было 5 → стало 4. Единиц стало 12.', visual: { kind: 'board', boardLines: ['\\;\\overset{4}{\\cancel{5}}\\overset{1}{\\;}2', '-17', '----'] }, action: { kind: 'numeric', prompt: 'Сколько единиц?', expected: 12 } },
            { index: 3, title: 'Единицы', explanation: '12 − 7 = 5.', action: { kind: 'numeric', prompt: '12 − 7 = ?', expected: 5 } },
            { index: 4, title: 'Десятки', explanation: '4 − 1 = 3.', visual: { kind: 'board', boardLines: ['Ответ: 35'] }, action: { kind: 'numeric', prompt: 'Итого:', expected: 35 } }
          ]
        },
        {
          id: 'ex2', problem: '40 − 14', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Заём', explanation: '0 < 4. Заняли: 3 десятка, 10 единиц.', action: { kind: 'numeric', prompt: 'Единиц после заёма?', expected: 10 } },
            { index: 2, title: 'Считаем', explanation: '10−4=6, 3−1=2. Итого 26.', action: { kind: 'numeric', prompt: '40 − 14 = ?', expected: 26 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем заём',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини разность с ответом',
          left: [
            { id: 'L1', label: '52 − 17' },
            { id: 'L2', label: '63 − 28' },
            { id: 'L3', label: '70 − 35' },
            { id: 'L4', label: '80 − 47' }
          ],
          right: [
            { id: 'R1', label: '35', pairId: 'L1' },
            { id: 'R2', label: '35', pairId: 'L2' },
            { id: 'R3', label: '35', pairId: 'L3' },
            { id: 'R4', label: '33', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '40 − 14 = ?', correctAnswer: 26 },
        { kind: 'numeric', id: 't3', prompt: '92 − 38 = ?', correctAnswer: 54 },
        { kind: 'numeric', id: 't4', prompt: '100 − 35 = ?', correctAnswer: 65 },
        { kind: 'numeric', id: 't5', prompt: '54 − 19 = ?', correctAnswer: 35 },
        { kind: 'numeric', id: 't6', prompt: '85 − 47 = ?', correctAnswer: 38 }
      ],
      socraticHints: {
        t2: ['0<4? Займи: 10−4=6, 3−1=2.'],
        t3: ['2<8? Займи: 12−8=4, 8−3−1=4? Перечитай.']
      }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Бухгалтерия кафе',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Бухгалтерия кафе',
        roleplay: 'Помоги бухгалтеру: считай остатки в кассе после расходов.',
        characterName: 'Бухгалтер Назгуль',
        mascotLine: 'Не хватает единиц — займи у десятков!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Касса', request: 'Было 52 тг, потратили 17. Остаток?', correct: 35, wrongFeedback: '52−17=35.', revenueReward: 35, reputationReward: 1 },
        { id: 'o2', customer: 'Учёт', request: '70 − 35 = ?', correct: 35, wrongFeedback: '70−35=35.', revenueReward: 35, reputationReward: 1 },
        { id: 'o3', customer: 'Закупка', request: 'Было 80 тг, отдали 47. Сколько осталось?', correct: 33, wrongFeedback: '80−47=33.', revenueReward: 33, reputationReward: 1 },
        { id: 'o4', customer: 'Отчёт', request: '100 − 35 = ?', correct: 65, wrongFeedback: '100−35=65.', revenueReward: 65, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой отчёт',
        request: 'ФИНАЛ: Было 153 тг, потратили 78. Остаток?',
        correct: 75,
        wrongFeedback: '153−78=75 (двойной заём).',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Ошибки в занимании',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Заёмщик-эксперт', emoji: '🤝' },
      intro: 'Заём — место, где ошибки очень частые.',
      traps: [
        { id: 'tr1', wrongStatement: '«52 − 17 = 45» (вычел из 7 двойку)', whyWrong: 'Перепутал, что от чего отнимают. Нельзя «маленькое из большого» в столбце — нужно занимать.', correctStatement: '52 − 17 = 35', rememberNote: 'Сверху меньше — занимай!' },
        { id: 'tr2', wrongStatement: 'Не уменьшил десятки после займа', whyWrong: 'Если занял 1 десяток — десятков на 1 меньше. Не забывай уменьшать!', correctStatement: 'Десятки: 5 → 4 после займа', rememberNote: 'Заём = десятки минус 1.' },
        { id: 'tr3', wrongStatement: '«40 − 14 = 36»', whyWrong: 'Не учёл нулевые единицы. 0 < 4, занимай: 10−4=6, 3−1=2, ответ 26.', correctStatement: '40 − 14 = 26', rememberNote: 'Ноль в единицах — всегда заём.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи про заём',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику',
      voicePrompt: 'Расскажи как вычитать с занимом',
      coverPrompts: ['Когда нужно занимать десяток?', 'Что происходит с разрядами?', 'Покажи на примере 52 − 17.'],
      referenceAnswer: 'Когда в верхнем числе единиц меньше, чем в нижнем, нужно занять 1 десяток у соседа. Тогда десятков на 1 меньше, а единиц на 10 больше. Например, 52 − 17: 2 < 7, занимаем десяток. Стало 4 десятка и 12 единиц. 12 − 7 = 5, 4 − 1 = 3. Ответ 35.',
      requiredConcepts: ['заём', 'десяток', 'единицы'],
      conceptKeywords: {
        заём: ['зан', 'заём', 'занимаем'],
        десяток: ['десят'],
        единицы: ['единиц']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['зан', 'десят'] }
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
      shareCapsuleName: 'Вычитание с заёмом · Кафе',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '63 − 28 = ?', correctAnswer: 35, conceptTag: 'заём', cognitiveLevel: 'apply', explanation: '13−8=5, 5−2=3.' },
        { id: 'm2', kind: 'numeric', prompt: '50 − 17 = ?', correctAnswer: 33, conceptTag: 'заём', cognitiveLevel: 'apply', explanation: '10−7=3, 4−1=3.' },
        { id: 'm3', kind: 'numeric', prompt: '92 − 47 = ?', correctAnswer: 45, conceptTag: 'заём', cognitiveLevel: 'apply', explanation: '12−7=5, 8−4=4.' },
        { id: 'm4', kind: 'numeric', prompt: '100 − 35 = ?', correctAnswer: 65, conceptTag: 'заём', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Было 80 тг, потратили 47. Осталось?', correctAnswer: 33, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '74 − 28 = ?', correctAnswer: 46, conceptTag: 'заём', cognitiveLevel: 'apply' },
        { id: 'p2', kind: 'numeric', prompt: '85 − 39 = ?', correctAnswer: 46, conceptTag: 'заём', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '60 − 23 = ?', correctAnswer: 37, conceptTag: 'заём', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '91 − 56 = ?', correctAnswer: 35, conceptTag: 'заём', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'Было 70 тг, потратили 38. Остаток?', correctAnswer: 32, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Письменное сложение и вычитание', layersInsertedByLesson: counter }
})
