<script setup lang="ts">
/**
 * GroupingWidget — раздели N предметов по K группам.
 *
 * Учим интуицию умножения как «N групп по M в каждой».
 * Меняем количество групп — предметы автоматически перераспределяются.
 *
 * Применение в КТП 2 класса:
 *   - Тема 11 «Смысл умножения»
 *   - Тема 12 «Смысл деления» (как обратная операция)
 *   - Тема 13 «Таблица умножения 2-5»
 *   - Тема 17 «Задачи на ×÷»
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'grouping' }>
}>()

const { play } = useSound()

const [minGroups, maxGroups] = props.config.groupsRange
const groups = ref(Math.min(Math.max(2, minGroups), maxGroups))

const perGroup = computed(() => Math.floor(props.config.totalItems / groups.value))
const remainder = computed(() => props.config.totalItems - perGroup.value * groups.value)
const isExact = computed(() => remainder.value === 0)

const groupArr = computed(() => Array.from({ length: groups.value }, (_, i) => i))
const itemArr = (i: number) => {
  // Расширяем последнюю группу остатком
  const base = perGroup.value
  const extra = i < remainder.value ? 1 : 0
  return Array.from({ length: base + extra }, (_, j) => j)
}

const inc = () => {
  if (groups.value < maxGroups) {
    groups.value++
    play('pop')
  }
}
const dec = () => {
  if (groups.value > minGroups) {
    groups.value--
    play('click')
  }
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-violet-500/5 to-fuchsia-500/5 p-5">
    <div class="flex flex-col items-center gap-5">
      <!-- Уравнение -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Делим {{ config.totalItems }} предметов
        </div>
        <div class="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 font-black tabular-nums text-highlighted text-3xl sm:text-4xl">
          <span class="text-violet-500">{{ groups }}</span>
          <span class="text-muted text-xl">групп ×</span>
          <span class="text-fuchsia-500">{{ perGroup }}</span>
          <span class="text-muted text-xl">=</span>
          <span class="text-primary">{{ perGroup * groups }}</span>
          <span
            v-if="!isExact"
            class="text-rose-500 text-xl"
          >+ {{ remainder }} лишних</span>
        </div>
        <div
          v-if="isExact"
          class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-300"
        >
          <UIcon
            name="i-lucide-check"
            class="size-3"
          />
          Делится поровну!
        </div>
      </div>

      <!-- Группы предметов -->
      <div class="flex flex-wrap items-start justify-center gap-3 max-w-md w-full">
        <div
          v-for="i in groupArr"
          :key="i"
          class="rounded-xl border border-default bg-elevated p-2 min-w-[60px]"
        >
          <div class="text-[9px] font-semibold uppercase tracking-wider text-muted text-center mb-1">
            #{{ i + 1 }}
          </div>
          <div class="grid grid-cols-3 gap-1 justify-items-center">
            <div
              v-for="j in itemArr(i)"
              :key="j"
              class="size-5 rounded-full bg-linear-to-br from-violet-400 to-fuchsia-500 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Управление -->
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-minus"
          size="md"
          variant="soft"
          color="neutral"
          :disabled="groups <= minGroups"
          @click="dec"
        />
        <div class="rounded-xl border border-default bg-elevated px-4 py-2 text-sm font-semibold text-muted">
          Групп: <span class="text-violet-500 font-black">{{ groups }}</span>
        </div>
        <UButton
          icon="i-lucide-plus"
          size="md"
          variant="soft"
          color="primary"
          :disabled="groups >= maxGroups"
          @click="inc"
        />
      </div>
    </div>
  </div>
</template>
