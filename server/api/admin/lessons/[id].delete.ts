/**
 * DELETE /api/admin/lessons/[id]   (ADMIN) — remove a LessonUnit (cascades its
 * exercises, answers and attempts).
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id обязателен' })

  const supabase = useServerSupabase(event)
  const { error } = await supabase.from('LessonUnit').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
