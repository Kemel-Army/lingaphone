<script setup lang="ts">
/**
 * Shared EmptyState — shown when lists are empty.
 * Supports both slot-based and prop-based action button.
 */
interface Props {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'i-lucide-inbox',
  title: 'Пока ничего нет',
  description: '',
  actionLabel: ''
})

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <div class="relative">
      <div class="absolute inset-0 scale-150 rounded-full bg-primary/5 blur-xl" />
      <div class="relative flex size-16 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-default">
        <UIcon
          :name="icon"
          class="size-8 text-muted"
        />
      </div>
    </div>
    <div class="space-y-1">
      <h3 class="text-base font-semibold text-default">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="mx-auto max-w-xs text-sm text-muted"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.action || actionLabel"
      class="mt-2"
    >
      <slot name="action">
        <UButton
          v-if="actionLabel"
          :label="actionLabel"
          @click="$emit('action')"
        />
      </slot>
    </div>
  </div>
</template>
