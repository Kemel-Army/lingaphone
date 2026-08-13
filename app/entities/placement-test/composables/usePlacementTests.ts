import type { Database } from '~/shared/types/database.types'
import type { PlacementTestRecord } from '../model/types'

const SELECT = 'id, leadId, ageBand, fullName, phone, autoScore, autoMax, skippedCount, recommendedLevel, openAnswers, createdAt' as const

/**
 * Результаты входного тестирования. RLS отдаёт их только сотрудникам
 * (ADMIN / DIRECTOR / TEACHER) — писать может лишь service role, см. миграцию
 * 20260813220000_placement_test.sql.
 */
export const usePlacementTests = () => {
  const supabase = useSupabaseClient<Database>()

  /** Все попытки лида, свежие сверху. Пустой массив = тест не проходили. */
  const fetchByLead = async (leadId: string): Promise<PlacementTestRecord[]> => {
    const { data, error } = await supabase
      .from('PlacementTest')
      .select(SELECT)
      .eq('leadId', leadId)
      .order('createdAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as PlacementTestRecord[]
  }

  /**
   * Попытки сразу для списка лидов — чтобы список не делал запрос на строку.
   * Возвращает leadId -> самая свежая попытка.
   */
  const fetchLatestForLeads = async (leadIds: string[]): Promise<Record<string, PlacementTestRecord>> => {
    if (leadIds.length === 0) return {}
    const { data, error } = await supabase
      .from('PlacementTest')
      .select(SELECT)
      .in('leadId', leadIds)
      .order('createdAt', { ascending: false })
    if (error) throw error

    const out: Record<string, PlacementTestRecord> = {}
    for (const row of (data ?? []) as unknown as PlacementTestRecord[]) {
      // Порядок по убыванию даты — первая запись на лид и есть последняя попытка.
      if (!out[row.leadId]) out[row.leadId] = row
    }
    return out
  }

  return { fetchByLead, fetchLatestForLeads }
}
