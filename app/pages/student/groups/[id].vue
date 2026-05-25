<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { Database } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type EnglishLevel = Database['public']['Enums']['EnglishLevel']

const route = useRoute()
const groupId = computed(() => String(route.params.id))

const { myGroups, upcomingLessons, allLessons, gradeHistory, classmatesOf, pending } = useLingafonStudent()

const group = computed(() => myGroups.value.find(g => g.id === groupId.value) ?? null)

const LEVEL_DESC: Record<EnglishLevel, string> = {
  A1: 'Starter — первые шаги',
  A2: 'Elementary — базовое общение',
  S1: 'Pre-Intermediate — уверенный быт',
  S2: 'Intermediate — свободные диалоги',
  B2: 'Upper-Intermediate — экзаменный уровень',
  F1: 'Advanced — академический',
  F2: 'Advanced+ — углубление',
  F3: 'Proficient — почти носитель',
  F4: 'Mastery — носитель'
}

const WEEKDAY_LONG = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

const myLessons = computed(() => upcomingLessons.value.filter(l => l.groupId === groupId.value))

// Build lesson → group lookup so we can filter grades by group
const lessonGroupMap = computed(() => {
  const m = new Map<string, string>()
  for (const l of allLessons.value) m.set(l.id, l.groupId)
  return m
})
const myGrades = computed(() =>
  gradeHistory.value.filter(g => lessonGroupMap.value.get(g.lessonId) === groupId.value)
)

const avgGroupGrade = computed(() => {
  if (myGrades.value.length === 0) return 0
  return myGrades.value.reduce((s, g) => s + g.value, 0) / myGrades.value.length
})

// Real classmates from GroupMember (excludes current student inside composable)
const classmates = computed(() => classmatesOf(groupId.value))

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
})

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'short'
})
</script>

<template>
  <!-- Loading -->
  <div
    v-if="pending && !group"
    class="p-8 max-w-5xl mx-auto"
  >
    <div class="animate-pulse space-y-6">
      <div class="h-12 w-1/3 rounded-xl bg-elevated" />
      <div class="h-48 rounded-3xl bg-elevated" />
      <div class="grid grid-cols-4 gap-3">
        <div class="h-24 rounded-2xl bg-elevated" />
        <div class="h-24 rounded-2xl bg-elevated" />
        <div class="h-24 rounded-2xl bg-elevated" />
        <div class="h-24 rounded-2xl bg-elevated" />
      </div>
    </div>
  </div>

  <!-- Not found -->
  <div
    v-else-if="!group"
    class="p-12 max-w-3xl mx-auto text-center"
  >
    <UIcon
      name="i-lucide-search-x"
      class="size-12 text-muted mx-auto"
    />
    <p class="mt-3 font-bold text-lg">
      Группа не найдена
    </p>
    <p class="text-sm text-muted mt-1">
      Возможно, ты не записан в эту группу
    </p>
    <UButton
      to="/student/groups"
      label="К моим группам"
      color="primary"
      class="mt-4"
    />
  </div>

  <div
    v-else
    class="relative"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      <NuxtLink
        to="/student/groups"
        class="text-sm font-semibold text-muted hover:text-primary inline-flex items-center gap-1.5"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4"
        />
        Все группы
      </NuxtLink>

      <!-- Hero -->
      <header class="rounded-3xl bg-linear-to-br from-primary-500 via-sky-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <UIcon
          name="i-lucide-users"
          aria-hidden="true"
          class="absolute -bottom-6 -right-6 size-48 opacity-15"
        />
        <div class="relative">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-sm font-black">
              {{ group.level }}
            </div>
            <UBadge
              :label="group.branch.kind === 'ONLINE' ? '🌐 Online' : '📍 Offline'"
              color="neutral"
              variant="solid"
              size="xs"
              class="bg-white/15 backdrop-blur text-white"
            />
          </div>
          <h1 class="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
            {{ group.name }}
          </h1>
          <p class="text-sm sm:text-base opacity-90 mt-1">
            {{ LEVEL_DESC[group.level] }}
          </p>
          <p class="text-sm opacity-80 mt-3">
            {{ group.branch.name }}<span v-if="group.branch.address"> · {{ group.branch.address }}</span>
          </p>
        </div>
      </header>

      <!-- Stats -->
      <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-2xl ring-1 ring-default p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-muted font-bold">
            Учеников
          </p>
          <p class="mt-1 text-2xl font-black tabular-nums">
            {{ group.studentsCount }}<span class="text-dimmed text-sm">/{{ group.maxStudents }}</span>
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-default p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-muted font-bold">
            Уроков в нед
          </p>
          <p class="mt-1 text-2xl font-black tabular-nums">
            {{ group.schedule.length }}
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-default p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-muted font-bold">
            Мой ср.балл
          </p>
          <p class="mt-1 text-2xl font-black tabular-nums">
            {{ avgGroupGrade > 0 ? avgGroupGrade.toFixed(1) : '—' }}
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-default p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-muted font-bold">
            Длительность
          </p>
          <p class="mt-1 text-2xl font-black tabular-nums">
            {{ group.schedule[0]?.durationMin ?? 60 }}<span class="text-sm text-dimmed"> мин</span>
          </p>
        </div>
      </section>

      <!-- Teacher -->
      <section class="rounded-2xl border border-default bg-default p-5 flex items-center gap-4">
        <div class="size-16 rounded-2xl bg-linear-to-br from-primary-400 to-sky-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
          {{ group.teacher.name.charAt(0) }}{{ group.teacher.surname.charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
            Твой педагог
          </p>
          <p class="text-lg font-bold truncate">
            {{ group.teacher.name }} {{ group.teacher.surname }}
          </p>
          <p
            v-if="group.teacher.bio"
            class="text-sm text-muted line-clamp-1"
          >
            {{ group.teacher.bio }}
          </p>
          <p class="text-xs text-muted">
            {{ group.teacher.yearsOfExperience }} лет опыта
          </p>
        </div>
        <NuxtLink
          to="/student/messenger"
          class="hidden sm:inline-flex"
        >
          <UButton
            icon="i-lucide-message-circle"
            label="Написать"
            color="primary"
            variant="outline"
          />
        </NuxtLink>
      </section>

      <!-- Schedule -->
      <section>
        <h2 class="font-bold text-lg mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-calendar"
            class="size-5 text-primary"
          />
          Расписание группы
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="(slot, idx) in group.schedule"
            :key="idx"
            class="rounded-xl border border-default p-3 flex items-center justify-between"
          >
            <span class="font-medium">{{ WEEKDAY_LONG[slot.weekday] }}</span>
            <span class="font-mono font-bold text-primary">{{ slot.startTime }} · {{ slot.durationMin }} мин</span>
          </div>
        </div>
      </section>

      <!-- Upcoming lessons -->
      <section v-if="myLessons.length > 0">
        <h2 class="font-bold text-lg mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-clock"
            class="size-5 text-primary"
          />
          Ближайшие уроки
        </h2>
        <div class="space-y-2">
          <div
            v-for="l in myLessons.slice(0, 5)"
            :key="l.id"
            class="rounded-xl border border-default p-3 flex items-center gap-3"
          >
            <UIcon
              name="i-lucide-circle-dot"
              class="size-4 text-primary shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="font-bold truncate">
                {{ l.topic }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDateTime(l.startsAt) }} · {{ l.durationMin }} мин
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent grades for this group -->
      <section v-if="myGrades.length > 0">
        <h2 class="font-bold text-lg mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-star"
            class="size-5 text-amber-500"
          />
          Мои оценки в группе
        </h2>
        <div class="space-y-2">
          <div
            v-for="g in myGrades.slice(0, 5)"
            :key="g.id"
            class="rounded-xl border border-default p-3 flex items-center gap-3"
          >
            <div
              class="size-10 rounded-xl flex items-center justify-center font-black shrink-0"
              :class="g.value === 5
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : g.value === 4
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                  : g.value === 3
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
            >
              {{ g.value }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold truncate">
                {{ g.topic }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDate(g.date) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Classmates -->
      <section v-if="classmates.length > 0">
        <h2 class="font-bold text-lg mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-users"
            class="size-5 text-primary"
          />
          Одногруппники
        </h2>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(c, i) in classmates"
            :key="i"
            class="flex items-center gap-2 rounded-full bg-elevated px-3 py-1.5"
          >
            <div class="size-7 rounded-full bg-linear-to-br from-primary-400 to-sky-700 text-white font-bold text-xs flex items-center justify-center">
              {{ c.initials }}
            </div>
            <span class="text-sm font-medium">{{ c.name }} {{ c.surname }}</span>
          </div>
          <div class="flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5">
            <div class="size-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
              Я
            </div>
            <span class="text-sm font-bold text-primary">Это ты</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
