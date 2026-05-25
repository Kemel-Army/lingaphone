<script setup lang="ts">
/**
 * ThemeBackground — анимированный фон-паттерн для SCENARIO-слоя.
 *
 * Каждой ScenarioTheme (cafe/space/zoo/construction/artist/railway) сопоставлен
 * свой набор плавающих эмодзи-частиц с разной скоростью — создаёт parallax-
 * глубину сцены. Это превращает «контейнер с заданием» в «живую сцену»,
 * как в детских мультиках.
 *
 * Производительность: до 14 SVG/emoji-частиц с CSS-анимацией (translate +
 * opacity), 60fps на бюджетных Android. Никакого WebGL/Canvas.
 *
 * Reduced-motion: частицы рендерятся, но не движутся (видны как декор).
 *
 * Применение:
 *   <ThemeBackground theme="cafe" />
 */

type ScenarioTheme = 'cafe' | 'space' | 'zoo' | 'construction' | 'artist' | 'railway'

const props = withDefaults(defineProps<{
  theme: ScenarioTheme
  /** Сила: 'soft' (по умолчанию, мягкий paywall-effect) | 'rich' (для finale-сцен). */
  intensity?: 'soft' | 'rich'
}>(), {
  intensity: 'soft'
})

interface Particle {
  emoji: string
  /** Скорость 1-3 (parallax depth — медленные кажутся «дальше»). */
  speed: number
  /** Размер 0.8-1.6em. */
  size: number
}

const THEME_PARTICLES: Record<ScenarioTheme, Particle[]> = {
  cafe: [
    { emoji: '☕', speed: 1, size: 1.4 },
    { emoji: '🥐', speed: 2, size: 1.2 },
    { emoji: '🍰', speed: 1.5, size: 1.4 },
    { emoji: '🍪', speed: 2.5, size: 1 },
    { emoji: '☁️', speed: 0.6, size: 1.6 },
    { emoji: '✨', speed: 3, size: 0.9 }
  ],
  space: [
    { emoji: '⭐', speed: 0.5, size: 1 },
    { emoji: '🪐', speed: 1, size: 1.5 },
    { emoji: '🚀', speed: 2, size: 1.3 },
    { emoji: '🌟', speed: 1.5, size: 1 },
    { emoji: '☄️', speed: 2.5, size: 1.2 },
    { emoji: '✨', speed: 0.8, size: 0.9 }
  ],
  zoo: [
    { emoji: '🌿', speed: 0.8, size: 1.3 },
    { emoji: '🍃', speed: 1.5, size: 1.1 },
    { emoji: '🐾', speed: 2, size: 1 },
    { emoji: '🌳', speed: 0.5, size: 1.6 },
    { emoji: '🦋', speed: 2.5, size: 1.2 },
    { emoji: '🌺', speed: 1, size: 1.1 }
  ],
  construction: [
    { emoji: '⚙️', speed: 1, size: 1.3 },
    { emoji: '🔨', speed: 1.5, size: 1.2 },
    { emoji: '📐', speed: 2, size: 1.1 },
    { emoji: '✨', speed: 2.5, size: 0.9 },
    { emoji: '📏', speed: 0.8, size: 1.2 },
    { emoji: '🧱', speed: 1.2, size: 1 }
  ],
  artist: [
    { emoji: '🎨', speed: 1, size: 1.4 },
    { emoji: '🖌️', speed: 1.5, size: 1.2 },
    { emoji: '🖼️', speed: 0.8, size: 1.3 },
    { emoji: '🎭', speed: 2, size: 1.2 },
    { emoji: '✏️', speed: 2.5, size: 1 },
    { emoji: '🌈', speed: 0.5, size: 1.6 }
  ],
  railway: [
    { emoji: '🚂', speed: 2, size: 1.5 },
    { emoji: '☁️', speed: 0.5, size: 1.6 },
    { emoji: '🛤️', speed: 0.8, size: 1.3 },
    { emoji: '💨', speed: 3, size: 1.2 },
    { emoji: '🌲', speed: 1.2, size: 1.4 },
    { emoji: '⛰️', speed: 0.4, size: 1.5 }
  ]
}

const THEME_GRADIENTS: Record<ScenarioTheme, string> = {
  cafe: 'from-amber-100/40 via-orange-50/30 to-rose-100/30 dark:from-amber-900/10 dark:via-orange-900/10 dark:to-rose-900/10',
  space: 'from-violet-100/40 via-indigo-100/30 to-slate-100/40 dark:from-violet-900/15 dark:via-indigo-900/15 dark:to-slate-900/30',
  zoo: 'from-emerald-100/40 via-lime-50/30 to-green-100/30 dark:from-emerald-900/10 dark:via-lime-900/10 dark:to-green-900/10',
  construction: 'from-amber-100/30 via-stone-100/30 to-zinc-100/40 dark:from-amber-900/10 dark:via-stone-900/15 dark:to-zinc-900/20',
  artist: 'from-pink-100/40 via-purple-50/30 to-yellow-100/30 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-yellow-900/10',
  railway: 'from-sky-100/40 via-blue-50/30 to-cyan-100/30 dark:from-sky-900/10 dark:via-blue-900/10 dark:to-cyan-900/10'
}

const particles = computed(() => {
  const base = THEME_PARTICLES[props.theme] ?? []
  // В rich-режиме удваиваем количество частиц (для финальных сцен).
  return props.intensity === 'rich' ? [...base, ...base] : base
})

/** Распределяем частицы псевдо-случайно по экрану через детерминированный seed,
 * чтобы при ре-рендере позиции были стабильными (не «прыгали»). */
const positions = computed(() =>
  particles.value.map((_, i) => ({
    left: ((i * 37) % 95) + (i % 2 === 0 ? 1 : -1) * (i * 3 % 7),
    top: ((i * 23) % 80) + (i * 11 % 13),
    delay: (i * 0.7) % 4
  }))
)
</script>

<template>
  <div
    class="theme-bg pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
    aria-hidden="true"
  >
    <!-- Цветной градиент-фон под темой -->
    <div
      class="absolute inset-0 bg-linear-to-br"
      :class="THEME_GRADIENTS[theme]"
    />
    <!-- Плавающие частицы parallax -->
    <span
      v-for="(p, i) in particles"
      :key="`${theme}-p-${i}`"
      class="theme-particle absolute select-none"
      :style="{
        left: `${positions[i]?.left ?? 50}%`,
        top: `${positions[i]?.top ?? 50}%`,
        fontSize: `${p.size}em`,
        animationDuration: `${6 + (3 - p.speed) * 4}s`,
        animationDelay: `${positions[i]?.delay ?? 0}s`,
        opacity: intensity === 'rich' ? 0.55 : 0.32
      }"
    >
      {{ p.emoji }}
    </span>
  </div>
</template>

<style scoped>
@keyframes theme-drift {
  0%   { transform: translate(0, 0) rotate(0deg); }
  25%  { transform: translate(8px, -10px) rotate(4deg); }
  50%  { transform: translate(-6px, 6px) rotate(-3deg); }
  75%  { transform: translate(10px, 4px) rotate(2deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.theme-particle {
  animation: theme-drift 9s ease-in-out infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .theme-particle {
    animation: none !important;
  }
}
</style>
