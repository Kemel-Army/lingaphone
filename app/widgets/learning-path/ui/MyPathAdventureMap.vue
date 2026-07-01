<script setup lang="ts">
/**
 * MyPathAdventureMap — детская «карта приключений» для /student/my-path.
 *
 * Аудитория: ученики 1–6 класс. Метафора: путешествие Феми по карте —
 * небо с облаками, извилистая тропа, темы в виде круглых «островов».
 *
 * Композиция (FSD):
 *   - <PathTrailSegment> — SVG-кривая, соединяющая острова
 *   - <PathTopicIsland> — отдельный остров (3 статуса, звёзды, конфетти)
 *   - <AdventureChest>  — финальный сундук
 *   - <DailyQuestCard>  — задание дня от Феми
 *   - <FemiMascot>      — маскот в hero и на тропе
 *
 * Острова позиционируются абсолютно по zig-zag сетке, чтобы тропа
 * могла плавно их соединять. Уважает prefers-reduced-motion.
 */
import type { PathTopic } from '~/entities/learning-path'
import {
  PathTopicIsland,
  PathTrailSegment,
  useLearningPath
} from '~/entities/learning-path'
import AdventureChest from './AdventureChest.vue'
import DailyQuestCard from './DailyQuestCard.vue'

type AgeTier = 'junior' | 'middle' | 'senior'

const props = withDefaults(defineProps<{
  topics: PathTopic[]
  grade?: number | null
  studentName?: string | null
  /** Возрастная адаптация UI: junior (1–2), middle (3–4), senior (5–6). */
  ageTier?: AgeTier
}>(), {
  ageTier: 'middle'
})

const { computeOverallStats } = useLearningPath()

// ──────────────────────────────────────────────────────────────────────
// Stats & mascot
// ──────────────────────────────────────────────────────────────────────
const stats = computed(() => computeOverallStats(props.topics))

const firstName = computed(() => props.studentName ?? 'друг')

const mascotLine = computed(() => {
  const p = stats.value.overallProgress
  if (p === 0) return `Привет, ${firstName.value}! Готов к приключению?`
  if (p < 30) return `Отличный старт, ${firstName.value}! Идём дальше!`
  if (p < 70) return `Ого, ${firstName.value}! Уже половина пути!`
  if (p < 100) return `Финиш близко, ${firstName.value}!`
  return `${firstName.value}, ты герой! Карта пройдена!`
})

const mascotState = computed(() => {
  const p = stats.value.overallProgress
  if (p === 0) return 'greet' as const
  if (p < 70) return 'teach' as const
  if (p < 100) return 'think' as const
  return 'celebrate' as const
})

const gradeTitle = computed(() => (props.grade != null ? `${props.grade} класс` : 'Математика'))

// ──────────────────────────────────────────────────────────────────────
// Topic palette → 2-цветный градиент. Tailwind-safe (статические классы).
// ──────────────────────────────────────────────────────────────────────
type IslandPalette = { gradient: string, shadow: string }

const PALETTE: Record<string, IslandPalette> = {
  green: { gradient: 'from-green-400 to-emerald-500', shadow: 'shadow-[0_8px_0_rgb(22_163_74/0.55)]' },
  emerald: { gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-[0_8px_0_rgb(16_185_129/0.55)]' },
  amber: { gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-[0_8px_0_rgb(245_158_11/0.55)]' },
  orange: { gradient: 'from-orange-400 to-rose-500', shadow: 'shadow-[0_8px_0_rgb(249_115_22/0.55)]' },
  rose: { gradient: 'from-rose-400 to-pink-500', shadow: 'shadow-[0_8px_0_rgb(244_63_94/0.55)]' },
  pink: { gradient: 'from-pink-400 to-fuchsia-500', shadow: 'shadow-[0_8px_0_rgb(236_72_153/0.55)]' },
  violet: { gradient: 'from-violet-400 to-purple-500', shadow: 'shadow-[0_8px_0_rgb(139_92_246/0.55)]' },
  sky: { gradient: 'from-sky-400 to-blue-500', shadow: 'shadow-[0_8px_0_rgb(14_165_233/0.55)]' },
  cyan: { gradient: 'from-cyan-400 to-sky-500', shadow: 'shadow-[0_8px_0_rgb(6_182_212/0.55)]' },
  yellow: { gradient: 'from-yellow-400 to-amber-500', shadow: 'shadow-[0_8px_0_rgb(234_179_8/0.55)]' }
}

const paletteFor = (color: string): IslandPalette => PALETTE[color] ?? PALETTE.rose!

// ──────────────────────────────────────────────────────────────────────
// Адаптация по возрасту: размер острова + шаг по вертикали.
// junior — крупнее всё, больше пространства; senior — компактнее.
// ──────────────────────────────────────────────────────────────────────
const layout = computed(() => {
  switch (props.ageTier) {
    case 'junior':
      return { rowHeight: 250, topPad: 90, islandSize: 'md' as const }
    case 'senior':
      return { rowHeight: 190, topPad: 70, islandSize: 'sm' as const }
    case 'middle':
    default:
      return { rowHeight: 220, topPad: 80, islandSize: 'md' as const }
  }
})

const X_LEFT = 26
const X_RIGHT = 64

// ──────────────────────────────────────────────────────────────────────
// Острова: статус, координаты, палитра.
// ──────────────────────────────────────────────────────────────────────
type IslandStatus = 'done' | 'active' | 'locked'

const islands = computed(() => {
  const { topPad, rowHeight } = layout.value
  return props.topics.map((topic, idx) => {
    const progress = topic.progress ?? 0
    // Все топики открыты: завершённые показываем как done, остальные — active.
    const status: IslandStatus = progress >= 100 ? 'done' : 'active'
    const isLeft = idx % 2 === 0
    return {
      topic,
      index: idx,
      status,
      side: isLeft ? ('left' as const) : ('right' as const),
      x: isLeft ? X_LEFT : X_RIGHT,
      y: topPad + idx * rowHeight,
      palette: paletteFor(topic.color)
    }
  })
})

const mapHeight = computed(() => {
  const { topPad, rowHeight } = layout.value
  if (islands.value.length === 0) return 400
  return topPad + islands.value.length * rowHeight + 180
})

const trailPoints = computed(() => islands.value.map(i => ({
  x: i.x,
  y: i.y,
  status: i.status
})))

const activeIsland = computed(() => islands.value.find(i => i.status === 'active') ?? null)

const completedCount = computed(() => islands.value.filter(i => i.status === 'done').length)

// ──────────────────────────────────────────────────────────────────────
// Daily quest
// ──────────────────────────────────────────────────────────────────────
const showQuest = ref(true)

const dailyQuest = computed(() => {
  if (activeIsland.value) {
    return {
      title: `Открой остров «${activeIsland.value.topic.name}»`,
      description: 'Пройди 1 урок сегодня и получи бонус-звезду!',
      icon: 'i-lucide-target',
      rewardXp: 30
    }
  }
  return {
    title: 'Все темы пройдены!',
    description: 'Ты молодец. Жди новых тем от учителя!',
    icon: 'i-lucide-trophy',
    rewardXp: 0
  }
})

// ──────────────────────────────────────────────────────────────────────
// Облака (фиксированные позиции)
// ──────────────────────────────────────────────────────────────────────
const clouds = [
  { top: '8%', left: '4%', size: 70, delay: '0s', duration: '14s' },
  { top: '20%', left: '78%', size: 90, delay: '-3s', duration: '18s' },
  { top: '38%', left: '12%', size: 60, delay: '-7s', duration: '16s' },
  { top: '58%', left: '82%', size: 80, delay: '-2s', duration: '20s' },
  { top: '78%', left: '6%', size: 70, delay: '-5s', duration: '17s' }
]

// Позиция Феми у активного острова — смещение в сторону тропы
const femiPos = computed(() => {
  if (!activeIsland.value) return null
  const dx = activeIsland.value.side === 'left' ? 14 : -14
  return {
    left: `${activeIsland.value.x + dx}%`,
    top: `${activeIsland.value.y - 80}px`
  }
})

// Позиция сундука на финише
const chestTop = computed(() => {
  const { topPad, rowHeight } = layout.value
  return topPad + islands.value.length * rowHeight + 30
})

// ──────────────────────────────────────────────────────────────────────
// Декор леса: деревья, кусты, грибы, цветы, камни.
// variant: round | pine | oak | bush | mushroom | flower | rock
// ──────────────────────────────────────────────────────────────────────
const MAP_DECOR = [
  { left: '0.5%', top: '3%', scale: 0.92, variant: 'pine', swayDelay: '0s' },
  { left: '4%', top: '6%', scale: 0.78, variant: 'round', swayDelay: '-1.2s' },
  { left: '1%', top: '14%', scale: 0.70, variant: 'bush', swayDelay: '-0.4s' },
  { left: '0.5%', top: '20%', scale: 0.86, variant: 'oak', swayDelay: '-2.1s' },
  { left: '5%', top: '26%', scale: 0.62, variant: 'mushroom', swayDelay: '0s' },
  { left: '1.5%', top: '32%', scale: 0.84, variant: 'pine', swayDelay: '-1.6s' },
  { left: '4.5%', top: '38%', scale: 0.72, variant: 'flower', swayDelay: '-0.8s' },
  { left: '0%', top: '44%', scale: 0.94, variant: 'round', swayDelay: '-2.8s' },
  { left: '5%', top: '52%', scale: 0.60, variant: 'rock', swayDelay: '0s' },
  { left: '1%', top: '58%', scale: 0.80, variant: 'oak', swayDelay: '-1.1s' },
  { left: '4%', top: '66%', scale: 0.74, variant: 'bush', swayDelay: '-3.2s' },
  { left: '0.5%', top: '72%', scale: 0.88, variant: 'pine', swayDelay: '-0.6s' },
  { left: '5%', top: '80%', scale: 0.66, variant: 'mushroom', swayDelay: '0s' },
  { left: '1%', top: '86%', scale: 0.82, variant: 'round', swayDelay: '-1.9s' },
  { left: '4.5%', top: '93%', scale: 0.76, variant: 'flower', swayDelay: '-2.4s' },
  { left: '94%', top: '4%', scale: 0.86, variant: 'oak', swayDelay: '-0.7s' },
  { left: '90%', top: '10%', scale: 0.70, variant: 'flower', swayDelay: '-2.3s' },
  { left: '94.5%', top: '17%', scale: 0.92, variant: 'pine', swayDelay: '-1.4s' },
  { left: '91%', top: '24%', scale: 0.64, variant: 'mushroom', swayDelay: '0s' },
  { left: '94%', top: '30%', scale: 0.80, variant: 'round', swayDelay: '-2.7s' },
  { left: '90.5%', top: '38%', scale: 0.74, variant: 'bush', swayDelay: '-0.9s' },
  { left: '94.5%', top: '46%', scale: 0.88, variant: 'pine', swayDelay: '-1.7s' },
  { left: '91%', top: '53%', scale: 0.68, variant: 'rock', swayDelay: '0s' },
  { left: '94%', top: '60%', scale: 0.94, variant: 'oak', swayDelay: '-3.1s' },
  { left: '90.5%', top: '68%', scale: 0.62, variant: 'mushroom', swayDelay: '0s' },
  { left: '94.5%', top: '75%', scale: 0.78, variant: 'round', swayDelay: '-1.3s' },
  { left: '91%', top: '82%', scale: 0.84, variant: 'pine', swayDelay: '-2.5s' },
  { left: '94%', top: '90%', scale: 0.72, variant: 'bush', swayDelay: '-0.5s' },
  { left: '12%', top: '2%', scale: 0.52, variant: 'pine', swayDelay: '-1s' },
  { left: '85%', top: '2%', scale: 0.48, variant: 'round', swayDelay: '-2s' },
  { left: '15%', top: '95%', scale: 0.55, variant: 'oak', swayDelay: '-1.5s' },
  { left: '82%', top: '96%', scale: 0.50, variant: 'pine', swayDelay: '-3s' }
]

const MAP_CLOUDS = [
  { top: '4%', left: '20%', size: 88, delay: '0s', duration: '32s' },
  { top: '10%', left: '60%', size: 110, delay: '-12s', duration: '40s' },
  { top: '48%', left: '15%', size: 72, delay: '-20s', duration: '28s' },
  { top: '70%', left: '70%', size: 95, delay: '-6s', duration: '36s' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- ═══════════════════════════════════════════════════════════════
         HERO
         ═══════════════════════════════════════════════════════════════ -->
    <section
      class="relative overflow-hidden rounded-4xl p-6 sm:p-8"
      :style="{
        background: 'linear-gradient(180deg, #BAE6FD 0%, #FED7AA 60%, #FDE68A 100%)'
      }"
    >
      <!-- Солнце -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-6 -right-6 size-32 rounded-full bg-yellow-300 blur-2xl opacity-70"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute top-4 right-8 size-20 rounded-full bg-yellow-200 ring-8 ring-yellow-300/40"
      />

      <!-- Облака -->
      <div
        v-for="(cloud, i) in clouds"
        :key="`hero-cloud-${i}`"
        aria-hidden="true"
        class="adventure-cloud pointer-events-none absolute"
        :style="{
          top: cloud.top,
          left: cloud.left,
          width: `${cloud.size}px`,
          height: `${cloud.size * 0.6}px`,
          animationDelay: cloud.delay,
          animationDuration: cloud.duration
        }"
      >
        <svg
          viewBox="0 0 100 60"
          class="size-full text-white drop-shadow-md"
        >
          <path
            d="M20 45 Q5 45 8 32 Q5 18 22 20 Q28 8 45 12 Q55 4 68 14 Q88 12 88 30 Q98 35 90 48 Q85 55 70 50 L30 50 Q22 52 20 45 Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
      </div>

      <div class="relative grid gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div class="shrink-0">
          <FemiMascot
            :state="mascotState"
            size="xl"
            :line="mascotLine"
          />
        </div>

        <div class="flex-1">
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700 backdrop-blur ring-2 ring-white">
            <UIcon
              name="i-lucide-map"
              class="size-3.5"
            />
            Карта приключений · {{ gradeTitle }}
          </div>
          <h1 class="text-3xl sm:text-5xl font-black text-orange-900 drop-shadow-sm">
            Привет, {{ firstName }}!
          </h1>
          <p class="mt-2 max-w-lg text-sm sm:text-base font-semibold text-orange-900/80">
            Прыгай по островам, открывай темы и собирай звёздочки вместе с Феми ⭐
          </p>
        </div>

        <!-- Daily quest -->
        <div
          v-if="showQuest"
          class="w-full sm:w-72"
        >
          <DailyQuestCard
            :title="dailyQuest.title"
            :description="dailyQuest.description"
            :icon="dailyQuest.icon"
            :reward-xp="dailyQuest.rewardXp"
            @close="showQuest = false"
          />
        </div>
      </div>

      <!-- Stats strip -->
      <div class="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl bg-white/85 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-orange-700 text-[10px] font-black uppercase tracking-wider">
            <span>Прогресс</span>
            <UIcon
              name="i-lucide-trending-up"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-orange-900 tabular-nums">
            {{ stats.overallProgress }}<span class="text-base">%</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white/85 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-sky-700 text-[10px] font-black uppercase tracking-wider">
            <span>Уроков</span>
            <UIcon
              name="i-lucide-book-open"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-sky-900 tabular-nums">
            {{ stats.completedLessons }}<span class="text-base text-sky-500">/{{ stats.totalLessons }}</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white/85 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-amber-700 text-[10px] font-black uppercase tracking-wider">
            <span>XP</span>
            <UIcon
              name="i-lucide-star"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-amber-900 tabular-nums">
            {{ stats.totalXp }}
          </div>
        </div>

        <div class="rounded-2xl bg-white/85 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-violet-700 text-[10px] font-black uppercase tracking-wider">
            <span>Островов</span>
            <UIcon
              name="i-lucide-layers"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-violet-900 tabular-nums">
            {{ topics.length }}
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         КАРТА — Лесная RPG
         ═══════════════════════════════════════════════════════════════ -->
    <section
      v-if="islands.length"
      class="relative overflow-hidden rounded-4xl px-2 py-6 sm:px-4"
      :style="{
        background: 'linear-gradient(175deg, #ECFDF5 0%, #D1FAE5 15%, #A7F3D0 45%, #34D399 78%, #059669 100%)'
      }"
    >
      <!-- Трава: SVG точечный паттерн (органическая текстура) -->
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 size-full"
        style="opacity:0.045;"
      >
        <defs>
          <pattern
            id="map-grass-dots"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="4"
              cy="14"
              r="1.8"
              fill="#064E3B"
            />
            <circle
              cx="15"
              cy="6"
              r="1.2"
              fill="#064E3B"
            />
            <circle
              cx="23"
              cy="21"
              r="1.5"
              fill="#064E3B"
            />
            <circle
              cx="10"
              cy="24"
              r="1.0"
              fill="#064E3B"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#map-grass-dots)"
        />
      </svg>

      <!-- Небесная дымка сверху -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-emerald-50/55 to-transparent"
      />

      <!-- Туман «неизведанного» снизу -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-emerald-900/20 to-transparent"
      />

      <!-- Холмы (SVG, два слоя) -->
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 w-full"
        style="height:88px;"
        viewBox="0 0 400 55"
        preserveAspectRatio="none"
      >
        <path
          d="M0 55 Q45 18 90 34 Q140 8 195 28 Q252 12 307 32 Q356 10 400 25 L400 55 Z"
          fill="#065F46"
          opacity="0.24"
        />
        <path
          d="M0 55 Q75 28 150 43 Q222 20 292 40 Q352 22 400 38 L400 55 Z"
          fill="#064E3B"
          opacity="0.17"
        />
      </svg>

      <!-- Облака над лесом -->
      <div
        v-for="(cloud, ci) in MAP_CLOUDS"
        :key="`map-cloud-${ci}`"
        aria-hidden="true"
        class="map-cloud pointer-events-none absolute"
        :style="{
          top: cloud.top,
          left: cloud.left,
          width: `${cloud.size}px`,
          height: `${cloud.size * 0.55}px`,
          animationDelay: cloud.delay,
          animationDuration: cloud.duration
        }"
      >
        <svg
          viewBox="0 0 100 60"
          class="size-full text-white drop-shadow-[0_4px_8px_rgb(6_95_70/0.18)]"
        >
          <path
            d="M20 45 Q5 45 8 32 Q5 18 22 20 Q28 8 45 12 Q55 4 68 14 Q88 12 88 30 Q98 35 90 48 Q85 55 70 50 L30 50 Q22 52 20 45 Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      </div>

      <!-- Cartoon-птички (4 шт) -->
      <div
        aria-hidden="true"
        class="map-bird pointer-events-none absolute"
        style="top:6%; animation-duration:38s; animation-delay:-4s;"
      >
        <svg
          width="32"
          height="22"
          viewBox="0 0 32 22"
          fill="none"
        >
          <ellipse
            cx="16"
            cy="20"
            rx="8"
            ry="1.2"
            fill="#000"
            opacity="0.08"
          />
          <ellipse
            cx="14"
            cy="13"
            rx="9"
            ry="6"
            fill="#3B82F6"
          />
          <circle
            cx="22"
            cy="10"
            r="4.5"
            fill="#3B82F6"
          />
          <polygon
            points="26,9 30,10 26,11"
            fill="#F59E0B"
          />
          <circle
            cx="23"
            cy="9"
            r="1"
            fill="#fff"
          />
          <circle
            cx="23.3"
            cy="9.2"
            r="0.5"
            fill="#000"
          />
          <path
            class="bird-wing"
            d="M8 11 Q12 3 18 9 Q14 13 8 11 Z"
            fill="#1D4ED8"
          />
          <polygon
            points="5,12 0,10 0,15 5,15"
            fill="#1D4ED8"
          />
        </svg>
      </div>

      <div
        aria-hidden="true"
        class="map-bird pointer-events-none absolute"
        style="top:18%; animation-duration:29s; animation-delay:-15s;"
      >
        <svg
          width="26"
          height="18"
          viewBox="0 0 32 22"
          fill="none"
        >
          <ellipse
            cx="14"
            cy="13"
            rx="9"
            ry="6"
            fill="#EF4444"
          />
          <circle
            cx="22"
            cy="10"
            r="4.5"
            fill="#EF4444"
          />
          <polygon
            points="26,9 30,10 26,11"
            fill="#FBBF24"
          />
          <circle
            cx="23"
            cy="9"
            r="1"
            fill="#fff"
          />
          <circle
            cx="23.3"
            cy="9.2"
            r="0.5"
            fill="#000"
          />
          <path
            class="bird-wing"
            d="M8 11 Q12 3 18 9 Q14 13 8 11 Z"
            fill="#B91C1C"
            style="animation-delay:-0.3s;"
          />
          <polygon
            points="5,12 0,10 0,15 5,15"
            fill="#B91C1C"
          />
        </svg>
      </div>

      <div
        aria-hidden="true"
        class="map-bird pointer-events-none absolute"
        style="top:42%; animation-duration:44s; animation-delay:-22s;"
      >
        <svg
          width="36"
          height="24"
          viewBox="0 0 32 22"
          fill="none"
        >
          <ellipse
            cx="14"
            cy="13"
            rx="9"
            ry="6"
            fill="#FACC15"
          />
          <circle
            cx="22"
            cy="10"
            r="4.5"
            fill="#FACC15"
          />
          <polygon
            points="26,9 30,10 26,11"
            fill="#EA580C"
          />
          <circle
            cx="23"
            cy="9"
            r="1"
            fill="#fff"
          />
          <circle
            cx="23.3"
            cy="9.2"
            r="0.5"
            fill="#000"
          />
          <path
            class="bird-wing"
            d="M8 11 Q12 3 18 9 Q14 13 8 11 Z"
            fill="#CA8A04"
            style="animation-delay:-0.6s;"
          />
          <polygon
            points="5,12 0,10 0,15 5,15"
            fill="#CA8A04"
          />
        </svg>
      </div>

      <div
        aria-hidden="true"
        class="map-bird pointer-events-none absolute"
        style="top:64%; animation-duration:33s; animation-delay:-9s;"
      >
        <svg
          width="24"
          height="16"
          viewBox="0 0 32 22"
          fill="none"
        >
          <ellipse
            cx="14"
            cy="13"
            rx="9"
            ry="6"
            fill="#A855F7"
          />
          <circle
            cx="22"
            cy="10"
            r="4.5"
            fill="#A855F7"
          />
          <polygon
            points="26,9 30,10 26,11"
            fill="#FB923C"
          />
          <circle
            cx="23"
            cy="9"
            r="1"
            fill="#fff"
          />
          <circle
            cx="23.3"
            cy="9.2"
            r="0.5"
            fill="#000"
          />
          <path
            class="bird-wing"
            d="M8 11 Q12 3 18 9 Q14 13 8 11 Z"
            fill="#7E22CE"
            style="animation-delay:-0.9s;"
          />
          <polygon
            points="5,12 0,10 0,15 5,15"
            fill="#7E22CE"
          />
        </svg>
      </div>

      <!-- Декор леса: 7 вариантов (скрыто на xs) -->
      <div
        v-for="(deco, di) in MAP_DECOR"
        :key="`decor-${di}`"
        aria-hidden="true"
        class="pointer-events-none absolute hidden sm:block"
        :style="{
          left: deco.left,
          top: deco.top,
          transformOrigin: 'bottom center',
          transform: `scale(${deco.scale})`,
          zIndex: 0
        }"
      >
        <div
          class="map-tree"
          :style="{ '--sway-delay': deco.swayDelay }"
        >
          <svg
            v-if="deco.variant === 'round'"
            width="48"
            height="64"
            viewBox="0 0 48 64"
            fill="none"
          >
            <ellipse
              cx="24"
              cy="61"
              rx="11"
              ry="3"
              fill="#000"
              opacity="0.1"
            />
            <rect
              x="21"
              y="40"
              width="7"
              height="21"
              rx="3"
              fill="#7C2D12"
            />
            <rect
              x="21"
              y="40"
              width="2.5"
              height="21"
              fill="#9A3412"
              opacity="0.5"
            />
            <circle
              cx="24"
              cy="28"
              r="19"
              fill="#14532D"
            />
            <circle
              cx="16"
              cy="32"
              r="14"
              fill="#15803D"
            />
            <circle
              cx="32"
              cy="29"
              r="13"
              fill="#16A34A"
            />
            <circle
              cx="24"
              cy="20"
              r="15"
              fill="#22C55E"
            />
            <circle
              cx="20"
              cy="14"
              r="7"
              fill="#86EFAC"
              opacity="0.55"
            />
            <circle
              cx="29"
              cy="22"
              r="3.5"
              fill="#4ADE80"
              opacity="0.4"
            />
          </svg>

          <svg
            v-else-if="deco.variant === 'oak'"
            width="56"
            height="66"
            viewBox="0 0 56 66"
            fill="none"
          >
            <ellipse
              cx="28"
              cy="63"
              rx="13"
              ry="3"
              fill="#000"
              opacity="0.1"
            />
            <rect
              x="24"
              y="42"
              width="8"
              height="21"
              rx="3"
              fill="#78350F"
            />
            <rect
              x="24"
              y="42"
              width="3"
              height="21"
              fill="#92400E"
              opacity="0.55"
            />
            <circle
              cx="28"
              cy="30"
              r="22"
              fill="#14532D"
            />
            <circle
              cx="14"
              cy="32"
              r="14"
              fill="#16A34A"
            />
            <circle
              cx="42"
              cy="30"
              r="14"
              fill="#15803D"
            />
            <circle
              cx="28"
              cy="18"
              r="15"
              fill="#22C55E"
            />
            <circle
              cx="22"
              cy="14"
              r="7"
              fill="#86EFAC"
              opacity="0.6"
            />
            <circle
              cx="36"
              cy="20"
              r="5"
              fill="#4ADE80"
              opacity="0.5"
            />
          </svg>

          <svg
            v-else-if="deco.variant === 'pine'"
            width="42"
            height="68"
            viewBox="0 0 42 68"
            fill="none"
          >
            <ellipse
              cx="21"
              cy="65"
              rx="9"
              ry="3"
              fill="#000"
              opacity="0.1"
            />
            <rect
              x="18"
              y="52"
              width="6"
              height="13"
              rx="2"
              fill="#78350F"
            />
            <polygon
              points="3,52 39,52 21,34"
              fill="#14532D"
            />
            <polygon
              points="6,38 36,38 21,20"
              fill="#15803D"
            />
            <polygon
              points="10,26 32,26 21,10"
              fill="#16A34A"
            />
            <polygon
              points="13,18 29,18 21,6"
              fill="#22C55E"
            />
            <polygon
              points="15,14 27,14 21,7"
              fill="#86EFAC"
              opacity="0.5"
            />
            <polygon
              points="6,52 39,52 36,49 9,49"
              fill="#fff"
              opacity="0.18"
            />
            <polygon
              points="10,38 36,38 33,35 13,35"
              fill="#fff"
              opacity="0.18"
            />
          </svg>

          <svg
            v-else-if="deco.variant === 'bush'"
            width="42"
            height="32"
            viewBox="0 0 42 32"
            fill="none"
          >
            <ellipse
              cx="21"
              cy="29"
              rx="14"
              ry="2"
              fill="#000"
              opacity="0.1"
            />
            <circle
              cx="11"
              cy="22"
              r="9"
              fill="#15803D"
            />
            <circle
              cx="30"
              cy="22"
              r="9"
              fill="#16A34A"
            />
            <circle
              cx="21"
              cy="17"
              r="11"
              fill="#22C55E"
            />
            <circle
              cx="16"
              cy="14"
              r="4"
              fill="#86EFAC"
              opacity="0.55"
            />
            <circle
              cx="14"
              cy="20"
              r="1.5"
              fill="#DC2626"
            />
            <circle
              cx="26"
              cy="18"
              r="1.5"
              fill="#DC2626"
            />
            <circle
              cx="22"
              cy="22"
              r="1.5"
              fill="#DC2626"
            />
          </svg>

          <svg
            v-else-if="deco.variant === 'mushroom'"
            width="36"
            height="32"
            viewBox="0 0 36 32"
            fill="none"
          >
            <defs>
              <radialGradient
                id="mush-gloss"
                cx="0.3"
                cy="0.2"
              >
                <stop
                  offset="0%"
                  stop-color="#fff"
                  stop-opacity="0.8"
                />
                <stop
                  offset="100%"
                  stop-color="#fff"
                  stop-opacity="0"
                />
              </radialGradient>
            </defs>
            <ellipse
              cx="18"
              cy="29"
              rx="13"
              ry="2"
              fill="#000"
              opacity="0.1"
            />
            <rect
              x="9"
              y="20"
              width="6"
              height="9"
              rx="2"
              fill="#FAFAF9"
            />
            <ellipse
              cx="12"
              cy="20"
              rx="10"
              ry="7"
              fill="#DC2626"
            />
            <ellipse
              cx="12"
              cy="20"
              rx="10"
              ry="7"
              fill="url(#mush-gloss)"
              opacity="0.4"
            />
            <circle
              cx="8"
              cy="18"
              r="1.4"
              fill="#fff"
            />
            <circle
              cx="14"
              cy="16"
              r="1.6"
              fill="#fff"
            />
            <circle
              cx="16"
              cy="22"
              r="1.2"
              fill="#fff"
            />
            <rect
              x="22"
              y="24"
              width="4"
              height="6"
              rx="1.5"
              fill="#FAFAF9"
            />
            <ellipse
              cx="24"
              cy="24"
              rx="6"
              ry="4"
              fill="#EA580C"
            />
            <circle
              cx="22"
              cy="23"
              r="1"
              fill="#fff"
            />
            <circle
              cx="26"
              cy="25"
              r="0.9"
              fill="#fff"
            />
          </svg>

          <svg
            v-else-if="deco.variant === 'flower'"
            width="40"
            height="34"
            viewBox="0 0 40 34"
            fill="none"
          >
            <ellipse
              cx="20"
              cy="31"
              rx="13"
              ry="2"
              fill="#000"
              opacity="0.08"
            />
            <path
              d="M10 31 Q12 22 14 14"
              stroke="#15803D"
              stroke-width="1.6"
              stroke-linecap="round"
              fill="none"
            />
            <path
              d="M20 31 Q20 22 20 12"
              stroke="#15803D"
              stroke-width="1.6"
              stroke-linecap="round"
              fill="none"
            />
            <path
              d="M30 31 Q28 22 26 14"
              stroke="#15803D"
              stroke-width="1.6"
              stroke-linecap="round"
              fill="none"
            />
            <ellipse
              cx="13"
              cy="23"
              rx="3"
              ry="1.5"
              fill="#16A34A"
              transform="rotate(-30 13 23)"
            />
            <ellipse
              cx="27"
              cy="23"
              rx="3"
              ry="1.5"
              fill="#16A34A"
              transform="rotate(30 27 23)"
            />
            <circle
              cx="14"
              cy="14"
              r="2.5"
              fill="#EC4899"
            />
            <circle
              cx="11"
              cy="13"
              r="2"
              fill="#F472B6"
            />
            <circle
              cx="17"
              cy="13"
              r="2"
              fill="#F472B6"
            />
            <circle
              cx="14"
              cy="16"
              r="2"
              fill="#F472B6"
            />
            <circle
              cx="14"
              cy="14"
              r="1.2"
              fill="#FBBF24"
            />
            <circle
              cx="20"
              cy="12"
              r="2.5"
              fill="#8B5CF6"
            />
            <circle
              cx="17"
              cy="11"
              r="2"
              fill="#A78BFA"
            />
            <circle
              cx="23"
              cy="11"
              r="2"
              fill="#A78BFA"
            />
            <circle
              cx="20"
              cy="14"
              r="2"
              fill="#A78BFA"
            />
            <circle
              cx="20"
              cy="12"
              r="1.2"
              fill="#FBBF24"
            />
            <circle
              cx="26"
              cy="14"
              r="2.2"
              fill="#F59E0B"
            />
            <circle
              cx="23"
              cy="13"
              r="1.8"
              fill="#FCD34D"
            />
            <circle
              cx="29"
              cy="13"
              r="1.8"
              fill="#FCD34D"
            />
            <circle
              cx="26"
              cy="16"
              r="1.8"
              fill="#FCD34D"
            />
            <circle
              cx="26"
              cy="14"
              r="1"
              fill="#FB923C"
            />
          </svg>

          <svg
            v-else-if="deco.variant === 'rock'"
            width="42"
            height="28"
            viewBox="0 0 42 28"
            fill="none"
          >
            <defs>
              <linearGradient
                id="rock-gloss"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stop-color="#fff"
                  stop-opacity="0.5"
                />
                <stop
                  offset="100%"
                  stop-color="#fff"
                  stop-opacity="0"
                />
              </linearGradient>
            </defs>
            <ellipse
              cx="21"
              cy="26"
              rx="15"
              ry="2"
              fill="#000"
              opacity="0.12"
            />
            <path
              d="M5 24 Q4 12 14 8 Q22 4 30 9 Q40 12 38 24 Z"
              fill="#78716C"
            />
            <path
              d="M5 24 Q4 12 14 8 Q22 4 30 9 Q40 12 38 24 Z"
              fill="url(#rock-gloss)"
              opacity="0.5"
            />
            <ellipse
              cx="14"
              cy="12"
              rx="6"
              ry="2"
              fill="#A8A29E"
              opacity="0.7"
            />
            <circle
              cx="28"
              cy="14"
              r="1"
              fill="#fff"
              opacity="0.5"
            />
            <path
              d="M8 24 Q12 22 16 24"
              stroke="#16A34A"
              stroke-width="2"
              stroke-linecap="round"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M22 24 Q26 22 32 24"
              stroke="#16A34A"
              stroke-width="2"
              stroke-linecap="round"
              fill="none"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      <div
        class="relative mx-auto w-full max-w-3xl"
        :style="{ height: `${mapHeight}px` }"
      >
        <PathTrailSegment
          :points="trailPoints"
          :height="mapHeight"
        />

        <div
          v-for="island in islands"
          :key="island.topic.id"
          class="absolute -translate-x-1/2 -translate-y-1/2"
          :style="{ left: `${island.x}%`, top: `${island.y}px` }"
        >
          <PathTopicIsland
            :topic="island.topic"
            :index="island.index"
            :status="island.status"
            :palette="island.palette"
            :side="island.side"
            :size="layout.islandSize"
          />
        </div>

        <!-- Феми у активного острова -->
        <div
          v-if="femiPos"
          class="adventure-femi pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          :style="{ left: femiPos.left, top: femiPos.top }"
        >
          <FemiMascot
            state="teach"
            size="md"
            silent
          />
        </div>

        <!-- Сундук -->
        <div
          class="absolute left-1/2 -translate-x-1/2"
          :style="{ top: `${chestTop}px` }"
        >
          <AdventureChest
            :completed="completedCount"
            :total="islands.length"
            :reward-xp="stats.totalXp"
          />
        </div>
      </div>
    </section>

    <EmptyState
      v-else
      icon="i-lucide-route"
      title="Темы скоро появятся"
      description="Твой учитель ещё настраивает программу. Загляни чуть позже!"
    />
  </div>
</template>

<style scoped>
.adventure-cloud {
  animation-name: adventure-cloud-drift;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  will-change: transform;
}

@keyframes adventure-cloud-drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

.adventure-femi {
  animation: adventure-femi-bob 3s ease-in-out infinite;
}

@keyframes adventure-femi-bob {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-8px); }
}

.map-bird {
  animation: map-bird-cross linear infinite;
  will-change: transform;
}

@keyframes map-bird-cross {
  0%   { transform: translateX(-40px); }
  100% { transform: translateX(120vw); }
}

.map-tree {
  animation: map-tree-sway 4.5s ease-in-out infinite;
  animation-delay: var(--sway-delay, 0s);
  transform-origin: bottom center;
  will-change: transform;
  filter: drop-shadow(0 4px 6px rgb(6 95 70 / 0.15));
}

@keyframes map-tree-sway {
  0%, 100% { transform: rotate(0deg);    }
  25%      { transform: rotate(1.5deg);  }
  75%      { transform: rotate(-1.5deg); }
}

.map-cloud {
  animation: map-cloud-float linear infinite;
  will-change: transform;
}

@keyframes map-cloud-float {
  0%   { transform: translateX(-30px); }
  100% { transform: translateX(60vw);  }
}

.bird-wing {
  animation: bird-flap 0.32s ease-in-out infinite;
  transform-origin: 13px 11px;
  will-change: transform;
}

@keyframes bird-flap {
  0%, 100% { transform: scaleY(1)    translateY(0);    }
  50%      { transform: scaleY(0.45) translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .adventure-cloud,
  .adventure-femi,
  .map-bird,
  .map-cloud,
  .map-tree,
  .bird-wing {
    animation: none !important;
  }
}
</style>
