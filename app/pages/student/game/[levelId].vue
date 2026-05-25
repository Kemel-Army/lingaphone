<script setup lang="ts">
import { getGameLevel, type GameQuestion } from '~/shared/mock'
import { useGameLevels } from '~/shared/composables/useGameLevels'
import { useRecognition, similarity, speak } from '~/shared/composables/useSpeech'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const levelId = computed(() => String(route.params.levelId))
const level = computed(() => getGameLevel(levelId.value))

if (!level.value) {
  throw createError({ statusCode: 404, message: 'Уровень не найден' })
}

const { PASS_THRESHOLD, sampleQuestions, recordAttempt, isUnlocked } = useGameLevels()

// Lock guard: redirect back to map if prior level not passed
onMounted(() => {
  if (!isUnlocked(levelId.value)) {
    router.replace('/student/game')
  }
})

// Sample a fresh batch — re-sampled on every restart so retries don't repeat
const currentBatch = ref<GameQuestion[]>([])
const currentIndex = ref(0)
const isFinished = ref(false)
const finalResult = ref<{ scorePct: number, passed: boolean, xpAwarded: number, correct: number, total: number } | null>(null)
const isSubmitting = ref(false)

interface AnswerRecord {
  questionId: string
  format: GameQuestion['format']
  given: string
  correct: boolean
}
const answers = ref<AnswerRecord[]>([])

const startNewBatch = () => {
  if (!level.value) return
  currentBatch.value = sampleQuestions(level.value)
  currentIndex.value = 0
  answers.value = []
  isFinished.value = false
  finalResult.value = null
  resetCurrentInputs()
}

const currentQuestion = computed<GameQuestion | undefined>(() => currentBatch.value[currentIndex.value])
const progressPct = computed(() =>
  currentBatch.value.length === 0
    ? 0
    : Math.round((currentIndex.value / currentBatch.value.length) * 100)
)

// ─── Per-question working state ──────────────────────────────────────────
const selectedChoiceIdx = ref<number | null>(null)
const typedAnswer = ref('')
const spokenTranscript = ref('')
const spokenSimilarity = ref(0)
const submitted = ref(false)
const lastCorrect = ref(false)

const resetCurrentInputs = () => {
  selectedChoiceIdx.value = null
  typedAnswer.value = ''
  spokenTranscript.value = ''
  spokenSimilarity.value = 0
  submitted.value = false
  lastCorrect.value = false
  listenPlayCount.value = 0
  isPlayingAudio.value = false
}

// ─── Grading per format ──────────────────────────────────────────────────
const gradeChoice = () => {
  const q = currentQuestion.value
  if (!q || q.format !== 'QUIZ_CHOICE' || selectedChoiceIdx.value === null) return
  const correct = selectedChoiceIdx.value === q.correctIndex
  submitted.value = true
  lastCorrect.value = correct
  answers.value.push({
    questionId: q.id,
    format: q.format,
    given: q.options[selectedChoiceIdx.value] ?? '',
    correct
  })
}

const gradeType = () => {
  const q = currentQuestion.value
  if (!q || q.format !== 'TYPE_ANSWER') return
  const norm = typedAnswer.value.trim().toLowerCase()
  if (norm.length === 0) return
  const correct = q.acceptedAnswers.some(a => a.toLowerCase() === norm)
  submitted.value = true
  lastCorrect.value = correct
  answers.value.push({
    questionId: q.id,
    format: q.format,
    given: typedAnswer.value,
    correct
  })
}

// ─── Listen-and-type ─────────────────────────────────────────────────────
const listenPlayCount = ref(0)
const isPlayingAudio = ref(false)

const playAudioPrompt = async () => {
  const q = currentQuestion.value
  if (!q || q.format !== 'LISTEN_TYPE' || isPlayingAudio.value) return
  isPlayingAudio.value = true
  listenPlayCount.value++
  await speak(q.audio, { rate: 0.85 })
  // Rough timing so the button shows playing state for the right duration
  setTimeout(() => { isPlayingAudio.value = false }, q.audio.length * 80 + 500)
}

const gradeListen = () => {
  const q = currentQuestion.value
  if (!q || q.format !== 'LISTEN_TYPE') return
  const norm = typedAnswer.value.trim().toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ')
  if (norm.length === 0) return
  const correct = q.acceptedAnswers.some(a => a.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ') === norm)
  submitted.value = true
  lastCorrect.value = correct
  answers.value.push({
    questionId: q.id,
    format: q.format,
    given: typedAnswer.value,
    correct
  })
}

// ─── Speech recognition ──────────────────────────────────────────────────
const { isSupported, isListening, error: recError, start: startRecognition, stop: stopRecognition } = useRecognition()
const SPEAK_PASS = 75

const handleSpeak = async () => {
  if (isListening.value) {
    stopRecognition()
    return
  }
  const q = currentQuestion.value
  if (!q || q.format !== 'SPEAK_PROMPT') return
  try {
    const res = await startRecognition()
    spokenTranscript.value = res.transcript
    spokenSimilarity.value = similarity(res.transcript, q.target)
    const correct = spokenSimilarity.value >= SPEAK_PASS
    submitted.value = true
    lastCorrect.value = correct
    answers.value.push({
      questionId: q.id,
      format: q.format,
      given: res.transcript,
      correct
    })
  } catch {
    // recError set by composable
  }
}

const playTargetTts = async () => {
  const q = currentQuestion.value
  if (!q || q.format !== 'SPEAK_PROMPT') return
  await speak(q.target, { rate: 0.85 })
}

// ─── Navigation ──────────────────────────────────────────────────────────
const goNext = async () => {
  if (!submitted.value) return

  if (currentIndex.value < currentBatch.value.length - 1) {
    currentIndex.value++
    resetCurrentInputs()
  } else {
    // Finish — persist and show results
    await finishAttempt()
  }
}

const finishAttempt = async () => {
  if (!level.value) return
  isSubmitting.value = true
  try {
    const res = await recordAttempt(level.value, currentBatch.value, answers.value)
    if (res.ok) {
      finalResult.value = {
        scorePct: res.scorePct,
        passed: res.passed,
        xpAwarded: res.xpAwarded,
        correct: answers.value.filter(a => a.correct).length,
        total: answers.value.length
      }
      isFinished.value = true
    }
  } finally {
    isSubmitting.value = false
  }
}

const tryAgain = () => {
  startNewBatch()
}

const backToMap = () => {
  router.push('/student/game')
}

// Start the first batch
startNewBatch()
</script>

<template>
  <div
    v-if="level"
    class="relative min-h-screen"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 rounded-full bg-violet-400/20 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 pb-8 max-w-2xl mx-auto">
      <!-- Header (always) -->
      <header class="mb-6">
        <NuxtLink
          to="/student/game"
          class="text-sm font-semibold text-muted hover:text-primary inline-flex items-center gap-1.5 mb-3"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          К карте уровней
        </NuxtLink>
        <div class="flex items-center gap-3">
          <span class="text-4xl">{{ level.emoji }}</span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Уровень {{ level.order }} · {{ level.tier }}
            </p>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight">
              {{ level.title }}
            </h1>
          </div>
        </div>

        <!-- Progress bar (only while playing) -->
        <div
          v-if="!isFinished"
          class="mt-4"
        >
          <div class="flex items-center justify-between text-xs font-bold mb-1.5">
            <span class="text-muted">Вопрос {{ currentIndex + 1 }} / {{ currentBatch.length }}</span>
            <span class="text-violet-600 dark:text-violet-400 tabular-nums">{{ progressPct }}%</span>
          </div>
          <div class="h-2 rounded-full bg-elevated overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-violet-500 to-fuchsia-600 transition-all duration-500"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
        </div>
      </header>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- FINISHED — results screen -->
      <!-- ════════════════════════════════════════════════════════ -->
      <section
        v-if="isFinished && finalResult"
        class="space-y-5"
      >
        <article
          class="rounded-3xl p-6 sm:p-8 text-center shadow-xl ring-2"
          :class="finalResult.passed
            ? 'bg-linear-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white ring-emerald-300/50'
            : 'bg-linear-to-br from-amber-400 via-orange-500 to-red-500 text-white ring-amber-300/50'"
        >
          <UIcon
            :name="finalResult.passed ? 'i-lucide-trophy' : 'i-lucide-target'"
            class="size-16 mx-auto"
          />
          <p class="mt-3 text-sm font-bold uppercase tracking-widest opacity-90">
            {{ finalResult.passed ? '🎉 Уровень пройден!' : '⚡ Почти получилось!' }}
          </p>
          <p class="mt-2 text-6xl sm:text-7xl font-black tabular-nums">
            {{ finalResult.scorePct }}%
          </p>
          <p class="mt-2 text-sm opacity-90">
            {{ finalResult.correct }} из {{ finalResult.total }} правильных
          </p>

          <div
            v-if="finalResult.passed && finalResult.xpAwarded > 0"
            class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur font-black"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-5"
            />
            +{{ finalResult.xpAwarded }} XP
          </div>
          <p
            v-else-if="!finalResult.passed"
            class="mt-4 text-sm opacity-90"
          >
            Нужно <span class="font-black">{{ PASS_THRESHOLD }}%</span>, чтобы открыть следующий уровень. Попробуй ещё раз — вопросы будут другие
          </p>
        </article>

        <!-- Per-question breakdown — only on pass to avoid abuse via memorization -->
        <article
          v-if="finalResult.passed"
          class="rounded-2xl border border-default bg-default p-5"
        >
          <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
            Разбор по вопросам
          </p>
          <ul class="space-y-2">
            <li
              v-for="(a, i) in answers"
              :key="a.questionId"
              class="flex items-start gap-3 rounded-xl p-3"
              :class="a.correct
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : 'bg-red-50 dark:bg-red-900/20'"
            >
              <div
                class="size-6 shrink-0 rounded-full flex items-center justify-center mt-0.5"
                :class="a.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'"
              >
                <UIcon
                  :name="a.correct ? 'i-lucide-check' : 'i-lucide-x'"
                  class="size-4"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs text-muted">
                  Q{{ i + 1 }} · {{ a.format === 'QUIZ_CHOICE' ? 'тест' : a.format === 'TYPE_ANSWER' ? 'ввод' : a.format === 'SPEAK_PROMPT' ? 'голос' : 'аудио' }}
                </p>
                <p class="text-sm font-medium truncate">
                  {{ a.given }}
                </p>
              </div>
            </li>
          </ul>
        </article>

        <!-- Failure feedback — only counts -->
        <article
          v-else
          class="rounded-2xl border border-default bg-default p-5 text-center"
        >
          <p class="text-xs font-bold uppercase tracking-wider text-muted mb-2">
            🔒 Правильные ответы скрыты
          </p>
          <p class="text-sm text-muted">
            Это специально — чтобы ты учил тему, а не запоминал ответы. На повторной попытке вопросы будут другие
          </p>
        </article>

        <div class="flex flex-wrap gap-3">
          <UButton
            v-if="!finalResult.passed"
            label="Попробовать снова"
            color="primary"
            icon="i-lucide-rotate-ccw"
            size="lg"
            @click="tryAgain"
          />
          <UButton
            v-else
            label="Сыграть ещё раз"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            @click="tryAgain"
          />
          <UButton
            label="К карте уровней"
            color="primary"
            :variant="finalResult.passed ? 'solid' : 'ghost'"
            icon="i-lucide-map"
            size="lg"
            @click="backToMap"
          />
        </div>
      </section>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- PLAYING — one question at a time -->
      <!-- ════════════════════════════════════════════════════════ -->
      <section
        v-else-if="currentQuestion"
        class="space-y-5"
      >
        <!-- Question card -->
        <article class="rounded-3xl border border-default bg-default p-6 sm:p-8 shadow-md">
          <div class="flex items-center gap-2 mb-4">
            <UBadge
              :label="currentQuestion.format === 'QUIZ_CHOICE' ? '🅰️ Тест' : currentQuestion.format === 'TYPE_ANSWER' ? '✍️ Ввод' : currentQuestion.format === 'SPEAK_PROMPT' ? '🎤 Голос' : '🎧 Слушай и пиши'"
              color="neutral"
              variant="subtle"
              size="xs"
            />
          </div>

          <p class="text-lg sm:text-xl font-bold leading-snug">
            {{ currentQuestion.prompt }}
          </p>
          <p
            v-if="currentQuestion.promptRu"
            class="mt-1 text-sm text-muted"
          >
            {{ currentQuestion.promptRu }}
          </p>

          <!-- QUIZ_CHOICE -->
          <div
            v-if="currentQuestion.format === 'QUIZ_CHOICE'"
            class="mt-5 space-y-2"
          >
            <button
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              type="button"
              :disabled="submitted"
              class="w-full rounded-xl border p-3 text-left transition flex items-center gap-3 disabled:cursor-default"
              :class="[
                selectedChoiceIdx === idx && !submitted
                  ? 'border-violet-500 ring-1 ring-violet-300 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-default',
                submitted && idx === selectedChoiceIdx && lastCorrect && 'border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                submitted && idx === selectedChoiceIdx && !lastCorrect && 'border-red-500 ring-1 ring-red-400 bg-red-50 dark:bg-red-900/20',
                submitted && idx !== selectedChoiceIdx && 'opacity-60'
              ]"
              @click="!submitted && (selectedChoiceIdx = idx)"
            >
              <span class="size-8 shrink-0 rounded-lg bg-elevated font-bold text-xs flex items-center justify-center">
                {{ ['A', 'B', 'C', 'D'][idx] }}
              </span>
              <span class="flex-1 font-medium">{{ opt }}</span>
              <UIcon
                v-if="submitted && idx === selectedChoiceIdx && lastCorrect"
                name="i-lucide-check-circle"
                class="size-5 text-emerald-600"
              />
              <UIcon
                v-else-if="submitted && idx === selectedChoiceIdx && !lastCorrect"
                name="i-lucide-x-circle"
                class="size-5 text-red-600"
              />
            </button>

            <UButton
              v-if="!submitted"
              block
              size="lg"
              label="Проверить"
              color="primary"
              :disabled="selectedChoiceIdx === null"
              class="mt-4"
              @click="gradeChoice"
            />
          </div>

          <!-- TYPE_ANSWER -->
          <div
            v-else-if="currentQuestion.format === 'TYPE_ANSWER'"
            class="mt-5 space-y-3"
          >
            <UInput
              v-model="typedAnswer"
              size="lg"
              placeholder="Введи ответ..."
              :disabled="submitted"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              @keyup.enter="!submitted && gradeType()"
            />
            <div
              v-if="submitted"
              class="rounded-xl p-3"
              :class="lastCorrect
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'"
            >
              <p class="font-bold text-sm flex items-center gap-1.5">
                <UIcon
                  :name="lastCorrect ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                  class="size-4"
                />
                {{ lastCorrect ? 'Верно!' : 'Не угадал' }}
              </p>
            </div>
            <UButton
              v-if="!submitted"
              block
              size="lg"
              label="Проверить"
              color="primary"
              :disabled="typedAnswer.trim().length === 0"
              @click="gradeType"
            />
          </div>

          <!-- SPEAK_PROMPT -->
          <div
            v-else-if="currentQuestion.format === 'SPEAK_PROMPT'"
            class="mt-5 space-y-3"
          >
            <UAlert
              v-if="!isSupported"
              icon="i-lucide-alert-triangle"
              color="warning"
              variant="subtle"
              description="Браузер не поддерживает распознавание речи. Открой в Chrome, Edge или Safari."
            />

            <div class="rounded-2xl bg-elevated p-5 text-center">
              <p class="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                🎯 Произнеси:
              </p>
              <p class="text-2xl sm:text-3xl font-black tracking-tight">
                «{{ currentQuestion.target }}»
              </p>
              <UButton
                label="Послушать пример"
                color="neutral"
                variant="ghost"
                icon="i-lucide-volume-2"
                size="sm"
                class="mt-3"
                @click="playTargetTts"
              />
            </div>

            <UAlert
              v-if="recError"
              icon="i-lucide-alert-circle"
              color="error"
              variant="subtle"
              :description="recError"
            />

            <button
              v-if="!submitted"
              type="button"
              :disabled="!isSupported"
              class="w-full rounded-2xl px-6 py-4 text-white font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              :class="isListening
                ? 'bg-linear-to-br from-red-500 to-pink-600 animate-pulse'
                : 'bg-linear-to-br from-emerald-500 to-teal-600'"
              @click="handleSpeak"
            >
              <UIcon
                :name="isListening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
                class="size-6 inline-block -mt-1 mr-2"
              />
              {{ isListening ? 'Слушаю...' : 'Записать ответ' }}
            </button>

            <div
              v-if="submitted"
              class="rounded-xl p-4"
              :class="lastCorrect
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : 'bg-red-50 dark:bg-red-900/20'"
            >
              <div class="flex items-center justify-between mb-2">
                <p
                  class="font-bold text-sm flex items-center gap-1.5"
                  :class="lastCorrect
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'"
                >
                  <UIcon
                    :name="lastCorrect ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                    class="size-4"
                  />
                  {{ lastCorrect ? `Засчитано (${spokenSimilarity}%)` : `${spokenSimilarity}% — нужно ${SPEAK_PASS}%+` }}
                </p>
              </div>
              <p class="text-xs text-muted">
                Услышал: «{{ spokenTranscript }}»
              </p>
            </div>
          </div>

          <!-- LISTEN_TYPE — Reading-like exercise: listen then write -->
          <div
            v-else-if="currentQuestion.format === 'LISTEN_TYPE'"
            class="mt-5 space-y-3"
          >
            <div class="rounded-2xl bg-elevated p-5 text-center">
              <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                🎧 Нажми и слушай (повторно — можно)
              </p>
              <button
                type="button"
                :disabled="isPlayingAudio"
                class="mx-auto rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-600 px-8 py-4 text-white font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                @click="playAudioPrompt"
              >
                <UIcon
                  :name="isPlayingAudio ? 'i-lucide-volume-2' : 'i-lucide-play'"
                  class="size-6 inline-block -mt-1 mr-2"
                  :class="isPlayingAudio && 'animate-pulse'"
                />
                {{ isPlayingAudio ? 'Играю...' : listenPlayCount === 0 ? 'Прослушать' : 'Послушать ещё' }}
              </button>
              <p
                v-if="listenPlayCount > 0"
                class="mt-3 text-xs text-muted"
              >
                Прослушано раз: <span class="font-bold tabular-nums">{{ listenPlayCount }}</span>
              </p>
            </div>

            <UInput
              v-model="typedAnswer"
              size="lg"
              placeholder="Напечатай то, что услышал..."
              :disabled="submitted || listenPlayCount === 0"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              @keyup.enter="!submitted && gradeListen()"
            />
            <p
              v-if="listenPlayCount === 0"
              class="text-xs text-muted text-center"
            >
              Сначала прослушай аудио
            </p>

            <div
              v-if="submitted"
              class="rounded-xl p-3"
              :class="lastCorrect
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'"
            >
              <p class="font-bold text-sm flex items-center gap-1.5">
                <UIcon
                  :name="lastCorrect ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                  class="size-4"
                />
                {{ lastCorrect ? 'Верно!' : 'Не совсем — следи за пунктуацией и регистром не учитываем' }}
              </p>
            </div>

            <UButton
              v-if="!submitted"
              block
              size="lg"
              label="Проверить"
              color="primary"
              :disabled="typedAnswer.trim().length === 0 || listenPlayCount === 0"
              @click="gradeListen"
            />
          </div>
        </article>

        <!-- Next button after grading -->
        <UButton
          v-if="submitted"
          block
          size="lg"
          :label="currentIndex === currentBatch.length - 1 ? 'Завершить уровень' : 'Дальше →'"
          color="primary"
          :icon="currentIndex === currentBatch.length - 1 ? 'i-lucide-flag' : 'i-lucide-arrow-right'"
          :trailing="currentIndex !== currentBatch.length - 1"
          :loading="isSubmitting"
          @click="goNext"
        />
      </section>
    </div>
  </div>
</template>
