<script setup lang="ts">
/**
 * DailyQuestCard — плавающая карточка-подсказка от Феми с дневной целью.
 *
 * Простой stateless-компонент: получает quest-текст и иконку, рендерит
 * свиток-плашку рядом с маскотом. Закрытие — на стороне родителя.
 */
defineProps<{
  title: string
  description: string
  icon?: string
  rewardXp?: number
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    class="quest-card relative flex items-start gap-3 rounded-3xl border-4 border-amber-300 bg-linear-to-br from-amber-50 to-orange-100 p-4 shadow-[0_6px_0_rgb(245_158_11/0.5)]"
  >
    <!-- Иконка-печать -->
    <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 ring-2 ring-white shadow">
      <UIcon
        :name="icon ?? 'i-lucide-scroll-text'"
        class="size-6 text-white drop-shadow"
      />
    </div>

    <!-- Текст -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-black uppercase tracking-wider text-amber-700">
          Задание дня
        </span>
        <span
          v-if="rewardXp"
          class="inline-flex items-center gap-0.5 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-200"
        >
          <UIcon
            name="i-lucide-star"
            class="size-3 text-amber-500"
          />
          +{{ rewardXp }} XP
        </span>
      </div>
      <div class="mt-0.5 text-sm font-black leading-tight text-stone-800">
        {{ title }}
      </div>
      <div class="mt-1 text-xs font-semibold text-stone-600 line-clamp-2">
        {{ description }}
      </div>
    </div>

    <!-- Закрыть -->
    <button
      type="button"
      aria-label="Закрыть задание дня"
      class="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-white text-stone-500 ring-2 ring-amber-200 shadow transition-transform hover:rotate-90 hover:text-stone-700"
      @click="emit('close')"
    >
      <UIcon
        name="i-lucide-x"
        class="size-4"
      />
    </button>
  </div>
</template>

<style scoped>
.quest-card {
  animation: quest-pop 0.5s ease-out;
  transform-origin: top right;
}

@keyframes quest-pop {
  0% { transform: scale(0.7) rotate(-4deg); opacity: 0; }
  60% { transform: scale(1.05) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .quest-card { animation: none; }
}
</style>
