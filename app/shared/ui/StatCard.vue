<script setup lang="ts">
/**
 * Shared StatCard — a polished metric card for dashboards.
 * Uses brand tokens, animated count-up, and a subtle hover lift.
 */
interface Props {
  title: string
  value: string | number
  icon?: string
  trend?: number
  trendLabel?: string
  color?: 'primary' | 'blue' | 'amber' | 'rose' | 'violet' | 'cyan' | 'success' | 'warning' | 'error' | 'info'
  format?: 'number' | 'currency' | 'percent'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  trend: 0,
  trendLabel: '',
  color: 'primary',
  format: undefined,
  loading: false
})

// Parse incoming value into a numeric part + suffix so FemoCountUp can animate
// (handles strings like "92%", "4 130 000 ₸", "12 / 5", and plain numbers).
const parsed = computed(() => {
  const raw = props.value
  if (typeof raw === 'number') {
    return {
      numeric: raw,
      suffix:
        props.format === 'percent'
          ? '%'
          : props.format === 'currency'
            ? ' ₸'
            : '',
      prefix: '',
      decimals: Number.isInteger(raw) ? 0 : 1,
      passthrough: false
    }
  }
  const trimmed = raw.trim()
  // Try to find a number at the start (with optional spaces as thousand separators)
  const m = trimmed.match(/^([\d\s.,]+)(.*)$/)
  if (m) {
    const numStr = m[1]!.replace(/\s/g, '').replace(',', '.')
    const n = Number(numStr)
    if (Number.isFinite(n)) {
      return {
        numeric: n,
        suffix: m[2] ?? '',
        prefix: '',
        decimals: numStr.includes('.') ? 1 : 0,
        passthrough: false
      }
    }
  }
  return { numeric: 0, suffix: '', prefix: '', decimals: 0, passthrough: true, raw: trimmed }
})

const accentVar = computed(() => {
  const map: Record<string, string> = {
    primary: 'var(--color-femo-red-600)',
    rose: 'var(--color-femo-coral-600)',
    amber: 'var(--color-femo-amber-600)',
    blue: 'var(--color-info)',
    cyan: 'var(--color-info)',
    violet: 'var(--color-femo-coral-700)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)'
  }
  return map[props.color] ?? map.primary
})

const accentSoftVar = computed(() => {
  const map: Record<string, string> = {
    primary: 'var(--color-femo-red-50)',
    rose: 'var(--color-femo-coral-50)',
    amber: 'var(--color-femo-amber-50)',
    blue: 'var(--color-info-soft)',
    cyan: 'var(--color-info-soft)',
    violet: 'var(--color-femo-coral-50)',
    success: 'var(--color-success-soft)',
    warning: 'var(--color-warning-soft)',
    error: 'var(--color-error-soft)',
    info: 'var(--color-info-soft)'
  }
  return map[props.color] ?? map.primary
})
</script>

<template>
  <div
    class="femo-statcard group"
    :style="{
      '--accent': accentVar,
      '--accent-soft': accentSoftVar
    } as Record<string, string>"
  >
    <div class="femo-statcard-row">
      <div class="femo-statcard-body">
        <p class="femo-statcard-label">
          {{ title }}
        </p>
        <div
          v-if="loading"
          class="femo-statcard-skeleton"
        />
        <p
          v-else
          class="femo-statcard-value femo-display"
        >
          <FemoCountUp
            v-if="!parsed.passthrough"
            :value="parsed.numeric"
            :decimals="parsed.decimals"
            :suffix="parsed.suffix"
            :prefix="parsed.prefix"
          />
          <template v-else>
            {{ parsed.raw }}
          </template>
        </p>
        <div
          v-if="(trend || trendLabel) && !loading"
          class="femo-statcard-trend"
        >
          <span
            class="femo-statcard-trend-pill"
            :class="trend > 0 ? 'is-up' : trend < 0 ? 'is-down' : 'is-neutral'"
          >
            <UIcon
              v-if="trend"
              :name="trend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
              class="size-3"
            />
            {{ trend > 0 ? '+' : '' }}{{ trend }}%
          </span>
          <span
            v-if="trendLabel"
            class="femo-statcard-trend-label"
          >
            {{ trendLabel }}
          </span>
        </div>
      </div>

      <div
        v-if="icon"
        class="femo-statcard-icon"
      >
        <UIcon
          :name="icon"
          class="size-5"
        />
      </div>
    </div>

    <div
      class="femo-statcard-glow"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.femo-statcard {
  position: relative;
  border-radius: var(--radius-card);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-soft);
  padding: 1.25rem 1.4rem;
  overflow: hidden;
  transition: transform 0.4s var(--ease-out-expo),
              box-shadow 0.4s var(--ease-out-expo),
              border-color 0.4s var(--ease-out-expo);
  isolation: isolate;
}

.femo-statcard:hover {
  transform: translateY(-3px);
  border-color: color-mix(in oklab, var(--accent) 35%, transparent);
  box-shadow: var(--shadow-pop);
}

.femo-statcard-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.femo-statcard-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.femo-statcard-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-femo-ink-500);
}

.femo-statcard-skeleton {
  margin-top: 0.25rem;
  height: 2rem;
  width: 5rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, var(--color-femo-ink-100), var(--color-femo-ink-50), var(--color-femo-ink-100));
  background-size: 200% 100%;
  animation: femo-shimmer 1.4s ease-in-out infinite;
}

@keyframes femo-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.femo-statcard-value {
  font-size: clamp(1.65rem, 2.6vw, 2.05rem);
  line-height: 1.05;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.02em;
}

.femo-statcard-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.2rem;
}

.femo-statcard-trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.18rem 0.55rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 700;
}

.femo-statcard-trend-pill.is-up      { background: rgba(22, 163, 74, 0.10); color: #15803D; }
.femo-statcard-trend-pill.is-down    { background: rgba(220, 38, 38, 0.10); color: var(--color-femo-red-700); }
.femo-statcard-trend-pill.is-neutral { background: var(--color-femo-ink-50); color: var(--color-femo-ink-600); }

.femo-statcard-trend-label {
  font-size: 0.78rem;
  color: var(--color-femo-ink-500);
}

.femo-statcard-icon {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  color: var(--accent);
  background: var(--accent-soft);
  transition: transform 0.4s var(--ease-out-expo), color 0.4s ease, background 0.4s ease;
}

.femo-statcard:hover .femo-statcard-icon {
  transform: scale(1.08) rotate(-4deg);
}

.femo-statcard-glow {
  position: absolute;
  width: 14rem;
  height: 14rem;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  background: var(--accent);
  bottom: -8rem;
  right: -6rem;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.5s var(--ease-out-expo);
}

.femo-statcard:hover .femo-statcard-glow { opacity: 0.18; }
</style>
