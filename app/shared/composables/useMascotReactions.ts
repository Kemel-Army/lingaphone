import { ref, readonly } from 'vue'
import { useTTS } from './useTTS'

/**
 * useMascotReactions — глобальный «эмоциональный канал» Феми.
 *
 * Любой layer-компонент при ответе ребёнка может дёрнуть `flash('celebrate', 800)`
 * или `flash('warn', 1200)`. Все экземпляры FemiMascot на странице — а маскот
 * рендерится в каждом из 11 слоёв капсулы — синхронно отреагируют на это
 * временное состояние, потом плавно вернутся к своему «спокойному» state.
 *
 * S9 добавил:
 *   - flashLine — короткое сообщение в speech-bubble на время вспышки
 *   - voice replies — случайная фраза через TTS из подобранного по state-у списка
 *
 * Применение:
 *   const { flash } = useMascotReactions()
 *   flash('celebrate', 800) // 800 ms радости + случайная похвала + speech bubble
 *   flash('warn', 1200, { quiet: true }) // без озвучки
 */

type MascotState
  = | 'greet' | 'think' | 'celebrate' | 'warn' | 'teach' | 'trophy'
    | 'wink' | 'proud' | 'confused' | 'sleepy' | 'dance' | 'shy'

interface FlashOptions {
  /** Не озвучивать через TTS даже если фраза подобрана. */
  quiet?: boolean
  /** Кастомная фраза вместо случайной из набора. */
  line?: string
}

/** Реплики Феми по состоянию. */
const PHRASES: Partial<Record<MascotState, string[]>> = {
  greet: ['Приветик!', 'Эй, я здесь!', 'Привет, дружок!', 'Поехали, поехали!', 'Я тут, я тут!'],
  celebrate: ['Вау, ура!', 'Так держать!', 'Вот это да!', 'Я так и знала!', 'Супер-пупер!', 'Сделал!', 'Умница!'],
  trophy: ['Вау-вау-вау!', 'Ты лучший!', 'Невероятно!', 'Очуметь!', 'Ты чемпион!'],
  warn: ['Ой, ничего!', 'Почти-почти!', 'Ещё разочка!', 'Бывает, не грусти!', 'Давай ещё!'],
  proud: ['Горжусь тобой!', 'Ты звёздочка!', 'Это просто вау!', 'Молодец, я так рада!'],
  confused: ['Хммм!', 'Дай подумаю!', 'Опа, интересно!', 'Помогу!'],
  shy: ['Ой-ой!', 'Спасибо!', 'я смущаюсь!'],
  dance: ['Танцуем!', 'Эгей!', 'Ура-ура!', 'Йеху!', 'Вот это праздник!'],
  wink: ['Я рядом!', 'Готов?', 'Поехали!', 'Вместе!'],
  think: ['Дай-ка подумаю!', 'Ох, интересно!', 'Хмммм!']
}

/** Эмоция передаётся в поле `emotion` server route — не читается
 * вслух, а влияет на подачу голоса через instructions. */
const STATE_EMOTION: Partial<Record<MascotState, string>> = {
  celebrate: 'a child bursting with joy, cannot contain excitement, voice rises with happiness',
  trophy: 'absolute pure delight — like a child who just received their dream present',
  dance: 'giggling and bouncing, full of unstoppable playful energy',
  greet: 'warm sweet surprise, like seeing your best friend walk in',
  wink: 'cheeky and playful, a little giggle, conspiratorial fun',
  proud: 'warm glowing pride, like cheering your best friend from the sidelines',
  warn: 'soft gentle comfort, like a warm hand on the shoulder — it’s all okay',
  confused: 'curious wide-eyed wonder, delightfully puzzled',
  shy: 'sweet and tiny, barely a whisper, adorably shy',
  teach: 'bright and encouraging, leaning in to share a fun secret',
  think: 'curious and wondering, a little dramatic hmm'
}

const pickPhrase = (state: MascotState): string | null => {
  const list = PHRASES[state]
  if (!list || list.length === 0) return null
  return list[Math.floor(Math.random() * list.length)] ?? null
}

const flashState = ref<MascotState | null>(null)
const flashLine = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null

export function useMascotReactions() {
  const { speak } = useTTS()

  const flash = (state: MascotState, durationMs = 800, opts?: FlashOptions) => {
    if (flashTimer) clearTimeout(flashTimer)
    flashState.value = state
    const phrase = opts?.line ?? pickPhrase(state)
    flashLine.value = phrase
    if (phrase && !opts?.quiet) {
      // emotion передаётся отдельным полем в server route —
      // попадает в instructions, а не в текст, чтобы не читаться вслух.
      const emotion = STATE_EMOTION[state]
      speak(phrase, { emotion })
    }
    flashTimer = setTimeout(() => {
      flashState.value = null
      flashLine.value = null
      flashTimer = null
    }, durationMs)
  }

  const clearFlash = () => {
    if (flashTimer) clearTimeout(flashTimer)
    flashState.value = null
    flashLine.value = null
    flashTimer = null
  }

  return {
    flashState: readonly(flashState),
    flashLine: readonly(flashLine),
    flash,
    clearFlash
  }
}
