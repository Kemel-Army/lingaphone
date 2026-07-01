<script setup lang="ts">
/**
 * AdventureChest — финальный сундук с наградой в конце карты приключений.
 *
 * Состояния:
 *   - locked: серый, закрытый, замочек, подсказка «Пройди все темы»
 *   - ready:  золотой, мерцает, hover открывает крышку
 *   - opened: открытый, лучи света, конфетти-выброс при первом показе
 */
const props = withDefaults(defineProps<{
  /** Сколько тем пройдено / всего */
  completed: number
  total: number
  /** Сумма XP за всю карту — показывается как награда. */
  rewardXp: number
}>(), {})

const status = computed<'locked' | 'ready' | 'opened'>(() => {
  if (props.total === 0) return 'locked'
  if (props.completed >= props.total) return 'opened'
  return 'locked'
})

const remaining = computed(() => Math.max(0, props.total - props.completed))

// Конфетти при открытии (один раз при mount, если уже opened)
type Particle = { id: number, dx: number, dy: number, color: string, rot: number }
const particles = ref<Particle[]>([])
let seq = 0
const COLORS = ['#FBBF24', '#F472B6', '#34D399', '#60A5FA', '#A78BFA', '#FB923C', '#FFFFFF']

const burst = () => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const next: Particle[] = []
  for (let i = 0; i < 24; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
    const distance = 80 + Math.random() * 80
    next.push({
      id: ++seq,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#FBBF24',
      rot: Math.random() * 360
    })
  }
  particles.value = next
  setTimeout(() => {
    particles.value = []
  }, 1400)
}

onMounted(() => {
  if (status.value === 'opened') burst()
})
</script>

<template>
  <div class="relative flex flex-col items-center">
    <!-- Лучи света для opened -->
    <div
      v-if="status === 'opened'"
      aria-hidden="true"
      class="chest-rays pointer-events-none absolute inset-0 -m-12"
    >
      <svg
        viewBox="0 0 200 200"
        class="size-full"
      >
        <g transform="translate(100,100)">
          <polygon
            v-for="r in 12"
            :key="r"
            :points="'0,-90 8,0 -8,0'"
            fill="rgb(253 224 71 / 0.6)"
            :transform="`rotate(${(r - 1) * 30})`"
          />
        </g>
      </svg>
    </div>

    <!-- Контейнер сундука -->
    <button
      type="button"
      class="chest-button relative flex flex-col items-center gap-2 rounded-3xl bg-white/85 backdrop-blur px-6 py-5 ring-4 ring-white shadow-[0_6px_0_rgb(0_0_0/0.08)] transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed"
      :disabled="status !== 'opened'"
      @click="burst"
    >
      <!-- Сам сундук (SVG) -->
      <div
        class="chest-art relative size-20"
        :class="{
          'chest-shake': status === 'ready',
          'chest-open': status === 'opened',
          'chest-locked': status === 'locked'
        }"
      >
        <svg
          viewBox="0 0 80 80"
          class="size-full drop-shadow"
        >
          <!-- Тело сундука -->
          <rect
            x="10"
            y="32"
            width="60"
            height="38"
            rx="6"
            :fill="status === 'locked' ? '#A8A29E' : '#B45309'"
          />
          <!-- Полосы железа -->
          <rect
            x="10"
            y="44"
            width="60"
            height="3"
            :fill="status === 'locked' ? '#78716C' : '#78350F'"
          />
          <rect
            x="36"
            y="32"
            width="8"
            height="38"
            :fill="status === 'locked' ? '#78716C' : '#78350F'"
          />
          <!-- Замок -->
          <circle
            cx="40"
            cy="50"
            r="4"
            :fill="status === 'opened' ? '#FACC15' : '#FEF3C7'"
          />

          <!-- Крышка -->
          <g
            class="chest-lid"
            style="transform-origin: 40px 32px;"
          >
            <path
              d="M10 32 Q10 16 40 16 Q70 16 70 32 Z"
              :fill="status === 'locked' ? '#A8A29E' : '#D97706'"
            />
            <path
              d="M10 32 Q10 18 40 18 Q70 18 70 32"
              fill="none"
              :stroke="status === 'locked' ? '#78716C' : '#78350F'"
              stroke-width="2"
            />
          </g>

          <!-- Звезда вылетает (opened) -->
          <g
            v-if="status === 'opened'"
            class="chest-star"
          >
            <polygon
              points="40,8 43,16 51,16 45,21 47,29 40,24 33,29 35,21 29,16 37,16"
              fill="#FACC15"
              stroke="#F59E0B"
              stroke-width="0.8"
            />
          </g>
        </svg>

        <!-- Замочек поверх -->
        <UIcon
          v-if="status === 'locked'"
          name="i-lucide-lock"
          class="absolute right-0 bottom-0 size-6 rounded-full bg-white p-1 text-stone-600 ring-2 ring-stone-200 shadow"
        />
      </div>

      <!-- Текст -->
      <div class="text-center">
        <div
          class="text-base font-black"
          :class="status === 'opened' ? 'text-amber-600' : 'text-stone-700'"
        >
          <template v-if="status === 'opened'">
            Сундук открыт!
          </template>
          <template v-else-if="status === 'locked'">
            Заперто
          </template>
        </div>
        <div class="mt-0.5 text-xs font-bold text-stone-500">
          <template v-if="status === 'opened'">
            Награда: +{{ rewardXp }} XP ⭐
          </template>
          <template v-else>
            Осталось пройти: {{ remaining }} тем
          </template>
        </div>
      </div>

      <!-- Конфетти -->
      <span
        v-for="p in particles"
        :key="p.id"
        aria-hidden="true"
        class="chest-particle pointer-events-none absolute left-1/2 top-1/3 size-2 rounded-sm"
        :style="{
          'backgroundColor': p.color,
          '--dx': `${p.dx}px`,
          '--dy': `${p.dy}px`,
          '--rot': `${p.rot}deg`
        }"
      />
    </button>
  </div>
</template>

<style scoped>
.chest-shake {
  animation: chest-shake 2.4s ease-in-out infinite;
  transform-origin: 50% 80%;
}

@keyframes chest-shake {
  0%, 92%, 100% { transform: rotate(0); }
  94% { transform: rotate(-3deg); }
  96% { transform: rotate(3deg); }
  98% { transform: rotate(-2deg); }
}

.chest-open .chest-lid {
  animation: chest-lid-open 0.7s ease-out forwards;
}
@keyframes chest-lid-open {
  0% { transform: rotate(0); }
  100% { transform: rotate(-55deg); }
}

.chest-open .chest-star {
  animation: chest-star-fly 1.2s ease-out forwards;
  transform-origin: 40px 18px;
}
@keyframes chest-star-fly {
  0% { transform: translateY(0) scale(0.4); opacity: 0; }
  30% { transform: translateY(-6px) scale(1); opacity: 1; }
  100% { transform: translateY(-26px) scale(1.2); opacity: 0; }
}

.chest-rays {
  animation: chest-rays-spin 18s linear infinite;
}
@keyframes chest-rays-spin {
  to { transform: rotate(360deg); }
}

.chest-particle {
  animation: chest-particle-burst 1.3s ease-out forwards;
}
@keyframes chest-particle-burst {
  0% { transform: translate(-50%, -50%) rotate(0); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot)); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .chest-shake,
  .chest-open .chest-lid,
  .chest-open .chest-star,
  .chest-rays,
  .chest-particle {
    animation: none !important;
  }
}
</style>
