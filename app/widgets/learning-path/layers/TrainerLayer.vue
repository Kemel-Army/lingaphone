<script setup lang="ts">
import type { CapsuleLayer, LayerProgress, TrainerContent, TrainerProblem } from '~/entities/learning-path'
import { TapPairBoard } from '~/widgets/learning-path/trainer'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as TrainerContent)
const problems = computed<TrainerProblem[]>(() => content.value.problems ?? [])
const targetCorrect = computed(() => content.value.targetCorrect ?? Math.max(1, Math.ceil(problems.value.length * 0.75)))
const hintsByQ = computed(() => content.value.socraticHints ?? {})

const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

const { play } = useSound()
const { flash } = useMascotReactions()
const { streakSparkle } = useConfetti()

// S14 — Феми приветствует ребёнка голосом + мимикой при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => {
  greetLayer('TRAINER')
})
const xpFloater = useTemplateRef<{ spawn: (n: number, pos?: { x: number, y: number }, hue?: 'amber' | 'emerald' | 'sky' | 'rose') => void }>('xpFloater')

// Streak — сколько верных подряд. Сбрасывается на любой ошибке.
const streak = ref(0)
const bestStreak = ref(0)

const idx = ref(0)
const current = computed<TrainerProblem | null>(() => problems.value[idx.value] ?? null)

// Per-question state keyed by problem id
const answers = ref<Record<string, string | number>>({})
const revealed = ref<Record<string, boolean>>({})
const correctMap = ref<Record<string, boolean>>({})
const hintStep = ref<Record<string, number>>({})
// S12 — кол-во НЕПРАВИЛЬНЫХ попыток на вопрос. После 3 → блокируем.
const wrongAttempts = ref<Record<string, number>>({})

const currentId = computed(() => current.value?.id ?? '')
const currentAnswer = computed({
  get: () => (currentId.value ? String(answers.value[currentId.value] ?? '') : ''),
  set: (val: string) => setAnswer(val)
})
const currentRevealed = computed(() => !!(currentId.value && revealed.value[currentId.value]))
const currentHintStep = computed(() => hintStep.value[currentId.value] ?? 0)
const currentHints = computed(() => (currentId.value ? hintsByQ.value[currentId.value] ?? [] : []))
const visibleHints = computed(() => currentHints.value.slice(0, currentHintStep.value))

const correctCount = computed(() => Object.values(correctMap.value).filter(Boolean).length)
const progressPct = computed(() => Math.min(100, Math.round((correctCount.value / targetCorrect.value) * 100)))
const _reachedGoal = computed(() => correctCount.value >= targetCorrect.value)

const submitting = ref(false)

const setAnswer = (val: string | number) => {
  if (!current.value || currentRevealed.value) return
  answers.value[current.value.id] = val
}

/** Pop-анимация плитки при выборе (S8 Phase 1). */
const popIdx = ref<number | null>(null)
let popTimer: ReturnType<typeof setTimeout> | null = null

const pickChoice = (optIdx: number) => {
  if (!current.value || current.value.kind !== 'choice') return
  setAnswer(optIdx)
  if (popTimer) clearTimeout(popTimer)
  popIdx.value = optIdx
  popTimer = setTimeout(() => {
    popIdx.value = null
  }, 320)
  play('click')
}

const isCurrentCorrect = (): boolean => {
  const q = current.value
  if (!q) return false
  if (q.kind === 'tap-pair') {
    // Tap-pair помечается верным через специальный handler (handleTapPairDone)
    return !!correctMap.value[q.id]
  }
  const a = answers.value[q.id]
  if (a == null) return false
  if (q.kind === 'choice') return Number(a) === q.correctIndex
  const expected = q.correctAnswer
  if (typeof expected === 'number') {
    const tol = q.tolerance ?? 0
    return Math.abs(Number(a) - expected) <= tol
  }
  return String(a).trim().toLowerCase() === String(expected).trim().toLowerCase()
}

/** S9 — подсчёт подряд ошибок для триггера 'confused' маскота. */
const wrongStreak = ref(0)

const recordStreak = (correct: boolean) => {
  if (correct) {
    streak.value += 1
    wrongStreak.value = 0
    if (streak.value > bestStreak.value) bestStreak.value = streak.value
    // Каждый 5-й подряд — звёздное конфетти + sparkle SFX (S8 Phase 2).
    // На 10-м подряд → Феми пляшет (S9).
    if (streak.value > 0 && streak.value === 10) {
      play('cheer')
      streakSparkle()
      flash('dance', 1500)
    } else if (streak.value > 0 && streak.value % 5 === 0) {
      play('sparkle')
      streakSparkle()
      flash('trophy', 1200)
    }
  } else {
    streak.value = 0
    wrongStreak.value += 1
    // 3 ошибки подряд → Феми становится «confused» (S9). Это не наказание,
    // это эмпатия — маскот «тоже не понимает», ребёнок не один в стрессе.
    if (wrongStreak.value >= 3) {
      flash('confused', 1500)
      wrongStreak.value = 0
    }
  }
}

const MAX_ATTEMPTS = 3

const check = (ev?: MouseEvent) => {
  if (!current.value || currentRevealed.value) return
  if (current.value.kind === 'tap-pair') return // tap-pair автоматически
  const ok = isCurrentCorrect()
  const id = current.value.id
  revealed.value[id] = true
  correctMap.value[id] = ok
  play(ok ? 'correct' : 'wrong')

  if (ok) {
    flash('celebrate', 700)
    recordStreak(true)
    xpFloater.value?.spawn(10, ev ? { x: ev.clientX, y: ev.clientY } : undefined, 'emerald')
    return
  }

  // S12 — Wrong answer flow.
  wrongAttempts.value[id] = (wrongAttempts.value[id] ?? 0) + 1
  recordStreak(false)
  const totalHints = currentHints.value.length
  const shownHints = hintStep.value[id] ?? 0
  // Авто-подсказка на каждой ошибке (если ещё остались).
  if (shownHints < totalHints) {
    hintStep.value[id] = shownHints + 1
  }
  // Если попыток < MAX и есть на что опереться (подсказка или просто запас попыток),
  // не «убиваем» вопрос — Феми поддерживает, кнопка «попробовать снова» появится в UI.
  const canRetry = wrongAttempts.value[id] < MAX_ATTEMPTS
  if (canRetry) {
    flash('warn', 1100)
  } else {
    // Финальный лок: показываем все оставшиеся подсказки + объяснение.
    if (totalHints > 0) hintStep.value[id] = totalHints
    flash('confused', 1300)
  }
}

/** S12 — повторная попытка на том же вопросе. Сбрасывает revealed/answer
 * у текущего id, чтобы поля снова стали активны. Подсказки и счётчик
 * попыток не сбрасываются. */
const retryCurrent = () => {
  if (!current.value) return
  const id = current.value.id
  revealed.value[id] = false
  if (current.value.kind === 'numeric') {
    answers.value[id] = ''
  }
  // У choice оставляем picked-state — ребёнок видит свой ошибочный выбор;
  // он может выбрать другую опцию или подтвердить тот же.
  play('click')
}

const canRetryCurrent = computed(() => {
  if (!current.value) return false
  if (correctMap.value[current.value.id]) return false
  return (wrongAttempts.value[current.value.id] ?? 0) < MAX_ATTEMPTS
})

// ── Tap-pair handlers ───────────────────────────────────────────
const handleTapPairPair = () => {
  if (!current.value) return
  // Маленькая награда за каждую найденную пару — без точки появления
  xpFloater.value?.spawn(3, undefined, 'sky')
}

const handleTapPairMistake = () => {
  // Каждая ошибка в tap-pair сбрасывает streak
  streak.value = 0
  flash('warn', 900)
}

const handleTapPairDone = () => {
  if (!current.value) return
  revealed.value[current.value.id] = true
  correctMap.value[current.value.id] = true
  recordStreak(true)
  play('cheer')
  flash('celebrate', 1200)
  xpFloater.value?.spawn(15, undefined, 'emerald')
}

const revealHint = () => {
  if (!current.value) return
  const id = current.value.id
  const total = currentHints.value.length
  hintStep.value[id] = Math.min(total, (hintStep.value[id] ?? 0) + 1)
}

const nextProblem = () => {
  if (idx.value < problems.value.length - 1) idx.value += 1
}
const prevProblem = () => {
  if (idx.value > 0) idx.value -= 1
}

const finish = async () => {
  if (submitting.value || isCompleted.value) return
  submitting.value = true
  try {
    emit('complete', {
      interactionData: {
        interactions: problems.value.map(p => ({
          id: p.id,
          answer: answers.value[p.id] ?? null,
          correct: !!correctMap.value[p.id]
        }))
      },
      score: correctCount.value,
      maxScore: problems.value.length,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const optClass = (optIdx: number) => {
  const q = current.value
  if (!q || q.kind !== 'choice') return ''
  const picked = Number(answers.value[q.id])
  const isPicked = picked === optIdx
  const isCorrect = q.correctIndex === optIdx
  if (!currentRevealed.value) {
    return isPicked ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/40'
  }
  if (isCorrect) return 'border-emerald-500 bg-emerald-500/10'
  if (isPicked) return 'border-rose-500 bg-rose-500/10'
  return 'border-default opacity-60'
}
</script>

<template>
  <div class="space-y-6">
    <FloatingXp ref="xpFloater" />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
        <UIcon
          name="i-lucide-dumbbell"
          class="size-3.5"
        />
        Тренажёр · {{ correctCount }} / {{ targetCorrect }} правильных
      </div>
      <StreakCounter :streak="streak" />
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

    <!-- Progress bar toward target -->
    <div class="flex items-center gap-2 text-xs">
      <span class="font-semibold text-highlighted">
        Задача {{ idx + 1 }} из {{ problems.length }}
      </span>
      <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <span
          class="block h-full bg-emerald-500 transition-all duration-300"
          :style="{ width: `${progressPct}%` }"
        />
      </span>
      <span class="font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">
        {{ progressPct }}%
      </span>
    </div>

    <!-- Current problem -->
    <div
      v-if="current"
      class="rounded-2xl border border-default bg-default p-5"
    >
      <p
        class="text-sm font-semibold text-highlighted"
        v-html="renderMath(current.prompt)"
      />

      <!-- Tap-pair (соедини пары) -->
      <div
        v-if="current.kind === 'tap-pair'"
        class="mt-4"
      >
        <TapPairBoard
          :problem="current"
          :disabled="currentRevealed"
          @pair="handleTapPairPair"
          @mistake="handleTapPairMistake"
          @done="handleTapPairDone"
        />
      </div>

      <!-- Choice -->
      <div
        v-else-if="current.kind === 'choice'"
        class="mt-4 space-y-2"
      >
        <button
          v-for="(opt, optIdx) in current.options"
          :key="optIdx"
          type="button"
          :disabled="currentRevealed"
          class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-elevated px-4 py-3 text-left text-sm transition-all disabled:cursor-not-allowed"
          :class="[
            optClass(optIdx),
            popIdx === optIdx && 'animate-select-pop',
            currentRevealed && current.kind === 'choice' && current.correctIndex === optIdx && 'animate-success-flash'
          ]"
          @click="pickChoice(optIdx)"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
            :class="Number(answers[current.id]) === optIdx ? 'border-primary bg-primary text-white' : 'border-default text-muted'"
          >
            {{ String.fromCharCode(65 + optIdx) }}
          </span>
          <span class="min-w-0 flex-1 text-highlighted wrap-break-word">{{ opt }}</span>
        </button>
      </div>

      <!-- Numeric -->
      <div
        v-else-if="current.kind === 'numeric'"
        class="mt-4"
      >
        <div class="mx-auto w-full max-w-xs">
          <MathNumpad
            v-model="currentAnswer"
            :expression="current.prompt"
            :show-expression="false"
            :disabled="currentRevealed"
            @submit="check()"
          />
        </div>
        <p
          v-if="current.unit"
          class="mt-2 text-center text-sm text-muted"
        >
          Единица: {{ current.unit }}
        </p>
      </div>

      <!-- Hints -->
      <div
        v-if="visibleHints.length"
        class="mt-3 space-y-1.5"
      >
        <div
          v-for="(h, i) in visibleHints"
          :key="i"
          class="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-highlighted"
        >
          <span class="font-semibold text-sky-600 dark:text-sky-300">Подсказка {{ i + 1 }}: </span>
          {{ h }}
        </div>
      </div>

      <!-- Feedback (для choice/numeric; tap-pair имеет inline-feedback).
           S12 — на повторе показываем «Почти! Попробуй ещё», на финальной
           ошибке — полное объяснение. -->
      <div
        v-if="currentRevealed && current.kind !== 'tap-pair'"
        class="mt-3 rounded-lg border px-3 py-2 text-xs"
        :class="correctMap[current.id]
          ? 'border-emerald-500/30 bg-emerald-500/5 text-highlighted'
          : canRetryCurrent
            ? 'border-amber-500/30 bg-amber-500/5 text-highlighted'
            : 'border-rose-500/30 bg-rose-500/5 text-highlighted'"
      >
        <span
          class="font-semibold"
          :class="correctMap[current.id]
            ? 'text-emerald-600 dark:text-emerald-300'
            : canRetryCurrent
              ? 'text-amber-600 dark:text-amber-300'
              : 'text-rose-600 dark:text-rose-300'"
        >
          {{ correctMap[current.id]
            ? 'Верно!'
            : canRetryCurrent
              ? 'Почти! Подсказка появилась 💡'
              : 'Мимо. Покажу как правильно:' }}
        </span>
        <span v-if="!canRetryCurrent || correctMap[current.id]">
          <span v-if="current.kind === 'choice' && current.explanation"> {{ current.explanation }}</span>
          <span v-else-if="current.kind === 'numeric' && current.hint"> {{ current.hint }}</span>
        </span>
      </div>

      <!-- Controls -->
      <div class="mt-4 flex items-center justify-between gap-2">
        <UButton
          variant="ghost"
          size="sm"
          :disabled="idx === 0"
          @click="prevProblem"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="size-4"
          />
          Назад
        </UButton>

        <div class="flex items-center gap-2">
          <UButton
            v-if="!currentRevealed && currentHints.length > currentHintStep"
            variant="soft"
            color="info"
            size="sm"
            @click="revealHint"
          >
            <UIcon
              name="i-lucide-lightbulb"
              class="size-4"
            />
            Подсказка
          </UButton>
          <UButton
            v-if="!currentRevealed && current.kind !== 'tap-pair'"
            color="primary"
            size="sm"
            :disabled="currentAnswer == null || currentAnswer === ''"
            @click="check($event)"
          >
            Проверить
          </UButton>
          <!-- S12 — повторная попытка после ошибки (до 3 раз). -->
          <UButton
            v-else-if="currentRevealed && !correctMap[current.id] && canRetryCurrent"
            color="warning"
            variant="soft"
            size="sm"
            @click="retryCurrent"
          >
            <UIcon
              name="i-lucide-rotate-ccw"
              class="size-4"
            />
            Попробовать снова
          </UButton>
          <UButton
            v-else-if="idx < problems.length - 1"
            color="primary"
            size="sm"
            @click="nextProblem"
          >
            Дальше
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4"
            />
          </UButton>
        </div>
      </div>
    </div>

    <!-- Finish -->
    <div
      v-if="!isCompleted"
      class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="celebrate"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            Ты набрал цель тренажёра!
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ correctCount }} правильных из {{ problems.length }}. Можно идти дальше — впереди сценарий из жизни.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            К сценарию
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
