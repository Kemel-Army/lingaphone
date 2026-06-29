<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { Database } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type MedalKind = Database['public']['Enums']['MedalKind']
type EnglishLevel = Database['public']['Enums']['EnglishLevel']

const {
  profile, nextLesson, myGroups, predictedMedal, predictedPayout,
  medalHistory, homeworkList, wordOfDay, dailyQuests,
  level, xpInCurrentLevel, xpToNextLevel
} = useLingafonStudent()

const dailyQuestsCompleted = computed(() => dailyQuests.value.filter(q => q.done).length)
const dailyXpEarned = computed(() => dailyQuests.value.filter(q => q.done).reduce((s, q) => s + q.rewardXp, 0))
const dailyXpTotal = computed(() => dailyQuests.value.reduce((s, q) => s + q.rewardXp, 0))

const handleSpeakWord = async () => {
  const { speak } = await import('~/shared/composables/useSpeech')
  await speak(wordOfDay.value.word, { rate: 0.85 })
}

const MEDAL_META: Record<MedalKind, {
  icon: string
  label: string
  color: string
  bg: string
  ring: string
  gradient: string
  glow: string
}> = {
  GOLD: {
    icon: 'i-lucide-medal',
    label: 'Золото',
    color: 'text-yellow-700 dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    ring: 'ring-yellow-300/60',
    gradient: 'from-yellow-300 via-amber-400 to-yellow-500',
    glow: 'shadow-[0_0_40px_-5px_rgb(234_179_8/0.5)]'
  },
  SILVER: {
    icon: 'i-lucide-medal',
    label: 'Серебро',
    color: 'text-gray-700 dark:text-gray-200',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    ring: 'ring-gray-300/60',
    gradient: 'from-gray-300 via-gray-400 to-slate-400',
    glow: 'shadow-[0_0_40px_-5px_rgb(148_163_184/0.5)]'
  },
  BRONZE: {
    icon: 'i-lucide-medal',
    label: 'Бронза',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    ring: 'ring-amber-300/60',
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    glow: 'shadow-[0_0_40px_-5px_rgb(245_158_11/0.5)]'
  },
  NONE: {
    icon: 'i-lucide-circle-dashed',
    label: 'Без медали',
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900',
    ring: 'ring-gray-200/40',
    gradient: 'from-gray-300 to-gray-400',
    glow: ''
  }
}

const LEVEL_LABELS: Record<EnglishLevel, string> = {
  A1: 'A1 — Starter',
  A2: 'A2 — Elementary',
  S1: 'S1 — Pre-Intermediate',
  S2: 'S2 — Intermediate',
  B2: 'B2 — Upper-Intermediate',
  F1: 'F1 — Advanced',
  F2: 'F2 — Advanced+',
  F3: 'F3 — Proficient',
  F4: 'F4 — Mastery'
}

const medalMeta = computed(() => MEDAL_META[predictedMedal.value])

const formatTenge = (v: number) => `${v.toLocaleString('ru-RU')} ₸`

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
})

const timeUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms < 0) return 'идёт сейчас'
  const hours = Math.floor(ms / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`
  if (hours > 0) return `через ${hours} ч`
  const mins = Math.floor(ms / 60000)
  return `через ${mins} мин`
}

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
// Group.schedule is freeform jsonb — tolerate both the legacy array shape
// ([{ weekday, startTime }]) and the admin-form object shape ({ days, time }).
const formatSchedule = (schedule: unknown): string => {
  if (!schedule) return ''
  if (Array.isArray(schedule)) {
    return schedule
      .map((slot: { weekday?: number, startTime?: string }) =>
        `${WEEKDAY_SHORT[slot.weekday ?? 0] ?? ''} ${slot.startTime ?? ''}`.trim())
      .filter(Boolean)
      .join(' · ')
  }
  if (typeof schedule === 'object') {
    const s = schedule as { days?: Array<string | { label?: string, value?: string }>, time?: string }
    const days = (s.days ?? [])
      .map(d => typeof d === 'string' ? d : (d.label ?? d.value ?? ''))
      .filter(Boolean)
    if (!days.length) return ''
    return `${days.join(' · ')}${s.time ? ` · ${s.time}` : ''}`
  }
  return ''
}

const goldProgressPct = computed(() => Math.max(0, Math.min(100, ((profile.value?.currentMonthAverage ?? 0) / 5.0) * 100)))
const goldRemaining = computed(() => Math.max(0, 4.6 - (profile.value?.currentMonthAverage ?? 0)))

const currentMonthLabel = computed(() =>
  new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
})
</script>

<template>
  <div class="relative">
    <!-- Decorative background blobs -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 -right-32 size-96 rounded-full bg-primary-400/20 blur-3xl" />
      <div class="absolute -top-40 left-1/3 size-80 rounded-full bg-yellow-300/15 blur-3xl" />
    </div>

    <!-- Loading state -->
    <div
      v-if="!profile"
      class="p-8 max-w-7xl mx-auto"
    >
      <div class="animate-pulse space-y-6">
        <div class="h-12 w-2/3 rounded-xl bg-elevated" />
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="lg:col-span-2 h-64 rounded-3xl bg-elevated" />
          <div class="space-y-4">
            <div class="h-32 rounded-2xl bg-elevated" />
            <div class="h-32 rounded-2xl bg-elevated" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto"
    >
      <!-- Hero header -->
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs sm:text-sm font-medium text-primary">
            🎧 {{ greeting }}, {{ profile.name }}!
          </p>
          <h1 class="mt-1 text-2xl sm:text-4xl font-black tracking-tight">
            Английский — как
            <span class="bg-linear-to-r from-primary-500 to-sky-700 bg-clip-text text-transparent">второй родной</span>
          </h1>
        </div>
        <UBadge
          :label="LEVEL_LABELS[profile.level]"
          color="primary"
          variant="solid"
          icon="i-lucide-graduation-cap"
          class="font-bold shrink-0"
        />
      </header>

      <!-- Top row: Medal hero (big) + side stats -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- DRAMATIC medal hero -->
        <div
          class="lg:col-span-2 relative rounded-3xl overflow-hidden ring-1 transition-all duration-500 hover:scale-[1.005]"
          :class="[medalMeta.bg, medalMeta.ring, medalMeta.glow]"
        >
          <!-- Background sheen -->
          <div
            aria-hidden="true"
            class="absolute inset-0 bg-linear-to-br opacity-30"
            :class="medalMeta.gradient"
          />

          <div class="relative p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
            <!-- Big medal -->
            <div class="flex justify-center sm:block">
              <div
                class="relative size-32 sm:size-36 rounded-full p-1 bg-linear-to-br shadow-2xl"
                :class="medalMeta.gradient"
              >
                <div class="size-full rounded-full bg-white/95 dark:bg-gray-900/90 flex items-center justify-center">
                  <UIcon
                    :name="medalMeta.icon"
                    class="size-20 sm:size-24"
                    :class="medalMeta.color"
                  />
                </div>
                <!-- Sparkle accents -->
                <span class="absolute -top-1 -right-1 size-3 rounded-full bg-yellow-300 animate-ping" />
                <span class="absolute top-2 -left-2 size-2 rounded-full bg-white" />
              </div>
            </div>

            <!-- Content -->
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                {{ currentMonthLabel }} — прогноз
              </p>
              <h2
                class="mt-1 text-4xl sm:text-5xl font-black"
                :class="medalMeta.color"
              >
                {{ medalMeta.label }}
              </h2>
              <p
                v-if="predictedPayout > 0"
                class="mt-2 text-lg font-bold"
                :class="medalMeta.color"
              >
                Заработаешь {{ formatTenge(predictedPayout) }} в конце месяца
              </p>

              <!-- Progress to gold -->
              <div class="mt-5">
                <div class="flex justify-between text-xs font-semibold opacity-80 mb-1.5">
                  <span>Средний балл</span>
                  <span class="tabular-nums">{{ profile.currentMonthAverage.toFixed(1) }} / 5.0</span>
                </div>
                <div class="relative h-3 rounded-full bg-white/40 dark:bg-black/30 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-linear-to-r from-amber-400 via-gray-300 to-yellow-500 transition-all duration-700"
                    :style="{ width: `${goldProgressPct}%` }"
                  />
                  <!-- Threshold markers -->
                  <div
                    v-for="(t, i) in [3.6, 4.0, 4.6]"
                    :key="i"
                    class="absolute top-0 h-3 w-px bg-black/40 dark:bg-white/40"
                    :style="{ left: `${(t / 5.0) * 100}%` }"
                  />
                </div>
                <div class="flex justify-between text-[10px] font-semibold opacity-70 mt-1">
                  <span>🥉 3.6</span>
                  <span>🥈 4.0</span>
                  <span>🥇 4.6</span>
                  <span>5.0</span>
                </div>
                <p
                  v-if="goldRemaining > 0"
                  class="mt-3 text-sm font-medium opacity-90"
                >
                  До золота осталось <span class="font-black">{{ goldRemaining.toFixed(1) }}</span> к среднему ✨
                </p>
                <p
                  v-else
                  class="mt-3 text-sm font-bold"
                  :class="medalMeta.color"
                >
                  🔥 Ты на пути к золоту!
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Side stats column -->
        <div class="space-y-4">
          <!-- Streak -->
          <div class="group relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-400 to-red-500 p-5 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
            <UIcon
              name="i-lucide-flame"
              class="absolute -bottom-4 -right-4 size-28 opacity-15 group-hover:rotate-12 transition-transform duration-500"
            />
            <p class="text-xs font-bold uppercase tracking-wider opacity-90">
              Streak золота
            </p>
            <p class="mt-1 text-4xl font-black tabular-nums">
              {{ profile.goldStreak }}
            </p>
            <p class="text-sm opacity-90">
              {{ profile.goldStreak === 1 ? 'месяц подряд' : 'месяца подряд' }}
            </p>
            <div class="mt-3 h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div
                class="h-full bg-white"
                :style="{ width: `${Math.min(100, (profile.goldStreak / 3) * 100)}%` }"
              />
            </div>
            <p class="mt-2 text-xs opacity-90">
              <template v-if="profile.goldStreak >= 3">
                🎁 Бонус +5 000 ₸ активен
              </template>
              <template v-else>
                Ещё {{ 3 - profile.goldStreak }} мес — бонус +5 000 ₸
              </template>
            </p>
          </div>

          <!-- XP / level -->
          <div class="group relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-500 to-purple-700 p-5 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
            <UIcon
              name="i-lucide-sparkles"
              class="absolute -bottom-3 -right-3 size-24 opacity-15 group-hover:rotate-6 transition-transform duration-500"
            />
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-bold uppercase tracking-wider opacity-90">
                Уровень
              </p>
              <span class="text-[10px] font-bold opacity-80 tabular-nums">
                {{ profile.totalXp.toLocaleString('ru-RU') }} XP
              </span>
            </div>
            <p class="mt-1 text-4xl font-black tabular-nums">
              {{ level }}
            </p>
            <div class="mt-3 h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div
                class="h-full bg-white transition-all"
                :style="{ width: `${(xpInCurrentLevel / (xpInCurrentLevel + xpToNextLevel)) * 100}%` }"
              />
            </div>
            <p class="mt-2 text-xs opacity-90">
              Ещё <span class="font-bold tabular-nums">{{ xpToNextLevel }}</span> XP до уровня {{ level + 1 }}
            </p>
          </div>

          <!-- Total earned -->
          <div class="group relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
            <UIcon
              name="i-lucide-wallet"
              class="absolute -bottom-3 -right-3 size-24 opacity-15 group-hover:rotate-6 transition-transform duration-500"
            />
            <p class="text-xs font-bold uppercase tracking-wider opacity-90">
              Заработано всего
            </p>
            <p class="mt-1 text-3xl font-black tabular-nums">
              {{ formatTenge(profile.totalEarnings) }}
            </p>
            <p class="text-sm opacity-90">
              в Маркете Достижений
            </p>
            <NuxtLink
              to="/student/achievements"
              class="mt-3 inline-flex items-center gap-1 text-sm font-bold underline-offset-2 hover:underline"
            >
              Подробнее
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Word of the Day + Daily Quests -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Word of the Day -->
        <div class="lg:col-span-2 group relative rounded-3xl bg-linear-to-br from-violet-500 via-purple-600 to-indigo-700 p-6 text-white overflow-hidden shadow-xl">
          <UIcon
            name="i-lucide-quote"
            aria-hidden="true"
            class="absolute top-4 right-4 size-12 opacity-15"
          />
          <UIcon
            name="i-lucide-sparkles"
            aria-hidden="true"
            class="absolute -bottom-4 -left-4 size-32 opacity-10 group-hover:rotate-12 transition-transform duration-500"
          />

          <div class="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-end">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-widest opacity-80">
                ✨ Слово дня
              </p>
              <p class="mt-2 text-4xl sm:text-5xl font-black tracking-tight">
                {{ wordOfDay.word }}
              </p>
              <p class="mt-1 text-sm font-mono opacity-80">
                {{ wordOfDay.ipa }} · {{ wordOfDay.translation }}
              </p>
              <p class="mt-3 italic opacity-90">
                «{{ wordOfDay.example }}»
              </p>
              <p
                v-if="wordOfDay.funFact"
                class="mt-3 text-xs opacity-80"
              >
                {{ wordOfDay.funFact }}
              </p>
            </div>
            <button
              type="button"
              class="size-16 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center hover:bg-white/25 hover:scale-105 transition-all shrink-0"
              aria-label="Прослушать"
              @click="handleSpeakWord"
            >
              <UIcon
                name="i-lucide-volume-2"
                class="size-7"
              />
            </button>
          </div>
        </div>

        <!-- Daily quests -->
        <div class="rounded-3xl border border-default bg-default p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                🎯 Сегодня
              </p>
              <p class="text-base font-black mt-0.5">
                Daily streak {{ profile.dailyStreak }} 🔥
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                XP
              </p>
              <p class="text-lg font-black tabular-nums text-primary">
                {{ dailyXpEarned }}<span class="text-dimmed text-sm">/{{ dailyXpTotal }}</span>
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <NuxtLink
              v-for="q in dailyQuests"
              :key="q.id"
              :to="q.action"
              class="block rounded-xl border border-default p-3 hover:border-primary-300 hover:shadow-sm transition"
              :class="q.done && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60'"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  :name="q.done ? 'i-lucide-check-circle-2' : q.icon"
                  class="size-5 shrink-0"
                  :class="q.done ? 'text-emerald-500' : 'text-primary'"
                />
                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm font-bold truncate"
                    :class="q.done && 'line-through opacity-60'"
                  >
                    {{ q.title }}
                  </p>
                </div>
                <p class="text-xs font-bold text-primary tabular-nums shrink-0">
                  +{{ q.rewardXp }}
                </p>
              </div>
              <div
                v-if="!q.done && q.progress > 0"
                class="mt-2 h-1.5 rounded-full bg-elevated overflow-hidden"
              >
                <div
                  class="h-full bg-primary transition-all"
                  :style="{ width: `${q.progress * 100}%` }"
                />
              </div>
            </NuxtLink>
          </div>

          <p class="text-xs text-muted text-center pt-1">
            Выполнено: <span class="font-bold tabular-nums text-default">{{ dailyQuestsCompleted }}/{{ dailyQuests.length }}</span>
          </p>
        </div>
      </div>

      <!-- Next lesson banner -->
      <div
        v-if="nextLesson"
        class="rounded-2xl bg-linear-to-r from-primary-500 to-sky-700 p-5 sm:p-6 text-white shadow-lg flex flex-wrap items-center gap-4 sm:gap-6"
      >
        <div class="size-14 sm:size-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-clock"
            class="size-8"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold uppercase tracking-wider opacity-90">
            Ближайший урок · {{ timeUntil(nextLesson.startsAt) }}
          </p>
          <p class="mt-0.5 text-lg sm:text-xl font-bold truncate">
            {{ nextLesson.topic }}
          </p>
          <p class="text-sm opacity-90">
            {{ formatDateTime(nextLesson.startsAt) }} · {{ nextLesson.durationMin }} мин
          </p>
        </div>
        <UButton
          to="/student/schedule"
          label="Расписание"
          color="neutral"
          variant="solid"
          icon="i-lucide-calendar"
          class="bg-white text-primary hover:bg-white/90"
        />
      </div>

      <!-- Two columns: My Groups + Side panel -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Left: My groups -->
        <div class="xl:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <UIcon
                name="i-lucide-users"
                class="size-5 text-primary"
              />
              Мои группы
            </h2>
            <NuxtLink
              to="/student/groups"
              class="text-sm font-semibold text-primary hover:underline"
            >
              Все группы →
            </NuxtLink>
          </div>

          <div class="space-y-3">
            <div
              v-for="g in myGroups"
              :key="g.id"
              class="group relative rounded-2xl border border-default bg-default p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div class="flex items-start gap-4">
                <!-- Teacher avatar -->
                <div class="size-12 sm:size-14 shrink-0 rounded-2xl bg-linear-to-br from-primary-400 to-sky-700 text-white font-black text-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  {{ g.teacher?.name?.charAt(0) ?? '?' }}{{ g.teacher?.surname?.charAt(0) ?? '' }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <UBadge
                      :label="g.level"
                      color="primary"
                      variant="solid"
                      size="xs"
                    />
                    <UBadge
                      v-if="g.branch"
                      :label="g.branch?.kind === 'ONLINE' ? '🌐 Online' : '📍 Offline'"
                      :color="g.branch?.kind === 'ONLINE' ? 'info' : 'success'"
                      variant="subtle"
                      size="xs"
                    />
                    <h3 class="font-bold truncate">
                      {{ g.name }}
                    </h3>
                  </div>
                  <p class="text-sm text-muted mt-1">
                    {{ g.teacher ? `${g.teacher.name} ${g.teacher.surname}` : 'Преподаватель не назначен' }}<template v-if="g.branch">
                      · {{ g.branch.name }}
                    </template>
                  </p>
                  <p class="text-xs text-muted mt-0.5 font-mono">
                    {{ formatSchedule(g.schedule) }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                    в группе
                  </p>
                  <p class="font-black text-lg tabular-nums">
                    {{ g.studentsCount }}<span class="text-dimmed text-sm">/{{ g.maxStudents }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Recent medals + Homework -->
        <div class="space-y-6">
          <!-- Recent medals -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <UIcon
                  name="i-lucide-trophy"
                  class="size-5 text-yellow-500"
                />
                Последние медали
              </h2>
              <NuxtLink
                to="/student/achievements"
                class="text-sm font-semibold text-primary hover:underline"
              >
                Все →
              </NuxtLink>
            </div>
            <div class="space-y-2">
              <div
                v-for="m in medalHistory.slice(0, 4)"
                :key="m.id"
                class="flex items-center justify-between rounded-xl border border-default px-3 py-2.5 hover:border-primary-300 transition"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="size-9 rounded-full p-0.5 bg-linear-to-br"
                    :class="MEDAL_META[m.medal].gradient"
                  >
                    <div class="size-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                      <UIcon
                        :name="MEDAL_META[m.medal].icon"
                        class="size-5"
                        :class="MEDAL_META[m.medal].color"
                      />
                    </div>
                  </div>
                  <div>
                    <p class="text-sm font-bold">
                      {{ MEDAL_META[m.medal].label }}
                    </p>
                    <p class="text-xs text-muted tabular-nums">
                      {{ m.month }} · {{ m.averageGrade.toFixed(1) }}
                    </p>
                  </div>
                </div>
                <p
                  v-if="m.payout > 0"
                  class="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums"
                >
                  +{{ formatTenge(m.payout) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Homework -->
          <div>
            <h2 class="text-xl font-bold flex items-center gap-2 mb-3">
              <UIcon
                name="i-lucide-book-open"
                class="size-5 text-primary"
              />
              Активная домашка
            </h2>
            <div
              v-if="homeworkList.length === 0"
              class="rounded-xl border border-dashed border-default p-6 text-center"
            >
              <UIcon
                name="i-lucide-check-circle-2"
                class="size-8 text-emerald-500 mx-auto"
              />
              <p class="mt-2 text-sm font-semibold">
                Всё сделано!
              </p>
            </div>
            <div
              v-else
              class="space-y-2"
            >
              <div
                v-for="hw in homeworkList"
                :key="hw.id"
                class="rounded-xl border border-default p-3 hover:border-primary-300 transition"
              >
                <p class="text-sm font-bold">
                  {{ hw.title }}
                </p>
                <p class="text-xs text-muted mt-1 flex items-center gap-1">
                  <UIcon
                    name="i-lucide-calendar-clock"
                    class="size-3.5"
                  />
                  {{ formatDateTime(hw.dueAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
