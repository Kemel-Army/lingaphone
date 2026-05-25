/**
 * useConfetti — взрывы конфетти как награда за прохождение слоя/капсулы.
 *
 * Используем canvas-confetti — один-файловая либа без зависимостей,
 * canvas-based, отлично работает на мобиле.
 *
 * Уважаем prefers-reduced-motion: в этом режиме конфетти не запускаются
 * (только частицы — уже движение, для эпилептиков и аутистов это сильно).
 *
 * Все функции no-op на сервере (SSR-safe).
 */

type ConfettiFn = (options?: Record<string, unknown>) => Promise<null> | null

let confettiCache: ConfettiFn | null = null
let confettiPromise: Promise<ConfettiFn | null> | null = null

const FEMO_PALETTE = ['#DC2626', '#F59E0B', '#FCD34D', '#10B981', '#3B82F6', '#A855F7']

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Лениво подгружаем canvas-confetti (он ~10kb, но всё равно — только когда нужно). */
const loadConfetti = async (): Promise<ConfettiFn | null> => {
  if (confettiCache) return confettiCache
  if (typeof window === 'undefined') return null
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti')
      .then((mod) => {
        confettiCache = (mod.default ?? mod) as ConfettiFn
        return confettiCache
      })
      .catch(() => null)
  }
  return confettiPromise
}

export function useConfetti() {
  /** Стандартный «прошёл слой» — мягкий burst по центру-низу. */
  const burst = async () => {
    if (prefersReducedMotion()) return
    const c = await loadConfetti()
    if (!c) return
    c({
      particleCount: 70,
      spread: 70,
      startVelocity: 38,
      origin: { y: 0.7 },
      colors: FEMO_PALETTE,
      ticks: 200,
      scalar: 0.9
    })
  }

  /** Большой праздник за gold-tier на MASTERY: два side-bursts + центральный. */
  const trophy = async () => {
    if (prefersReducedMotion()) return
    const c = await loadConfetti()
    if (!c) return
    // Левый и правый «фонтаны»
    c({
      particleCount: 80,
      angle: 60,
      spread: 55,
      startVelocity: 50,
      origin: { x: 0, y: 0.7 },
      colors: FEMO_PALETTE,
      ticks: 240
    })
    c({
      particleCount: 80,
      angle: 120,
      spread: 55,
      startVelocity: 50,
      origin: { x: 1, y: 0.7 },
      colors: FEMO_PALETTE,
      ticks: 240
    })
    // Центральный «купол»
    setTimeout(() => {
      c({
        particleCount: 120,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.6 },
        colors: FEMO_PALETTE,
        ticks: 300,
        scalar: 1.1
      })
    }, 250)
  }

  /** Boss-победа в SCENARIO — золотой ливень сверху. */
  const bossWin = async () => {
    if (prefersReducedMotion()) return
    const c = await loadConfetti()
    if (!c) return
    const goldOnly = ['#FCD34D', '#F59E0B', '#FBBF24', '#FFFFFF']
    c({
      particleCount: 60,
      spread: 360,
      startVelocity: 25,
      origin: { y: 0.1 },
      colors: goldOnly,
      gravity: 0.6,
      ticks: 320,
      scalar: 1.2
    })
  }

  /** Тонкий streak-effect на 5+ подряд правильных в TRAINER. */
  const streakSparkle = async () => {
    if (prefersReducedMotion()) return
    const c = await loadConfetti()
    if (!c) return
    c({
      particleCount: 25,
      spread: 60,
      startVelocity: 22,
      origin: { y: 0.5 },
      colors: ['#FCD34D', '#F59E0B'],
      ticks: 120,
      shapes: ['star']
    })
  }

  return { burst, trophy, bossWin, streakSparkle }
}
