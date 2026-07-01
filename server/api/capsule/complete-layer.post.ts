/**
 * POST /api/capsule/complete-layer
 *
 * Server-side layer validation + scoring for the "Мой путь" capsule runtime.
 * The client posts interactionData/score; the server checks the layer's
 * completionCriteria, upserts LayerProgress, and recomputes PathProgress.
 */
import { z } from 'zod'
import type { H3Event } from 'h3'
import { XP_REWARDS } from '~/shared/types/common'

const bodySchema = z.object({
  layerId: z.string().uuid(),
  interactionData: z.record(z.string(), z.unknown()).optional().default({}),
  score: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(1).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).max(7200).optional()
})

interface Criteria {
  minAccuracy?: number
  minCorrect?: number
  minInteractions?: number
  minLength?: number
}

interface Submission {
  score?: number
  maxScore?: number
  interactionData: Record<string, unknown>
}

function evaluateCriteria(criteria: Criteria, sub: Submission): { passed: boolean, reason: string | null } {
  if (typeof criteria.minCorrect === 'number' && (sub.score ?? 0) < criteria.minCorrect) {
    return { passed: false, reason: `Нужно минимум ${criteria.minCorrect} правильных ответов` }
  }
  if (typeof criteria.minAccuracy === 'number') {
    const acc = sub.maxScore ? ((sub.score ?? 0) / sub.maxScore) * 100 : 0
    if (acc < criteria.minAccuracy) return { passed: false, reason: `Нужно минимум ${criteria.minAccuracy}% точности` }
  }
  if (typeof criteria.minInteractions === 'number') {
    const arr = (sub.interactionData?.interactions as unknown[]) ?? []
    if (!Array.isArray(arr) || arr.length < criteria.minInteractions) {
      return { passed: false, reason: 'Слишком мало действий' }
    }
  }
  if (typeof criteria.minLength === 'number') {
    const t = typeof sub.interactionData?.text === 'string' ? (sub.interactionData.text as string) : ''
    if (t.length < criteria.minLength) return { passed: false, reason: 'Слишком короткий ответ' }
  }
  return { passed: true, reason: null }
}

async function recomputePathProgress(
  supabase: ReturnType<typeof useServerSupabase>,
  studentId: string,
  lessonId: string
) {
  const [{ data: layerRows }, { data: progressRows }, { data: lessonRow }] = await Promise.all([
    supabase.from('CapsuleLayer').select('id, orderIndex, layerType').eq('lessonId', lessonId),
    supabase.from('LayerProgress').select('layerId, status, score, xpEarned').eq('studentId', studentId).eq('lessonId', lessonId),
    supabase.from('PathLesson').select('masteryThreshold').eq('id', lessonId).maybeSingle()
  ])

  const layers = ((layerRows ?? []) as { id: string, orderIndex: number, layerType: string }[])
    .sort((a, b) => a.orderIndex - b.orderIndex)
  const progById = new Map(
    ((progressRows ?? []) as { layerId: string, status: string, score: number | null, xpEarned: number }[])
      .map(p => [p.layerId, p])
  )
  const threshold = (lessonRow as { masteryThreshold?: number } | null)?.masteryThreshold ?? 80

  let layersCompleted = 0
  let currentLayerIndex = layers.length ? layers[layers.length - 1]!.orderIndex : 1
  let foundCurrent = false
  let xpSum = 0
  let masteryScore: number | null = null

  for (const l of layers) {
    const p = progById.get(l.id)
    if (p?.status === 'COMPLETED') {
      layersCompleted++
    } else if (!foundCurrent) {
      currentLayerIndex = l.orderIndex
      foundCurrent = true
    }
    xpSum += p?.xpEarned ?? 0
    if (l.layerType === 'MASTERY_CHECK' && typeof p?.score === 'number') masteryScore = p.score
  }
  if (!foundCurrent && layers.length) currentLayerIndex = layers[layers.length - 1]!.orderIndex

  const masteryAchieved = masteryScore != null && masteryScore >= threshold
  const allDone = layers.length > 0 && layersCompleted === layers.length

  const { data: existing } = await supabase
    .from('PathProgress').select('id').eq('studentId', studentId).eq('pathLessonId', lessonId).maybeSingle()

  const row = {
    studentId,
    pathLessonId: lessonId,
    currentLayerIndex,
    layersCompleted,
    masteryScore,
    masteryMaxScore: masteryScore != null ? 100 : null,
    masteryAchieved,
    xpEarned: xpSum,
    lastActivityAt: new Date().toISOString(),
    completedAt: allDone ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString()
  }

  if ((existing as { id?: string } | null)?.id) {
    await supabase.from('PathProgress').update(row as never).eq('id', (existing as { id: string }).id)
  } else {
    await supabase.from('PathProgress').insert(row as never)
  }

  const { data: fresh } = await supabase
    .from('PathProgress').select('*').eq('studentId', studentId).eq('pathLessonId', lessonId).maybeSingle()
  return fresh
}

export default defineEventHandler(async (event: H3Event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Некорректные данные' })
  }
  const { layerId, interactionData, score, maxScore, timeSpentSeconds } = parsed.data

  const supabase = useServerSupabase(event)
  const config = useRuntimeConfig()
  const demoFree = (config.public.capsuleDemoFreeSwitch as string | undefined) !== 'false'

  const { data: layer, error: layerErr } = await supabase
    .from('CapsuleLayer')
    .select('id, lessonId, layerType, orderIndex, xpReward, completionCriteria')
    .eq('id', layerId)
    .maybeSingle() as unknown as {
    data: { id: string, lessonId: string, layerType: string, orderIndex: number, xpReward: number, completionCriteria: Criteria } | null
    error: unknown
  }

  if (layerErr || !layer) throw createError({ statusCode: 404, message: 'Слой не найден' })

  // Prerequisite check (skipped in demo-free mode).
  if (!demoFree) {
    const { data: siblings } = await supabase
      .from('CapsuleLayer').select('id, orderIndex').eq('lessonId', layer.lessonId).lt('orderIndex', layer.orderIndex)
    const priorIds = ((siblings ?? []) as { id: string }[]).map(s => s.id)
    if (priorIds.length) {
      const { data: priorProg } = await supabase
        .from('LayerProgress').select('layerId, status').eq('studentId', studentId).in('layerId', priorIds)
      const completed = new Set(((priorProg ?? []) as { layerId: string, status: string }[])
        .filter(p => p.status === 'COMPLETED').map(p => p.layerId))
      if (priorIds.some(id => !completed.has(id))) {
        throw createError({ statusCode: 409, message: 'Предыдущие слои не завершены' })
      }
    }
  }

  const { passed, reason } = demoFree
    ? { passed: true, reason: null }
    : evaluateCriteria(layer.completionCriteria ?? {}, { score, maxScore, interactionData })

  const status = passed ? 'COMPLETED' : (layer.layerType === 'MASTERY_CHECK' ? 'FAILED' : 'IN_PROGRESS')
  const xpAwarded = passed ? layer.xpReward : 0
  const now = new Date().toISOString()

  // Upsert LayerProgress (select-then-update/insert on studentId+layerId).
  const { data: prev } = await supabase
    .from('LayerProgress').select('id, attempts, timeSpentSeconds').eq('studentId', studentId).eq('layerId', layerId).maybeSingle()

  const prevRow = prev as { id: string, attempts: number, timeSpentSeconds: number } | null
  const progressRow = {
    studentId,
    layerId,
    lessonId: layer.lessonId,
    status,
    score: score ?? null,
    maxScore: maxScore ?? null,
    attempts: (prevRow?.attempts ?? 0) + 1,
    timeSpentSeconds: (prevRow?.timeSpentSeconds ?? 0) + (timeSpentSeconds ?? 0),
    xpEarned: xpAwarded,
    interactionData: interactionData ?? {},
    startedAt: now,
    completedAt: passed ? now : null,
    updatedAt: now
  }

  let layerProgress
  if (prevRow?.id) {
    const { data } = await supabase.from('LayerProgress').update(progressRow as never).eq('id', prevRow.id).select('*').maybeSingle()
    layerProgress = data
  } else {
    const { data } = await supabase.from('LayerProgress').insert(progressRow as never).select('*').maybeSingle()
    layerProgress = data
  }

  const pathProgress = await recomputePathProgress(supabase, studentId, layer.lessonId)

  // Award global gamification XP ONCE when the whole capsule is finished.
  // Idempotent by sourceId=lessonId (award_xp_atomic dedupes on the source),
  // so replays / re-runs never double-grant. Best-effort — never fails the
  // layer completion.
  const pp = pathProgress as { completedAt?: string | null } | null
  if (pp?.completedAt) {
    const reward = XP_REWARDS.TOPIC_COMPLETED
    const amount = Array.isArray(reward) ? reward[0] : reward
    try {
      await supabase.rpc('award_xp_atomic', {
        p_student_id: studentId,
        p_action: 'TOPIC_COMPLETED',
        p_amount: amount,
        p_source_id: layer.lessonId,
        p_description: 'Капсула «Мой путь» пройдена'
      } as never)
    } catch { /* best-effort */ }
  }

  return { passed, reason, xpAwarded, layerProgress, pathProgress }
})
