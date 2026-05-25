/**
 * DELETE /api/content/lessons/[id]
 * Delete a PathLesson (cascades to CapsuleLayer, LayerProgress, PathProgress). Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const supabase = useServerSupabase(event)

  const { count: layerCount } = await supabase
    .from('CapsuleLayer')
    .select('id', { count: 'exact', head: true })
    .eq('lessonId', id)

  const { error } = await supabase
    .from('PathLesson')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true, deletedLayers: layerCount ?? 0 }
})
