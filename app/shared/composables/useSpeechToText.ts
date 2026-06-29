/**
 * useSpeechToText — Web Speech API composable.
 * Supports Russian + Kazakh. Works in Chrome, Edge, Safari.
 * Falls back gracefully when API is not supported.
 *
 * Type-augmentation: SpeechRecognition — это experimental API, нет в
 * стандартной TS lib.dom. Декларируем минимально-необходимые типы здесь,
 * чтобы typecheck не валился (и не тащить `@types/dom-speech-recognition`).
 */

interface SpeechRecognitionEventCustom extends Event {
  readonly resultIndex: number
  readonly results: ArrayLike<{ readonly isFinal: boolean, [index: number]: { transcript: string } }>
}
interface SpeechRecognitionErrorEventCustom extends Event {
  readonly error: string
  readonly message: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEventCustom) => unknown) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEventCustom) => unknown) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => unknown) | null
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type SpeechMode = 'append' | 'replace'

interface UseSpeechToTextOptions {
  lang?: string // default 'ru-RU'
  mode?: SpeechMode // 'append' добавляет к тексту, 'replace' заменяет
  continuous?: boolean
}

export const useSpeechToText = (options: UseSpeechToTextOptions = {}) => {
  const { lang = 'ru-RU', mode = 'append', continuous = false } = options

  const isListening = ref(false)
  const isSupported = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('') // промежуточный результат (во время речи)
  const error = ref<string | null>(null)

  let recognition: SpeechRecognitionInstance | null = null

  onMounted(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    isSupported.value = !!SR

    if (!SR) return

    recognition = new SR()
    if (!recognition) return
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEventCustom) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result.isFinal) {
          final += result[0]?.transcript ?? ''
        } else {
          interim += result?.[0]?.transcript ?? ''
        }
      }
      if (final) {
        if (mode === 'replace') {
          transcript.value = final.trim()
        } else {
          // append: добавляем с пробелом если уже есть текст
          transcript.value = transcript.value
            ? transcript.value + ' ' + final.trim()
            : final.trim()
        }
      }
      interimTranscript.value = interim
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventCustom) => {
      const msgMap: Record<string, string> = {
        'not-allowed': 'Нет доступа к микрофону',
        'no-speech': 'Речь не обнаружена',
        'network': 'Ошибка сети',
        'aborted': ''
      }
      error.value = msgMap[event.error] ?? `Ошибка: ${event.error}`
      isListening.value = false
    }

    recognition.onend = () => {
      isListening.value = false
      interimTranscript.value = ''
    }
  })

  onBeforeUnmount(() => {
    recognition?.abort()
  })

  const start = () => {
    if (!recognition || isListening.value) return
    error.value = null
    interimTranscript.value = ''
    recognition.start()
    isListening.value = true
  }

  const stop = () => {
    recognition?.stop()
    isListening.value = false
  }

  const toggle = () => {
    if (isListening.value) {
      stop()
    } else {
      start()
    }
  }

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    toggle
  }
}
