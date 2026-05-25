<script setup lang="ts">
/**
 * FemoPageHero — branded page header for student dashboard tabs.
 * Replaces generic PageHeader: adds animated mesh, Femi mascot slot, eyebrow line.
 *
 * Usage:
 *   <FemoPageHero
 *     eyebrow="IAE · Студент"
 *     title="Карта твоих знаний"
 *     subtitle="Вот как ты растёшь"
 *     mascot-state="proud"
 *     mascot-line="Покажу всё, что ты освоил"
 *   >
 *     <template #actions>
 *       <button class="femo-btn-primary">Перепройти диагностику</button>
 *     </template>
 *   </FemoPageHero>
 */
type FemiState = 'greet' | 'think' | 'celebrate' | 'warn' | 'teach' | 'trophy'
  | 'wink' | 'proud' | 'confused' | 'sleepy' | 'dance' | 'shy'

withDefaults(defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: string
  mascotState?: FemiState
  mascotLine?: string
  mascotSize?: 'sm' | 'md' | 'lg'
  /** Visual variant — main hero (with mesh) or compact (no mesh, lower height) */
  variant?: 'hero' | 'compact'
  /** Hide mascot entirely — for tabs where Femi doesn't fit thematically */
  noMascot?: boolean
}>(), {
  subtitle: '',
  eyebrow: '',
  icon: '',
  mascotState: 'greet',
  mascotLine: '',
  mascotSize: 'md',
  variant: 'hero',
  noMascot: false
})
</script>

<template>
  <header
    class="femo-page-hero"
    :class="`femo-page-hero--${variant}`"
  >
    <FemoMeshBg v-if="variant === 'hero'" />

    <div class="femo-page-hero-inner">
      <div class="femo-page-hero-text">
        <p
          v-if="eyebrow"
          class="femo-page-hero-eyebrow"
        >
          <UIcon
            v-if="icon"
            :name="icon"
            class="size-3.5"
          />
          {{ eyebrow }}
        </p>
        <h1 class="femo-page-hero-title femo-display">
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="femo-page-hero-sub"
        >
          {{ subtitle }}
        </p>

        <div
          v-if="$slots.meta"
          class="femo-page-hero-meta"
        >
          <slot name="meta" />
        </div>

        <div
          v-if="$slots.actions"
          class="femo-page-hero-actions"
        >
          <slot name="actions" />
        </div>
      </div>

      <div
        v-if="!noMascot && variant === 'hero'"
        class="femo-page-hero-mascot"
      >
        <FemiMascot
          :state="mascotState"
          :size="mascotSize"
          :line="mascotLine"
          :silent="!mascotLine"
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.femo-page-hero {
  position: relative;
  border-radius: var(--radius-card-lg);
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF7F4 65%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  isolation: isolate;
}

.femo-page-hero--compact {
  background: var(--ui-bg-elevated);
  border-radius: var(--radius-card);
}

.femo-page-hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem 1.5rem;
}

@media (min-width: 768px) {
  .femo-page-hero-inner { grid-template-columns: 1fr auto; padding: 1.85rem 2rem; gap: 2rem; }
}

.femo-page-hero--compact .femo-page-hero-inner { padding: 1rem 1.25rem; }

.femo-page-hero-text { min-width: 0; }

.femo-page-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-femo-red-700);
  margin-bottom: 0.5rem;
}

.femo-page-hero-title {
  font-size: clamp(1.4rem, 3vw, 1.85rem);
  color: var(--color-femo-ink-900);
  line-height: 1.05;
}

.femo-page-hero--compact .femo-page-hero-title {
  font-size: 1.25rem;
}

.femo-page-hero-sub {
  margin-top: 0.45rem;
  font-size: 0.95rem;
  color: var(--color-femo-ink-600);
  line-height: 1.4;
  max-width: 56ch;
}

.femo-page-hero-meta {
  margin-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.femo-page-hero-actions {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.femo-page-hero-mascot {
  display: none;
  justify-self: end;
  align-self: end;
  pointer-events: none;
}

@media (min-width: 768px) {
  .femo-page-hero-mascot { display: block; }
}
</style>
