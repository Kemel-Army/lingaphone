import { z } from 'zod'
import { XP_REWARDS } from '~/shared/types/common'

const schema = z.object({
  gameId: z.string().uuid(),
  correct: z.number().int().min(0),
  total: z.number().int().min(1)
})

/**
 * POST /api/games/progress  (ТЗ §5: начисление XP за прохождение)
 *
 * Awards XP for completing a module game and updates User.xp via the
 * atomic RPC. Amount comes from XP_REWARDS (TOPIC_COMPLETED) — never from
 * the client. gameId is the idempotency key, so a given game awards once.
 * Pass threshold: ≥60% correct.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const { gameId, correct, total } = schema.parse(await readBody(event))

  const passed = correct / total >= 0.6
  if (!passed) {
    return { awarded: false, xp: 0, reason: 'below_pass_threshold' }
  }

  const supabase = useServerSupabase(event)

  // Verify the game exists before awarding.
  const { data: game, error: gameErr } = await supabase
    .from('Game')
    .select('id')
    .eq('id', gameId)
    .maybeSingle()
  if (gameErr) throw createError({ statusCode: 500, message: gameErr.message })
  if (!game) throw createError({ statusCode: 404, message: 'Game not found' })

  const reward = XP_REWARDS.TOPIC_COMPLETED
  const amount = Array.isArray(reward) ? reward[0] : reward

  const { data, error } = await supabase.rpc('award_xp_atomic', {
    p_student_id: studentId,
    p_action: 'TOPIC_COMPLETED',
    p_amount: amount,
    p_source_id: gameId,
    p_description: 'Mini-game completed'
  } as never)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const result = data as { xp: number, level: number, levelUp: boolean, idempotent: boolean }
  return { awarded: !result.idempotent, ...result }
})
