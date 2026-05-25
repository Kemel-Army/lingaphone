import { ref, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * Type-writer effect — types `text` char-by-char into a reactive output.
 * Re-types whenever the source changes.
 */
export function useTypewriter(
  source: Ref<string>,
  options: { speed?: number, startDelay?: number } = {}
) {
  const { speed = 18, startDelay = 100 } = options
  const output = ref('')
  const isTyping = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let raf = 0

  const stop = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    isTyping.value = false
  }

  const isClient = typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined'

  const run = (target: string) => {
    stop()
    output.value = ''
    if (!target) return
    // На сервере анимация бессмысленна — отрисуем финальный текст сразу.
    if (!isClient) {
      output.value = target
      return
    }
    isTyping.value = true
    let i = 0
    const tick = () => {
      output.value = target.slice(0, ++i)
      if (i >= target.length) {
        isTyping.value = false
        return
      }
      timer = setTimeout(() => {
        if (!isClient) return
        raf = requestAnimationFrame(tick)
      }, speed)
    }
    timer = setTimeout(() => {
      if (!isClient) return
      raf = requestAnimationFrame(tick)
    }, startDelay)
  }

  watch(source, run, { immediate: true })
  if (isClient) onBeforeUnmount(stop)

  return { output, isTyping }
}
