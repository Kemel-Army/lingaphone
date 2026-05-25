import { z } from 'zod'

/**
 * POST /api/capsule/complete-layer
 *
 * Validates a layer's completion criteria server-side, writes LayerProgress
 * and recomputes the capsule-level PathProgress aggregate.
 *
 * Client pattern:
 *   await $fetch('/api/capsule/complete-layer', {
 *     method: 'POST',
 *     body: { layerId, interactionData, score, maxScore, timeSpentSeconds }
 *   })
 *
 * XP awarding is intentionally limited to LayerProgress.xpEarned at this
 * stage; it will be propagated into StudentGameProfile / XPTransaction by
 * the gamification hookup in a later phase.
 */

const schema = z.object({
  layerId: z.string().uuid(),
  interactionData: z.record(z.string(), z.unknown()).optional().default({}),
  score: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(1).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).max(60 * 60 * 2).optional().default(0)
})

interface CompletionCriteria {
  minAccuracy?: number
  minCorrect?: number
  minInteractions?: number
  minLength?: number
  minSimilarity?: number
  requiredConcepts?: string[]
}

/** Re-evaluates the capsule-level PathProgress for a given student + lesson. */
async function recomputePathProgress(
  supabase: ReturnType<typeof useServerSupabase>,
  studentId: string,
  lessonId: string
) {
  const [{ data: layers }, { data: progress }, { data: lesson }] = await Promise.all([
    supabase.from('CapsuleLayer').select('id, orderIndex, layerType').eq('lessonId', lessonId).order('orderIndex'),
    supabase.from('LayerProgress').select('layerId, status, score, xpEarned').eq('studentId', studentId).eq('lessonId', lessonId),
    supabase.from('PathLesson').select('id, masteryThreshold').eq('id', lessonId).single()
  ])

  const layerRows = (layers ?? []) as { id: string, orderIndex: number, layerType: string }[]
  const progRows = (progress ?? []) as { layerId: string, status: string, score: number | null, xpEarned: number }[]

  const progByLayer = new Map(progRows.map(p => [p.layerId, p]))
  const completedCount = layerRows.filter(l => progByLayer.get(l.id)?.status === 'COMPLETED').length

  // Next layer to tackle: first one not yet COMPLETED, else stay at last.
  let nextOrder = layerRows.length
  for (const l of layerRows) {
    if (progByLayer.get(l.id)?.status !== 'COMPLETED') {
      nextOrder = l.orderIndex
      break
    }
  }

  // Mastery data comes from the final MASTERY_CHECK layer progress.
  const masteryLayer = layerRows.find(l => l.layerType === 'MASTERY_CHECK')
  const masteryProg = masteryLayer ? progByLayer.get(masteryLayer.id) : undefined
  const masteryScore = masteryProg?.score ?? null
  const masteryAchieved = masteryScore != null
    && masteryScore >= ((lesson as { masteryThreshold?: number } | null)?.masteryThreshold ?? 80)

  const xpEarnedTotal = progRows.reduce((s, p) => s + (p.xpEarned ?? 0), 0)

  const payload = {
    currentLayerIndex: Math.min(Math.max(nextOrder, 1), 11),
    layersCompleted: completedCount,
    masteryScore,
    masteryAchieved,
    xpEarned: xpEarnedTotal,
    lastActivityAt: new Date().toISOString(),
    completedAt: completedCount === layerRows.length && layerRows.length > 0
      ? new Date().toISOString()
      : null
  }

  // Upsert on the (studentId, pathLessonId) composite key via select-then-update.
  const { data: existing } = await supabase
    .from('PathProgress')
    .select('id')
    .eq('studentId', studentId)
    .eq('pathLessonId', lessonId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('PathProgress')
      .update(payload)
      .eq('id', (existing as { id: string }).id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase
    .from('PathProgress')
    .insert({ studentId, pathLessonId: lessonId, ...payload })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Returns true if the criteria are satisfied by the submitted data. */
function evaluateCriteria(
  criteria: CompletionCriteria,
  submission: { score?: number, maxScore?: number, interactionData: Record<string, unknown> }
): { passed: boolean, reason?: string } {
  const { minAccuracy, minCorrect, minInteractions, minLength } = criteria
  const { score, maxScore, interactionData } = submission

  if (minCorrect != null && (score ?? 0) < minCorrect) {
    return { passed: false, reason: `Нужно минимум ${minCorrect} правильных.` }
  }
  if (minAccuracy != null) {
    const acc = score != null && maxScore && maxScore > 0 ? (score / maxScore) * 100 : 0
    if (acc < minAccuracy) {
      return { passed: false, reason: `Нужно ${minAccuracy}% точности.` }
    }
  }
  if (minInteractions != null) {
    const raw = interactionData.interactions
    const count = Array.isArray(raw) ? raw.length : 0
    if (count < minInteractions) {
      return { passed: false, reason: `Нужно минимум ${minInteractions} взаимодействий.` }
    }
  }
  if (minLength != null) {
    const text = typeof interactionData.text === 'string' ? interactionData.text : ''
    if (text.trim().length < minLength) {
      return { passed: false, reason: `Ответ должен быть длиннее.` }
    }
  }
  // minSimilarity / requiredConcepts are evaluated in the teach-back endpoint
  // (requires an NLP call) — skipped here.
  return { passed: true }
}

export default defineEventHandler(async (event) => {
  const isDemoFreeSwitch = (
    process.env.CAPSULE_DEMO_FREE_SWITCH
    ?? process.env.NUXT_PUBLIC_CAPSULE_DEMO_FREE_SWITCH
    ?? 'true'
  ) !== 'false'

  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)
  const supabase = useServerSupabase(event)

  // Resolve Student.id via User.authId = auth.uid().
  // Fallback for legacy seeded users: match by email and bind missing authId.
  let resolvedUserId: string | null = null

  const { data: authUserRow } = await supabase
    .from('User')
    .select('id')
    .eq('authId', user.id)
    .maybeSingle()

  if (authUserRow?.id) {
    resolvedUserId = authUserRow.id
  } else if (user.email) {
    const { data: emailUserRow } = await supabase
      .from('User')
      .select('id, authId')
      .eq('email', user.email)
      .maybeSingle()

    if (emailUserRow?.id) {
      resolvedUserId = emailUserRow.id

      if (!emailUserRow.authId) {
        await supabase
          .from('User')
          .update({ authId: user.id })
          .eq('id', emailUserRow.id)
      }
    }
  }

  if (!resolvedUserId) {
    throw createError({ statusCode: 401, message: 'User not found' })
  }

  const { data: studentRow, error: studentErr } = await supabase
    .from('Student')
    .select('id')
    .eq('userId', resolvedUserId)
    .single()
  if (studentErr || !studentRow) throw createError({ statusCode: 403, message: 'Student profile required' })
  const studentId = (studentRow as { id: string }).id

  // Load layer and siblings (for prerequisite check)
  const { data: layer, error: layerErr } = await supabase
    .from('CapsuleLayer')
    .select('id, lessonId, layerType, orderIndex, xpReward, completionCriteria')
    .eq('id', parsed.layerId)
    .single()
  if (layerErr || !layer) throw createError({ statusCode: 404, message: 'Layer not found' })

  const layerRow = layer as {
    id: string
    lessonId: string
    layerType: string
    orderIndex: number
    xpReward: number
    completionCriteria: CompletionCriteria
  }

  // Prerequisite: previous layer must be COMPLETED (except for order=1)
  if (layerRow.orderIndex > 1 && !isDemoFreeSwitch) {
    const { data: siblings } = await supabase
      .from('CapsuleLayer')
      .select('id, orderIndex')
      .eq('lessonId', layerRow.lessonId)
      .lt('orderIndex', layerRow.orderIndex)

    const prereqIds = ((siblings ?? []) as { id: string, orderIndex: number }[]).map(s => s.id)
    if (prereqIds.length) {
      const { data: prereqProg } = await supabase
        .from('LayerProgress')
        .select('layerId, status')
        .eq('studentId', studentId)
        .in('layerId', prereqIds)
      const done = new Set(
        ((prereqProg ?? []) as { layerId: string, status: string }[])
          .filter(p => p.status === 'COMPLETED').map(p => p.layerId)
      )
      const missing = prereqIds.filter(id => !done.has(id))
      if (missing.length) {
        throw createError({ statusCode: 409, message: 'Предыдущие слои не завершены' })
      }
    }
  }

  // Evaluate criteria
  const evaluation = evaluateCriteria(layerRow.completionCriteria, {
    score: parsed.score,
    maxScore: parsed.maxScore,
    interactionData: parsed.interactionData
  })

  const passed = isDemoFreeSwitch ? true : evaluation.passed

  // For MASTERY_CHECK we mark FAILED on miss (lets client show retry UI).
  // For any other layer, a miss stays IN_PROGRESS so the student can keep going.
  const status = passed
    ? 'COMPLETED'
    : (layerRow.layerType === 'MASTERY_CHECK' ? 'FAILED' : 'IN_PROGRESS')

  const xpEarned = evaluation.passed ? layerRow.xpReward : 0
  const now = new Date().toISOString()

  // Upsert LayerProgress (unique on studentId+layerId)
  const { data: existing } = await supabase
    .from('LayerProgress')
    .select('id, attempts, timeSpentSeconds, xpEarned')
    .eq('studentId', studentId)
    .eq('layerId', layerRow.id)
    .maybeSingle()

  const prev = existing as { id: string, attempts: number, timeSpentSeconds: number, xpEarned: number } | null

  const basePayload = {
    status,
    score: parsed.score ?? null,
    maxScore: parsed.maxScore ?? null,
    attempts: (prev?.attempts ?? 0) + 1,
    timeSpentSeconds: (prev?.timeSpentSeconds ?? 0) + parsed.timeSpentSeconds,
    xpEarned: evaluation.passed ? xpEarned : (prev?.xpEarned ?? 0),
    interactionData: parsed.interactionData as unknown as Record<string, never>,
    completedAt: passed ? now : null
  }

  let layerProgress
  if (prev) {
    const { data, error } = await supabase
      .from('LayerProgress')
      .update(basePayload)
      .eq('id', prev.id)
      .select()
      .single()
    if (error) throw error
    layerProgress = data
  } else {
    const { data, error } = await supabase
      .from('LayerProgress')
      .insert({
        studentId,
        layerId: layerRow.id,
        lessonId: layerRow.lessonId,
        startedAt: now,
        ...basePayload
      })
      .select()
      .single()
    if (error) throw error
    layerProgress = data
  }

  const pathProgress = await recomputePathProgress(supabase, studentId, layerRow.lessonId)

  return {
    passed,
    reason: passed ? null : (evaluation.reason ?? null),
    xpAwarded: xpEarned,
    layerProgress,
    pathProgress
  }
})
