<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Full-screen celebration modal triggered when a student levels up.
 * Pops a confetti burst, animates a trophy + new level badge.
 *
 * Usage:
 *   <LevelUpModal v-model:open="showLevelUp" :level="newLevel" :xp="xp" />
 */
const props = withDefaults(defineProps<{
  open: boolean
  level: number
  xp?: number
  reward?: string
}>(), {
  xp: 0,
  reward: ''
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}>()

const { trophy } = useConfetti()
const reduced = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  reduced.value = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Slight delay so the badge enter-animation lands before the burst
  setTimeout(() => {
    trophy()
  }, 250)
}, { immediate: false })

const close = () => {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <teleport to="body">
    <Transition name="femo-levelup-fade">
      <div
        v-if="open"
        class="femo-levelup"
        role="dialog"
        aria-modal="true"
        @click.self="close"
      >
        <div class="femo-levelup-card">
          <button
            type="button"
            class="femo-levelup-close"
            aria-label="Закрыть"
            @click="close"
          >
            <UIcon
              name="i-lucide-x"
              class="size-4"
            />
          </button>

          <!-- Floating sparkles -->
          <div
            v-if="!reduced"
            class="femo-levelup-sparkles"
            aria-hidden="true"
          >
            <span
              v-for="n in 8"
              :key="n"
              class="femo-levelup-sparkle"
              :style="{
                left: `${(n - 1) * 12 + 4}%`,
                top: `${20 + (n % 3) * 20}%`,
                animationDelay: `${n * 0.18}s`
              }"
            />
          </div>

          <div class="femo-levelup-trophy">
            <div
              class="femo-levelup-trophy-aura"
              aria-hidden="true"
            />
            <UIcon
              name="i-lucide-trophy"
              class="size-12"
            />
          </div>

          <p class="femo-levelup-eyebrow">
            Новый уровень!
          </p>

          <h2 class="femo-levelup-title femo-display">
            Уровень <span class="femo-text-gradient">{{ level }}</span>
          </h2>

          <p class="femo-levelup-sub">
            Поздравляем! Ты на новой ступени мастерства.
          </p>

          <div
            v-if="xp"
            class="femo-levelup-xp"
          >
            <UIcon
              name="i-lucide-zap"
              class="size-4"
            />
            <FemoCountUp :value="xp" />
            <span>XP</span>
          </div>

          <div
            v-if="reward"
            class="femo-levelup-reward"
          >
            <UIcon
              name="i-lucide-gift"
              class="size-4"
            />
            {{ reward }}
          </div>

          <button
            type="button"
            class="femo-btn-primary femo-levelup-cta"
            @click="close"
          >
            <span>Продолжить</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </button>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<style scoped>
.femo-levelup {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(24, 21, 19, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.femo-levelup-card {
  position: relative;
  width: min(420px, 100%);
  border-radius: var(--radius-hero);
  background:
    radial-gradient(60% 60% at 50% 0%, rgba(220, 38, 38, 0.18), transparent 70%),
    linear-gradient(180deg, #FFFFFF 0%, #FFF7F4 100%);
  border: 1px solid var(--color-femo-red-100);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 40px 80px -24px rgba(220, 38, 38, 0.45),
    0 80px 160px -40px rgba(250, 165, 26, 0.30);
  padding: 2.25rem 1.75rem 2rem;
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  isolation: isolate;
  overflow: hidden;
  animation: femo-levelup-pop 0.55s var(--ease-out-back);
}

@keyframes femo-levelup-pop {
  0%   { opacity: 0; transform: translateY(24px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.femo-levelup-close {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--color-femo-ink-50);
  color: var(--color-femo-ink-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s var(--ease-out-expo);
}

.femo-levelup-close:hover {
  background: var(--color-femo-red-50);
  color: var(--color-femo-red-700);
}

.femo-levelup-trophy {
  position: relative;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--gradient-hero);
  box-shadow: 0 18px 36px -10px rgba(220, 38, 38, 0.55);
  z-index: 1;
}

.femo-levelup-trophy-aura {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: var(--gradient-hero);
  opacity: 0.3;
  filter: blur(20px);
  animation: femo-levelup-pulse 2.4s ease-in-out infinite;
  z-index: -1;
}

@keyframes femo-levelup-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.30; }
  50%      { transform: scale(1.2); opacity: 0.55; }
}

.femo-levelup-eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-femo-red-700);
}

.femo-levelup-title {
  font-size: clamp(2rem, 5vw, 2.6rem);
  color: var(--color-femo-ink-900);
  margin: 0;
}

.femo-levelup-sub {
  font-size: 0.95rem;
  color: var(--color-femo-ink-600);
  max-width: 280px;
  line-height: 1.5;
}

.femo-levelup-xp {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-pill);
  background: var(--color-femo-amber-50);
  border: 1px solid var(--color-femo-amber-100);
  color: var(--color-femo-amber-700);
  font-weight: 700;
  font-size: 0.95rem;
}

.femo-levelup-reward {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  background: var(--color-femo-coral-50);
  border: 1px solid var(--color-femo-coral-100);
  color: var(--color-femo-coral-700);
  font-weight: 600;
  font-size: 0.85rem;
}

.femo-levelup-cta {
  margin-top: 0.5rem;
  padding: 0.85rem 1.4rem;
  width: 100%;
  max-width: 240px;
}

/* Decorative sparkles */
.femo-levelup-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.femo-levelup-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-femo-amber-400);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.7);
  opacity: 0;
  animation: femo-levelup-twinkle 2.4s ease-in-out infinite;
}

.femo-levelup-sparkle:nth-child(2n)  { background: var(--color-femo-coral-400); }
.femo-levelup-sparkle:nth-child(3n)  { background: var(--color-femo-red-400); }
.femo-levelup-sparkle:nth-child(4n)  { width: 4px; height: 4px; }

@keyframes femo-levelup-twinkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  40%      { opacity: 1; transform: scale(1.2); }
  60%      { opacity: 0.7; transform: scale(1); }
}

/* Transitions */
.femo-levelup-fade-enter-active,
.femo-levelup-fade-leave-active {
  transition: opacity 0.35s var(--ease-out-expo);
}

.femo-levelup-fade-enter-from,
.femo-levelup-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .femo-levelup-card,
  .femo-levelup-trophy-aura,
  .femo-levelup-sparkle {
    animation: none !important;
  }
}
</style>
