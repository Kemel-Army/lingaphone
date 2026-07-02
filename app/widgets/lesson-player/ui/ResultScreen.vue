<script setup lang="ts">
const props = defineProps<{ correct: number, total: number, xp: number, levelUp: boolean }>()
const emit = defineEmits<{ (e: 'retry' | 'exit'): void }>()

const pct = computed(() => props.total ? Math.round((props.correct / props.total) * 100) : 0)
const perfect = computed(() => props.correct === props.total)
const mascot = computed(() => (perfect.value ? 'trophy' : 'proud'))

onMounted(() => {
  const { trophy, burst } = useConfetti()
  if (perfect.value) trophy()
  else burst()
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center">
    <FemiMascot
      :state="mascot"
      size="xl"
      :line="perfect ? 'Идеально!' : 'Молодец!'"
    />

    <div class="flex flex-col items-center gap-1">
      <p class="text-5xl font-black tabular-nums text-primary">
        {{ pct }}%
      </p>
      <p class="text-sm text-muted">
        {{ correct }} из {{ total }} верно
      </p>
    </div>

    <div class="flex items-center gap-2 rounded-2xl bg-amber-100 px-5 py-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      <UIcon
        name="i-lucide-sparkles"
        class="size-5"
      />
      <span class="text-lg font-black">+{{ xp }} XP</span>
    </div>

    <div
      v-if="levelUp"
      class="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-inverted"
    >
      <UIcon
        name="i-lucide-arrow-up"
        class="size-4"
      /> Новый уровень!
    </div>

    <div class="flex w-full max-w-xs flex-col gap-2">
      <UButton
        block
        size="lg"
        color="primary"
        label="К юнитам"
        @click="emit('exit')"
      />
      <UButton
        block
        size="lg"
        color="neutral"
        variant="soft"
        label="Пройти ещё раз"
        @click="emit('retry')"
      />
    </div>
  </div>
</template>
