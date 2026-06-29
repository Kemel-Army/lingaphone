/**
 * GET /api/games/:id  (ТЗ §4)
 * Single game config for the player.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id обязателен' })

  const supabase = useServerSupabase(event)
  const { data, error } = await supabase
    .from('Game')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'Game not found' })
  return data
})
