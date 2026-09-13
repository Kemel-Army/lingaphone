import type { Database } from '~/shared/types/database.types'

export interface TopTeacher {
  id: string
  name: string
  rating: number
  reviewCount: number
  groupCount: number
}

export interface DirectorStats {
  totalStudents: number
  activeStudents: number
  newLeadsMonth: number
  paymentsMonthCount: number
  revenueMonth: number
  revenueTotal: number
  conversionPct: number
  trialsCount: number
  salesCount: number
  debt: number
  groupLoadPct: number
  groupsFilled: number
  groupsCapacity: number
  topTeachers: TopTeacher[]
}

/**
 * Директорский обзор (ТЗ разд. 7): сводные KPI по всей платформе —
 * ученики, лиды, оплаты, конверсия, выручка, задолженность, загрузка групп,
 * рейтинг преподавателей. Считается из Lead/Payment/Subscription/Group/Teacher.
 */
export const useDirectorStats = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchStats = async (): Promise<DirectorStats> => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const inMonth = (iso: string | null) => {
      if (!iso) return false
      const t = new Date(iso).getTime()
      return t >= monthStart && t < monthEnd
    }

    const [
      studentsCount, activeCount, leadsRes, paymentsRes, subsRes, groupsRes, membersRes, teachersRes
    ] = await Promise.all([
      supabase.from('Student').select('id', { count: 'exact', head: true }),
      supabase.from('GroupMember').select('studentId', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('Lead').select('stage, trialLessonAt, paidAt, createdAt'),
      supabase.from('Payment').select('amount, paidAt, status').eq('status', 'COMPLETED'),
      supabase.from('Subscription').select('price, status, nextPaymentAt'),
      supabase.from('Group').select('id, maxStudents, teacherId, archivedAt').eq('isService', false),
      supabase.from('GroupMember').select('groupId').eq('status', 'ACTIVE'),
      supabase.from('Teacher').select('id, rating, reviewCount, user:User(name, surname)')
    ])

    const leads = leadsRes.data ?? []
    const payments = paymentsRes.data ?? []
    const subs = subsRes.data ?? []
    const groups = (groupsRes.data ?? []).filter(g => !g.archivedAt)
    const members = membersRes.data ?? []
    const teachers = teachersRes.data ?? []

    const newLeadsMonth = leads.filter(l => inMonth(l.createdAt)).length
    const monthPayments = payments.filter(p => inMonth(p.paidAt))
    const revenueMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0)
    const revenueTotal = payments.reduce((s, p) => s + Number(p.amount), 0)

    const trialsCount = leads.filter(l => l.trialLessonAt).length
    const salesCount = leads.filter(l => l.stage === 'ACTIVE' || l.paidAt).length
    const conversionPct = trialsCount ? Math.round((salesCount / trialsCount) * 100) : 0

    const debt = subs
      .filter(s => s.status === 'ACTIVE' && s.nextPaymentAt && new Date(s.nextPaymentAt).getTime() < todayMs)
      .reduce((s, sub) => s + Number(sub.price), 0)

    const groupsCapacity = groups.reduce((s, g) => s + (g.maxStudents ?? 0), 0)
    const activeGroupIds = new Set(groups.map(g => g.id))
    const groupsFilled = members.filter(m => activeGroupIds.has(m.groupId)).length
    const groupLoadPct = groupsCapacity ? Math.round((groupsFilled / groupsCapacity) * 100) : 0

    const groupCountByTeacher = new Map<string, number>()
    for (const g of groups) groupCountByTeacher.set(g.teacherId, (groupCountByTeacher.get(g.teacherId) ?? 0) + 1)

    type TeacherRow = { id: string, rating: number, reviewCount: number, user: { name: string, surname: string } | null }
    const topTeachers: TopTeacher[] = (teachers as unknown as TeacherRow[])
      .map(t => ({
        id: t.id,
        name: t.user ? `${t.user.surname} ${t.user.name}`.trim() : '—',
        rating: t.rating,
        reviewCount: t.reviewCount,
        groupCount: groupCountByTeacher.get(t.id) ?? 0
      }))
      .sort((a, b) => b.rating - a.rating || b.groupCount - a.groupCount)
      .slice(0, 5)

    return {
      totalStudents: studentsCount.count ?? 0,
      activeStudents: activeCount.count ?? 0,
      newLeadsMonth,
      paymentsMonthCount: monthPayments.length,
      revenueMonth,
      revenueTotal,
      conversionPct,
      trialsCount,
      salesCount,
      debt,
      groupLoadPct,
      groupsFilled,
      groupsCapacity,
      topTeachers
    }
  }

  return { fetchStats }
}
