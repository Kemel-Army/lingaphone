import type { GrammarProgress } from '../model/types'

export const useGrammarProgress = () => {
  const supabase = useTypedSupabaseClient()
  const user = useSupabaseUser()

  const fetchMyProgress = async (): Promise<GrammarProgress[]> => {
    const id = user.value?.sub
    if (!id) return []
    const { data, error } = await supabase
      .from('GrammarProgress')
      .select('*')
      .eq('studentId', id)
    if (error) throw error
    return (data ?? []) as unknown as GrammarProgress[]
  }

  const fetchTopicProgress = async (topicId: string): Promise<GrammarProgress | null> => {
    const id = user.value?.sub
    if (!id) return null
    const { data, error } = await supabase
      .from('GrammarProgress')
      .select('*')
      .eq('studentId', id)
      .eq('topicId', topicId)
      .maybeSingle()
    if (error) throw error
    return data as unknown as GrammarProgress ?? null
  }

  const upsertProgress = async (
    topicId: string,
    score: number,
    maxScore: number
  ): Promise<GrammarProgress> => {
    const studentId = user.value?.sub
    if (!studentId) throw new Error('Not authenticated')

    const existing = await fetchTopicProgress(topicId)
    const ratio = maxScore > 0 ? score / maxScore : 0
    const prevMastery = existing?.mastery ?? 0

    // Additive mastery: +0.35 per attempt, weighted by score ratio
    const masteryDelta = ratio * 0.35
    const newMastery = Math.min(1.0, prevMastery + masteryDelta)
    const newBestScore = Math.max(existing?.bestScore ?? 0, score)
    const now = new Date().toISOString()

    const payload = {
      studentId,
      topicId,
      mastery: newMastery,
      attempts: (existing?.attempts ?? 0) + 1,
      bestScore: newBestScore,
      maxScore,
      lastPracticed: now,
      completedAt: newMastery >= 0.7 && !existing?.completedAt ? now : (existing?.completedAt ?? null)
    }

    const { data, error } = await supabase
      .from('GrammarProgress')
      .upsert(payload, { onConflict: 'studentId,topicId' })
      .select()
      .single()

    if (error) throw error
    return data as unknown as GrammarProgress
  }

  return { fetchMyProgress, fetchTopicProgress, upsertProgress }
}
