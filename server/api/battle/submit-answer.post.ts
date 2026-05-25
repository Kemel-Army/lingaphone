import { z } from 'zod'
import { calculatePoints } from '../../utils/battle'

const bodySchema = z.object({
  sessionQuestionId: z.string().uuid(),
  playerId: z.string().uuid(),
  selectedIndex: z.number().int().min(0).max(3),
  responseTimeMs: z.number().int().min(0).max(120000)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Load session question with correct index + session for time limit
  const { data: sqRaw, error: sqErr } = await supabase
    .from('BattleSessionQuestion')
    .select('id, sessionId, question:BattleQuestion(correctIndex), session:BattleSession(secondsPerQuestion, status)')
    .eq('id', body.sessionQuestionId)
    .single()
  if (sqErr) throw createError({ statusCode: 500, message: sqErr.message })
  const sq = sqRaw as {
    id: string
    sessionId: string
    question: { correctIndex: number }
    session: { secondsPerQuestion: number, status: string }
  }
  if (sq.session.status !== 'IN_PROGRESS') {
    throw createError({ statusCode: 409, message: 'Игра не активна' })
  }

  const isCorrect = body.selectedIndex === sq.question.correctIndex
  const totalTimeMs = sq.session.secondsPerQuestion * 1000
  const basePoints = calculatePoints(isCorrect, body.responseTimeMs, totalTimeMs)

  // Read player's doubleNext flag
  const { data: playerFlagsRaw } = await supabase
    .from('BattlePlayer')
    .select('doubleNext')
    .eq('id', body.playerId)
    .single()
  const playerFlags = playerFlagsRaw as { doubleNext: boolean } | null
  const multiplier = playerFlags?.doubleNext && isCorrect ? 2 : 1
  const points = Math.round(basePoints * multiplier)

  // Upsert answer (idempotent — first answer wins)
  const { data: existing } = await supabase
    .from('BattleAnswer')
    .select('id')
    .eq('sessionQuestionId', body.sessionQuestionId)
    .eq('playerId', body.playerId)
    .maybeSingle()
  if (existing) {
    return { duplicate: true }
  }

  const { error: insErr } = await supabase
    .from('BattleAnswer')
    .insert({
      sessionQuestionId: body.sessionQuestionId,
      playerId: body.playerId,
      selectedIndex: body.selectedIndex,
      isCorrect,
      responseTimeMs: body.responseTimeMs,
      pointsAwarded: points,
      bonusMultiplier: multiplier
    })
  if (insErr) throw createError({ statusCode: 500, message: insErr.message })

  // Update player aggregates + clear doubleNext flag (always, after first answer)
  if (isCorrect || points > 0 || multiplier > 1) {
    const { data: playerRaw } = await supabase
      .from('BattlePlayer')
      .select('totalScore, correctCount')
      .eq('id', body.playerId)
      .single()
    const player = playerRaw as { totalScore: number, correctCount: number } | null
    if (player) {
      await supabase
        .from('BattlePlayer')
        .update({
          totalScore: player.totalScore + points,
          correctCount: player.correctCount + (isCorrect ? 1 : 0),
          doubleNext: false
        } as any)
        .eq('id', body.playerId)
    }
  }

  // If wrong answer with double active — clear flag too (don't waste it on miss)
  if (multiplier === 1 && playerFlags?.doubleNext) {
    await supabase
      .from('BattlePlayer')
      .update({ doubleNext: false } as any)
      .eq('id', body.playerId)
  }

  return { isCorrect, pointsAwarded: points, multiplier }
})
