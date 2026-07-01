<script setup lang="ts">
/**
 * NumberLineWidget — числовая прямая.
 *
 * Учим интуицию числа, его положения на прямой, сравнения, прыжков.
 * Тащим маркер слайдером или кнопками ±step. Опциональные `highlights`
 * подсвечиваются — например для пар «удобных чисел» в рациональных вычислениях.
 *
 * Применение в КТП 2 класса:
 *   - Сравнение чисел / выражений (тема 01, 02, 18)
 *   - Логика прыжков, расстояний (тема 20)
 *   - Сложение/вычитание визуально (тема 02, 05, 06, 07, 15)
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'number-line' }>
}>()

const { play } = useSound()

const value = ref(props.config.min)

const ticks = computed(() => {
  const result: number[] = []
  for (let v = props.config.min; v <= props.config.max; v += props.config.step) {
    result.push(v)
  }
  return result
})

const range = computed(() => Math.max(props.config.max - props.config.min, 1))

const positionPct = (v: number) => ((v - props.config.min) / range.value) * 100

const isHighlight = (v: number) => props.config.highlights?.includes(v) ?? false

const inc = () => {
  if (value.value + props.config.step <= props.config.max) {
    value.value = +(value.value + props.config.step).toFixed(2)
    play('pop')
  }
}
const dec = () => {
  if (value.value - props.config.step >= props.config.min) {
    value.value = +(value.value - props.config.step).toFixed(2)
    play('click')
  }
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5">
    <div class="flex flex-col items-center gap-5">
      <!-- Текущее значение -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Твоя точка
        </div>
        <div class="mt-1 font-black tabular-nums text-cyan-500 text-4xl sm:text-5xl">
          {{ value }}
        </div>
        <div class="mt-1 text-[11px] text-muted">
          {{ config.min }} … {{ config.max }} · шаг {{ config.step }}
        </div>
      </div>

      <!-- Сама прямая -->
      <div class="relative w-full max-w-md px-4 pt-2 pb-10">
        <!-- Базовая линия -->
        <div class="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-linear-to-r from-cyan-300 via-sky-300 to-cyan-300 dark:from-cyan-700 dark:via-sky-700 dark:to-cyan-700" />

        <!-- Засечки -->
        <div class="relative h-12">
          <template
            v-for="tick in ticks"
            :key="tick"
          >
            <div
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
              :style="{ left: `${positionPct(tick)}%` }"
            >
              <div
                class="size-2 rounded-full transition-all"
                :class="[
                  isHighlight(tick) ? 'bg-amber-500 ring-2 ring-amber-300/60 size-3' : 'bg-slate-400 dark:bg-slate-500',
                  tick === value ? 'ring-2 ring-cyan-400/70' : ''
                ]"
              />
              <span
                v-if="ticks.length <= 22"
                class="text-[10px] font-semibold tabular-nums"
                :class="[
                  tick === value ? 'text-cyan-600 dark:text-cyan-300' : 'text-muted'
                ]"
              >{{ tick }}</span>
            </div>
          </template>

          <!-- Бегунок -->
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-200"
            :style="{ left: `${positionPct(value)}%` }"
          >
            <div class="flex flex-col items-center">
              <div class="text-2xl">
                ▼
              </div>
              <div class="size-5 -mt-1 rounded-full bg-linear-to-br from-cyan-400 to-sky-500 shadow-lg ring-2 ring-white dark:ring-slate-900" />
            </div>
          </div>
        </div>

        <!-- Слайдер для тонкого управления -->
        <input
          v-model.number="value"
          type="range"
          :min="config.min"
          :max="config.max"
          :step="config.step"
          class="w-full mt-2 accent-cyan-500"
          @input="play('click')"
        >
      </div>

      <!-- Кнопки шага -->
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-minus"
          size="md"
          variant="soft"
          color="neutral"
          :disabled="value <= config.min"
          @click="dec"
        />
        <div class="rounded-xl border border-default bg-elevated px-4 py-2 text-sm font-semibold text-muted">
          шаг {{ config.step }}
        </div>
        <UButton
          icon="i-lucide-plus"
          size="md"
          variant="soft"
          color="primary"
          :disabled="value >= config.max"
          @click="inc"
        />
      </div>
    </div>
  </div>
</template>
