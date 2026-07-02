/**
 * GET /api/admin/books/modules   (ADMIN)
 *
 * Every book's modules (incl. unpublished drafts, which RLS hides from the
 * client) with their PDF URL + rendered page count — the authoring hub picks
 * a module from this list to render / annotate.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('Module')
    .select('id, title, order, pdfUrl, pageCount, Book ( id, title, level, isPublished )')
    .order('order') as unknown as { data: any[] | null, error: unknown }
  if (error) throw createError({ statusCode: 500, message: String(error) })

  return {
    modules: (data ?? []).map((m: any) => {
      const book = Array.isArray(m.Book) ? m.Book[0] : m.Book
      return {
        moduleId: m.id,
        moduleTitle: m.title,
        pdfUrl: m.pdfUrl as string | null,
        pageCount: m.pageCount ?? 0,
        bookId: book?.id ?? null,
        bookTitle: book?.title ?? '',
        level: book?.level ?? '',
        isPublished: Boolean(book?.isPublished)
      }
    })
  }
})
