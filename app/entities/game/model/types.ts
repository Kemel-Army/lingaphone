export type GameLevel = 'A1' | 'A2' | 'B1' | 'B2'

// Mechanic identifiers (ТЗ §2.3). Frontend renders by slug; content is config.
export type GameSlug = 'word-puzzle' | 'drag-drop'

export interface Game {
  id: string
  slug: string
  title: string
  level: GameLevel
  config: GameConfig
  moduleId: string | null
  createdAt: string
}

// ── Per-mechanic config shapes ────────────────────────────────
// "word-puzzle": scramble each word, player reassembles it.
export interface WordPuzzleConfig {
  words: string[]
}

// "drag-drop": match left items to right targets.
export interface DragDropPair {
  term: string
  match: string
}
export interface DragDropConfig {
  pairs: DragDropPair[]
}

// Generic config — narrowed by slug at the call site.
export type GameConfig = WordPuzzleConfig | DragDropConfig | Record<string, unknown>

export const isWordPuzzle = (slug: string, c: GameConfig): c is WordPuzzleConfig =>
  slug === 'word-puzzle' && Array.isArray((c as WordPuzzleConfig).words)

export const isDragDrop = (slug: string, c: GameConfig): c is DragDropConfig =>
  slug === 'drag-drop' && Array.isArray((c as DragDropConfig).pairs)
