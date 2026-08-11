<script setup lang="ts">
import type { LessonExercise, SortColumnsContent } from '~/entities/book'
import type { ExerciseReveal } from '../../model/reveal'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: ExerciseReveal | null, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as SortColumnsContent)
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)

const placement = ref<Record<string, string>>({}) // itemId -> columnId
const armedItem = ref<string | null>(null)
const bank = computed(() => content.value.items.filter(it => !placement.value[it.id]))
const itemsInColumn = (colId: string) => content.value.items.filter(it => placement.value[it.id] === colId)

watch(placement, p => emit('change', {
  response: { placement: p },
  ready: Object.keys(p).length === content.value.items.length
}), { deep: true, immediate: true })

const omit = (o: Record<string, string>, k: string) => {
  const { [k]: _drop, ...rest } = o
  return rest
}
const tapItem = (id: string) => {
  if (!props.disabled) armedItem.value = armedItem.value === id ? null : id
}
const tapColumn = (colId: string) => {
  if (props.disabled || !armedItem.value) return
  placement.value = { ...placement.value, [armedItem.value]: colId }
  armedItem.value = null
}
const tapPlaced = (id: string) => {
  if (!props.disabled) placement.value = omit(placement.value, id)
}
const chipOutcome = (id: string) => {
  if (props.status === 'idle') return 'bg-primary text-inverted'
  return placement.value[id] === props.reveal?.placement?.[id] ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div
      class="grid gap-3"
      :style="{ gridTemplateColumns: `repeat(${content.columns.length}, minmax(0, 1fr))` }"
    >
      <button
        v-for="col in content.columns"
        :key="col.id"
        type="button"
        :disabled="disabled"
        class="flex min-h-32 flex-col gap-2 rounded-2xl border-2 border-dashed p-3 text-left transition disabled:cursor-default"
        :class="armedItem ? 'border-primary bg-primary/5' : 'border-default'"
        @click="tapColumn(col.id)"
      >
        <span class="text-center text-lg font-black text-primary">{{ col.label }}</span>
        <span
          v-for="it in itemsInColumn(col.id)"
          :key="it.id"
          class="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-sm font-bold"
          :class="chipOutcome(it.id)"
          @click.stop="tapPlaced(it.id)"
        >
          <span v-if="isUrl(it.image)"><img
            :src="it.image"
            alt=""
            class="inline size-5"
          ></span>
          <span v-else-if="it.image">{{ it.image }}</span>
          <span
            v-else-if="wordEmoji(it.label)"
            class="text-base leading-none"
          >{{ wordEmoji(it.label) }}</span>
          <span v-if="it.label">{{ it.label }}</span>
        </span>
      </button>
    </div>

    <div class="flex flex-wrap justify-center gap-2">
      <button
        v-for="it in bank"
        :key="it.id"
        type="button"
        :disabled="disabled"
        class="inline-flex items-center gap-1 rounded-xl border-2 px-3 py-2 font-semibold transition disabled:cursor-default"
        :class="armedItem === it.id ? 'border-primary bg-primary/15 text-primary' : 'border-default hover:border-primary'"
        @click="tapItem(it.id)"
      >
        <span v-if="isUrl(it.image)"><img
          :src="it.image"
          alt=""
          class="inline size-6"
        ></span>
        <span
          v-else-if="it.image"
          class="text-2xl"
        >{{ it.image }}</span>
        <span
          v-else-if="wordEmoji(it.label)"
          class="text-xl leading-none"
        >{{ wordEmoji(it.label) }}</span>
        <span v-if="it.label">{{ it.label }}</span>
      </button>
    </div>
  </div>
</template>
