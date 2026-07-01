<script setup lang="ts">
import type { CapsuleLayer, ExplanationContent, LayerProgress } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as ExplanationContent)
const chunks = computed(() => content.value.chunks ?? [])
const checks = computed(() => content.value.checks ?? [])
const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

// S14 — Феми приветствует ребёнка голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => greetLayer('EXPLANATION'))

// Micro-checks flow — one at a time.
const checkIdx = ref(0)
const checkAnswers = ref<Record<string, { pickedIndex: number, correct: boolean }>>({})
const checkRevealed = ref<Record<string, boolean>>({})
const submitting = ref(false)

const currentCheck = computed(() => checks.value[checkIdx.value] ?? null)
const currentCheckAnswer = computed(() =>
  currentCheck.value ? checkAnswers.value[currentCheck.value.id] : undefined
)
const currentCheckRevealed = computed(() =>
  currentCheck.value ? !!checkRevealed.value[currentCheck.value.id] : false
)

const pickCheck = (optIndex: number) => {
  const q = currentCheck.value
  if (!q || currentCheckRevealed.value || isCompleted.value) return
  checkAnswers.value[q.id] = { pickedIndex: optIndex, correct: optIndex === q.correctIndex }
}
const revealCheck = () => {
  const q = currentCheck.value
  if (!q || !currentCheckAnswer.value) return
  checkRevealed.value[q.id] = true
}
const nextCheck = () => {
  if (checkIdx.value < checks.value.length - 1) checkIdx.value += 1
}

const allChecksDone = computed(() =>
  checks.value.length === 0 || checks.value.every(c => !!checkRevealed.value[c.id])
)
const correctChecks = computed(() =>
  checks.value.reduce((s, c) => s + (checkAnswers.value[c.id]?.correct ? 1 : 0), 0)
)

const finish = async () => {
  if (!allChecksDone.value || submitting.value || isCompleted.value) return
  submitting.value = true
  try {
    emit('complete', {
      interactionData: {
        interactions: checks.value.map(c => ({
          qId: c.id,
          correct: checkAnswers.value[c.id]?.correct ?? false
        })),
        readChunks: chunks.value.length
      },
      score: correctChecks.value,
      maxScore: checks.value.length || 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const checkOptClass = (optIndex: number) => {
  const q = currentCheck.value
  if (!q) return ''
  const ans = currentCheckAnswer.value
  const rev = currentCheckRevealed.value
  const isPicked = ans?.pickedIndex === optIndex
  const isCorrect = q.correctIndex === optIndex

  if (!rev) return isPicked ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/40'
  if (isCorrect) return 'border-emerald-500 bg-emerald-500/10'
  if (isPicked) return 'border-rose-500 bg-rose-500/10'
  return 'border-default opacity-60'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
      <UIcon
        name="i-lucide-graduation-cap"
        class="size-3.5"
      />
      Разбираем тему по-настоящему
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        state="teach"
        size="md"
      />
      <div class="flex-1">
        <h2 class="text-xl sm:text-2xl font-black text-highlighted">
          {{ layer.title }}
        </h2>
        <p
          v-if="layer.subtitle"
          class="mt-1 text-sm text-muted"
        >
          {{ layer.subtitle }}
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         CONTENT CHUNKS
         ═══════════════════════════════════════════════════════════════ -->
    <div class="space-y-4 stagger-fade">
      <template
        v-for="(chunk, idx) in chunks"
        :key="chunk.id"
      >
        <!-- Callout (main idea) -->
        <div
          v-if="chunk.kind === 'callout'"
          class="rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/5 p-4"
        >
          <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
            <UIcon
              name="i-lucide-lightbulb"
              class="size-3.5"
            />
            <span class="flex-1">Главная мысль</span>
          </div>
          <div
            class="mt-2 prose prose-sm dark:prose-invert max-w-none"
            v-html="renderMath(chunk.content)"
          />
        </div>

        <!-- Comic strip (мини-комикс из эмодзи-панелей) -->
        <ComicStrip
          v-else-if="chunk.kind === 'comic' && chunk.panels?.length"
          :panels="chunk.panels"
          :title="chunk.content"
        />

        <!-- Tap-reveal (карточка "нажми, чтобы узнать") -->
        <TapReveal
          v-else-if="chunk.kind === 'tap-reveal'"
          :teaser="chunk.content"
          :hint="chunk.note"
          accent="amber"
        >
          <div
            v-if="chunk.revealedKind === 'formula'"
            data-formula
            class="text-lg sm:text-xl text-highlighted [&_.katex]:text-inherit"
            v-html="renderMath(`$$${chunk.revealedContent ?? ''}$$`)"
          />
          <div
            v-else
            class="prose prose-sm dark:prose-invert max-w-none"
            v-html="renderMath(chunk.revealedContent ?? '')"
          />
          <p
            v-if="chunk.revealedHint"
            class="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
          >
            <UIcon
              name="i-lucide-pin"
              class="size-3 mr-1 inline"
            />
            {{ chunk.revealedHint }}
          </p>
        </TapReveal>

        <!-- Formula -->
        <div
          v-else-if="chunk.kind === 'formula'"
          data-formula
          class="rounded-2xl border border-default bg-linear-to-br from-violet-500/5 to-purple-500/5 px-4 sm:px-6 py-6 sm:py-8 text-center"
        >
          <div
            class="text-xl sm:text-2xl md:text-3xl text-highlighted [&_.katex]:text-inherit"
            v-html="renderMath(`$$${chunk.content}$$`)"
          />
          <div
            v-if="chunk.note"
            class="mt-2 text-xs text-muted"
          >
            {{ chunk.note }}
          </div>
        </div>

        <!-- Image -->
        <img
          v-else-if="chunk.kind === 'image'"
          :src="chunk.content"
          :alt="chunk.note ?? ''"
          class="rounded-2xl w-full"
        >

        <!-- Text (default) -->
        <div
          v-else
          class="space-y-2"
        >
          <div
            class="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-highlighted"
            :class="chunk.emphasis ? 'font-semibold' : ''"
            v-html="renderMath(chunk.content)"
          />
          <div
            v-if="chunk.note"
            class="text-xs text-muted italic"
          >
            {{ chunk.note }}
          </div>
          <div class="text-[10px] text-muted tabular-nums">
            {{ idx + 1 }}
          </div>
        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         MICRO-CHECKS
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="currentCheck && !allChecksDone"
      class="rounded-2xl border border-default bg-(--ui-bg) p-5"
    >
      <div class="mb-3 flex items-center gap-2 text-xs">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
          <UIcon
            name="i-lucide-check-circle-2"
            class="size-3"
          />
          Мини-проверка {{ checkIdx + 1 }} / {{ checks.length }}
        </span>
      </div>

      <p class="mb-3 text-sm font-semibold text-highlighted">
        {{ currentCheck.prompt }}
      </p>

      <div class="space-y-2">
        <button
          v-for="(opt, optIdx) in currentCheck.options"
          :key="optIdx"
          type="button"
          :disabled="currentCheckRevealed || isCompleted"
          class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-elevated px-4 py-3 text-left text-sm transition-all disabled:cursor-not-allowed"
          :class="checkOptClass(optIdx)"
          @click="pickCheck(optIdx)"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
            :class="currentCheckAnswer?.pickedIndex === optIdx ? 'border-primary bg-primary text-white' : 'border-default text-muted'"
          >
            {{ String.fromCharCode(65 + optIdx) }}
          </span>
          <span class="min-w-0 flex-1 text-highlighted wrap-break-word">{{ opt }}</span>
        </button>
      </div>

      <div
        v-if="currentCheckRevealed && currentCheck.explanation"
        class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-highlighted"
      >
        <span class="font-semibold text-emerald-600 dark:text-emerald-300">Пояснение: </span>
        {{ currentCheck.explanation }}
      </div>

      <div class="mt-3 flex justify-end gap-2">
        <UButton
          v-if="!currentCheckRevealed"
          :disabled="!currentCheckAnswer"
          size="sm"
          color="primary"
          @click="revealCheck"
        >
          Проверить
        </UButton>
        <UButton
          v-else-if="checkIdx < checks.length - 1"
          size="sm"
          color="primary"
          @click="nextCheck"
        >
          Дальше
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Finish -->
    <div
      v-if="allChecksDone && !isCompleted"
      class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="celebrate"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            Разобрались с главной идеей.
          </p>
          <p class="mt-1 text-xs text-muted">
            Мини-проверки: {{ correctChecks }} из {{ checks.length }}. Следующий слой — строгий язык.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            Далее
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </UButton>
        </div>
      </div>
    </div>

    <div
      v-else-if="isCompleted"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="size-4 text-emerald-500"
      />
      Слой пройден — нажми «Далее» слева.
    </div>
  </div>
</template>
