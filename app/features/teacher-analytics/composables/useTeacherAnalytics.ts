import type { Database } from '~/shared/types/database.types'

export interface LaggingStudent {
  studentId: string
  name: string
  avgGrade: number
  attendancePct: number
}

export interface GroupAnalytics {
  groupId: string
  name: string
  studentCount: number
  avgGrade: number
  attendancePct: number
  hwCompletionPct: number
  laggingCount: number
  lagging: LaggingStudent[]
}

/**
 * Учительская аналитика (ТЗ разд. 3.5): по каждой группе — средний балл,
 * посещаемость, выполнение ДЗ, отстающие ученики. Данные под RLS (свои группы).
 */
export const useTeacherAnalytics = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchGroupAnalytics = async (): Promise<GroupAnalytics[]> => {
    const { data: members, error } = await supabase
      .from('GroupMember')
      .select('groupId, studentId, group:Group(name), student:Student(user:User(name, surname))')
      .eq('status', 'ACTIVE')
    if (error) throw error

    type M = { groupId: string, studentId: string, group: { name: string } | null, student: { user: { name: string, surname: string } | null } | null }
    const rows = (members ?? []) as unknown as M[]
    const studentIds = [...new Set(rows.map(r => r.studentId))]
    if (!studentIds.length) return []

    const [gradesRes, attRes, hwRes] = await Promise.all([
      // Оценки по критериям (шкала та же, 1-5). Старая таблица Grade больше
      // не заполняется, и средний балл по ней всегда выходил нулевым.
      supabase.from('LessonCriterionGrade').select('studentId, value').in('studentId', studentIds),
      supabase.from('Attendance').select('studentId, status').in('studentId', studentIds),
      supabase.from('HomeworkSubmission').select('studentId, status').in('studentId', studentIds)
    ])
    const grades = gradesRes.data ?? []
    const att = attRes.data ?? []
    const hw = hwRes.data ?? []

    // Per-student aggregates.
    const gradeByStudent = new Map<string, number[]>()
    for (const g of grades) {
      const arr = gradeByStudent.get(g.studentId)
      if (arr) arr.push(g.value)
      else gradeByStudent.set(g.studentId, [g.value])
    }
    const attByStudent = new Map<string, { present: number, total: number }>()
    for (const a of att) {
      const rec = attByStudent.get(a.studentId) ?? { present: 0, total: 0 }
      rec.total++
      if (a.status === 'PRESENT') rec.present++
      attByStudent.set(a.studentId, rec)
    }
    const avgOf = (arr: number[] | undefined) => arr && arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
    const attPctOf = (id: string) => {
      const r = attByStudent.get(id)
      return r && r.total ? Math.round((r.present / r.total) * 100) : 0
    }

    // Group rows by group.
    const groups = new Map<string, { name: string, members: M[] }>()
    for (const r of rows) {
      const grp = groups.get(r.groupId) ?? { name: r.group?.name ?? '', members: [] }
      grp.members.push(r)
      groups.set(r.groupId, grp)
    }

    const hwDone = hw.filter(h => h.status === 'SUBMITTED' || h.status === 'CHECKED').length
    const hwTotalAll = hw.length
    const hwCompletion = hwTotalAll ? Math.round((hwDone / hwTotalAll) * 100) : 0

    return [...groups.entries()].map(([groupId, grp]) => {
      const memberIds = grp.members.map(m => m.studentId)
      const avgs = memberIds.map(id => avgOf(gradeByStudent.get(id))).filter(v => v > 0)
      const avgGrade = avgs.length ? avgs.reduce((s, v) => s + v, 0) / avgs.length : 0
      const attPcts = memberIds.map(id => attPctOf(id)).filter(v => v > 0)
      const attendancePct = attPcts.length ? Math.round(attPcts.reduce((s, v) => s + v, 0) / attPcts.length) : 0

      const lagging: LaggingStudent[] = grp.members
        .map((m) => {
          const avg = avgOf(gradeByStudent.get(m.studentId))
          return {
            studentId: m.studentId,
            name: m.student?.user ? `${m.student.user.surname} ${m.student.user.name}`.trim() : '—',
            avgGrade: avg,
            attendancePct: attPctOf(m.studentId)
          }
        })
        .filter(s => (s.avgGrade > 0 && s.avgGrade < 3.5) || (s.attendancePct > 0 && s.attendancePct < 60))
        .sort((a, b) => a.avgGrade - b.avgGrade)

      return {
        groupId,
        name: grp.name,
        studentCount: grp.members.length,
        avgGrade,
        attendancePct,
        hwCompletionPct: hwCompletion,
        laggingCount: lagging.length,
        lagging
      }
    })
  }

  return { fetchGroupAnalytics }
}
