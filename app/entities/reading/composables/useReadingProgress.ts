import type { ReadingProgress } from '../model/types'

export const useReadingProgress = () => {
  const supabase = useTypedSupabaseClient()
  const user = useSupabaseUser()

  const fetchMyProgress = async (): Promise<ReadingProgress[]> => {
    const id = user.value?.sub
    if (!id) return []
    const { data, error } = await supabase
      .from('ReadingProgress')
      .select('*')
      .eq('studentId', id)
    if (error) throw error
    return (data ?? []) as unknown as ReadingProgress[]
  }

  const fetchTextProgress = async (textId: string): Promise<ReadingProgress | null> => {
    const id = user.value?.sub
    if (!id) return null
    const { data, error } = await supabase
      .from('ReadingProgress')
      .select('*')
      .eq('studentId', id)
      .eq('textId', textId)
      .maybeSingle()
    if (error) throw error
    return (data as unknown as ReadingProgress) ?? null
  }

  const upsertProgress = async (
    textId: string,
    score: number,
    maxScore: number,
    xpEarned: number
  ): Promise<ReadingProgress> => {
    const studentId = user.value?.sub
    if (!studentId) throw new Error('Not authenticated')

    const existing = await fetchTextProgress(textId)
    const now = new Date().toISOString()

    const payload = {
      studentId,
      textId,
      score: Math.max(existing?.score ?? 0, score),
      maxScore,
      xpEarned: (existing?.xpEarned ?? 0) + (existing?.completedAt ? 0 : xpEarned),
      completedAt: existing?.completedAt ?? now
    }

    const { data, error } = await supabase
      .from('ReadingProgress')
      .upsert(payload, { onConflict: 'studentId,textId' })
      .select()
      .single()

    if (error) throw error
    return data as unknown as ReadingProgress
  }

  return { fetchMyProgress, fetchTextProgress, upsertProgress }
}
