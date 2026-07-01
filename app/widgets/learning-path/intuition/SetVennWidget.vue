<script setup lang="ts">
/**
 * SetVennWidget — диаграмма Венна с двумя множествами A и B.
 *
 * Дети видят круги A, B и их пересечение, тапают по элементу — он
 * перемещается в следующую зону по циклу: A → BOTH → B → NEITHER → A.
 * Есть кнопка «Проверить» — сравнивает текущее распределение с правильным
 * (item.in из конфига).
 *
 * Применение в КТП 2 класса:
 *   - Тема 09 «Множества и их элементы»
 */
import type { IntuitionWidget } from '~/entities/learning-path'

type Zone = 'A' | 'B' | 'BOTH' | 'NEITHER'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'set-venn' }>
}>()

const { play } = useSound()

// Стартуем все элементы в NEITHER — пусть ребёнок распределяет.
const placement = ref<Record<string, Zone>>(
  Object.fromEntries(props.config.items.map(i => [i.id, 'NEITHER']))
)

const cycleZone: Record<Zone, Zone> = {
  A: 'BOTH',
  BOTH: 'B',
  B: 'NEITHER',
  NEITHER: 'A'
}

const itemsInZone = (zone: Zone) =>
  props.config.items.filter(i => placement.value[i.id] === zone)

const moveItem = (id: string) => {
  const current = placement.value[id] ?? 'NEITHER'
  placement.value[id] = cycleZone[current]
  play('click')
}

const checked = ref(false)
const allCorrect = computed(() =>
  props.config.items.every(i => placement.value[i.id] === i.in)
)

const check = () => {
  checked.value = true
  if (allCorrect.value) play('cheer')
  else play('wrong')
}
const reset = () => {
  placement.value = Object.fromEntries(
    props.config.items.map(i => [i.id, 'NEITHER'])
  )
  checked.value = false
  play('click')
}

const isMisplaced = (id: string) => {
  if (!checked.value) return false
  const target = props.config.items.find(i => i.id === id)?.in
  return placement.value[id] !== target
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-emerald-500/5 to-teal-500/5 p-5">
    <div class="flex flex-col items-center gap-5">
      <!-- Заголовок и подсказка -->
      <div class="text-center">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted">
          Распредели по множествам
        </div>
        <div class="mt-1 text-sm text-muted">
          Тапай элемент — он переходит в следующую зону.
        </div>
      </div>

      <!-- Диаграмма Венна -->
      <svg
        viewBox="0 0 320 220"
        class="w-full max-w-md select-none"
      >
        <!-- Круг A -->
        <circle
          cx="120"
          cy="110"
          r="80"
          fill="currentColor"
          class="text-emerald-400/20 dark:text-emerald-400/15"
          stroke="currentColor"
          stroke-width="2"
          :stroke-dasharray="''"
        />
        <text
          x="65"
          y="40"
          text-anchor="middle"
          class="text-sm font-bold fill-emerald-700 dark:fill-emerald-300"
        >
          {{ config.setALabel }}
        </text>
        <!-- Круг B -->
        <circle
          cx="200"
          cy="110"
          r="80"
          fill="currentColor"
          class="text-teal-400/20 dark:text-teal-400/15"
          stroke="currentColor"
          stroke-width="2"
        />
        <text
          x="255"
          y="40"
          text-anchor="middle"
          class="text-sm font-bold fill-teal-700 dark:fill-teal-300"
        >
          {{ config.setBLabel }}
        </text>

        <!-- Только A -->
        <foreignObject
          x="40"
          y="60"
          width="70"
          height="120"
        >
          <div class="flex h-full w-full flex-wrap items-center justify-center gap-1">
            <button
              v-for="it in itemsInZone('A')"
              :key="it.id"
              type="button"
              class="rounded-full px-1.5 py-0.5 text-base transition-all hover:scale-110"
              :class="[
                isMisplaced(it.id) ? 'bg-rose-500/30 ring-2 ring-rose-500' : 'bg-emerald-500/20'
              ]"
              :title="it.label"
              @click="moveItem(it.id)"
            >
              {{ it.emoji ?? '•' }}
            </button>
          </div>
        </foreignObject>

        <!-- Пересечение BOTH -->
        <foreignObject
          x="125"
          y="65"
          width="70"
          height="100"
        >
          <div class="flex h-full w-full flex-wrap items-center justify-center gap-1">
            <button
              v-for="it in itemsInZone('BOTH')"
              :key="it.id"
              type="button"
              class="rounded-full px-1.5 py-0.5 text-base transition-all hover:scale-110"
              :class="[
                isMisplaced(it.id) ? 'bg-rose-500/30 ring-2 ring-rose-500' : 'bg-amber-500/30'
              ]"
              :title="it.label"
              @click="moveItem(it.id)"
            >
              {{ it.emoji ?? '•' }}
            </button>
          </div>
        </foreignObject>

        <!-- Только B -->
        <foreignObject
          x="210"
          y="60"
          width="70"
          height="120"
        >
          <div class="flex h-full w-full flex-wrap items-center justify-center gap-1">
            <button
              v-for="it in itemsInZone('B')"
              :key="it.id"
              type="button"
              class="rounded-full px-1.5 py-0.5 text-base transition-all hover:scale-110"
              :class="[
                isMisplaced(it.id) ? 'bg-rose-500/30 ring-2 ring-rose-500' : 'bg-teal-500/20'
              ]"
              :title="it.label"
              @click="moveItem(it.id)"
            >
              {{ it.emoji ?? '•' }}
            </button>
          </div>
        </foreignObject>
      </svg>

      <!-- Зона NEITHER (вне кругов) -->
      <div class="w-full max-w-md rounded-xl border border-dashed border-default bg-elevated p-3">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-muted text-center mb-2">
          Вне множеств (NEITHER)
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button
            v-for="it in itemsInZone('NEITHER')"
            :key="it.id"
            type="button"
            class="rounded-full bg-slate-500/15 px-2 py-1 text-base transition-all hover:scale-110"
            :class="[
              isMisplaced(it.id) ? 'bg-rose-500/30 ring-2 ring-rose-500' : ''
            ]"
            @click="moveItem(it.id)"
          >
            {{ it.emoji ?? '•' }} <span class="text-xs ml-1 text-muted">{{ it.label }}</span>
          </button>
          <span
            v-if="itemsInZone('NEITHER').length === 0"
            class="text-xs text-muted italic"
          >все распределены</span>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex items-center gap-3">
        <UButton
          size="md"
          variant="solid"
          color="primary"
          icon="i-lucide-check"
          @click="check"
        >
          Проверить
        </UButton>
        <UButton
          size="md"
          variant="soft"
          color="neutral"
          icon="i-lucide-rotate-ccw"
          @click="reset"
        >
          Сбросить
        </UButton>
      </div>

      <div
        v-if="checked && allCorrect"
        class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-600 dark:text-emerald-300"
      >
        <UIcon
          name="i-lucide-trophy"
          class="size-4"
        /> Все элементы на своих местах!
      </div>
      <div
        v-else-if="checked"
        class="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-sm text-rose-600 dark:text-rose-300"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="size-4"
        /> Красные элементы — не в своей зоне.
      </div>
    </div>
  </div>
</template>
