import type { Conversation, ChatMessage } from '../model/types'

/**
 * Entity composable for real-time messenger.
 */
export const useMessenger = () => {
  const supabase = useTypedSupabaseClient()

  const messages = ref<ChatMessage[]>([])
  const conversations = ref<Conversation[]>([])

  /**
   * Resolve internal User.id from authId (sub).
   * Caches result to avoid repeated lookups.
   */
  const _internalIdCache = new Map<string, string>()
  const resolveInternalUserId = async (authId: string): Promise<string> => {
    if (_internalIdCache.has(authId)) return _internalIdCache.get(authId)!
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .eq('authId', authId)
      .single()
    if (error || !data) throw new Error('User not found')
    _internalIdCache.set(authId, data.id)
    return data.id
  }

  /**
     * Fetch conversations for a user.
     */
  const fetchConversations = async (_userId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from('Conversation')
      .select(`
        *,
        ConversationParticipant(*, User(name, surname, avatarUrl)),
        Message(id, content, createdAt, senderId, isRead)
      `)
      .order('updatedAt', { ascending: false })
    if (error) throw error
    conversations.value = (data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      participants: ((c.ConversationParticipant as Record<string, unknown>[] | undefined) ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        user: p.User
      })),
      lastMessage: (c.Message as Array<{ createdAt: string }> | undefined)?.sort((a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] ?? null
    })) as unknown as Conversation[]
    return conversations.value
  }

  /**
     * Fetch messages for a conversation.
     */
  const fetchMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('Message')
      .select('*, User(name, surname, avatarUrl)')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })
    if (error) throw error
    messages.value = (data ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      sender: m.User
    })) as unknown as ChatMessage[]
    return messages.value
  }

  /**
   * Send a message using the internal DB User.id as senderId.
   */
  const sendMessage = async (conversationId: string, senderId: string, content: string) => {
    const { data, error } = await supabase
      .from('Message')
      .insert({ conversationId, senderId, content })
      .select()
      .single()
    if (error) throw error

    // Update conversation timestamp
    await supabase
      .from('Conversation')
      .update({ updatedAt: new Date().toISOString(), lastMessageAt: new Date().toISOString() })
      .eq('id', conversationId)

    return data
  }

  /**
   * Mark all unread incoming messages in a conversation as read.
   * Goes through server route — RLS now allows participants to flip isRead
   * only via the controlled endpoint (which verifies membership).
   */
  const markAsRead = async (conversationId: string, _currentUserId: string) => {
    await $fetch('/api/conversations/mark-read', {
      method: 'POST',
      body: { conversationId }
    })
  }

  /**
   * Find or create a direct conversation between the caller and `otherUserId`.
   * Server resolves caller from auth and creates via service_role —
   * client INSERTs on Conversation/ConversationParticipant are blocked.
   */
  const findOrCreateConversation = async (_userIdA: string, userIdB: string): Promise<string> => {
    const res = await $fetch<{ conversationId: string }>('/api/conversations/find-or-create', {
      method: 'POST',
      body: { otherUserId: userIdB }
    })
    return res.conversationId
  }

  /**
     * Subscribe to real-time messages for a conversation.
     */
  const subscribeToMessages = (conversationId: string, onMessage: (msg: ChatMessage) => void) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload: { new: Record<string, unknown> }) => {
          const msg = payload.new as unknown as ChatMessage
          messages.value.push(msg)
          onMessage(msg)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  /**
     * Typing indicator via Realtime broadcast.
     */
  const typingUsers = ref<Set<string>>(new Set())
  let typingChannel: ReturnType<typeof supabase.channel> | null = null

  const subscribeToTyping = (conversationId: string, currentUserId: string) => {
    typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          typingUsers.value.add(payload.userName ?? 'Пользователь')
          setTimeout(() => {
            typingUsers.value.delete(payload.userName ?? 'Пользователь')
          }, 3000)
        }
      })
      .subscribe()

    return () => {
      if (typingChannel) supabase.removeChannel(typingChannel)
    }
  }

  const broadcastTyping = (conversationId: string, userId: string, userName: string) => {
    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, userName }
    })
  }

  return {
    messages,
    conversations,
    resolveInternalUserId,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    findOrCreateConversation,
    subscribeToMessages,
    typingUsers,
    subscribeToTyping,
    broadcastTyping
  }
}
