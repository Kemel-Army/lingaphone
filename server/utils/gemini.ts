/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gemini API helpers (free tier via AI Studio key).
 * Key from env GEMINI_API_KEY (or runtimeConfig.geminiApiKey).
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export const getGeminiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || (useRuntimeConfig().geminiApiKey as string | undefined) || ''
  return key
}

export const isGeminiAvailable = (): boolean => getGeminiKey().length > 0

/**
 * Call a Gemini model's generateContent endpoint.
 * `body` is the raw request payload (contents, generationConfig, …).
 */
export const geminiGenerateContent = async (model: string, body: Record<string, unknown>): Promise<any> => {
  const key = getGeminiKey()
  if (!key) throw createError({ statusCode: 503, message: 'GEMINI_API_KEY not configured' })

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: res.status, message: `Gemini error: ${text.slice(0, 500)}` })
  }
  return res.json()
}

/**
 * Wrap raw 16-bit little-endian PCM into a playable WAV container.
 * Gemini TTS returns audio/L16 PCM (default 24kHz mono).
 */
export const pcmToWav = (pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer => {
  const byteRate = sampleRate * channels * (bitDepth / 8)
  const blockAlign = channels * (bitDepth / 8)
  const dataSize = pcm.length
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // audio format = PCM
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitDepth, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  pcm.copy(buffer, 44)
  return buffer
}

/** Parse the sample rate out of a Gemini audio mimeType like "audio/L16;rate=24000". */
export const parsePcmRate = (mimeType: string | undefined): number => {
  if (!mimeType) return 24000
  const m = mimeType.match(/rate=(\d+)/)
  return m ? Number(m[1]) : 24000
}
