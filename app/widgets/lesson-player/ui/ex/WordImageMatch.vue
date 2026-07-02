<script setup lang="ts">
import type { LessonExercise, WordImageMatchContent } from '~/entities/book'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: any, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as WordImageMatchContent)
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0)

const images = computed(() => content.value.pairs.map(p => ({ id: p.id, image: p.image })))
// stable "shuffle" so words don't sit under their own image (no hydration mismatch)
const words = computed(() => [...content.value.pairs].map(p => ({ id: p.id, word: p.word })).sort((a, b) => hash(a.id + a.word) - hash(b.id + b.word)))

const placement = ref<Record<string, string>>({}) // imageId -> wordId
const armedWord = ref<string | null>(null)
const usedWords = computed(() => new Set(Object.values(placement.value)))
const wordLabel = (id: string) => content.value.pairs.find(p => p.id === id)?.word ?? ''

watch(placement, p => emit('change', {
  response: { placement: p },
  ready: Object.keys(p).length === images.value.length
}), { deep: true, immediate: true })

const omit = (o: Record<string, string>, k: string) => {
  const { [k]: _drop, ...rest } = o
  return rest
}
const tapWord = (id: string) => {
  if (!props.disabled && !usedWords.value.has(id)) armedWord.value = armedWord.value === id ? null : id
}
const tapImage = (imgId: string) => {
  if (props.disabled) return
  if (placement.value[imgId]) {
    placement.value = omit(placement.value, imgId)
    return
  }
  if (!armedWord.value) return
  placement.value = { ...placement.value, [imgId]: armedWord.value }
  armedWord.value = null
}
const imgOutcome = (imgId: string) => {
  if (props.status === 'idle') return placement.value[imgId] ? 'border-primary' : 'border-default'
  return placement.value[imgId] === props.reveal?.placement?.[imgId] ? 'border-green-500' : 'border-red-500'
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="im in images"
        :key="im.id"
        type="button"
        :disabled="disabled"
        class="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition disabled:cursor-default"
        :class="imgOutcome(im.id)"
        @click="tapImage(im.id)"
      >
        <img
          v-if="isUrl(im.image)"
          :src="im.image"
          alt=""
          class="h-20 w-20 rounded-xl object-contain"
        >
        <span
          v-else
          class="text-5xl"
        >{{ im.image }}</span>
        <span class="min-h-5 text-sm font-bold text-primary">{{ placement[im.id] ? wordLabel(placement[im.id] ?? '') : '' }}</span>
      </button>
    </div>
    <div class="flex flex-wrap justify-center gap-2">
      <button
        v-for="w in words"
        v-show="!usedWords.has(w.id)"
        :key="w.id"
        type="button"
        :disabled="disabled"
        class="rounded-xl border-2 px-3 py-2 font-semibold transition disabled:cursor-default"
        :class="armedWord === w.id ? 'border-primary bg-primary/15 text-primary' : 'border-default hover:border-primary'"
        @click="tapWord(w.id)"
      >
        {{ w.word }}
      </button>
    </div>
  </div>
</template>
