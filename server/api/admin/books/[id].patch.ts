/**
 * PATCH /api/admin/books/[id]  — toggle a book's visibility to students.
 *
 * Sets isPublished; RLS (book_select_published) already gates student reads
 * on this flag, so this is a show/hide switch, not a delete. ADMIN only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id обязателен' })

  const body = await readBody<{ isPublished?: boolean }>(event)
  if (typeof body?.isPublished !== 'boolean') {
    throw createError({ statusCode: 400, message: 'isPublished (boolean) обязателен' })
  }

  const supabase = useServerSupabase(event)
  const { error } = await supabase
    .from('Book')
    .update({ isPublished: body.isPublished })
    .eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
