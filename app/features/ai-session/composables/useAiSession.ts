import type { AiSessionConfig, AiStreamChunk } from '../model/types'
import { useAiConversations } from '~/entities/ai-conversation'
import type { AIConversation, AIMessage } from '~/entities/ai-conversation'

/**
 * Feature composable: AI tutor session with SSE streaming.
 * Manages conversation lifecycle, streaming responses, and XP.
 */
export const useAiSession = () => {
  const { createConversation, fetchMessages } = useAiConversations()
  const toast = useAppToast()

  const conversation = ref<AIConversation | null>(null)
  const messages = ref<AIMessage[]>([])
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const error = ref<string | null>(null)
  const sessionStartTime = ref<number>(0)

  /**
   * Start a new AI session.
   */
  const startSession = async (config: AiSessionConfig) => {
    try {
      conversation.value = await createConversation({
        studentId: config.studentId,
        subjectId: config.subjectId ?? null,
        topicId: config.topicId ?? null,
        mode: config.mode,
        title: null
      })
      messages.value = []
      sessionStartTime.value = Date.now()
    } catch {
      toast.error('Ошибка', 'Не удалось начать сессию')
    }
  }

  /**
   * Load existing session.
   */
  const loadSession = async (conversationId: string) => {
    try {
      messages.value = await fetchMessages(conversationId)
    } catch {
      toast.error('Ошибка', 'Не удалось загрузить историю')
    }
  }

  /**
   * Send a message and get AI response via SSE streaming.
   * Note: Server handles DB persistence for both user and assistant messages.
   */
  const sendMessage = async (content: string) => {
    if (!conversation.value || isStreaming.value) return

    error.value = null

    // Add user message to UI immediately (optimistic)
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      conversationId: conversation.value.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }
    messages.value.push(userMessage)

    // Start streaming AI response
    isStreaming.value = true
    streamingContent.value = ''

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.value.id,
          message: content,
          mode: conversation.value.mode,
          subject: conversation.value.subjectId ?? undefined,
          topic: conversation.value.topicId ?? undefined
        })
      })

      if (!response.ok) throw new Error('AI server error')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Add placeholder assistant message
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        conversationId: conversation.value.id,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
      }
      messages.value.push(assistantMessage)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const chunk: AiStreamChunk = JSON.parse(data)
            if (chunk.type === 'content' && chunk.content) {
              streamingContent.value += chunk.content
              assistantMessage.content = streamingContent.value
            }
            if (chunk.type === 'error') {
              error.value = chunk.error ?? 'Unknown error'
            }
          } catch {
            // Non-JSON line, treat as raw content
            if (data.trim()) {
              streamingContent.value += data
              assistantMessage.content = streamingContent.value
            }
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка подключения к AI'
      error.value = msg
      toast.error('Ошибка AI', msg)
    } finally {
      isStreaming.value = false
      streamingContent.value = ''
    }
  }

  return {
    conversation: readonly(conversation),
    messages,
    isStreaming: readonly(isStreaming),
    streamingContent: readonly(streamingContent),
    error: readonly(error),
    startSession,
    loadSession,
    sendMessage
  }
}
