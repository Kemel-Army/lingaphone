<script setup lang="ts">
/**
 * XP bar showing level progress.
 */
defineProps<{
  xp: number
  level: number
  current: number
  needed: number
  percent: number
}>()
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-sm">
      <span class="font-semibold text-primary">Уровень {{ level }}</span>
      <span class="text-muted">{{ current }} / {{ needed }} XP</span>
    </div>
    <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        class="h-full rounded-full bg-primary transition-all duration-500"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
