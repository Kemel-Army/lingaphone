import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

// Директорские отчёты (ТЗ разд. 2.5/7) — сводно или по филиалу.
export default defineEventHandler(async (event) => {
  await requireRole(event, ['DIRECTOR', 'ADMIN'])
  const branchId = (getQuery(event).branchId as string) || null
  const supabase = serverSupabaseServiceRole<Database>(event)

  let leadsQ = supabase
    .from('Lead')
    .select('id, fullName, source, stage, trialSuccess, tariff, firstContactAt, paidAt, amount, notes, createdAt, trialTeacherId')
  if (branchId) leadsQ = leadsQ.eq('branchId', branchId)
  const { data: leadsRaw } = await leadsQ
  const leads = leadsRaw ?? []

  // Resolve trial-teacher names.
  const teacherIds = [...new Set(leads.map(l => l.trialTeacherId).filter(Boolean))] as string[]
  const teacherName = new Map<string, string>()
  if (teacherIds.length) {
    const { data: teachers } = await supabase
      .from('Teacher')
      .select('id, user:User(name, surname)')
      .in('id', teacherIds)
    type TR = { id: string, user: { name: string, surname: string } | null }
    for (const t of (teachers ?? []) as unknown as TR[]) {
      teacherName.set(t.id, t.user ? `${t.user.surname} ${t.user.name}`.trim() : '—')
    }
  }

  const leadIds = leads.map(l => l.id)
  let history: { leadId: string, changedAt: string }[] = []
  if (leadIds.length) {
    const { data: hist } = await supabase
      .from('LeadStageHistory')
      .select('leadId, changedAt')
      .in('leadId', leadIds)
    history = (hist ?? []) as { leadId: string, changedAt: string }[]
  }

  return {
    leads: leads.map(l => ({
      id: l.id,
      fullName: l.fullName,
      source: l.source,
      stage: l.stage,
      trialSuccess: l.trialSuccess,
      trialTeacher: l.trialTeacherId ? (teacherName.get(l.trialTeacherId) ?? '—') : '—',
      tariff: l.tariff,
      firstContactAt: l.firstContactAt,
      paidAt: l.paidAt,
      amount: l.amount,
      notes: l.notes,
      createdAt: l.createdAt
    })),
    history
  }
})
