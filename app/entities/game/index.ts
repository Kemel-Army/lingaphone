export { default as GameWrapper } from './ui/GameWrapper.vue'
export { useGames } from './composables/useGames'
export type {
  Game,
  GameLevel,
  GameSlug,
  GameConfig,
  WordPuzzleConfig,
  DragDropConfig,
  DragDropPair
} from './model/types'
export { isWordPuzzle, isDragDrop } from './model/types'
