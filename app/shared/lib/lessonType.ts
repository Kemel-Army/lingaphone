// Named `LessonKind` (not `LessonType`) to avoid colliding with the unrelated,
// unused legacy `LessonType` enum in shared/types/common.ts (INDIVIDUAL|GROUP
// only — dead code from the pre-pivot Tutor-based schema).
export type LessonKind = 'GROUP' | 'INDIVIDUAL' | 'TRIAL' | 'MAKEUP' | 'SPEAKING_CLUB'

export interface LessonTypeMeta {
  value: LessonKind
  label: string
  shortLabel: string
  icon: string
  color: 'neutral' | 'info' | 'success' | 'warning' | 'primary'
}

/** Расписание: тип занятия. Каждый Lesson по-прежнему привязан к Group. */
export const LESSON_TYPES: readonly LessonTypeMeta[] = [
  { value: 'GROUP', label: 'Групповой урок', shortLabel: 'Группа', icon: 'i-lucide-users', color: 'neutral' },
  { value: 'INDIVIDUAL', label: 'Индивидуальный урок', shortLabel: 'Инд.', icon: 'i-lucide-user', color: 'info' },
  { value: 'TRIAL', label: 'Пробный урок', shortLabel: 'Пробный', icon: 'i-lucide-sparkles', color: 'success' },
  { value: 'MAKEUP', label: 'Отработка', shortLabel: 'Отработка', icon: 'i-lucide-rotate-ccw', color: 'warning' },
  { value: 'SPEAKING_CLUB', label: 'Speaking Club', shortLabel: 'Speaking', icon: 'i-lucide-mic', color: 'primary' }
]

export const LESSON_TYPE_MAP: Record<LessonKind, LessonTypeMeta>
  = Object.fromEntries(LESSON_TYPES.map(t => [t.value, t])) as Record<LessonKind, LessonTypeMeta>

export const LESSON_TYPE_OPTIONS = LESSON_TYPES.map(t => ({ label: t.label, value: t.value }))
