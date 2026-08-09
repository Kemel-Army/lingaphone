import type { Database } from '~/shared/types/database.types'
import type { ConversationRow, ConversationParticipant, MessageRow } from '../model/types'
import { ROLE_LABEL } from '../model/types'

/**
 * Внутренний мессенджер (не Wazzup24/WhatsApp — см. widgets/wazzup для того).
 * DIRECT (1:1, ученик↔учитель) и GROUP (учитель + все ученики группы) чаты.
 * RLS на Conversation/Message уже ограничивает выборку участниками
 * (ANY(participantIds) = currentUserId) — здесь без дополнительных фильтров.
 */
export const useMessenger = () => {
  const supabase = useSupabaseClient<Database>()

  // Returns plain arrays (not Maps) — Nuxt's useAsyncData return-type inference
  // (KeysOf/PickFrom) blows up ("Type instantiation is excessively deep") when
  // the resolved data contains a Map. Build lookup Maps client-side from these
  // arrays instead (see buildUserMap/buildGroupNameMap below).
  const fetchConversations = async (): Promise<{
    conversations: ConversationRow[]
    users: ConversationParticipant[]
    groups: { id: string, name: string }[]
  }> => {
    const { data: convs } = await supabase
      .from('Conversation')
      .select('*')
      .order('updatedAt', { ascending: false }) as unknown as { data: ConversationRow[] | null }

    const conversations = convs ?? []

    const allParticipantIds = Array.from(new Set(conversations.flatMap(c => c.participantIds)))
    const { data: users } = allParticipantIds.length > 0
      ? await supabase.from('User').select('id, name, surname, role, avatarUrl').in('id', allParticipantIds) as unknown as { data: ConversationParticipant[] | null }
      : { data: [] as ConversationParticipant[] }

    const groupIds = Array.from(new Set(conversations.filter(c => c.groupId).map(c => c.groupId as string)))
    const { data: groups } = groupIds.length > 0
      ? await supabase.from('Group').select('id, name').in('id', groupIds) as unknown as { data: { id: string, name: string }[] | null }
      : { data: [] as { id: string, name: string }[] }

    return { conversations, users: users ?? [], groups: groups ?? [] }
  }

  const fetchMessages = async (conversationId: string): Promise<MessageRow[]> => {
    const { data } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true }) as unknown as { data: MessageRow[] | null }
    return data ?? []
  }

  const sendMessage = async (conversationId: string, senderId: string, body: string) => {
    const { error } = await supabase.from('Message').insert({ conversationId, senderId, body })
    if (error) throw error
  }

  /** Realtime-подписка на новые сообщения. Возвращает функцию отписки. */
  const subscribeToMessages = (conversationId: string, onInsert: (msg: MessageRow) => void) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message', filter: `conversationId=eq.${conversationId}` },
        (payload: { new: MessageRow }) => onInsert(payload.new)
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  return { fetchConversations, fetchMessages, sendMessage, subscribeToMessages }
}

export const buildUserMap = (users: ConversationParticipant[]): Map<string, ConversationParticipant> =>
  new Map(users.map(u => [u.id, u]))

export const buildGroupNameMap = (groups: { id: string, name: string }[]): Map<string, string> =>
  new Map(groups.map(g => [g.id, g.name]))

/** Собеседники, кроме себя — для GROUP это может быть несколько человек. */
export const otherParticipants = (
  conv: ConversationRow,
  userById: Map<string, ConversationParticipant>,
  currentUserId: string
): ConversationParticipant[] =>
  conv.participantIds
    .filter(id => id !== currentUserId)
    .map(id => userById.get(id))
    .filter((u): u is ConversationParticipant => !!u)

/**
 * True when a DIRECT conversation has another participant on paper
 * (participantIds) but their User row didn't resolve — e.g. RLS hides a
 * student who isn't (or is no longer) in one of the viewer's groups. The
 * message thread itself is still readable (Message RLS only checks
 * participantIds), so this is a real, if rare, state to label clearly
 * rather than showing a bare "?" that reads as broken/empty.
 */
const hasUnresolvedParticipant = (conv: ConversationRow, userById: Map<string, ConversationParticipant>, currentUserId: string): boolean =>
  conv.participantIds.filter(id => id !== currentUserId).length > otherParticipants(conv, userById, currentUserId).length

export const conversationTitle = (
  conv: ConversationRow,
  userById: Map<string, ConversationParticipant>,
  groupNameById: Map<string, string>,
  currentUserId: string
): string => {
  if (conv.kind === 'GROUP') {
    return (conv.groupId && groupNameById.get(conv.groupId)) || 'Групповой чат'
  }
  const other = otherParticipants(conv, userById, currentUserId)[0]
  if (other) return `${other.name} ${other.surname}`.trim()
  return hasUnresolvedParticipant(conv, userById, currentUserId) ? 'Собеседник недоступен' : 'Чат'
}

export const conversationSubtitle = (
  conv: ConversationRow,
  userById: Map<string, ConversationParticipant>,
  currentUserId: string
): string => {
  const others = otherParticipants(conv, userById, currentUserId)
  if (conv.kind === 'GROUP') {
    const teacher = others.find(u => u.role === 'TEACHER')
    const studentCount = others.filter(u => u.role === 'STUDENT').length
    return teacher ? `${teacher.name} ${teacher.surname} + ${studentCount} уч.` : `${others.length} участников`
  }
  const other = others[0]
  if (other) return ROLE_LABEL[other.role] ?? other.role
  return hasUnresolvedParticipant(conv, userById, currentUserId) ? 'Профиль недоступен' : ''
}

export const conversationInitials = (
  conv: ConversationRow,
  userById: Map<string, ConversationParticipant>,
  groupNameById: Map<string, string>,
  currentUserId: string
): string => {
  if (conv.kind === 'GROUP') {
    const name = (conv.groupId && groupNameById.get(conv.groupId)) || 'ГЧ'
    return name.slice(0, 2).toUpperCase()
  }
  const other = otherParticipants(conv, userById, currentUserId)[0]
  if (!other) return '?'
  return `${other.name?.[0] ?? ''}${other.surname?.[0] ?? ''}`.toUpperCase() || '?'
}
