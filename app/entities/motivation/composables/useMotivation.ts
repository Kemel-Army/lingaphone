import type {
  CriteriaJournal,
  GradeCriterion,
  MonthlySummary,
  StudentMonth
} from '../model/types'

/**
 * Доступ к «мотивашке». Всё через server routes, а не напрямую в Supabase:
 * расчёт среднего балла и медали живёт на сервере в одном экземпляре, и
 * дублировать его на клиенте — верный способ получить два разных ответа.
 */
export const useMotivation = () => {
  // useRequestFetch пробрасывает куки входящего запроса во время SSR. С голым
  // $fetch на сервере кук нет → маршрут отвечает 401 → при перезагрузке
  // страницы пользователь видит пустой журнал (тот же фикс, что в useMyPath).
  const request = useRequestFetch()

  /** Журнал оценок по 5 критериям для группы за месяц. */
  const fetchJournal = (groupId: string, month: string) =>
    request<CriteriaJournal>('/api/teacher/criteria-grades', { query: { groupId, month } })

  /** Сохранить оценки ученика за один урок. `null` снимает оценку. */
  const saveCriteriaGrades = (
    lessonId: string,
    studentId: string,
    values: Partial<Record<GradeCriterion, number | null>>
  ) =>
    $fetch<{ ok: boolean, saved: number, cleared: number }>('/api/teacher/criteria-grades', {
      method: 'POST',
      body: { lessonId, studentId, values }
    })

  /**
   * Мотивация одного ученика за месяц: уроки с пятью оценками, итог и история
   * медалей. `studentId` нужен родителю и преподавателю; ученик всегда
   * получает свой дневник, что бы ни передал.
   */
  const fetchStudentMonth = (month?: string, studentId?: string) =>
    request<StudentMonth>('/api/student/motivation', {
      query: { ...(month ? { month } : {}), ...(studentId ? { studentId } : {}) }
    })

  /** Сводная за месяц — считается на лету, ничего не фиксирует. */
  const fetchSummary = (month: string, groupId?: string | null) =>
    request<MonthlySummary>('/api/admin/motivation', {
      query: { month, ...(groupId ? { groupId } : {}) }
    })

  /** Менеджерские параметры месяца (Instagram / оплата / книги / абонемент). */
  const saveManagerInputs = (payload: {
    month: string
    studentId: string
    instagram: boolean
    paidOnTime: boolean
    books: boolean
    subscriptionLessons: number
    note?: string | null
  }) => $fetch<{ ok: boolean }>('/api/admin/motivation/inputs', { method: 'POST', body: payload })

  /** Зафиксировать итоги месяца в MonthlyMedal (и опционально начислить монеты). */
  const recompute = (month: string, awardCoins = false) =>
    $fetch<{
      ok: boolean
      month: string
      saved: number
      totals: MonthlySummary['totals']
      coinsAwarded: number
    }>('/api/admin/motivation/recompute', { method: 'POST', body: { month, awardCoins } })

  return {
    fetchJournal,
    saveCriteriaGrades,
    fetchStudentMonth,
    fetchSummary,
    saveManagerInputs,
    recompute
  }
}
