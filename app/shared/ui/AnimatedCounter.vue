<script setup lang="ts">
/**
 * AnimatedCounter — плавно «прокручивает» числа от старого значения к новому.
 *
 * Когда выручка/счёт/прогресс меняется, мы НЕ хотим, чтобы цифра щёлкала
 * мгновенно — это лишает дофамина. Вместо этого считаем кадрами через
 * requestAnimationFrame (без зависимостей) с easing 0.4 cubic-bezier.
 *
 * Применение:
 *   <AnimatedCounter :value="stats.revenue" :duration="600" />
 *   <AnimatedCounter :value="masteryPct" suffix="%" />
 *
 * Уважаем prefers-reduced-motion: в этом режиме сразу ставим конечное значение.
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  /** Целевое значение. Любое изменение запускает плавный счётчик. */
  value: number
  /** Длительность анимации в мс. По умолчанию 600. */
  duration?: number
  /** Префикс перед числом, например '+'. */
  prefix?: string
  /** Суффикс, например '%' / 'XP' / 'тг'. */
  suffix?: string
  /** Округлять до n знаков. По умолчанию 0 (целые числа). */
  decimals?: number
}>(), {
  duration: 600,
  prefix: '',
  suffix: '',
  decimals: 0
})

const display = ref(props.value)
let raf: number | null = null

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Easing — out-cubic; быстрый старт, мягкий финиш.
const ease = (t: number) => 1 - Math.pow(1 - t, 3)

const animateTo = (target: number) => {
  if (raf) cancelAnimationFrame(raf)
  if (prefersReducedMotion() || props.duration <= 16) {
    display.value = target
    return
  }
  const start = display.value
  const delta = target - start
  if (delta === 0) return
  const t0 = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / props.duration)
    display.value = start + delta * ease(t)
    if (t < 1) {
      raf = requestAnimationFrame(tick)
    } else {
      display.value = target
      raf = null
    }
  }
  raf = requestAnimationFrame(tick)
}

watch(() => props.value, v => animateTo(v))

onMounted(() => {
  // Стартовое значение уже выставлено в `display`. Если первое значение
  // отличается от 0 и хочется «прокатить» от 0 — раскомментируй:
  // display.value = 0; animateTo(props.value)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})

const formatted = computed(() => {
  const n = props.decimals === 0
    ? Math.round(display.value)
    : display.value.toFixed(props.decimals)
  return `${props.prefix}${n}${props.suffix}`
})
</script>

<template>
  <span class="tabular-nums">{{ formatted }}</span>
</template>
