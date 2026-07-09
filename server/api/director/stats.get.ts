import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

// Директорская сводка (ТЗ разд. 7/8). Service role, доступ DIRECTOR/ADMIN.
// ?branchId=<uuid> — по филиалу; без него — по всей сети.
export default defineEventHandler(async (event) => {
  await requireRole(event, ['DIRECTOR', 'ADMIN'])
  const branchId = (getQuery(event).branchId as string) || null
  const supabase = serverSupabaseServiceRole<Database>(event)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const inMonth = (iso: string | null) => {
    if (!iso) return false
    const t = new Date(iso).getTime()
    return t >= monthStart && t < monthEnd
  }

  let groupsQ = supabase.from('Group').select('id, maxStudents, teacherId, archivedAt, branchId')
  if (branchId) groupsQ = groupsQ.eq('branchId', branchId)
  const { data: groups } = await groupsQ
  const activeGroups = (groups ?? []).filter(g => !g.archivedAt)
  const activeGroupIds = new Set(activeGroups.map(g => g.id))

  const { data: members } = await supabase.from('GroupMember').select('groupId, studentId').eq('status', 'ACTIVE')
  const branchMembers = (members ?? []).filter(m => activeGroupIds.has(m.groupId))
  const studentIdSet = new Set(branchMembers.map(m => m.studentId))
  const activeStudents = studentIdSet.size

  let totalStudents = activeStudents
  if (!branchId) {
    const { count } = await supabase.from('Student').select('id', { count: 'exact', head: true })
    totalStudents = count ?? 0
  }

  let leadsQ = supabase.from('Lead').select('stage, trialLessonAt, paidAt, createdAt, branchId')
  if (branchId) leadsQ = leadsQ.eq('branchId', branchId)
  const { data: leads } = await leadsQ
  const newLeadsMonth = (leads ?? []).filter(l => inMonth(l.createdAt)).length
  const trialsCount = (leads ?? []).filter(l => l.trialLessonAt).length
  const salesCount = (leads ?? []).filter(l => l.stage === 'ACTIVE' || l.paidAt).length
  const conversionPct = trialsCount ? Math.round((salesCount / trialsCount) * 100) : 0

  let payQ = supabase.from('Payment').select('amount, paidAt, status, branchId').eq('status', 'COMPLETED')
  if (branchId) payQ = payQ.eq('branchId', branchId)
  const { data: payments } = await payQ
  const monthPayments = (payments ?? []).filter(p => inMonth(p.paidAt))
  const revenueMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0)
  const revenueTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)

  let subQ = supabase.from('Subscription').select('price, status, nextPaymentAt, branchId')
  if (branchId) subQ = subQ.eq('branchId', branchId)
  const { data: subs } = await subQ
  const debt = (subs ?? [])
    .filter(s => s.status === 'ACTIVE' && s.nextPaymentAt && new Date(s.nextPaymentAt).getTime() < todayMs)
    .reduce((s, sub) => s + Number(sub.price), 0)

  const groupsCapacity = activeGroups.reduce((s, g) => s + (g.maxStudents ?? 0), 0)
  const groupsFilled = branchMembers.length
  const groupLoadPct = groupsCapacity ? Math.round((groupsFilled / groupsCapacity) * 100) : 0

  const { data: teachers } = await supabase.from('Teacher').select('id, rating, reviewCount, user:User(name, surname)')
  const groupCountByTeacher = new Map<string, number>()
  for (const g of activeGroups) groupCountByTeacher.set(g.teacherId, (groupCountByTeacher.get(g.teacherId) ?? 0) + 1)
  type TeacherRow = { id: string, rating: number, reviewCount: number, user: { name: string, surname: string } | null }
  const topTeachers = ((teachers ?? []) as unknown as TeacherRow[])
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
    totalStudents,
    activeStudents,
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
})
