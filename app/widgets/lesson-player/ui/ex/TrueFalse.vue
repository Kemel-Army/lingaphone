<script setup lang="ts">
import type { LessonExercise, TrueFalseContent } from '~/entities/book'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: any, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as TrueFalseContent)
const value = ref<boolean | null>(null)

watch(value, v => emit('change', { response: { value: v }, ready: v !== null }), { immediate: true })
const pick = (v: boolean) => {
  if (!props.disabled) value.value = v
}

const btnClass = (v: boolean, tone: 'green' | 'red') => {
  const chosen = value.value === v
  if (props.status !== 'idle') {
    if (v === props.reveal?.value) return 'border-green-500 bg-green-100 dark:bg-green-900/40'
    if (chosen) return 'border-red-500 bg-red-100 dark:bg-red-900/40'
    return 'border-default opacity-60'
  }
  if (chosen) return tone === 'green' ? 'border-green-500 bg-green-500/15' : 'border-red-500 bg-red-500/15'
  return 'border-default hover:border-primary'
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <p class="max-w-lg text-center text-2xl font-bold">
      {{ content.statement }}
    </p>
    <div class="grid w-full max-w-md grid-cols-2 gap-4">
      <button
        type="button"
        :disabled="disabled"
        class="duo-tile flex items-center justify-center gap-2 rounded-2xl border-2 py-6 text-xl font-black disabled:cursor-default"
        :class="btnClass(true, 'green')"
        @click="pick(true)"
      >
        <UIcon
          name="i-lucide-check"
          class="size-6"
        /> True
      </button>
      <button
        type="button"
        :disabled="disabled"
        class="duo-tile flex items-center justify-center gap-2 rounded-2xl border-2 py-6 text-xl font-black disabled:cursor-default"
        :class="btnClass(false, 'red')"
        @click="pick(false)"
      >
        <UIcon
          name="i-lucide-x"
          class="size-6"
        /> False
      </button>
    </div>
  </div>
</template>
