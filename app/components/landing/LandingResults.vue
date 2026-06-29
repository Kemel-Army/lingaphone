<script setup lang="ts">
interface Stat {
  value: number
  suffix: string
  label: string
  sub: string
  icon: string
  accent: string
  decimals?: number
}
const stats: Stat[] = [
  {
    value: 5000,
    suffix: '+',
    label: 'выпускников',
    sub: 'за всё время работы',
    icon: 'i-lucide-users',
    accent: 'red'
  },
  {
    value: 13,
    suffix: ' лет',
    label: 'на рынке',
    sub: 'с 2013 года в Алматы',
    icon: 'i-lucide-calendar',
    accent: 'amber'
  },
  {
    value: 3,
    suffix: '',
    label: 'филиала',
    sub: 'в Алматы + онлайн',
    icon: 'i-lucide-map-pin',
    accent: 'coral'
  },
  {
    value: 159000,
    suffix: '+',
    label: 'подписчиков',
    sub: 'в Instagram @lingaphone.kz',
    icon: 'i-lucide-instagram',
    accent: 'red'
  }
]

const accentClass = (a: string) => `femo-stat--${a}`
</script>

<template>
  <section
    id="results"
    class="femo-section femo-stats-section"
  >
    <div class="femo-section-inner">
      <header class="femo-section-head">
        <span class="femo-chip">13 лет опыта</span>
        <h2 class="femo-section-title femo-display">
          Результаты за<br>
          <span class="femo-text-gradient">13 лет работы</span>
        </h2>
      </header>

      <div class="femo-stats-grid">
        <div
          v-for="(s, i) in stats"
          :key="i"
          class="femo-stat"
          :class="accentClass(s.accent)"
        >
          <div class="femo-stat-icon">
            <UIcon
              :name="s.icon"
              class="size-5"
            />
          </div>
          <p class="femo-stat-value femo-display">
            <FemoCountUp
              :value="s.value"
              :decimals="s.decimals ?? 0"
              :suffix="s.suffix"
            />
          </p>
          <p class="femo-stat-label">
            {{ s.label }}
          </p>
          <p class="femo-stat-sub">
            {{ s.sub }}
          </p>
          <div
            class="femo-stat-glow"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-stats-section { padding-top: clamp(3rem, 6vw, 5rem); }

.femo-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .femo-stats-grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
}

.femo-stat {
  position: relative;
  border-radius: var(--radius-card-lg);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  padding: 1.5rem 1.25rem;
  text-align: left;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: transform 0.45s var(--ease-out-expo),
              box-shadow 0.45s var(--ease-out-expo),
              border-color 0.45s var(--ease-out-expo);
}

.femo-stat:hover {
  transform: translateY(-4px);
  border-color: var(--color-femo-red-200);
  box-shadow: var(--shadow-pop);
}

.femo-stat-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  color: var(--color-femo-red-700);
  background: var(--color-femo-red-50);
}

.femo-stat--coral .femo-stat-icon { color: var(--color-femo-coral-700); background: var(--color-femo-coral-50); }
.femo-stat--amber .femo-stat-icon { color: var(--color-femo-amber-700); background: var(--color-femo-amber-50); }

.femo-stat-value {
  font-size: clamp(2.2rem, 4vw, 3rem);
  line-height: 1;
  color: var(--color-femo-ink-900);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.femo-stat-label { font-weight: 700; color: var(--color-femo-ink-900); }
.femo-stat-sub   { font-size: 0.85rem; color: var(--color-femo-ink-500); margin-top: 0.2rem; }

.femo-stat-glow {
  position: absolute;
  width: 14rem;
  height: 14rem;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.18;
  background: var(--gradient-hero);
  bottom: -7rem;
  right: -5rem;
  pointer-events: none;
}

.femo-stat--coral .femo-stat-glow { background: var(--gradient-coral); }
.femo-stat--amber .femo-stat-glow { background: linear-gradient(135deg, #FFC04D, #E58A06); }
</style>
