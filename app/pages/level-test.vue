<script setup lang="ts">
import { useLevelTest, type AnswerRecord, type LevelTestSummary } from '~/shared/composables/useLevelTest'
import type { LevelTestQuestion } from '~/shared/mock'

definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'Тест уровня английского — Lingaphone',
  description: '50 вопросов, 5 минут — узнай свой реальный уровень английского (A1–C1). Бесплатно, без регистрации.',
  ogTitle: 'Тест уровня английского — Lingaphone',
  ogDescription: '50 вопросов, 5 минут — узнай свой реальный уровень английского. Бесплатно.'
})

const {
  TOTAL_QUESTIONS,
  QUESTIONS_PER_TIER,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  LEVEL_CTA,
  sampleStratified,
  summarize
} = useLevelTest()

type Stage = 'intro' | 'quiz' | 'result'
const stage = ref<Stage>('intro')

const questions = ref<LevelTestQuestion[]>([])
const currentIndex = ref(0)
const answers = ref<AnswerRecord[]>([])
const selectedChoiceIdx = ref<number | null>(null)
const submitted = ref(false)

const startTest = () => {
  questions.value = sampleStratified()
  currentIndex.value = 0
  answers.value = []
  selectedChoiceIdx.value = null
  submitted.value = false
  stage.value = 'quiz'
}

const currentQuestion = computed<LevelTestQuestion | undefined>(() => questions.value[currentIndex.value])
const progressPct = computed(() =>
  questions.value.length === 0
    ? 0
    : Math.round((currentIndex.value / questions.value.length) * 100)
)

const gradeCurrent = () => {
  const q = currentQuestion.value
  if (!q || selectedChoiceIdx.value === null) return
  const correct = selectedChoiceIdx.value === q.correctIndex
  submitted.value = true
  answers.value.push({
    questionId: q.id,
    level: q.level,
    given: selectedChoiceIdx.value,
    correct
  })
}

const summary = ref<LevelTestSummary | null>(null)

const goNext = () => {
  if (!submitted.value) return
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    selectedChoiceIdx.value = null
    submitted.value = false
  } else {
    summary.value = summarize(answers.value)
    stage.value = 'result'
  }
}

const restart = () => {
  summary.value = null
  stage.value = 'intro'
}

// Visual mapping for result
const LEVEL_GRADIENT: Record<string, string> = {
  PRE_A1: 'from-slate-400 to-slate-600',
  A1: 'from-emerald-400 to-teal-600',
  A2: 'from-sky-400 to-blue-600',
  S1: 'from-violet-500 to-fuchsia-600',
  S2: 'from-amber-400 to-orange-600',
  F1: 'from-rose-500 via-pink-600 to-violet-700'
}
const LEVEL_BADGE_CODE: Record<string, string> = {
  PRE_A1: 'Pre-A1', A1: 'A1', A2: 'A2', S1: 'B1', S2: 'B2', F1: 'C1'
}
const TIER_LABEL: Record<string, string> = {
  A1: 'A1 · Starter', A2: 'A2 · Elementary', S1: 'B1 · Pre-Int', S2: 'B2 · Upper-Int', F1: 'C1 · Advanced'
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (stage.value !== 'quiz') return
  if (!submitted.value) {
    const num = parseInt(e.key, 10)
    if (num >= 1 && num <= 4 && currentQuestion.value && currentQuestion.value.options[num - 1]) {
      selectedChoiceIdx.value = num - 1
    } else if (e.key === 'Enter' && selectedChoiceIdx.value !== null) {
      gradeCurrent()
    }
  } else if (e.key === 'Enter') {
    goNext()
  }
}
onMounted(() => window.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <div class="relative min-h-screen bg-default">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 rounded-full bg-primary-400/15 blur-3xl" />
      <div class="absolute top-20 right-10 size-80 rounded-full bg-violet-400/10 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 pb-16 max-w-3xl mx-auto">
      <!-- ════════════════════════════════════════════════════════ -->
      <!-- INTRO -->
      <!-- ════════════════════════════════════════════════════════ -->
      <section
        v-if="stage === 'intro'"
        class="pt-12 sm:pt-20 text-center"
      >
        <p class="text-sm font-black uppercase tracking-widest text-primary">
          🇬🇧 Тест уровня английского
        </p>
        <h1 class="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          Узнай свой реальный уровень<br>за <span class="bg-linear-to-r from-primary-500 to-sky-700 bg-clip-text text-transparent">5 минут</span>
        </h1>
        <p class="mt-5 text-base sm:text-lg text-muted max-w-xl mx-auto">
          50 вопросов от A1 до C1, отобранных случайно из пула в 400+ заданий —
          у каждого студента тест уникальный. Без регистрации, без подвохов
        </p>

        <!-- Stats strip -->
        <div class="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto">
          <div class="rounded-2xl border border-default bg-default p-4">
            <p class="text-2xl sm:text-3xl font-black tabular-nums text-primary">
              50
            </p>
            <p class="text-xs text-muted font-bold mt-0.5">
              вопросов
            </p>
          </div>
          <div class="rounded-2xl border border-default bg-default p-4">
            <p class="text-2xl sm:text-3xl font-black tabular-nums text-primary">
              ~5
            </p>
            <p class="text-xs text-muted font-bold mt-0.5">
              минут
            </p>
          </div>
          <div class="rounded-2xl border border-default bg-default p-4">
            <p class="text-2xl sm:text-3xl font-black tabular-nums text-primary">
              5
            </p>
            <p class="text-xs text-muted font-bold mt-0.5">
              уровней
            </p>
          </div>
        </div>

        <!-- Levels strip -->
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <UBadge
            v-for="tier in ['A1', 'A2', 'B1', 'B2', 'C1']"
            :key="tier"
            :label="tier"
            color="primary"
            variant="subtle"
            size="md"
          />
        </div>

        <!-- CTA -->
        <UButton
          label="Начать тест"
          color="primary"
          size="xl"
          class="mt-10 px-12 py-4 text-lg font-black"
          icon="i-lucide-play"
          @click="startTest"
        />
        <p class="mt-3 text-xs text-muted">
          Подсказка: нажимай <kbd class="px-1.5 py-0.5 rounded bg-elevated font-mono">1-4</kbd> для выбора и <kbd class="px-1.5 py-0.5 rounded bg-elevated font-mono">Enter</kbd> для подтверждения
        </p>

        <!-- How it works -->
        <div class="mt-16 max-w-2xl mx-auto text-left grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-2xl border border-default p-4">
            <p class="text-2xl">
              🎲
            </p>
            <p class="font-bold mt-2">
              50 случайных вопросов
            </p>
            <p class="text-sm text-muted mt-1">
              10 из каждого уровня — от A1 до C1. Каждый запуск даёт новый набор
            </p>
          </div>
          <div class="rounded-2xl border border-default p-4">
            <p class="text-2xl">
              🎯
            </p>
            <p class="font-bold mt-2">
              Точное определение
            </p>
            <p class="text-sm text-muted mt-1">
              Результат — самый высокий уровень, где ты набрал ≥ 60%
            </p>
          </div>
          <div class="rounded-2xl border border-default p-4">
            <p class="text-2xl">
              💌
            </p>
            <p class="font-bold mt-2">
              Без регистрации
            </p>
            <p class="text-sm text-muted mt-1">
              Результат сразу на экране. Хочешь — записывайся на пробный урок
            </p>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- QUIZ -->
      <!-- ════════════════════════════════════════════════════════ -->
      <section
        v-else-if="stage === 'quiz' && currentQuestion"
        class="pt-6 space-y-5"
      >
        <!-- Progress -->
        <div>
          <div class="flex items-center justify-between text-xs font-bold mb-1.5">
            <span class="text-muted">Вопрос <span class="text-default tabular-nums">{{ currentIndex + 1 }}</span> / {{ TOTAL_QUESTIONS }}</span>
            <button
              type="button"
              class="text-xs text-muted hover:text-primary inline-flex items-center gap-1"
              @click="restart"
            >
              <UIcon
                name="i-lucide-x"
                class="size-3.5"
              />
              Отменить
            </button>
          </div>
          <div class="h-2 rounded-full bg-elevated overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-primary-500 to-sky-600 transition-all duration-500"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
        </div>

        <!-- Question card -->
        <article class="rounded-3xl border border-default bg-default p-6 sm:p-8 shadow-md">
          <p class="text-lg sm:text-xl font-bold leading-snug">
            {{ currentQuestion.prompt }}
          </p>

          <div class="mt-5 space-y-2">
            <button
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              type="button"
              :disabled="submitted"
              class="w-full rounded-xl border p-3 text-left transition flex items-center gap-3 disabled:cursor-default"
              :class="[
                selectedChoiceIdx === idx && !submitted
                  ? 'border-primary ring-1 ring-primary bg-primary-50 dark:bg-primary-900/20'
                  : 'border-default hover:border-primary-300',
                submitted && idx === selectedChoiceIdx && answers.at(-1)?.correct && 'border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                submitted && idx === selectedChoiceIdx && !answers.at(-1)?.correct && 'border-red-500 ring-1 ring-red-400 bg-red-50 dark:bg-red-900/20',
                submitted && idx !== selectedChoiceIdx && 'opacity-60'
              ]"
              @click="!submitted && (selectedChoiceIdx = idx)"
            >
              <span class="size-8 shrink-0 rounded-lg bg-elevated font-bold text-xs flex items-center justify-center">
                {{ ['A', 'B', 'C', 'D'][idx] }}
              </span>
              <span class="flex-1 font-medium">{{ opt }}</span>
              <UIcon
                v-if="submitted && idx === selectedChoiceIdx && answers.at(-1)?.correct"
                name="i-lucide-check-circle"
                class="size-5 text-emerald-600"
              />
              <UIcon
                v-else-if="submitted && idx === selectedChoiceIdx && !answers.at(-1)?.correct"
                name="i-lucide-x-circle"
                class="size-5 text-red-600"
              />
            </button>
          </div>
        </article>

        <UButton
          v-if="!submitted"
          block
          size="lg"
          label="Проверить"
          color="primary"
          :disabled="selectedChoiceIdx === null"
          @click="gradeCurrent"
        />
        <UButton
          v-else
          block
          size="lg"
          :label="currentIndex === TOTAL_QUESTIONS - 1 ? 'Увидеть результат →' : 'Дальше →'"
          color="primary"
          :icon="currentIndex === TOTAL_QUESTIONS - 1 ? 'i-lucide-flag' : 'i-lucide-arrow-right'"
          :trailing="currentIndex !== TOTAL_QUESTIONS - 1"
          @click="goNext"
        />
      </section>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- RESULT -->
      <!-- ════════════════════════════════════════════════════════ -->
      <section
        v-else-if="stage === 'result' && summary"
        class="pt-6 space-y-6"
      >
        <!-- Big level reveal -->
        <article
          class="rounded-3xl p-8 sm:p-10 text-center text-white shadow-2xl bg-linear-to-br"
          :class="LEVEL_GRADIENT[summary.level]"
        >
          <p class="text-sm font-bold uppercase tracking-widest opacity-90">
            🎯 Твой уровень
          </p>
          <p class="mt-3 text-6xl sm:text-8xl font-black tracking-tight">
            {{ LEVEL_BADGE_CODE[summary.level] }}
          </p>
          <p class="mt-2 text-lg sm:text-xl font-bold opacity-95">
            {{ LEVEL_LABEL[summary.level] }}
          </p>
          <p class="mt-5 text-sm sm:text-base opacity-90 max-w-lg mx-auto leading-relaxed">
            {{ LEVEL_DESCRIPTION[summary.level] }}
          </p>

          <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur font-bold text-sm">
            <UIcon
              name="i-lucide-check"
              class="size-4"
            />
            {{ summary.totalCorrect }} / {{ summary.totalQuestions }} правильных
          </div>
        </article>

        <!-- Per-tier breakdown -->
        <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
          <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
            Результаты по уровням
          </p>
          <ul class="space-y-3">
            <li
              v-for="(stats, tier) in summary.perTier"
              :key="tier"
              class="flex items-center gap-3"
            >
              <span class="w-20 font-bold text-sm shrink-0">
                {{ TIER_LABEL[tier] }}
              </span>
              <div class="flex-1 h-2.5 rounded-full bg-elevated overflow-hidden">
                <div
                  class="h-full transition-all duration-700"
                  :class="stats.correct >= 6 ? 'bg-emerald-500' : stats.correct >= 3 ? 'bg-amber-500' : 'bg-red-500'"
                  :style="{ width: `${(stats.correct / QUESTIONS_PER_TIER) * 100}%` }"
                />
              </div>
              <span class="w-12 text-right font-black tabular-nums text-sm shrink-0">
                {{ stats.correct }}/{{ stats.total }}
              </span>
            </li>
          </ul>
        </article>

        <!-- CTA -->
        <article class="rounded-3xl bg-linear-to-br from-primary-500 to-sky-700 text-white p-6 sm:p-8 shadow-lg">
          <div class="flex items-start gap-4">
            <div class="size-12 sm:size-14 shrink-0 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <UIcon
                name="i-lucide-sparkles"
                class="size-7"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold uppercase tracking-wider opacity-90">
                Что дальше
              </p>
              <h3 class="mt-1 text-xl sm:text-2xl font-black">
                {{ LEVEL_CTA[summary.level] }}
              </h3>
              <p class="mt-2 text-sm opacity-90">
                В Lingaphone — британская методика, мини-группы и Маркет достижений, где дети получают деньги за результат.
              </p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <UButton
              to="/register"
              label="Записаться на пробный урок"
              color="neutral"
              variant="solid"
              size="lg"
              icon="i-lucide-arrow-right"
              trailing
              class="bg-white text-primary hover:bg-white/90 font-black"
            />
            <UButton
              label="Пройти тест ещё раз"
              color="neutral"
              variant="ghost"
              size="lg"
              icon="i-lucide-rotate-ccw"
              class="text-white hover:bg-white/10"
              @click="restart"
            />
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
