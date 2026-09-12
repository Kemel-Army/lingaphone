/**
 * «Мотивашка» — расчёт месячного среднего балла, медали и бонуса.
 *
 * Портированы формулы из Google-таблицы «Сводные по мотивашке» (лист
 * «Сводная таблица <месяц>», столбцы AO/AP/AQ/AR/AS/AT/AV). Держим их в одном
 * месте, чтобы сервер, тесты и админка считали одинаково.
 */

export const GRADE_CRITERIA = ['ATTENDANCE', 'BEHAVIOR', 'HOMEWORK', 'DIARY', 'EBOOK'] as const
export type GradeCriterion = typeof GRADE_CRITERIA[number]

/** Подписи как в исходной таблице — менеджеры узнают их с первого взгляда. */
export const CRITERION_LABELS: Record<GradeCriterion, string> = {
  ATTENDANCE: 'посещаемость',
  BEHAVIOR: 'поведение',
  HOMEWORK: 'дом.зад',
  DIARY: 'дневник',
  EBOOK: 'работа с e-book'
}

export type MedalKind = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'

/**
 * Границы из формул AQ/AR/AS. Верхняя граница НЕ включается (кроме золота:
 * `AP <= 5`), поэтому 3.8 — уже серебро, а не бронза.
 */
export const MEDAL_TIERS: { medal: Exclude<MedalKind, 'NONE'>, min: number, max: number, payout: number }[] = [
  { medal: 'BRONZE', min: 2.7, max: 3.8, payout: 1000 },
  { medal: 'SILVER', min: 3.8, max: 4.6, payout: 3000 },
  { medal: 'GOLD', min: 4.6, max: 5.0, payout: 5000 }
]

/** Балл за каждый менеджерский параметр (Instagram / оплата / книги). */
export const MANAGER_PARAM_POINTS = 5

/**
 * Делитель из формулы AP. 5 критериев × 5 баллов + 3 менеджерских × 5 = 40,
 * 40 / 8 = 5.0 — максимум шкалы.
 */
export const SCORE_DIVISOR = 8

export interface MotivationInput {
  /** Сумма всех оценок учителя за месяц (все критерии, все уроки). */
  gradeSum: number
  /** Сколько оценок реально выставлено — для диагностики «должно быть 5 на урок». */
  gradesCount: number
  /** Посещено + отработано (AE + AF). */
  attendedLessons: number
  /** Занятий по абонементу в месяц (AM). */
  subscriptionLessons: number
  instagram: boolean
  paidOnTime: boolean
  books: boolean
}

export interface MotivationResult {
  /** AO — на сколько занятий делим сумму оценок. */
  lessonsCounted: number
  /** Средний балл учителя за занятие (до 25). */
  teacherAvg: number
  instagramPoints: number
  paymentPoints: number
  bookPoints: number
  /** AP — итоговый средний балл 0…5. */
  average: number
  /** AV — участвует ли в мотивации (только при оплате вовремя). */
  participates: boolean
  medal: MedalKind
  payout: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** AQ/AR/AS → медаль и бонус. */
export const medalForAverage = (average: number): { medal: MedalKind, payout: number } => {
  for (const t of MEDAL_TIERS) {
    const withinTop = t.medal === 'GOLD' ? average <= t.max : average < t.max
    if (average >= t.min && withinTop) return { medal: t.medal, payout: t.payout }
  }
  return { medal: 'NONE', payout: 0 }
}

/**
 * Полный расчёт по одному ученику за месяц.
 *
 * `lessonsCounted` берётся как MAX(посещено+отработано, по абонементу) — так в
 * таблице (AO): пропуски не должны поднимать средний балл, поэтому делим на
 * весь оплаченный объём занятий.
 */
export const computeMotivation = (input: MotivationInput): MotivationResult => {
  const lessonsCounted = Math.max(input.attendedLessons, input.subscriptionLessons)

  const teacherAvg = lessonsCounted > 0 ? input.gradeSum / lessonsCounted : 0
  const instagramPoints = input.instagram ? MANAGER_PARAM_POINTS : 0
  const paymentPoints = input.paidOnTime ? MANAGER_PARAM_POINTS : 0
  const bookPoints = input.books ? MANAGER_PARAM_POINTS : 0

  // AV: без оплаты вовремя ученик в мотивации не участвует.
  const participates = input.paidOnTime

  const rawAverage = (teacherAvg + instagramPoints + paymentPoints + bookPoints) / SCORE_DIVISOR
  // Шкала ограничена пятёркой: ручные правки абонемента не должны её пробить.
  const average = participates ? round2(Math.min(rawAverage, 5)) : 0

  const { medal, payout } = participates ? medalForAverage(average) : { medal: 'NONE' as MedalKind, payout: 0 }

  return {
    lessonsCounted,
    teacherAvg: round2(teacherAvg),
    instagramPoints,
    paymentPoints,
    bookPoints,
    average,
    participates,
    medal,
    payout
  }
}

/**
 * Ключ месяца `YYYY-MM`.
 *
 * Именно так месяц хранится в `MonthlyMedal.month` (колонка TEXT, не DATE) —
 * формат задан ещё в исходной схеме, и весь остальной код (админ-статистика,
 * история медалей ученика) сравнивает строки. Новые таблицы «мотивашки»
 * используют тот же формат, чтобы не заводить второй.
 */
export const monthKey = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Границы месяца `YYYY-MM` в UTC — для фильтра уроков по startsAt. */
export const monthRange = (month: string): { from: string, to: string } => {
  const [y, m] = month.split('-').map(Number)
  const from = new Date(Date.UTC(y!, m! - 1, 1))
  const to = new Date(Date.UTC(y!, m!, 1))
  return { from: from.toISOString(), to: to.toISOString() }
}
