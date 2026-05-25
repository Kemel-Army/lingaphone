import { z } from 'zod'

const schema = z.object({
  studentId: z.string().uuid(),
  questType: z.enum([
    'SOLVE_PROBLEMS', 'AI_SESSION_MINUTES', 'ATTEND_LESSON',
    'SUBMIT_HOMEWORK', 'REVIEW_TOPIC', 'EARN_XP',
    'PERFECT_TEST', 'CLOSE_GAP', 'STREAK_DAYS'
  ]),
  increment: z.number().int().positive().max(1000).default(1)
})

/**
 * POST /api/gamification/update-quest-progress
 *
 * Internal route. Reachable only by other server-side handlers (award-xp,
 * update-streak) that present the `x-internal-token` header.
 *
 * Delegates to tick_quest_progress() — the SECURITY DEFINER RPC that holds
 * StudentQuest row locks while ticking progress and awarding completion
 * rewards through complete_quest_atomic. Two parallel ticks for the same
 * student can no longer lose an increment or double-award a completion.
 */
export default defineEventHandler(async (event) => {
  requireInternalCall(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)

  const supabase = useServerSupabase(event)

  const { data, error } = await supabase.rpc('tick_quest_progress', {
    p_student_id: parsed.studentId,
    p_quest_type: parsed.questType,
    p_increment: parsed.increment
  } as never)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const result = data as { updatedIds: string[], completedIds: string[] }
  return {
    updated: result.updatedIds ?? [],
    completed: result.completedIds ?? []
  }
})
