<script setup lang="ts">
import type { LessonExercise, MatchPairsContent } from '~/entities/book'

const props = defineProps<{ exercise: LessonExercise, status: 'idle' | 'correct' | 'wrong', reveal: any, disabled: boolean }>()
const emit = defineEmits<{ (e: 'change', v: { response: Record<string, unknown>, ready: boolean }): void }>()

const content = computed(() => props.exercise.content as MatchPairsContent)
const pairs = ref<Record<string, string>>({}) // leftId -> rightId
const armedLeft = ref<string | null>(null)

const COLORS = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500']

watch(pairs, p => emit('change', {
  response: { pairs: Object.entries(p).map(([l, r]) => ({ l, r })) },
  ready: Object.keys(p).length === content.value.left.length
}), { deep: true, immediate: true })

const rightToLeft = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const [l, r] of Object.entries(pairs.value)) m[r] = l
  return m
})
const colorFor = (leftId: string) => {
  const idx = content.value.left.findIndex(o => o.id === leftId)
  return COLORS[idx % COLORS.length]
}

const omit = (o: Record<string, string>, k: string) => {
  const { [k]: _drop, ...rest } = o
  return rest
}
const tapLeft = (id: string) => {
  if (props.disabled) return
  if (pairs.value[id]) {
    pairs.value = omit(pairs.value, id)
    armedLeft.value = null
    return
  }
  armedLeft.value = armedLeft.value === id ? null : id
}
const tapRight = (id: string) => {
  if (props.disabled) return
  const l = rightToLeft.value[id]
  if (l) {
    pairs.value = omit(pairs.value, l)
    return
  }
  if (!armedLeft.value) return
  pairs.value = { ...pairs.value, [armedLeft.value]: id }
  armedLeft.value = null
}

// after check: is this left's pair correct?
const leftOutcome = (id: string) => {
  if (props.status === 'idle') return ''
  const want = (props.reveal?.pairs ?? []).find((p: any) => p.l === id)?.r
  return pairs.value[id] === want ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <button
        v-for="o in content.left"
        :key="o.id"
        type="button"
        :disabled="disabled"
        class="flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left font-semibold transition disabled:cursor-default"
        :class="[
          armedLeft === o.id ? 'border-primary bg-primary/10' : 'border-default hover:border-primary',
          leftOutcome(o.id)
        ]"
        @click="tapLeft(o.id)"
      >
        <span
          v-if="pairs[o.id]"
          class="size-3 shrink-0 rounded-full"
          :class="colorFor(o.id)"
        />
        <span class="min-w-0">{{ o.label }}</span>
      </button>
    </div>
    <div class="flex flex-col gap-2">
      <button
        v-for="o in content.right"
        :key="o.id"
        type="button"
        :disabled="disabled"
        class="flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left font-semibold transition disabled:cursor-default"
        :class="rightToLeft[o.id] ? 'border-default' : 'border-default hover:border-primary'"
        @click="tapRight(o.id)"
      >
        <span
          v-if="rightToLeft[o.id]"
          class="size-3 shrink-0 rounded-full"
          :class="colorFor(rightToLeft[o.id] ?? '')"
        />
        <span class="min-w-0">{{ o.label }}</span>
      </button>
    </div>
  </div>
</template>
