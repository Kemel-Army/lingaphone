<script setup lang="ts">
/**
 * FemoSectionCard — branded section wrapper with title/icon/actions slot.
 * Replaces UCard for FEMO-styled dashboard sections.
 *
 * Usage:
 *   <FemoSectionCard
 *     icon="i-lucide-brain"
 *     title="Карта знаний"
 *     description="Что освоено, где пробелы"
 *   >
 *     <template #actions>
 *       <button>Все темы</button>
 *     </template>
 *     ...content...
 *   </FemoSectionCard>
 */
type Tone = 'default' | 'red' | 'coral' | 'amber' | 'green'

withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string
  tone?: Tone
  /** Hover-lift effect on the entire card */
  hoverable?: boolean
  /** Remove inner padding — for sections that bring their own canvas (heatmap, chart, list) */
  flush?: boolean
  /** Compact header — smaller icon, smaller title */
  compact?: boolean
}>(), {
  title: '',
  description: '',
  icon: '',
  tone: 'default',
  hoverable: false,
  flush: false,
  compact: false
})
</script>

<template>
  <section
    class="femo-section-card"
    :class="[
      `femo-section-card--${tone}`,
      hoverable && 'femo-section-card--hoverable',
      compact && 'femo-section-card--compact'
    ]"
  >
    <header
      v-if="title || $slots.actions || $slots.header"
      class="femo-section-card-head"
    >
      <slot name="header">
        <div class="femo-section-card-head-text">
          <div class="femo-section-card-head-title-row">
            <div
              v-if="icon"
              class="femo-section-card-icon"
            >
              <UIcon
                :name="icon"
                class="size-4"
              />
            </div>
            <h3 class="femo-section-card-title">
              {{ title }}
            </h3>
          </div>
          <p
            v-if="description"
            class="femo-section-card-desc"
          >
            {{ description }}
          </p>
        </div>
      </slot>

      <div
        v-if="$slots.actions"
        class="femo-section-card-actions"
      >
        <slot name="actions" />
      </div>
    </header>

    <div
      class="femo-section-card-body"
      :class="flush && 'femo-section-card-body--flush'"
    >
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="femo-section-card-footer"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.femo-section-card {
  position: relative;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft);
  transition:
    transform 0.4s var(--ease-out-expo),
    box-shadow 0.4s var(--ease-out-expo),
    border-color 0.4s var(--ease-out-expo);
  overflow: hidden;
}

.femo-section-card--hoverable:hover {
  transform: translateY(-2px);
  border-color: var(--color-femo-coral-200);
  box-shadow: var(--shadow-pop);
}

/* Tone accents — left bar */
.femo-section-card--red,
.femo-section-card--coral,
.femo-section-card--amber,
.femo-section-card--green {
  position: relative;
}

.femo-section-card--red::before,
.femo-section-card--coral::before,
.femo-section-card--amber::before,
.femo-section-card--green::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  pointer-events: none;
}

.femo-section-card--red::before    { background: var(--color-femo-red-500); }
.femo-section-card--coral::before  { background: var(--color-femo-coral-500); }
.femo-section-card--amber::before  { background: var(--color-femo-amber-500); }
.femo-section-card--green::before  { background: rgb(34, 197, 94); }

.femo-section-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem 0.85rem;
  border-bottom: 1px solid var(--color-femo-ink-100);
}

.femo-section-card--compact .femo-section-card-head { padding: 0.75rem 1rem 0.65rem; }

.femo-section-card-head-text { min-width: 0; flex: 1; }

.femo-section-card-head-title-row {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.femo-section-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 0.65rem;
  background: var(--color-femo-red-50);
  color: var(--color-femo-red-600);
}

.femo-section-card--coral .femo-section-card-icon { background: var(--color-femo-coral-50); color: var(--color-femo-coral-600); }
.femo-section-card--amber .femo-section-card-icon { background: var(--color-femo-amber-50); color: var(--color-femo-amber-600); }
.femo-section-card--green .femo-section-card-icon { background: rgba(34, 197, 94, 0.10);    color: rgb(22, 163, 74); }

.femo-section-card-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
}

.femo-section-card--compact .femo-section-card-title { font-size: 0.92rem; }

.femo-section-card-desc {
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: var(--color-femo-ink-600);
  line-height: 1.4;
}

.femo-section-card-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  shrink: 0;
}

.femo-section-card-body { padding: 1rem 1.25rem; }
.femo-section-card-body--flush { padding: 0; }
.femo-section-card--compact .femo-section-card-body { padding: 0.85rem 1rem; }

.femo-section-card-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-femo-ink-100);
  background: linear-gradient(0deg, var(--color-femo-ink-50), transparent);
}

@media (max-width: 640px) {
  .femo-section-card-head { padding: 0.85rem 1rem 0.7rem; flex-wrap: wrap; }
  .femo-section-card-body { padding: 0.85rem 1rem; }
}
</style>
