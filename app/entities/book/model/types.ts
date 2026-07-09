export type BookLevel = 'A1' | 'A2' | 'B1' | 'B2'

export interface BookModule {
  id: string
  bookId: string
  title: string
  order: number
  pdfUrl: string | null
  createdAt: string
}

export interface Book {
  id: string
  title: string
  description: string | null
  level: BookLevel
  coverUrl: string | null
  isPublished: boolean
  createdAt: string
}

export interface BookWithModules extends Book {
  modules: BookModule[]
}

export const BOOK_LEVEL_META: Record<BookLevel, {
  label: string
  color: string
  bg: string
  gradient: string
}> = {
  A1: {
    label: 'Beginner',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    gradient: 'from-sky-400 to-blue-500'
  },
  A2: {
    label: 'Elementary',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    gradient: 'from-blue-400 to-indigo-500'
  },
  B1: {
    label: 'Intermediate',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    gradient: 'from-violet-400 to-purple-500'
  },
  B2: {
    label: 'Upper-Inter',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    gradient: 'from-amber-400 to-orange-500'
  }
}

// ═══════════════════════════════════════════════════════════════
// Interactive Book — page image + positioned exercise overlay
// ═══════════════════════════════════════════════════════════════

/** Interactive widget kinds placed over a scanned page. */
export type PageExerciseKind
  = | 'BLANK' // fill-in-the-blank text field
    | 'CHOICE' // circle one of several printed options
    | 'UNDERLINE' // underline the correct one of several printed options
    | 'TRUE_FALSE' // true / false toggle
    | 'MATCH' // connect left items to right items
    | 'SHORT_TEXT' // free short answer (AI-checked)
    | 'ORAL' // speak the answer (mic → AI-checked)

export const PAGE_EXERCISE_KIND_META: Record<PageExerciseKind, {
  label: string
  icon: string
  /** true → checked instantly by answer key; false → sent to AI. */
  closed: boolean
}> = {
  BLANK: { label: 'Пропуск', icon: 'i-lucide-pen-line', closed: true },
  CHOICE: { label: 'Обвести', icon: 'i-lucide-circle-dot', closed: true },
  UNDERLINE: { label: 'Подчеркнуть', icon: 'i-lucide-underline', closed: true },
  TRUE_FALSE: { label: 'Да / Нет', icon: 'i-lucide-toggle-left', closed: true },
  MATCH: { label: 'Соединить', icon: 'i-lucide-spline', closed: true },
  SHORT_TEXT: { label: 'Ответ', icon: 'i-lucide-message-square', closed: false },
  ORAL: { label: 'Устно', icon: 'i-lucide-mic', closed: false }
}

/**
 * One option / endpoint, stored in the exercise's jsonb `options` array.
 * For CHOICE/UNDERLINE and MATCH the option carries its OWN normalised bbox
 * (x,y,w,h 0..1) so it can sit directly over the printed word on the page.
 * `side` marks the MATCH column. Unused fields stay undefined per kind.
 */
export interface PageExerciseOption {
  id?: string
  label?: string // visible option text (optional — usually already printed)
  x?: number // normalised bbox of the option hotspot on the page
  y?: number
  w?: number
  h?: number
  side?: 'L' | 'R' // MATCH: left or right column
}

/** A rendered page image of a module's PDF. */
export interface BookPage {
  id: string
  moduleId: string
  pageNumber: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
}

/**
 * Client-safe exercise: bbox is normalised 0..1 over the page image.
 * Deliberately carries NO correct answer — the key lives in a
 * service-role-only table, so nothing leaks to the student.
 */
export interface PageExercise {
  id: string
  pageId: string
  kind: PageExerciseKind
  x: number
  y: number
  w: number
  h: number
  prompt: string | null
  options: PageExerciseOption[]
  orderIndex: number
}

export interface BookPageWithExercises extends BookPage {
  exercises: PageExercise[]
}

/** A student's checked answer to one exercise (own rows only via RLS). */
export interface PageAttempt {
  id: string
  exerciseId: string
  response: unknown
  isCorrect: boolean | null
  score: number | null
  aiFeedback: { feedback?: string, correctAnswer?: string } | null
  audioUrl: string | null
  createdAt: string
}

// ═══════════════════════════════════════════════════════════════
// Native lesson exercises (Duolingo-style player) — structured
// content rendered as clean widgets (NOT scan overlays).
// ═══════════════════════════════════════════════════════════════

export type LessonExerciseType
  = | 'FILL_BLANK' // sentence(s) with a typed blank (+ optional picture)
    | 'CHOOSE' // pick the correct inline option (circle/underline)
    | 'MCQ' // one question, pick one option (text or image cards)
    | 'WORD_IMAGE_MATCH' // drag/tap words onto pictures
    | 'MATCH_PAIRS' // connect left ↔ right lists
    | 'REORDER' // arrange word tiles into a sentence
    | 'TRUE_FALSE' // true / false statement
    | 'SORT_COLUMNS' // drop items into the right column
    | 'SHORT_TEXT' // free short answer (deterministic accept-list)

export const LESSON_TYPE_META: Record<LessonExerciseType, { label: string, icon: string }> = {
  FILL_BLANK: { label: 'Впиши', icon: 'i-lucide-pen-line' },
  CHOOSE: { label: 'Выбери', icon: 'i-lucide-circle-dot' },
  MCQ: { label: 'Вопрос', icon: 'i-lucide-list-checks' },
  WORD_IMAGE_MATCH: { label: 'Слово-картинка', icon: 'i-lucide-image' },
  MATCH_PAIRS: { label: 'Соедини', icon: 'i-lucide-spline' },
  REORDER: { label: 'Порядок', icon: 'i-lucide-arrow-left-right' },
  TRUE_FALSE: { label: 'Да / Нет', icon: 'i-lucide-toggle-left' },
  SORT_COLUMNS: { label: 'По столбцам', icon: 'i-lucide-columns-3' },
  SHORT_TEXT: { label: 'Ответ', icon: 'i-lucide-message-square' }
}

// ── Per-type content shapes (client-visible, NO answer key) ────
export interface FillBlankContent { items: { before?: string, after?: string, image?: string }[] }
export interface ChooseContent { items: { before?: string, after?: string, options: { id: string, label: string }[] }[] }
export interface McqContent { question?: string, image?: string, options: { id: string, label?: string, image?: string }[] }
export interface WordImageMatchContent { pairs: { id: string, word: string, image: string }[] }
export interface MatchPairsContent { left: { id: string, label: string }[], right: { id: string, label: string }[] }
export interface ReorderContent { tiles: string[] } // shown shuffled; correct order in the key
export interface TrueFalseContent { statement: string }
export interface SortColumnsContent { columns: { id: string, label: string }[], items: { id: string, label?: string, image?: string }[] }
export interface ShortTextContent { question: string }

export type LessonContent
  = | FillBlankContent | ChooseContent | McqContent | WordImageMatchContent
    | MatchPairsContent | ReorderContent | TrueFalseContent | SortColumnsContent | ShortTextContent

/** A grammar-rule block shown before the exercises. */
export type IntroBlock
  = | { type: 'text', text: string }
    | { type: 'rule', text: string }
    | { type: 'examples', items: string[] }
    | { type: 'image', url: string }

export interface LessonUnit {
  id: string
  moduleId: string
  title: string
  subtitle: string | null
  orderIndex: number
  intro: IntroBlock[]
  kind?: 'LESSON' | 'TEST'
  passThreshold?: number
}

export interface LessonExercise {
  id: string
  unitId: string
  orderIndex: number
  type: LessonExerciseType
  instruction: string | null
  content: LessonContent
  xp: number
}

export interface LessonUnitWithExercises extends LessonUnit {
  exercises: LessonExercise[]
}

/** Unit summary for the module's unit list. */
export interface LessonUnitSummary {
  id: string
  title: string
  subtitle: string | null
  orderIndex: number
  exerciseCount: number
  kind?: 'LESSON' | 'TEST'
  passThreshold?: number
}

/** A student's attempt at one lesson exercise (own rows via RLS). */
export interface LessonAttempt {
  id: string
  exerciseId: string
  response: unknown
  isCorrect: boolean | null
  score: number | null
}

// ═══════════════════════════════════════════════════════════════
// «Мой путь» (User Journey) — bound book as a gated block map
// ═══════════════════════════════════════════════════════════════

/** A unit's role inside a block: a lesson or the gating block test. */
export type LessonUnitKind = 'LESSON' | 'TEST'

export type MyPathBlockStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED'

export interface MyPathLesson {
  id: string
  title: string
  orderIndex: number
  exerciseCount: number
  doneCount: number
  completed: boolean
}

export interface MyPathBlockTest {
  unitId: string
  title: string
  passThreshold: number
  exerciseCount: number
  passed: boolean
  bestScore: number
  attempts: number
}

export interface MyPathBlock {
  id: string
  title: string
  order: number
  status: MyPathBlockStatus
  lessons: MyPathLesson[]
  lessonsTotal: number
  lessonsDone: number
  test: MyPathBlockTest | null
}

/** The student's whole journey: bound book + ordered, gated blocks. */
export interface MyPath {
  level: string | null
  tier: string | null
  trackBookTitle: string | null
  book: { id: string, title: string, cefrTier: string | null } | null
  blocks: MyPathBlock[]
  /** Отсканированный учебник (страницы-картинки), если загружен — для чтения. */
  scanModule: { id: string, title: string, pageCount: number } | null
}

/** Result of finalizing a block test (/api/book/submit-block-test). */
export interface BlockTestResult {
  score: number
  correct: number
  total: number
  passThreshold: number
  passed: boolean
  blockPassed: boolean
  bestScore: number
}

/** A row from the LevelTrack reference matrix (ТЗ §2). */
export interface LevelTrack {
  level: string
  tier: string
  ageRange: string
  grades: string
  bookTitle: string
  orderIndex: number
  isActive: boolean
}
