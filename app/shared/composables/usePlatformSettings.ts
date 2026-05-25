import type { TablesInsert } from '~/shared/types/database.types'

interface PlatformSettingsRow {
  key: string
  value: unknown
}

/**
 * Composable for PlatformSettings (key-value store in DB).
 * Admin-only table with RLS.
 */
export const usePlatformSettings = () => {
  const supabase = useTypedSupabaseClient()

  const fetchAll = async (): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase
      .from('PlatformSettings')
      .select('key, value')
    if (error) throw error
    const result: Record<string, unknown> = {}
    for (const row of (data ?? []) as unknown as PlatformSettingsRow[]) {
      result[row.key] = row.value
    }
    return result
  }

  const upsert = async (key: string, value: unknown): Promise<void> => {
    const { error } = await supabase
      .from('PlatformSettings')
      .upsert({ key, value, updatedAt: new Date().toISOString() } as TablesInsert<'PlatformSettings'>, { onConflict: 'key' })
    if (error) throw error
  }

  const bulkUpsert = async (settings: Record<string, unknown>): Promise<void> => {
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updatedAt: new Date().toISOString()
    }))
    const { error } = await supabase
      .from('PlatformSettings')
      .upsert(rows as TablesInsert<'PlatformSettings'>[], { onConflict: 'key' })
    if (error) throw error
  }

  return { fetchAll, upsert, bulkUpsert }
}
