<script setup lang="ts">
import type { CapsuleLayer, LayerProgress, MasteryCheckContent, MasteryQuestion, TrophyTier } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as MasteryCheckContent)
const passingScore = computed(() => content.value.passingScore ?? 80)
const retryAllowed = computed(() => content.value.retryAllowed ?? true)
const trophyThresholds = computed(() => content.value.trophyThresholds ?? { gold: 100, silver: 80, bronze: 60 })
const shareEnabled = computed(() => content.value.shareEnabled !== false)
const startedAt = Date.now()
const previousFailed = computed(() => props.progress?.status === 'FAILED')

const { play } = useSound()
const { flash } = useMascotReactions()

// S14 — Феми приветствует голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => {
  greetLayer('MASTERY_CHECK')
})

// ── Adaptive retry: на повторе берём вопросы из pool, не повторяя legacy
const attemptCount = ref(0)
const questions = computed<MasteryQuestion[]>(() => {
  const base = content.value.questions ?? []
  const pool = content.value.questionPool ?? []
  // На второй+ попытке если есть pool — берём из pool max(base.length) штук
  if (attemptCount.value > 0 && pool.length > 0) {
    return pool.slice(0, base.length || pool.length)
  }
  return base
})

const tier = computed<TrophyTier>(() => {
  const s = scorePct.value
  if (s >= trophyThresholds.value.gold) return 'gold'
  if (s >= trophyThresholds.value.silver) return 'silver'
  if (s >= trophyThresholds.value.bronze) return 'bronze'
  return 'none'
})

// Phases: intro → running → submitted
type Phase = 'intro' | 'running' | 'submitted'
const phase = ref<Phase>('intro')

const idx = ref(0)
const answers = ref<Record<string, string | number>>({})
const submitting = ref(false)
const attemptStartAt = ref(Date.now())

const current = computed<MasteryQuestion | null>(() => questions.value[idx.value] ?? null)
const hasAnswered = (q: MasteryQuestion) => answers.value[q.id] != null && answers.value[q.id] !== ''
const answeredAll = computed(() => questions.value.length > 0 && questions.value.every(hasAnswered))
const currentNumericAnswer = computed({
  get: () => {
    if (!current.value || current.value.kind === 'choice') return ''
    return String(answers.value[current.value.id] ?? '')
  },
  set: (val: string) => {
    if (!current.value || current.value.kind === 'choice') return
    setAnswer(current.value.id, val)
  }
})

const setAnswer = (qId: string, val: string | number) => {
  answers.value[qId] = val
}
/** Pop-анимация плитки при выборе (S8 Phase 1). */
const popIdx = ref<number | null>(null)
let popTimer: ReturnType<typeof setTimeout> | null = null

const pickChoice = (optIdx: number) => {
  if (!current.value) return
  setAnswer(current.value.id, optIdx)
  if (popTimer) clearTimeout(popTimer)
  popIdx.value = optIdx
  popTimer = setTimeout(() => {
    popIdx.value = null
  }, 320)
  play('click')
}

const judgeQuestion = (q: MasteryQuestion): boolean => {
  const a = answers.value[q.id]
  if (a == null) return false
  if (q.kind === 'choice') return Number(a) === q.correctIndex
  const expected = q.correctAnswer
  if (expected == null) return false
  if (typeof expected === 'number') {
    const tol = q.tolerance ?? 0
    return Math.abs(Number(a) - expected) <= tol
  }
  return String(a).trim().toLowerCase() === String(expected).trim().toLowerCase()
}

const correctCount = computed(() => questions.value.filter(judgeQuestion).length)
const scorePct = computed(() => questions.value.length
  ? Math.round((correctCount.value / questions.value.length) * 100)
  : 0)
const passed = computed(() => scorePct.value >= passingScore.value)

const startAttempt = () => {
  answers.value = {}
  idx.value = 0
  phase.value = 'running'
  attemptStartAt.value = Date.now()
  play('click')
}

const nextQ = () => {
  if (idx.value < questions.value.length - 1) idx.value += 1
}
const prevQ = () => {
  if (idx.value > 0) idx.value -= 1
}

const submit = async () => {
  if (submitting.value) return
  phase.value = 'submitted'
  submitting.value = true
  // Звуковая дорожка + маскот по тиру.
  // gold = trophy 2s (большая радость), silver/bronze = celebrate 1.4s (средняя),
  // none = think 800ms (нейтрально-собранно, не warn — провал не вина ребёнка).
  play(tier.value === 'gold' ? 'levelup' : tier.value === 'silver' || tier.value === 'bronze' ? 'cheer' : 'pop')
  if (tier.value === 'gold') flash('trophy', 2000)
  else if (tier.value === 'silver' || tier.value === 'bronze') flash('celebrate', 1400)
  else flash('think', 800)
  try {
    emit('complete', {
      interactionData: {
        interactions: questions.value.map(q => ({
          id: q.id,
          answer: answers.value[q.id] ?? null,
          correct: judgeQuestion(q),
          conceptTag: q.conceptTag,
          cognitiveLevel: q.cognitiveLevel
        })),
        attempt: attemptCount.value + 1,
        tier: tier.value
      },
      score: scorePct.value,
      maxScore: 100,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const retry = () => {
  if (!retryAllowed.value) return
  attemptCount.value++
  phase.value = 'intro'
}

const showShareCard = ref(false)
const toggleShareCard = () => {
  showShareCard.value = !showShareCard.value
  // S9 — Феми смущается при первом раскрытии share-card. Это эмоциональный
  // сигнал «спасибо что хочешь поделиться обо мне ❤️».
  if (showShareCard.value) {
    flash('shy', 1300)
  }
}

const optClass = (q: MasteryQuestion, optIdx: number) => {
  const picked = Number(answers.value[q.id])
  const isPicked = picked === optIdx
  if (phase.value === 'submitted') {
    const isCorrect = q.correctIndex === optIdx
    if (isCorrect) return 'border-emerald-500 bg-emerald-500/10'
    if (isPicked) return 'border-rose-500 bg-rose-500/10'
    return 'border-default opacity-60'
  }
  return isPicked ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/40'
}
</script>

<template>
  <div class="relative space-y-6">
    <div class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
      <UIcon
        name="i-lucide-trophy"
        class="size-3.5"
      />
      Мастери-чек · Порог {{ passingScore }}%
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        :state="phase === 'submitted' && passed ? 'trophy' : 'teach'"
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
         PHASE: INTRO
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="phase === 'intro'"
      class="rounded-2xl border border-default bg-default p-5"
    >
      <p class="text-sm text-highlighted">
        Это финальная проверка. Нужно набрать минимум
        <strong>{{ passingScore }}%</strong> правильных, чтобы завершить капсулу.
      </p>
      <ul class="mt-3 space-y-1 text-sm text-muted">
        <li class="flex items-center gap-2">
          <UIcon
            name="i-lucide-list-checks"
            class="size-4 text-primary"
          />
          {{ questions.length }} заданий
        </li>
        <li class="flex items-center gap-2">
          <UIcon
            name="i-lucide-clock"
            class="size-4 text-primary"
          />
          Без таймера — думай сколько нужно
        </li>
        <li
          v-if="retryAllowed"
          class="flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-refresh-cw"
            class="size-4 text-primary"
          />
          Можно пройти заново, если не получилось с первого раза
        </li>
      </ul>

      <div
        v-if="previousFailed"
        class="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-highlighted"
      >
        Предыдущая попытка — ниже порога. Ничего страшного, давай попробуем ещё раз.
      </div>

      <UButton
        class="mt-4"
        color="primary"
        size="lg"
        @click="startAttempt"
      >
        <UIcon
          name="i-lucide-play"
          class="size-4"
        />
        Начать проверку
      </UButton>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         PHASE: RUNNING
         ═══════════════════════════════════════════════════════════════ -->
    <template v-if="phase === 'running' && current">
      <!-- Progress -->
      <div class="flex items-center gap-2 text-xs">
        <span class="font-semibold text-highlighted">
          Задание {{ idx + 1 }} из {{ questions.length }}
        </span>
        <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <span
            class="block h-full bg-amber-500 transition-all duration-300"
            :style="{ width: `${((idx + 1) / questions.length) * 100}%` }"
          />
        </span>
      </div>

      <!-- Question card -->
      <div class="rounded-2xl border border-default bg-default p-5">
        <p
          class="text-sm font-semibold text-highlighted"
          v-html="renderMath(current.prompt)"
        />

        <!-- Choice -->
        <div
          v-if="current.kind === 'choice' && current.options"
          class="mt-4 space-y-2"
        >
          <button
            v-for="(opt, optIdx) in current.options"
            :key="optIdx"
            type="button"
            class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-elevated px-4 py-3 text-left text-sm transition-all"
            :class="[optClass(current, optIdx), popIdx === optIdx && 'animate-select-pop']"
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
          v-else
          class="mt-4"
        >
          <div class="mx-auto w-full max-w-xs">
            <MathNumpad
              v-model="currentNumericAnswer"
              :expression="current.prompt"
              :show-expression="false"
            />
          </div>
        </div>

        <!-- Controls -->
        <div class="mt-4 flex items-center justify-between gap-2">
          <UButton
            variant="ghost"
            size="sm"
            :disabled="idx === 0"
            @click="prevQ"
          >
            <UIcon
              name="i-lucide-chevron-left"
              class="size-4"
            />
            Назад
          </UButton>

          <UButton
            v-if="idx < questions.length - 1"
            color="primary"
            size="sm"
            :disabled="!hasAnswered(current)"
            @click="nextQ"
          >
            Дальше
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4"
            />
          </UButton>
          <UButton
            v-else
            color="primary"
            size="sm"
            :disabled="!answeredAll"
            :loading="submitting"
            @click="submit"
          >
            Проверить всё
            <UIcon
              name="i-lucide-check"
              class="size-4"
            />
          </UButton>
        </div>
      </div>

      <!-- Question pager -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="(q, i) in questions"
          :key="q.id"
          type="button"
          class="size-7 rounded-lg border-2 text-xs font-bold tabular-nums transition-all"
          :class="i === idx
            ? 'border-primary bg-primary/10 text-primary'
            : hasAnswered(q)
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              : 'border-default bg-elevated text-muted hover:border-primary/40'"
          @click="idx = i"
        >
          {{ i + 1 }}
        </button>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════
         PHASE: SUBMITTED
         ═══════════════════════════════════════════════════════════════ -->
    <template v-if="phase === 'submitted'">
      <div
        class="relative rounded-3xl border-2 p-6 sm:p-8"
        :class="passed
          ? 'border-emerald-500/40 bg-linear-to-br from-emerald-500/10 to-amber-500/10'
          : 'border-amber-500/40 bg-amber-500/5'"
      >
        <TrophyDisplay
          :tier="tier"
          :score-pct="scorePct"
          :fireworks="passed"
        />
        <div class="mt-4 text-center text-sm text-muted">
          <AnimatedCounter
            :value="correctCount"
            :duration="900"
          /> из {{ questions.length }} верно
        </div>
        <p
          class="mt-3 text-center text-base font-bold wrap-break-word"
          :class="passed ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'"
        >
          {{ passed ? 'Капсула пройдена! Ты уверенно владеешь темой.' : `До порога не хватило. Порог — ${passingScore}%.` }}
        </p>

        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <UButton
            v-if="passed && shareEnabled"
            variant="soft"
            color="primary"
            size="lg"
            @click="toggleShareCard"
          >
            <UIcon
              :name="showShareCard ? 'i-lucide-x' : 'i-lucide-share-2'"
              class="size-4"
            />
            {{ showShareCard ? 'Скрыть карточку' : 'Поделиться' }}
          </UButton>
          <UButton
            v-if="!passed && retryAllowed"
            color="primary"
            size="lg"
            @click="retry"
          >
            <UIcon
              name="i-lucide-refresh-cw"
              class="size-4"
            />
            Попробовать ещё раз
          </UButton>
          <NuxtLink
            v-if="passed"
            :to="`/student/my-path`"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <UIcon
              name="i-lucide-map"
              class="size-4"
            />
            Вернуться к «Мой путь»
          </NuxtLink>
        </div>

        <!-- Share card preview -->
        <div
          v-if="passed && shareEnabled && showShareCard"
          class="mt-6 max-w-md mx-auto"
        >
          <ShareCard
            :capsule-name="content.shareCapsuleName ?? layer.title"
            :score-pct="scorePct"
            :tier="tier"
          />
        </div>
      </div>

      <!-- Per-question review -->
      <div class="space-y-2">
        <div class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Разбор ответов
        </div>
        <div
          v-for="(q, i) in questions"
          :key="q.id"
          class="flex items-start gap-3 rounded-xl border border-default bg-elevated px-4 py-3 text-sm"
        >
          <span
            class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            :class="judgeQuestion(q)
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'"
          >
            <UIcon
              :name="judgeQuestion(q) ? 'i-lucide-check' : 'i-lucide-x'"
              class="size-3.5"
            />
          </span>
          <div class="flex-1">
            <div
              class="text-highlighted"
              v-html="renderMath(`${i + 1}. ${q.prompt}`)"
            />
            <div
              v-if="!judgeQuestion(q)"
              class="mt-1 text-xs text-muted"
            >
              Правильный ответ:
              <strong class="text-emerald-600 dark:text-emerald-300">
                {{ q.kind === 'choice' ? (q.options?.[q.correctIndex ?? 0] ?? '') : q.correctAnswer }}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
