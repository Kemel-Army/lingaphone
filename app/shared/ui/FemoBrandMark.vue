<script setup lang="ts">
/**
 * Lingaphone brand mark (logo + wordmark).
 * Renders a gradient-filled "L" tile + "Lingaphone" wordmark.
 */
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
}>(), {
  size: 'md',
  showWordmark: true
})
</script>

<template>
  <span
    class="femo-brandmark"
    :class="`femo-brandmark--${size}`"
  >
    <span
      class="femo-brandmark-tile"
      aria-hidden="true"
    >
      <span>L</span>
    </span>
    <span
      v-if="showWordmark"
      class="femo-brandmark-word"
    >Lingaphone</span>
  </span>
</template>

<style scoped>
.femo-brandmark {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  user-select: none;
}

.femo-brandmark-tile {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  background: var(--gradient-hero);
  border-radius: 0.7rem;
  box-shadow: 0 6px 18px -4px rgba(2, 132, 199, 0.45);
  isolation: isolate;
}

.femo-brandmark-tile::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent 60%);
  pointer-events: none;
}

.femo-brandmark-word {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-femo-ink-900);
}

/* sizes */
.femo-brandmark--sm .femo-brandmark-tile { width: 1.6rem; height: 1.6rem; font-size: 0.85rem; }
.femo-brandmark--sm .femo-brandmark-word { font-size: 0.95rem; }

.femo-brandmark--md .femo-brandmark-tile { width: 2.1rem; height: 2.1rem; font-size: 1rem; border-radius: 0.85rem; }
.femo-brandmark--md .femo-brandmark-word { font-size: 1.15rem; }

.femo-brandmark--lg .femo-brandmark-tile { width: 2.75rem; height: 2.75rem; font-size: 1.25rem; border-radius: 1rem; }
.femo-brandmark--lg .femo-brandmark-word { font-size: 1.5rem; }
</style>
