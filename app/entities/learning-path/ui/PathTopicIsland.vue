<script setup lang="ts">
/**
 * PathTopicIsland — круглый «остров»-тема на карте приключений.
 *
 * Аудитория: 1–6 класс. Подсветка статуса, 1–3 звезды по mastery,
 * мягкий bounce у active, замок у locked, конфетти при клике на done.
 *
 * Внутри MyPathAdventureMap компонент позиционируется абсолютно:
 * родитель задаёт top/left, мы рисуем сам остров и подпись.
 */
import type { PathTopic } from '~/entities/learning-path'

type IslandStatus = 'done' | 'active' | 'locked'

interface Palette {
  gradient: string
  shadow: string
}

const props = withDefaults(defineProps<{
  topic: PathTopic
  index: number
  status: IslandStatus
  palette: Palette
  /** Сторона подписи относительно острова. */
  side?: 'left' | 'right'
  /** Размер: 'sm' для младших скринов, 'md' дефолт. */
  size?: 'sm' | 'md'
}>(), {
  side: 'right',
  size: 'md'
})

const { t } = useI18n()

// 1–3 звезды по прогрессу (33% / 66% / 100%) — как в детских аркадах.
const stars = computed(() => {
  const p = props.topic.progress ?? 0
  if (p >= 100) return 3
  if (p >= 66) return 2
  if (p >= 33) return 1
  return 0
})

const sizeClasses = computed(() =>
  props.size === 'sm'
    ? { circle: 'size-24 sm:size-28', icon: 'size-10 sm:size-12' }
    : { circle: 'size-28 sm:size-32', icon: 'size-12 sm:size-14' }
)

// ──────────────────────────────────────────────────────────────────────
// Click-burst: лёгкая SVG-конфетти при клике на done/active.
// Без внешних библиотек — несколько частиц с randomized angle/distance,
// уважают prefers-reduced-motion.
// ──────────────────────────────────────────────────────────────────────
type Particle = { id: number, dx: number, dy: number, color: string, rot: number }

const particles = ref<Particle[]>([])
let particleSeq = 0

const COLORS = ['#FBBF24', '#F472B6', '#34D399', '#60A5FA', '#A78BFA', '#FB923C']

const burst = () => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  if (props.status === 'locked') return
  const count = props.status === 'done' ? 14 : 8
  const next: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const distance = 60 + Math.random() * 40
    next.push({
      id: ++particleSeq,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#FBBF24',
      rot: Math.random() * 360
    })
  }
  particles.value = next
  // Очищаем через анимацию
  setTimeout(() => {
    particles.value = []
  }, 900)
}
</script>

<template>
  <NuxtLink
    :to="`/student/my-path/${topic.id}`"
    class="island-link group relative inline-flex flex-col items-center focus-visible:outline-none"
    :class="[
      status === 'active' && 'is-active',
      status === 'locked' && 'is-locked'
    ]"
    @click="burst"
  >
    <!-- Pulse-кольцо для active -->
    <div
      v-if="status === 'active'"
      aria-hidden="true"
      class="island-pulse pointer-events-none absolute inset-0 -m-2 rounded-full ring-4 ring-white/80"
    />

    <!-- Сам круглый остров -->

    <!-- Водное кольцо (ореол под островом) -->
    <div
      aria-hidden="true"
      class="island-water pointer-events-none absolute inset-0 rounded-full"
      :class="[
        status === 'active' && 'island-water--active',
        status === 'done' && 'island-water--done'
      ]"
      :style="{ margin: '-14px' }"
    />

    <!-- Sparkle-точки вокруг active-острова -->
    <template v-if="status === 'active'">
      <span
        aria-hidden="true"
        class="island-spark island-spark--1 pointer-events-none absolute"
      >✦</span>
      <span
        aria-hidden="true"
        class="island-spark island-spark--2 pointer-events-none absolute"
      >✦</span>
      <span
        aria-hidden="true"
        class="island-spark island-spark--3 pointer-events-none absolute"
      >✦</span>
    </template>

    <div
      class="island-circle relative flex items-center justify-center rounded-full bg-linear-to-br ring-4 transition-transform duration-200 group-hover:-translate-y-1 group-hover:rotate-2 group-active:translate-y-0 group-focus-visible:ring-offset-2"
      :class="[
        sizeClasses.circle,
        palette.gradient,
        palette.shadow,
        status === 'active' && 'ring-amber-300 ring-[5px]',
        status === 'done' && 'ring-emerald-200 ring-4',
        status === 'locked' && 'ring-white/50 ring-4 grayscale opacity-65',
        'group-focus-visible:ring-white'
      ]"
    >
      <!-- Блик (3D-эффект шара) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-white/30 via-white/10 to-transparent"
      />
      <UIcon
        v-if="status === 'done'"
        name="i-lucide-check"
        class="text-white drop-shadow"
        :class="sizeClasses.icon"
      />
      <UIcon
        v-else-if="status === 'locked'"
        name="i-lucide-lock"
        class="text-white/90 drop-shadow"
        :class="sizeClasses.icon"
      />
      <UIcon
        v-else
        :name="topic.icon"
        class="text-white drop-shadow"
        :class="sizeClasses.icon"
      />

      <!-- Номер темы (бирка) -->
      <span
        class="absolute -top-2 -left-2 flex size-8 items-center justify-center rounded-full bg-white text-sm font-black text-orange-700 ring-2 ring-orange-200 shadow"
      >
        {{ index + 1 }}
      </span>

      <!-- Звёзды mastery -->
      <div
        v-if="stars > 0"
        aria-hidden="true"
        class="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5"
      >
        <span
          v-for="n in 3"
          :key="n"
          class="island-star inline-flex"
          :class="n <= stars ? 'text-amber-400' : 'text-white/40'"
        >
          <UIcon
            name="i-lucide-star"
            class="size-4 drop-shadow"
            :class="n <= stars && 'fill-current'"
          />
        </span>
      </div>

      <!-- Конфетти-частицы при клике -->
      <span
        v-for="p in particles"
        :key="p.id"
        aria-hidden="true"
        class="island-particle pointer-events-none absolute left-1/2 top-1/2 size-2 rounded-sm"
        :style="{
          'backgroundColor': p.color,
          '--dx': `${p.dx}px`,
          '--dy': `${p.dy}px`,
          '--rot': `${p.rot}deg`
        }"
      />
    </div>

    <!-- Подпись -->
    <div
      class="mt-3 max-w-50 rounded-2xl bg-white/92 backdrop-blur px-3 py-2 ring-2 shadow-[0_4px_0_rgb(0_0_0/0.08)]"
      :class="[
        side === 'left' ? 'text-left' : 'text-center',
        status === 'active' ? 'ring-amber-300' : status === 'done' ? 'ring-emerald-200' : 'ring-white/50'
      ]"
    >
      <div class="text-sm font-black leading-tight text-stone-800 line-clamp-2">
        {{ topic.name }}
      </div>
      <div class="mt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-stone-500">
        <span class="inline-flex items-center gap-0.5">
          <UIcon
            name="i-lucide-star"
            class="size-3 text-amber-500"
          />
          {{ topic.totalXp }}
        </span>
        <span>·</span>
        <span>{{ topic.lessonsCount ?? 0 }} {{ t('learningPath.lessonsShort') }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.island-link.is-active .island-circle {
  animation: island-bounce 2.4s ease-in-out infinite;
  will-change: transform;
}

@keyframes island-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.island-pulse {
  animation: island-pulse-ring 2s ease-out infinite;
}

@keyframes island-pulse-ring {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(1.45); opacity: 0; }
}

.island-star {
  animation: island-star-pop 0.6s ease-out backwards;
}
.island-star:nth-child(1) { animation-delay: 0.05s; }
.island-star:nth-child(2) { animation-delay: 0.15s; }
.island-star:nth-child(3) { animation-delay: 0.25s; }

@keyframes island-star-pop {
  0% { transform: scale(0) rotate(-30deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

.island-particle {
  animation: island-particle-burst 0.85s ease-out forwards;
}

@keyframes island-particle-burst {
  0% { transform: translate(-50%, -50%) rotate(0); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot)); opacity: 0; }
}

.island-link.is-locked {
  cursor: not-allowed;
}

/* Водное кольцо */
.island-water--active {
  background: radial-gradient(circle, rgba(251,191,36,0.32) 0%, rgba(251,191,36,0.12) 50%, transparent 70%);
  animation: island-water-pulse 2.8s ease-in-out infinite;
  will-change: transform, opacity;
}
.island-water--done {
  background: radial-gradient(circle, rgba(74,222,128,0.28) 0%, rgba(74,222,128,0.08) 50%, transparent 70%);
}

@keyframes island-water-pulse {
  0%, 100% { transform: scale(1);    opacity: 1;    }
  50%       { transform: scale(1.12); opacity: 0.7; }
}

/* Sparkle-звёздочки */
.island-spark {
  font-size: 11px;
  color: #FDE68A;
  text-shadow: 0 0 6px #FBBF24;
  animation: island-spark-twinkle 2s ease-in-out infinite;
  will-change: opacity, transform;
}
.island-spark--1 { top: -18px; left: 50%; transform: translateX(-50%); animation-delay: 0s;     }
.island-spark--2 { top: 20%;   left: -20px;                             animation-delay: 0.65s;  }
.island-spark--3 { top: 20%;   right: -20px;                            animation-delay: 1.3s;   }

@keyframes island-spark-twinkle {
  0%, 100% { opacity: 0;   transform: scale(0.5);  }
  50%       { opacity: 1;  transform: scale(1.15); }
}

@media (prefers-reduced-motion: reduce) {
  .island-link.is-active .island-circle,
  .island-pulse,
  .island-star,
  .island-particle,
  .island-water--active,
  .island-spark {
    animation: none !important;
  }
}
</style>
