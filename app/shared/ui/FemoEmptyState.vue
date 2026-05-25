<script setup lang="ts">
/**
 * FemoEmptyState — branded empty state with Femi mascot.
 * Replaces generic EmptyState. Femi is the spectacle.
 *
 * Usage:
 *   <FemoEmptyState
 *     mascot-state="sleepy"
 *     title="Уроков нет"
 *     description="Давай попрактикуемся с AI-тренером?"
 *     action-label="Открыть AI-тренер"
 *     action-to="/student/ai-tutor"
 *   />
 */
type FemiState = 'greet' | 'think' | 'celebrate' | 'warn' | 'teach' | 'trophy'
  | 'wink' | 'proud' | 'confused' | 'sleepy' | 'dance' | 'shy'

withDefaults(defineProps<{
  title: string
  description?: string
  mascotState?: FemiState
  mascotLine?: string
  actionLabel?: string
  actionTo?: string
  /** Compact variant — used inline inside cards */
  compact?: boolean
}>(), {
  description: '',
  mascotState: 'greet',
  mascotLine: '',
  actionLabel: '',
  actionTo: '',
  compact: false
})

defineEmits<{ action: [] }>()
</script>

<template>
  <div
    class="femo-empty"
    :class="compact && 'femo-empty--compact'"
  >
    <div class="femo-empty-mascot">
      <FemiMascot
        :state="mascotState"
        :size="compact ? 'sm' : 'lg'"
        :line="mascotLine"
        :silent="!mascotLine"
        ignore-reactions
      />
    </div>
    <div class="femo-empty-text">
      <h3 class="femo-empty-title femo-display">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="femo-empty-sub"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.action || actionLabel"
      class="femo-empty-action"
    >
      <slot name="action">
        <NuxtLink
          v-if="actionLabel && actionTo"
          :to="actionTo"
          class="femo-btn-primary"
        >
          <span>{{ actionLabel }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </NuxtLink>
        <button
          v-else-if="actionLabel"
          type="button"
          class="femo-btn-primary"
          @click="$emit('action')"
        >
          <span>{{ actionLabel }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.femo-empty {
  display: grid;
  justify-items: center;
  gap: 1.1rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.femo-empty--compact { padding: 1.5rem 1rem; gap: 0.75rem; }

.femo-empty-mascot {
  filter: drop-shadow(0 14px 28px rgba(220, 38, 38, 0.18));
}

.femo-empty-title {
  font-size: 1.25rem;
  color: var(--color-femo-ink-900);
}

.femo-empty--compact .femo-empty-title { font-size: 1rem; }

.femo-empty-sub {
  margin-top: 0.4rem;
  font-size: 0.9rem;
  color: var(--color-femo-ink-600);
  max-width: 40ch;
  line-height: 1.5;
}

.femo-empty-action { margin-top: 0.25rem; }
</style>
