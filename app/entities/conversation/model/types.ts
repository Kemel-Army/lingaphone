import type { Database } from '~/shared/types/database.types'

export type ConversationRow = Database['public']['Tables']['Conversation']['Row']
export type MessageRow = Database['public']['Tables']['Message']['Row']

export interface ConversationParticipant {
  id: string
  name: string
  surname: string
  role: string
  avatarUrl: string | null
}

export const ROLE_LABEL: Record<string, string> = {
  TEACHER: 'Педагог',
  ADMIN: 'Школа',
  STUDENT: 'Ученик',
  PARENT: 'Родитель',
  DIRECTOR: 'Директор'
}
