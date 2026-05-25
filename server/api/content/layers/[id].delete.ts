/**
 * DELETE /api/content/layers/[id]
 * Delete a CapsuleLayer (cascades to LayerProgress). Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const supabase = useServerSupabase(event)

  const { error } = await supabase
    .from('CapsuleLayer')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
