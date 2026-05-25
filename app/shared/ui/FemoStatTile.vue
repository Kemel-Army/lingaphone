<script setup lang="ts">
/**
 * FemoStatTile — branded stat card with icon, count-up value, optional delta and tone.
 *
 * Usage:
 *   <FemoStatTile
 *     icon="i-lucide-flame"
 *     tone="amber"
 *     label="Серия"
 *     :value="14"
 *     suffix=" дн."
 *     delta="+3"
 *     delta-tone="up"
 *   />
 */
type Tone = 'red' | 'coral' | 'amber' | 'ink' | 'green'
type DeltaTone = 'up' | 'down' | 'flat'

withDefaults(defineProps<{
  label: string
  value: number
  icon?: string
  tone?: Tone
  prefix?: string
  suffix?: string
  decimals?: number
  delta?: string
  deltaTone?: DeltaTone
  /** Hide the count-up animation (use plain number) */
  staticValue?: boolean
}>(), {
  icon: '',
  tone: 'red',
  prefix: '',
  suffix: '',
  decimals: 0,
  delta: '',
  deltaTone: 'flat',
  staticValue: false
})
</script>

<template>
  <div
    class="femo-stat-tile"
    :class="`femo-stat-tile--${tone}`"
  >
    <div
      v-if="icon"
      class="femo-stat-tile-icon"
    >
      <UIcon
        :name="icon"
        class="size-5"
      />
    </div>
    <p class="femo-stat-tile-value femo-display">
      <FemoCountUp
        v-if="!staticValue"
        :value="value"
        :decimals="decimals"
        :prefix="prefix"
        :suffix="suffix"
      />
      <template v-else>
        {{ prefix }}{{ value }}{{ suffix }}
      </template>
    </p>
    <p class="femo-stat-tile-label">
      {{ label }}
    </p>
    <p
      v-if="delta"
      class="femo-stat-tile-delta"
      :class="`is-${deltaTone}`"
    >
      <UIcon
        v-if="deltaTone === 'up'"
        name="i-lucide-trending-up"
        class="size-3"
      />
      <UIcon
        v-else-if="deltaTone === 'down'"
        name="i-lucide-trending-down"
        class="size-3"
      />
      <span>{{ delta }}</span>
    </p>
  </div>
</template>

<style scoped>
.femo-stat-tile {
  position: relative;
  display: grid;
  gap: 0.35rem;
  padding: 1.1rem 1.15rem 1.05rem;
  border-radius: var(--radius-card);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-soft);
  transition:
    transform 0.4s var(--ease-out-expo),
    box-shadow 0.4s var(--ease-out-expo),
    border-color 0.4s var(--ease-out-expo);
  isolation: isolate;
  overflow: hidden;
}

.femo-stat-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.5;
  pointer-events: none;
}

.femo-stat-tile--red::before    { background: radial-gradient(80% 70% at 100% 0%, rgba(239, 68, 56, 0.08), transparent 65%); }
.femo-stat-tile--coral::before  { background: radial-gradient(80% 70% at 100% 0%, rgba(255, 122, 72, 0.10), transparent 65%); }
.femo-stat-tile--amber::before  { background: radial-gradient(80% 70% at 100% 0%, rgba(250, 165, 26, 0.10), transparent 65%); }
.femo-stat-tile--green::before  { background: radial-gradient(80% 70% at 100% 0%, rgba(34, 197, 94, 0.10), transparent 65%); }
.femo-stat-tile--ink::before    { background: radial-gradient(80% 70% at 100% 0%, rgba(82, 72, 67, 0.06), transparent 65%); }

.femo-stat-tile:hover {
  transform: translateY(-2px);
  border-color: var(--color-femo-coral-200);
  box-shadow: var(--shadow-pop);
}

.femo-stat-tile-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.85rem;
  margin-bottom: 0.15rem;
}

.femo-stat-tile--red    .femo-stat-tile-icon { background: var(--color-femo-red-50);    color: var(--color-femo-red-600); }
.femo-stat-tile--coral  .femo-stat-tile-icon { background: var(--color-femo-coral-50);  color: var(--color-femo-coral-600); }
.femo-stat-tile--amber  .femo-stat-tile-icon { background: var(--color-femo-amber-50);  color: var(--color-femo-amber-600); }
.femo-stat-tile--green  .femo-stat-tile-icon { background: rgba(34, 197, 94, 0.10);     color: rgb(22, 163, 74); }
.femo-stat-tile--ink    .femo-stat-tile-icon { background: var(--color-femo-ink-50);    color: var(--color-femo-ink-700); }

.femo-stat-tile-value {
  font-size: 1.65rem;
  color: var(--color-femo-ink-900);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.femo-stat-tile-label {
  font-size: 0.82rem;
  color: var(--color-femo-ink-600);
  font-weight: 500;
}

.femo-stat-tile-delta {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  font-weight: 700;
  width: fit-content;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}

.femo-stat-tile-delta.is-up    { color: rgb(22, 163, 74); background: rgba(34, 197, 94, 0.10); }
.femo-stat-tile-delta.is-down  { color: var(--color-femo-red-700); background: var(--color-femo-red-50); }
.femo-stat-tile-delta.is-flat  { color: var(--color-femo-ink-600); background: var(--color-femo-ink-50); }
</style>
