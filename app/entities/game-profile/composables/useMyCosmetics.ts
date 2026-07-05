import type { Database } from '~/shared/types/database.types'

/**
 * useMyCosmetics — надетая косметика текущего ученика (аватар-персонаж +
 * рамка), готовая к передаче в <UserAvatar>. Работает для любой роли:
 * у не-студентов Student-строка не читается (RLS) → возвращает пустышку,
 * и аватар рисуется как обычно (фото/инициалы).
 *
 * Данные шарятся между вызовами по ключу useAsyncData ('my-cosmetics'),
 * поэтому сайдбар, дашборд и магазин видят одно и то же. После покупки/
 * надевания дёргай refresh(), чтобы аватар обновился сразу везде.
 */

type FrameStyle = 'starry' | 'galactic' | 'blackhole'
const FRAME_STYLES = new Set<FrameStyle>(['starry', 'galactic', 'blackhole'])

export const useMyCosmetics = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const { data, refresh } = useAsyncData(
    'my-cosmetics',
    async () => {
      if (!user.value) return null

      // RLS отдаёт только собственную Student-строку; для teacher/admin — пусто.
      const { data: student } = await supabase
        .from('Student')
        .select('id')
        .maybeSingle()
      if (!student) return null

      // select('*') держит компиляцию до регенерации database.types.ts
      // (столбец activeAvatarId добавлен миграцией 20260708000000).
      const { data: prof } = await supabase
        .from('StudentGameProfile')
        .select('*')
        .eq('studentId', student.id)
        .maybeSingle()
      if (!prof) return null

      const p = prof as unknown as { activeAvatarId: string | null, activeFrameId: string | null }
      const ids = [p.activeAvatarId, p.activeFrameId].filter((v): v is string => !!v)
      if (!ids.length) return { avatarEmoji: null, avatarBg: null, frameStyle: null }

      const { data: items } = await supabase
        .from('ShopItem')
        .select('id, effect')
        .in('id', ids)

      const byId = new Map((items ?? []).map((i: { id: string, effect: unknown }) => [i.id, i.effect]))

      const avatarEffect = p.activeAvatarId ? byId.get(p.activeAvatarId) as Record<string, unknown> | undefined : undefined
      const frameEffect = p.activeFrameId ? byId.get(p.activeFrameId) as Record<string, unknown> | undefined : undefined

      const rawStyle = frameEffect?.style
      const frameStyle: FrameStyle | null = typeof rawStyle === 'string' && FRAME_STYLES.has(rawStyle as FrameStyle)
        ? rawStyle as FrameStyle
        : null

      return {
        avatarEmoji: typeof avatarEffect?.emoji === 'string' ? avatarEffect.emoji : null,
        avatarBg: typeof avatarEffect?.bg === 'string' ? avatarEffect.bg : null,
        frameStyle
      }
    },
    { watch: [user], server: false }
  )

  const avatarEmoji = computed(() => data.value?.avatarEmoji ?? null)
  const avatarBg = computed(() => data.value?.avatarBg ?? null)
  const frameStyle = computed<FrameStyle | null>(() => data.value?.frameStyle ?? null)

  return { avatarEmoji, avatarBg, frameStyle, refresh }
}
