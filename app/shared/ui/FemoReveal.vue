<script setup lang="ts">
/**
 * FemoReveal — drop-in wrapper that staggers direct children on mount/scroll.
 * Each direct child gets .stagger-item; IntersectionObserver flips .revealed
 * with `stagger`-delay. Honours prefers-reduced-motion.
 *
 * Usage:
 *   <FemoReveal>
 *     <SectionA />
 *     <SectionB />
 *     <SectionC />
 *   </FemoReveal>
 */
const props = withDefaults(defineProps<{
  /** Stagger delay between children (ms) */
  stagger?: number
  /** IntersectionObserver threshold */
  threshold?: number
  /** If true — skip IO and reveal immediately on mount (for above-the-fold blocks) */
  immediate?: boolean
}>(), {
  stagger: 80,
  threshold: 0.1,
  immediate: false
})

const root = useTemplateRef<HTMLElement>('root')

const reveal = (el: HTMLElement) => {
  const items = el.querySelectorAll(':scope > .stagger-item')
  items.forEach((child, i) => {
    setTimeout(() => child.classList.add('revealed'), i * props.stagger)
  })
}

const applyStaggerClass = (el: HTMLElement) => {
  Array.from(el.children).forEach((child) => {
    if (!child.classList.contains('stagger-item')) {
      child.classList.add('stagger-item')
    }
  })
}

onMounted(() => {
  if (import.meta.server) return
  const el = root.value
  if (!el) return

  applyStaggerClass(el)

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || props.immediate) {
    reveal(el)
    return
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target as HTMLElement)
        io.unobserve(entry.target)
      }
    })
  }, { threshold: props.threshold })

  io.observe(el)
  onBeforeUnmount(() => io.disconnect())
})
</script>

<template>
  <div
    ref="root"
    class="femo-reveal-root"
  >
    <slot />
  </div>
</template>

<style scoped>
.femo-reveal-root {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
