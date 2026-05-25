import { z } from 'zod'

/**
 * Anonymous TTS endpoint for FEMO Battle host.
 * Uses OpenAI gpt-4o-mini-tts with Femi-fox child-voice instructions.
 *
 * No auth (battle host is not logged in). Caps text length and validates
 * sessionId to ensure the call is contextual to a real battle.
 */
const bodySchema = z.object({
  text: z.string().min(1).max(200),
  sessionId: z.string().uuid(),
  emotion: z.string().max(150).optional()
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
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Validate session exists (anti-abuse — TTS requires a real battle context)
  const { data: sessionRaw, error: sessErr } = await supabase
    .from('BattleSession')
    .select('id, status')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (sessErr) throw createError({ statusCode: 500, message: sessErr.message })
  if (!sessionRaw) throw createError({ statusCode: 404, message: 'Session not found' })

  const apiKey = process.env.OPENAI_API_KEY || useRuntimeConfig().openaiApiKey
  if (!apiKey) throw createError({ statusCode: 500, message: 'OPENAI_API_KEY not configured' })

  const instructions = body.emotion
    ? `${FEMI_BASE_INSTRUCTIONS}\n\nFor this specific line, deliver it: ${body.emotion}`
    : FEMI_BASE_INSTRUCTIONS

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'fable',
      input: body.text,
      instructions,
      speed: 1.15,
      response_format: 'mp3'
    })
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw createError({ statusCode: 502, message: `TTS upstream error: ${err.slice(0, 200)}` })
  }

  const buf = await response.arrayBuffer()
  setHeader(event, 'Content-Type', 'audio/mpeg')
  setHeader(event, 'Cache-Control', 'no-store')
  return new Uint8Array(buf)
})
