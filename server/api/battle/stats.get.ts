import { z } from 'zod'

const querySchema = z.object({
  sessionId: z.string().uuid()
})

interface QuestionRow {
  id: string
  orderIndex: number
  question: {
    id: string
    text: string
    options: string[]
    correctIndex: number
    topic: string
    difficulty: number
  } | null
}

interface AnswerRow {
  sessionQuestionId: string
  selectedIndex: number
  isCorrect: boolean
  responseTimeMs: number
  pointsAwarded: number
}

/**
 * Aggregate stats for a finished (or in-progress) battle:
 *   - per-question: option distribution, correct %, average response time
 *   - overall: hardest topic, average accuracy
 *
 * Used by host BattleHostStats widget for the IAE post-game heatmap.
 *
 * Security:
 *  - Requires authentication.
 *  - `correctIndex` is omitted from the payload while the session is still
 *    IN_PROGRESS — otherwise any joined player could fetch all answers
 *    mid-game. Only the host sees correctIndex during the live session.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)
  const supabase = useServerSupabase(event)

  // Determine session state + whether caller is the host.
  const callerUserId = await getCurrentInternalUserId(event)
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('BattleSession')
    .select('status, hostUserId')
    .eq('id', query.sessionId)
    .maybeSingle()
  if (sessionErr) throw createError({ statusCode: 500, message: sessionErr.message })
  if (!sessionRow) throw createError({ statusCode: 404, message: 'Session not found' })
  const session = sessionRow as { status: string | null, hostUserId: string | null }
  const isHost = session.hostUserId === callerUserId
  const isFinished = session.status === 'ENDED' || session.status === 'COMPLETED'
  const exposeCorrectIndex = isHost || isFinished

  // Pull session questions + nested question data
  const { data: sqsRaw, error: sqsErr } = await supabase
    .from('BattleSessionQuestion')
    .select('id, orderIndex, question:BattleQuestion(id, text, options, correctIndex, topic, difficulty)')
    .eq('sessionId', query.sessionId)
    .order('orderIndex', { ascending: true })
  if (sqsErr) throw createError({ statusCode: 500, message: sqsErr.message })
  const sqs = (sqsRaw ?? []) as unknown as QuestionRow[]

  if (sqs.length === 0) return { questions: [], summary: null }

  // Pull all answers for those session-questions
  const sqIds = sqs.map(s => s.id)
  const { data: ansRaw, error: ansErr } = await supabase
    .from('BattleAnswer')
    .select('sessionQuestionId, selectedIndex, isCorrect, responseTimeMs, pointsAwarded')
    .in('sessionQuestionId', sqIds)
  if (ansErr) throw createError({ statusCode: 500, message: ansErr.message })
  const answers = (ansRaw ?? []) as unknown as AnswerRow[]

  // Group answers by sessionQuestionId
  const byQ = new Map<string, AnswerRow[]>()
  for (const a of answers) {
    const arr = byQ.get(a.sessionQuestionId) ?? []
    arr.push(a)
    byQ.set(a.sessionQuestionId, arr)
  }

  const questions = sqs.map((sq) => {
    const list = byQ.get(sq.id) ?? []
    const total = list.length
    const correct = list.filter(a => a.isCorrect).length
    const distribution = [0, 0, 0, 0]
    let totalRespMs = 0
    for (const a of list) {
      if (a.selectedIndex >= 0 && a.selectedIndex < 4) distribution[a.selectedIndex]!++
      totalRespMs += a.responseTimeMs
    }
    const accuracy = total > 0 ? correct / total : 0
    const avgResponseMs = total > 0 ? Math.round(totalRespMs / total) : 0
    return {
      sessionQuestionId: sq.id,
      orderIndex: sq.orderIndex,
      questionId: sq.question?.id ?? '',
      text: sq.question?.text ?? '',
      options: sq.question?.options ?? [],
      ...(exposeCorrectIndex ? { correctIndex: sq.question?.correctIndex ?? 0 } : {}),
      topic: sq.question?.topic ?? '',
      difficulty: sq.question?.difficulty ?? 1,
      totalAnswers: total,
      correctCount: correct,
      accuracy,
      distribution,
      avgResponseMs
    }
  })

  // Summary
  const totalAnswers = answers.length
  const totalCorrect = answers.filter(a => a.isCorrect).length
  const overallAccuracy = totalAnswers > 0 ? totalCorrect / totalAnswers : 0
  // Hardest = lowest accuracy with at least 1 answer
  const ranked = [...questions]
    .filter(q => q.totalAnswers > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
  const hardest = ranked[0] ?? null
  const easiest = ranked[ranked.length - 1] ?? null

  return {
    questions,
    summary: {
      totalAnswers,
      totalCorrect,
      overallAccuracy,
      hardest: hardest ? { orderIndex: hardest.orderIndex, text: hardest.text, accuracy: hardest.accuracy } : null,
      easiest: easiest ? { orderIndex: easiest.orderIndex, text: easiest.text, accuracy: easiest.accuracy } : null
    }
  }
})
