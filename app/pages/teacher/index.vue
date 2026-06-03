<script setup lang="ts">
import { useTeacher, type TeacherGroup, type TeacherLesson } from '~/entities/teacher'
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const { fullName } = useCurrentUser()
const { fetchKpi, fetchMyGroups, fetchMyLessons } = useTeacher()

const [{ data: kpi }, { data: groups }, { data: lessons }] = await Promise.all([
  useAsyncData('teacher-kpi', fetchKpi),
  useAsyncData('teacher-groups', fetchMyGroups),
  useAsyncData('teacher-lessons', () => fetchMyLessons())
])

const upcomingLessons = computed((): TeacherLesson[] => {
  if (!lessons.value) return []
  const now = new Date().toISOString()
  return lessons.value
    .filter(l => l.startsAt >= now && l.status === 'SCHEDULED')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 5)
})

const WEEKDAY_RU: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
}

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500',
    A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500',
    S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

const formatSchedule = (schedule: unknown): string => {
  if (!schedule) return '—'
  if (Array.isArray(schedule) && schedule.length > 0) {
    const first = schedule[0] as { weekday?: number, startTime?: string }
    const days = schedule
      .map((s: { weekday?: number }) => s.weekday ? (WEEKDAY_RU[s.weekday] ?? '') : '')
      .join(', ')
    return first.startTime ? `${days} · ${first.startTime}` : days
  }
  return '—'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const kpiCards = computed(() => [
  {
    label: 'Учеников',
    value: kpi.value?.totalStudents ?? 0,
    icon: 'i-lucide-users',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    label: 'Групп',
    value: kpi.value?.totalGroups ?? 0,
    icon: 'i-lucide-layers',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    label: 'Уроков на неделе',
    value: kpi.value?.lessonsThisWeek ?? 0,
    icon: 'i-lucide-calendar',
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  {
    label: 'Ожидают проверки',
    value: kpi.value?.pendingSubmissions ?? 0,
    icon: 'i-lucide-inbox',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    alert: (kpi.value?.pendingSubmissions ?? 0) > 0
  }
])
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          Кабинет педагога
        </p>
        <h1 class="text-2xl font-black tracking-tight mt-0.5">
          Добро пожаловать, {{ fullName }}!
        </h1>
      </div>
      <UButton
        to="/teacher/homework/create"
        icon="i-lucide-plus"
        size="sm"
      >
        Создать ДЗ
      </UButton>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <UCard
        v-for="card in kpiCards"
        :key="card.label"
        class="relative overflow-hidden"
      >
        <div class="flex items-center gap-3">
          <div
            class="rounded-xl p-2.5 shrink-0"
            :class="card.bg"
          >
            <UIcon
              :name="card.icon"
              class="size-5"
              :class="card.color"
            />
          </div>
          <div class="min-w-0">
            <p
              class="text-2xl font-black tabular-nums"
              :class="card.alert ? 'text-orange-500' : ''"
            >
              {{ card.value }}
            </p>
            <p class="text-xs text-muted leading-tight">
              {{ card.label }}
            </p>
          </div>
        </div>
        <UBadge
          v-if="card.alert"
          color="warning"
          variant="subtle"
          size="xs"
          class="absolute top-2 right-2"
        >
          Новые
        </UBadge>
      </UCard>
    </div>

    <div class="grid lg:grid-cols-5 gap-6">
      <!-- Groups (wider) -->
      <UCard class="lg:col-span-3">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold">
              <UIcon
                name="i-lucide-layers"
                class="size-4 text-primary"
              />
              Мои группы
            </div>
            <UButton
              to="/teacher/groups"
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-arrow-right"
              trailing
            >
              Все
            </UButton>
          </div>
        </template>

        <div
          v-if="!groups?.length"
          class="text-center py-8 text-muted"
        >
          <UIcon
            name="i-lucide-layers"
            class="size-8 mx-auto mb-2"
          />
          <p class="text-sm">
            Групп пока нет
          </p>
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <NuxtLink
            v-for="g in (groups as TeacherGroup[]).slice(0, 6)"
            :key="g.id"
            :to="`/teacher/groups/${g.id}`"
            class="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40 transition-colors group"
          >
            <!-- Level pill -->
            <div
              class="size-10 rounded-xl bg-linear-to-br text-white flex items-center justify-center font-black text-xs shrink-0"
              :class="levelGradient(g.level)"
            >
              {{ g.level }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm truncate">
                {{ g.name }}
              </p>
              <p class="text-xs text-muted">
                {{ g.studentCount }} уч. · {{ formatSchedule(g.schedule) }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 text-muted group-hover:text-primary transition-colors"
            />
          </NuxtLink>
        </div>
      </UCard>

      <!-- Upcoming lessons -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <UIcon
              name="i-lucide-clock"
              class="size-4 text-green-500"
            />
            Ближайшие уроки
          </div>
        </template>

        <div
          v-if="!upcomingLessons.length"
          class="text-center py-8 text-muted"
        >
          <UIcon
            name="i-lucide-calendar-check"
            class="size-8 mx-auto mb-2"
          />
          <p class="text-sm">
            Нет запланированных
          </p>
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="l in upcomingLessons"
            :key="l.id"
            class="flex items-start gap-2.5 rounded-xl p-2.5 hover:bg-muted/40 transition-colors"
          >
            <div class="rounded-lg bg-primary/10 p-1.5 mt-0.5 shrink-0">
              <UIcon
                name="i-lucide-book-open"
                class="size-3.5 text-primary"
              />
            </div>
            <div class="min-w-0">
              <p class="font-medium text-sm truncate">
                {{ l.topic }}
              </p>
              <p class="text-xs text-muted">
                {{ l.groupName }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDate(l.startsAt) }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick actions -->
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
        Быстрые действия
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NuxtLink
          v-for="link in [
            { to: '/teacher/students', icon: 'i-lucide-users', label: 'Ученики', color: 'text-primary' },
            { to: '/teacher/homework', icon: 'i-lucide-file-text', label: 'Задания', color: 'text-blue-500' },
            { to: '/teacher/grades', icon: 'i-lucide-table', label: 'Журнал', color: 'text-green-500' },
            { to: '/teacher/submissions', icon: 'i-lucide-inbox', label: `Проверить (${kpi?.pendingSubmissions ?? 0})`, color: 'text-orange-500' }
          ]"
          :key="link.to"
          :to="link.to"
          class="block"
        >
          <UCard class="hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <UIcon
                :name="link.icon"
                class="size-5"
                :class="link.color"
              />
              <span class="font-medium text-sm">{{ link.label }}</span>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
