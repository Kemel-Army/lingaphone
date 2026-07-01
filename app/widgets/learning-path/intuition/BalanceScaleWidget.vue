<script setup lang="ts">
/**
 * BalanceScaleWidget — чашечные весы.
 *
 * Учим интуицию равенства/неравенства: добавляем гири в левую и правую
 * чаши, балка наклоняется в сторону тяжёлой чаши; при равновесии —
 * горизонтальна и подсвечивается зелёным.
 *
 * Применение в КТП 2 класса:
 *   - Сравнение чисел («>», «<», «=») — тема 01 и 02
 *   - Уравнения и неравенства — тема 16
 *
 * Управление: кнопки +/− добавляют гирю весом 1 (можно ставить любые,
 * но для интуиции 2 класса достаточно единичных).
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'balance-scale' }>
}>()

const { play } = useSound()

const left = ref(props.config.leftStart ?? 3)
const right = ref(props.config.rightStart ?? 5)

const tilt = computed(() => {
  // Нормализованный наклон: −1 (левая ниже) … +1 (правая ниже)
  const diff = right.value - left.value
  const max = Math.max(props.config.maxWeight, 1)
  const t = Math.max(-1, Math.min(1, diff / max))
  // Угол наклона до 12°
  return t * 12
})

const isBalanced = computed(() => left.value === right.value)
const matchesTarget = computed(() => {
  const t = props.config.target
  if (t === 'equal') return isBalanced.value
  if (typeof t === 'number') return left.value === t || right.value === t
  return false
})

const inc = (side: 'l' | 'r') => {
  if (side === 'l' && left.value < props.config.maxWeight) {
    left.value++
    play('pop')
  }
  if (side === 'r' && right.value < props.config.maxWeight) {
    right.value++
    play('pop')
  }
}
const dec = (side: 'l' | 'r') => {
  if (side === 'l' && left.value > 0) {
    left.value--
    play('click')
  }
  if (side === 'r' && right.value > 0) {
    right.value--
    play('click')
  }
}

watch(matchesTarget, (m) => {
  if (m) play('cheer')
})

const compareSign = computed(() => {
  if (left.value === right.value) return '='
  return left.value > right.value ? '>' : '<'
})
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-amber-500/5 to-rose-500/5 p-5">
    <div class="flex flex-col items-center gap-4">
      <!-- Equation display -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Сравнение
        </div>
        <div class="mt-1 flex items-baseline justify-center gap-3 font-black tabular-nums text-highlighted text-3xl sm:text-4xl">
          <span class="text-rose-500">{{ left }}</span>
          <span
            class="text-2xl sm:text-3xl"
            :class="compareSign === '=' ? 'text-emerald-500' : 'text-amber-500'"
          >
            {{ compareSign }}
          </span>
          <span class="text-amber-500">{{ right }}</span>
        </div>
        <div
          v-if="matchesTarget"
          class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-300"
        >
          <UIcon
            name="i-lucide-check"
            class="size-3"
          />
          {{ config.target === 'equal' ? 'Равновесие!' : 'Цель достигнута!' }}
        </div>
      </div>

      <!-- Scales SVG -->
      <svg
        viewBox="0 0 320 220"
        class="w-full max-w-md select-none"
      >
        <!-- Подставка -->
        <rect
          x="140"
          y="180"
          width="40"
          height="20"
          rx="3"
          fill="currentColor"
          class="text-slate-400 dark:text-slate-600"
        />
        <line
          x1="160"
          y1="180"
          x2="160"
          y2="80"
          stroke="currentColor"
          stroke-width="4"
          class="text-slate-500 dark:text-slate-400"
        />
        <!-- Балка с наклоном -->
        <g
          :transform="`rotate(${tilt} 160 80)`"
          class="transition-transform duration-500"
          style="transform-origin: 160px 80px"
        >
          <line
            x1="40"
            y1="80"
            x2="280"
            y2="80"
            stroke="currentColor"
            stroke-width="5"
            stroke-linecap="round"
            class="text-slate-700 dark:text-slate-200"
          />
          <!-- Левая чаша -->
          <circle
            cx="40"
            cy="80"
            r="6"
            fill="currentColor"
            class="text-slate-700 dark:text-slate-200"
          />
          <line
            x1="40"
            y1="80"
            x2="40"
            y2="115"
            stroke="currentColor"
            stroke-width="2"
            class="text-slate-500"
          />
          <ellipse
            cx="40"
            cy="125"
            rx="38"
            ry="10"
            fill="currentColor"
            class="text-rose-300/70 dark:text-rose-700/70"
          />
          <ellipse
            cx="40"
            cy="120"
            rx="38"
            ry="9"
            fill="currentColor"
            class="text-rose-200 dark:text-rose-800"
            stroke="currentColor"
            stroke-width="1.5"
            :class="['stroke-rose-500', isBalanced ? 'opacity-100' : '']"
          />
          <text
            x="40"
            y="105"
            text-anchor="middle"
            class="text-xs font-bold fill-rose-700 dark:fill-rose-200"
          >
            {{ left }}
          </text>
          <!-- Правая чаша -->
          <circle
            cx="280"
            cy="80"
            r="6"
            fill="currentColor"
            class="text-slate-700 dark:text-slate-200"
          />
          <line
            x1="280"
            y1="80"
            x2="280"
            y2="115"
            stroke="currentColor"
            stroke-width="2"
            class="text-slate-500"
          />
          <ellipse
            cx="280"
            cy="125"
            rx="38"
            ry="10"
            fill="currentColor"
            class="text-amber-300/70 dark:text-amber-700/70"
          />
          <ellipse
            cx="280"
            cy="120"
            rx="38"
            ry="9"
            fill="currentColor"
            class="text-amber-200 dark:text-amber-800"
            stroke="currentColor"
            stroke-width="1.5"
            :class="['stroke-amber-500']"
          />
          <text
            x="280"
            y="105"
            text-anchor="middle"
            class="text-xs font-bold fill-amber-700 dark:fill-amber-200"
          >
            {{ right }}
          </text>
        </g>
      </svg>

      <!-- Controls -->
      <div class="grid w-full max-w-md grid-cols-2 gap-3">
        <div class="rounded-xl border border-default bg-elevated p-3">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300 text-center mb-2">
            Левая чаша
          </div>
          <div class="flex items-center justify-between gap-1">
            <UButton
              icon="i-lucide-minus"
              size="sm"
              variant="soft"
              color="neutral"
              :disabled="left <= 0"
              @click="dec('l')"
            />
            <span class="text-2xl font-black tabular-nums text-rose-500">{{ left }}</span>
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              color="primary"
              :disabled="left >= config.maxWeight"
              @click="inc('l')"
            />
          </div>
        </div>
        <div class="rounded-xl border border-default bg-elevated p-3">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 text-center mb-2">
            Правая чаша
          </div>
          <div class="flex items-center justify-between gap-1">
            <UButton
              icon="i-lucide-minus"
              size="sm"
              variant="soft"
              color="neutral"
              :disabled="right <= 0"
              @click="dec('r')"
            />
            <span class="text-2xl font-black tabular-nums text-amber-500">{{ right }}</span>
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              color="primary"
              :disabled="right >= config.maxWeight"
              @click="inc('r')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
