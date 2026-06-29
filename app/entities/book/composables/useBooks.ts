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

  return { fetchBooks, fetchBookWithModules }
}
