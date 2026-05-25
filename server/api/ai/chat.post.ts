import { z } from 'zod'
import { buildIaeSystemPrompt } from '../../utils/ai-agent'
import { isAiAvailable, getMockChatResponse } from '../../utils/ai-mock'

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  mode: z.enum(['EXPLAIN', 'PRACTICE', 'CHECK_HW', 'MOCK_TEST', 'FREE']),
  subject: z.string().optional(),
  topic: z.string().optional(),
  studentModelId: z.string().uuid().optional(),
  language: z.enum(['ru', 'kz']).default('ru')
})

export default defineEventHandler(async (event) => {
  const _user = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Load conversation history
  const { data: historyData } = await supabase
    .from('AIMessage')
    .select('role, content')
    .eq('conversationId', body.conversationId)
    .order('createdAt', { ascending: true })
    .limit(30)

  const history = (historyData ?? []).map((m: any) => ({
    role: m.role === 'user' ? 'user' as const : 'assistant' as const,
    content: m.content
  }))

  // Load Student Model if provided
  let studentModel: any = null
  if (body.studentModelId) {
    const { data: sm } = await supabase
      .from('StudentModel')
      .select('knowledgeMap, errorPatterns, learningStyle, difficultyLevel, speed')
      .eq('id', body.studentModelId)
      .single()
    studentModel = sm
  }

  // Build system prompt with IAE context
  const systemPrompt = buildIaeSystemPrompt({
    mode: body.mode,
    subject: body.subject,
    topic: body.topic,
    studentModel,
    language: body.language
  })

  // Save user message
  await supabase.from('AIMessage').insert({
    conversationId: body.conversationId,
    role: 'user',
    content: body.message
  } as any)

  // Stream response via SSE
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const encoder = new TextEncoder()

  // ── Demo mode: stream mock response when OpenAI key is absent ──
  if (!isAiAvailable()) {
    const mockText = getMockChatResponse(body.mode)
    const readable = new ReadableStream({
      async start(controller) {
        // Stream character-by-character in small chunks for realistic effect
        const chunkSize = 4
        for (let i = 0; i < mockText.length; i += chunkSize) {
          const chunk = mockText.slice(i, i + chunkSize)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`))
          await new Promise(r => setTimeout(r, 20))
        }

        // Save assistant message
        await supabase.from('AIMessage').insert({
          conversationId: body.conversationId,
          role: 'assistant',
          content: mockText
        } as any)

        await supabase.from('AIConversation').update({
          updatedAt: new Date().toISOString()
        } as any).eq('id', body.conversationId)

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      }
    })
    return sendStream(event, readable)
  }

  // ── Production mode: real OpenAI streaming ──
  const { useOpenAI } = await import('../../utils/ai-agent')
  const openai = useOpenAI()

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: body.message }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 2000
  })

  let fullContent = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (delta) {
            fullContent += delta
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`))
          }
        }

        // Save assistant message after streaming completes
        await supabase.from('AIMessage').insert({
          conversationId: body.conversationId,
          role: 'assistant',
          content: fullContent
        } as any)

        // Update conversation timestamp
        await supabase.from('AIConversation').update({
          updatedAt: new Date().toISOString()
        } as any).eq('id', body.conversationId)

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
        controller.close()
      }
    }
  })

  return sendStream(event, readable)
})
