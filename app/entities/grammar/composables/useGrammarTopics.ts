import type { GrammarTopic, GrammarExercise } from '../model/types'

export const useGrammarTopics = () => {
  const supabase = useTypedSupabaseClient()

  const fetchTopics = async (): Promise<GrammarTopic[]> => {
    const { data, error } = await supabase
      .from('GrammarTopic')
      .select('*')
      .eq('isPublished', true)
      .order('order')
    if (error) throw error
    return (data ?? []) as unknown as GrammarTopic[]
  }

  const fetchTopicBySlug = async (slug: string): Promise<GrammarTopic | null> => {
    const { data, error } = await supabase
      .from('GrammarTopic')
      .select('*')
      .eq('slug', slug)
      .eq('isPublished', true)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as GrammarTopic ?? null
  }

  const fetchExercises = async (topicId: string): Promise<GrammarExercise[]> => {
    const { data, error } = await supabase
      .from('GrammarExercise')
      .select('*')
      .eq('topicId', topicId)
      .order('order')
    if (error) throw error
    return (data ?? []) as unknown as GrammarExercise[]
  }

  return { fetchTopics, fetchTopicBySlug, fetchExercises }
}
