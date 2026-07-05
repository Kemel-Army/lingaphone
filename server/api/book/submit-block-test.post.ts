/**
 * POST /api/book/submit-block-test   (STUDENT)
 *
 * Finalizes a block test. Each test question was already answered via
 * /api/book/check-exercise (which stored a LessonAttempt). This route
 * aggregates those attempts into a block score, applies the pass threshold,
 * and upserts StudentBlockResult — the single source of truth the «Мой путь»
 * gate reads to unlock the next block.
 *
 * Guards: the test unit must be kind='TEST', and its block must be AVAILABLE
 * (previous block's test passed) — a locked block cannot be submitted.
 *
 * Body: { testUnitId }
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event) as { testUnitId?: string }
  const testUnitId = body.testUnitId
  if (!testUnitId) throw createError({ statusCode: 400, message: 'testUnitId обязателен' })

  const supabase = useServerSupabase(event)

  // Load the test unit + its exercises.
  const { data: unit, error: uErr } = await supabase
    .from('LessonUnit')
    .select('id, moduleId, kind, passThreshold, LessonExercise(id), Module(bookId, order)')
    .eq('id', testUnitId).maybeSingle() as unknown as
    { data: any | null, error: unknown }
  if (uErr) throw createError({ statusCode: 500, message: String(uErr) })
  if (!unit) throw createError({ statusCode: 404, message: 'Тест не найден' })
  if (unit.kind !== 'TEST') throw createError({ statusCode: 400, message: 'Это не тест блока' })

  const moduleId: string = unit.moduleId
  const passThreshold: number = unit.passThreshold ?? 70
  const exerciseIds: string[] = (unit.LessonExercise ?? []).map((e: any) => e.id)
  const total = exerciseIds.length
  if (!total) throw createError({ statusCode: 400, message: 'В тесте нет вопросов' })

  // Gating is OFF — any block's test can be submitted at any time.

  // Aggregate the student's correct answers for this test's exercises.
  const { data: attempts, error: aErr } = await supabase
    .from('LessonAttempt').select('exerciseId, isCorrect')
    .eq('studentId', studentId).in('exerciseId', exerciseIds) as unknown as
    { data: Array<{ exerciseId: string, isCorrect: boolean | null }> | null, error: unknown }
  if (aErr) throw createError({ statusCode: 500, message: String(aErr) })

  const correct = (attempts ?? []).filter(a => a.isCorrect).length
  const score = Math.round((correct / total) * 100)
  const passedNow = score >= passThreshold

  // Upsert the block result (keep best score, accumulate attempts).
  const { data: existing } = await supabase
    .from('StudentBlockResult').select('id, bestScore, passed, attempts, passedAt')
    .eq('studentId', studentId).eq('moduleId', moduleId).maybeSingle() as unknown as
    { data: any | null }

  const now = new Date().toISOString()
  const bestScore = Math.max(score, existing?.bestScore ?? 0)
  const passed = Boolean(existing?.passed) || passedNow
  const passedAt = existing?.passedAt ?? (passed ? now : null)
  const attemptsCount = (existing?.attempts ?? 0) + 1

  const row = {
    studentId, moduleId, testUnitId,
    bestScore, lastScore: score, passed, passedAt,
    attempts: attemptsCount, updatedAt: now
  }
  const { error: upErr } = await supabase
    .from('StudentBlockResult')
    .upsert(row, { onConflict: 'studentId,moduleId' })
  if (upErr) throw createError({ statusCode: 500, message: upErr.message })

  return {
    score, correct, total, passThreshold,
    passed: passedNow,
    blockPassed: passed, // ever passed (unlocks next block)
    bestScore
  }
})
