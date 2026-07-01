<script setup lang="ts">
/**
 * AngleProtractorWidget — транспортир, измеряем угол.
 *
 * Один луч лежит на оси (0°), второй вращается вокруг общей вершины.
 * Слайдер 0..180° или кнопки ±snap. Если задан target — подсвечивается
 * целевая отметка и поздравляем при достижении (с учётом snap-tolerance).
 *
 * Применение в КТП 2 класса:
 *   - Тема 10 «Углы и их виды» (острый/прямой/тупой/развёрнутый)
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'angle-protractor' }>
}>()

const { play } = useSound()

const angle = ref(Math.max(0, Math.min(180, props.config.startAngle)))

const snap = computed(() => Math.max(1, props.config.snap))

const inc = () => {
  if (angle.value + snap.value <= 180) {
    angle.value += snap.value
    play('pop')
  }
}
const dec = () => {
  if (angle.value - snap.value >= 0) {
    angle.value -= snap.value
    play('click')
  }
}

const angleType = computed(() => {
  const a = angle.value
  if (a === 0) return { label: 'нулевой', color: 'text-slate-500' }
  if (a < 90) return { label: 'острый', color: 'text-emerald-500' }
  if (a === 90) return { label: 'прямой', color: 'text-sky-500' }
  if (a < 180) return { label: 'тупой', color: 'text-amber-500' }
  return { label: 'развёрнутый', color: 'text-rose-500' }
})

const matchesTarget = computed(() => {
  const t = props.config.target
  if (t === undefined) return false
  return Math.abs(angle.value - t) <= snap.value / 2
})

watch(matchesTarget, (m) => {
  if (m) play('cheer')
})

// SVG-координаты — вершина в центре, луч A фикс по горизонтали (право),
// луч B вращается. Угол отсчитывается против часовой стрелки.
const cx = 160
const cy = 130
const r = 110

const rayBEnd = computed(() => {
  const rad = (angle.value * Math.PI) / 180
  return {
    x: cx + r * Math.cos(-rad), // -rad: SVG y вниз
    y: cy + r * Math.sin(-rad)
  }
})

// Дуга-индикатор внутри угла (маленькая)
const arcRadius = 36
const arcPath = computed(() => {
  const rad = (angle.value * Math.PI) / 180
  const x1 = cx + arcRadius
  const y1 = cy
  const x2 = cx + arcRadius * Math.cos(-rad)
  const y2 = cy + arcRadius * Math.sin(-rad)
  const largeArc = angle.value > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${x2} ${y2}`
})

// Отметки шкалы транспортира — каждые 30°
const ticks = [0, 30, 60, 90, 120, 150, 180]
const tickPos = (deg: number) => {
  const rad = (deg * Math.PI) / 180
  return {
    x: cx + (r + 8) * Math.cos(-rad),
    y: cy + (r + 8) * Math.sin(-rad)
  }
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-sky-500/5 to-indigo-500/5 p-5">
    <div class="flex flex-col items-center gap-5">
      <!-- Текущий угол -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Угол
        </div>
        <div class="mt-1 flex items-baseline justify-center gap-2 font-black tabular-nums text-highlighted text-3xl sm:text-4xl">
          <span class="text-sky-500">{{ angle }}°</span>
          <span
            class="text-base font-semibold"
            :class="angleType.color"
          >{{ angleType.label }}</span>
        </div>
        <div
          v-if="matchesTarget"
          class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-300"
        >
          <UIcon
            name="i-lucide-check"
            class="size-3"
          /> Цель {{ config.target }}° достигнута!
        </div>
      </div>

      <!-- SVG -->
      <svg
        viewBox="0 0 320 220"
        class="w-full max-w-md select-none"
      >
        <!-- Полукруг транспортира -->
        <path
          :d="`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`"
          fill="currentColor"
          class="text-sky-400/10 dark:text-sky-400/5"
          stroke="currentColor"
          stroke-width="1"
        />
        <!-- Цель (если есть) -->
        <line
          v-if="config.target !== undefined"
          :x1="cx"
          :y1="cy"
          :x2="cx + r * Math.cos(-(config.target * Math.PI) / 180)"
          :y2="cy + r * Math.sin(-(config.target * Math.PI) / 180)"
          stroke="currentColor"
          stroke-width="2"
          stroke-dasharray="4 4"
          class="text-amber-500/60"
        />
        <!-- Луч A (фиксированный, вправо) -->
        <line
          :x1="cx"
          :y1="cy"
          :x2="cx + r"
          :y2="cy"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          class="text-slate-700 dark:text-slate-200"
        />
        <!-- Луч B (вращается) -->
        <line
          :x1="cx"
          :y1="cy"
          :x2="rayBEnd.x"
          :y2="rayBEnd.y"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          class="text-sky-500 transition-all duration-300"
        />
        <!-- Дуга-индикатор -->
        <path
          v-if="angle > 0"
          :d="arcPath"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="text-sky-500/70"
        />
        <!-- Отметки шкалы -->
        <g class="text-muted">
          <text
            v-for="t in ticks"
            :key="t"
            :x="tickPos(t).x"
            :y="tickPos(t).y + 4"
            text-anchor="middle"
            class="text-[10px] font-semibold fill-current"
          >{{ t }}</text>
        </g>
        <!-- Вершина -->
        <circle
          :cx="cx"
          :cy="cy"
          r="5"
          fill="currentColor"
          class="text-slate-800 dark:text-slate-100"
        />
      </svg>

      <!-- Слайдер -->
      <input
        v-model.number="angle"
        type="range"
        min="0"
        max="180"
        :step="snap"
        class="w-full max-w-md accent-sky-500"
        @input="play('click')"
      >

      <!-- Кнопки -->
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-minus"
          size="md"
          variant="soft"
          color="neutral"
          :disabled="angle <= 0"
          @click="dec"
        />
        <div class="rounded-xl border border-default bg-elevated px-4 py-2 text-sm font-semibold text-muted">
          шаг {{ snap }}°
        </div>
        <UButton
          icon="i-lucide-plus"
          size="md"
          variant="soft"
          color="primary"
          :disabled="angle >= 180"
          @click="inc"
        />
      </div>
    </div>
  </div>
</template>
