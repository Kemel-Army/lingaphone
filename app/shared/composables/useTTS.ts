import { ref, computed, watch } from 'vue'

/**
 * useTTS — Text-to-Speech для Феми.
 *
 * Основной движок: Microsoft Edge neural TTS (бесплатно, без ключа).
 * Живой человеческий голос, выбирается по языку на сервере (ru/en/kk).
 * Fallback: Web Speech API (если нет сети / пользователь не авторизован).
 *
 * Кеш: короткие фразы («Молодец!», «Отлично!») сохраняются как Blob URL
 * на время сессии — один и тот же текст генерируется один раз.
 *
 * Использование:
 *   const { speak, muted, toggle, setLang } = useTTS()
 *   speak('Привет, друг!')
 */

export type TTSLang = 'ru-RU' | 'kk-KZ' | 'en-US'

const STORAGE_KEY_MUTE = 'femo:tts:muted'
const STORAGE_KEY_LANG = 'femo:tts:lang'

const muted = ref(false)
const supported = ref(false)
const voicesReady = ref(false)
const preferredLang = ref<TTSLang>('ru-RU')

// OpenAI TTS — Blob URL кеш (key = text, value = objectURL)
const audioCache = new Map<string, string>()
const MAX_CACHE = 120
let currentAudio: HTMLAudioElement | null = null

// Web Speech fallback
let voicesCache: SpeechSynthesisVoice[] = []
let initialised = false

// ─── Web Speech init (fallback) ─────────────────────────────────────────────

const ensureSupport = () => typeof window !== 'undefined' && 'speechSynthesis' in window

const loadVoices = () => {
  if (!ensureSupport()) return
  voicesCache = window.speechSynthesis.getVoices()
  voicesReady.value = voicesCache.length > 0
}

const initOnce = () => {
  if (initialised || typeof window === 'undefined') return
  initialised = true
  supported.value = ensureSupport()
  if (!supported.value) return

  try {
    if (window.localStorage.getItem(STORAGE_KEY_MUTE) === '1') muted.value = true
    const savedLang = window.localStorage.getItem(STORAGE_KEY_LANG) as TTSLang | null
    if (savedLang === 'ru-RU' || savedLang === 'kk-KZ' || savedLang === 'en-US') {
      preferredLang.value = savedLang
    }
  } catch { /* privacy mode */ }

  watch(muted, (v) => {
    try {
      window.localStorage.setItem(STORAGE_KEY_MUTE, v ? '1' : '0')
    } catch { /* ignore */ }
  })
  watch(preferredLang, (v) => {
    try {
      window.localStorage.setItem(STORAGE_KEY_LANG, v)
    } catch { /* ignore */ }
  })

  loadVoices()
  if (window.speechSynthesis && 'onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
}

// ─── Web Speech voice picker (fallback) ─────────────────────────────────────

const FEMALE_HINT = ['milena', 'katya', 'irina', 'svetlana', 'polina', 'google русский', 'google russian', 'female', 'женский']
const MALE_HINT = ['yuri', 'pavel', 'maxim', 'dmitri', 'aleksandr', 'male', 'мужской']
const NEURAL_HINT = ['natural', 'online', 'neural', 'wavenet']
const QUALITY_HINT = ['premium', 'enhanced']

const scoreVoice = (v: SpeechSynthesisVoice, exactLang: string): number => {
  const name = v.name.toLowerCase()
  let s = 0
  if (v.lang.toLowerCase() === exactLang) s += 10
  if (FEMALE_HINT.some(k => name.includes(k))) s += 50
  if (MALE_HINT.some(k => name.includes(k))) s -= 100
  if (NEURAL_HINT.some(k => name.includes(k))) s += 80
  if (QUALITY_HINT.some(k => name.includes(k))) s += 30
  if (v.default) s += 1
  return s
}

const pickVoice = (lang: string): SpeechSynthesisVoice | null => {
  const langLower = lang.toLowerCase()
  const prefix = langLower.split('-')[0]
  const candidates = voicesCache.filter((v) => {
    const vl = v.lang.toLowerCase()
    return vl === langLower || (prefix && vl.startsWith(prefix))
  })
  if (!candidates.length) return null
  return candidates.slice().sort((a, b) => scoreVoice(b, langLower) - scoreVoice(a, langLower))[0] ?? null
}

// ─── Markdown stripper ───────────────────────────────────────────────────────

const stripMarkdown = (text: string): string =>
  text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/^[#>]+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

// ─── i18n → BCP-47 ───────────────────────────────────────────────────────────

const I18N_TO_BCP47: Record<string, TTSLang> = { ru: 'ru-RU', kz: 'kk-KZ', en: 'en-US' }

// ─── OpenAI TTS ──────────────────────────────────────────────────────────────

/** Получить/закешировать Blob URL для текста через OpenAI TTS.
 *  Если запрос не удался — возвращает null (→ fallback на Web Speech). */
const fetchAudio = async (text: string, speed: number, emotion?: string, lang?: string): Promise<string | null> => {
  const cacheKey = `${lang ?? ''}__${emotion ?? ''}__${text}__${speed}`
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!

  try {
    const res = await $fetch<Blob>('/api/tts/speak', {
      method: 'POST',
      body: { text, speed, ...(lang ? { lang } : {}), ...(emotion ? { emotion } : {}) },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(res)

    // Ограничиваем размер кеша — выгоняем самый старый
    if (audioCache.size >= MAX_CACHE) {
      const firstKey = audioCache.keys().next().value
      if (firstKey) {
        URL.revokeObjectURL(audioCache.get(firstKey)!)
        audioCache.delete(firstKey)
      }
    }
    audioCache.set(cacheKey, url)
    return url
  } catch {
    return null
  }
}

/** Воспроизвести через HTML Audio (OpenAI mp3). */
const playAudio = (url: string) => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  const audio = new Audio(url)
  currentAudio = audio
  audio.play().catch(() => { /* autoplay blocked — ignore */ })
}

/** Fallback: Web Speech API. */
const speakWebSpeech = (clean: string, opts?: { lang?: string, rate?: number, pitch?: number }) => {
  if (!ensureSupport()) return
  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) synth.cancel()
  try {
    synth.resume?.()
  } catch { /* ignore */ }
  const targetLang = opts?.lang ?? preferredLang.value
  const utter = new SpeechSynthesisUtterance(clean)
  utter.lang = targetLang
  utter.rate = opts?.rate ?? 1.0
  utter.pitch = opts?.pitch ?? 1.1
  const voice = pickVoice(targetLang)
  if (voice) utter.voice = voice
  if (!voicesReady.value) {
    let fired = false
    const onceFire = () => {
      if (fired) return
      fired = true
      const v = pickVoice(targetLang)
      if (v) utter.voice = v
      synth.speak(utter)
    }
    try {
      synth.addEventListener('voiceschanged', onceFire, { once: true })
    } catch { /* ignore */ }
    window.setTimeout(onceFire, 1200)
    return
  }
  synth.speak(utter)
}

// ─── Public composable ───────────────────────────────────────────────────────

export function useTTS() {
  initOnce()

  const voiceAvailable = computed(() => {
    if (typeof window === 'undefined') return false
    return true // OpenAI всегда доступен когда есть сеть
  })

  const speak = (text: string, opts?: { lang?: TTSLang | string, rate?: number, pitch?: number, emotion?: string }) => {
    if (muted.value) return
    if (!text?.trim()) return
    const clean = stripMarkdown(text)
    if (!clean) return

    // speed ≈ rate (диапазон 0.25–4.0, дефолт 1.0)
    const speed = opts?.rate ?? 1.0
    const emotion = opts?.emotion
    const lang = (opts?.lang as string | undefined) ?? preferredLang.value

    // Пробуем Edge TTS → при ошибке Web Speech
    fetchAudio(clean, speed, emotion, lang).then((url) => {
      if (muted.value) return
      if (url) {
        playAudio(url)
      } else {
        speakWebSpeech(clean, opts)
      }
    })
  }

  const cancel = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      currentAudio = null
    }
    if (ensureSupport()) window.speechSynthesis?.cancel()
  }

  const toggle = () => {
    muted.value = !muted.value
    if (muted.value) cancel()
  }

  const setLang = (lang: TTSLang | string) => {
    if (lang === 'ru-RU' || lang === 'kk-KZ' || lang === 'en-US') {
      preferredLang.value = lang
      return
    }
    const mapped = I18N_TO_BCP47[lang]
    if (mapped) preferredLang.value = mapped
  }

  return {
    speak,
    cancel,
    toggle,
    muted,
    supported,
    voicesReady,
    voiceAvailable,
    preferredLang,
    setLang
  }
}
