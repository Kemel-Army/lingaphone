import type { Game, GameLevel } from '../model/types'

export const useGames = () => {
  const supabase = useTypedSupabaseClient()

  // ТЗ §5.3: GET games for a module (config prokидывается во фронтенд).
  const fetchGamesByModule = async (moduleId: string): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('Game')
      .select('*')
      .eq('moduleId', moduleId)
      .order('createdAt')
    if (error) throw error
    return (data ?? []) as unknown as Game[]
  }

  const fetchGamesByLevel = async (level: GameLevel): Promise<Game[]> => {
    const { data, error } = await supabase
      .from('Game')
      .select('*')
      .eq('level', level)
      .order('createdAt')
    if (error) throw error
    return (data ?? []) as unknown as Game[]
  }

  const fetchGameById = async (id: string): Promise<Game | null> => {
    const { data, error } = await supabase
      .from('Game')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return (data as unknown as Game) ?? null
  }

  return { fetchGamesByModule, fetchGamesByLevel, fetchGameById }
}
