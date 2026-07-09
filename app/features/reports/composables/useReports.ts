import { useLeads, type LeadWithRelations } from '~/entities/lead'
import type { Database } from '~/shared/types/database.types'

export interface StageHistoryLite {
  leadId: string
  changedAt: string
}

export interface ReportBundle {
  leads: LeadWithRelations[]
  history: StageHistoryLite[]
}

/**
 * CRM-отчёты (ТЗ разд. 2.5). Источник данных — Lead + LeadStageHistory.
 * Продажа = лид с проставленной датой оплаты (paidAt) и суммой (amount).
 * Обработанный лид = лид, у которого в периоде менялся этап или он создан.
 */
export const useReports = () => {
  const supabase = useSupabaseClient<Database>()
  const { fetchLeads } = useLeads()

  const fetchReportData = async (): Promise<ReportBundle> => {
    const [leads, historyRes] = await Promise.all([
      fetchLeads(),
      supabase
        .from('LeadStageHistory')
        .select('leadId, changedAt')
        .order('changedAt', { ascending: false })
    ])
    if (historyRes.error) throw historyRes.error
    return { leads, history: (historyRes.data ?? []) as StageHistoryLite[] }
  }

  return { fetchReportData }
}
