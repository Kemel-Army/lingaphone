/**
 * DELETE /api/content/topics/[id]
 * Delete a PathTopic (cascades to PathLesson → CapsuleLayer). Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const supabase = useServerSupabase(event)

  // Count lessons first — warn in response if non-zero
  const { count: lessonCount } = await supabase
    .from('PathLesson')
    .select('id', { count: 'exact', head: true })
    .eq('pathTopicId', id)

  const { error } = await supabase
    .from('PathTopic')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true, deletedLessons: lessonCount ?? 0 }
})
