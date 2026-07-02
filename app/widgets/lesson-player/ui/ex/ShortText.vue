<script setup lang="ts">
import type { LessonExercise, ShortTextContent } from '~/entities/book'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: any, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as ShortTextContent)
const text = ref('')
watch(text, v => emit('change', { response: { text: v }, ready: v.trim().length > 0 }), { immediate: true })

const inputClass = computed(() => props.status === 'correct'
  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
  : props.status === 'wrong'
    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
    : 'border-primary/40 focus:border-primary')
</script>

<template>
  <div class="flex flex-col gap-3 rounded-card bg-muted p-4 ring-1 ring-default sm:p-5">
    <p class="text-lg font-bold">
      {{ content.question }}
    </p>
    <input
      v-model="text"
      :disabled="disabled"
      type="text"
      autocomplete="off"
      class="w-full rounded-2xl border-2 bg-default px-4 py-3 text-lg outline-none transition focus:ring-4 focus:ring-primary/10 disabled:opacity-100"
      :class="inputClass"
      placeholder="Твой ответ…"
    >
    <p
      v-if="status === 'wrong' && reveal?.text"
      class="animate-pop-in inline-flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300"
    >
      <UIcon
        name="i-lucide-lightbulb"
        class="size-4"
      />Образец: {{ reveal.text }}
    </p>
  </div>
</template>
