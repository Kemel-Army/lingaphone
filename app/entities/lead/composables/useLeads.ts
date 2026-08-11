import { useCurrentUser } from '~/entities/user'
import type { Database } from '~/shared/types/database.types'
import type {
  LeadWithRelations,
  LeadInsert,
  LeadUpdate,
  LeadStage,
  LeadStageHistoryRow,
  AdminOption
} from '../model/types'

const LEAD_SELECT = `
  *,
  responsible:User!Lead_responsibleId_fkey(id, name, surname),
  branch:Branch!Lead_branchId_fkey(id, name),
  trialTeacher:Teacher!Lead_trialTeacherId_fkey(id, user:User(name, surname))
` as const

/**
 * CRM: работа с лидами и воронкой продаж (ТЗ разд. 2.3).
 * Все запросы под RLS — только для роли ADMIN.
 */
export const useLeads = () => {
  const supabase = useSupabaseClient<Database>()
  const { internalId } = useCurrentUser()

  const fetchLeads = async (): Promise<LeadWithRelations[]> => {
    const { data, error } = await supabase
      .from('Lead')
      .select(LEAD_SELECT)
      .order('createdAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as LeadWithRelations[]
  }

  const fetchLead = async (id: string): Promise<LeadWithRelations | null> => {
    const { data, error } = await supabase
      .from('Lead')
      .select(LEAD_SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return (data as unknown as LeadWithRelations | null) ?? null
  }

  const createLead = async (payload: LeadInsert): Promise<LeadWithRelations> => {
    const { data, error } = await supabase
      .from('Lead')
      .insert(payload)
      .select(LEAD_SELECT)
      .single()
    if (error) throw error
    const lead = data as unknown as LeadWithRelations
    await supabase.from('LeadStageHistory').insert({
      leadId: lead.id,
      fromStage: null,
      toStage: lead.stage,
      changedById: internalId.value
    })
    return lead
  }

  const updateLead = async (id: string, patch: LeadUpdate): Promise<LeadWithRelations> => {
    const { data, error } = await supabase
      .from('Lead')
      .update(patch)
      .eq('id', id)
      .select(LEAD_SELECT)
      .single()
    if (error) throw error
    return data as unknown as LeadWithRelations
  }

  /**
   * Перемещение лида по воронке. Пишет историю этапов + проставляет
   * служебные даты (оплата / конвертация в клиента).
   */
  const moveStage = async (
    lead: Pick<LeadWithRelations, 'id' | 'stage' | 'paidAt' | 'convertedAt'>,
    toStage: LeadStage,
    convertedStudentId?: string
  ): Promise<LeadWithRelations | null> => {
    if (lead.stage === toStage) return null
    const patch: LeadUpdate = { stage: toStage }
    const nowIso = new Date().toISOString()
    if (toStage === 'PAYMENT' && !lead.paidAt) patch.paidAt = nowIso
    if (toStage === 'ACTIVE' && !lead.convertedAt) patch.convertedAt = nowIso
    if (toStage === 'ACTIVE' && convertedStudentId) patch.convertedStudentId = convertedStudentId

    const { data, error } = await supabase
      .from('Lead')
      .update(patch)
      .eq('id', lead.id)
      .select(LEAD_SELECT)
      .single()
    if (error) throw error

    await supabase.from('LeadStageHistory').insert({
      leadId: lead.id,
      fromStage: lead.stage,
      toStage,
      changedById: internalId.value
    })
    return data as unknown as LeadWithRelations
  }

  /** «Закрепить за собой» — раздел «Я ответственный» (ТЗ). */
  const claimLead = (id: string) => updateLead(id, { responsibleId: internalId.value })

  const assignResponsible = (id: string, userId: string | null) =>
    updateLead(id, { responsibleId: userId })

  const deleteLead = async (id: string): Promise<void> => {
    const { error } = await supabase.from('Lead').delete().eq('id', id)
    if (error) throw error
  }

  const fetchStageHistory = async (leadId: string): Promise<LeadStageHistoryRow[]> => {
    const { data, error } = await supabase
      .from('LeadStageHistory')
      .select('*')
      .eq('leadId', leadId)
      .order('changedAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as LeadStageHistoryRow[]
  }

  /** Администраторы — для селектов «ответственный» и назначения задач. */
  const fetchAdmins = async (): Promise<AdminOption[]> => {
    const { data, error } = await supabase
      .from('User')
      .select('id, name, surname')
      .eq('role', 'ADMIN')
      .order('surname', { ascending: true })
    if (error) throw error
    return (data ?? []) as AdminOption[]
  }

  /** Филиалы — для селекта филиала лида. */
  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('Branch')
      .select('id, name')
      .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  /**
   * Конвертация лида в реальный аккаунт ученика — одним атомарным вызовом.
   * Сервер создаёт auth-пользователя, User и Student, переводит лид в ACTIVE
   * и связывает его с учеником; при падении любого шага всё откатывается,
   * поэтому повтор безопасен. См. server/api/admin/leads/[id]/convert.post.ts
   */
  const convertToStudent = async (leadId: string, payload: {
    name: string
    surname: string
    email: string
    password: string
    phone?: string
    patronymic?: string
    birthdate?: string
    schoolGrade?: number
    iin?: string
    level?: string
  }): Promise<{ success: boolean, userId: string, studentId: string }> => {
    return await $fetch(`/api/admin/leads/${leadId}/convert`, {
      method: 'POST',
      body: payload
    })
  }

  return {
    fetchLeads,
    fetchLead,
    createLead,
    updateLead,
    moveStage,
    claimLead,
    assignResponsible,
    deleteLead,
    fetchStageHistory,
    fetchAdmins,
    fetchBranches,
    convertToStudent
  }
}
