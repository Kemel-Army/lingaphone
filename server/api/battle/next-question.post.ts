import { z } from 'zod'

const bodySchema = z.object({
  sessionId: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  await requireBattleHost(event, body.sessionId)
  const supabase = useServerSupabase(event)

  const { data: sessionRaw, error: sessErr } = await supabase
    .from('BattleSession')
    .select('id, status, currentIndex, questionCount')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (sessErr) throw createError({ statusCode: 500, message: sessErr.message })
  const session = sessionRaw as {
    id: string
    status: string
    currentIndex: number
    questionCount: number
  } | null
  if (!session) throw createError({ statusCode: 404, message: 'Сессия не найдена' })
  if (session.status !== 'IN_PROGRESS') {
    throw createError({ statusCode: 409, message: 'Игра не запущена' })
  }

  const nextIndex = session.currentIndex + 1
  if (nextIndex >= session.questionCount) {
    throw createError({ statusCode: 400, message: 'Это был последний вопрос' })
  }

  const now = new Date().toISOString()

  const { data: updated, error: updErr } = await supabase
    .from('BattleSession')
    .update({
      currentIndex: nextIndex,
      currentQuestionStartAt: now,
      updatedAt: now
    })
    .eq('id', body.sessionId)
    .select()
    .single()
  if (updErr) throw createError({ statusCode: 500, message: updErr.message })

  // Fetch the question for this index (with full question data)
  const { data: sqRaw, error: sqErr } = await supabase
    .from('BattleSessionQuestion')
    .select('id, orderIndex, question:BattleQuestion(*)')
    .eq('sessionId', body.sessionId)
    .eq('orderIndex', nextIndex)
    .single()
  if (sqErr) throw createError({ statusCode: 500, message: sqErr.message })

  return { session: updated, sessionQuestion: sqRaw }
})
