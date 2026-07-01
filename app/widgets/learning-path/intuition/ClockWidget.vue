<script setup lang="ts">
/**
 * ClockWidget — аналоговые часы с интерактивным вращением стрелок.
 *
 * Тема в КТП 2 класса: «Время и римская нумерация» (тема 08).
 *
 * Как работает:
 *   - Часовая (короткая) и минутная (длинная) стрелки рисуются SVG.
 *   - Каждая стрелка перетаскивается мышью/пальцем (pointer events).
 *   - Минутная щёлкает по 5 минут (snap=5 по умолчанию).
 *   - Часовая ползёт пропорционально минутам.
 *   - Большое цифровое время рядом для самопроверки.
 *
 * Mode: 'set-time' — задан target, виджет подсвечивает совпадение;
 * 'free' — свободное исследование.
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'clock' }>
}>()

const { play } = useSound()

const hour = ref(props.config.targetHour ?? 3)
const minute = ref(props.config.targetMinute ?? 0)

// Если режим set-time — стартуем с 12:00 чтобы было что менять.
onMounted(() => {
  if (props.config.mode === 'set-time') {
    hour.value = 12
    minute.value = 0
  }
})

const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 8

const hourAngle = computed(() => ((hour.value % 12) + minute.value / 60) * 30)
const minuteAngle = computed(() => minute.value * 6)

const dragging = ref<'h' | 'm' | null>(null)
const clockSvg = useTemplateRef<SVGSVGElement>('clockSvg')

// Преобразуем pointer-координату в угол от 12 часов (по часовой)
const computeAngle = (clientX: number, clientY: number): number => {
  const svg = clockSvg.value
  if (!svg) return 0
  const rect = svg.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = clientX - cx
  const dy = clientY - cy
  // 0° — это 12 часов (вверх); по часовой стрелке +
  let angle = Math.atan2(dx, -dy) * (180 / Math.PI)
  if (angle < 0) angle += 360
  return angle
}

const onPointerMove = (e: PointerEvent) => {
  if (!dragging.value) return
  e.preventDefault()
  const angle = computeAngle(e.clientX, e.clientY)
  if (dragging.value === 'm') {
    const snap = Math.max(1, props.config.snap ?? 5)
    const newMinute = Math.round((angle / 6) / snap) * snap % 60
    if (newMinute !== minute.value) {
      minute.value = newMinute
      play('click')
    }
  } else {
    // Часовая стрелка: 12 положений по 30° каждое
    const newHour = Math.round(angle / 30) % 12
    const displayHour = newHour === 0 ? 12 : newHour
    if (displayHour !== hour.value) {
      hour.value = displayHour
      play('click')
    }
  }
}

const startDrag = (which: 'h' | 'm') => (e: PointerEvent) => {
  if (e.button !== undefined && e.button !== 0) return
  dragging.value = which
  e.preventDefault();
  (e.target as Element).setPointerCapture?.(e.pointerId)
}

const endDrag = (e: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = null
  ;(e.target as Element).releasePointerCapture?.(e.pointerId)
}

const formattedTime = computed(() => {
  const h = String(hour.value).padStart(2, '0')
  const m = String(minute.value).padStart(2, '0')
  return `${h}:${m}`
})

const isMatchTarget = computed(() => {
  if (props.config.mode !== 'set-time') return false
  return hour.value === (props.config.targetHour ?? -1) && minute.value === (props.config.targetMinute ?? -1)
})

watch(isMatchTarget, (m) => {
  if (m) play('cheer')
})

const handXY = (angle: number, lengthRatio: number) => {
  const rad = (angle - 90) * Math.PI / 180
  return {
    x: CENTER + Math.cos(rad) * RADIUS * lengthRatio,
    y: CENTER + Math.sin(rad) * RADIUS * lengthRatio
  }
}

const hourHand = computed(() => handXY(hourAngle.value, 0.55))
const minuteHand = computed(() => handXY(minuteAngle.value, 0.85))
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5">
    <div class="flex flex-col items-center gap-4">
      <!-- Цифровое время -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Время
        </div>
        <div class="mt-1 text-4xl sm:text-5xl font-black tabular-nums text-highlighted">
          {{ formattedTime }}
        </div>
        <div
          v-if="config.mode === 'set-time'"
          class="mt-1 text-xs text-muted"
        >
          Цель:
          <span class="font-bold text-highlighted">
            {{ String(config.targetHour ?? 0).padStart(2, '0') }}:{{ String(config.targetMinute ?? 0).padStart(2, '0') }}
          </span>
          <span
            v-if="isMatchTarget"
            class="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-300"
          >
            <UIcon
              name="i-lucide-check"
              class="size-3"
            />
            Точно!
          </span>
        </div>
      </div>

      <!-- Часы (SVG) -->
      <svg
        ref="clockSvg"
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        class="w-56 h-56 sm:w-64 sm:h-64 select-none touch-none"
        @pointermove="onPointerMove"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @pointerleave="endDrag"
      >
        <!-- Циферблат -->
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          fill="white"
          stroke="currentColor"
          stroke-width="3"
          class="text-cyan-400 dark:fill-slate-800"
        />

        <!-- Часовые метки + цифры -->
        <g>
          <template
            v-for="i in 12"
            :key="`m-${i}`"
          >
            <line
              :x1="CENTER + Math.cos((i * 30 - 90) * Math.PI / 180) * (RADIUS - 4)"
              :y1="CENTER + Math.sin((i * 30 - 90) * Math.PI / 180) * (RADIUS - 4)"
              :x2="CENTER + Math.cos((i * 30 - 90) * Math.PI / 180) * (RADIUS - 14)"
              :y2="CENTER + Math.sin((i * 30 - 90) * Math.PI / 180) * (RADIUS - 14)"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              class="text-cyan-500"
            />
            <text
              :x="CENTER + Math.cos((i * 30 - 90) * Math.PI / 180) * (RADIUS - 28)"
              :y="CENTER + Math.sin((i * 30 - 90) * Math.PI / 180) * (RADIUS - 28) + 5"
              text-anchor="middle"
              class="text-[14px] font-black fill-slate-700 dark:fill-slate-200"
            >
              {{ i }}
            </text>
          </template>
        </g>

        <!-- Минутные риски -->
        <g>
          <line
            v-for="i in 60"
            v-show="i % 5 !== 0"
            :key="`mm-${i}`"
            :x1="CENTER + Math.cos((i * 6 - 90) * Math.PI / 180) * (RADIUS - 4)"
            :y1="CENTER + Math.sin((i * 6 - 90) * Math.PI / 180) * (RADIUS - 4)"
            :x2="CENTER + Math.cos((i * 6 - 90) * Math.PI / 180) * (RADIUS - 8)"
            :y2="CENTER + Math.sin((i * 6 - 90) * Math.PI / 180) * (RADIUS - 8)"
            stroke="currentColor"
            stroke-width="1"
            class="text-slate-400"
          />
        </g>

        <!-- Часовая стрелка -->
        <line
          :x1="CENTER"
          :y1="CENTER"
          :x2="hourHand.x"
          :y2="hourHand.y"
          stroke="currentColor"
          stroke-width="6"
          stroke-linecap="round"
          class="text-violet-500 cursor-grab"
          :class="dragging === 'h' ? 'cursor-grabbing' : ''"
          @pointerdown="startDrag('h')"
        />
        <!-- Touchable хвост часовой стрелки -->
        <circle
          :cx="hourHand.x"
          :cy="hourHand.y"
          r="10"
          fill="currentColor"
          class="text-violet-500 cursor-grab"
          :class="dragging === 'h' ? 'cursor-grabbing' : ''"
          @pointerdown="startDrag('h')"
        />

        <!-- Минутная стрелка -->
        <line
          :x1="CENTER"
          :y1="CENTER"
          :x2="minuteHand.x"
          :y2="minuteHand.y"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          class="text-orange-500 cursor-grab"
          :class="dragging === 'm' ? 'cursor-grabbing' : ''"
          @pointerdown="startDrag('m')"
        />
        <circle
          :cx="minuteHand.x"
          :cy="minuteHand.y"
          r="9"
          fill="currentColor"
          class="text-orange-500 cursor-grab"
          :class="dragging === 'm' ? 'cursor-grabbing' : ''"
          @pointerdown="startDrag('m')"
        />

        <!-- Центр -->
        <circle
          :cx="CENTER"
          :cy="CENTER"
          r="6"
          fill="currentColor"
          class="text-slate-700 dark:text-slate-200"
        />
      </svg>

      <p class="text-xs text-muted text-center max-w-xs">
        Тащи <span class="font-bold text-violet-500">часовую</span>
        и <span class="font-bold text-orange-500">минутную</span> стрелки пальцем.
      </p>
    </div>
  </div>
</template>
