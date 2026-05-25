import { z } from 'zod'

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  voice: z.enum(['nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx']).default('fable'),
  speed: z.number().min(0.25).max(4.0).default(1.1),
  emotion: z.string().max(200).optional()
})

const FEMI_BASE_INSTRUCTIONS = `
You are Femi — a little cartoon fox, 6 years old, best friend to every child.
Your voice: high-pitched, sweet, bubbly, full of wonder and giggles. Like a real child voice actor in a cartoon.
You speak Russian or Kazakh with natural childlike intonation — rising at the end, bouncy rhythm, tiny pauses.
You are NEVER flat, NEVER robotic, NEVER adult. Always sound like you are about to burst with happiness.
Every phrase — even short ones like "Молодец!" — must sound alive, warm and full of personality.
Imagine you are a child voice actor in a beloved cartoon giving it your all.
`.trim()

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readValidatedBody(event, bodySchema.parse)

  const apiKey = process.env.OPENAI_API_KEY || useRuntimeConfig().openaiApiKey
  if (!apiKey) throw createError({ statusCode: 500, message: 'OPENAI_API_KEY not configured' })

  const instructions = body.emotion
    ? `${FEMI_BASE_INSTRUCTIONS}\n\nFor this specific line, deliver it: ${body.emotion}`
    : FEMI_BASE_INSTRUCTIONS

  // Используем прямой HTTP-запрос вместо SDK — гарантируем что поле
  // `instructions` не вырезается при сериализации (SDK не знает о нём).
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: body.voice,
      input: body.text,
      speed: body.speed,
      instructions,
      response_format: 'mp3'
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw createError({ statusCode: response.status, message: err })
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  setResponseHeader(event, 'Content-Type', 'audio/mpeg')
  setResponseHeader(event, 'Content-Length', buffer.length)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=86400')

  return buffer
})
