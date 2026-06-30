import type { Book, BookModule, BookWithModules, BookLevel } from '../model/types'

export const useBooks = () => {
  const supabase = useTypedSupabaseClient()

  const fetchBooks = async (level?: BookLevel): Promise<Book[]> => {
    let query = supabase
      .from('Book')
      .select('*')
      .eq('isPublished', true)
      .order('level')
      .order('createdAt')
    if (level) query = query.eq('level', level)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as Book[]
  }

  const fetchBookWithModules = async (id: string): Promise<BookWithModules | null> => {
    const { data, error } = await supabase
      .from('Book')
      .select('*, Module(*)')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const row = data as unknown as Book & { Module: BookModule[] }
    const modules = [...(row.Module ?? [])].sort((a, b) => a.order - b.order)
    return { ...row, modules }
  }

  /** Admin view — every book (incl. drafts) with its first module's PDF URL. */
  const fetchAllBooks = async (): Promise<Array<Book & { pdfUrl: string | null }>> => {
    const { data, error } = await supabase
      .from('Book')
      .select('*, Module ( pdfUrl, order )')
      .order('level')
      .order('createdAt', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => {
      const b = row as unknown as Book & { Module: { pdfUrl: string | null, order: number }[] | null }
      const mods = [...(b.Module ?? [])].sort((a, b) => a.order - b.order)
      return { ...b, pdfUrl: mods[0]?.pdfUrl ?? null }
    })
  }

  /** Drag-and-drop upload: stores the PDF and creates the Book + first Module. */
  const uploadBook = async (opts: {
    file: File
    level: BookLevel
    title?: string
    isPublished?: boolean
  }): Promise<{ id: string }> => {
    const fd = new FormData()
    fd.append('file', opts.file)
    fd.append('level', opts.level)
    if (opts.title) fd.append('title', opts.title)
    fd.append('isPublished', String(opts.isPublished ?? true))
    return await $fetch('/api/admin/books/upload', { method: 'POST', body: fd })
  }

  const deleteBook = async (id: string): Promise<void> => {
    await $fetch(`/api/admin/books/${id}`, { method: 'DELETE' })
  }

  return { fetchBooks, fetchAllBooks, fetchBookWithModules, uploadBook, deleteBook }
}
