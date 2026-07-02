import type {
  BookPage,
  BookPageWithExercises,
  PageExercise,
  PageAttempt
} from '../model/types'

/**
 * Reads for the interactive book (student + admin overlay editor).
 * Exercise rows never include the answer key (service-role table),
 * so `select('*')` here is safe. Writes/checking go through
 * `features/book-exercises` → server routes.
 */
export const useBookPages = () => {
  const supabase = useTypedSupabaseClient()

  /** All rendered pages of a module, each with its (answer-free) exercises. */
  const fetchModulePages = async (moduleId: string): Promise<BookPageWithExercises[]> => {
    const { data, error } = await supabase
      .from('BookPage')
      .select(
        'id, moduleId, pageNumber, imageUrl, imageWidth, imageHeight,'
        + ' PageExercise ( id, pageId, kind, x, y, w, h, prompt, options, orderIndex )'
      )
      .eq('moduleId', moduleId)
      .order('pageNumber')
    if (error) throw error

    return (data ?? []).map((row) => {
      const page = row as unknown as BookPage & { PageExercise: PageExercise[] | null }
      const exercises = [...(page.PageExercise ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
      return { ...page, exercises }
    })
  }

  /**
   * The current student's attempts across a whole module, keyed by
   * exerciseId — used to restore ✓/✗ state on load. RLS already limits
   * rows to the caller's own Student, so no explicit studentId filter.
   */
  const fetchAttemptsByExercises = async (exerciseIds: string[]): Promise<Record<string, PageAttempt>> => {
    if (!exerciseIds.length) return {}
    const { data, error } = await supabase
      .from('PageAttempt')
      .select('id, exerciseId, response, isCorrect, score, aiFeedback, audioUrl, createdAt')
      .in('exerciseId', exerciseIds)
    if (error) throw error

    const map: Record<string, PageAttempt> = {}
    for (const row of data ?? []) {
      const a = row as unknown as PageAttempt
      map[a.exerciseId] = a
    }
    return map
  }

  /** Modules that have at least one rendered page — the student's "ready" books. */
  const fetchInteractiveModules = async (): Promise<Array<{
    id: string
    title: string
    bookTitle: string
    level: string
    pageCount: number
  }>> => {
    // RLS (module_select_published) already limits rows to published books,
    // so no explicit isPublished filter is needed — and filtering on an
    // embedded column made PostgREST return 406.
    const { data, error } = await supabase
      .from('Module')
      .select('id, title, pageCount, Book!inner ( title, level )')
      .gt('pageCount', 0)
      .order('order')
    if (error) throw error

    return (data ?? []).map((row) => {
      const m = row as unknown as {
        id: string
        title: string
        pageCount: number
        Book: { title: string, level: string } | { title: string, level: string }[]
      }
      const book = Array.isArray(m.Book) ? m.Book[0] : m.Book
      return {
        id: m.id,
        title: m.title,
        bookTitle: book?.title ?? '',
        level: book?.level ?? '',
        pageCount: m.pageCount
      }
    })
  }

  return { fetchModulePages, fetchAttemptsByExercises, fetchInteractiveModules }
}
