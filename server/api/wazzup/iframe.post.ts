import { z } from 'zod'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

// ТЗ разд. 2.1/6 — интеграция мессенджеров через Wazzup24 (path A, iframe).
// Возвращает URL встраиваемого чата. Требует WAZZUP_API_KEY.
const bodySchema = z.object({
  scope: z.enum(['global', 'card']).default('global'),
  chatType: z.string().optional(),
  chatId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const role = (caller as unknown as { user_role?: string }).user_role ?? caller.app_metadata?.role
  if (role !== 'ADMIN' && role !== 'TEACHER') throw createError({ statusCode: 403, message: 'Forbidden' })

  const key = useRuntimeConfig().wazzupApiKey
  if (!key) {
    throw createError({ statusCode: 503, message: 'WAZZUP_API_KEY не настроен. Добавьте ключ Wazzup24 в .env.' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const authId = (caller.sub as string | undefined) ?? caller.id
  const supabase = serverSupabaseServiceRole<Database>(event)
  const { data: userRow } = await supabase
    .from('User')
    .select('id, name, surname')
    .eq('authId', authId)
    .maybeSingle()
  if (!userRow) throw createError({ statusCode: 404, message: 'User not found' })

  const payload: Record<string, unknown> = {
    user: { id: userRow.id, name: `${userRow.surname} ${userRow.name}`.trim() },
    scope: body.scope
  }
  if (body.scope === 'card' && body.chatType && body.chatId) {
    payload.filter = [{ chatType: body.chatType, chatId: body.chatId }]
    payload.activeChat = { chatType: body.chatType, chatId: body.chatId }
  }

  try {
    const res = await $fetch<{ url: string }>('https://api.wazzup24.com/v3/iframe', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: payload
    })
    return { url: res.url }
  } catch (e: unknown) {
    const msg = (e as { data?: { description?: string }, message?: string })?.data?.description
      ?? (e as { message?: string })?.message ?? 'Ошибка Wazzup'
    throw createError({ statusCode: 502, message: `Wazzup: ${msg}` })
  }
})
