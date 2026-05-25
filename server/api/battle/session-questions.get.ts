import { z } from 'zod'

const querySchema = z.object({
  sessionId: z.string().uuid()
})

/**
 * GET /api/battle/session-questions?sessionId=...
 *
 * Returns the full ordered question list (correctIndex/explanation stripped)
 * for a session. Host-only — players receive questions one-at-a-time via
 * /api/battle/next-question, so they never need the full list. Restricting
 * this endpoint avoids letting any authenticated user enumerate the bank
 * of a session they aren't running.
 */
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  await requireBattleHost(event, query.sessionId)
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('BattleSessionQuestion')
    .select('id, sessionId, questionId, orderIndex, createdAt, question:BattleQuestion(id, gradeLevel, topic, topicKz, text, textKz, options, difficulty, createdAt, updatedAt)')
    .eq('sessionId', query.sessionId)
    .order('orderIndex', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { questions: data ?? [] }
})
