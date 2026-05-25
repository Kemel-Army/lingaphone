<script setup lang="ts">
/**
 * HeartsBar — полоска жизней-сердечек, как в Duolingo. Заменяет
 * сухое «вопрос N из M» на эмоциональный игровой индикатор.
 *
 * При уменьшении remaining последнее «потерянное» сердце один раз
 * проигрывает анимацию-удар (heartbeat-out) и становится серым.
 *
 * Props:
 *   total      — стартовое количество (3–5).
 *   remaining  — текущее количество.
 *   size       — 'sm' | 'md'
 *
 * Использование:
 *   <HeartsBar :total="3" :remaining="lives" />
 */

const props = withDefaults(defineProps<{
  total: number
  remaining: number
  size?: 'sm' | 'md'
}>(), {
  size: 'md'
})

const sizeClass = computed(() => props.size === 'sm' ? 'size-5' : 'size-6 sm:size-7')

// Чтобы анимировать конкретное сердце при потере, отслеживаем какое
// именно стало серым последним.
const justLost = ref<number | null>(null)
watch(() => props.remaining, (now, prev) => {
  if (now < prev) {
    justLost.value = now // индекс свежепотерянного
    setTimeout(() => {
      if (justLost.value === now) justLost.value = null
    }, 700)
  }
})

const slots = computed(() => Array.from({ length: props.total }, (_, i) => i))
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1.5"
    :aria-label="`Осталось жизней: ${remaining} из ${total}`"
    role="status"
  >
    <UIcon
      v-for="i in slots"
      :key="i"
      :name="i < remaining ? 'i-lucide-heart' : 'i-lucide-heart-crack'"
      class="transition-colors"
      :class="[
        sizeClass,
        i < remaining ? 'text-rose-500' : 'text-rose-300/50 dark:text-rose-700/50',
        justLost === i ? 'heart-lost' : ''
      ]"
    />
    <span class="ml-0.5 text-sm font-bold text-rose-600 dark:text-rose-300 tabular-nums">
      {{ remaining }}
    </span>
  </div>
</template>

<style scoped>
@keyframes heart-lost-anim {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
  35% {
    transform: scale(1.4) rotate(-8deg);
    filter: drop-shadow(0 0 12px rgba(244, 63, 94, 0.6));
  }
  100% {
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 0 transparent);
  }
}

.heart-lost {
  animation: heart-lost-anim 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
