<script setup lang="ts">
/**
 * WordPictureMatchWidget — соедини слово с картинкой (эмодзи/фото).
 * Тап по слову → тап по картинке. Совпало → зелёное + pop + звук.
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'word-picture-match' }>
}>()

const { play } = useSound()

const pairs = computed(() => props.config.pairs ?? [])

// Deterministic shuffle for the picture column (stable across SSR/CSR).
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
const pictures = computed(() =>
  [...pairs.value].sort((a, b) => hash(a.id + 'pic') - hash(b.id + 'pic'))
)

const selectedWord = ref<string | null>(null)
const matched = ref<Set<string>>(new Set())
const wrongId = ref<string | null>(null)

const pickWord = (id: string) => {
  if (matched.value.has(id)) return
  selectedWord.value = selectedWord.value === id ? null : id
  play('click')
}

const pickPicture = (id: string) => {
  if (matched.value.has(id)) return
  if (!selectedWord.value) return
  if (selectedWord.value === id) {
    matched.value = new Set([...matched.value, id])
    selectedWord.value = null
    play('correct')
  } else {
    wrongId.value = id
    play('wrong')
    setTimeout(() => {
      wrongId.value = null
    }, 500)
  }
}

const allMatched = computed(() => pairs.value.length > 0 && matched.value.size === pairs.value.length)
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5">
    <div class="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
      Соедини слово и картинку
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- Words -->
      <div class="flex flex-col gap-2">
        <button
          v-for="p in pairs"
          :key="p.id"
          type="button"
          :disabled="matched.has(p.id)"
          class="rounded-xl border-2 px-3 py-3 text-center text-sm font-bold transition-all"
          :class="matched.has(p.id)
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 opacity-70'
            : selectedWord === p.id
              ? 'border-primary bg-primary/10 scale-105'
              : 'border-default bg-elevated hover:border-primary/40'"
          @click="pickWord(p.id)"
        >
          {{ p.word }}
        </button>
      </div>

      <!-- Pictures -->
      <div class="flex flex-col gap-2">
        <button
          v-for="p in pictures"
          :key="p.id"
          type="button"
          :disabled="matched.has(p.id)"
          class="flex items-center justify-center rounded-xl border-2 px-3 py-3 text-3xl transition-all"
          :class="[
            matched.has(p.id)
              ? 'border-emerald-500 bg-emerald-500/10 opacity-70'
              : 'border-default bg-elevated hover:border-primary/40',
            wrongId === p.id ? 'wpm-shake border-rose-500' : ''
          ]"
          @click="pickPicture(p.id)"
        >
          <img
            v-if="p.imageUrl"
            :src="p.imageUrl"
            :alt="p.word"
            class="h-12 w-12 rounded-lg object-cover"
          >
          <span v-else>{{ p.emoji ?? '❓' }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="allMatched"
      class="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-300"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="size-4"
      />
      Все пары найдены!
    </div>
  </div>
</template>

<style scoped>
@keyframes wpm-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.wpm-shake { animation: wpm-shake 0.4s ease; }
</style>
