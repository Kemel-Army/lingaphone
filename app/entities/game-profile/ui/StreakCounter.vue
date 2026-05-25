<script setup lang="ts">
/**
 * Streak counter display.
 */
defineProps<{
  streak: number
  longestStreak?: number
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
      <UIcon
        name="i-lucide-flame"
        class="size-5 text-orange-500"
      />
    </div>
    <div>
      <p class="text-lg font-bold">
        {{ streak }} {{ streak === 1 ? 'день' : 'дней' }}
      </p>
      <p
        v-if="longestStreak"
        class="text-xs text-muted"
      >
        Рекорд: {{ longestStreak }}
      </p>
    </div>
  </div>
</template>
