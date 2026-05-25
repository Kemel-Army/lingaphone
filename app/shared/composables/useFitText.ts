import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

interface UseFitTextOptions {
  /** Минимальный размер шрифта в px. По умолчанию 12. */
  min?: number
  /** Максимальный размер шрифта в px. По умолчанию 72. */
  max?: number
  /** Сколько строк допустимо. По умолчанию 1. */
  maxLines?: number
  /** Шаг подгонки в px. По умолчанию 0.5. */
  step?: number
}

/**
 * useFitText — авто-подгоняет размер шрифта так, чтобы текст влез
 * в родительский контейнер по ширине и высоте без обрезания/переполнения.
 *
 * Кейс для нас: цифры в плитках Анатомии (Formalization), счётчики rows×cols
 * в Intuition, длинные значения в Hook-эмодзи-кнопках. На второклассном
 * UI размер прыгает: «5» легко помещается, «1000» — нет.
 *
 * Использование:
 *   const tile = ref<HTMLElement | null>(null)
 *   useFitText(tile, { min: 14, max: 48 })
 *   <div ref="tile">{{ value }}</div>
 *
 * Контейнер должен иметь явный размер (size-N или ширину/высоту).
 * Текст внутри получит inline font-size, перерасчёт — на ResizeObserver и
 * при изменении содержимого через MutationObserver.
 */
export function useFitText(
  target: Ref<HTMLElement | null>,
  options: UseFitTextOptions = {}
) {
  const { min = 12, max = 72, maxLines = 1, step = 0.5 } = options
  const fontSize = ref(max)

  let resizeObs: ResizeObserver | null = null
  let mutObs: MutationObserver | null = null
  let raf = 0

  const fit = () => {
    const el = target.value
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    const maxW = parent.clientWidth
    const maxH = parent.clientHeight
    if (maxW === 0 || maxH === 0) return

    // Бинарный поиск: ищем максимум, при котором scrollWidth/Height ≤ контейнера
    let lo = min
    let hi = max
    let best = min

    // Сбрасываем перед измерениями
    el.style.whiteSpace = maxLines === 1 ? 'nowrap' : 'normal'
    el.style.overflow = 'hidden'

    while (hi - lo > step) {
      const mid = (lo + hi) / 2
      el.style.fontSize = `${mid}px`
      const fits = el.scrollWidth <= maxW && el.scrollHeight <= maxH
      if (fits) {
        best = mid
        lo = mid
      } else {
        hi = mid
      }
    }

    fontSize.value = best
    el.style.fontSize = `${best}px`
  }

  const schedule = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(fit)
  }

  onMounted(() => {
    const el = target.value
    if (!el) return

    resizeObs = new ResizeObserver(schedule)
    if (el.parentElement) resizeObs.observe(el.parentElement)
    resizeObs.observe(el)

    mutObs = new MutationObserver(schedule)
    mutObs.observe(el, { characterData: true, childList: true, subtree: true })

    schedule()
  })

  watch(target, (el) => {
    if (el) schedule()
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    resizeObs?.disconnect()
    mutObs?.disconnect()
  })

  return { fontSize, refit: schedule }
}
