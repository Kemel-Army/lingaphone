/**
 * Browser-native speech utilities for Lingafon pronunciation trainer.
 *
 * - speak() — TTS via SpeechSynthesisUtterance, prefers British English voice.
 * - useRecognition() — STT via webkitSpeechRecognition, returns transcript.
 * - similarity() — normalized 0-100 closeness between spoken and target text.
 *
 * No external libs. Works in Chrome / Edge / Safari (latest).
 * Requires HTTPS or localhost for microphone access.
 */

type WindowWithSpeech = Window & typeof globalThis & {
  webkitSpeechRecognition?: typeof SpeechRecognition
  SpeechRecognition?: typeof SpeechRecognition
}

/** Strip punctuation, normalize spaces, lowercase. */
const normalize = (s: string) =>
  s.toLowerCase()
    .replace(/[.,!?;:'"()‘’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Levenshtein distance between two strings (iterative, O(n*m)). */
const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]!
}

/** 0-100 similarity score. 100 = identical, 0 = nothing in common. */
export const similarity = (spoken: string, target: string): number => {
  const a = normalize(spoken)
  const b = normalize(target)
  if (!a || !b) return 0
  if (a === b) return 100
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return Math.max(0, Math.round((1 - dist / maxLen) * 100))
}

let cachedVoices: SpeechSynthesisVoice[] | null = null

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => new Promise((resolve) => {
  if (typeof window === 'undefined') return resolve([])
  if (cachedVoices?.length) return resolve(cachedVoices)
  const synth = window.speechSynthesis
  const initial = synth.getVoices()
  if (initial.length) {
    cachedVoices = initial
    return resolve(initial)
  }
  // Voices load async on first call
  synth.onvoiceschanged = () => {
    cachedVoices = synth.getVoices()
    resolve(cachedVoices)
  }
  // Safety timeout
  setTimeout(() => resolve(synth.getVoices()), 1500)
})

/** Speak `text` using a British English voice if available. */
export const speak = async (text: string, opts: { rate?: number, pitch?: number } = {}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const voices = await loadVoices()
  const britishVoice = voices.find(v => v.lang === 'en-GB' && /UK|Google UK|Daniel|Kate|Serena|Arthur/i.test(v.name))
    ?? voices.find(v => v.lang === 'en-GB')
    ?? voices.find(v => v.lang.startsWith('en'))
  const utterance = new SpeechSynthesisUtterance(text)
  if (britishVoice) utterance.voice = britishVoice
  utterance.lang = britishVoice?.lang ?? 'en-GB'
  utterance.rate = opts.rate ?? 0.9
  utterance.pitch = opts.pitch ?? 1
  synth.speak(utterance)
  return true
}

export interface RecognitionResult {
  transcript: string
  confidence: number
}

export const useRecognition = () => {
  const isSupported = ref(false)
  const isListening = ref(false)
  const transcript = ref('')
  const error = ref<string | null>(null)

  if (typeof window !== 'undefined') {
    const w = window as WindowWithSpeech
    isSupported.value = !!(w.SpeechRecognition || w.webkitSpeechRecognition)
  }

  let recognition: SpeechRecognition | null = null

  const start = (): Promise<RecognitionResult> => new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'))
    const w = window as WindowWithSpeech
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      error.value = 'Браузер не поддерживает распознавание речи. Открой в Chrome или Edge.'
      return reject(new Error('Not supported'))
    }

    transcript.value = ''
    error.value = null
    recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      isListening.value = true
    }
    recognition.onend = () => {
      isListening.value = false
    }
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      isListening.value = false
      const messages: Record<string, string> = {
        'no-speech': 'Не услышал — попробуй ещё раз',
        'not-allowed': 'Разреши доступ к микрофону в настройках браузера',
        'audio-capture': 'Микрофон не подключён',
        'network': 'Нет сети для распознавания'
      }
      error.value = messages[e.error] ?? `Ошибка: ${e.error}`
      reject(new Error(e.error))
    }
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[0]
      if (!result) return
      const best = result[0]
      transcript.value = best.transcript
      resolve({ transcript: best.transcript, confidence: best.confidence })
    }

    try {
      recognition.start()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Не удалось запустить распознавание'
      reject(e)
    }
  })

  const stop = () => {
    recognition?.stop()
    isListening.value = false
  }

  return { isSupported, isListening, transcript, error, start, stop }
}
