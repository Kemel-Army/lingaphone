<script setup lang="ts">
import { useStudentProgress } from '~/shared/composables/useStudentProgress'
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { ChartData } from 'chart.js'

definePageMeta({ layout: 'dashboard' })

const {
  pending,
  summary,
  topicMastery,
  strengths,
  weaknesses,
  gradeTimeline,
  activityCalendar,
  pronunciationGaps,
  vocabularyBuckets,
  gradeTrend,
  storyStats
} = useStudentProgress()

const { profile, predictedMedal, predictedPayout } = useLingafonStudent()

// ─── Grade trend line chart ──────────────────────────────────────────────
const gradeChartData = computed<ChartData<'line'>>(() => ({
  labels: gradeTimeline.value.labels.map(d =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  ),
  datasets: [
    {
      label: 'Оценка',
      data: gradeTimeline.value.values,
      borderColor: '#16A34A',
      backgroundColor: 'rgba(22, 163, 74, 0.15)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#16A34A'
    }
  ]
}))

const gradeChartOptions = {
  scales: {
    y: {
      beginAtZero: false,
      min: 1,
      max: 5,
      ticks: { stepSize: 1 }
    }
  },
  plugins: {
    legend: { display: false }
  }
}

// ─── Pronunciation gaps bar chart ────────────────────────────────────────
const pronGapsChartData = computed<ChartData<'bar'>>(() => ({
  labels: pronunciationGaps.value.map(p => p.target),
  datasets: [
    {
      label: 'Средний % произношения',
      data: pronunciationGaps.value.map(p => p.averageScore),
      backgroundColor: pronunciationGaps.value.map(p =>
        p.averageScore >= 60 ? 'rgba(251, 191, 36, 0.7)' : 'rgba(239, 68, 68, 0.7)'
      ),
      borderRadius: 8,
      borderSkipped: false
    }
  ]
}))

const pronGapsChartOptions = {
  indexAxis: 'y' as const,
  scales: {
    x: { min: 0, max: 100 }
  },
  plugins: {
    legend: { display: false }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const masteryColor = (pct: number) => {
  if (pct >= 85) return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', accent: 'bg-emerald-500', ring: 'ring-emerald-300' }
  if (pct >= 70) return { bg: 'bg-lime-50 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300', accent: 'bg-lime-500', ring: 'ring-lime-300' }
  if (pct >= 55) return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', accent: 'bg-amber-500', ring: 'ring-amber-300' }
  return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', accent: 'bg-red-500', ring: 'ring-red-300' }
}

const activityLevelClass = (level: number) => {
  switch (level) {
    case 0: return 'bg-elevated'
    case 1: return 'bg-emerald-200 dark:bg-emerald-900'
    case 2: return 'bg-emerald-400 dark:bg-emerald-700'
    case 3: return 'bg-emerald-500 dark:bg-emerald-500'
    case 4: return 'bg-emerald-600 dark:bg-emerald-400'
    default: return 'bg-elevated'
  }
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

const trendMeta = computed(() => {
  switch (gradeTrend.value) {
    case 'up': return { icon: 'i-lucide-trending-up', label: 'Растёт', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
    case 'down': return { icon: 'i-lucide-trending-down', label: 'Снижается', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
    case 'steady': return { icon: 'i-lucide-minus', label: 'Стабильно', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
    default: return { icon: 'i-lucide-help-circle', label: 'Недостаточно данных', color: 'text-muted', bg: 'bg-elevated' }
  }
})

// Group activity cells into 12 columns × 7 rows for grid
const activityGrid = computed(() => {
  const weeks: Array<typeof activityCalendar.value> = []
  for (let i = 0; i < 12; i++) {
    weeks.push(activityCalendar.value.slice(i * 7, (i + 1) * 7))
  }
  return weeks
})

const totalActivity = computed(() => activityCalendar.value.reduce((s, c) => s + c.count, 0))
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 left-1/3 size-96 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <!-- Header -->
      <header class="space-y-2">
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          📊 Аналитика
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Твой прогресс
        </h1>
        <p class="text-sm text-muted">
          Где ты силён, где пробелы и куда движется средний балл — данные за последние недели
        </p>
      </header>

      <!-- Loading -->
      <div
        v-if="pending"
        class="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="h-28 rounded-2xl bg-elevated"
        />
      </div>

      <template v-else>
        <!-- ════════════════════════════════════════════════════════ -->
        <!-- SUMMARY KPIs -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                Средний балл
              </p>
              <UIcon
                :name="trendMeta.icon"
                class="size-4"
                :class="trendMeta.color"
              />
            </div>
            <p class="mt-2 text-3xl sm:text-4xl font-black tabular-nums">
              {{ summary.overallAverage.toFixed(1) }}
            </p>
            <p
              class="mt-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2 py-0.5"
              :class="[trendMeta.bg, trendMeta.color]"
            >
              {{ trendMeta.label }}
            </p>
          </div>

          <div class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Уроков
            </p>
            <p class="mt-2 text-3xl sm:text-4xl font-black tabular-nums">
              {{ summary.totalLessons }}
            </p>
            <p class="mt-1 text-xs text-muted">
              всего по тебе
            </p>
          </div>

          <div class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Практик
            </p>
            <p class="mt-2 text-3xl sm:text-4xl font-black tabular-nums">
              {{ summary.totalPractice }}
            </p>
            <p class="mt-1 text-xs text-muted">
              попыток на тренажёре
            </p>
          </div>

          <div class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Лучший месяц
            </p>
            <p class="mt-2 text-3xl sm:text-4xl font-black tabular-nums">
              {{ summary.bestMonthAverage > 0 ? summary.bestMonthAverage.toFixed(1) : '—' }}
            </p>
            <p class="mt-1 text-xs text-muted">
              рекорд по среднему
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- MEDAL FORECAST -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section
          v-if="profile"
          class="rounded-3xl bg-linear-to-br from-primary-500 to-sky-700 text-white p-5 sm:p-6 shadow-lg flex flex-wrap items-center gap-4"
        >
          <div class="size-14 sm:size-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-target"
              class="size-8"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold uppercase tracking-wider opacity-80">
              Прогноз медали на текущий месяц
            </p>
            <p class="mt-0.5 text-2xl font-black">
              {{ predictedMedal === 'GOLD' ? '🥇 Золото' : predictedMedal === 'SILVER' ? '🥈 Серебро' : predictedMedal === 'BRONZE' ? '🥉 Бронза' : '⚪ Без медали' }}
            </p>
            <p
              v-if="predictedPayout > 0"
              class="text-sm opacity-90"
            >
              Выплата: <span class="font-bold tabular-nums">{{ predictedPayout.toLocaleString('ru-RU') }} ₸</span>
            </p>
          </div>
          <UButton
            to="/student/achievements"
            label="Маркет Достижений"
            color="neutral"
            variant="solid"
            icon="i-lucide-trophy"
            class="bg-white text-primary hover:bg-white/90"
          />
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- TOPIC MASTERY HEATMAP -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section v-if="topicMastery.length > 0">
          <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
            <UIcon
              name="i-lucide-flame"
              class="size-5 text-amber-500"
            />
            Карта тем
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <article
              v-for="t in topicMastery"
              :key="t.topic"
              class="rounded-xl ring-1 p-4 transition hover:scale-[1.01]"
              :class="[masteryColor(t.masteryPct).bg, masteryColor(t.masteryPct).ring]"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <p
                  class="font-bold line-clamp-2"
                  :class="masteryColor(t.masteryPct).text"
                >
                  {{ t.topic }}
                </p>
                <p
                  class="text-2xl font-black tabular-nums shrink-0"
                  :class="masteryColor(t.masteryPct).text"
                >
                  {{ t.masteryPct }}%
                </p>
              </div>
              <div class="h-2 rounded-full bg-white/40 dark:bg-black/30 overflow-hidden">
                <div
                  class="h-full transition-all duration-500"
                  :class="masteryColor(t.masteryPct).accent"
                  :style="{ width: `${t.masteryPct}%` }"
                />
              </div>
              <div class="flex items-center justify-between mt-3 text-xs">
                <span
                  class="opacity-80"
                  :class="masteryColor(t.masteryPct).text"
                >
                  {{ t.gradeCount }} {{ t.gradeCount === 1 ? 'оценка' : t.gradeCount < 5 ? 'оценки' : 'оценок' }}
                </span>
                <span
                  v-if="t.lastGradedAt"
                  class="opacity-70"
                  :class="masteryColor(t.masteryPct).text"
                >
                  {{ formatDate(t.lastGradedAt) }}
                </span>
              </div>
            </article>
          </div>
        </section>

        <div
          v-else
          class="rounded-2xl border border-dashed border-default p-8 text-center"
        >
          <UIcon
            name="i-lucide-info"
            class="size-8 text-muted mx-auto"
          />
          <p class="mt-2 font-bold">
            Ещё нет оценок
          </p>
          <p class="text-sm text-muted">
            Когда педагог поставит первую отметку, появится карта тем
          </p>
        </div>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- STRENGTHS / WEAKNESSES -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section
          v-if="strengths.length > 0 || weaknesses.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <article class="rounded-2xl border border-default bg-default p-5">
            <h3 class="font-bold flex items-center gap-2 mb-3">
              <UIcon
                name="i-lucide-thumbs-up"
                class="size-5 text-emerald-500"
              />
              Твои сильные темы
            </h3>
            <ul
              v-if="strengths.length > 0"
              class="space-y-2"
            >
              <li
                v-for="(s, i) in strengths"
                :key="s.topic"
                class="flex items-center gap-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 p-3"
              >
                <span class="size-7 shrink-0 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <p class="font-bold flex-1 truncate">
                  {{ s.topic }}
                </p>
                <p class="font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {{ s.averageGrade.toFixed(1) }}
                </p>
              </li>
            </ul>
            <p
              v-else
              class="text-sm text-muted"
            >
              Пока недостаточно оценок
            </p>
          </article>

          <article class="rounded-2xl border border-default bg-default p-5">
            <h3 class="font-bold flex items-center gap-2 mb-3">
              <UIcon
                name="i-lucide-alert-circle"
                class="size-5 text-red-500"
              />
              Темы для повторения
            </h3>
            <ul
              v-if="weaknesses.length > 0"
              class="space-y-2"
            >
              <li
                v-for="(w, i) in weaknesses"
                :key="w.topic"
                class="flex items-center gap-3 rounded-xl bg-red-50/60 dark:bg-red-900/20 p-3"
              >
                <span class="size-7 shrink-0 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <p class="font-bold flex-1 truncate">
                  {{ w.topic }}
                </p>
                <p class="font-black tabular-nums text-red-600 dark:text-red-400">
                  {{ w.averageGrade.toFixed(1) }}
                </p>
              </li>
            </ul>
            <p
              v-else
              class="text-sm text-muted"
            >
              Хорошо — ни одной проблемной темы 🎉
            </p>
          </article>
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- GRADE TIMELINE CHART -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section v-if="gradeTimeline.values.length >= 2">
          <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
            <UIcon
              name="i-lucide-line-chart"
              class="size-5 text-primary"
            />
            Динамика оценок
          </h2>
          <article class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <LineChart
              :data="gradeChartData"
              :options="gradeChartOptions"
              :height="280"
            />
          </article>
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- ACTIVITY CALENDAR -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <UIcon
                name="i-lucide-calendar-days"
                class="size-5 text-primary"
              />
              Активность за 12 недель
            </h2>
            <p class="text-sm text-muted">
              <span class="font-black tabular-nums text-default">{{ totalActivity }}</span> действий
            </p>
          </div>

          <article class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <div class="flex gap-1 overflow-x-auto pb-1">
              <div
                v-for="(week, wi) in activityGrid"
                :key="wi"
                class="grid grid-rows-7 gap-1"
              >
                <div
                  v-for="cell in week"
                  :key="cell.date"
                  class="size-3 sm:size-3.5 rounded-sm"
                  :class="activityLevelClass(cell.level)"
                  :title="`${cell.date}: ${cell.count} действий`"
                />
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 mt-3 text-xs text-muted">
              <span>меньше</span>
              <div class="size-3 rounded-sm bg-elevated" />
              <div class="size-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
              <div class="size-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
              <div class="size-3 rounded-sm bg-emerald-500" />
              <div class="size-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
              <span>больше</span>
            </div>
          </article>
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- PRONUNCIATION GAPS -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section v-if="pronunciationGaps.length > 0">
          <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
            <UIcon
              name="i-lucide-mic"
              class="size-5 text-red-500"
            />
            Произношение — над чем работать
          </h2>
          <p class="text-sm text-muted mb-3">
            Карточки с самым низким средним баллом — открой AI-тренажёр и подтяни
          </p>
          <article class="rounded-2xl border border-default bg-default p-4 sm:p-5">
            <BarChart
              :data="pronGapsChartData"
              :options="pronGapsChartOptions"
              :height="Math.max(220, pronunciationGaps.length * 36)"
            />
            <div class="flex justify-end mt-4">
              <UButton
                to="/student/practice"
                label="Открыть AI-тренажёр"
                color="primary"
                icon="i-lucide-headphones"
              />
            </div>
          </article>
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LISTEN & RETELL STATS -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section v-if="storyStats.totalAttempts > 0">
          <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
            <UIcon
              name="i-lucide-book-open"
              class="size-5 text-violet-500"
            />
            Listen &amp; Retell — твоя история
          </h2>

          <!-- Headline KPIs -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div class="rounded-2xl border border-default bg-default p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                Всего попыток
              </p>
              <p class="mt-2 text-3xl font-black tabular-nums">
                {{ storyStats.totalAttempts }}
              </p>
            </div>
            <div class="rounded-2xl border border-default bg-default p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                Рассказов изучено
              </p>
              <p class="mt-2 text-3xl font-black tabular-nums">
                {{ storyStats.uniqueStories }}
              </p>
            </div>
            <div class="rounded-2xl border border-default bg-default p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                Средний %
              </p>
              <p class="mt-2 text-3xl font-black tabular-nums text-violet-600 dark:text-violet-400">
                {{ storyStats.averageScore }}%
              </p>
            </div>
            <div class="rounded-2xl border border-default bg-default p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                Лучший
              </p>
              <p class="mt-2 text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                {{ storyStats.bestScore }}%
              </p>
            </div>
          </div>

          <!-- Per-story breakdown -->
          <article class="rounded-2xl border border-default bg-default overflow-hidden">
            <ul class="divide-y divide-default">
              <li
                v-for="s in storyStats.perStory"
                :key="s.storyId"
                class="flex items-center gap-3 p-4"
              >
                <UBadge
                  :label="s.storyLevel"
                  color="primary"
                  variant="subtle"
                  size="xs"
                />
                <div class="min-w-0 flex-1">
                  <NuxtLink
                    :to="`/student/stories/${s.storyId}`"
                    class="font-bold truncate hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {{ s.storyTitle }}
                  </NuxtLink>
                  <p class="text-xs text-muted mt-0.5">
                    {{ s.attempts }} {{ s.attempts === 1 ? 'попытка' : s.attempts < 5 ? 'попытки' : 'попыток' }}
                    · в среднем {{ s.averageScore }}%
                    · {{ formatDate(s.lastAttemptedAt) }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p
                    class="text-xl font-black tabular-nums"
                    :class="s.bestScore >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                      : s.bestScore >= 55 ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'"
                  >
                    {{ s.bestScore }}%
                  </p>
                  <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                    лучший
                  </p>
                </div>
              </li>
            </ul>
            <div class="p-4 border-t border-default flex justify-end">
              <UButton
                to="/student/materials"
                label="Все рассказы"
                color="primary"
                variant="ghost"
                icon="i-lucide-arrow-right"
                trailing
              />
            </div>
          </article>
        </section>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- VOCABULARY PROGRESS -->
        <!-- ════════════════════════════════════════════════════════ -->
        <section v-if="vocabularyBuckets.total > 0">
          <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
            <UIcon
              name="i-lucide-book-marked"
              class="size-5 text-emerald-500"
            />
            Личный словарь
          </h2>
          <article class="rounded-2xl border border-default bg-default p-5">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-muted">
                  Всего слов
                </p>
                <p class="text-3xl font-black tabular-nums">
                  {{ vocabularyBuckets.total }}
                </p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Освоено
                </p>
                <p class="text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {{ vocabularyBuckets.mastered }}
                </p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Учу
                </p>
                <p class="text-3xl font-black tabular-nums text-amber-600 dark:text-amber-400">
                  {{ vocabularyBuckets.learning }}
                </p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Слабые
                </p>
                <p class="text-3xl font-black tabular-nums text-red-600 dark:text-red-400">
                  {{ vocabularyBuckets.weak }}
                </p>
              </div>
            </div>

            <!-- Stacked progress bar -->
            <div class="h-3 rounded-full bg-elevated overflow-hidden flex">
              <div
                v-if="vocabularyBuckets.mastered > 0"
                class="h-full bg-emerald-500"
                :style="{ width: `${(vocabularyBuckets.mastered / vocabularyBuckets.total) * 100}%` }"
              />
              <div
                v-if="vocabularyBuckets.learning > 0"
                class="h-full bg-amber-500"
                :style="{ width: `${(vocabularyBuckets.learning / vocabularyBuckets.total) * 100}%` }"
              />
              <div
                v-if="vocabularyBuckets.weak > 0"
                class="h-full bg-red-500"
                :style="{ width: `${(vocabularyBuckets.weak / vocabularyBuckets.total) * 100}%` }"
              />
            </div>

            <p class="mt-3 text-sm text-muted">
              Средний лучший балл по словарю: <span class="font-bold text-default tabular-nums">{{ vocabularyBuckets.averageBestScore }}%</span>
            </p>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>
