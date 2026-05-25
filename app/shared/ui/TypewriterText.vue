<script setup lang="ts">
/**
 * TypewriterText — текст печатается по символу с курсором-вертикалькой.
 *
 * Применение в FEMO: объяснения шагов в WALKTHROUGH, важные text-чанки
 * в EXPLANATION. Эффект «маскот говорит» — для второклассника намного
 * вовлекательнее instant-render'а: ребёнок успевает читать одновременно
 * с печатью, а не упускает первые секунды на «адаптацию глаз к стене».
 *
 * Особенности:
 *   - Скорость: ~50 chars/sec (rate из props или дефолт). Для русского
 *     языка достаточно.
 *   - Reduced-motion: instant-render всего текста + cancel курсора.
 *   - При смене props.text — рестарт с начала.
 *   - Эмитит событие `done` когда дописал — родитель может продолжать UI.
 */
import { ref, watch, onBeforeUnmount, computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Текст для печати. */
  text: string
  /** Скорость в символах в секунду. По умолчанию 50. */
  charsPerSec?: number
  /** Задержка перед стартом (мс). 0 = моментально. */
  delayMs?: number
  /** Скрыть мигающий курсор после окончания печати. */
  hideCursorWhenDone?: boolean
}>(), {
  charsPerSec: 50,
  delayMs: 0,
  hideCursorWhenDone: true
})

const emit = defineEmits<{ done: [] }>()

const visibleLen = ref(0)
const isDone = ref(false)
let raf: number | null = null
let startDelayTimer: ReturnType<typeof setTimeout> | null = null
let startedAt = 0

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const cancel = () => {
  if (raf) cancelAnimationFrame(raf)
  if (startDelayTimer) clearTimeout(startDelayTimer)
  raf = null
  startDelayTimer = null
}

const isClient = typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined'

const start = () => {
  cancel()
  visibleLen.value = 0
  isDone.value = false
  if (!props.text) {
    isDone.value = true
    emit('done')
    return
  }
  // SSR: рендерим финальный текст без анимации, requestAnimationFrame недоступен.
  if (!isClient) {
    visibleLen.value = props.text.length
    isDone.value = true
    return
  }
  if (prefersReducedMotion()) {
    visibleLen.value = props.text.length
    isDone.value = true
    emit('done')
    return
  }

  const begin = () => {
    startedAt = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startedAt
      const chars = Math.min(props.text.length, Math.floor((elapsed / 1000) * props.charsPerSec))
      visibleLen.value = chars
      if (chars >= props.text.length) {
        isDone.value = true
        emit('done')
        raf = null
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  if (props.delayMs > 0) {
    startDelayTimer = setTimeout(begin, props.delayMs)
  } else {
    begin()
  }
}

watch(() => props.text, () => start(), { immediate: true })

if (isClient) onBeforeUnmount(cancel)

const display = computed(() => props.text.slice(0, visibleLen.value))
const showCursor = computed(() => !(isDone.value && props.hideCursorWhenDone))
</script>

<template>
  <span class="typewriter">
    <span>{{ display }}</span><span
      v-if="showCursor"
      class="typewriter-cursor"
      aria-hidden="true"
    >|</span>
  </span>
</template>

<style scoped>
.typewriter-cursor {
  display: inline-block;
  margin-left: 1px;
  font-weight: 900;
  color: currentColor;
  animation: cursor-blink 0.9s steps(2) infinite;
}

@keyframes cursor-blink {
  to { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .typewriter-cursor {
    animation: none;
    opacity: 0.5;
  }
}
</style>
