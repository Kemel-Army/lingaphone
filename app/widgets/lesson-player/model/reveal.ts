/**
 * Shape of the `reveal` payload the checker returns alongside a result
 * (`useLessonPlayer`'s `reveal: Record<string, unknown>`), narrowed to the
 * fields the exercise components actually read.
 *
 * Every field is optional: which ones are present depends on the exercise
 * type, and `reveal` is `null` until the answer has been checked.
 */
export interface ExerciseReveal {
  /** FILL_BLANK / CHOOSE_INLINE — expected value per cell index. */
  answers?: (string | null)[]
  /** MATCH_PAIRS — expected left→right pairing. */
  pairs?: { l: string, r: string }[]
  /** MCQ — id of the correct option. */
  optionId?: string
  /** REORDER_WORDS — words in the expected order. */
  order?: string[]
  /** SHORT_TEXT — a sample accepted answer. */
  text?: string
  /** SORT_COLUMNS / WORD_IMAGE_MATCH — expected bucket per item id. */
  placement?: Record<string, string>
  /** TRUE_FALSE — the expected boolean. */
  value?: boolean
}

/** Props shared by every `ui/ex/*.vue` exercise component. */
export interface ExerciseComponentProps {
  status: 'idle' | 'correct' | 'wrong'
  reveal: ExerciseReveal | null
  disabled: boolean
}
