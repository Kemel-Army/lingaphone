/**
 * POST /api/dev/reset-my-path   (DEV ONLY)
 *
 * Test aid: clears the current student's «Мой путь» gate state — block
 * results + attempts on block-test exercises — so the gating e2e is
 * deterministic and re-runnable. Refuses to run in production.
 */
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Not allowed in production' })
  }
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)

  await supabase.from('StudentBlockResult').delete().eq('studentId', studentId)

  const { data: testUnits } = await supabase
    .from('LessonUnit').select('id').eq('kind', 'TEST') as unknown as
    { data: Array<{ id: string }> | null }
  const unitIds = (testUnits ?? []).map(u => u.id)
  if (unitIds.length) {
    const { data: exs } = await supabase
      .from('LessonExercise').select('id').in('unitId', unitIds) as unknown as
      { data: Array<{ id: string }> | null }
    const exIds = (exs ?? []).map(e => e.id)
    if (exIds.length) {
      await supabase.from('LessonAttempt').delete()
        .eq('studentId', studentId).in('exerciseId', exIds)
    }
  }

  return { ok: true }
})
