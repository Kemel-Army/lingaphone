/**
 * GET /api/admin/lessons?moduleId=…   (ADMIN)
 *
 * Editor payload: a module's units with their exercises INCLUDING the answer
 * key + explanation (service-role only). Students never see the keys.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const moduleId = (getQuery(event).moduleId as string | undefined) ?? ''
  if (!moduleId) throw createError({ statusCode: 400, message: 'moduleId обязателен' })

  const supabase = useServerSupabase(event)
  const { data, error } = await supabase
    .from('LessonUnit')
    .select(
      'id, moduleId, title, subtitle, orderIndex, intro,'
      + ' LessonExercise ( id, orderIndex, type, instruction, content, xp,'
      + ' LessonExerciseAnswer ( answerKey, explanation ) )'
    )
    .eq('moduleId', moduleId)
    .order('orderIndex') as unknown as { data: any[] | null, error: unknown }
  if (error) throw createError({ statusCode: 500, message: String(error) })

  const units = (data ?? []).map((u: any) => ({
    id: u.id,
    title: u.title,
    subtitle: u.subtitle,
    orderIndex: u.orderIndex,
    intro: u.intro ?? [],
    exercises: [...(u.LessonExercise ?? [])]
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      .map((ex: any) => {
        const ans = Array.isArray(ex.LessonExerciseAnswer) ? ex.LessonExerciseAnswer[0] : ex.LessonExerciseAnswer
        return {
          id: ex.id,
          orderIndex: ex.orderIndex,
          type: ex.type,
          instruction: ex.instruction,
          content: ex.content ?? {},
          xp: ex.xp,
          answerKey: ans?.answerKey ?? {},
          explanation: ans?.explanation ?? ''
        }
      })
  }))
  return { units }
})
