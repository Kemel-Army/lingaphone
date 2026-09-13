import type { Database } from '~/shared/types/database.types'

// ТЗ разд. 2.1/6 — автосоздание лида по первому входящему сообщению в Wazzup24.
// Пока только WhatsApp: там chatId — это сразу номер телефона, и дедуп идёт по
// generated-колонке Lead.phoneDigits (см. server/utils/phoneKz.ts). У Instagram/
// Telegram Wazzup номера в вебхуке не отдаёт — chatId там id чата, а не телефон,
// так что надёжно завести лид без ручного ввода не получится.
//
// Wazzup не подписывает запросы — секрет передаётся в самом URL (?token=),
// который прописывается один раз при регистрации через POST /v3/webhooks
// (messagesUri). Смотри WAZZUP_WEBHOOK_SECRET в .env.

interface WazzupWebhookMessage {
  chatId: string
  chatType: string
  isEcho?: boolean
  text?: string | null
  contact?: { name?: string | null } | null
}

export default defineEventHandler(async (event) => {
  const expected = useRuntimeConfig().wazzupWebhookSecret
  if (!expected) throw createError({ statusCode: 503, message: 'WAZZUP_WEBHOOK_SECRET не настроен' })
  if (getQuery(event).token !== expected) throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody<{ messages?: WazzupWebhookMessage[] }>(event)
  const messages = body?.messages ?? []
  if (!messages.length) return { ok: true }

  const supabase = useServerSupabase(event)

  for (const msg of messages) {
    // isEcho — исходящее сообщение (наше), не входящее от клиента.
    if (msg.isEcho || msg.chatType !== 'whatsapp') continue

    const phoneDigits = normalizeKzPhone(msg.chatId)
    if (!isUsablePhone(phoneDigits)) continue

    // Лид с этим номером уже есть — не плодим дубли на каждое новое сообщение.
    const { data: existing } = await supabase
      .from('Lead')
      .select('id')
      .eq('phoneDigits', phoneDigits)
      .maybeSingle()
    if (existing) continue

    const { data: lead, error } = await supabase
      .from('Lead')
      .insert({
        fullName: msg.contact?.name?.trim() || 'Клиент из WhatsApp',
        phone: phoneDigits,
        source: 'WHATSAPP' satisfies Database['public']['Enums']['LeadSource'],
        stage: 'NEW' satisfies Database['public']['Enums']['LeadStage'],
        notes: msg.text ? `Первое сообщение (WhatsApp): ${msg.text}` : null
      })
      .select('id, stage')
      .single()

    if (error || !lead) {
      console.error('Wazzup auto-lead: insert failed', error?.message)
      continue
    }

    await supabase.from('LeadStageHistory').insert({
      leadId: lead.id,
      fromStage: null,
      toStage: lead.stage,
      changedById: null
    })
  }

  return { ok: true }
})
