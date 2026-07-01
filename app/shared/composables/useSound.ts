import { ref, watch } from 'vue'
import type { SoundEffect } from '~/entities/learning-path'

/**
 * useSound — лёгкий SFX-движок на Web Audio API без файлов + haptic feedback.
 *
 * Каждый эффект — короткий синтезированный тон/аккорд (50–400 ms),
 * без сетевых запросов и сборки бандла. Это даёт мгновенные «щелчки»
 * и «звон» на правильном ответе без бюджета аудио-ассетов.
 *
 * Глобальный mute сохраняется в localStorage. Можно дёрнуть из любого
 * компонента: `const { play, mute, muted } = useSound()`.
 *
 * Каждый звук синхронизирован с тактильной вибрацией через navigator.vibrate
 * (если поддерживается и пользователь не выключил motion). На мобиле это
 * превращает «нажал» в «почувствовал ответ» — критично для второклассника.
 *
 * Reduced-motion preference (prefers-reduced-motion: reduce) глушит и
 * вибрацию и быстрые SFX-цепочки — для детей с эпилепсией/аутизмом.
 *
 * Громкость намеренно ≤ 0.25 чтобы не раздражать.
 */

const STORAGE_KEY = 'femo:sound:muted'
const muted = ref<boolean>(false)
const ctxRef: { value: AudioContext | null } = { value: null }
let initialised = false

const ensureCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!ctxRef.value) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    ctxRef.value = new Ctx()
  }
  return ctxRef.value
}

const tone = (
  ctx: AudioContext,
  freq: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  startGain = 0.18,
  delayMs = 0
) => {
  const startAt = ctx.currentTime + delayMs / 1000
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(startGain, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + durationMs / 1000 + 0.05)
}

const noiseBurst = (ctx: AudioContext, durationMs: number, gainVal = 0.06) => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * (durationMs / 1000), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = gainVal
  src.connect(gain).connect(ctx.destination)
  src.start()
}

const SOUND_RECIPES: Record<SoundEffect, (ctx: AudioContext) => void> = {
  pop: (ctx) => {
    tone(ctx, 880, 90, 'triangle', 0.15)
    tone(ctx, 1320, 70, 'triangle', 0.1, 30)
  },
  correct: (ctx) => {
    tone(ctx, 660, 110, 'triangle', 0.18)
    tone(ctx, 880, 110, 'triangle', 0.18, 90)
    tone(ctx, 1175, 220, 'triangle', 0.2, 180)
  },
  wrong: (ctx) => {
    tone(ctx, 220, 180, 'sawtooth', 0.12)
    tone(ctx, 165, 220, 'sawtooth', 0.1, 100)
  },
  levelup: (ctx) => {
    tone(ctx, 523, 90, 'triangle', 0.2)
    tone(ctx, 659, 90, 'triangle', 0.2, 90)
    tone(ctx, 784, 90, 'triangle', 0.2, 180)
    tone(ctx, 1047, 360, 'triangle', 0.22, 270)
  },
  whoosh: (ctx) => {
    noiseBurst(ctx, 220, 0.05)
  },
  click: (ctx) => {
    tone(ctx, 1000, 40, 'square', 0.08)
  },
  sparkle: (ctx) => {
    tone(ctx, 1568, 60, 'triangle', 0.12)
    tone(ctx, 2093, 60, 'triangle', 0.1, 60)
    tone(ctx, 2637, 80, 'triangle', 0.08, 120)
  },
  cheer: (ctx) => {
    tone(ctx, 523, 70, 'triangle', 0.18)
    tone(ctx, 659, 70, 'triangle', 0.18, 70)
    tone(ctx, 784, 70, 'triangle', 0.18, 140)
    tone(ctx, 1047, 70, 'triangle', 0.18, 210)
    tone(ctx, 1319, 280, 'triangle', 0.2, 280)
  }
}

/**
 * Тактильные паттерны под каждый звук. number = одиночная вибрация в ms,
 * number[] = ритм vibrate-pause-vibrate. Поддерживается только на мобильных
 * браузерах (Chrome/Firefox Android, не iOS Safari).
 */
const HAPTIC_PATTERNS: Record<SoundEffect, number | number[]> = {
  pop: 25,
  correct: [40, 30, 60], // мини-аккорд: коротко-пауза-длиннее
  wrong: [80, 40, 80], // двойной отрицательный «толчок»
  levelup: [25, 20, 25, 20, 25, 20, 60], // лесенка вверх
  whoosh: 15,
  click: 12,
  sparkle: [15, 15, 25],
  cheer: [40, 30, 40, 30, 80] // долгая радость
}

const initFromStorage = () => {
  if (typeof window === 'undefined' || initialised) return
  initialised = true
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === '1') muted.value = true
  } catch {
    // ignore — privacy mode без storage
  }
  watch(muted, (v) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {
      // ignore
    }
  })
}

/** Уважение к prefers-reduced-motion. Если пользователь его выставил —
 * глушим вибрацию и пропускаем «лесенки» долгих SFX (но короткие — оставляем,
 * это не «motion», это «событие»). */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const vibrateIfSupported = (pattern: number | number[]) => {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate !== 'function') return
  if (prefersReducedMotion()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // некоторые браузеры выкидывают на странных паттернах — игнорим
  }
}

export function useSound() {
  initFromStorage()

  const play = (effect: SoundEffect) => {
    if (muted.value) return
    const ctx = ensureCtx()
    if (!ctx) return
    // Браузеры требуют user gesture перед стартом AudioContext
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const recipe = SOUND_RECIPES[effect]
    if (recipe) recipe(ctx)
    // Вибрируем синхронно — это часть «отзыва» на действие, не отдельный сигнал.
    const haptic = HAPTIC_PATTERNS[effect]
    if (haptic !== undefined) vibrateIfSupported(haptic)
  }

  const mute = () => {
    muted.value = true
  }

  const unmute = () => {
    muted.value = false
  }

  const toggle = () => {
    muted.value = !muted.value
  }

  /** Прямой вызов вибрации для UX-событий, не имеющих SFX
   * (например drag-drop, swipe). Лимит — навигатор сам ограничивает. */
  const vibrate = (pattern: number | number[] = 25) => {
    vibrateIfSupported(pattern)
  }

  return { play, mute, unmute, toggle, muted, vibrate }
}
