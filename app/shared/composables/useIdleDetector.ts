import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

/**
 * useIdleDetector — глобальный детектор «ребёнок отвлёкся».
 *
 * Слушает mousemove / keydown / touchstart / scroll и сбрасывает таймер
 * при любом из них. Когда таймер срабатывает — `idle.value = true`.
 *
 * Применение в FEMO:
 *   - при idle 60s → flash маскота в 'sleepy' (1.5s) + лёгкий 'pop' SFX
 *   - идея: показать ребёнку, что Феми ждёт его, без агрессивного pop-up'а
 *
 * SSR-safe: на сервере просто возвращает `idle: ref(false)`.
 */

const DEFAULT_IDLE_MS = 60_000

export function useIdleDetector(opts?: { idleMs?: number, onIdle?: () => void, onActive?: () => void }) {
  const idle = ref(false)
  const idleMs = opts?.idleMs ?? DEFAULT_IDLE_MS
  let timer: ReturnType<typeof setTimeout> | null = null

  const reset = () => {
    if (idle.value) {
      idle.value = false
      opts?.onActive?.()
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      idle.value = true
      opts?.onIdle?.()
    }, idleMs)
  }

  // Browser-side только.
  if (typeof window !== 'undefined') {
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']

    onMounted(() => {
      events.forEach(ev => window.addEventListener(ev, reset, { passive: true }))
      reset()
    })

    onBeforeUnmount(() => {
      events.forEach(ev => window.removeEventListener(ev, reset))
      if (timer) clearTimeout(timer)
    })
  }

  return { idle, reset }
}

/** Watch-вариант: запускает onIdle всякий раз, когда `idle` становится true.
 * Полезно если хочешь дёргать flash() из компонента, не имея прямого доступа
 * к ref. */
export function useIdleHandler(handler: () => void, idleMs = DEFAULT_IDLE_MS) {
  const { idle, reset } = useIdleDetector({ idleMs })
  watch(idle, (v) => {
    if (v) handler()
  })
  return { idle, reset }
}
