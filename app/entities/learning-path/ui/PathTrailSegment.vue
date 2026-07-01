<script setup lang="ts">
/**
 * PathTrailSegment — извилистая SVG-тропа, соединяющая острова на карте.
 *
 * Принимает массив точек (островов) с координатами в процентах
 * относительно контейнера. Рисует две накладывающиеся кривые:
 *   1) фоновая «дорожка» (бежевая, плотная)
 *   2) пройденная часть (зелёная, до индекса последнего done-острова)
 *
 * Bezier между соседними точками — гладкие S-кривые.
 */

interface TrailPoint {
  /** В процентах: 0-100 по ширине контейнера */
  x: number
  /** В пикселях от верха контейнера */
  y: number
  status: 'done' | 'active' | 'locked'
}

const props = defineProps<{
  points: TrailPoint[]
  /** Высота SVG = высота контейнера карты, в пикселях. */
  height: number
}>()

// Сборка path d="..." через cubic-bezier между соседями.
// Контрольные точки — вертикально смещённые, чтобы получить плавную S-форму.
const buildPath = (pts: TrailPoint[]): string => {
  if (pts.length === 0) return ''
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!
    const curr = pts[i]!
    const midY = (prev.y + curr.y) / 2
    // Контрольные точки на середине вертикали — даёт мягкую S-кривую.
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`
  }
  return d
}

const fullPath = computed(() => buildPath(props.points))

// Пройденная тропа: точки до последнего done (включительно) + первый active как граница.
const progressPath = computed(() => {
  const done: TrailPoint[] = []
  for (const p of props.points) {
    done.push(p)
    if (p.status !== 'done') break
  }
  return done.length >= 2 ? buildPath(done) : ''
})

const viewBox = computed(() => `0 0 100 ${props.height}`)
</script>

<template>
  <svg
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 size-full"
    :viewBox="viewBox"
    preserveAspectRatio="none"
  >
    <defs>
      <!-- Каменная тропа: основной цвет -->
      <linearGradient
        id="trail-stone-gradient"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop
          offset="0%"
          stop-color="#D6D3D1"
        />
        <stop
          offset="100%"
          stop-color="#A8A29E"
        />
      </linearGradient>

      <!-- Прогрессивная зелёно-золотая тропа -->
      <linearGradient
        id="trail-progress-gradient"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop
          offset="0%"
          stop-color="#22C55E"
        />
        <stop
          offset="60%"
          stop-color="#84CC16"
        />
        <stop
          offset="100%"
          stop-color="#FACC15"
        />
      </linearGradient>

      <!-- Тень под пройденной тропой -->
      <filter
        id="trail-glow"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
      >
        <feGaussianBlur
          stdDeviation="1.5"
          result="blur"
        />
        <feComposite
          in="SourceGraphic"
          in2="blur"
          operator="over"
        />
      </filter>
    </defs>

    <!-- Тень каменной тропы (объём) -->
    <path
      :d="fullPath"
      fill="none"
      stroke="#78716C"
      stroke-width="9"
      stroke-linecap="round"
      opacity="0.18"
      vector-effect="non-scaling-stroke"
    />

    <!-- Каменная тропа (фон) -->
    <path
      :d="fullPath"
      fill="none"
      stroke="url(#trail-stone-gradient)"
      stroke-width="7"
      stroke-linecap="round"
      stroke-dasharray="8 6"
      vector-effect="non-scaling-stroke"
    />

    <!-- Пройденная тропа -->
    <path
      v-if="progressPath"
      :d="progressPath"
      fill="none"
      stroke="url(#trail-progress-gradient)"
      stroke-width="7"
      stroke-linecap="round"
      stroke-dasharray="8 6"
      vector-effect="non-scaling-stroke"
      class="trail-progress-line"
      filter="url(#trail-glow)"
    />
  </svg>
</template>

<style scoped>
.trail-progress-line {
  animation: trail-march 1.2s linear infinite;
}

@keyframes trail-march {
  to { stroke-dashoffset: -14; }
}

@media (prefers-reduced-motion: reduce) {
  .trail-progress-line { animation: none; }
}
</style>
