<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'

definePageMeta({ layout: 'dashboard' })

const { gradeJournal, myGroups, profile } = useLingafonStudent()

// expose as gradeHistory so the rest of the script reads naturally
const gradeHistory = gradeJournal

const groupById = computed(() => {
  const map: Record<string, typeof myGroups.value[number]> = {}
  for (const g of myGroups.value) map[g.id] = g
  return map
})

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'short'
})

const monthLabel = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  month: 'long', year: 'numeric'
})

// Group by month
const grouped = computed(() => {
  const buckets: Record<string, { label: string, grades: typeof gradeHistory.value, average: number }> = {}
  for (const g of gradeHistory.value) {
    const d = new Date(g.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!buckets[key]) {
      buckets[key] = { label: monthLabel(g.date), grades: [], average: 0 }
    }
    buckets[key]!.grades.push(g)
  }
  for (const b of Object.values(buckets)) {
    const sum = b.grades.reduce((s, g) => s + g.value, 0)
    b.average = b.grades.length ? sum / b.grades.length : 0
  }
  return Object.entries(buckets)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, v]) => ({ key, ...v }))
})

const totalAvg = computed(() => {
  if (gradeHistory.value.length === 0) return 0
  return gradeHistory.value.reduce((s, g) => s + g.value, 0) / gradeHistory.value.length
})

const fivesCount = computed(() => gradeHistory.value.filter(g => g.value === 5).length)

const gradeColor = (v: number) => {
  if (v === 5) return 'bg-linear-to-br from-emerald-400 to-emerald-600 text-white'
  if (v === 4) return 'bg-linear-to-br from-sky-400 to-sky-600 text-white'
  if (v === 3) return 'bg-linear-to-br from-amber-400 to-amber-600 text-white'
  return 'bg-linear-to-br from-red-400 to-red-600 text-white'
}

const predictedMedalFromAvg = (avg: number) => {
  if (avg >= 4.6) return { label: '🥇 Золото', color: 'text-yellow-700 dark:text-yellow-300' }
  if (avg >= 4.0) return { label: '🥈 Серебро', color: 'text-gray-600 dark:text-gray-300' }
  if (avg >= 3.6) return { label: '🥉 Бронза', color: 'text-amber-700 dark:text-amber-400' }
  return { label: 'Без медали', color: 'text-muted' }
}
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 right-1/3 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <header class="space-y-2">
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          📊 Журнал
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Мои оценки
        </h1>
        <p class="text-sm text-muted">
          Каждая оценка влияет на твою медаль месяца
        </p>
      </header>

      <!-- Summary -->
      <section class="grid grid-cols-3 gap-3">
        <div class="rounded-2xl ring-1 ring-default p-5 text-center">
          <p class="text-xs uppercase tracking-wider text-muted font-bold">
            Общий ср.балл
          </p>
          <p class="mt-1 text-4xl font-black tabular-nums">
            {{ totalAvg.toFixed(1) }}
          </p>
          <p
            class="text-xs font-semibold mt-1"
            :class="predictedMedalFromAvg(totalAvg).color"
          >
            {{ predictedMedalFromAvg(totalAvg).label }}
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-emerald-200/60 dark:ring-emerald-700/30 bg-emerald-50 dark:bg-emerald-900/20 p-5 text-center">
          <p class="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">
            Пятёрок
          </p>
          <p class="mt-1 text-4xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {{ fivesCount }}
          </p>
          <p class="text-xs text-emerald-700/70 dark:text-emerald-300/70 mt-1">
            из {{ gradeHistory.length }}
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-primary-200/60 dark:ring-primary-700/30 bg-primary-50 dark:bg-primary-900/20 p-5 text-center">
          <p class="text-xs uppercase tracking-wider text-primary font-bold">
            Тек. месяц
          </p>
          <p class="mt-1 text-4xl font-black tabular-nums text-primary">
            {{ (profile?.currentMonthAverage ?? 0).toFixed(1) }}
          </p>
          <p
            class="text-xs font-semibold mt-1"
            :class="predictedMedalFromAvg(profile?.currentMonthAverage ?? 0).color"
          >
            {{ predictedMedalFromAvg(profile?.currentMonthAverage ?? 0).label }}
          </p>
        </div>
      </section>

      <!-- Grouped by month -->
      <section
        v-for="bucket in grouped"
        :key="bucket.key"
        class="space-y-3"
      >
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="font-bold text-lg capitalize">
            {{ bucket.label }}
          </h2>
          <div class="flex items-center gap-2">
            <p class="text-sm text-muted">
              Средний: <span class="font-black tabular-nums text-default">{{ bucket.average.toFixed(1) }}</span>
            </p>
            <UBadge
              :label="predictedMedalFromAvg(bucket.average).label"
              variant="subtle"
              color="neutral"
              size="xs"
            />
          </div>
        </div>

        <div class="space-y-2">
          <article
            v-for="g in bucket.grades"
            :key="g.id"
            class="rounded-xl border border-default bg-default p-4 flex items-center gap-4"
          >
            <div
              class="size-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-md shrink-0"
              :class="gradeColor(g.value)"
            >
              {{ g.value }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold truncate">
                {{ g.topic }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                {{ formatDate(g.date) }} ·
                {{ groupById[g.groupId]?.name ?? 'Группа' }} ·
                {{ g.teacherName }}
              </p>
              <p
                v-if="g.comment"
                class="text-sm text-muted italic mt-1.5"
              >
                «{{ g.comment }}»
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
