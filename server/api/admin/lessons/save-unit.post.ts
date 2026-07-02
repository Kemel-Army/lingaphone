/**
 * POST /api/admin/lessons/save-unit   (ADMIN)
 *
 * Upserts one LessonUnit and its exercises + answer keys. Exercises are matched
 * by id (existing updated, missing deleted, new inserted). Answer keys go to the
 * service-role-only table. This is how the admin enters their own content.
 *
 * Body: { moduleId, unit: { id?, title, subtitle?, orderIndex?, intro? },
 *         exercises: [ { id?, type, instruction?, content?, xp?, answerKey?, explanation? } ] }
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const TYPES = ['FILL_BLANK', 'CHOOSE', 'MCQ', 'WORD_IMAGE_MATCH', 'MATCH_PAIRS', 'REORDER', 'TRUE_FALSE', 'SORT_COLUMNS', 'SHORT_TEXT']

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = await readBody(event) as {
    moduleId?: string
    unit?: { id?: string, title?: string, subtitle?: string, orderIndex?: number, intro?: unknown[] }
    exercises?: any[]
  }
  const moduleId = body.moduleId
  const u = body.unit
  const incoming = Array.isArray(body.exercises) ? body.exercises : []
  if (!moduleId || !u?.title) throw createError({ statusCode: 400, message: 'moduleId и title обязательны' })

  const supabase = useServerSupabase(event)
  const now = new Date().toISOString()

  // ── unit ──
  const unitFields: any = {
    moduleId,
    title: u.title,
    subtitle: u.subtitle ?? null,
    orderIndex: u.orderIndex ?? 0,
    intro: Array.isArray(u.intro) ? u.intro : [],
    updatedAt: now
  }
  let unitId: string
  if (u.id) {
    const { error } = await supabase.from('LessonUnit').update(unitFields).eq('id', u.id)
    if (error) throw createError({ statusCode: 500, message: error.message })
    unitId = u.id
  } else {
    const { data, error } = await supabase.from('LessonUnit').insert(unitFields).select('id').single() as unknown as { data: { id: string } | null, error: any }
    if (error || !data) throw createError({ statusCode: 500, message: error?.message ?? 'insert unit failed' })
    unitId = data.id
  }

  // ── exercises (id-preserving) ──
  const { data: existing } = await supabase.from('LessonExercise').select('id').eq('unitId', unitId) as unknown as { data: { id: string }[] | null }
  const keep = new Set(incoming.filter(e => typeof e.id === 'string').map(e => e.id as string))
  const toDelete = (existing ?? []).map(e => e.id).filter(id => !keep.has(id))
  if (toDelete.length) await supabase.from('LessonExercise').delete().in('id', toDelete)

  const saved: { id: string }[] = []
  let order = 0
  for (const ex of incoming) {
    if (!TYPES.includes(ex.type)) throw createError({ statusCode: 400, message: `Неизвестный тип: ${ex.type}` })
    const exFields = {
      unitId,
      orderIndex: order++,
      type: ex.type,
      instruction: typeof ex.instruction === 'string' ? ex.instruction : null,
      content: ex.content && typeof ex.content === 'object' ? ex.content : {},
      xp: Number.isInteger(ex.xp) ? ex.xp : 10,
      updatedAt: now
    }
    let exId: string
    if (typeof ex.id === 'string') {
      const { error } = await supabase.from('LessonExercise').update(exFields).eq('id', ex.id)
      if (error) throw createError({ statusCode: 500, message: error.message })
      exId = ex.id
    } else {
      const { data, error } = await supabase.from('LessonExercise').insert(exFields).select('id').single() as unknown as { data: { id: string } | null, error: any }
      if (error || !data) throw createError({ statusCode: 500, message: error?.message ?? 'insert exercise failed' })
      exId = data.id
    }
    const { error: ansErr } = await supabase.from('LessonExerciseAnswer').upsert({
      exerciseId: exId,
      answerKey: ex.answerKey && typeof ex.answerKey === 'object' ? ex.answerKey : {},
      explanation: typeof ex.explanation === 'string' ? ex.explanation : null,
      updatedAt: now
    }, { onConflict: 'exerciseId' })
    if (ansErr) throw createError({ statusCode: 500, message: ansErr.message })
    saved.push({ id: exId })
  }

  return { unitId, exercises: saved }
})
