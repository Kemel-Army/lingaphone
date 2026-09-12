import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

// ТЗ разд. 2.1/6 — интеграция мессенджеров через Wazzup24 (path A, iframe).
// Возвращает URL встраиваемого чата. Требует WAZZUP_API_KEY.
const bodySchema = z.object({
  scope: z.enum(['global', 'card']).default('global'),
  chatType: z.string().optional(),
  chatId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  // Раньше роль читалась только из JWT-claim `user_role`. Если токен выдан до
  // включения custom_access_token_hook (или хук выключен), claim пустой — и
  // мессенджер отдавал 403 вообще всем, включая админов. requireRole умеет
  // падать обратно на User.role в БД.
  const caller = await requireRole(event, ['ADMIN', 'TEACHER', 'DIRECTOR'])

  const key = useRuntimeConfig().wazzupApiKey
  if (!key) {
    throw createError({ statusCode: 503, message: 'WAZZUP_API_KEY не настроен. Добавьте ключ Wazzup24 в .env.' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const authId = (caller.sub as string | undefined) ?? caller.id
  const supabase = serverSupabaseServiceRole<Database>(event)
  const { data: userRow } = await supabase
    .from('User')
    .select('id, name, surname, phone')
    .eq('authId', authId)
    .maybeSingle()
  if (!userRow) throw createError({ statusCode: 404, message: 'User not found' })

  const wazzupUserName = `${userRow.surname} ${userRow.name}`.trim() || 'Сотрудник'

  // Wazzup отклоняет номер в любом формате кроме голых цифр и валит весь
  // sync-users, из-за чего чат не открывается вообще. Кривой номер лучше не
  // слать: он нужен только для сопоставления сотрудника с личным WhatsApp.
  const phoneDigits = userRow.phone ? normalizeKzPhone(userRow.phone) : ''
  const phone = isUsablePhone(phoneDigits) ? phoneDigits : undefined

  try {
    // Wazzup требует, чтобы юзер был известен CRM-интеграции до запроса iframe.
    await $fetch('https://api.wazzup24.com/v3/users', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: [{ id: userRow.id, name: wazzupUserName, phone }]
    })
  } catch (e: unknown) {
    throw createError({ statusCode: 502, message: `Wazzup (sync-users): ${wazzupError(e)}` })
  }

  const payload: Record<string, unknown> = {
    user: { id: userRow.id, name: wazzupUserName },
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
    throw createError({ statusCode: 502, message: `Wazzup: ${wazzupError(e)}` })
  }
})

/**
 * Wazzup возвращает ошибки тремя разными способами (`description`, `error`,
 * массив `errors`). Без разбора всех трёх в UI попадало безликое «Ошибка
 * Wazzup», и понять, что именно не так с интеграцией, было невозможно.
 */
function wazzupError(e: unknown): string {
  const data = (e as { data?: {
    description?: string
    error?: string
    errors?: { code?: string, message?: string }[]
  } })?.data

  if (data?.errors?.length) {
    return data.errors.map(x => [x.code, x.message].filter(Boolean).join(': ')).join('; ')
  }
  return data?.description ?? data?.error ?? (e as { message?: string })?.message ?? 'неизвестная ошибка'
}
