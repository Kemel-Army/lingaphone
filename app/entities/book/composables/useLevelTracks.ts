import type { LevelTrack } from '../model/types'

/**
 * Reads the LevelTrack reference matrix (ТЗ §2): the age/class → CEFR-tier →
 * course-book ladder. Used by the curator's student card to build a meaningful
 * level dropdown and to show which book a level binds to.
 */
export const useLevelTracks = () => {
  const supabase = useTypedSupabaseClient()

  const fetchLevelTracks = async (): Promise<LevelTrack[]> => {
    const { data, error } = await supabase
      .from('LevelTrack')
      .select('level, tier, ageRange, grades, bookTitle, orderIndex, isActive')
      .order('orderIndex')
    if (error) throw error
    return (data ?? []) as unknown as LevelTrack[]
  }

  return { fetchLevelTracks }
}
