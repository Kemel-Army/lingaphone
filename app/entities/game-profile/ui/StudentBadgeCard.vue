<script setup lang="ts">
/**
 * StudentBadgeCard — Full badge/achievement card with icon, title, description, unlock state.
 */
interface Props {
  icon: string
  title: string
  description: string
  unlocked: boolean
  date?: string
}

defineProps<Props>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div
    class="relative flex flex-col items-center gap-3 rounded-(--radius-ui) border p-4 text-center transition-all"
    :class="unlocked
      ? 'border-(--color-badge) bg-(--color-badge-soft) badge-unlock'
      : 'border-(--color-border-muted) bg-(--color-bg-muted) opacity-50 grayscale'"
  >
    <div
      class="flex size-12 items-center justify-center rounded-xl"
      :class="unlocked ? 'bg-(--color-badge-soft) text-(--color-badge)' : 'bg-(--color-bg-subtle) text-(--color-text-muted)'"
    >
      <UIcon
        :name="icon"
        class="size-6"
      />
    </div>
    <div>
      <p class="text-sm font-semibold text-(--color-text-primary)">
        {{ title }}
      </p>
      <p class="mt-0.5 text-caption">
        {{ description }}
      </p>
    </div>
    <p
      v-if="unlocked && date"
      class="text-xs text-(--color-text-muted)"
    >
      {{ formatDate(date) }}
    </p>
    <UIcon
      v-if="!unlocked"
      name="i-lucide-lock"
      class="absolute right-2 top-2 size-4 text-(--color-text-muted)"
    />
  </div>
</template>
