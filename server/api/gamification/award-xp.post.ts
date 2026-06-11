import { z } from 'zod'
import { XP_REWARDS } from '~/shared/types/common'

const ACTIONS = [
  'AI_CORRECT_ANSWER',
  'HOMEWORK_ON_TIME',
  'LESSON_ATTENDED',
  'TOPIC_COMPLETED',
  'TEST_COMPLETED',
  'AI_SESSION',
  'PERFECT_TEST',
  'GAP_CLOSED',
  'STREAK_BONUS',
  'QUEST_DAILY',
  'QUEST_WEEKLY',
  'DAILY_BONUS',
  'WEEKLY_BONUS',
  'ACHIEVEMENT_REWARD',
  'GRAMMAR_COMPLETE',
  'GRAMMAR_PERFECT',
  'READING_COMPLETE',
  'READING_PERFECT',
  'SONG_COMPLETE',
  'SONG_PERFECT'
] as const

const schema = z.object({
  action: z.enum(ACTIONS),
  // sourceId is required so every award is tied to a verifiable event
  // (submission id, ai-session id, lesson id, etc.). It also acts as the
  // idempotency key — the same source cannot grant XP twice.
  sourceId: z.string().uuid(),
  description: z.string().max(500).optional()
})

/**
 * POST /api/gamification/award-xp
 *
 * Thin wrapper around the award_xp_atomic Postgres function:
 *  - studentId is resolved from the auth session (caller cannot award to others)
 *  - amount is ALWAYS taken from XP_REWARDS (caller cannot inflate)
 *  - the RPC takes the profile row lock, applies arithmetic, and writes
 *    the XPTransaction + GemTransaction in one transaction. Concurrent
 *    awards cannot race-read the same xp value.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)

  const supabase = useServerSupabase(event)

  // Amount comes from XP_REWARDS only — never from the request body.
  const rewardDef = XP_REWARDS[parsed.action]
  const amount = Array.isArray(rewardDef) ? rewardDef[0] : rewardDef
  if (typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, message: 'No reward configured for this action' })
  }

  const { data, error } = await supabase.rpc('award_xp_atomic', {
    p_student_id: studentId,
    p_action: parsed.action,
    p_amount: amount,
    p_source_id: parsed.sourceId,
    p_description: parsed.description ?? null
  } as never)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const result = data as {
    xp: number
    level: number
    levelUp: boolean
    amount: number
    idempotent: boolean
  }

  // Chain: update quest progress (best-effort, internal call). Skipped on
  // idempotent replays so quest counters do not double-tick on retries.
  if (!result.idempotent) {
    const internalToken = (useRuntimeConfig().internalApiKey as string | undefined) ?? ''
    const internalHeaders = internalToken ? { 'x-internal-token': internalToken } : undefined
    const questTypeMap: Record<string, string> = {
      AI_CORRECT_ANSWER: 'SOLVE_PROBLEMS',
      AI_SESSION: 'AI_SESSION_MINUTES',
      LESSON_ATTENDED: 'ATTEND_LESSON',
      HOMEWORK_ON_TIME: 'SUBMIT_HOMEWORK',
      PERFECT_TEST: 'PERFECT_TEST',
      GAP_CLOSED: 'CLOSE_GAP'
    }

    if (internalHeaders) {
      try {
        await $fetch('/api/gamification/update-quest-progress', {
          method: 'POST',
          body: { studentId, questType: 'EARN_XP', increment: amount },
          headers: internalHeaders
        })
      } catch { /* best-effort */ }

      const mappedQuestType = questTypeMap[parsed.action]
      if (mappedQuestType) {
        try {
          await $fetch('/api/gamification/update-quest-progress', {
            method: 'POST',
            body: { studentId, questType: mappedQuestType, increment: 1 },
            headers: internalHeaders
          })
        } catch { /* best-effort */ }
      }
    }
  }

  return {
    xp: result.xp,
    level: result.level,
    levelUp: result.levelUp,
    amount: result.amount,
    idempotent: result.idempotent
  }
})
