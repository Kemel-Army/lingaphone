<script setup lang="ts">
/**
 * TrophyDisplay — золото/серебро/бронза/none + SVG-фейерверк.
 *
 * Применяется в финале MasteryCheckLayer. Заменяет прежний
 * confetti-emoji на более плавный кубок + SVG-салют, который
 * 60fps работает даже на iPhone SE.
 *
 * Уровни:
 *   gold   ≥ goldThreshold (default 100)
 *   silver ≥ silverThreshold (default 80)
 *   bronze ≥ bronzeThreshold (default 60)
 *   none   < bronze
 */
import type { TrophyTier } from '~/entities/learning-path'

const props = withDefaults(defineProps<{
  tier: TrophyTier
  scorePct: number
  /** Включить фейерверк (только для gold/silver) */
  fireworks?: boolean
}>(), {
  fireworks: true
})

const tierMeta = computed(() => ({
  gold: {
    label: 'Золотой трофей!',
    sublabel: 'Идеально!',
    color: 'amber',
    emoji: '🏆',
    glow: 'shadow-amber-300/60',
    bg: 'from-amber-200 to-yellow-300',
    text: 'text-amber-700 dark:text-amber-200'
  },
  silver: {
    label: 'Серебряный трофей',
    sublabel: 'Отлично!',
    color: 'slate',
    emoji: '🥈',
    glow: 'shadow-slate-300/60',
    bg: 'from-slate-200 to-zinc-300',
    text: 'text-slate-700 dark:text-slate-200'
  },
  bronze: {
    label: 'Бронзовый трофей',
    sublabel: 'Хорошо!',
    color: 'orange',
    emoji: '🥉',
    glow: 'shadow-orange-300/60',
    bg: 'from-orange-200 to-amber-300',
    text: 'text-orange-700 dark:text-orange-200'
  },
  none: {
    label: 'Почти получилось',
    sublabel: 'Давай ещё раз',
    color: 'sky',
    emoji: '💪',
    glow: '',
    bg: 'from-sky-200 to-cyan-300',
    text: 'text-sky-700 dark:text-sky-200'
  }
}[props.tier]))

// Точки фейерверка — 18 SVG-частиц с разлётом
const fireworksPoints = computed(() => {
  if (!props.fireworks || props.tier === 'none') return []
  return Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2
    const distance = 80 + (i % 3) * 30
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delay: (i % 5) * 0.05,
      hue: ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#A855F7'][i % 5]
    }
  })
})
</script>

<template>
  <div class="relative flex flex-col items-center text-center">
    <!-- Фейерверк (SVG) -->
    <svg
      v-if="fireworks && fireworksPoints.length"
      class="pointer-events-none absolute inset-0 size-full overflow-visible"
      viewBox="-200 -200 400 400"
      aria-hidden="true"
    >
      <g>
        <circle
          v-for="p in fireworksPoints"
          :key="p.id"
          class="firework-spark"
          cx="0"
          cy="0"
          r="4"
          :fill="p.hue"
          :style="{
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            'animation-delay': `${p.delay}s`
          } as Record<string, string>"
        />
      </g>
    </svg>

    <!-- Trophy кубок -->
    <div
      class="relative trophy-pop flex size-32 sm:size-40 items-center justify-center rounded-full bg-linear-to-br shadow-2xl"
      :class="[tierMeta.bg, tierMeta.glow]"
    >
      <span
        class="text-6xl sm:text-7xl trophy-bob"
        aria-hidden="true"
      >
        {{ tierMeta.emoji }}
      </span>
    </div>

    <!-- Score -->
    <div class="mt-5 text-4xl sm:text-5xl font-black tabular-nums text-highlighted leading-none">
      {{ scorePct }}%
    </div>
    <div
      class="mt-1 text-base sm:text-lg font-bold"
      :class="tierMeta.text"
    >
      {{ tierMeta.label }}
    </div>
    <div class="mt-0.5 text-xs sm:text-sm text-muted">
      {{ tierMeta.sublabel }}
    </div>
  </div>
</template>

<style scoped>
@keyframes trophy-pop-anim {
  0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
  60% { transform: scale(1.1) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.trophy-pop {
  animation: trophy-pop-anim 0.7s cubic-bezier(0.25, 0.8, 0.4, 1.2);
}

@keyframes trophy-bob-anim {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.trophy-bob {
  display: inline-block;
  animation: trophy-bob-anim 2s ease-in-out infinite;
  animation-delay: 0.7s;
}

@keyframes firework-spark-anim {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 1;
  }
  20% {
    transform: translate(calc(var(--dx, 0) * 0.4), calc(var(--dy, 0) * 0.4)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx, 0), var(--dy, 0)) scale(0.2);
    opacity: 0;
  }
}
.firework-spark {
  animation: firework-spark-anim 1.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
  transform-origin: center;
  will-change: transform, opacity;
}
</style>
