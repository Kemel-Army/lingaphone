/**
 * POST /api/admin/books/hide-all  — mass-hide every digitized book from students.
 *
 * Sets isPublished=false on all Book rows in one shot (books stay in the DB,
 * only the RLS-gated visibility flag flips). ADMIN only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const supabase = useServerSupabase(event)
  const { error, count } = await supabase
    .from('Book')
    .update({ isPublished: false }, { count: 'exact' })
    .eq('isPublished', true)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true, hidden: count ?? 0 }
})
