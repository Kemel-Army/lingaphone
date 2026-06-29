<script setup lang="ts">
// Universal mini-game renderer (ТЗ AC §6: same component, dynamic JSON config).
// Picks a mechanic by `game.slug`; content comes entirely from `game.config`.
import type { Game } from '../model/types'
import { isWordPuzzle } from '../model/types'

const props = defineProps<{ game: Game }>()
const emit = defineEmits<{ complete: [payload: { correct: number, total: number }] }>()

// ── word-puzzle ───────────────────────────────────────────────
const words = computed<string[]>(() =>
  isWordPuzzle(props.game.slug, props.game.config) ? props.game.config.words : []
)

const idx = ref(0)
const answer = ref('')
const correct = ref(0)
const feedback = ref<'idle' | 'right' | 'wrong'>('idle')
const finished = ref(false)

const current = computed(() => words.value[idx.value] ?? '')

const scramble = (w: string) => {
  // Deterministic-ish shuffle without Math.random (env-restricted): reverse +
  // rotate by length so it differs from the source word but is stable.
  const chars = w.split('')
  const rot = Math.max(1, chars.length % 3)
  return [...chars.slice(rot), ...chars.slice(0, rot)].reverse().join(' ')
}
const scrambled = computed(() => scramble(current.value))

const check = () => {
  if (!answer.value.trim()) return
  if (answer.value.trim().toLowerCase() === current.value.toLowerCase()) {
    correct.value++
    feedback.value = 'right'
  } else {
    feedback.value = 'wrong'
  }
  setTimeout(next, 700)
}

const next = () => {
  answer.value = ''
  feedback.value = 'idle'
  if (idx.value < words.value.length - 1) {
    idx.value++
  } else {
    finished.value = true
    emit('complete', { correct: correct.value, total: words.value.length })
  }
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-default p-6">
    <!-- word-puzzle -->
    <div v-if="words.length && !finished">
      <p class="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
        {{ game.title }}
      </p>
      <p class="mb-4 text-xs text-muted">
        Слово {{ idx + 1 }} из {{ words.length }} · собери слово из букв
      </p>

      <div class="mb-4 flex justify-center gap-2 text-2xl font-black tracking-[0.3em]">
        {{ scrambled.toUpperCase() }}
      </div>

      <UInput
        v-model="answer"
        placeholder="Введите слово"
        size="lg"
        :color="feedback === 'wrong' ? 'error' : feedback === 'right' ? 'success' : 'primary'"
        autofocus
        @keyup.enter="check"
      />

      <div class="mt-4 flex items-center justify-between">
        <span class="text-sm text-muted">Верно: {{ correct }}</span>
        <UButton
          label="Проверить"
          icon="i-lucide-check"
          :disabled="!answer.trim()"
          @click="check"
        />
      </div>
    </div>

    <!-- finished -->
    <div
      v-else-if="finished"
      class="py-6 text-center"
    >
      <UIcon
        name="i-lucide-party-popper"
        class="mx-auto mb-3 size-10 text-primary"
      />
      <p class="text-lg font-black">
        Готово! {{ correct }} / {{ words.length }}
      </p>
    </div>

    <!-- unsupported mechanic -->
    <div
      v-else
      class="py-6 text-center text-sm text-muted"
    >
      <UIcon
        name="i-lucide-construction"
        class="mx-auto mb-2 size-8"
      />
      Механика «{{ game.slug }}» пока не поддерживается этим рендером.
    </div>
  </div>
</template>
