/**
 * GET /api/content/lessons/[id]
 * Get a PathLesson with its CapsuleLayers. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('PathLesson')
    .select('*, CapsuleLayer(*), PathTopic(id, name, gradeLevel)')
    .eq('id', id)
    .order('orderIndex', { referencedTable: 'CapsuleLayer', ascending: true })
    .single()

  if (error) throw createError({ statusCode: error.code === 'PGRST116' ? 404 : 500, message: error.message })
  return data
})
