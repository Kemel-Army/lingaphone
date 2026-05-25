import { z } from 'zod'

const bodySchema = z.object({
  sessionId: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  await requireBattleHost(event, body.sessionId)
  const supabase = useServerSupabase(event)

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('BattleSession')
    .update({
      status: 'ENDED',
      endedAt: now,
      updatedAt: now
    })
    .eq('id', body.sessionId)
    .select()
    .single()
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { session: data }
})
