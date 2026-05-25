import type { AIConversation, AIMessage } from '../model/types'
import type { TablesInsert } from '~/shared/types/database.types'

export const useAiConversations = () => {
  const supabase = useTypedSupabaseClient()

  const fetchConversations = async (studentId: string): Promise<AIConversation[]> => {
    const { data, error } = await supabase
      .from('AIConversation')
      .select('*')
      .eq('studentId', studentId)
      .order('updatedAt', { ascending: false })
    if (error) throw error
    return data as unknown as AIConversation[]
  }

  const fetchMessages = async (conversationId: string): Promise<AIMessage[]> => {
    const { data, error } = await supabase
      .from('AIMessage')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })
    if (error) throw error
    return data as unknown as AIMessage[]
  }

  const fetchConversationById = async (id: string): Promise<AIConversation | null> => {
    const { data, error } = await supabase
      .from('AIConversation')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as AIConversation ?? null
  }

  const createConversation = async (conv: Partial<AIConversation>): Promise<AIConversation> => {
    const { data, error } = await supabase
      .from('AIConversation')
      .insert(conv as TablesInsert<'AIConversation'>)
      .select()
      .single()
    if (error) throw error
    return data as unknown as AIConversation
  }

  const saveMessage = async (msg: Partial<AIMessage>): Promise<AIMessage> => {
    const { data, error } = await supabase
      .from('AIMessage')
      .insert(msg as TablesInsert<'AIMessage'>)
      .select()
      .single()
    if (error) throw error
    return data as unknown as AIMessage
  }

  return { fetchConversations, fetchMessages, fetchConversationById, createConversation, saveMessage }
}
