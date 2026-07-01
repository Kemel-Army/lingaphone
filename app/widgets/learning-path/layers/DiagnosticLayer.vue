<script setup lang="ts">
/**
 * DiagnosticLayer · S2 v2 · Hearts + multi-mode + SFX/XP
 *
 * Поведение:
 *   - mode='mcq' (default, legacy) — classic один-вопрос-за-раз с MCQ.
 *   - mode='tap-correct' — на экране плитки, ребёнок тапает правильные;
 *     mistakes снижают сердечки.
 *   - hearts (по умолчанию 3) — игровая жизнь. При неправильном ответе
 *     теряется 1 сердце + проигрывается SFX 'wrong'.
 *   - На каждый верный ответ — SFX 'correct' и +XP-всплывашка.
 */
import type {
  CapsuleLayer, DiagnosticContent, LayerProgress,
  ChoiceQuestion, TapCorrectTask
} from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as DiagnosticContent)
const mode = computed(() => content.value.mode ?? 'mcq')
const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

const { play } = useSound()
const { flash } = useMascotReactions()

// S14 — Феми приветствует голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => {
  greetLayer('DIAGNOSTIC')
})
const xpFloater = useTemplateRef<{ spawn: (n: number, pos?: { x: number, y: number }, hue?: 'amber' | 'emerald' | 'sky' | 'rose') => void }>('xpFloater')

// ── Lives ──────────────────────────────────────────────────────────
const initialLives = computed(() => Math.max(1, content.value.lives ?? 3))
const lives = ref(initialLives.value)
const losingHeartFlash = ref(false)

// S9 — счётчик подряд ошибок для confused-триггера маскота.
const wrongStreak = ref(0)

const loseHeart = () => {
  if (lives.value > 0) lives.value -= 1
  losingHeartFlash.value = true
  wrongStreak.value += 1
  // 3 ошибки подряд → empathy-state Феми ('confused' 1.5s).
  if (wrongStreak.value >= 3) {
    flash('confused', 1500)
    wrongStreak.value = 0
  }
  setTimeout(() => {
    losingHeartFlash.value = false
  }, 700)
}

// ── MCQ branch state ───────────────────────────────────────────────
const questions = computed(() => content.value.questions ?? [])
const currentIdx = ref(0)
const answers = ref<Record<string, { pickedIndex: number, correct: boolean }>>({})
const revealed = ref<Record<string, boolean>>({})
const submitting = ref(false)

const currentQ = computed(() => questions.value[currentIdx.value] ?? null)
const currentAnswer = computed(() => (currentQ.value ? answers.value[currentQ.value.id] : undefined))
const currentRevealed = computed(() => (currentQ.value ? !!revealed.value[currentQ.value.id] : false))

/** Pop-анимация плитки при выборе (S8 Phase 1).
 * Запоминаем `optIndex` и снимаем через 320ms — длиннее, чем CSS-keyframe,
 * чтобы плавно завершилась анимация даже при быстрых re-select. */
const popIdx = ref<number | null>(null)
let popTimer: ReturnType<typeof setTimeout> | null = null

const handlePick = (optIndex: number) => {
  if (!currentQ.value || currentRevealed.value || isCompleted.value) return
  answers.value[currentQ.value.id] = {
    pickedIndex: optIndex,
    correct: optIndex === currentQ.value.correctIndex
  }
  if (popTimer) clearTimeout(popTimer)
  popIdx.value = optIndex
  popTimer = setTimeout(() => {
    popIdx.value = null
  }, 320)
  play('click')
}

const check = (ev?: MouseEvent) => {
  if (!currentQ.value || !currentAnswer.value) return
  revealed.value[currentQ.value.id] = true
  const correct = !!currentAnswer.value.correct
  play(correct ? 'correct' : 'wrong')
  flash(correct ? 'celebrate' : 'warn', correct ? 800 : 1200)
  if (correct) {
    wrongStreak.value = 0
    xpFloater.value?.spawn(5, ev ? { x: ev.clientX, y: ev.clientY } : undefined, 'sky')
  } else {
    loseHeart()
  }
}

const goNext = () => {
  if (currentIdx.value < questions.value.length - 1) currentIdx.value += 1
}

const goPrev = () => {
  if (currentIdx.value > 0) currentIdx.value -= 1
}

const allAnswered = computed(() =>
  questions.value.length > 0 && questions.value.every(q => answers.value[q.id] != null)
)

const correctCount = computed(() =>
  questions.value.reduce((s, q) => s + (answers.value[q.id]?.correct ? 1 : 0), 0)
)

const submitMcq = async () => {
  if (!allAnswered.value || submitting.value || isCompleted.value) return
  submitting.value = true
  play('cheer')
  flash('celebrate', 1500)
  try {
    emit('complete', {
      interactionData: {
        mode: 'mcq',
        interactions: questions.value.map(q => ({
          qId: q.id,
          pickedIndex: answers.value[q.id]?.pickedIndex,
          correct: answers.value[q.id]?.correct ?? false
        })),
        correctCount: correctCount.value,
        total: questions.value.length,
        livesLeft: lives.value
      },
      score: correctCount.value,
      maxScore: questions.value.length,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const optionClass = (q: ChoiceQuestion, optIndex: number) => {
  const ans = answers.value[q.id]
  const rev = !!revealed.value[q.id]
  const isPicked = ans?.pickedIndex === optIndex
  const isCorrect = q.correctIndex === optIndex
  if (!rev) return isPicked ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/40'
  if (isCorrect) return 'border-emerald-500 bg-emerald-500/10'
  if (isPicked) return 'border-rose-500 bg-rose-500/10'
  return 'border-default opacity-60'
}

// ── tap-correct branch state ───────────────────────────────────────
const tapTasks = computed<TapCorrectTask[]>(() => content.value.tapTasks ?? [])
const tapIdx = ref(0)
const currentTapTask = computed(() => tapTasks.value[tapIdx.value] ?? null)
const tappedTiles = ref<Record<string, Set<string>>>({}) // taskId → set of tileIds
const wrongTileFlash = ref<string | null>(null)

const correctFoundInTask = (task: TapCorrectTask) => {
  const set = tappedTiles.value[task.id]
  if (!set) return 0
  let found = 0
  for (const id of set) {
    if (task.tiles.find(t => t.id === id)?.isCorrect) found++
  }
  return found
}

const isTaskComplete = (task: TapCorrectTask) => {
  const set = tappedTiles.value[task.id]
  if (!set) return false
  // Считаем сколько правильных уже нашёл
  let correct = 0
  for (const id of set) {
    if (task.tiles.find(t => t.id === id)?.isCorrect) correct++
  }
  return correct >= task.needCorrect
}

const handleTapTile = (task: TapCorrectTask, tileId: string, ev: MouseEvent) => {
  if (isCompleted.value) return
  const set = tappedTiles.value[task.id] ?? new Set<string>()
  if (set.has(tileId)) return
  const tile = task.tiles.find(t => t.id === tileId)
  if (!tile) return
  set.add(tileId)
  tappedTiles.value = { ...tappedTiles.value, [task.id]: set }
  if (tile.isCorrect) {
    play('correct')
    flash('celebrate', 700)
    xpFloater.value?.spawn(5, { x: ev.clientX, y: ev.clientY }, 'emerald')
    if (isTaskComplete(task)) {
      // Перейти к следующей задаче или завершить слой
      if (tapIdx.value < tapTasks.value.length - 1) {
        setTimeout(() => {
          tapIdx.value++
        }, 600)
      } else {
        setTimeout(() => submitTap(), 600)
      }
    }
  } else {
    play('wrong')
    flash('warn', 1100)
    loseHeart()
    wrongTileFlash.value = tileId
    setTimeout(() => {
      wrongTileFlash.value = null
    }, 600)
  }
}

const tapTotalCorrect = computed(() => {
  let s = 0
  for (const task of tapTasks.value) {
    const set = tappedTiles.value[task.id]
    if (!set) continue
    for (const id of set) {
      if (task.tiles.find(t => t.id === id)?.isCorrect) s++
    }
  }
  return s
})

const tapMaxScore = computed(() => tapTasks.value.reduce((s, t) => s + t.needCorrect, 0))

const submitTap = async () => {
  if (submitting.value || isCompleted.value) return
  submitting.value = true
  play('cheer')
  flash('celebrate', 1500)
  try {
    emit('complete', {
      interactionData: {
        mode: 'tap-correct',
        interactions: tapTasks.value.map(task => ({
          taskId: task.id,
          tappedTileIds: Array.from(tappedTiles.value[task.id] ?? []),
          completed: isTaskComplete(task)
        })),
        livesLeft: lives.value
      },
      score: tapTotalCorrect.value,
      maxScore: Math.max(1, tapMaxScore.value),
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const tapTileClass = (task: TapCorrectTask, tileId: string) => {
  const tile = task.tiles.find(t => t.id === tileId)
  const set = tappedTiles.value[task.id]
  const tapped = set?.has(tileId)
  if (!tapped) {
    return wrongTileFlash.value === tileId
      ? 'border-rose-500 bg-rose-500/10 animate-shake'
      : 'border-default hover:border-primary/40 hover:-translate-y-0.5'
  }
  if (tile?.isCorrect) return 'border-emerald-500 bg-emerald-500/10'
  return 'border-rose-500 bg-rose-500/10 opacity-70'
}
</script>

<template>
  <div class="space-y-6">
    <FloatingXp ref="xpFloater" />

    <!-- Header chip + hearts -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-300">
        <UIcon
          name="i-lucide-stethoscope"
          class="size-3.5"
        />
        Короткая диагностика · без оценки
      </div>
      <HeartsBar
        :total="initialLives"
        :remaining="lives"
        size="sm"
      />
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        state="think"
        size="md"
      />
      <div class="flex-1">
        <h2 class="text-xl sm:text-2xl font-black text-highlighted">
          {{ layer.title }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ layer.subtitle ?? (mode === 'tap-correct'
            ? 'Тапни все правильные плитки. Ошибся — теряешь сердце, но всё равно продолжаешь.'
            : 'Эти вопросы нужны, чтобы подстроить следующие шаги под тебя. После каждого ответа — объяснение.') }}
        </p>
      </div>
    </div>

    <!-- ════════════ MODE: TAP-CORRECT ═══════════════════════════════ -->
    <template v-if="mode === 'tap-correct' && currentTapTask">
      <!-- Task tracker -->
      <div class="flex items-center gap-2 text-xs">
        <span class="font-semibold text-highlighted">
          Задание {{ tapIdx + 1 }} из {{ tapTasks.length }}
        </span>
        <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <span
            class="block h-full bg-sky-500 transition-all duration-300"
            :style="{ width: `${((tapIdx + 1) / Math.max(tapTasks.length, 1)) * 100}%` }"
          />
        </span>
      </div>

      <div class="rounded-2xl border border-default bg-default p-5">
        <p class="mb-4 text-base font-bold text-highlighted">
          {{ currentTapTask.prompt }}
        </p>
        <p class="mb-3 text-xs text-muted">
          Найдено: {{ correctFoundInTask(currentTapTask) }} / {{ currentTapTask.needCorrect }}
        </p>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <button
            v-for="tile in currentTapTask.tiles"
            :key="tile.id"
            type="button"
            :disabled="isCompleted"
            class="flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 bg-elevated p-3 transition-all duration-200 disabled:cursor-not-allowed"
            :class="tapTileClass(currentTapTask, tile.id)"
            @click="handleTapTile(currentTapTask, tile.id, $event)"
          >
            <span
              v-if="tile.emoji"
              class="text-3xl sm:text-4xl"
              aria-hidden="true"
            >{{ tile.emoji }}</span>
            <span class="text-xs sm:text-sm font-semibold text-highlighted text-center wrap-break-word">
              {{ tile.label }}
            </span>
          </button>
        </div>
      </div>
    </template>

    <!-- ════════════ MODE: MCQ (legacy) ══════════════════════════════ -->
    <template v-else>
      <!-- Question tracker -->
      <div class="flex items-center gap-2 text-xs text-muted">
        <span class="font-semibold text-highlighted">
          Вопрос {{ currentIdx + 1 }} из {{ questions.length }}
        </span>
        <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <span
            class="block h-full bg-primary transition-all duration-300"
            :style="{ width: `${((currentIdx + 1) / Math.max(questions.length, 1)) * 100}%` }"
          />
        </span>
      </div>

      <!-- Current question -->
      <div
        v-if="currentQ"
        class="rounded-2xl border border-default bg-default p-5"
      >
        <div class="flex items-start gap-3">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 text-xs font-bold tabular-nums">
            {{ currentIdx + 1 }}
          </div>
          <div class="flex-1 space-y-4 min-w-0">
            <p class="text-base font-semibold text-highlighted leading-snug wrap-break-word">
              {{ currentQ.prompt }}
            </p>

            <div class="space-y-2">
              <button
                v-for="(opt, optIdx) in currentQ.options"
                :key="optIdx"
                type="button"
                :disabled="currentRevealed || isCompleted"
                class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-elevated px-4 py-3 text-left text-sm transition-all disabled:cursor-not-allowed"
                :class="[
                  optionClass(currentQ, optIdx),
                  popIdx === optIdx && 'animate-select-pop',
                  currentRevealed && currentQ.correctIndex === optIdx && 'animate-success-flash'
                ]"
                @click="handlePick(optIdx)"
              >
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                  :class="currentAnswer?.pickedIndex === optIdx ? 'border-primary bg-primary text-white' : 'border-default text-muted'"
                >
                  {{ String.fromCharCode(65 + optIdx) }}
                </span>
                <span class="min-w-0 flex-1 text-highlighted wrap-break-word">{{ opt }}</span>
                <UIcon
                  v-if="currentRevealed && currentQ.correctIndex === optIdx"
                  name="i-lucide-check-circle-2"
                  class="ml-auto size-5 shrink-0 text-emerald-500"
                />
                <UIcon
                  v-else-if="currentRevealed && currentAnswer?.pickedIndex === optIdx && !currentAnswer.correct"
                  name="i-lucide-x-circle"
                  class="ml-auto size-5 shrink-0 text-rose-500"
                />
              </button>
            </div>

            <!-- Explanation -->
            <div
              v-if="currentRevealed && currentQ.explanation"
              class="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-highlighted"
            >
              <span class="font-semibold text-sky-600 dark:text-sky-300">Пояснение: </span>
              {{ currentQ.explanation }}
            </div>

            <div class="flex items-center justify-between gap-2">
              <UButton
                variant="ghost"
                size="sm"
                :disabled="currentIdx === 0"
                @click="goPrev"
              >
                <UIcon
                  name="i-lucide-chevron-left"
                  class="size-4"
                />
                Назад
              </UButton>

              <div class="flex items-center gap-2">
                <UButton
                  v-if="!currentRevealed"
                  :disabled="!currentAnswer"
                  size="sm"
                  color="primary"
                  @click="check($event)"
                >
                  <UIcon
                    name="i-lucide-check"
                    class="size-4"
                  />
                  Проверить
                </UButton>
                <UButton
                  v-else-if="currentIdx < questions.length - 1"
                  size="sm"
                  color="primary"
                  @click="goNext"
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
        </div>
      </div>

      <!-- Final submit -->
      <div
        v-if="allAnswered && currentIdx === questions.length - 1 && currentRevealed"
        class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
      >
        <div class="flex items-start gap-4">
          <FemiMascot
            state="celebrate"
            size="md"
          />
          <div class="flex-1">
            <p class="text-sm font-bold text-highlighted">
              Отлично! Ты ответил на все вопросы.
            </p>
            <p class="mt-1 text-xs text-muted">
              Правильно: {{ correctCount }} из {{ questions.length }}. Эти данные помогут подобрать тебе остальную часть урока.
            </p>
            <UButton
              class="mt-3"
              :loading="submitting"
              :disabled="isCompleted"
              color="primary"
              size="lg"
              @click="submitMcq"
            >
              Завершить диагностику
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="isCompleted"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="size-4 text-emerald-500"
      />
      Слой пройден — нажми «Далее» слева, чтобы продолжить.
    </div>
  </div>
</template>

<style scoped>
@keyframes shake-anim {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.animate-shake {
  animation: shake-anim 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
</style>
