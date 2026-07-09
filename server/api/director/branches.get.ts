import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

// Список филиалов + сводные счётчики (ТЗ разд. 8). DIRECTOR/ADMIN.
export default defineEventHandler(async (event) => {
  await requireRole(event, ['DIRECTOR', 'ADMIN'])
  const supabase = serverSupabaseServiceRole<Database>(event)

  const [branchesRes, groupsRes, membersRes, leadsRes, paymentsRes] = await Promise.all([
    supabase.from('Branch').select('id, name, kind, address, city').order('name'),
    supabase.from('Group').select('id, branchId, archivedAt'),
    supabase.from('GroupMember').select('groupId, studentId').eq('status', 'ACTIVE'),
    supabase.from('Lead').select('id, branchId'),
    supabase.from('Payment').select('amount, branchId, status').eq('status', 'COMPLETED')
  ])

  const groups = groupsRes.data ?? []
  const members = membersRes.data ?? []
  const leads = leadsRes.data ?? []
  const payments = paymentsRes.data ?? []

  const groupsByBranch = new Map<string, Set<string>>()
  for (const g of groups) {
    if (!g.branchId || g.archivedAt) continue
    const set = groupsByBranch.get(g.branchId) ?? new Set<string>()
    set.add(g.id)
    groupsByBranch.set(g.branchId, set)
  }

  return (branchesRes.data ?? []).map((b) => {
    const groupIds = groupsByBranch.get(b.id) ?? new Set<string>()
    const students = new Set(members.filter(m => groupIds.has(m.groupId)).map(m => m.studentId))
    return {
      ...b,
      groupsCount: groupIds.size,
      studentsCount: students.size,
      leadsCount: leads.filter(l => l.branchId === b.id).length,
      revenue: payments.filter(p => p.branchId === b.id).reduce((s, p) => s + Number(p.amount), 0)
    }
  })
})
