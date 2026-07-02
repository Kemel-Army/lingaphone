/**
 * GET /api/admin/books/overlay?moduleId=…
 *
 * ADMIN editor payload: every rendered page of a module with its exercises
 * INCLUDING the answer key + explanation (service-role only — the student
 * client never sees these). Used to populate the overlay editor.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const moduleId = (getQuery(event).moduleId as string | undefined) ?? ''
  if (!moduleId) throw createError({ statusCode: 400, message: 'moduleId обязателен' })

  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('BookPage')
    .select(
      'id, pageNumber, imageUrl, imageWidth, imageHeight,'
      + ' PageExercise ( id, kind, x, y, w, h, prompt, options, orderIndex,'
      + ' PageExerciseAnswer ( answerKey, explanation ) )'
    )
    .eq('moduleId', moduleId)
    .order('pageNumber') as unknown as { data: any[] | null, error: unknown }

  if (error) throw createError({ statusCode: 500, message: String(error) })

  const pages = (data ?? []).map((p: any) => ({
    id: p.id,
    pageNumber: p.pageNumber,
    imageUrl: p.imageUrl,
    imageWidth: p.imageWidth,
    imageHeight: p.imageHeight,
    exercises: [...(p.PageExercise ?? [])]
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      .map((ex: any) => {
        const ans = Array.isArray(ex.PageExerciseAnswer)
          ? ex.PageExerciseAnswer[0]
          : ex.PageExerciseAnswer
        return {
          id: ex.id,
          kind: ex.kind,
          x: ex.x,
          y: ex.y,
          w: ex.w,
          h: ex.h,
          prompt: ex.prompt,
          options: ex.options ?? [],
          orderIndex: ex.orderIndex,
          answerKey: ans?.answerKey ?? {},
          explanation: ans?.explanation ?? ''
        }
      })
  }))

  return { pages }
})
