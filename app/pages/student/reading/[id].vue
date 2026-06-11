<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { useReadingLibrary, useReadingProgress, READING_LEVEL_META, READING_GENRE_META, EFL_READING_WPM } from '~/entities/reading'
import { ReadingQuiz, useCompleteReading } from '~/features/complete-reading'
import type { QuestionAnswer } from '~/features/complete-reading'
import { LevelUpModal } from '~/entities/game-profile'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const id = computed(() => String(route.params.id))

const { fetchTextById, fetchQuestions } = useReadingLibrary()
const { fetchTextProgress } = useReadingProgress()
const { submitReading } = useCompleteReading()

const { data, pending } = useAsyncData(`reading-${id.value}`, async () => {
  const text = await fetchTextById(id.value)
  if (!text) return null
  const [questions, progress] = await Promise.all([
    fetchQuestions(text.id),
    fetchTextProgress(text.id)
  ])
  return { text, questions, progress }
})

// ── Markdown renderer ─────────────────────────────────────────────────────────
const md = new MarkdownIt({ html: false, linkify: false, typographer: true })
const bodyHtml = computed(() =>
  data.value?.text ? md.render(data.value.text.body) : ''
)

// ── Estimated reading time ────────────────────────────────────────────────────
const readingMinutes = computed(() => {
  const wc = data.value?.text.wordCount
  if (!wc) return null
  return Math.max(1, Math.round(wc / EFL_READING_WPM))
})

// ── Phase machine ─────────────────────────────────────────────────────────────
type Phase = 'read' | 'questions' | 'result'
const phase = ref<Phase>(data.value?.progress?.completedAt ? 'result' : 'read')

// ── Result state ──────────────────────────────────────────────────────────────
const answers = ref<QuestionAnswer[]>([])
const xpEarned = ref(0)
const score = ref(data.value?.progress?.score ?? 0)
const maxScore = ref(data.value?.progress?.maxScore ?? 0)
const isPerfect = ref(false)
const levelUp = ref(false)
const showLevelUp = ref(false)
const submitting = ref(false)

// Pre-fill from existing progress
if (data.value?.progress?.completedAt) {
  score.value = data.value.progress.score
  maxScore.value = data.value.progress.maxScore
}

const scorePercent = computed(() =>
  maxScore.value ? Math.round((score.value / maxScore.value) * 100) : 0
)
const wrongAnswers = computed(() => answers.value.filter(a => !a.correct && a.correctAnswer))

const onQuizDone = async (results: QuestionAnswer[]) => {
  answers.value = results
  submitting.value = true
  phase.value = 'result'

  try {
    const out = await submitReading(data.value!.text.id, results)
    xpEarned.value = out.xpEarned
    score.value = out.score
    maxScore.value = out.maxScore
    isPerfect.value = out.isPerfect
    levelUp.value = out.levelUp
    if (out.levelUp) showLevelUp.value = true
  } finally {
    submitting.value = false
  }
}

const retry = () => {
  answers.value = []
  xpEarned.value = 0
  phase.value = 'questions'
}

const levelMeta = computed(() =>
  data.value?.text ? READING_LEVEL_META[data.value.text.level] : null
)
const genreMeta = computed(() =>
  data.value?.text ? READING_GENRE_META[data.value.text.genre] : null
)

// ── Vocabulary toggle ─────────────────────────────────────────────────────────
const showVocab = ref(false)
</script>

<template>
  <div
    v-if="pending"
    class="p-8"
  >
    <div class="skeleton mx-auto h-10 w-64 rounded-lg" />
    <div class="skeleton mx-auto mt-6 h-96 max-w-2xl rounded-2xl" />
  </div>

  <div
    v-else-if="!data"
    class="p-8 text-center text-muted"
  >
    Текст не найден.
  </div>

  <div
    v-else
    class="relative min-h-screen"
  >
    <!-- Decorative blob -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden"
    >
      <div
        class="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        :class="`bg-linear-to-r ${levelMeta?.gradient}`"
      />
    </div>

    <div class="mx-auto max-w-2xl p-4 pb-16 sm:p-6 lg:p-8">
      <!-- Breadcrumb -->
      <div class="mb-5 flex items-center gap-2 text-sm text-muted">
        <NuxtLink
          to="/student/reading"
          class="hover:text-default"
        >Чтение</NuxtLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
        />
        <span
          class="rounded-md px-2 py-0.5 text-xs font-black"
          :class="[levelMeta?.bg, levelMeta?.color]"
        >
          {{ data.text.level }}
        </span>
        <span
          v-if="genreMeta"
          class="flex items-center gap-1 text-xs"
        >
          <UIcon
            :name="genreMeta.icon"
            class="size-3.5"
          />
          {{ genreMeta.label }}
        </span>
      </div>

      <!-- Title -->
      <h1 class="mb-2 text-2xl font-black tracking-tight sm:text-3xl">
        {{ data.text.title }}
      </h1>

      <!-- Meta row -->
      <div class="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span
          v-if="data.text.topic"
          class="rounded-full bg-elevated px-2.5 py-1"
        >
          {{ data.text.topic }}
        </span>
        <span
          v-if="data.text.wordCount"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-type"
            class="size-3.5"
          />
          {{ data.text.wordCount }} слов
        </span>
        <span
          v-if="readingMinutes"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-clock"
            class="size-3.5"
          />
          ~{{ readingMinutes }} мин
        </span>
        <span
          v-if="data.questions.length"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-circle-help"
            class="size-3.5"
          />
          {{ data.questions.length }} вопросов
        </span>
      </div>

      <!-- Phase indicator -->
      <div class="mb-8 flex items-center gap-0">
        <template
          v-for="(step, i) in ['Чтение', 'Вопросы', 'Результат']"
          :key="step"
        >
          <div
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all"
            :class="
              (phase === 'read' && i === 0) || (phase === 'questions' && i === 1) || (phase === 'result' && i === 2)
                ? 'bg-primary text-white'
                : i < (['read', 'questions', 'result'].indexOf(phase))
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted'
            "
          >
            <UIcon
              v-if="i < ['read', 'questions', 'result'].indexOf(phase)"
              name="i-lucide-check"
              class="size-3"
            />
            {{ step }}
          </div>
          <div
            v-if="i < 2"
            class="mx-1 h-px w-6 bg-border"
          />
        </template>
      </div>

      <!-- ── READ phase ───────────────────────────────────────────────────── -->
      <template v-if="phase === 'read'">
        <UCard class="mb-6">
          <!-- Text body -->
          <div
            class="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-black prose-headings:tracking-tight
              prose-h2:text-lg prose-h2:mt-0 prose-h3:text-base
              prose-code:rounded prose-code:bg-elevated prose-code:px-1 prose-code:py-0.5
              prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg"
            v-html="bodyHtml"
          />

          <!-- Vocabulary section -->
          <div
            v-if="data.text.vocabulary?.length"
            class="mt-6 border-t border-subtle pt-5"
          >
            <button
              class="flex w-full items-center justify-between text-sm font-semibold text-primary"
              @click="showVocab = !showVocab"
            >
              <span class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-bookmark"
                  class="size-4"
                />
                Словарь ({{ data.text.vocabulary.length }} слов)
              </span>
              <UIcon
                :name="showVocab ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4"
              />
            </button>

            <transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
            >
              <div
                v-if="showVocab"
                class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                <div
                  v-for="entry in data.text.vocabulary"
                  :key="entry.word"
                  class="rounded-xl bg-elevated px-3 py-2"
                >
                  <p class="text-sm font-semibold">
                    {{ entry.word }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ entry.translation }}
                  </p>
                  <p
                    v-if="entry.examples?.[0]"
                    class="mt-1 text-xs italic text-muted/70"
                  >
                    "{{ entry.examples[0] }}"
                  </p>
                </div>
              </div>
            </transition>
          </div>
        </UCard>

        <div class="flex items-center justify-between">
          <NuxtLink
            to="/student/reading"
            class="text-sm text-muted hover:text-default"
          >
            ← Все тексты
          </NuxtLink>
          <UButton
            :label="data.questions.length ? 'Ответить на вопросы' : 'Завершить чтение'"
            :icon="data.questions.length ? 'i-lucide-circle-help' : 'i-lucide-check'"
            trailing
            color="primary"
            size="lg"
            @click="phase = data.questions.length ? 'questions' : 'result'"
          />
        </div>
      </template>

      <!-- ── QUESTIONS phase ─────────────────────────────────────────────── -->
      <template v-else-if="phase === 'questions'">
        <ReadingQuiz
          :questions="data.questions"
          @done="onQuizDone"
        />
      </template>

      <!-- ── RESULT phase ────────────────────────────────────────────────── -->
      <template v-else-if="phase === 'result'">
        <!-- Score card -->
        <UCard class="mb-6 text-center">
          <div
            class="mb-4 inline-flex size-24 items-center justify-center rounded-full text-3xl font-black shadow-inner"
            :class="scorePercent === 100
              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
              : scorePercent >= 70
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                : maxScore === 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'"
          >
            <template v-if="maxScore === 0">
              ✓
            </template>
            <template v-else>
              {{ scorePercent }}%
            </template>
          </div>

          <h2 class="text-xl font-black">
            <template v-if="isPerfect">
              Идеально! 🏆
            </template>
            <template v-else-if="scorePercent >= 70 || maxScore === 0">
              Отлично! 🎉
            </template>
            <template v-else>
              Попробуй ещё раз 💪
            </template>
          </h2>

          <p
            v-if="maxScore > 0"
            class="mt-1 text-sm text-muted"
          >
            {{ score }} из {{ maxScore }} очков
          </p>

          <!-- XP badge -->
          <div
            v-if="!submitting && xpEarned"
            class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-400"
          >
            <UIcon
              name="i-lucide-zap"
              class="size-4"
            />
            +{{ xpEarned }} XP
          </div>
          <div
            v-else-if="submitting"
            class="mt-4 inline-flex items-center gap-2 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-4 animate-spin"
            />
            Сохраняем результат...
          </div>
        </UCard>

        <!-- Wrong answers review -->
        <div
          v-if="wrongAnswers.length"
          class="mb-6 space-y-3"
        >
          <h3 class="text-sm font-bold uppercase tracking-wide text-muted">
            Разбор ошибок
          </h3>
          <div
            v-for="a in wrongAnswers"
            :key="a.questionId"
            class="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm dark:border-red-900/40 dark:bg-red-900/10"
          >
            <p class="font-medium">
              {{ a.prompt }}
            </p>
            <div class="mt-2 flex flex-wrap gap-4">
              <span class="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <UIcon
                  name="i-lucide-x"
                  class="size-3.5"
                />
                Твой ответ: <strong>{{ a.userAnswer }}</strong>
              </span>
              <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5"
                />
                Правильно: <strong>{{ a.correctAnswer }}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Vocabulary review -->
        <div
          v-if="data.text.vocabulary?.length"
          class="mb-6"
        >
          <h3 class="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            Слова из текста
          </h3>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
              v-for="entry in data.text.vocabulary"
              :key="entry.word"
              class="flex items-start gap-3 rounded-xl bg-elevated px-3 py-2"
            >
              <UIcon
                name="i-lucide-bookmark"
                class="mt-0.5 size-4 shrink-0 text-primary"
              />
              <div>
                <p class="text-sm font-semibold">
                  {{ entry.word }}
                </p>
                <p class="text-xs text-muted">
                  {{ entry.translation }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <UButton
            v-if="data.questions.length && scorePercent < 100"
            label="Повторить вопросы"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="outline"
            size="lg"
            @click="retry"
          />
          <div class="flex gap-2 sm:ml-auto">
            <NuxtLink to="/student/reading">
              <UButton
                label="Все тексты"
                icon="i-lucide-layout-grid"
                color="neutral"
                variant="ghost"
                size="lg"
              />
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>

    <!-- Level-up modal -->
    <LevelUpModal
      v-if="showLevelUp"
      @close="showLevelUp = false"
    />
  </div>
</template>
