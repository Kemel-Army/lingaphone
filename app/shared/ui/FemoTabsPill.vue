<script setup lang="ts">
/**
 * FemoTabsPill — chunky pill tabs with active gradient fill and optional count badge.
 * Replaces UTabs for student dashboards.
 *
 * Usage:
 *   <FemoTabsPill
 *     v-model="active"
 *     :items="[
 *       { value: 'upcoming', label: 'Предстоящие', icon: 'i-lucide-calendar', count: 2 },
 *       { value: 'done',     label: 'Завершённые', icon: 'i-lucide-check', count: 12 }
 *     ]"
 *   />
 */
export interface FemoTab {
  value: string
  label: string
  icon?: string
  count?: number | null
  /** Disable this tab */
  disabled?: boolean
}

const props = defineProps<{
  items: FemoTab[]
  modelValue: string
  /** Compact variant — smaller padding, smaller text */
  compact?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const select = (tab: FemoTab) => {
  if (tab.disabled) return
  if (tab.value === props.modelValue) return
  emit('update:modelValue', tab.value)
}
</script>

<template>
  <div
    class="femo-tabs-pill"
    :class="compact && 'femo-tabs-pill--compact'"
    role="tablist"
  >
    <button
      v-for="tab in items"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="tab.value === modelValue"
      :disabled="tab.disabled"
      class="femo-tabs-pill-tab"
      :class="{
        'is-active': tab.value === modelValue,
        'is-disabled': tab.disabled
      }"
      @click="select(tab)"
    >
      <span class="femo-tabs-pill-glow" />
      <UIcon
        v-if="tab.icon"
        :name="tab.icon"
        class="femo-tabs-pill-icon size-4"
      />
      <span class="femo-tabs-pill-label">{{ tab.label }}</span>
      <span
        v-if="tab.count != null"
        class="femo-tabs-pill-count"
      >{{ tab.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.femo-tabs-pill {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.4rem;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(140%) blur(12px);
  -webkit-backdrop-filter: saturate(140%) blur(12px);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-soft);
}

.femo-tabs-pill-tab {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-femo-ink-600);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.3s var(--ease-out-expo),
    transform 0.3s var(--ease-out-expo);
  isolation: isolate;
  overflow: hidden;
}

.femo-tabs-pill--compact .femo-tabs-pill-tab {
  padding: 0.45rem 0.8rem;
  font-size: 0.85rem;
}

.femo-tabs-pill-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--gradient-hero);
  opacity: 0;
  transform: scale(0.85);
  z-index: -1;
  transition:
    opacity 0.35s var(--ease-out-expo),
    transform 0.45s var(--ease-out-back);
}

.femo-tabs-pill-tab:hover:not(.is-active):not(.is-disabled) {
  color: var(--color-femo-red-700);
  transform: translateY(-1px);
}

.femo-tabs-pill-tab.is-active {
  color: white;
}

.femo-tabs-pill-tab.is-active .femo-tabs-pill-glow {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.4);
}

.femo-tabs-pill-tab.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.femo-tabs-pill-count {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.05rem 0.4rem;
  min-width: 1.25rem;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.12);
  color: var(--color-femo-red-700);
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}

.femo-tabs-pill-tab.is-active .femo-tabs-pill-count {
  background: rgba(255, 255, 255, 0.28);
  color: white;
}

@media (max-width: 640px) {
  .femo-tabs-pill { gap: 0.25rem; padding: 0.3rem; }
  .femo-tabs-pill-tab { padding: 0.5rem 0.7rem; font-size: 0.85rem; gap: 0.35rem; }
  .femo-tabs-pill-label { font-size: 0.85rem; }
}
</style>
