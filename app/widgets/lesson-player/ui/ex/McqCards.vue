<script setup lang="ts">
import type { LessonExercise, McqContent } from '~/entities/book'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: any, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as McqContent)
const selected = ref<string>('')
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)
const hasImages = computed(() => content.value.options.some(o => o.image))

// Friendly emoji cue for object words (e.g. "___ apple" → 🍎) when no image is
// set, so picture-oriented items stay solvable/clear. wordEmoji returns '' for
// non-objects (grammar words), so nothing shows there.
const questionEmoji = computed(() => {
  if (content.value.image) return ''
  const words = (content.value.question ?? '').replace(/[_.,!?;:()"']/g, ' ').split(/\s+/).filter(Boolean)
  for (const w of words) {
    const e = wordEmoji(w)
    if (e) return e
  }
  return ''
})

watch(selected, v => emit('change', { response: { optionId: v }, ready: !!v }), { immediate: true })
const pick = (id: string) => {
  if (!props.disabled) selected.value = id
}

const cardClass = (id: string) => {
  const chosen = selected.value === id
  if (props.status !== 'idle') {
    if (id === props.reveal?.optionId) return 'border-green-500 bg-green-100 dark:bg-green-900/40'
    if (chosen) return 'border-red-500 bg-red-100 dark:bg-red-900/40'
    return 'border-default opacity-60'
  }
  return chosen ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-(--shadow-soft)' : 'border-primary/20 bg-muted hover:border-primary hover:bg-primary/5'
}
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <img
      v-if="isUrl(content.image)"
      :src="content.image"
      alt=""
      class="h-36 w-36 rounded-2xl object-contain shadow-sm"
    >
    <span
      v-else-if="content.image"
      class="text-7xl"
    >{{ content.image }}</span>
    <span
      v-else-if="questionEmoji"
      class="text-7xl leading-none"
    >{{ questionEmoji }}</span>
    <p
      v-if="content.question"
      class="text-center text-xl font-bold"
    >
      {{ content.question }}
    </p>

    <div
      class="grid w-full gap-3"
      :class="hasImages ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'"
    >
      <button
        v-for="o in content.options"
        :key="o.id"
        type="button"
        :disabled="disabled"
        class="duo-tile flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-lg font-bold disabled:cursor-default"
        :class="cardClass(o.id)"
        @click="pick(o.id)"
      >
        <img
          v-if="isUrl(o.image)"
          :src="o.image"
          alt=""
          class="h-20 w-20 rounded-xl object-contain"
        >
        <span
          v-else-if="o.image"
          class="text-5xl"
        >{{ o.image }}</span>
        <span
          v-else-if="wordEmoji(o.label)"
          class="text-5xl leading-none"
        >{{ wordEmoji(o.label) }}</span>
        <span v-if="o.label">{{ o.label }}</span>
      </button>
    </div>
  </div>
</template>
