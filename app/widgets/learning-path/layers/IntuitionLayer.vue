<script setup lang="ts">
import type { CapsuleLayer, IntuitionContent, LayerProgress } from '~/entities/learning-path'
import {
  WordPictureMatchWidget,
  SentenceBuilderWidget,
  ListenAndPickWidget,
  GapFillWidget,
  PlaceValueBlocksWidget,
  ClockWidget,
  BalanceScaleWidget,
  NumberLineWidget,
  GroupingWidget,
  SetVennWidget,
  AngleProtractorWidget
} from '~/widgets/learning-path/intuition'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as IntuitionContent)
const widget = computed(() => content.value.widget)
const probes = computed(() => content.value.probes ?? [])
const startedAt = Date.now()

// S14 — Феми приветствует ребёнка голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => greetLayer('INTUITION'))

const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

// ────────────────────────────────────────────────────────────────
// Array-grid widget state (rows × cols of animated dots)
// ────────────────────────────────────────────────────────────────
const rows = ref(3)
const cols = ref(4)

watch(widget, (w) => {
  if (w.type === 'array-grid') {
    rows.value = w.defaultRows
    cols.value = w.defaultCols
  }
}, { immediate: true })

const incRows = () => {
  if (widget.value.type !== 'array-grid') return
  if (rows.value < widget.value.maxRows) rows.value += 1
}
const decRows = () => {
  if (widget.value.type !== 'array-grid') return
  if (rows.value > widget.value.minRows) rows.value -= 1
}
const incCols = () => {
  if (widget.value.type !== 'array-grid') return
  if (cols.value < widget.value.maxCols) cols.value += 1
}
const decCols = () => {
  if (widget.value.type !== 'array-grid') return
  if (cols.value > widget.value.minCols) cols.value -= 1
}

const total = computed(() => rows.value * cols.value)
const dots = computed(() => Array.from({ length: total.value }, (_, i) => i))

// ────────────────────────────────────────────────────────────────
// Probe flow — answer one question at a time
// ────────────────────────────────────────────────────────────────
const probeIdx = ref(0)
const probeAnswers = ref<Record<string, { pickedIndex: number, correct: boolean }>>({})
const probeRevealed = ref<Record<string, boolean>>({})

const currentProbe = computed(() => probes.value[probeIdx.value] ?? null)
const currentProbeAnswer = computed(() =>
  currentProbe.value ? probeAnswers.value[currentProbe.value.id] : undefined
)
const currentProbeRevealed = computed(() =>
  currentProbe.value ? !!probeRevealed.value[currentProbe.value.id] : false
)

const pickProbe = (optIndex: number) => {
  const q = currentProbe.value
  if (!q || currentProbeRevealed.value || isCompleted.value) return
  probeAnswers.value[q.id] = { pickedIndex: optIndex, correct: optIndex === q.correctIndex }
}
const revealProbe = () => {
  const q = currentProbe.value
  if (!q || !currentProbeAnswer.value) return
  probeRevealed.value[q.id] = true
}
const nextProbe = () => {
  if (probeIdx.value < probes.value.length - 1) probeIdx.value += 1
}

const allProbesDone = computed(() =>
  probes.value.length === 0
  || probes.value.every(p => !!probeRevealed.value[p.id])
)

const correctProbes = computed(() =>
  probes.value.reduce((s, p) => s + (probeAnswers.value[p.id]?.correct ? 1 : 0), 0)
)

const submitting = ref(false)

const finish = async () => {
  if (!allProbesDone.value || submitting.value || isCompleted.value) return
  submitting.value = true
  try {
    emit('complete', {
      interactionData: {
        interactions: probes.value.map(p => ({
          qId: p.id,
          correct: probeAnswers.value[p.id]?.correct ?? false
        })),
        lastRows: rows.value,
        lastCols: cols.value
      },
      score: correctProbes.value,
      maxScore: probes.value.length || 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const probeOptClass = (optIndex: number) => {
  const q = currentProbe.value
  if (!q) return ''
  const ans = currentProbeAnswer.value
  const rev = currentProbeRevealed.value
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
    <div class="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
      <UIcon
        name="i-lucide-wand-sparkles"
        class="size-3.5"
      />
      Почувствуй, а не заучи
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        state="teach"
        size="md"
      />
      <div class="flex-1">
        <h2 class="text-xl sm:text-2xl font-black text-highlighted">
          {{ content.copy?.headline ?? layer.title }}
        </h2>
        <p
          v-if="content.copy?.body"
          class="mt-1 text-sm text-muted"
        >
          {{ content.copy.body }}
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         WIDGET DISPATCH — выбор виджета по widget.type
         (новые виджеты — отдельные компоненты; array-grid пока inline)
         ═══════════════════════════════════════════════════════════════ -->
    <WordPictureMatchWidget
      v-if="widget.type === 'word-picture-match'"
      :config="widget"
    />
    <SentenceBuilderWidget
      v-else-if="widget.type === 'sentence-builder'"
      :config="widget"
    />
    <ListenAndPickWidget
      v-else-if="widget.type === 'listen-and-pick'"
      :config="widget"
    />
    <GapFillWidget
      v-else-if="widget.type === 'gap-fill'"
      :config="widget"
    />
    <PlaceValueBlocksWidget
      v-else-if="widget.type === 'place-value-blocks'"
      :config="widget"
    />
    <ClockWidget
      v-else-if="widget.type === 'clock'"
      :config="widget"
    />
    <BalanceScaleWidget
      v-else-if="widget.type === 'balance-scale'"
      :config="widget"
    />
    <NumberLineWidget
      v-else-if="widget.type === 'number-line'"
      :config="widget"
    />
    <GroupingWidget
      v-else-if="widget.type === 'grouping'"
      :config="widget"
    />
    <SetVennWidget
      v-else-if="widget.type === 'set-venn'"
      :config="widget"
    />
    <AngleProtractorWidget
      v-else-if="widget.type === 'angle-protractor'"
      :config="widget"
    />

    <!-- ═══════════════════════════════════════════════════════════════
         WIDGET — array-grid (rows × cols of dots) — legacy inline
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-else-if="widget.type === 'array-grid'"
      class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5"
    >
      <div class="flex flex-col items-center gap-5">
        <!-- Result display -->
        <div class="w-full max-w-md text-center">
          <div class="text-xs font-semibold uppercase tracking-wider text-muted">
            Твоя картинка
          </div>
          <div class="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 sm:gap-x-3 font-black tabular-nums text-highlighted text-3xl sm:text-4xl md:text-5xl">
            <span class="text-cyan-500">{{ rows }}</span>
            <span class="text-muted">×</span>
            <span class="text-sky-500">{{ cols }}</span>
            <span class="text-muted">=</span>
            <span class="text-primary">{{ total }}</span>
          </div>
          <div class="mt-1 text-[11px] text-muted">
            {{ rows }} {{ rows === 1 ? 'ряд' : 'ряда/рядов' }} · в каждом по {{ cols }} {{ cols === 1 ? 'предмет' : 'предмета/ов' }}
          </div>
        </div>

        <!-- Dot grid (горизонтальный скролл при больших размерах вместо вылазящего layout) -->
        <div class="max-w-full overflow-x-auto">
          <div
            class="grid gap-1.5 p-3 rounded-xl bg-elevated border border-default w-fit mx-auto"
            :style="{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
            }"
          >
            <div
              v-for="i in dots"
              :key="i"
              class="size-6 sm:size-7 rounded-full bg-linear-to-br from-cyan-400 to-sky-500 shadow-sm transition-all"
            />
          </div>
        </div>

        <!-- Controls -->
        <div class="grid grid-cols-2 gap-3 w-full max-w-md">
          <div class="rounded-xl border border-default bg-elevated p-3">
            <div class="text-[10px] font-semibold uppercase tracking-wider text-muted text-center mb-2">
              Ряды
            </div>
            <div class="flex items-center justify-between gap-2">
              <UButton
                icon="i-lucide-minus"
                size="sm"
                variant="soft"
                color="neutral"
                :disabled="rows <= (widget.type === 'array-grid' ? widget.minRows : 1)"
                @click="decRows"
              />
              <span class="text-2xl font-black tabular-nums text-cyan-500">{{ rows }}</span>
              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                color="primary"
                :disabled="rows >= (widget.type === 'array-grid' ? widget.maxRows : 10)"
                @click="incRows"
              />
            </div>
          </div>
          <div class="rounded-xl border border-default bg-elevated p-3">
            <div class="text-[10px] font-semibold uppercase tracking-wider text-muted text-center mb-2">
              В ряду
            </div>
            <div class="flex items-center justify-between gap-2">
              <UButton
                icon="i-lucide-minus"
                size="sm"
                variant="soft"
                color="neutral"
                :disabled="cols <= (widget.type === 'array-grid' ? widget.minCols : 1)"
                @click="decCols"
              />
              <span class="text-2xl font-black tabular-nums text-sky-500">{{ cols }}</span>
              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                color="primary"
                :disabled="cols >= (widget.type === 'array-grid' ? widget.maxCols : 10)"
                @click="incCols"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         FALLBACK — виджет ещё не реализован
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-else
      class="rounded-2xl border border-dashed border-rose-400/60 bg-rose-500/5 p-5 text-center"
    >
      <UIcon
        name="i-lucide-construction"
        class="size-8 text-rose-500"
      />
      <div class="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-300">
        Виджет «{{ widget.type }}» ещё не реализован
      </div>
      <div class="mt-1 text-xs text-muted">
        Probes ниже работают — пройди вопросы, чтобы продолжить.
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         PROBES — follow-up questions
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="currentProbe && !allProbesDone"
      class="rounded-2xl border border-default bg-(--ui-bg) p-5"
    >
      <div class="mb-3 flex items-center gap-2 text-xs">
        <span class="font-semibold text-highlighted">
          Вопрос {{ probeIdx + 1 }} из {{ probes.length }}
        </span>
        <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <span
            class="block h-full bg-cyan-500 transition-all duration-300"
            :style="{ width: `${((probeIdx + 1) / probes.length) * 100}%` }"
          />
        </span>
      </div>

      <p class="mb-3 text-sm font-semibold text-highlighted">
        {{ currentProbe.prompt }}
      </p>

      <div class="space-y-2">
        <button
          v-for="(opt, optIdx) in currentProbe.options"
          :key="optIdx"
          type="button"
          :disabled="currentProbeRevealed || isCompleted"
          class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-elevated px-4 py-3 text-left text-sm transition-all disabled:cursor-not-allowed"
          :class="probeOptClass(optIdx)"
          @click="pickProbe(optIdx)"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
            :class="currentProbeAnswer?.pickedIndex === optIdx ? 'border-primary bg-primary text-white' : 'border-default text-muted'"
          >
            {{ String.fromCharCode(65 + optIdx) }}
          </span>
          <span class="min-w-0 flex-1 text-highlighted wrap-break-word">{{ opt }}</span>
        </button>
      </div>

      <div
        v-if="currentProbeRevealed && currentProbe.explanation"
        class="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-highlighted"
      >
        <span class="font-semibold text-cyan-600 dark:text-cyan-300">Подсказка: </span>
        {{ currentProbe.explanation }}
      </div>

      <div class="mt-3 flex justify-end gap-2">
        <UButton
          v-if="!currentProbeRevealed"
          :disabled="!currentProbeAnswer"
          size="sm"
          color="primary"
          @click="revealProbe"
        >
          Проверить
        </UButton>
        <UButton
          v-else-if="probeIdx < probes.length - 1"
          size="sm"
          color="primary"
          @click="nextProbe"
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
      v-if="allProbesDone && !isCompleted"
      class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="celebrate"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            Чувствуешь? Ты только что «увидел» умножение.
          </p>
          <p class="mt-1 text-xs text-muted">
            Правильно: {{ correctProbes }} из {{ probes.length }}. Теперь мы разложим это по-научному.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            К объяснению
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
