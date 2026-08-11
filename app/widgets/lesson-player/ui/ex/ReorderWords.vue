<script setup lang="ts">
import type { LessonExercise, ReorderContent } from '~/entities/book'
import type { ExerciseReveal } from '../../model/reveal'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: ExerciseReveal | null, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as ReorderContent)
const tiles = computed(() => content.value.tiles.map((label, i) => ({ id: `t${i}`, label })))
const built = ref<{ id: string, label: string }[]>([])
const bank = computed(() => tiles.value.filter(t => !built.value.some(b => b.id === t.id)))

watch(built, b => emit('change', {
  response: { order: b.map(t => t.label) },
  ready: b.length === tiles.value.length
}), { deep: true, immediate: true })

const add = (t: { id: string, label: string }) => {
  if (!props.disabled) built.value.push(t)
}
const removeAt = (i: number) => {
  if (!props.disabled) built.value.splice(i, 1)
}

const lineClass = computed(() => props.status === 'correct'
  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
  : props.status === 'wrong'
    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
    : 'border-dashed border-default')
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- built sentence -->
    <div
      class="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border-2 p-3 transition"
      :class="lineClass"
    >
      <button
        v-for="(t, i) in built"
        :key="t.id"
        type="button"
        :disabled="disabled"
        class="rounded-xl bg-primary px-3 py-2 text-lg font-semibold text-inverted shadow-sm transition hover:opacity-90 disabled:cursor-default"
        @click="removeAt(i)"
      >
        {{ t.label }}
      </button>
      <span
        v-if="!built.length"
        class="px-2 text-sm text-muted"
      >Собери предложение из слов ниже</span>
    </div>
    <p
      v-if="status === 'wrong' && reveal?.order"
      class="text-center text-sm font-bold text-green-600"
    >
      ✓ {{ reveal.order.join(' ') }}
    </p>

    <!-- word bank -->
    <div class="flex flex-wrap justify-center gap-2">
      <button
        v-for="t in bank"
        :key="t.id"
        type="button"
        :disabled="disabled"
        class="rounded-xl border-2 border-default bg-elevated px-3 py-2 text-lg font-semibold transition hover:border-primary disabled:cursor-default"
        @click="add(t)"
      >
        {{ t.label }}
      </button>
    </div>
  </div>
</template>
