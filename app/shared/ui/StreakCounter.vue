<script setup lang="ts">
/**
 * StreakCounter — счётчик правильных подряд с эмодзи-эскалацией.
 *
 * Уровни:
 *   1-2 → пустой (только число)
 *   3-4 → 🔥 «огонь»
 *   5-9 → 🚀 «ракета»
 *   10+ → 🏆 «трофей»
 *
 * При увеличении streak число коротко прыгает (pop-анимация). При
 * сбросе streak (ошибка) — становится 0 без анимации.
 */

const props = withDefaults(defineProps<{
  streak: number
  /** Подсветка тира фоном. По умолчанию true. */
  showBadge?: boolean
}>(), {
  showBadge: true
})

const tier = computed(() => {
  if (props.streak >= 10) return { emoji: '🏆', label: 'легенда', color: 'amber' }
  if (props.streak >= 5) return { emoji: '🚀', label: 'летишь!', color: 'sky' }
  if (props.streak >= 3) return { emoji: '🔥', label: 'в огне!', color: 'rose' }
  return null
})

const tierClass = computed(() => {
  if (!tier.value) return 'bg-elevated border-default'
  const c = tier.value.color
  return ({
    rose: 'bg-rose-500/15 border-rose-500/30',
    sky: 'bg-sky-500/15 border-sky-500/30',
    amber: 'bg-amber-500/15 border-amber-500/30'
  } as Record<string, string>)[c] ?? 'bg-elevated border-default'
})

const popKey = ref(0)
watch(() => props.streak, (now, prev) => {
  if (now > prev && now > 0) popKey.value++
})
</script>

<template>
  <div
    class="streak-counter inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors"
    :class="tierClass"
  >
    <span
      v-if="tier"
      class="text-base streak-emoji"
      aria-hidden="true"
    >
      {{ tier.emoji }}
    </span>
    <span
      :key="popKey"
      class="streak-number text-sm font-black tabular-nums text-highlighted"
    >
      {{ streak }}
    </span>
    <span
      v-if="tier && showBadge"
      class="text-[10px] font-bold uppercase tracking-wider"
      :class="tier.color === 'rose' ? 'text-rose-600 dark:text-rose-300' : tier.color === 'sky' ? 'text-sky-600 dark:text-sky-300' : 'text-amber-600 dark:text-amber-300'"
    >
      {{ tier.label }}
    </span>
  </div>
</template>

<style scoped>
@keyframes streak-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.5); }
  100% { transform: scale(1); }
}
.streak-number {
  display: inline-block;
  animation: streak-pop 0.4s cubic-bezier(0.25, 0.8, 0.4, 1.2);
}

@keyframes streak-emoji-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(8deg); }
}
.streak-emoji {
  display: inline-block;
  animation: streak-emoji-bob 1.6s ease-in-out infinite;
}
</style>
