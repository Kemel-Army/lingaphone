/**
 * DELETE /api/admin/books/[id]  — remove a book and its modules.
 *
 * Module rows cascade via the FK. The stored PDFs in the `books` bucket are
 * best-effort removed too. ADMIN only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id обязателен' })

  const supabase = useServerSupabase(event)

  // Collect PDF object paths to clean up storage after the DB delete.
  const { data: modules } = await supabase
    .from('Module')
    .select('pdfUrl')
    .eq('bookId', id) as unknown as { data: { pdfUrl: string | null }[] | null }

  const { error } = await supabase.from('Book').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  const paths = (modules ?? [])
    .map(m => m.pdfUrl)
    .filter((u): u is string => !!u)
    .map((u) => {
      const marker = '/books/'
      const i = u.indexOf(marker)
      return i >= 0 ? u.slice(i + marker.length) : null
    })
    .filter((p): p is string => !!p)

  if (paths.length) await supabase.storage.from('books').remove(paths)

  return { ok: true }
})
