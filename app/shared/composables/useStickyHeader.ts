import { ref } from 'vue'

/**
 * Tracks whether the page has been scrolled past a threshold.
 * Used to apply blur/shadow to the landing header.
 */
export function useStickyHeader(threshold = 16) {
  const scrolled = ref(false)
  if (import.meta.server) return { scrolled }

  const onScroll = () => {
    scrolled.value = window.scrollY > threshold
  }

  onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

  return { scrolled }
}
