<script setup lang="ts">
/**
 * GapFillWidget — вставь пропущенное слово в предложение.
 * "before ___ after" + плитки-варианты; тап заполняет пропуск.
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'gap-fill' }>
}>()

const { play } = useSound()

const options = computed(() => props.config.options ?? [])
const picked = ref<number | null>(null)
const revealed = ref(false)

const pick = (i: number) => {
  if (revealed.value) return
  picked.value = i
  revealed.value = true
  play(i === props.config.correctIndex ? 'correct' : 'wrong')
}

const gapText = computed(() => {
  if (picked.value == null) return '_____'
  return options.value[picked.value] ?? '_____'
})

const gapClass = computed(() => {
  if (!revealed.value) return 'text-primary'
  return picked.value === props.config.correctIndex ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
})

const optClass = (i: number) => {
  if (!revealed.value) return 'border-default bg-elevated hover:border-primary/40'
  if (i === props.config.correctIndex) return 'border-emerald-500 bg-emerald-500/10'
  if (i === picked.value) return 'border-rose-500 bg-rose-500/10'
  return 'border-default opacity-60'
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5">
    <div class="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
      Вставь пропущенное слово
    </div>

    <p class="mb-5 text-center text-lg font-bold leading-relaxed text-highlighted">
      {{ props.config.before }}
      <span
        class="mx-1 inline-block min-w-16 border-b-2 border-dashed px-2 font-black transition"
        :class="gapClass"
      >{{ gapText }}</span>
      {{ props.config.after }}
    </p>

    <div class="grid gap-2 sm:grid-cols-2">
      <button
        v-for="(opt, i) in options"
        :key="i"
        type="button"
        :disabled="revealed"
        class="rounded-xl border-2 px-4 py-3 text-center text-sm font-bold transition-all disabled:cursor-not-allowed"
        :class="optClass(i)"
        @click="pick(i)"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>
