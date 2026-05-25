export interface Conversation {
  id: string
  createdAt: string
  updatedAt: string
  participants: ConversationParticipant[]
  lastMessage?: ChatMessage
}

export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  user: {
    name: string
    surname: string
    avatarUrl: string | null
  }
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  fileUrls: string[]
  isRead: boolean
  createdAt: string
  sender?: {
    name: string
    surname: string
    avatarUrl: string | null
  }
}
