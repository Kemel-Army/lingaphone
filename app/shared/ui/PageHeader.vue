<script setup lang="ts">
/**
 * Shared PageHeader — consistent title block for all dashboard pages.
 * Usage: <PageHeader title="..." description="..." />
 */
interface Props {
  title: string
  description?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  icon: ''
})
</script>

<template>
  <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-3">
      <div
        v-if="icon"
        class="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20"
      >
        <UIcon
          :name="icon"
          class="size-5 text-primary"
        />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-default">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-0.5 text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
    </div>
    <div
      v-if="$slots.actions"
      class="mt-3 flex gap-2 sm:mt-0"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
