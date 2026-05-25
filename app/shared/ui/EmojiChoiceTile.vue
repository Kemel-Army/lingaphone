<script setup lang="ts">
/**
 * EmojiChoiceTile — крупная плитка выбора с эмодзи и подписью.
 *
 * Замена текстовых A/B/C-кнопок в Hook (для второклассника эмодзи
 * понятнее текста). Реагирует на ховер: лёгкое поднятие, при выборе —
 * primary-обводка, scale 1.05 и одноразовая select-pop анимация (S8 Phase 1).
 */
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  emoji: string
  label: string
  /** Является ли вариант "правильным" (для пост-выбора подсветки). */
  isPrimary?: boolean
  selected?: boolean
  revealed?: boolean
  disabled?: boolean
}>()

/** Триггерит CSS-анимацию `select-pop` ровно на 280 ms.
 * Срабатывает на переход selected: false → true. Класс добавляется,
 * потом снимается через таймер — это позволяет повторно проигрывать
 * анимацию при последующих re-select (для tap-correct mode). */
const popping = ref(false)
let popTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.selected, (now, was) => {
  if (now && !was) {
    if (popTimer) clearTimeout(popTimer)
    popping.value = true
    popTimer = setTimeout(() => {
      popping.value = false
    }, 320)
  }
})

const stateClass = computed(() => {
  if (props.revealed) {
    if (props.isPrimary) return 'border-emerald-500 bg-emerald-500/10'
    if (props.selected) return 'border-rose-300 bg-rose-300/10 opacity-70'
    return 'border-default opacity-60'
  }
  if (props.selected) return 'border-primary bg-primary/10 scale-105'
  return 'border-default hover:border-primary/40 hover:-translate-y-0.5'
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="emoji-tile group flex h-full min-h-30 sm:min-h-34 flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-elevated p-3 sm:p-4 transition-all duration-200 disabled:cursor-not-allowed"
    :class="[stateClass, popping && 'animate-select-pop']"
  >
    <span
      class="text-4xl sm:text-5xl transition-transform duration-200 group-hover:scale-110 shrink-0"
      aria-hidden="true"
    >{{ emoji }}</span>
    <span class="line-clamp-3 text-sm sm:text-base font-bold text-highlighted text-center wrap-break-word leading-tight">
      {{ label }}
    </span>
    <UIcon
      v-if="revealed && isPrimary"
      name="i-lucide-check-circle-2"
      class="size-5 text-emerald-500"
    />
  </button>
</template>

<style scoped>
.emoji-tile {
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.4, 1.2);
}
</style>
