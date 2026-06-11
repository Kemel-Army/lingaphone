<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { useGrammarTopics, useGrammarProgress, LEVEL_META, MASTERY_LABEL } from '~/entities/grammar'
import { GrammarExerciseRunner, usePracticeGrammar } from '~/features/practice-grammar'
import type { ExerciseResult } from '~/features/practice-grammar'
import { LevelUpModal } from '~/entities/game-profile'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { fetchTopicBySlug, fetchExercises } = useGrammarTopics()
const { fetchTopicProgress } = useGrammarProgress()
const { submitSession } = usePracticeGrammar()

const { data, pending } = useAsyncData(`grammar-${slug.value}`, async () => {
  const topic = await fetchTopicBySlug(slug.value)
  if (!topic) return null
  const [exercises, progress] = await Promise.all([
    fetchExercises(topic.id),
    fetchTopicProgress(topic.id)
  ])
  return { topic, exercises, progress }
})

// ── Markdown renderer ────────────────────────────────────────────────────────
const md = new MarkdownIt({ html: false, linkify: false, typographer: true })
const theoryHtml = computed(() =>
  data.value?.topic ? md.render(data.value.topic.theoryMd) : ''
)

// ── Phase machine ─────────────────────────────────────────────────────────────
type Phase = 'theory' | 'exercises' | 'result'
const phase = ref<Phase>('theory')

// ── Result state ──────────────────────────────────────────────────────────────
const sessionResults = ref<ExerciseResult[]>([])
const xpEarned = ref(0)
const newMastery = ref(0)
const levelUp = ref(false)
const isPerfect = ref(false)
const submitting = ref(false)
const showLevelUp = ref(false)

const score = computed(() => sessionResults.value.filter(r => r.correct).length)
const maxScore = computed(() => sessionResults.value.length)
const scorePercent = computed(() =>
  maxScore.value ? Math.round((score.value / maxScore.value) * 100) : 0
)
const wrongAnswers = computed(() => sessionResults.value.filter(r => !r.correct))
const masteryInfo = computed(() => MASTERY_LABEL(newMastery.value))

const onExercisesDone = async (results: ExerciseResult[]) => {
  sessionResults.value = results
  submitting.value = true
  phase.value = 'result'

  try {
    const maxPossible = results.length * 10
    const out = await submitSession(data.value!.topic.id, results, maxPossible)
    xpEarned.value = out.xpEarned
    newMastery.value = out.newMastery
    levelUp.value = out.levelUp
    isPerfect.value = out.isPerfect
    if (out.levelUp) showLevelUp.value = true
  } finally {
    submitting.value = false
  }
}

const retry = () => {
  sessionResults.value = []
  xpEarned.value = 0
  phase.value = 'exercises'
}

const levelMeta = computed(() =>
  data.value?.topic ? LEVEL_META[data.value.topic.level] : null
)
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
    v-else-if="data"
    class="relative min-h-screen"
  >
    <!-- Decorative blob -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden"
    >
      <div
        class="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        :class="`bg-linear-to-r ${levelMeta?.gradient}`"
      />
    </div>

    <div class="mx-auto max-w-2xl p-4 pb-16 sm:p-6 lg:p-8">
      <!-- Breadcrumb + level badge -->
      <div class="mb-5 flex items-center gap-2 text-sm text-muted">
        <NuxtLink
          to="/student/grammar"
          class="hover:text-default"
        >Грамматика</NuxtLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
        />
        <span
          class="rounded-md px-2 py-0.5 text-xs font-bold"
          :class="[levelMeta?.bg, levelMeta?.color]"
        >
          {{ data.topic.level }}
        </span>
      </div>

      <!-- Title -->
      <h1 class="mb-6 text-2xl font-black tracking-tight sm:text-3xl">
        {{ data.topic.title }}
      </h1>

      <!-- Phase indicator -->
      <div class="mb-8 flex items-center gap-0">
        <template
          v-for="(step, i) in ['Теория', 'Упражнения', 'Результат']"
          :key="step"
        >
          <div
            class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all"
            :class="
              (phase === 'theory' && i === 0)
                || (phase === 'exercises' && i === 1)
                || (phase === 'result' && i === 2)
                ? 'bg-primary text-white'
                : i < (['theory', 'exercises', 'result'].indexOf(phase))
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted'
            "
          >
            <UIcon
              v-if="i < (['theory', 'exercises', 'result'].indexOf(phase))"
              name="i-lucide-check"
              class="size-3"
            />
            <span>{{ step }}</span>
          </div>
          <div
            v-if="i < 2"
            class="mx-1 h-px w-6 bg-border"
          />
        </template>
      </div>

      <!-- ── THEORY phase ─────────────────────────────────────────────────── -->
      <template v-if="phase === 'theory'">
        <UCard class="mb-6">
          <!-- Video embed if available -->
          <div
            v-if="data.topic.videoUrl"
            class="mb-6 overflow-hidden rounded-xl"
          >
            <iframe
              :src="`https://www.youtube-nocookie.com/embed/${data.topic.videoUrl}`"
              class="aspect-video w-full"
              allowfullscreen
              frameborder="0"
            />
          </div>

          <!-- Markdown theory -->
          <div
            class="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-black prose-headings:tracking-tight
              prose-h2:text-lg prose-h2:mt-0 prose-h3:text-base
              prose-table:text-sm prose-th:font-bold
              prose-code:rounded prose-code:bg-elevated prose-code:px-1 prose-code:py-0.5
              prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-lg
              dark:prose-blockquote:bg-amber-900/20"
            v-html="theoryHtml"
          />
        </UCard>

        <div class="flex items-center justify-between">
          <NuxtLink
            to="/student/grammar"
            class="text-sm text-muted hover:text-default"
          >
            ← Все темы
          </NuxtLink>
          <UButton
            label="Начать упражнения"
            icon="i-lucide-pencil"
            trailing
            color="primary"
            size="lg"
            :disabled="!data.exercises.length"
            @click="phase = 'exercises'"
          />
        </div>
        <p
          v-if="!data.exercises.length"
          class="mt-2 text-right text-xs text-muted"
        >
          Упражнения для этой темы пока добавляются
        </p>
      </template>

      <!-- ── EXERCISES phase ─────────────────────────────────────────────── -->
      <template v-else-if="phase === 'exercises'">
        <GrammarExerciseRunner
          :exercises="data.exercises"
          @done="onExercisesDone"
        />
      </template>

      <!-- ── RESULT phase ────────────────────────────────────────────────── -->
      <template v-else-if="phase === 'result'">
        <!-- Score card -->
        <UCard class="mb-6 text-center">
          <!-- Score circle -->
          <div
            class="mb-4 inline-flex size-24 items-center justify-center rounded-full text-3xl font-black shadow-inner"
            :class="scorePercent === 100
              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
              : scorePercent >= 70
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'"
          >
            {{ scorePercent }}%
          </div>

          <h2 class="text-xl font-black">
            <template v-if="isPerfect">
              Идеально! 🏆
            </template>
            <template v-else-if="scorePercent >= 70">
              Отлично! 🎉
            </template>
            <template v-else>
              Попробуй ещё раз 💪
            </template>
          </h2>

          <p class="mt-1 text-sm text-muted">
            {{ score }} из {{ maxScore }} правильных ответов
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

          <!-- Mastery update -->
          <div
            v-if="!submitting"
            class="mt-3 flex items-center justify-center gap-2 text-sm"
            :class="masteryInfo.color"
          >
            <UIcon
              :name="masteryInfo.icon"
              class="size-4"
            />
            Освоение темы: <strong>{{ masteryInfo.label }}</strong> ({{ Math.round(newMastery * 100) }}%)
          </div>
        </UCard>

        <!-- Wrong answers review -->
        <div
          v-if="wrongAnswers.length"
          class="mb-6 space-y-3"
        >
          <h3 class="text-sm font-bold text-muted uppercase tracking-wide">
            Разбор ошибок
          </h3>
          <div
            v-for="r in wrongAnswers"
            :key="r.exerciseId"
            class="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm dark:border-red-900/40 dark:bg-red-900/10"
          >
            <p class="font-medium text-default">
              {{ r.prompt }}
            </p>
            <div class="mt-2 flex flex-wrap gap-4">
              <span class="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <UIcon
                  name="i-lucide-x"
                  class="size-3.5"
                />
                Твой ответ: <strong>{{ r.userAnswer }}</strong>
              </span>
              <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5"
                />
                Правильно: <strong>{{ r.correctAnswer }}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <UButton
            label="Повторить"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="outline"
            size="lg"
            @click="retry"
          />
          <div class="flex gap-2">
            <NuxtLink to="/student/grammar">
              <UButton
                label="Все темы"
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
