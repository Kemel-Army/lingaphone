<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

/**
 * Count-up number that animates from 0 to `value` when scrolled into view.
 */
const props = withDefaults(defineProps<{
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  format?: (n: number) => string
}>(), {
  duration: 1600,
  decimals: 0,
  prefix: '',
  suffix: ''
})

const display = ref('0')
const root = useTemplateRef<HTMLElement>('root')
let started = false

const formatNumber = (n: number) => {
  if (props.format) return props.format(n)
  const fixed = n.toFixed(props.decimals)
  // RU thousands separator
  const [int, dec] = fixed.split('.')
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec ? `${grouped},${dec}` : grouped
}

const animate = () => {
  if (started) return
  started = true
  const start = performance.now()
  const from = 0
  const to = props.value
  const dur = props.duration
  const tick = (now: number) => {
    const t = Math.min((now - start) / dur, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    const v = from + (to - from) * eased
    display.value = `${props.prefix}${formatNumber(v)}${props.suffix}`
    if (t < 1) requestAnimationFrame(tick)
    else display.value = `${props.prefix}${formatNumber(to)}${props.suffix}`
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  if (import.meta.server) return
  display.value = `${props.prefix}${formatNumber(0)}${props.suffix}`
  const el = root.value
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    display.value = `${props.prefix}${formatNumber(props.value)}${props.suffix}`
    return
  }
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      animate()
      io.disconnect()
    }
  }, { threshold: 0.4 })
  io.observe(el)
  onBeforeUnmount(() => io.disconnect())
})

watch(() => props.value, () => {
  started = false
  animate()
})
</script>

<template>
  <span
    ref="root"
    class="tabular-nums"
  >{{ display }}</span>
</template>
