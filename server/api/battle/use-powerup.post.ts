/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'

/**
 * Use a power-up. Decrements inventory, applies effect.
 *
 * - fifty_fifty: returns 2 random WRONG option indices to hide on the player's screen.
 *   Server enforces (player can't compute on their own — they don't see correctIndex).
 * - double: marks doubleNext=true on player; next answer score x2 (cleared after use).
 */
const bodySchema = z.object({
  playerId: z.string().uuid(),
  sessionQuestionId: z.string().uuid().optional(),
  type: z.enum(['fifty_fifty', 'double'])
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Load player + power-ups
  const { data: playerRaw, error: pErr } = await supabase
    .from('BattlePlayer')
    .select('id, sessionId, powerUps, doubleNext, fiftyFiftyOn')
    .eq('id', body.playerId)
    .single()
  if (pErr) throw createError({ statusCode: 500, message: pErr.message })
  const player = playerRaw as unknown as {
    id: string
    sessionId: string
    powerUps: { fifty_fifty?: number, double?: number }
    doubleNext: boolean
    fiftyFiftyOn: string | null
  }

  const remaining = player.powerUps?.[body.type] ?? 0
  if (remaining <= 0) {
    throw createError({ statusCode: 409, message: 'Этот бонус уже использован' })
  }

  if (body.type === 'fifty_fifty') {
    if (!body.sessionQuestionId) {
      throw createError({ statusCode: 400, message: 'sessionQuestionId required' })
    }
    if (player.fiftyFiftyOn === body.sessionQuestionId) {
      throw createError({ statusCode: 409, message: 'Уже использован на этом вопросе' })
    }
    // Look up correct index
    const { data: sqRaw, error: sqErr } = await supabase
      .from('BattleSessionQuestion')
      .select('id, question:BattleQuestion(correctIndex)')
      .eq('id', body.sessionQuestionId)
      .single()
    if (sqErr) throw createError({ statusCode: 500, message: sqErr.message })
    const correct = (sqRaw as unknown as { question: { correctIndex: number } | null }).question?.correctIndex ?? 0

    // Pick 2 random wrong indices to hide
    const wrong = [0, 1, 2, 3].filter(i => i !== correct)
    for (let i = wrong.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[wrong[i], wrong[j]] = [wrong[j]!, wrong[i]!]
    }
    const hidden = wrong.slice(0, 2)

    const newPowerUps = { ...player.powerUps, fifty_fifty: remaining - 1 }
    const { error: updErr } = await supabase
      .from('BattlePlayer')
      .update({ powerUps: newPowerUps, fiftyFiftyOn: body.sessionQuestionId } as any)
      .eq('id', body.playerId)
    if (updErr) throw createError({ statusCode: 500, message: updErr.message })

    return { ok: true, hidden }
  }

  if (body.type === 'double') {
    const newPowerUps = { ...player.powerUps, double: remaining - 1 }
    const { error: updErr } = await supabase
      .from('BattlePlayer')
      .update({ powerUps: newPowerUps, doubleNext: true } as any)
      .eq('id', body.playerId)
    if (updErr) throw createError({ statusCode: 500, message: updErr.message })
    return { ok: true }
  }

  throw createError({ statusCode: 400, message: 'Unknown power-up' })
})
