import { z } from 'zod'

const bodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/),
  nickname: z.string().min(1).max(20).trim(),
  avatar: z.string().min(1).max(20)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Find session
  const { data: sessionRaw, error: sessErr } = await supabase
    .from('BattleSession')
    .select('id, status')
    .eq('pin', body.pin)
    .maybeSingle()
  if (sessErr) throw createError({ statusCode: 500, message: sessErr.message })
  const session = sessionRaw as { id: string, status: string } | null
  if (!session) {
    throw createError({ statusCode: 404, message: 'Игра с таким PIN не найдена' })
  }
  if (session.status === 'ENDED') {
    throw createError({ statusCode: 410, message: 'Игра уже закончилась' })
  }
  if (session.status === 'IN_PROGRESS') {
    throw createError({ statusCode: 409, message: 'Игра уже началась — нельзя присоединиться' })
  }

  // Check nickname uniqueness inside session
  const { data: existing } = await supabase
    .from('BattlePlayer')
    .select('id')
    .eq('sessionId', session.id)
    .eq('nickname', body.nickname)
    .is('leftAt', null)
    .maybeSingle()
  if (existing) {
    throw createError({ statusCode: 409, message: 'Имя уже занято — попробуй другое' })
  }

  // Insert player
  const { data: playerRaw, error: insErr } = await supabase
    .from('BattlePlayer')
    .insert({
      sessionId: session.id,
      nickname: body.nickname,
      avatar: body.avatar
    })
    .select()
    .single()
  if (insErr) throw createError({ statusCode: 500, message: insErr.message })

  return { player: playerRaw, sessionId: session.id }
})
