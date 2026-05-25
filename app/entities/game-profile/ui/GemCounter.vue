<script setup lang="ts">
/**
 * Gem counter display with animated sparkle.
 */
defineProps<{
  gems: number
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-cyan-500/10"
    :class="[
      size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'
    ]"
  >
    <UIcon
      name="i-lucide-gem"
      class="text-cyan-500"
      :class="size === 'lg' ? 'size-5' : size === 'sm' ? 'size-3' : 'size-4'"
    />
    <span class="font-bold text-cyan-600 dark:text-cyan-400">
      {{ gems.toLocaleString() }}
    </span>
  </div>
</template>
