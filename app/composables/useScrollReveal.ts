/**
 * Composable for scroll-triggered staggered reveal animations.
 * Observes child elements with .stagger-item and adds .revealed class with stagger delay.
 *
 * Returns a reactive `isRevealed` ref. When the container scrolls into view,
 * it flips to `true` (once). Callers can bind it via `:class` so Vue won't
 * strip the class during reactive patches.
 */
export const useScrollReveal = (
  containerRef: Ref<HTMLElement | null>,
  options?: { stagger?: number, threshold?: number }
) => {
  const stagger = options?.stagger ?? 100
  const threshold = options?.threshold ?? 0.15
  const isRevealed = ref(false)

  onMounted(() => {
    if (!containerRef.value) return

    const items = containerRef.value.querySelectorAll('.stagger-item')
    if (!items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Still add DOM class for per-item stagger delay
            const children = entry.target.querySelectorAll('.stagger-item')
            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('revealed')
              }, index * stagger)
            })
            // Flip reactive flag (after last item reveals)
            setTimeout(() => {
              isRevealed.value = true
            }, children.length * stagger)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    observer.observe(containerRef.value)
  })

  return { isRevealed }
}
