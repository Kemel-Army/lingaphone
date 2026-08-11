<script setup lang="ts">
import type { LessonExercise, ChooseContent } from '~/entities/book'
import type { ExerciseReveal } from '../../model/reveal'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: ExerciseReveal | null, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as ChooseContent)
const answers = ref<string[]>(content.value.items.map(() => ''))

watch(answers, a => emit('change', { response: { answers: [...a] }, ready: a.every(x => !!x) }), { deep: true, immediate: true })

const pick = (i: number, id: string) => {
  if (!props.disabled) answers.value[i] = id
}

const chipClass = (i: number, id: string) => {
  const chosen = answers.value[i] === id
  if (props.status !== 'idle') {
    const correctId = props.reveal?.answers?.[i]
    if (id === correctId) return 'border-green-500 bg-green-100 text-green-800 dark:bg-green-900/40'
    if (chosen) return 'border-red-500 bg-red-100 text-red-800 dark:bg-red-900/40'
    return 'border-default opacity-50'
  }
  return chosen ? 'border-primary bg-primary/15 text-primary shadow-(--shadow-soft)' : 'border-primary/25 bg-default hover:border-primary hover:bg-primary/5'
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div
      v-for="(it, i) in content.items"
      :key="i"
      class="flex flex-wrap items-center gap-2 rounded-card bg-muted px-4 py-3 text-lg ring-1 ring-default"
    >
      <span class="mr-0.5 min-w-5 text-sm font-black text-primary/60">{{ i + 1 }}</span>
      <span
        v-if="it.before"
        class="font-medium"
      >{{ it.before }}</span>
      <button
        v-for="o in it.options"
        :key="o.id"
        type="button"
        :disabled="disabled"
        class="rounded-xl border-2 px-3 py-1.5 font-bold transition hover:-translate-y-px active:animate-select-pop disabled:cursor-default disabled:hover:translate-y-0"
        :class="chipClass(i, o.id)"
        @click="pick(i, o.id)"
      >
        {{ o.label }}
      </button>
      <span
        v-if="it.after"
        class="font-medium"
      >{{ it.after }}</span>
    </div>
  </div>
</template>
