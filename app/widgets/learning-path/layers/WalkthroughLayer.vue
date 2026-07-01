<script setup lang="ts">
import type { CapsuleLayer, LayerProgress, WalkthroughContent } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as WalkthroughContent)
const examples = computed(() => content.value.examples ?? [])
const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

// S14 — Феми приветствует ребёнка голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => greetLayer('WALKTHROUGH'))

// Walk through examples one by one. Each example walks step-by-step.
const exIdx = ref(0)
const stepIdx = ref(0)
const answers = ref<Record<string, string | number>>({})
const revealed = ref<Record<string, boolean>>({})
const submitting = ref(false)
// replayKey — увеличиваем чтобы перерендерить шаг и проиграть анимацию заново
const replayKey = ref(0)
const visibleBoardLines = ref(0)

const currentEx = computed(() => examples.value[exIdx.value] ?? null)
const currentStep = computed(() => currentEx.value?.steps[stepIdx.value] ?? null)

// Запускаем "пиши на доске" анимацию каждый раз при смене шага или replay.
// Линии boardLines проявляются по одной с задержкой 350 ms.
let boardTimer: ReturnType<typeof setInterval> | null = null
const startBoardAnimation = (lines: number) => {
  if (boardTimer) clearInterval(boardTimer)
  visibleBoardLines.value = 0
  if (lines === 0) return
  boardTimer = setInterval(() => {
    visibleBoardLines.value += 1
    if (visibleBoardLines.value >= lines) {
      if (boardTimer) clearInterval(boardTimer)
    }
  }, 350)
}

watch([currentStep, replayKey], () => {
  const v = currentStep.value?.visual
  startBoardAnimation(v?.kind === 'board' ? (v.boardLines?.length ?? 0) : 0)
}, { immediate: true })

onBeforeUnmount(() => {
  if (boardTimer) clearInterval(boardTimer)
})

const replayStep = () => {
  replayKey.value += 1
}

const keyFor = (eIdx: number, sIdx: number) => `${eIdx}:${sIdx}`
const stepKey = computed(() => keyFor(exIdx.value, stepIdx.value))

/** How many of the steps in the current example are already revealed via prefill. */
const prefillCount = computed(() => currentEx.value?.prefilledSteps ?? 0)

/** A step is auto-revealed when its index is below prefillCount. */
const isAutoRevealed = computed(() => stepIdx.value < prefillCount.value)
const isRevealed = computed(() => isAutoRevealed.value || !!revealed.value[stepKey.value])

const setAnswer = (val: string | number) => {
  answers.value[stepKey.value] = val
}

const revealStep = () => {
  revealed.value[stepKey.value] = true
}

const goNextStep = () => {
  if (!currentEx.value) return
  if (stepIdx.value < currentEx.value.steps.length - 1) {
    stepIdx.value += 1
  }
}
const goPrevStep = () => {
  if (stepIdx.value > 0) stepIdx.value -= 1
}

const goNextExample = () => {
  if (exIdx.value < examples.value.length - 1) {
    exIdx.value += 1
    stepIdx.value = 0
  }
}

const allExamplesDone = computed(() => {
  if (!examples.value.length) return false
  const lastEx = examples.value[examples.value.length - 1]
  if (!lastEx) return false
  const lastKey = keyFor(examples.value.length - 1, lastEx.steps.length - 1)
  return exIdx.value === examples.value.length - 1
    && stepIdx.value === lastEx.steps.length - 1
    && (isAutoRevealed.value || !!revealed.value[lastKey])
})

const finish = async () => {
  if (submitting.value || isCompleted.value || !allExamplesDone.value) return
  submitting.value = true
  try {
    emit('complete', {
      interactionData: {
        interactions: Object.entries(answers.value).map(([k, v]) => ({ step: k, answer: v })),
        examplesSeen: examples.value.length
      },
      score: 1,
      maxScore: 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

/** Validates the student's answer against the step's expected value. */
const isStepCorrect = computed(() => {
  const s = currentStep.value
  if (!s?.action) return true
  const expected = s.action.expected
  const actual = answers.value[stepKey.value]
  if (expected == null) return true
  if (typeof expected === 'number') {
    return Number(actual) === expected
  }
  return String(actual).trim().toLowerCase() === String(expected).trim().toLowerCase()
})

// Helpers for choice buttons
const pickChoice = (optIdx: number) => {
  if (!currentStep.value?.action) return
  setAnswer(optIdx)
}
</script>

<template>
  <div class="space-y-6">
    <div class="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-300">
      <UIcon
        name="i-lucide-lightbulb"
        class="size-3.5"
      />
      Пошаговый разбор
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
          v-if="content.intro"
          class="mt-1 text-sm text-muted"
        >
          {{ content.intro }}
        </p>
      </div>
    </div>

    <!-- Example header -->
    <div
      v-if="currentEx"
      class="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="text-[10px] font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-300">
          Задача {{ exIdx + 1 }} из {{ examples.length }}
        </div>
        <div class="flex gap-1">
          <span
            v-for="(_, i) in examples"
            :key="i"
            class="size-2 rounded-full transition-colors"
            :class="i < exIdx ? 'bg-emerald-500' : i === exIdx ? 'bg-primary' : 'bg-muted'"
          />
        </div>
      </div>
      <p class="mt-2 text-sm text-highlighted leading-snug wrap-break-word">
        {{ currentEx.problem }}
      </p>
    </div>

    <!-- Step tracker -->
    <div
      v-if="currentEx"
      class="flex items-center gap-2 text-xs"
    >
      <span class="font-semibold text-highlighted">
        Шаг {{ stepIdx + 1 }} из {{ currentEx.steps.length }}
      </span>
      <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <span
          class="block h-full bg-yellow-500 transition-all duration-300"
          :style="{ width: `${((stepIdx + 1) / currentEx.steps.length) * 100}%` }"
        />
      </span>
    </div>

    <!-- Current step -->
    <div
      v-if="currentStep"
      :key="`${exIdx}-${stepIdx}-${replayKey}`"
      class="rounded-2xl border border-default bg-default p-5 step-fade-in"
    >
      <div class="flex items-start gap-3">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 font-black text-sm tabular-nums">
          {{ currentStep.index }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-bold text-highlighted wrap-break-word flex-1">
              <TypewriterText
                :key="`step-title-${stepIdx}-${exIdx}`"
                :text="currentStep.title"
                :chars-per-sec="42"
              />
            </h4>
            <UButton
              v-if="currentStep.visual"
              variant="ghost"
              size="xs"
              :title="'Показать ещё раз'"
              @click="replayStep"
            >
              <UIcon
                name="i-lucide-rotate-cw"
                class="size-4"
              />
            </UButton>
          </div>

          <!-- ═══════════ VISUAL (опц.) ═══════════ -->
          <div
            v-if="currentStep.visual"
            class="mt-3"
          >
            <!-- Comic-strip визуал -->
            <ComicStrip
              v-if="currentStep.visual.kind === 'comic' && currentStep.visual.panels?.length"
              :panels="currentStep.visual.panels"
            />
            <!-- Board: «доска», линии появляются по очереди -->
            <div
              v-else-if="currentStep.visual.kind === 'board' && currentStep.visual.boardLines?.length"
              class="rounded-xl border-2 border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/30 p-4 font-mono text-sm sm:text-base text-highlighted overflow-x-auto"
            >
              <transition-group
                name="board-line"
                tag="div"
                class="space-y-1.5"
              >
                <div
                  v-for="(line, li) in currentStep.visual.boardLines.slice(0, visibleBoardLines)"
                  :key="li"
                  class="board-line whitespace-pre wrap-break-word"
                  v-html="renderMath(line)"
                />
              </transition-group>
            </div>
            <!-- Emoji: большая иллюстрация -->
            <div
              v-else-if="currentStep.visual.kind === 'emoji' && currentStep.visual.emoji"
              class="flex justify-center py-3 text-6xl sm:text-7xl emoji-pop"
              aria-hidden="true"
            >
              {{ currentStep.visual.emoji }}
            </div>
          </div>

          <div
            class="mt-2 prose prose-sm dark:prose-invert max-w-none text-highlighted"
            :class="{ 'text-type-anim': currentStep.textAnim === 'type' }"
            v-html="renderMath(currentStep.explanation)"
          />

          <!-- Action — only for non-prefilled steps -->
          <div
            v-if="currentStep.action && !isAutoRevealed"
            class="mt-4"
          >
            <!-- Choice action -->
            <div
              v-if="currentStep.action.kind === 'choice' && currentStep.action.options"
              class="space-y-2"
            >
              <p
                v-if="currentStep.action.prompt"
                class="text-sm font-semibold text-highlighted"
              >
                {{ currentStep.action.prompt }}
              </p>
              <button
                v-for="(opt, optIdx) in currentStep.action.options"
                :key="optIdx"
                type="button"
                :disabled="isRevealed"
                class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-elevated px-4 py-3 text-left text-sm transition-all disabled:cursor-not-allowed"
                :class="(() => {
                  const picked = answers[stepKey]
                  const isPicked = picked === optIdx
                  const isCorrect = currentStep?.action?.correctIndex === optIdx
                  if (!isRevealed) return isPicked ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/40'
                  if (isCorrect) return 'border-emerald-500 bg-emerald-500/10'
                  if (isPicked) return 'border-rose-500 bg-rose-500/10'
                  return 'border-default opacity-60'
                })()"
                @click="pickChoice(optIdx)"
              >
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                  :class="answers[stepKey] === optIdx ? 'border-primary bg-primary text-white' : 'border-default text-muted'"
                >
                  {{ String.fromCharCode(65 + optIdx) }}
                </span>
                <span class="min-w-0 flex-1 text-highlighted wrap-break-word">{{ opt }}</span>
              </button>
            </div>

            <!-- Numeric action -->
            <div
              v-else-if="currentStep.action.kind === 'numeric'"
              class="space-y-2"
            >
              <p
                v-if="currentStep.action.prompt"
                class="text-sm font-semibold text-highlighted"
              >
                {{ currentStep.action.prompt }}
              </p>
              <div class="mx-auto w-full max-w-xs">
                <MathNumpad
                  :model-value="String(answers[stepKey] ?? '')"
                  :expression="currentStep.action.prompt || currentStep.title"
                  :show-expression="false"
                  :disabled="isRevealed"
                  @update:model-value="setAnswer($event)"
                  @submit="revealStep"
                />
              </div>
            </div>
          </div>

          <!-- Reveal + navigation -->
          <div class="mt-4 flex items-center justify-between gap-2">
            <UButton
              variant="ghost"
              size="sm"
              :disabled="stepIdx === 0"
              @click="goPrevStep"
            >
              <UIcon
                name="i-lucide-chevron-left"
                class="size-4"
              />
              Назад
            </UButton>

            <div class="flex gap-2">
              <UButton
                v-if="currentStep.action && !isAutoRevealed && !isRevealed"
                size="sm"
                color="primary"
                :disabled="answers[stepKey] == null"
                @click="revealStep"
              >
                Проверить
              </UButton>
              <UButton
                v-else-if="currentEx && stepIdx < currentEx.steps.length - 1"
                size="sm"
                color="primary"
                @click="goNextStep"
              >
                Дальше
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4"
                />
              </UButton>
              <UButton
                v-else-if="exIdx < examples.length - 1"
                size="sm"
                color="primary"
                @click="goNextExample"
              >
                Следующий пример
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4"
                />
              </UButton>
            </div>
          </div>

          <!-- Feedback after reveal -->
          <div
            v-if="isRevealed && currentStep.action && !isAutoRevealed"
            class="mt-3 rounded-lg border px-3 py-2 text-xs"
            :class="isStepCorrect
              ? 'border-emerald-500/30 bg-emerald-500/5 text-highlighted'
              : 'border-rose-500/30 bg-rose-500/5 text-highlighted'"
          >
            <span
              class="font-semibold"
              :class="isStepCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'"
            >
              {{ isStepCorrect ? 'Верно!' : 'Не совсем.' }}
            </span>
            {{ isStepCorrect ? 'Идём дальше.' : 'Но идея ясна — это и есть шаг разбора.' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Finish -->
    <div
      v-if="allExamplesDone && !isCompleted"
      class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="celebrate"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            Ты разобрал все примеры.
          </p>
          <p class="mt-1 text-xs text-muted">
            Теперь попробуй сам — впереди тренажёр.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            К тренажёру
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

<style scoped>
/* Шаг проявляется плавно при смене / replay */
@keyframes step-fade-in-anim {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.step-fade-in {
  animation: step-fade-in-anim 0.35s cubic-bezier(0.25, 0.8, 0.4, 1);
}

/* Линии "доски" появляются с лёгким сдвигом */
.board-line-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.4, 1);
}
.board-line-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.board-line-enter-to {
  opacity: 1;
  transform: translateX(0);
}

/* Эмодзи-pop при появлении */
@keyframes emoji-pop-anim {
  0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.emoji-pop {
  animation: emoji-pop-anim 0.55s cubic-bezier(0.25, 0.8, 0.4, 1.2);
}

/* type-effect: линейная "печать" текста (ширина) — для коротких строк */
@keyframes type-anim {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
.text-type-anim {
  animation: type-anim 1.2s steps(60, end) forwards;
}
</style>
