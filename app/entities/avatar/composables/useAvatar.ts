import type { Database } from '~/shared/types/database.types'
import { normalizeConfig, type AvatarConfig } from '~/shared/lib/avatarCatalog'

export interface AvatarState {
  studentId: string | null
  config: AvatarConfig
  ownedStored: string[]
}

/** Аватар ученика (ТЗ разд. 5): загрузка/сохранение конфига + покупка. */
export const useAvatar = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchState = async (): Promise<AvatarState> => {
    const { data: student } = await supabase.from('Student').select('id').maybeSingle()
    const studentId = student?.id ?? null

    const { data: row } = await supabase
      .from('StudentAvatar')
      .select('config, owned')
      .maybeSingle()

    return {
      studentId,
      config: normalizeConfig(row?.config),
      ownedStored: (row?.owned ?? []) as string[]
    }
  }

  /** Надеть предмет / сменить цвет — сохраняет весь конфиг. */
  const saveConfig = async (studentId: string, config: AvatarConfig): Promise<void> => {
    const { error } = await supabase
      .from('StudentAvatar')
      .upsert({ studentId, config } as never, { onConflict: 'studentId' })
    if (error) throw error
  }

  /** Купить предмет за Linga Coins (атомарно на сервере). */
  const buyItem = (itemId: string) =>
    $fetch<{ owned: string[], balance: number }>('/api/student/avatar/buy', {
      method: 'POST',
      body: { itemId }
    })

  return { fetchState, saveConfig, buyItem }
}
