import type { AIMode } from '~/shared/types/common'

export interface AIConversation {
  id: string
  studentId: string
  subjectId: string | null
  topicId: string | null
  mode: AIMode
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface AIMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}
