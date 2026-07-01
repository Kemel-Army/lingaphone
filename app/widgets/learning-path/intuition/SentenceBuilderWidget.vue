<script setup lang="ts">
/**
 * SentenceBuilderWidget — собери предложение из слов-плиток по порядку.
 * Тап по слову добавляет его в строку; тап по слову в строке убирает.
 * Кнопка «Проверить» сверяет порядок с correct.
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'sentence-builder' }>
}>()

const { play } = useSound()

const bank = computed(() => props.config.tokens ?? [])
const correct = computed(() => props.config.correct ?? [])

// Track chosen tokens by their index in the bank (tokens may repeat).
const chosen = ref<number[]>([])
const checked = ref(false)

const available = computed(() => bank.value.map((t, i) => ({ t, i })).filter(x => !chosen.value.includes(x.i)))
const built = computed(() => chosen.value.map(i => bank.value[i] ?? ''))
const isCorrect = computed(() =>
  built.value.length === correct.value.length && built.value.every((w, i) => w === correct.value[i])
)

const addToken = (i: number) => {
  if (checked.value) return
  chosen.value = [...chosen.value, i]
  play('pop')
}
const removeAt = (pos: number) => {
  if (checked.value) return
  chosen.value = chosen.value.filter((_, p) => p !== pos)
  play('click')
}
const check = () => {
  checked.value = true
  play(isCorrect.value ? 'correct' : 'wrong')
}
const reset = () => {
  chosen.value = []
  checked.value = false
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5">
    <div class="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted">
      Собери предложение
    </div>

    <!-- Built sentence -->
    <div
      class="mb-4 flex min-h-14 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors"
      :class="checked ? (isCorrect ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500 bg-rose-500/5') : 'border-default bg-elevated'"
    >
      <span
        v-if="!built.length"
        class="text-sm text-muted"
      >
        Нажимай на слова ниже…
      </span>
      <button
        v-for="(w, pos) in built"
        :key="pos"
        type="button"
        class="rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm font-bold text-primary transition hover:bg-rose-500/10 hover:border-rose-400"
        @click="removeAt(pos)"
      >
        {{ w }}
      </button>
    </div>

    <!-- Token bank -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="x in available"
        :key="x.i"
        type="button"
        class="rounded-lg border-2 border-default bg-elevated px-3 py-1.5 text-sm font-bold text-highlighted transition hover:border-primary/40 hover:scale-105"
        @click="addToken(x.i)"
      >
        {{ x.t }}
      </button>
    </div>

    <!-- Feedback -->
    <div
      v-if="checked"
      class="mt-4 flex items-center justify-between gap-3"
    >
      <span
        class="flex items-center gap-2 text-sm font-bold"
        :class="isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'"
      >
        <UIcon
          :name="isCorrect ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
          class="size-4"
        />
        {{ isCorrect ? 'Верно!' : (props.config.correct?.join(' ')) }}
      </span>
      <UButton
        v-if="!isCorrect"
        size="sm"
        variant="soft"
        icon="i-lucide-rotate-ccw"
        @click="reset"
      >
        Ещё раз
      </UButton>
    </div>
    <div
      v-else
      class="mt-4 flex justify-end"
    >
      <UButton
        size="sm"
        color="primary"
        :disabled="!built.length"
        @click="check"
      >
        Проверить
      </UButton>
    </div>

    <p
      v-if="props.config.translation"
      class="mt-3 text-center text-xs text-muted"
    >
      {{ props.config.translation }}
    </p>
  </div>
</template>
