import { z } from 'zod'

/* eslint-disable @typescript-eslint/no-explicit-any */

const schema = z.object({
  // Only spends are allowed via this endpoint — positive grants must be
  // performed by trusted server code (check-achievements, update-streak,
  // update-quest-progress, level-up) writing directly to GemTransaction
  // and StudentGameProfile. This prevents a student from minting gems by
  // calling the route with a fabricated `amount`.
  amount: z.number().int().negative(),
  sourceType: z.enum(['SHOP_PURCHASE', 'SHOP_REFUND']),
  sourceId: z.string().uuid(),
  description: z.string().max(500).optional()
})

/**
 * POST /api/gamification/award-gems
 *
 * Hardened: this client-facing route only services *spends* (negative
 * amount). Both `sourceType` and `sourceId` are required so the burn is
 * always tied to a verifiable artefact (e.g. a ShopOrder UUID). Idempotency
 * is enforced on (studentId, sourceType, sourceId) so the same shop order
 * can't be debited twice.
 *
 * Server-internal grants (achievements, streaks, quests, level-up) bypass
 * this endpoint and write directly to GemTransaction + StudentGameProfile.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)

  const supabase = useServerSupabase(event)

  // Idempotency: same (studentId, sourceType, sourceId) cannot be applied twice.
  const { data: existingTx } = await supabase
    .from('GemTransaction')
    .select('id, amount')
    .eq('studentId', studentId)
    .eq('sourceType', parsed.sourceType)
    .eq('sourceId', parsed.sourceId)
    .maybeSingle()

  if (existingTx) {
    const { data: profile } = await supabase
      .from('StudentGameProfile')
      .select('gems')
      .eq('studentId', studentId)
      .maybeSingle()
    return {
      gems: ((profile as Record<string, any>)?.gems as number) ?? 0,
      amount: (existingTx as Record<string, any>).amount as number,
      idempotent: true
    }
  }

  // Get game profile
  const { data: profile, error: profileError } = await supabase
    .from('StudentGameProfile')
    .select('id, gems')
    .eq('studentId', studentId)
    .single()

  if (profileError || !profile) {
    throw createError({ statusCode: 404, message: 'Game profile not found' })
  }

  const p = profile as Record<string, any>
  const currentGems = (p.gems as number) ?? 0

  // Prevent negative balance
  if (currentGems + parsed.amount < 0) {
    throw createError({ statusCode: 400, message: 'Insufficient gems' })
  }

  // Create transaction
  const { error: txError } = await supabase
    .from('GemTransaction')
    .insert({
      studentId: studentId,
      amount: parsed.amount,
      sourceType: parsed.sourceType,
      sourceId: parsed.sourceId,
      description: parsed.description ?? null
    })

  if (txError) throw createError({ statusCode: 500, message: txError.message })

  // Update profile gems
  const newGems = currentGems + parsed.amount
  const { error: updateError } = await supabase
    .from('StudentGameProfile')
    .update({ gems: newGems, updatedAt: new Date().toISOString() } as never)
    .eq('id', p.id as string)

  if (updateError) throw createError({ statusCode: 500, message: updateError.message })

  return { gems: newGems, amount: parsed.amount }
})
