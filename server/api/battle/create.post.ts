import { z } from 'zod'
import { generatePin } from '../../utils/battle'

const bodySchema = z.object({
  gradeLevel: z.number().int().min(1).max(6),
  topic: z.string().min(1).max(120),
  questionCount: z.number().int().min(5).max(30).default(10),
  secondsPerQuestion: z.number().int().min(5).max(60).default(20)
})

export default defineEventHandler(async (event) => {
  const hostUserId = await getCurrentInternalUserId(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Pull random questions for the requested grade/topic
  const { data: pool, error: poolErr } = await supabase
    .from('BattleQuestion')
    .select('id')
    .eq('gradeLevel', body.gradeLevel)
    .eq('topic', body.topic)
  if (poolErr) throw createError({ statusCode: 500, message: poolErr.message })
  if (!pool || pool.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет вопросов для выбранного класса и темы'
    })
  }

  const ids = (pool as { id: string }[]).map(q => q.id)
  // Shuffle and take questionCount
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  const selected = ids.slice(0, Math.min(body.questionCount, ids.length))

  // Generate unique PIN
  let pin = ''
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generatePin()
    const { data: existing } = await supabase
      .from('BattleSession')
      .select('id')
      .eq('pin', candidate)
      .neq('status', 'ENDED')
      .maybeSingle()
    if (!existing) {
      pin = candidate
      break
    }
  }
  if (!pin) {
    throw createError({ statusCode: 500, message: 'Не удалось сгенерировать PIN' })
  }

  // Create session
  const { data: session, error: sessErr } = await supabase
    .from('BattleSession')
    .insert({
      pin,
      gradeLevel: body.gradeLevel,
      topic: body.topic,
      questionCount: selected.length,
      secondsPerQuestion: body.secondsPerQuestion,
      status: 'WAITING',
      currentIndex: -1,
      hostUserId
    } as never)
    .select()
    .single()
  if (sessErr) throw createError({ statusCode: 500, message: sessErr.message })

  const sessionData = session as unknown as { id: string }

  // Snapshot questions
  const sessionQuestions = selected.map((questionId, idx) => ({
    sessionId: sessionData.id,
    questionId,
    orderIndex: idx
  }))
  const { error: sqErr } = await supabase
    .from('BattleSessionQuestion')
    .insert(sessionQuestions)
  if (sqErr) throw createError({ statusCode: 500, message: sqErr.message })

  return { session }
})
