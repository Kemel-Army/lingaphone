<script setup lang="ts">
/**
 * Shared LoadingSpinner — centered spinner.
 */
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  text: ''
})

const sizeClasses = {
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-12'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12">
    <UIcon
      name="i-lucide-loader-2"
      :class="['animate-spin text-primary', sizeClasses[size]]"
    />
    <p
      v-if="text"
      class="text-sm text-muted"
    >
      {{ text }}
    </p>
  </div>
</template>
