<script setup lang="ts">
import type { LessonExercise, FillBlankContent } from '~/entities/book'
import type { ExerciseReveal } from '../../model/reveal'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: ExerciseReveal | null, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as FillBlankContent)
const answers = ref<string[]>(content.value.items.map(() => ''))
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)

watch(answers, a => emit('change', { response: { answers: [...a] }, ready: a.every(x => x.trim().length > 0) }), { deep: true, immediate: true })

const hasImages = computed(() => content.value.items.some(it => it.image))
// word-grid = plain word list (no `before`, short single-word answers, no images) → compact card grid
const isWordGrid = computed(() =>
  !hasImages.value
  && content.value.items.every(it => !it.before && (it.after ?? '').length > 0 && (it.after ?? '').length <= 14))

const norm = (s?: string | null) => String(s ?? '').toLowerCase().replace(/[.,!?;:'"`’]/g, '').replace(/\s+/g, ' ').trim()
const cellOk = (i: number) => norm(answers.value[i]) === norm(props.reveal?.answers?.[i])

// input border/bg per state
const inputClass = (i: number) => {
  if (props.status === 'idle') return 'border-primary/30 bg-default focus:border-primary focus:ring-4 focus:ring-primary/15'
  if (props.status === 'correct' || cellOk(i)) return 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  return 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
}
</script>

<template>
  <!-- items with illustrations -->
  <div
    v-if="hasImages"
    class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
  >
    <div
      v-for="(it, i) in content.items"
      :key="i"
      class="flex flex-col items-center gap-2 rounded-card bg-muted p-3 ring-1 ring-default transition hover:ring-primary/40"
    >
      <img
        v-if="isUrl(it.image)"
        :src="it.image"
        :alt="`item ${i + 1}`"
        class="h-24 w-24 rounded-2xl object-contain"
      >
      <span
        v-else-if="it.image"
        class="text-6xl leading-none"
      >{{ it.image }}</span>
      <input
        v-model="answers[i]"
        :disabled="disabled"
        type="text"
        autocomplete="off"
        class="w-full rounded-xl border-2 px-2 py-2 text-center text-lg font-bold outline-none transition disabled:opacity-100"
        :class="inputClass(i)"
        placeholder="…"
      >
      <span
        v-if="it.after"
        class="text-sm font-semibold text-muted"
      >{{ it.after }}</span>
    </div>
  </div>

  <!-- plain word list → compact card grid -->
  <div
    v-else-if="isWordGrid"
    class="grid grid-cols-2 gap-3 sm:grid-cols-3"
  >
    <label
      v-for="(it, i) in content.items"
      :key="i"
      class="group flex items-center gap-2.5 rounded-card bg-muted p-2.5 ring-1 ring-default transition hover:-translate-y-0.5 hover:ring-primary/50 hover:shadow-(--shadow-soft)"
    >
      <input
        v-model="answers[i]"
        :disabled="disabled"
        type="text"
        autocomplete="off"
        class="w-14 shrink-0 rounded-xl border-2 py-2 text-center text-lg font-bold outline-none transition disabled:opacity-100"
        :class="inputClass(i)"
        placeholder="…"
      >
      <span
        v-if="wordEmoji(it.after) && !(status === 'wrong' && !cellOk(i))"
        class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl leading-none ring-1 ring-primary/15 transition group-hover:scale-110"
      >{{ wordEmoji(it.after) }}</span>
      <span class="min-w-0 flex-1 truncate text-lg font-bold">{{ it.after }}</span>
      <span
        v-if="status === 'wrong' && !cellOk(i)"
        class="animate-pop-in inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300"
      >
        <UIcon
          name="i-lucide-check"
          class="size-3"
        />{{ reveal?.answers?.[i] }}
      </span>
    </label>
  </div>

  <!-- sentences / dialogue → numbered worksheet rows -->
  <div
    v-else
    class="flex flex-col gap-2.5"
  >
    <div
      v-for="(it, i) in content.items"
      :key="i"
      class="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-card bg-muted px-4 py-3 text-lg ring-1 ring-default"
    >
      <span class="mr-0.5 min-w-5 text-sm font-black text-primary/60">{{ i + 1 }}</span>
      <span
        v-if="it.before"
        class="font-medium"
      >{{ it.before }}</span>
      <input
        v-model="answers[i]"
        :disabled="disabled"
        type="text"
        autocomplete="off"
        class="w-24 rounded-xl border-2 px-2 py-1.5 text-center font-bold outline-none transition disabled:opacity-100"
        :class="inputClass(i)"
        placeholder="…"
      >
      <span
        v-if="it.after"
        class="font-medium"
      >{{ it.after }}</span>
      <span
        v-if="status === 'wrong' && !cellOk(i)"
        class="animate-pop-in ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300"
      >
        <UIcon
          name="i-lucide-check"
          class="size-3.5"
        />{{ reveal?.answers?.[i] }}
      </span>
    </div>
  </div>
</template>
