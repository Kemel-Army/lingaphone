/**
 * POST /api/admin/books/save-overlay
 *
 * ADMIN: persist the exercise overlay of ONE page. The correct answer +
 * explanation go into the service-role-only PageExerciseAnswer table, so the
 * key never reaches the student client.
 *
 * Body:
 *   pageId    — BookPage id (required)
 *   exercises — array of:
 *     { id?, kind, x, y, w, h, prompt?, options?, orderIndex?, answerKey?, explanation? }
 *
 * Existing rows are matched by id and updated; rows dropped from the payload
 * are deleted (cascading their answer + any attempts); new rows are inserted.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const KINDS = ['BLANK', 'CHOICE', 'TRUE_FALSE', 'MATCH', 'SHORT_TEXT', 'ORAL']

const clamp01 = (n: any) => Math.min(1, Math.max(0, Number(n) || 0))

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody(event) as {
    pageId?: string
    exercises?: any[]
  }
  const pageId = body.pageId
  const incoming = Array.isArray(body.exercises) ? body.exercises : []
  if (!pageId) throw createError({ statusCode: 400, message: 'pageId обязателен' })

  const supabase = useServerSupabase(event)

  // Validate + normalise each exercise.
  const rows = incoming.map((ex: any, i: number) => {
    if (!KINDS.includes(ex.kind)) {
      throw createError({ statusCode: 400, message: `Неизвестный тип: ${ex.kind}` })
    }
    const w = clamp01(ex.w) || 0.08
    const h = clamp01(ex.h) || 0.04
    return {
      id: typeof ex.id === 'string' ? ex.id : undefined,
      kind: ex.kind as string,
      x: clamp01(ex.x),
      y: clamp01(ex.y),
      w: Math.min(w, 1),
      h: Math.min(h, 1),
      prompt: typeof ex.prompt === 'string' ? ex.prompt : null,
      options: Array.isArray(ex.options) ? ex.options : [],
      orderIndex: Number.isInteger(ex.orderIndex) ? ex.orderIndex : i,
      answerKey: ex.answerKey && typeof ex.answerKey === 'object' ? ex.answerKey : {},
      explanation: typeof ex.explanation === 'string' ? ex.explanation : null
    }
  })

  // Delete rows removed from the payload.
  const { data: existing } = await supabase
    .from('PageExercise')
    .select('id')
    .eq('pageId', pageId) as unknown as { data: { id: string }[] | null }
  const keepIds = new Set(rows.filter(r => r.id).map(r => r.id as string))
  const toDelete = (existing ?? []).map(e => e.id).filter(id => !keepIds.has(id))
  if (toDelete.length) {
    await supabase.from('PageExercise').delete().in('id', toDelete)
  }

  const saved: { id: string, kind: string }[] = []
  const now = new Date().toISOString()

  for (const r of rows) {
    const exerciseFields = {
      pageId,
      kind: r.kind,
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      prompt: r.prompt,
      options: r.options,
      orderIndex: r.orderIndex,
      updatedAt: now
    }

    let exerciseId: string
    if (r.id) {
      const { error } = await supabase.from('PageExercise').update(exerciseFields).eq('id', r.id)
      if (error) throw createError({ statusCode: 500, message: error.message })
      exerciseId = r.id
    } else {
      const { data, error } = await supabase
        .from('PageExercise')
        .insert(exerciseFields)
        .select('id')
        .single() as unknown as { data: { id: string } | null, error: any }
      if (error || !data) throw createError({ statusCode: 500, message: error?.message ?? 'insert failed' })
      exerciseId = data.id
    }

    const { error: ansErr } = await supabase
      .from('PageExerciseAnswer')
      .upsert(
        { exerciseId, answerKey: r.answerKey, explanation: r.explanation, updatedAt: now },
        { onConflict: 'exerciseId' }
      )
    if (ansErr) throw createError({ statusCode: 500, message: ansErr.message })

    saved.push({ id: exerciseId, kind: r.kind })
  }

  return { pageId, saved }
})
