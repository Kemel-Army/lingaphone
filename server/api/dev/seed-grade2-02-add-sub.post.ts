import { serverSupabaseServiceRole } from '#supabase/server'
import { ensureNotProduction, makeInserter, resolveGrade2Topic, wipeLayersForLessons } from './_capsule-helpers'

/**
 * Seeds all 11 capsule layers for every lesson of «Сложение и вычитание в пределах 100».
 *
 *   1. Выражения со скобками и без них
 *   2. Сложение и вычитание без перехода через разряд
 *   3. Сложение однозначных с переходом через десяток
 *   4. Сложение и вычитание двузначных с переходом
 *
 * S6: тема №02, theme-pack = 'cafe'. Использует все новые возможности
 * (frames, emojiChoices, hearts, place-value-blocks, comic-chunks,
 * voice-terms, board-visual, tap-pair, boss+combo, spot/fix-it, voiceFirst,
 * trophyThresholds, share, questionPool).
 */
export default defineEventHandler(async (event) => {
  ensureNotProduction()
  const supabase = serverSupabaseServiceRole(event)

  const { lessonIds } = await resolveGrade2Topic(supabase, 'Сложение и вычитание в пределах 100')

  const L1 = lessonIds['Выражения со скобками и без них']
  const L2 = lessonIds['Сложение и вычитание без перехода через разряд']
  const L3 = lessonIds['Сложение однозначных с переходом через десяток']
  const L4 = lessonIds['Сложение и вычитание двузначных с переходом']
  if (!L1 || !L2 || !L3 || !L4) throw createError({ statusCode: 500, message: 'Some lessons missing for «Сложение и вычитание в пределах 100»' })

  const allIds = [L1, L2, L3, L4]
  await wipeLayersForLessons(supabase, allIds)

  const counter: Record<string, number> = {}
  const insert = makeInserter(supabase, counter)

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 1 — Выражения со скобками и без них
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L1, layerType: 'HOOK', orderIndex: 1,
    title: 'Скобки решают всё',
    subtitle: 'От порядка действий зависит ответ',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '20 − 5 + 3 — сколько получится?',
      body: 'Ответ зависит от того, в каком порядке считать. Скобки — это «приказ»: сначала это.',
      mascotEntry: 'think',
      bgPattern: 'dots',
      successSfx: 'sparkle',
      frames: [
        { emoji: '➕', accent: 'amber', caption: 'Без скобок — слева направо' },
        { emoji: '🎁', accent: 'rose', caption: 'Скобки — это коробка-подарок' },
        { emoji: '👑', accent: 'sky', caption: 'Что в коробке — то и считаем первым' }
      ],
      prompt: '20 − 5 + 3 = ?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '18 — слева направо', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '12 — сначала +3' },
        { id: 'c', emoji: '🤝', label: 'Оба правильные' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что ты помнишь о порядке?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '5 + 3 − 2 = ?', options: ['6', '4', '0', '10'], correctIndex: 0, conceptTag: 'без-скобок', explanation: 'Слева направо: 5+3=8, потом 8−2=6.' },
        { id: 'd2', prompt: '(7 − 4) + 5 = ?', options: ['8', '16', '12', '−2'], correctIndex: 0, conceptTag: 'скобки', explanation: 'Сначала скобки: 7−4=3, потом 3+5=8.' },
        { id: 'd3', prompt: 'Что делается ПЕРВЫМ: 10 − (3 + 4)?', options: ['10 − 3', '3 + 4', '10 + 3', '4 − 10'], correctIndex: 1, conceptTag: 'приоритет', explanation: 'Скобки выполняются раньше других действий.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L1, layerType: 'INTUITION', orderIndex: 3,
    title: 'Без скобок — слева направо',
    subtitle: 'Двигайся по числовой прямой пошагово',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 30, step: 1, highlights: [10, 20] },
      probes: [
        { id: 'p1', prompt: '10 + 5 − 3. Где остановишься?', options: ['12', '8', '18', '15'], correctIndex: 0, explanation: '10 + 5 = 15, 15 − 3 = 12.' },
        { id: 'p2', prompt: '20 − 7 + 4 = ?', options: ['9', '17', '23', '11'], correctIndex: 1, explanation: '20 − 7 = 13, 13 + 4 = 17.' }
      ],
      copy: { headline: 'Без скобок — действия по очереди', body: 'Сложение и вычитание равны по «силе». Кто первый записан — тот и выполняется первым.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L1, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Правила порядка действий',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'comic',
          content: 'Два правила за 3 кадра',
          panels: [
            { emoji: '➡️', accent: 'amber', caption: 'Без скобок — слева направо' },
            { emoji: '🎁', accent: 'rose', caption: 'Скобки — сначала внутри' },
            { emoji: '✅', accent: 'emerald', caption: 'Только потом — остальное' }
          ]
        },
        {
          id: 'c2', kind: 'callout',
          content: '**Правило 1:** Если в выражении только сложение и вычитание — считаем слева направо.',
          emphasis: true, speakable: true
        },
        { id: 'c3', kind: 'formula', content: '20 - 5 + 3 = 15 + 3 = 18' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А что если есть скобки?',
          revealedKind: 'formula',
          revealedContent: '20 - (5 + 3) = 20 - 8 = 12',
          revealedHint: 'Скобки выполняются ПЕРВЫМИ — это приказ «сначала это».'
        },
        { id: 'c5', kind: 'text', content: 'Видишь разницу? Те же числа — но скобки меняют ответ. **18 vs 12** — почти в 1,5 раза.' }
      ],
      checks: [
        { id: 'ch1', prompt: '15 + 4 − 6 = ?', options: ['13', '5', '17', '25'], correctIndex: 0, explanation: '15+4=19, 19−6=13.' },
        { id: 'ch2', prompt: '(8 + 2) − 3 = ?', options: ['7', '13', '3', '6'], correctIndex: 0, explanation: 'Сначала 8+2=10, потом 10−3=7.' },
        { id: 'ch3', prompt: '30 − (10 + 5) = ?', options: ['25', '15', '45', '5'], correctIndex: 1, explanation: '10+5=15, 30−15=15.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L1, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Анатомия выражения',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Разбираем (12 + 8) − 5',
      anatomy: [
        { id: 'a1', label: '(...)', role: 'скобки — первыми', accent: 'rose' },
        { id: 'a2', label: '12+8', role: 'считаем: 20', value: '20', accent: 'sky' },
        { id: 'a3', label: '20−5', role: 'итог: 15', value: '15', accent: 'green' }
      ],
      terms: [
        { term: 'Скобки', definition: 'Указывают, какое действие выполнять первым.', example: '(2 + 3) − 1 — сначала 2+3', speakText: 'Скобки — приказ сначала' },
        { term: 'Порядок действий', definition: 'Правило, в каком порядке считать.', example: 'Без скобок — слева направо', speakText: 'Порядок действий — правило очереди' }
      ],
      buildTask: {
        prompt: 'Реши: (10 − 4) + 7 = ?',
        template: '___',
        expected: ['13'],
        distractors: ['11', '21', '6', '7', '17']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L1, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Считаем по шагам',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Любое выражение со скобками решается за 2-3 шага.',
      examples: [
        {
          id: 'ex1', problem: '(15 − 6) + 8 = ?', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Скобки — первыми', explanation: 'Внутри: 15 − 6 = 9.', visual: { kind: 'board', boardLines: ['(15 − 6) + 8', '\\downarrow', '9 + 8'] }, action: { kind: 'numeric', prompt: '15 − 6 = ?', expected: 9 } },
            { index: 2, title: 'Подставляем', explanation: 'Получаем: 9 + 8 = 17.', visual: { kind: 'board', boardLines: ['9 + 8 = 17'] }, action: { kind: 'numeric', prompt: '9 + 8 = ?', expected: 17 } }
          ]
        },
        {
          id: 'ex2', problem: '30 − (12 + 4) = ?', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Скобки', explanation: '12 + 4 = 16.', action: { kind: 'numeric', prompt: '12 + 4 = ?', expected: 16 } },
            { index: 2, title: 'Подставляем', explanation: '30 − 16 = 14.', visual: { kind: 'board', boardLines: ['30 − 16 = 14'] }, action: { kind: 'numeric', prompt: '30 − 16 = ?', expected: 14 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем порядок',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини выражение с ответом',
          left: [
            { id: 'L1', label: '12 + 5 − 3' },
            { id: 'L2', label: '(8 + 6) − 4' },
            { id: 'L3', label: '20 − (5 + 7)' },
            { id: 'L4', label: '15 − 8 + 2' }
          ],
          right: [
            { id: 'R1', label: '14', pairId: 'L1' },
            { id: 'R2', label: '10', pairId: 'L2' },
            { id: 'R3', label: '8', pairId: 'L3' },
            { id: 'R4', label: '9', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '(13 − 5) + 6 = ?', correctAnswer: 14 },
        { kind: 'numeric', id: 't3', prompt: '40 − (10 + 20) = ?', correctAnswer: 10 },
        { kind: 'numeric', id: 't4', prompt: '7 + 8 − 5 = ?', correctAnswer: 10 },
        { kind: 'numeric', id: 't5', prompt: '(25 − 10) + 5 = ?', correctAnswer: 20 },
        { kind: 'choice', id: 't6', prompt: 'Что считается ПЕРВЫМ: 50 − (20 + 5)?', options: ['50 − 20', '20 + 5', '50 + 5', 'неважно'], correctIndex: 1 }
      ],
      socraticHints: { t3: ['Сначала то, что в скобках', '10 + 20 = ?'] }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L1, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Очередь в кафе',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кафе «Дастан»',
        roleplay: 'Ты помощник кассира. Клиенты приходят с заказами, иногда передумывают. Считай быстро.',
        characterName: 'Бариста Жанар',
        mascotLine: 'Скобки — это слово «сначала»!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Семья', request: 'Заказали булочек на 25 тг, добавили на 8, отменили 5. Сколько в чеке?', correct: 28, wrongFeedback: '25 + 8 − 5 = 28.', revenueReward: 28, reputationReward: 1 },
        { id: 'o2', customer: 'Школьник', request: 'Сок и пирожок (12 + 7), оплатил 30 тг. Сдача?', correct: 11, wrongFeedback: '30 − (12 + 7) = 11.', revenueReward: 19, reputationReward: 1 },
        { id: 'o3', customer: 'Учитель', request: 'Заказ: (15 + 10) − 8. Итого?', correct: 17, wrongFeedback: '25 − 8 = 17.', revenueReward: 17, reputationReward: 1 },
        { id: 'o4', customer: 'Турист', request: 'Дал 50 тг, заказ (20 + 15). Сдача?', correct: 15, wrongFeedback: '50 − 35 = 15.', revenueReward: 35, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Большой банкет',
        request: 'Финал: (40 + 30) − 15. Итого тенге?',
        correct: 55,
        wrongFeedback: 'Скобки сначала: 70, потом 70 − 15 = 55.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L1, layerType: 'TRAPS', orderIndex: 9,
    title: 'Типичные ошибки',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток порядка', emoji: '🎯' },
      intro: 'Эти ловушки забирают баллы у невнимательных.',
      traps: [
        { id: 'tr1', wrongStatement: '«20 − 5 + 3 = 12, потому что сначала +3»', whyWrong: 'Без скобок действия идут **слева направо**. Сначала 20−5, потом +3.', correctStatement: '20 − 5 + 3 = 18', rememberNote: 'Без скобок — по очереди слева.' },
        { id: 'tr2', wrongStatement: '«Скобки можно игнорировать»', whyWrong: 'Скобки меняют ответ: 10 − 5 + 2 = 7, но 10 − (5 + 2) = 3.', correctStatement: 'Скобки выполняются первыми', rememberNote: 'Скобки — приказ «сначала».' },
        { id: 'tr3', wrongStatement: '«(8 − 3) + 4 = 9, через 8 − 3 = 4»', whyWrong: 'Считай аккуратно: 8 − 3 = 5, не 4.', correctStatement: '(8 − 3) + 4 = 9, через 5 + 4', rememberNote: 'Внимательность к арифметике.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L1, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни на примере',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику, который пропустил урок',
      voicePrompt: 'Расскажи как считать выражение со скобками',
      coverPrompts: ['Как считать без скобок?', 'Что делать со скобками?', 'Приведи пример где скобки меняют ответ'],
      referenceAnswer: 'Если только сложение и вычитание и нет скобок — считаем по порядку слева направо. Если есть скобки — сначала внутри. Например: 10 − 5 + 2 = 7, а 10 − (5 + 2) = 3.',
      requiredConcepts: ['скобки', 'порядок', 'слева направо'],
      conceptKeywords: {
        'скобки': ['скобк', 'скобка'],
        'порядок': ['порядок', 'очеред', 'сначал'],
        'слева направо': ['слева', 'налево', 'по очеред']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['скобк', 'поряд'] }
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
      shareCapsuleName: 'Скобки и порядок · Урок 1',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '15 − 4 + 6 = ?', correctAnswer: 17, conceptTag: 'без-скобок', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '(20 − 8) + 5 = ?', correctAnswer: 17, conceptTag: 'скобки', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: '50 − (15 + 25) = ?', correctAnswer: 10, conceptTag: 'скобки', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'choice', prompt: 'Что выполняется ПЕРВЫМ: (3 + 4) − 2?', options: ['3 + 4', '4 − 2', '3 − 2', 'любое'], correctIndex: 0, conceptTag: 'приоритет', cognitiveLevel: 'understand' },
        { id: 'm5', kind: 'numeric', prompt: 'Купил 8 + 6, отдал 20. Сдача?', correctAnswer: 6, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '18 + 5 − 7 = ?', correctAnswer: 16, conceptTag: 'без-скобок', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '(30 − 12) + 4 = ?', correctAnswer: 22, conceptTag: 'скобки', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '60 − (10 + 35) = ?', correctAnswer: 15, conceptTag: 'скобки', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'choice', prompt: 'Что ПЕРВЫМ: 25 − (5 + 8)?', options: ['25 − 5', '5 + 8', '25 + 8', 'любое'], correctIndex: 1, conceptTag: 'приоритет', cognitiveLevel: 'understand' },
        { id: 'p5', kind: 'numeric', prompt: 'Заказ (12 + 5) − 8. Сколько?', correctAnswer: 9, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 2 — Сложение и вычитание без перехода через разряд
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L2, layerType: 'HOOK', orderIndex: 1,
    title: 'Считаем по разрядам',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '40 + 17 — за 3 секунды',
      body: 'Сложи десятки с десятками, единицы с единицами — ответ готов.',
      mascotEntry: 'teach',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '📚', accent: 'sky', caption: '4 десятка + 1 десяток = 5 десятков' },
        { emoji: '✏️', accent: 'amber', caption: '0 единиц + 7 единиц = 7 единиц' },
        { emoji: '⚡', accent: 'emerald', caption: 'Итого: 50 + 7 = 57!' }
      ],
      prompt: 'Сколько будет 40 + 17?',
      emojiChoices: [
        { id: 'a', emoji: '🥉', label: '47' },
        { id: 'b', emoji: '🥇', label: '57', isPrimary: true },
        { id: 'c', emoji: '❓', label: '67' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Что ты уже умеешь?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '30 + 4 = ?', options: ['7', '34', '70', '304'], correctIndex: 1, conceptTag: 'круглые+единицы', explanation: '3 десятка и 4 единицы = 34.' },
        { id: 'd2', prompt: '50 + 20 = ?', options: ['25', '70', '52', '7'], correctIndex: 1, conceptTag: 'круглые+круглые', explanation: '5 десятков + 2 десятка = 7 десятков = 70.' },
        { id: 'd3', prompt: '57 − 23 = ?', options: ['34', '40', '74', '23'], correctIndex: 0, conceptTag: 'двузнач-двузнач', explanation: '50−20=30 и 7−3=4, итого 34.' },
        { id: 'd4', prompt: '35 + 12 = ?', options: ['38', '47', '23', '57'], correctIndex: 1, conceptTag: 'двузнач+двузнач', explanation: '30+10=40, 5+2=7, итого 47.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L2, layerType: 'INTUITION', orderIndex: 3,
    title: 'Собери ответ из блоков',
    subtitle: 'Десятки + десятки, единицы + единицы',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      // Используем place-value-blocks (target=57 — именно то что в hook)
      widget: { type: 'place-value-blocks', maxHundreds: 0, maxTens: 9, maxOnes: 9, target: 57 },
      probes: [
        { id: 'p1', prompt: '4 палочки + 2 точки + 1 палочка + 5 точек = ?', options: ['57', '12', '24', '15'], correctIndex: 0, explanation: '4+1=5 десятков (50), 2+5=7 единиц. Итого 57.' },
        { id: 'p2', prompt: 'У тебя 6 палочек и 3 точки. Сколько это?', options: ['9', '63', '36', '93'], correctIndex: 1, explanation: '6 десятков + 3 единицы = 63.' }
      ],
      copy: { headline: 'Складываем палочки с палочками, точки с точками', body: 'Это и есть «без перехода» — когда единиц не больше 9.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L2, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Алгоритм без перехода',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'callout',
          content: 'Разряды складываются **отдельно**. Десятки с десятками, единицы с единицами.',
          emphasis: true, speakable: true
        },
        {
          id: 'c2', kind: 'comic',
          content: '35 + 12 за 3 кадра',
          panels: [
            { emoji: '🔟', accent: 'sky', caption: '30 + 10 = 40' },
            { emoji: '5️⃣', accent: 'amber', caption: '5 + 2 = 7' },
            { emoji: '🎯', accent: 'emerald', caption: '40 + 7 = 47' }
          ]
        },
        { id: 'c3', kind: 'formula', content: '40 + 17 = 40 + 10 + 7 = 50 + 7 = 57' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А как вычитать?',
          revealedKind: 'formula',
          revealedContent: '57 - 23 = (50 - 20) + (7 - 3) = 30 + 4 = 34',
          revealedHint: 'Десятки − десятки, единицы − единицы.'
        },
        { id: 'c5', kind: 'text', content: '«Без перехода» = единиц не больше 9 при сложении, и больше при вычитании.' }
      ],
      checks: [
        { id: 'ch1', prompt: '40 + 7 = ?', options: ['11', '47', '74', '407'], correctIndex: 1, explanation: '40 + 7 = 47.' },
        { id: 'ch2', prompt: '60 + 30 = ?', options: ['9', '90', '63', '36'], correctIndex: 1, explanation: '6 десятков + 3 десятка = 90.' },
        { id: 'ch3', prompt: '78 − 35 = ?', options: ['43', '113', '53', '13'], correctIndex: 0, explanation: '70−30=40, 8−5=3, итого 43.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L2, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись по разрядам',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Складываем 35 + 12',
      anatomy: [
        { id: 'a1', label: '30+10', role: 'десятки отдельно', value: '40', accent: 'sky' },
        { id: 'a2', label: '5+2', role: 'единицы отдельно', value: '7', accent: 'amber' },
        { id: 'a3', label: '40+7', role: 'соединяем', value: '47', accent: 'green' }
      ],
      terms: [
        {
          term: 'Без перехода',
          definition: 'При сложении сумма единиц меньше 10, при вычитании единиц достаточно.',
          example: '34 + 25, 78 − 13',
          speakText: 'Без перехода — когда единицы не превышают десяток'
        }
      ],
      buildTask: {
        prompt: 'Сложи: 26 + 41 = ___',
        template: '___',
        expected: ['67'],
        distractors: ['25', '76', '85', '7', '60']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L2, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем по разрядам',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Пошаговое решение через раскладывание на разряды.',
      examples: [
        {
          id: 'ex1', problem: '34 + 25', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Раскладываем', explanation: '34 = 30 + 4, 25 = 20 + 5.', visual: { kind: 'board', boardLines: ['34 = 30 + 4', '25 = 20 + 5'] }, action: { kind: 'choice', prompt: '34 = ?', options: ['30 + 4', '3 + 4', '34 + 0'], correctIndex: 0 } },
            { index: 2, title: 'Десятки', explanation: '30 + 20 = 50.', visual: { kind: 'board', boardLines: ['30 + 20 = 50'] }, action: { kind: 'numeric', prompt: '30 + 20 = ?', expected: 50 } },
            { index: 3, title: 'Единицы', explanation: '4 + 5 = 9.', action: { kind: 'numeric', prompt: '4 + 5 = ?', expected: 9 } },
            { index: 4, title: 'Соединяем', explanation: '50 + 9 = 59.', visual: { kind: 'board', boardLines: ['50 + 9 = 59'] }, action: { kind: 'numeric', prompt: 'Итого:', expected: 59 } }
          ]
        },
        {
          id: 'ex2', problem: '67 − 24', prefilledSteps: 2,
          steps: [
            { index: 1, title: 'Раскладываем', explanation: '67 = 60 + 7, 24 = 20 + 4.', action: { kind: 'choice', prompt: '67 = ?', options: ['60 + 7', '6 + 7', '67 + 0'], correctIndex: 0 } },
            { index: 2, title: 'Десятки', explanation: '60 − 20 = 40.', action: { kind: 'numeric', prompt: '60 − 20 = ?', expected: 40 } },
            { index: 3, title: 'Единицы', explanation: '7 − 4 = 3.', action: { kind: 'numeric', prompt: '7 − 4 = ?', expected: 3 } },
            { index: 4, title: 'Итог', explanation: '40 + 3 = 43.', action: { kind: 'numeric', prompt: 'Ответ:', expected: 43 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем устный счёт',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини пример с ответом',
          left: [
            { id: 'L1', label: '40 + 17' },
            { id: 'L2', label: '57 − 40' },
            { id: 'L3', label: '35 + 12' },
            { id: 'L4', label: '78 − 35' }
          ],
          right: [
            { id: 'R1', label: '57', pairId: 'L1' },
            { id: 'R2', label: '17', pairId: 'L2' },
            { id: 'R3', label: '47', pairId: 'L3' },
            { id: 'R4', label: '43', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '46 + 32 = ?', correctAnswer: 78 },
        { kind: 'numeric', id: 't3', prompt: '85 − 23 = ?', correctAnswer: 62 },
        { kind: 'numeric', id: 't4', prompt: '60 + 25 = ?', correctAnswer: 85 },
        { kind: 'numeric', id: 't5', prompt: '99 − 44 = ?', correctAnswer: 55 },
        { kind: 'numeric', id: 't6', prompt: '52 + 13 = ?', correctAnswer: 65 },
        { kind: 'numeric', id: 't7', prompt: '94 − 31 = ?', correctAnswer: 63 }
      ],
      socraticHints: { t2: ['40 + 30 = ?', 'Потом 6 + 2'] }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L2, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Книжный магазин',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Магазин «Букинист»',
        roleplay: 'Ты помощник продавца. Считай стоимость книг и сдачу.',
        characterName: 'Продавец Аскар',
        mascotLine: 'Десятки с десятками, единицы с единицами!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Школьник', request: 'Книжка 35 тг + дневник 12 тг. Итого?', correct: 47, wrongFeedback: '35 + 12 = 47.', revenueReward: 47, reputationReward: 1 },
        { id: 'o2', customer: 'Учитель', request: 'Чек 78 тг − скидка 23 тг. Итого?', correct: 55, wrongFeedback: '78 − 23 = 55.', revenueReward: 55, reputationReward: 1 },
        { id: 'o3', customer: 'Семья', request: 'Атлас 40 тг + словарь 17 тг. Итого?', correct: 57, wrongFeedback: '40 + 17 = 57.', revenueReward: 57, reputationReward: 1 },
        { id: 'o4', customer: 'Студент', request: 'Дал 99 тг, чек 44 тг. Сдача?', correct: 55, wrongFeedback: '99 − 44 = 55.', revenueReward: 44, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Школьная библиотека',
        request: 'Большой заказ: 65 + 24 тенге. Итого?',
        correct: 89,
        wrongFeedback: '60+20=80, 5+4=9, итого 89.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L2, layerType: 'TRAPS', orderIndex: 9,
    title: 'Чего избегать',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток разрядов', emoji: '📐' },
      intro: 'Не путай разряды.',
      traps: [
        { id: 'tr1', wrongStatement: '«40 + 17 = 18»', whyWrong: 'Сложили только цифры 4 и 1, потом приписали 7. Так нельзя — 40 это 4 **десятка**.', correctStatement: '40 + 17 = 57', rememberNote: 'Левая цифра — десятки.' },
        { id: 'tr2', wrongStatement: '«35 + 12 = 137»', whyWrong: 'Слили цифры подряд. Нужно складывать **разряды**: 30+10=40, 5+2=7, итого 47.', correctStatement: '35 + 12 = 47', rememberNote: 'По разрядам, не «приписыванием».' },
        { id: 'tr3', wrongStatement: '«78 − 35 = 53»', whyWrong: 'Сложили запутанно. 70−30=40, 8−5=3 → 43.', correctStatement: '78 − 35 = 43', rememberNote: 'Раздельный счёт.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L2, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи приём',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу, который складывает в столбик',
      voicePrompt: 'Расскажи приём счёта по разрядам',
      coverPrompts: ['Как сложить 40 + 17 устно?', 'Почему складываем разряды отдельно?', 'Когда приём НЕ работает?'],
      referenceAnswer: 'Я складываю десятки с десятками и единицы с единицами по отдельности, потом соединяю: 40 + 17 = 50 + 7 = 57. Приём работает, когда сумма единиц не больше 9.',
      requiredConcepts: ['десятки', 'единицы', 'разряды'],
      conceptKeywords: {
        десятки: ['десят', 'десятк'],
        единицы: ['единиц', 'единичк'],
        разряды: ['разряд', 'отдельно']
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
      passingScore: 80, retryAllowed: true,
      trophyThresholds: { gold: 100, silver: 80, bronze: 60 },
      shareEnabled: true,
      shareCapsuleName: 'Сложение и вычитание · Урок 2',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '40 + 17 = ?', correctAnswer: 57, conceptTag: 'десятки+двузнач', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '57 − 40 = ?', correctAnswer: 17, conceptTag: 'двузнач−десятки', cognitiveLevel: 'understand' },
        { id: 'm3', kind: 'numeric', prompt: '35 + 12 = ?', correctAnswer: 47, conceptTag: 'двузнач+двузнач', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '85 − 53 = ?', correctAnswer: 32, conceptTag: 'двузнач−двузнач', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'У Динары 25 наклеек, у брата 32. Сколько всего?', correctAnswer: 57, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '60 + 23 = ?', correctAnswer: 83, conceptTag: 'десятки+двузнач', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '78 − 50 = ?', correctAnswer: 28, conceptTag: 'двузнач−десятки', cognitiveLevel: 'understand' },
        { id: 'p3', kind: 'numeric', prompt: '46 + 31 = ?', correctAnswer: 77, conceptTag: 'двузнач+двузнач', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '99 − 64 = ?', correctAnswer: 35, conceptTag: 'двузнач−двузнач', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'У Тимура 41 машинка, у Самата 28. Сколько всего?', correctAnswer: 69, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 3 — Сложение однозначных с переходом через десяток
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L3, layerType: 'HOOK', orderIndex: 1,
    title: 'Магия числа 10',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: '8 + 5 — а как через десяток?',
      body: 'Хитрость: сначала добираемся до 10, потом докладываем остаток.',
      mascotEntry: 'teach',
      bgPattern: 'confetti',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🎯', accent: 'amber', caption: 'Цель — добежать до 10' },
        { emoji: '➕', accent: 'rose', caption: '8 + 2 = 10 (использовали 2 из 5)' },
        { emoji: '🏁', accent: 'emerald', caption: '10 + остаток 3 = 13!' }
      ],
      prompt: 'Сколько недостаёт 8 до 10?',
      emojiChoices: [
        { id: 'a', emoji: '1️⃣', label: '1' },
        { id: 'b', emoji: '2️⃣', label: '2', isPrimary: true },
        { id: 'c', emoji: '5️⃣', label: '5' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Знаешь состав числа 10?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '7 + ? = 10', options: ['2', '3', '4', '7'], correctIndex: 1, conceptTag: 'до-10', explanation: 'Дополнение 7 до 10 — это 3.' },
        { id: 'd2', prompt: '6 + 5 = ?', options: ['11', '10', '12', '1'], correctIndex: 0, conceptTag: 'переход', explanation: '6+4=10, плюс 1 = 11.' },
        { id: 'd3', prompt: '13 − 5 = ?', options: ['8', '7', '18', '12'], correctIndex: 0, conceptTag: 'обратно', explanation: '13−3=10, потом 10−2=8.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L3, layerType: 'INTUITION', orderIndex: 3,
    title: 'Дотягиваемся до 10',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 0, max: 20, step: 1, highlights: [10] },
      probes: [
        { id: 'p1', prompt: 'От 7 до 10 сколько шагов?', options: ['1', '2', '3', '7'], correctIndex: 2, explanation: '7+3=10. Три шага.' },
        { id: 'p2', prompt: 'А от 9 до 10?', options: ['1', '2', '0', '9'], correctIndex: 0, explanation: 'Один шаг.' },
        { id: 'p3', prompt: 'От 6 до 10?', options: ['4', '6', '10', '16'], correctIndex: 0, explanation: '10 − 6 = 4.' }
      ],
      copy: { headline: 'Сначала до 10, потом докладываем остаток', body: 'Это самый удобный способ для перехода через десяток.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L3, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Приём «дополнение до 10»',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'callout',
          content: 'Идея: разбиваем второе слагаемое на две части — сначала до 10, потом остаток.',
          emphasis: true, speakable: true
        },
        {
          id: 'c2', kind: 'comic',
          content: '8 + 5 за 3 кадра',
          panels: [
            { emoji: '🚪', accent: 'amber', caption: '8 + 2 = 10 (вошли в 10)' },
            { emoji: '➕', accent: 'sky', caption: '5 − 2 = 3 (остаток)' },
            { emoji: '🎉', accent: 'emerald', caption: '10 + 3 = 13' }
          ]
        },
        { id: 'c3', kind: 'formula', content: '8 + 5 = 8 + 2 + 3 = 10 + 3 = 13' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А как вычитать через десяток?',
          revealedKind: 'formula',
          revealedContent: '13 - 5 = 13 - 3 - 2 = 10 - 2 = 8',
          revealedHint: 'Сначала вычитаем до 10, потом ещё.'
        },
        { id: 'c5', kind: 'text', content: 'Запомни состав 10: **1+9, 2+8, 3+7, 4+6, 5+5**. Это твой ключ.' }
      ],
      checks: [
        { id: 'ch1', prompt: '9 + 4 = ?', options: ['12', '13', '14', '5'], correctIndex: 1, explanation: '9+1=10, +3=13.' },
        { id: 'ch2', prompt: '7 + 8 = ?', options: ['15', '14', '16', '1'], correctIndex: 0, explanation: '7+3=10, +5=15.' },
        { id: 'ch3', prompt: '12 − 5 = ?', options: ['7', '8', '17', '5'], correctIndex: 0, explanation: '12−2=10, −3=7.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L3, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Состав числа 10',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: 'Дополнения до 10',
      anatomy: [
        { id: 'a1', label: '1+9', role: 'пара', accent: 'sky' },
        { id: 'a2', label: '2+8', role: 'пара', accent: 'cyan' },
        { id: 'a3', label: '3+7', role: 'пара', accent: 'green' },
        { id: 'a4', label: '4+6', role: 'пара', accent: 'amber' },
        { id: 'a5', label: '5+5', role: 'самопара', accent: 'rose' }
      ],
      terms: [
        {
          term: 'Дополнение до 10',
          definition: 'Число, которое нужно добавить чтобы получить 10.',
          example: 'Дополнение к 7 — это 3',
          speakText: 'Дополнение до десяти — сколько не хватает'
        }
      ],
      buildTask: {
        prompt: '6 + ___ = 10',
        template: '___',
        expected: ['4'],
        distractors: ['6', '5', '3', '10', '16']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L3, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Шаг за шагом через 10',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Алгоритм: добраться до 10, потом доложить остаток.',
      examples: [
        {
          id: 'ex1', problem: '8 + 7', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Сколько до 10?', explanation: '8 + 2 = 10.', visual: { kind: 'board', boardLines: ['8 + 2 = 10'] }, action: { kind: 'numeric', prompt: '8 + ? = 10', expected: 2 } },
            { index: 2, title: 'Сколько осталось?', explanation: 'Из 7 взяли 2 — осталось 5.', visual: { kind: 'board', boardLines: ['7 − 2 = 5'] }, action: { kind: 'numeric', prompt: '7 − 2 = ?', expected: 5 } },
            { index: 3, title: 'Соединяем', explanation: '10 + 5 = 15.', action: { kind: 'numeric', prompt: 'Итого:', expected: 15 } }
          ]
        },
        {
          id: 'ex2', problem: '14 − 6', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'До 10', explanation: '14 − 4 = 10.', action: { kind: 'numeric', prompt: '14 − 4 = ?', expected: 10 } },
            { index: 2, title: 'Сколько ещё', explanation: 'Из 6 взяли 4 — осталось 2.', action: { kind: 'numeric', prompt: '10 − 2 = ?', expected: 8 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем переход',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        // S4: tap-pair — состав числа 10
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини пары до 10',
          left: [
            { id: 'L1', label: '7' },
            { id: 'L2', label: '8' },
            { id: 'L3', label: '4' },
            { id: 'L4', label: '5' }
          ],
          right: [
            { id: 'R1', label: '+ 3', pairId: 'L1' },
            { id: 'R2', label: '+ 2', pairId: 'L2' },
            { id: 'R3', label: '+ 6', pairId: 'L3' },
            { id: 'R4', label: '+ 5', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '8 + 5 = ?', correctAnswer: 13 },
        { kind: 'numeric', id: 't3', prompt: '7 + 6 = ?', correctAnswer: 13 },
        { kind: 'numeric', id: 't4', prompt: '9 + 8 = ?', correctAnswer: 17 },
        { kind: 'numeric', id: 't5', prompt: '13 − 6 = ?', correctAnswer: 7 },
        { kind: 'numeric', id: 't6', prompt: '15 − 8 = ?', correctAnswer: 7 },
        { kind: 'numeric', id: 't7', prompt: '12 − 5 = ?', correctAnswer: 7 }
      ],
      socraticHints: { t2: ['Дополни 8 до 10', 'Сколько осталось?'] }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L3, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Кафе-кондитерская',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Кондитерская «Тортик»',
        roleplay: 'Помоги пекарю считать порции — много заказов на десерты.',
        characterName: 'Пекарь Динара',
        mascotLine: 'Считай через 10 — будешь как профессионал!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'День рождения', request: 'Было 8 кексов, докупили 5. Сколько стало?', correct: 13, wrongFeedback: '8+2=10, +3=13.', revenueReward: 13, reputationReward: 1 },
        { id: 'o2', customer: 'Свадьба', request: '7 + 6 эклеров. Итого?', correct: 13, wrongFeedback: '7+3=10, +3=13.', revenueReward: 13, reputationReward: 1 },
        { id: 'o3', customer: 'Класс', request: 'Было 14 пирожных, съели 6. Сколько?', correct: 8, wrongFeedback: '14−4=10, −2=8.', revenueReward: 8, reputationReward: 1 },
        { id: 'o4', customer: 'Праздник', request: '9 + 8 кексов. Итого?', correct: 17, wrongFeedback: '9+1=10, +7=17.', revenueReward: 17, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Юбилей школы',
        request: 'Финал: 9 + 9 тортов. Сколько?',
        correct: 18,
        wrongFeedback: '9+1=10, +8=18.',
        revenueReward: 100,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L3, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где промахиваются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'flip',
      bugHunterBadge: { label: 'Знаток десятка', emoji: '🔟' },
      intro: 'Эти ошибки сбивают темп.',
      traps: [
        { id: 'tr1', wrongStatement: '«8 + 5 = 12»', whyWrong: 'Не добрался до 10. 8+2=10, +3=13.', correctStatement: '8 + 5 = 13', rememberNote: 'Считай через 10.' },
        { id: 'tr2', wrongStatement: '«13 − 5 = 9»', whyWrong: '13−3=10, потом 10−2=8.', correctStatement: '13 − 5 = 8', rememberNote: 'Через 10 идёт «вниз» так же.' },
        { id: 'tr3', wrongStatement: '«6 + 7 = 11»', whyWrong: '6+4=10, +3=13. Не 11.', correctStatement: '6 + 7 = 13', rememberNote: 'Доберись до 10 точно.' }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L3, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Объясни приём другу',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'однокласснику, который медленно считает',
      voicePrompt: 'Расскажи как считать через десяток',
      coverPrompts: ['В чём идея перехода через 10?', 'Покажи на примере 7 + 5', 'Как для вычитания?'],
      referenceAnswer: 'Идея — сначала добраться до круглого 10, потом доложить или отнять остаток. 7 + 5: 7 + 3 = 10, ещё 2 — итого 12. Для вычитания 13 − 5 = 13 − 3 − 2 = 10 − 2 = 8.',
      requiredConcepts: ['десяток', 'дополнение', 'переход'],
      conceptKeywords: {
        десяток: ['десят', 'десятк', 'круглое'],
        дополнение: ['доберусь', 'доходим', 'до 10'],
        переход: ['переход', 'через', 'остаток']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['десят', 'допол'] }
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
      shareCapsuleName: 'Через десяток · Урок 3',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '8 + 7 = ?', correctAnswer: 15, conceptTag: 'переход+', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '6 + 9 = ?', correctAnswer: 15, conceptTag: 'переход+', cognitiveLevel: 'recall' },
        { id: 'm3', kind: 'numeric', prompt: '14 − 8 = ?', correctAnswer: 6, conceptTag: 'переход−', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '11 − 3 = ?', correctAnswer: 8, conceptTag: 'переход−', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'У Айгуль 9 яблок, мама дала 6. Сколько?', correctAnswer: 15, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '7 + 8 = ?', correctAnswer: 15, conceptTag: 'переход+', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '5 + 9 = ?', correctAnswer: 14, conceptTag: 'переход+', cognitiveLevel: 'recall' },
        { id: 'p3', kind: 'numeric', prompt: '16 − 8 = ?', correctAnswer: 8, conceptTag: 'переход−', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '13 − 7 = ?', correctAnswer: 6, conceptTag: 'переход−', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'У Тимура было 8 машинок, подарили 7. Сколько?', correctAnswer: 15, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  // ═════════════════════════════════════════════════════════════════════
  // LESSON 4 — Сложение и вычитание двузначных с переходом
  // ═════════════════════════════════════════════════════════════════════
  await insert({
    lessonId: L4, layerType: 'HOOK', orderIndex: 1,
    title: '45 + 9 — финт через десяток',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, xpReward: 10,
    content: {
      kind: 'HOOK', mediaKind: 'animation',
      headline: 'Тот же приём — но для двузначных',
      body: 'Доходим до круглого десятка, потом докладываем остаток.',
      mascotEntry: 'cheer',
      bgPattern: 'stars',
      successSfx: 'sparkle',
      frames: [
        { emoji: '🎯', accent: 'amber', caption: 'Цель — ближайший круглый десяток' },
        { emoji: '🚪', accent: 'sky', caption: '45 + 5 = 50 (вошли в круглое)' },
        { emoji: '🏁', accent: 'emerald', caption: '50 + 4 = 54!' }
      ],
      prompt: 'Сколько будет 45 + 9?',
      emojiChoices: [
        { id: 'a', emoji: '🥇', label: '54', isPrimary: true },
        { id: 'b', emoji: '🤔', label: '53' },
        { id: 'c', emoji: '🤷', label: '49' }
      ]
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'DIAGNOSTIC', orderIndex: 2,
    title: 'Готов к двузначным с переходом?',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'DIAGNOSTIC',
      mode: 'mcq',
      lives: 3,
      questions: [
        { id: 'd1', prompt: '45 + 5 = ?', options: ['50', '40', '95', '450'], correctIndex: 0, conceptTag: 'до-круглого', explanation: '5 единиц дополняют 45 до круглого 50.' },
        { id: 'd2', prompt: '45 + 9 = ?', options: ['54', '36', '49', '40'], correctIndex: 0, conceptTag: 'переход+', explanation: '45+5=50, +4=54.' },
        { id: 'd3', prompt: '40 − 14 = ?', options: ['26', '14', '54', '34'], correctIndex: 0, conceptTag: 'переход−', explanation: '40−10=30, −4=26.' }
      ]
    },
    completionCriteria: { minAccuracy: 50 }
  })

  await insert({
    lessonId: L4, layerType: 'INTUITION', orderIndex: 3,
    title: 'Хороводом по числовой',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'INTUITION',
      widget: { type: 'number-line', min: 30, max: 60, step: 1, highlights: [40, 50] },
      probes: [
        { id: 'p1', prompt: 'От 47 до 50 сколько шагов?', options: ['3', '7', '4', '0'], correctIndex: 0, explanation: '50 − 47 = 3.' },
        { id: 'p2', prompt: '47 + 8 — где остановишься?', options: ['54', '55', '53', '49'], correctIndex: 1, explanation: '47+3=50, +5=55.' },
        { id: 'p3', prompt: 'От 38 до 40?', options: ['1', '2', '3', '8'], correctIndex: 1, explanation: '40 − 38 = 2.' }
      ],
      copy: { headline: 'Доходим до круглого десятка, потом докладываем', body: 'Этот же приём работает для любых двузначных.' }
    },
    completionCriteria: { minInteractions: 2 }
  })

  await insert({
    lessonId: L4, layerType: 'EXPLANATION', orderIndex: 4,
    title: 'Через круглый десяток',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, xpReward: 25,
    content: {
      kind: 'EXPLANATION',
      chunks: [
        {
          id: 'c1', kind: 'callout',
          content: 'Идея та же — но шагаем большими ступенями. До круглого десятка — потом остаток.',
          emphasis: true, speakable: true
        },
        {
          id: 'c2', kind: 'comic',
          content: '45 + 9 за 3 кадра',
          panels: [
            { emoji: '🚪', accent: 'sky', caption: '45 + 5 = 50' },
            { emoji: '➕', accent: 'amber', caption: 'Из 9 осталось 4' },
            { emoji: '🎯', accent: 'emerald', caption: '50 + 4 = 54' }
          ]
        },
        { id: 'c3', kind: 'formula', content: '45 + 9 = 45 + 5 + 4 = 50 + 4 = 54' },
        {
          id: 'c4', kind: 'tap-reveal',
          content: 'А что с вычитанием? 40 − 14 = ?',
          revealedKind: 'formula',
          revealedContent: '40 - 14 = 40 - 10 - 4 = 30 - 4 = 26',
          revealedHint: 'Сначала десятки, потом единицы.'
        },
        { id: 'c5', kind: 'text', content: 'Чем больше тренируешься — тем быстрее видишь «дорогу» к круглому числу.' }
      ],
      checks: [
        { id: 'ch1', prompt: '38 + 7 = ?', options: ['45', '35', '11', '55'], correctIndex: 0, explanation: '38+2=40, +5=45.' },
        { id: 'ch2', prompt: '52 − 8 = ?', options: ['44', '60', '46', '54'], correctIndex: 0, explanation: '52−2=50, −6=44.' },
        { id: 'ch3', prompt: '40 − 14 = ?', options: ['26', '54', '36', '14'], correctIndex: 0, explanation: '40−10=30, −4=26.' }
      ]
    },
    completionCriteria: { minAccuracy: 67 }
  })

  await insert({
    lessonId: L4, layerType: 'FORMALIZATION', orderIndex: 5,
    title: 'Запись приёма',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'FORMALIZATION',
      voiceTerms: true,
      diagramTitle: '45 + 9 = ?',
      anatomy: [
        { id: 'a1', label: '45+5', role: 'до круглого 50', value: '50', accent: 'sky' },
        { id: 'a2', label: '+4', role: 'остаток', value: '4', accent: 'amber' },
        { id: 'a3', label: '54', role: 'итог', accent: 'green' }
      ],
      terms: [
        {
          term: 'Переход через разряд',
          definition: 'Сложение/вычитание, при котором единицы переваливают через 10.',
          example: '45 + 9 — есть переход',
          speakText: 'Переход через разряд — когда единицы выходят за десяток'
        }
      ],
      buildTask: {
        prompt: '38 + 5 = ___',
        template: '___',
        expected: ['43'],
        distractors: ['33', '13', '83', '53', '40']
      }
    },
    completionCriteria: { minInteractions: 1 }
  })

  await insert({
    lessonId: L4, layerType: 'WALKTHROUGH', orderIndex: 6,
    title: 'Решаем шаг за шагом',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, xpReward: 20,
    content: {
      kind: 'WALKTHROUGH',
      intro: 'Двузначное ± однозначное с переходом — за 2 шага.',
      examples: [
        {
          id: 'ex1', problem: '47 + 8', prefilledSteps: 0,
          steps: [
            { index: 1, title: 'Достигаем 50', explanation: '47 + 3 = 50.', visual: { kind: 'board', boardLines: ['47 + 3 = 50'] }, action: { kind: 'numeric', prompt: '47 + ? = 50', expected: 3 } },
            { index: 2, title: 'Докладываем', explanation: 'Из 8 взяли 3 — осталось 5.', visual: { kind: 'board', boardLines: ['50 + 5 = 55'] }, action: { kind: 'numeric', prompt: '50 + 5 = ?', expected: 55 } }
          ]
        },
        {
          id: 'ex2', problem: '40 − 14', prefilledSteps: 1,
          steps: [
            { index: 1, title: 'Сначала десяток', explanation: '40 − 10 = 30.', action: { kind: 'numeric', prompt: '40 − 10 = ?', expected: 30 } },
            { index: 2, title: 'Потом единицы', explanation: '30 − 4 = 26.', visual: { kind: 'board', boardLines: ['30 − 4 = 26'] }, action: { kind: 'numeric', prompt: '30 − 4 = ?', expected: 26 } }
          ]
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TRAINER', orderIndex: 7,
    title: 'Тренируем переход',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, xpReward: 30,
    content: {
      kind: 'TRAINER',
      targetCorrect: 6,
      problems: [
        {
          kind: 'tap-pair', id: 't1',
          prompt: 'Соедини пример с ответом',
          left: [
            { id: 'L1', label: '45 + 9' },
            { id: 'L2', label: '38 + 7' },
            { id: 'L3', label: '52 − 8' },
            { id: 'L4', label: '40 − 14' }
          ],
          right: [
            { id: 'R1', label: '54', pairId: 'L1' },
            { id: 'R2', label: '45', pairId: 'L2' },
            { id: 'R3', label: '44', pairId: 'L3' },
            { id: 'R4', label: '26', pairId: 'L4' }
          ]
        },
        { kind: 'numeric', id: 't2', prompt: '60 − 17 = ?', correctAnswer: 43 },
        { kind: 'numeric', id: 't3', prompt: '76 + 8 = ?', correctAnswer: 84 },
        { kind: 'numeric', id: 't4', prompt: '83 − 5 = ?', correctAnswer: 78 },
        { kind: 'numeric', id: 't5', prompt: '45 − 9 = ?', correctAnswer: 36 },
        { kind: 'numeric', id: 't6', prompt: '67 + 6 = ?', correctAnswer: 73 },
        { kind: 'numeric', id: 't7', prompt: '90 − 13 = ?', correctAnswer: 77 }
      ],
      socraticHints: { t2: ['60 − 10 = ?', 'А потом ещё − 7'] }
    },
    completionCriteria: { minCorrect: 5 }
  })

  await insert({
    lessonId: L4, layerType: 'SCENARIO', orderIndex: 8,
    title: 'Аптека',
    icon: 'i-lucide-coffee', accentColor: 'orange', estimatedMinutes: 6, xpReward: 30,
    content: {
      kind: 'SCENARIO',
      theme: 'cafe',
      setting: {
        title: 'Аптека «Здоровье»',
        roleplay: 'Помоги фармацевту считать остатки лекарств — много двузначных операций.',
        characterName: 'Фармацевт Гаухар',
        mascotLine: 'Считай через круглый десяток!'
      },
      initialStats: { revenue: 0, reputation: 5, customers: 0 },
      comboBonus: { streak: 3, multiplier: 2 },
      orders: [
        { id: 'o1', customer: 'Покупатель', request: 'Было 45 пачек, привезли 9. Стало?', correct: 54, wrongFeedback: '45+5=50, +4=54.', revenueReward: 50, reputationReward: 1 },
        { id: 'o2', customer: 'Заказ', request: 'Было 60, продано 17. Осталось?', correct: 43, wrongFeedback: '60−10=50, −7=43.', revenueReward: 60, reputationReward: 1 },
        { id: 'o3', customer: 'Учёт', request: 'Из 40 ампул использовали 14. Осталось?', correct: 26, wrongFeedback: '40−10=30, −4=26.', revenueReward: 40, reputationReward: 1 },
        { id: 'o4', customer: 'Поставка', request: '83 шт − 5 шт = ?', correct: 78, wrongFeedback: '83−3=80, −2=78.', revenueReward: 25, reputationReward: 1 }
      ],
      boss: {
        id: 'boss',
        customer: 'Главный заказ',
        request: 'Финал: 76 + 18. Сколько?',
        correct: 94,
        wrongFeedback: '76+4=80, +14=94.',
        revenueReward: 200,
        reputationReward: 3
      }
    },
    completionCriteria: { minCorrect: 3 }
  })

  await insert({
    lessonId: L4, layerType: 'TRAPS', orderIndex: 9,
    title: 'Где спотыкаются',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, xpReward: 15,
    content: {
      kind: 'TRAPS',
      mode: 'spot',
      bugHunterBadge: { label: 'Снайпер', emoji: '🎯' },
      intro: 'В каждом наборе одно решение неверное. Найди!',
      traps: [
        {
          id: 'tr1',
          wrongStatement: 'Перескочили через круглый',
          whyWrong: '45+5=50, +4=54.',
          correctStatement: '45 + 9 = 54',
          rememberNote: 'Останавливайся на круглом.',
          spotOptions: ['45 + 9 = 54', '38 + 7 = 45', '67 + 6 = 73', '52 + 8 = 50'],
          spotWrongIndex: 3
        },
        {
          id: 'tr2',
          wrongStatement: 'Спутали последовательность',
          whyWrong: 'Раздели на десятки и единицы: 40−10=30, −4=26.',
          correctStatement: '40 − 14 = 26',
          rememberNote: 'Десятки и единицы — отдельно.',
          spotOptions: ['40 − 14 = 36', '40 − 14 = 26', '50 − 12 = 38', '60 − 13 = 47'],
          spotWrongIndex: 0
        },
        {
          id: 'tr3',
          wrongStatement: 'Промахнулись на этапе вычитания',
          whyWrong: '60−10=50, −7=43.',
          correctStatement: '60 − 17 = 43',
          rememberNote: 'Дисциплина шагов.',
          spotOptions: ['60 − 17 = 43', '70 − 18 = 52', '80 − 25 = 55', '90 − 14 = 86'],
          spotWrongIndex: 3
        }
      ]
    },
    completionCriteria: {}
  })

  await insert({
    lessonId: L4, layerType: 'TEACH_BACK', orderIndex: 10,
    title: 'Расскажи метод',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, xpReward: 25,
    content: {
      kind: 'TEACH_BACK',
      voiceFirst: true,
      realtimeConcepts: true,
      audiencePersona: 'другу, который зубрит таблицу',
      voicePrompt: 'Расскажи как считать через круглый десяток',
      coverPrompts: ['Как считать 45 + 9 устно?', 'Что такое «круглый десяток»?', 'Покажи 40 − 14'],
      referenceAnswer: 'Я добираюсь до ближайшего круглого десятка, потом докладываю или отнимаю остаток. 45 + 9: 45 + 5 = 50, +4 = 54. Или 40 − 14: 40 − 10 = 30, −4 = 26.',
      requiredConcepts: ['круглый десяток', 'переход', 'остаток'],
      conceptKeywords: {
        'круглый десяток': ['кругл', 'десят', 'круглое'],
        'переход': ['переход', 'через'],
        'остаток': ['остаток', 'осталось', 'осталь']
      },
      minSentences: 3
    },
    completionCriteria: { minLength: 80, requiredConcepts: ['кругл', 'десят'] }
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
      shareCapsuleName: 'Через круглый десяток · Урок 4',
      questions: [
        { id: 'm1', kind: 'numeric', prompt: '38 + 7 = ?', correctAnswer: 45, conceptTag: 'переход+', cognitiveLevel: 'recall' },
        { id: 'm2', kind: 'numeric', prompt: '52 − 8 = ?', correctAnswer: 44, conceptTag: 'переход−', cognitiveLevel: 'apply' },
        { id: 'm3', kind: 'numeric', prompt: '40 − 14 = ?', correctAnswer: 26, conceptTag: 'двузнач-переход', cognitiveLevel: 'apply' },
        { id: 'm4', kind: 'numeric', prompt: '76 + 8 = ?', correctAnswer: 84, conceptTag: 'переход+', cognitiveLevel: 'apply' },
        { id: 'm5', kind: 'numeric', prompt: 'Было 60 тенге, потратила 17. Осталось?', correctAnswer: 43, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ],
      questionPool: [
        { id: 'p1', kind: 'numeric', prompt: '47 + 6 = ?', correctAnswer: 53, conceptTag: 'переход+', cognitiveLevel: 'recall' },
        { id: 'p2', kind: 'numeric', prompt: '63 − 9 = ?', correctAnswer: 54, conceptTag: 'переход−', cognitiveLevel: 'apply' },
        { id: 'p3', kind: 'numeric', prompt: '50 − 23 = ?', correctAnswer: 27, conceptTag: 'двузнач-переход', cognitiveLevel: 'apply' },
        { id: 'p4', kind: 'numeric', prompt: '85 + 9 = ?', correctAnswer: 94, conceptTag: 'переход+', cognitiveLevel: 'apply' },
        { id: 'p5', kind: 'numeric', prompt: 'У Динары 70 наклеек, отдала 26. Осталось?', correctAnswer: 44, conceptTag: 'применение', cognitiveLevel: 'apply' }
      ]
    },
    completionCriteria: { minAccuracy: 80 }
  })

  return { ok: true, topic: 'Сложение и вычитание в пределах 100', layersInsertedByLesson: counter }
})
