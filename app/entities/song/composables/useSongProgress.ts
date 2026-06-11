import type { SongProgress } from '../model/types'

export const useSongProgress = () => {
  const supabase = useTypedSupabaseClient()
  const user = useSupabaseUser()

  const fetchMyProgress = async (): Promise<SongProgress[]> => {
    const id = user.value?.sub
    if (!id) return []
    const { data, error } = await supabase
      .from('SongProgress')
      .select('*')
      .eq('studentId', id)
    if (error) throw error
    return (data ?? []) as unknown as SongProgress[]
  }

  const fetchSongProgressById = async (songId: string): Promise<SongProgress | null> => {
    const id = user.value?.sub
    if (!id) return null
    const { data, error } = await supabase
      .from('SongProgress')
      .select('*')
      .eq('studentId', id)
      .eq('songId', songId)
      .maybeSingle()
    if (error) throw error
    return (data as unknown as SongProgress) ?? null
  }

  const upsertProgress = async (
    songId: string,
    score: number,
    maxScore: number,
    xpEarned: number
  ): Promise<SongProgress> => {
    const studentId = user.value?.sub
    if (!studentId) throw new Error('Not authenticated')

    const existing = await fetchSongProgressById(songId)
    const now = new Date().toISOString()

    const payload = {
      studentId,
      songId,
      score: Math.max(existing?.score ?? 0, score),
      maxScore,
      xpEarned: (existing?.xpEarned ?? 0) + (existing?.completedAt ? 0 : xpEarned),
      completedAt: existing?.completedAt ?? now
    }

    const { data, error } = await supabase
      .from('SongProgress')
      .upsert(payload, { onConflict: 'studentId,songId' })
      .select()
      .single()

    if (error) throw error
    return data as unknown as SongProgress
  }

  return { fetchMyProgress, fetchSongProgressById, upsertProgress }
}
