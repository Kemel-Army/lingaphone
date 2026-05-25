<script setup lang="ts">
import type { AIMode } from '~/shared/types/common'
import { AI_MODE_LABELS } from '~/features/ai-session'

defineProps<{
  selectedMode?: AIMode
}>()

const emit = defineEmits<{
  select: [mode: AIMode]
}>()

const modes = Object.entries(AI_MODE_LABELS).map(([key, val]) => ({
  value: key as AIMode,
  ...val
}))
</script>

<template>
  <div class="femo-modes">
    <button
      v-for="mode in modes"
      :key="mode.value"
      type="button"
      class="femo-mode"
      :class="{ 'is-active': selectedMode === mode.value }"
      @click="emit('select', mode.value)"
    >
      <span class="femo-mode-icon">
        <UIcon
          :name="mode.icon"
          class="size-5"
        />
      </span>
      <span class="femo-mode-body">
        <span class="femo-mode-title">{{ mode.label }}</span>
        <span class="femo-mode-desc">{{ mode.description }}</span>
      </span>
      <UIcon
        :name="selectedMode === mode.value ? 'i-lucide-check' : 'i-lucide-arrow-right'"
        class="femo-mode-arrow size-4"
      />
    </button>
  </div>
</template>

<style scoped>
.femo-modes {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

@media (min-width: 640px) {
  .femo-modes { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .femo-modes { grid-template-columns: repeat(3, 1fr); }
}

.femo-mode {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 1.1rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  text-align: left;
  cursor: pointer;
  isolation: isolate;
  transition: transform 0.35s var(--ease-out-expo),
              border-color 0.35s var(--ease-out-expo),
              box-shadow 0.35s var(--ease-out-expo),
              background 0.35s var(--ease-out-expo);
}

.femo-mode:hover {
  border-color: var(--color-femo-coral-200);
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.femo-mode.is-active {
  border-color: transparent;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  box-shadow: 0 14px 32px -10px rgba(220, 38, 38, 0.30);
}

.femo-mode-icon {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-femo-ink-50);
  color: var(--color-femo-ink-700);
  transition: all 0.35s var(--ease-out-expo);
}

.femo-mode.is-active .femo-mode-icon {
  background: var(--gradient-hero);
  color: white;
  box-shadow: 0 8px 18px -4px rgba(220, 38, 38, 0.45);
}

.femo-mode-body { display: grid; min-width: 0; }

.femo-mode-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.005em;
}

.femo-mode-desc {
  font-size: 0.8rem;
  color: var(--color-femo-ink-500);
  margin-top: 0.15rem;
  line-height: 1.4;
}

.femo-mode-arrow {
  color: var(--color-femo-ink-400);
  transition: transform 0.3s var(--ease-out-expo), color 0.3s ease;
}

.femo-mode:hover .femo-mode-arrow { transform: translateX(3px); color: var(--color-femo-red-600); }
.femo-mode.is-active .femo-mode-arrow { color: var(--color-femo-red-700); transform: none; }
</style>
