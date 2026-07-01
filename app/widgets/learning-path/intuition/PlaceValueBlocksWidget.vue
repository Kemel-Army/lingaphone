<script setup lang="ts">
/**
 * PlaceValueBlocksWidget — блоки Дьенеша.
 *
 * Учит ребёнка видеть число как сумму сотен, десятков и единиц.
 * Сотня = квадрат 10×10 кубиков, десяток = вертикальная палочка из
 * 10 кубиков, единица = маленький кубик. Кнопки +/− добавляют/убирают
 * блоки, рядом — большое число с подсветкой разрядов.
 *
 * Применение в КТП 2 класса:
 *   - Двузначные числа (без сотен)
 *   - Сотни. Числа до 1000
 *   - Письменное сложение/вычитание
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'place-value-blocks' }>
}>()

const { play } = useSound()

const hundreds = ref(0)
const tens = ref(0)
const ones = ref(0)

watch(() => props.config, (cfg) => {
  if (cfg.target != null) {
    // Если задан target — стартуем с нуля и просим набрать; иначе
    // показываем дефолт «1 сотня, 2 десятка, 3 единицы» если это в пределах.
    hundreds.value = 0
    tens.value = 0
    ones.value = 0
  }
}, { immediate: true })

const total = computed(() => hundreds.value * 100 + tens.value * 10 + ones.value)
const matchesTarget = computed(() => props.config.target != null && total.value === props.config.target)

const inc = (kind: 'h' | 't' | 'o') => {
  if (kind === 'h' && hundreds.value < props.config.maxHundreds) {
    hundreds.value++
    play('pop')
  }
  if (kind === 't' && tens.value < props.config.maxTens) {
    tens.value++
    play('pop')
  }
  if (kind === 'o' && ones.value < props.config.maxOnes) {
    ones.value++
    play('pop')
  }
}

const dec = (kind: 'h' | 't' | 'o') => {
  if (kind === 'h' && hundreds.value > 0) {
    hundreds.value--
    play('click')
  }
  if (kind === 't' && tens.value > 0) {
    tens.value--
    play('click')
  }
  if (kind === 'o' && ones.value > 0) {
    ones.value--
    play('click')
  }
}

watch(matchesTarget, (m) => {
  if (m) play('cheer')
})
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-violet-500/5 to-fuchsia-500/5 p-5">
    <div class="flex flex-col items-center gap-5">
      <!-- Number display -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Твоё число
        </div>
        <div class="mt-1 flex flex-wrap items-baseline justify-center gap-x-1 sm:gap-x-2 font-black tabular-nums text-highlighted text-4xl sm:text-5xl md:text-6xl">
          <span :class="hundreds > 0 ? 'text-violet-500' : 'text-muted/30'">
            {{ hundreds }}
          </span>
          <span :class="tens > 0 ? 'text-emerald-500' : 'text-muted/30'">
            {{ tens }}
          </span>
          <span :class="ones > 0 ? 'text-amber-500' : 'text-muted/30'">
            {{ ones }}
          </span>
          <span class="ml-2 text-muted">=</span>
          <span class="text-primary">{{ total }}</span>
        </div>
        <div
          v-if="config.target != null"
          class="mt-1 text-xs text-muted"
        >
          Цель: <span class="font-bold tabular-nums text-highlighted">{{ config.target }}</span>
          <span
            v-if="matchesTarget"
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

      <!-- Blocks visualization -->
      <div class="flex max-w-full flex-wrap items-end justify-center gap-3 sm:gap-5 overflow-x-auto pb-2">
        <!-- Сотни — квадрат 10×10 -->
        <div
          v-for="n in hundreds"
          :key="`h-${n}`"
          class="flex shrink-0 flex-col items-center gap-1"
        >
          <div class="grid grid-cols-10 gap-px rounded-md border border-violet-400 bg-violet-100/40 p-0.5 dark:bg-violet-900/30">
            <span
              v-for="i in 100"
              :key="`hc-${n}-${i}`"
              class="size-1.5 rounded-[1px] bg-violet-500"
            />
          </div>
          <span class="text-[10px] font-bold uppercase text-violet-600 dark:text-violet-300">100</span>
        </div>
        <!-- Десятки — палочка из 10 -->
        <div
          v-for="n in tens"
          :key="`t-${n}`"
          class="flex shrink-0 flex-col items-center gap-1"
        >
          <div class="flex flex-col gap-px rounded-md border border-emerald-400 bg-emerald-100/40 p-0.5 dark:bg-emerald-900/30">
            <span
              v-for="i in 10"
              :key="`tc-${n}-${i}`"
              class="size-3 rounded-[2px] bg-emerald-500"
            />
          </div>
          <span class="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-300">10</span>
        </div>
        <!-- Единицы -->
        <div
          v-if="ones > 0"
          class="flex shrink-0 flex-col items-center gap-1"
        >
          <div class="grid grid-cols-5 gap-1">
            <span
              v-for="n in ones"
              :key="`o-${n}`"
              class="size-3.5 rounded-[2px] bg-amber-500 ring-1 ring-amber-400"
            />
          </div>
          <span class="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-300">1</span>
        </div>
        <!-- Empty state -->
        <div
          v-if="total === 0"
          class="text-sm text-muted py-6"
        >
          Нажимай <strong>+</strong> снизу, чтобы добавить блоки.
        </div>
      </div>

      <!-- Controls — три колонки -->
      <div class="grid w-full max-w-md grid-cols-3 gap-3">
        <div
          v-if="config.maxHundreds > 0"
          class="rounded-xl border border-default bg-elevated p-3"
        >
          <div class="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 text-center mb-2">
            Сотни
          </div>
          <div class="flex items-center justify-between gap-1">
            <UButton
              icon="i-lucide-minus"
              size="sm"
              variant="soft"
              color="neutral"
              :disabled="hundreds <= 0"
              @click="dec('h')"
            />
            <span class="text-xl font-black tabular-nums text-violet-500">{{ hundreds }}</span>
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              color="primary"
              :disabled="hundreds >= config.maxHundreds"
              @click="inc('h')"
            />
          </div>
        </div>
        <div class="rounded-xl border border-default bg-elevated p-3">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 text-center mb-2">
            Десятки
          </div>
          <div class="flex items-center justify-between gap-1">
            <UButton
              icon="i-lucide-minus"
              size="sm"
              variant="soft"
              color="neutral"
              :disabled="tens <= 0"
              @click="dec('t')"
            />
            <span class="text-xl font-black tabular-nums text-emerald-500">{{ tens }}</span>
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              color="primary"
              :disabled="tens >= config.maxTens"
              @click="inc('t')"
            />
          </div>
        </div>
        <div class="rounded-xl border border-default bg-elevated p-3">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 text-center mb-2">
            Единицы
          </div>
          <div class="flex items-center justify-between gap-1">
            <UButton
              icon="i-lucide-minus"
              size="sm"
              variant="soft"
              color="neutral"
              :disabled="ones <= 0"
              @click="dec('o')"
            />
            <span class="text-xl font-black tabular-nums text-amber-500">{{ ones }}</span>
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              color="primary"
              :disabled="ones >= config.maxOnes"
              @click="inc('o')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
