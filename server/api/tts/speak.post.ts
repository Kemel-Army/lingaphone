import { z } from 'zod'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

/**
 * POST /api/tts/speak — Femi's voice via Microsoft Edge neural TTS.
 *
 * Free, no API key, human-sounding neural voices (incl. natural Russian).
 * Returns MP3 the browser plays directly. Voice is picked by language:
 * ru → Svetlana, en → Sonia (British, matches the Access book), kk → Aigul.
 * On any failure the client falls back to the browser Web Speech API.
 *
 * NOTE: Gemini TTS was dropped for the voice — its free preview model does
 * not synthesise Russian (returns finishReason OTHER). Gemini is still used
 * for capsule generation (text/vision), which the free tier does support.
 */
const bodySchema = z.object({
  text: z.string().min(1).max(600),
  lang: z.string().max(10).optional(),
  voice: z.string().max(60).optional(),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  emotion: z.string().max(200).optional()
})

const VOICE_BY_LANG: Record<string, string> = {
  ru: 'ru-RU-SvetlanaNeural',
  kk: 'kk-KZ-AigulNeural',
  kz: 'kk-KZ-AigulNeural',
  en: 'en-GB-SoniaNeural'
}

const pickVoice = (lang?: string, explicit?: string): string => {
  if (explicit) return explicit
  const key = (lang ?? 'ru').toLowerCase().split('-')[0] ?? 'ru'
  return VOICE_BY_LANG[key] ?? VOICE_BY_LANG.ru!
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const voice = pickVoice(body.lang, body.voice)

  const tts = new MsEdgeTTS()
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

    // Gentle, warm, kid-friendly tuning; map speed → relative rate %.
    const ratePct = Math.round((body.speed - 1) * 100)
    const rate = `${ratePct >= 0 ? '+' : ''}${ratePct}%`

    const { audioStream } = tts.toStream(body.text, { pitch: '+6%', rate })
    const chunks: Buffer[] = []
    for await (const chunk of audioStream as AsyncIterable<Buffer>) chunks.push(chunk)
    const mp3 = Buffer.concat(chunks)
    if (!mp3.length) throw createError({ statusCode: 502, message: 'Empty audio' })

    setResponseHeader(event, 'Content-Type', 'audio/mpeg')
    setResponseHeader(event, 'Content-Length', mp3.length)
    setResponseHeader(event, 'Cache-Control', 'private, max-age=86400')
    return mp3
  } finally {
    tts.close()
  }
})
