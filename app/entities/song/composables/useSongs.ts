import type { Song } from '../model/types'

export const useSongs = () => {
  const supabase = useTypedSupabaseClient()

  const fetchSongs = async (): Promise<Song[]> => {
    const { data, error } = await supabase
      .from('Song')
      .select('*')
      .eq('isPublished', true)
      .order('level')
      .order('createdAt')
    if (error) throw error
    return (data ?? []) as unknown as Song[]
  }

  const fetchSongById = async (id: string): Promise<Song | null> => {
    const { data, error } = await supabase
      .from('Song')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data as unknown as Song) ?? null
  }

  return { fetchSongs, fetchSongById }
}
