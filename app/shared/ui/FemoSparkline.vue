<script setup lang="ts">
/**
 * FemoSparkline — tiny inline SVG sparkline (no chart library).
 *
 * Renders a 0-100 normalized line + last-point dot. ~60×16 box, fits
 * inside a row right beside a mastery percentage.
 *
 * Usage:
 *   <FemoSparkline :points="[40, 48, 55, 62, 78, 84, 92]" tone="green" />
 */
type Tone = 'red' | 'coral' | 'amber' | 'green' | 'violet'

const props = withDefaults(defineProps<{
  points: number[]
  tone?: Tone
  width?: number
  height?: number
}>(), {
  tone: 'green',
  width: 64,
  height: 18
})

const colorMap: Record<Tone, string> = {
  red: '#ef4438',
  coral: '#ff7a48',
  amber: '#faa51a',
  green: '#22c55e',
  violet: '#a855f7'
}

const path = computed(() => {
  const pts = props.points.length ? props.points : [0]
  const n = pts.length
  if (n < 2) {
    const y = props.height / 2
    return `M 0 ${y} L ${props.width} ${y}`
  }
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = Math.max(max - min, 1)
  const stepX = props.width / (n - 1)
  return pts.map((p, i) => {
    const x = i * stepX
    const y = props.height - ((p - min) / range) * (props.height - 2) - 1
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
})

const lastPoint = computed(() => {
  const pts = props.points
  if (pts.length < 2) return { x: props.width, y: props.height / 2 }
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = Math.max(max - min, 1)
  return {
    x: props.width,
    y: props.height - ((pts[pts.length - 1]! - min) / range) * (props.height - 2) - 1
  }
})

const color = computed(() => colorMap[props.tone])
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    role="img"
    aria-hidden="true"
  >
    <path
      :d="path"
      fill="none"
      :stroke="color"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.85"
    />
    <circle
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="2.2"
      :fill="color"
    />
  </svg>
</template>
