// ═══════════════════════════════════════════════════════════════════════
// Learning Path · capsule types (English adaptation of the arna model)
//
// A capsule (PathLesson) is built from up to 11 ordered CapsuleLayers.
// Each layer has a layerType and a content payload whose shape is
// discriminated by layerType (see CapsuleLayerContent below).
// ═══════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────
// Layer taxonomy
// ──────────────────────────────────────────────────────────────────────

export const LAYER_TYPES = [
  'HOOK',
  'DIAGNOSTIC',
  'INTUITION',
  'EXPLANATION',
  'FORMALIZATION',
  'WALKTHROUGH',
  'TRAINER',
  'SCENARIO',
  'TRAPS',
  'TEACH_BACK',
  'MASTERY_CHECK'
] as const

export type LayerType = (typeof LAYER_TYPES)[number]

export type LayerStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export type CapsuleDifficulty = 'LIGHT' | 'STANDARD' | 'DEEP'

export interface LayerMeta {
  label: string
  shortLabel: string
  tagline: string
  icon: string
  accentColor: string
  estimatedMinutes: number
  defaultXp: number
}

export const LAYER_META: Record<LayerType, LayerMeta> = {
  HOOK: {
    label: 'Хук', shortLabel: 'Хук', tagline: 'Эмоциональный захват внимания',
    icon: 'i-lucide-sparkles', accentColor: 'amber', estimatedMinutes: 1, defaultXp: 10
  },
  DIAGNOSTIC: {
    label: 'Диагностика', shortLabel: 'Диагноз', tagline: 'Короткая проверка — что уже знаешь',
    icon: 'i-lucide-stethoscope', accentColor: 'sky', estimatedMinutes: 2, defaultXp: 15
  },
  INTUITION: {
    label: 'Интуиция', shortLabel: 'Почувствуй', tagline: 'Понимание через интерактив',
    icon: 'i-lucide-wand-sparkles', accentColor: 'cyan', estimatedMinutes: 4, defaultXp: 20
  },
  EXPLANATION: {
    label: 'Объяснение', shortLabel: 'Разбираем', tagline: 'Главная идея темы по порядку',
    icon: 'i-lucide-graduation-cap', accentColor: 'green', estimatedMinutes: 6, defaultXp: 25
  },
  FORMALIZATION: {
    label: 'Правило', shortLabel: 'Правило', tagline: 'Термины, структура, грамматика',
    icon: 'i-lucide-book-open', accentColor: 'violet', estimatedMinutes: 2, defaultXp: 15
  },
  WALKTHROUGH: {
    label: 'Разбор', shortLabel: 'Эталон', tagline: 'Пошаговый разбор примера',
    icon: 'i-lucide-lightbulb', accentColor: 'yellow', estimatedMinutes: 4, defaultXp: 20
  },
  TRAINER: {
    label: 'Тренажёр', shortLabel: 'Практика', tagline: 'Задания адаптивной сложности',
    icon: 'i-lucide-dumbbell', accentColor: 'emerald', estimatedMinutes: 5, defaultXp: 30
  },
  SCENARIO: {
    label: 'Сценарий', shortLabel: 'В жизни', tagline: 'Ролевой диалог и контекст',
    icon: 'i-lucide-messages-square', accentColor: 'orange', estimatedMinutes: 6, defaultXp: 30
  },
  TRAPS: {
    label: 'Ловушки', shortLabel: 'Осторожно', tagline: 'Типичные ошибки и как их избежать',
    icon: 'i-lucide-alert-triangle', accentColor: 'rose', estimatedMinutes: 2, defaultXp: 15
  },
  TEACH_BACK: {
    label: 'Расскажи сам', shortLabel: 'Speaking', tagline: 'Объясни своими словами',
    icon: 'i-lucide-megaphone', accentColor: 'pink', estimatedMinutes: 4, defaultXp: 25
  },
  MASTERY_CHECK: {
    label: 'Финал', shortLabel: 'Финал', tagline: 'Итоговая проверка. Порог — 80%',
    icon: 'i-lucide-trophy', accentColor: 'amber', estimatedMinutes: 4, defaultXp: 40
  }
}

// ──────────────────────────────────────────────────────────────────────
// Table row types (match the Supabase schema)
// ──────────────────────────────────────────────────────────────────────

export interface PathTopic {
  id: string
  bookId: string | null
  name: string
  description: string | null
  level: string | null
  icon: string
  color: string
  orderIndex: number
  totalXp: number
  durationMinutes: number
  createdAt: string
  updatedAt: string
  // Computed / joined
  lessons?: PathLesson[]
  lessonsCount?: number
  completedLessonsCount?: number
  progress?: number // 0-100
}

export interface PathLesson {
  id: string
  pathTopicId: string
  title: string
  subtitle: string | null
  orderIndex: number
  durationMinutes: number
  xpReward: number
  masteryThreshold: number
  difficulty: CapsuleDifficulty
  createdAt: string
  updatedAt: string
  // Computed / joined
  layers?: CapsuleLayer[]
  progress?: PathProgress | null
  topicName?: string
}

export interface CapsuleLayer {
  id: string
  lessonId: string
  layerType: LayerType
  orderIndex: number
  title: string
  subtitle: string | null
  icon: string
  accentColor: string
  estimatedMinutes: number
  xpReward: number
  content: CapsuleLayerContent
  completionCriteria: CompletionCriteria
  createdAt: string
  updatedAt: string
  // Computed / joined
  progress?: LayerProgress | null
}

export interface LayerProgress {
  id: string
  studentId: string
  layerId: string
  lessonId: string
  status: LayerStatus
  score: number | null
  maxScore: number | null
  attempts: number
  timeSpentSeconds: number
  xpEarned: number
  interactionData: Record<string, unknown>
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PathProgress {
  id: string
  studentId: string
  pathLessonId: string
  currentLayerIndex: number
  layersCompleted: number
  masteryScore: number | null
  masteryMaxScore: number | null
  masteryAchieved: boolean
  xpEarned: number
  lastActivityAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────────────
// Completion criteria (checked by the layer runtime / server)
// ──────────────────────────────────────────────────────────────────────

export interface CompletionCriteria {
  minAccuracy?: number
  minCorrect?: number
  minInteractions?: number
  minLength?: number
  minSimilarity?: number
  requiredConcepts?: string[]
}

// ──────────────────────────────────────────────────────────────────────
// Reusable primitives inside layer content
// ──────────────────────────────────────────────────────────────────────

export type CognitiveLevel = 'recall' | 'understand' | 'apply' | 'analyze' | 'transfer'

export interface ChoiceQuestion {
  id: string
  prompt: string
  promptKz?: string
  options: string[]
  correctIndex: number
  explanation?: string
  conceptTag?: string
  difficulty?: 1 | 2 | 3 | 4 | 5
}

export interface NumericQuestion {
  id: string
  prompt: string
  promptKz?: string
  correctAnswer: number | string
  tolerance?: number
  unit?: string
  hint?: string
  conceptTag?: string
  difficulty?: 1 | 2 | 3 | 4 | 5
}

/** Соедини пары: слева термин/слово, справа значение/перевод. */
export interface TapPairProblem {
  id: string
  prompt: string
  promptKz?: string
  left: { id: string, label: string }[]
  right: { id: string, label: string, pairId: string }[]
  explanation?: string
  conceptTag?: string
  difficulty?: 1 | 2 | 3 | 4 | 5
}

export type TrainerProblem
  = | ({ kind: 'choice' } & ChoiceQuestion)
    | ({ kind: 'numeric' } & NumericQuestion)
    | ({ kind: 'tap-pair' } & TapPairProblem)

// ──────────────────────────────────────────────────────────────────────
// Layer-specific content shapes (discriminated by layerType)
// ──────────────────────────────────────────────────────────────────────

export type SoundEffect
  = | 'pop' | 'correct' | 'wrong' | 'levelup' | 'whoosh' | 'click' | 'sparkle' | 'cheer'

export interface HookFrame {
  emoji?: string
  icon?: string
  accent?: string
  caption: string
  subCaption?: string
}

export interface EmojiChoiceTile {
  id: string
  emoji: string
  label: string
  isPrimary?: boolean
}

export interface HookContent {
  kind: 'HOOK'
  mediaKind: 'animation' | 'image' | 'video' | 'fact'
  mediaUrl?: string
  headline: string
  body?: string
  prompt?: string
  choices?: { id: string, label: string, isPrimary?: boolean }[]
  frames?: HookFrame[]
  emojiChoices?: EmojiChoiceTile[]
  mascotEntry?: 'greet' | 'think' | 'celebrate' | 'warn' | 'teach' | 'trophy'
  bgPattern?: 'stars' | 'dots' | 'waves' | 'confetti' | 'none'
  successSfx?: SoundEffect
}

export type DiagnosticMode = 'mcq' | 'tap-correct' | 'drag-bucket'

export interface TapCorrectTask {
  id: string
  prompt: string
  tiles: { id: string, label: string, emoji?: string, isCorrect: boolean }[]
  needCorrect: number
  explanation?: string
  conceptTag?: string
}

export interface DragBucketTask {
  id: string
  prompt: string
  buckets: { id: string, label: string, emoji?: string }[]
  items: { id: string, label: string, bucketId: string }[]
  explanation?: string
  conceptTag?: string
}

export interface DiagnosticContent {
  kind: 'DIAGNOSTIC'
  questions: ChoiceQuestion[]
  adaptiveHints?: { onMissConcept: string, followUpIds: string[] }[]
  mode?: DiagnosticMode
  lives?: number
  tapTasks?: TapCorrectTask[]
  dragTasks?: DragBucketTask[]
  skipNextLayersOnPerfect?: LayerType[]
}

export interface IntuitionContent {
  kind: 'INTUITION'
  widget: IntuitionWidget
  probes?: ChoiceQuestion[]
  copy: { headline: string, body?: string }
}

// Language-first widgets (English) + the full math-manipulative set ported
// from arna (their components live under widgets/learning-path/intuition).
export type IntuitionWidget
  // ── language widgets (English) ──
  // Соедини слово с картинкой (эмодзи/фото).
  = | { type: 'word-picture-match', pairs: { id: string, word: string, emoji?: string, imageUrl?: string }[] }
  // Собери предложение из слов-плиток.
    | { type: 'sentence-builder', tokens: string[], correct: string[], translation?: string }
  // Послушай (TTS) и выбери правильный вариант.
    | { type: 'listen-and-pick', say: string, options: string[], correctIndex: number }
  // Вставь пропущенное слово.
    | { type: 'gap-fill', before: string, after: string, options: string[], correctIndex: number }
  // ── math manipulatives (ported from arna) ──
    | { type: 'array-grid', minRows: number, maxRows: number, minCols: number, maxCols: number, defaultRows: number, defaultCols: number }
    | { type: 'fraction-trio', maxDenominator: number, defaultNumerator: number, defaultDenominator: number }
    | { type: 'number-line', min: number, max: number, step: number, highlights?: number[] }
    | { type: 'grouping', totalItems: number, groupsRange: [number, number] }
    | { type: 'place-value-blocks', maxHundreds: number, maxTens: number, maxOnes: number, target?: number }
    | { type: 'clock', mode: 'free' | 'set-time', targetHour?: number, targetMinute?: number, snap?: number }
    | { type: 'balance-scale', maxWeight: number, leftStart?: number, rightStart?: number, target?: 'equal' | number }
    | { type: 'ruler', maxLengthCm: number, segmentLengthCm: number }
    | { type: 'coin-counter', denominations: number[], targetAmount?: number }
    | { type: 'angle-protractor', startAngle: number, snap: number, target?: number }
    | { type: 'set-venn', setALabel: string, setBLabel: string, items: { id: string, label: string, emoji?: string, in: 'A' | 'B' | 'BOTH' | 'NEITHER' }[] }
    | { type: 'share-equally', totalItems: number, plates: number, itemEmoji?: string }

export interface ExplanationChunk {
  id: string
  kind: 'text' | 'callout' | 'formula' | 'image' | 'video' | 'comic' | 'tap-reveal'
  content: string
  note?: string
  emphasis?: boolean
  revealedContent?: string
  revealedKind?: 'text' | 'formula'
  revealedHint?: string
  panels?: { emoji?: string, icon?: string, caption: string, accent?: string }[]
  speakable?: boolean
}

export interface ExplanationContent {
  kind: 'EXPLANATION'
  chunks: ExplanationChunk[]
  checks: ChoiceQuestion[]
}

export interface FormalizationContent {
  kind: 'FORMALIZATION'
  diagramTitle: string
  anatomy: { id: string, label: string, role: string, value?: string, accent?: string }[]
  terms: { term: string, definition: string, example?: string, speakText?: string }[]
  buildTask?: {
    prompt: string
    template: string
    expected: string[]
    distractors?: string[]
    enableDragAndDrop?: boolean
  }
  voiceTerms?: boolean
}

export interface WalkthroughVisual {
  kind: 'comic' | 'board' | 'emoji'
  panels?: { emoji?: string, caption: string }[]
  boardLines?: string[]
  emoji?: string
}

export interface WalkthroughStep {
  index: number
  title: string
  explanation: string
  visual?: WalkthroughVisual
  textAnim?: 'fade' | 'type' | 'pop'
  action?: {
    kind: 'choice' | 'numeric' | 'acknowledge'
    prompt?: string
    expected?: string | number
    options?: string[]
    correctIndex?: number
  }
}

export interface WalkthroughExample {
  id: string
  problem: string
  steps: WalkthroughStep[]
  prefilledSteps: number
}

export interface WalkthroughContent {
  kind: 'WALKTHROUGH'
  intro: string
  examples: WalkthroughExample[]
}

export interface TrainerContent {
  kind: 'TRAINER'
  targetCorrect: number
  maxAttempts?: number
  problems: TrainerProblem[]
  socraticHints?: Record<string, string[]>
}

export interface ScenarioOrder {
  id: string
  customer: string
  request: string
  correct: string | number
  unit?: string
  wrongFeedback: string
  revenueReward?: number
  reputationReward?: number
}

export type ScenarioTheme
  = | 'cafe' | 'space' | 'zoo' | 'construction' | 'artist' | 'railway'

export interface ScenarioContent {
  kind: 'SCENARIO'
  setting: {
    title: string
    roleplay: string
    location?: string
    characterName?: string
    mascotLine?: string
  }
  initialStats: { revenue: number, reputation: number, customers: number }
  orders: ScenarioOrder[]
  theme?: ScenarioTheme
  boss?: ScenarioOrder
  comboBonus?: { streak: number, multiplier: number }
}

export interface TrapCard {
  id: string
  wrongStatement: string
  whyWrong: string
  correctStatement: string
  rememberNote: string
  example?: string
  spotOptions?: string[]
  spotWrongIndex?: number
  fixPrompt?: string
  fixCorrectAnswer?: string | number
  fixHint?: string
}

export type TrapMode = 'flip' | 'spot' | 'fix-it'

export interface TrapsContent {
  kind: 'TRAPS'
  intro: string
  traps: TrapCard[]
  mode?: TrapMode
  bugHunterBadge?: { label: string, emoji: string }
}

export interface TeachBackContent {
  kind: 'TEACH_BACK'
  audiencePersona: string
  coverPrompts: string[]
  referenceAnswer: string
  requiredConcepts: string[]
  minSentences: number
  reflectionPrompt?: string
  voiceFirst?: boolean
  realtimeConcepts?: boolean
  conceptKeywords?: Record<string, string[]>
  voicePrompt?: string
}

export interface MasteryQuestion {
  id: string
  prompt: string
  kind: 'choice' | 'numeric'
  options?: string[]
  correctIndex?: number
  correctAnswer?: string | number
  tolerance?: number
  conceptTag: string
  cognitiveLevel: CognitiveLevel
}

export type TrophyTier = 'gold' | 'silver' | 'bronze' | 'none'

export interface MasteryCheckContent {
  kind: 'MASTERY_CHECK'
  questions: MasteryQuestion[]
  passingScore: number
  retryAllowed: boolean
  questionPool?: MasteryQuestion[]
  trophyThresholds?: { gold: number, silver: number, bronze: number }
  shareEnabled?: boolean
  shareCapsuleName?: string
}

export type CapsuleLayerContent
  = | HookContent
    | DiagnosticContent
    | IntuitionContent
    | ExplanationContent
    | FormalizationContent
    | WalkthroughContent
    | TrainerContent
    | ScenarioContent
    | TrapsContent
    | TeachBackContent
    | MasteryCheckContent

export type ContentOfLayer<T extends LayerType> = Extract<CapsuleLayerContent, { kind: T }>
