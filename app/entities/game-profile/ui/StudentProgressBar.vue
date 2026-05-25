<script setup lang="ts">
/**
 * StudentProgressBar — Progress bar with color coded by value.
 * ≥80% green (success), ≥50% amber (warning), <50% red (error).
 */
defineProps<{
  label: string
  percent: number
}>()

const _barColor = computed(() => {
  // Will be reactive through template usage
  return ''
})
</script>

<script lang="ts">
function getBarColor(p: number): string {
  if (p >= 80) return 'bg-[var(--color-success)]'
  if (p >= 50) return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-error)]'
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <span class="text-body-strong">{{ label }}</span>
      <span class="text-caption">{{ percent }}%</span>
    </div>
    <div class="h-2 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
      <div
        class="progress-fill h-full rounded-full"
        :class="getBarColor(percent)"
        :style="{ width: `${Math.min(100, Math.max(0, percent))}%` }"
      />
    </div>
  </div>
</template>
