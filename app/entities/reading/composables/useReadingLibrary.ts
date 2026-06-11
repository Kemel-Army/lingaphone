import type { ReadingText, ReadingQuestion } from '../model/types'

export const useReadingLibrary = () => {
  const supabase = useTypedSupabaseClient()

  const fetchTexts = async (): Promise<ReadingText[]> => {
    const { data, error } = await supabase
      .from('ReadingText')
      .select('*')
      .eq('isPublished', true)
      .order('level')
      .order('createdAt')
    if (error) throw error
    return (data ?? []) as unknown as ReadingText[]
  }

  const fetchTextById = async (id: string): Promise<ReadingText | null> => {
    const { data, error } = await supabase
      .from('ReadingText')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data as unknown as ReadingText) ?? null
  }

  const fetchQuestions = async (textId: string): Promise<ReadingQuestion[]> => {
    const { data, error } = await supabase
      .from('ReadingQuestion')
      .select('*')
      .eq('textId', textId)
      .order('order')
    if (error) throw error
    return (data ?? []) as unknown as ReadingQuestion[]
  }

  return { fetchTexts, fetchTextById, fetchQuestions }
}
