<script setup lang="ts">
/**
 * StudentLevelBadge — Visual level indicator (number + color ring + tooltip).
 */
defineProps<{
  level: number
}>()

const _tierColor = computed<string>(() => {
  // Map level ranges to visual tiers
  const l = Math.min(100, Math.max(1, 1)) // placeholder for props
  return 'bg-[var(--color-level-soft)] text-[var(--color-level)]'
})
</script>

<script lang="ts">
// Helper used only in template
</script>

<template>
  <UTooltip :text="`Уровень ${level}`">
    <div class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-level-soft)] px-2.5 py-1">
      <UIcon
        name="i-lucide-shield"
        class="size-4 text-[var(--color-level)]"
      />
      <span class="text-sm font-bold text-[var(--color-level)]">{{ level }}</span>
    </div>
  </UTooltip>
</template>
