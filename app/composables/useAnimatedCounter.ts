/**
 * Composable for animated number counting.
 * Animates from 0 to target value when element is in viewport.
 */
export const useAnimatedCounter = (targetValue: number, duration = 2000) => {
  const displayValue = ref(0)
  const counterRef = ref<HTMLElement | null>(null)
  let started = false

  const animate = () => {
    if (started) return
    started = true
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      displayValue.value = Math.round(eased * targetValue)

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }

  onMounted(() => {
    if (!counterRef.value) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          animate()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(counterRef.value)
  })

  return { displayValue, counterRef }
}
