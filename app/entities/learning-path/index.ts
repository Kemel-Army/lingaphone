// ═══════════════════════════════════════════════════════════════════════
// Learning Path · Public API
// ═══════════════════════════════════════════════════════════════════════

// Types
export type {
  PathTopic,
  PathLesson,
  PathProgress,
  CapsuleLayer,
  LayerProgress,
  LayerType,
  LayerStatus,
  LayerMeta,
  CapsuleDifficulty,
  CompletionCriteria,
  CognitiveLevel,
  ChoiceQuestion,
  NumericQuestion,
  TrainerProblem,
  TapPairProblem,
  CapsuleLayerContent,
  ContentOfLayer,
  HookContent,
  HookFrame,
  EmojiChoiceTile,
  SoundEffect,
  DiagnosticContent,
  DiagnosticMode,
  TapCorrectTask,
  DragBucketTask,
  IntuitionContent,
  IntuitionWidget,
  ExplanationContent,
  ExplanationChunk,
  FormalizationContent,
  WalkthroughContent,
  WalkthroughExample,
  WalkthroughStep,
  WalkthroughVisual,
  TrainerContent,
  ScenarioContent,
  ScenarioOrder,
  ScenarioTheme,
  TrapsContent,
  TrapCard,
  TrapMode,
  TeachBackContent,
  MasteryCheckContent,
  MasteryQuestion,
  TrophyTier
} from './model/types'

export { LAYER_TYPES, LAYER_META } from './model/types'

// Composables
export { useLearningPath } from './composables/useLearningPath'
export { useCapsule } from './composables/useCapsule'

// UI
export { default as PathTopicCard } from './ui/PathTopicCard.vue'
export { default as PathTopicIsland } from './ui/PathTopicIsland.vue'
export { default as PathTrailSegment } from './ui/PathTrailSegment.vue'
export { default as PathLessonCard } from './ui/PathLessonCard.vue'
export { default as PathStatsRow } from './ui/PathStatsRow.vue'
