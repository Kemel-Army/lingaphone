/**
 * «Мотивашка» — клиентские типы и справочники.
 *
 * Пороги и веса дублируют server/utils/motivation.ts намеренно: UI должен
 * показывать шкалу и подсказки без обращения к серверу. Значения менять
 * только парой, иначе подсказка разойдётся с реальным расчётом.
 */

export const GRADE_CRITERIA = ['ATTENDANCE', 'BEHAVIOR', 'HOMEWORK', 'DIARY', 'EBOOK'] as const
export type GradeCriterion = typeof GRADE_CRITERIA[number]

export interface CriterionMeta {
  value: GradeCriterion
  label: string
  short: string
  icon: string
}

/** Подписи — как в исходной Google-таблице, чтобы учителя не переучивались. */
export const CRITERIA: CriterionMeta[] = [
  { value: 'ATTENDANCE', label: 'Посещаемость', short: 'Посещ.', icon: 'i-lucide-calendar-check' },
  { value: 'BEHAVIOR', label: 'Поведение', short: 'Повед.', icon: 'i-lucide-smile' },
  { value: 'HOMEWORK', label: 'Домашнее задание', short: 'Дом.зад', icon: 'i-lucide-notebook-pen' },
  { value: 'DIARY', label: 'Дневник', short: 'Дневник', icon: 'i-lucide-book-marked' },
  { value: 'EBOOK', label: 'Работа с e-book', short: 'E-book', icon: 'i-lucide-tablet' }
]

export const CRITERION_MAP: Record<GradeCriterion, CriterionMeta>
  = Object.fromEntries(CRITERIA.map(c => [c.value, c])) as Record<GradeCriterion, CriterionMeta>

export type MedalKind = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'

export interface MedalMeta {
  value: MedalKind
  label: string
  emoji: string
  payout: number
  /** Нижняя граница среднего балла (включительно). */
  min: number
  color: 'neutral' | 'warning' | 'primary' | 'success'
  classes: string
}

export const MEDALS: MedalMeta[] = [
  { value: 'NONE', label: 'Без медали', emoji: '—', payout: 0, min: 0, color: 'neutral', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'BRONZE', label: 'Бронза', emoji: '🥉', payout: 1000, min: 2.7, color: 'warning', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  { value: 'SILVER', label: 'Серебро', emoji: '🥈', payout: 3000, min: 3.8, color: 'primary', classes: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100' },
  { value: 'GOLD', label: 'Золото', emoji: '🥇', payout: 5000, min: 4.6, color: 'success', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' }
]

export const MEDAL_MAP: Record<MedalKind, MedalMeta>
  = Object.fromEntries(MEDALS.map(m => [m.value, m])) as Record<MedalKind, MedalMeta>

/** Менеджерские параметры — по 5 баллов каждый, ставит не учитель. */
export const MANAGER_PARAMS = [
  { key: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { key: 'paidOnTime', label: 'Оплата вовремя', icon: 'i-lucide-wallet' },
  { key: 'books', label: 'Книги', icon: 'i-lucide-book' }
] as const
export type ManagerParamKey = typeof MANAGER_PARAMS[number]['key']

export interface MotivationRow {
  studentId: string
  name: string
  surname: string
  fullName: string
  groupId: string | null
  groupName: string
  gradeSum: number
  gradesCount: number
  attendedLessons: number
  lessonsInMonth: number
  subscriptionLessons: number
  instagram: boolean
  paidOnTime: boolean
  books: boolean
  teacherAvg: number
  instagramPoints: number
  paymentPoints: number
  bookPoints: number
  lessonsCounted: number
  average: number
  participates: boolean
  medal: MedalKind
  payout: number
  avgGradesPerLesson: number
}

export interface MonthlySummary {
  month: string
  rows: MotivationRow[]
  totals: { bronze: number, silver: number, gold: number, none: number, payout: number }
}

export interface StudentLessonGrades {
  lessonId: string
  topic: string
  startsAt: string
  groupName: string
  grades: Partial<Record<GradeCriterion, number>>
  /** null — за урок ещё ничего не выставлено. */
  average: number | null
  filled: number
}

export interface MedalHistoryEntry {
  month: string
  medal: MedalKind
  averageGrade: number
  payout: number
}

export interface StudentMonth {
  month: string
  summary: MotivationRow | null
  lessons: StudentLessonGrades[]
  history: MedalHistoryEntry[]
}

export interface CriteriaJournal {
  month: string
  lessons: { id: string, topic: string, startsAt: string }[]
  students: { studentId: string, name: string, surname: string }[]
  gradeMap: Record<string, Record<string, Partial<Record<GradeCriterion, number>>>>
  criteria: readonly GradeCriterion[]
}

/** `YYYY-MM` текущего месяца — ключ, с которым работают все эндпоинты. */
export const currentMonthKey = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** «2026-09» → «сентябрь 2026» для заголовков. */
export const formatMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}
