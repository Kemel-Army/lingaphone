<script setup lang="ts">
import { useTeacher, type TeacherLesson, type TeacherGroup } from '~/entities/teacher'
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { fullName } = useCurrentUser()
const { fetchKpi, fetchMyGroups, fetchMyLessons, fetchSubmissions, fetchWeeklyStats } = useTeacher()

const [
  { data: kpi },
  { data: groups },
  { data: lessons },
  { data: weeklyStats },
  { data: pendingFeed, refresh: refreshFeed }
] = await Promise.all([
  useAsyncData('teacher-kpi', fetchKpi),
  useAsyncData('teacher-groups', fetchMyGroups),
  useAsyncData('teacher-lessons', () => fetchMyLessons()),
  useAsyncData('teacher-weekly', fetchWeeklyStats),
  useAsyncData('teacher-pending-feed', () => fetchSubmissions({ status: 'SUBMITTED' }))
])

// ── Realtime subscription ────────────────────────────────────────────────────
onMounted(() => {
  const channel = supabase
    .channel('teacher-hw-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'HomeworkSubmission' }, () => {
      refreshFeed()
    })
    .subscribe()
  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
})

// ── Next lesson + countdown ──────────────────────────────────────────────────
const nextLesson = computed((): TeacherLesson | null => {
  if (!lessons.value) return null
  const now = new Date().toISOString()
  return lessons.value
    .filter(l => l.startsAt >= now && l.status === 'SCHEDULED')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
})

const countdown = ref('')
const isUrgent = ref(false)
let cdTimer: ReturnType<typeof setInterval> | null = null

const updateCountdown = () => {
  if (!nextLesson.value) {
    countdown.value = ''
    return
  }
  const diff = new Date(nextLesson.value.startsAt).getTime() - Date.now()
  if (diff <= 0) {
    countdown.value = 'Идёт сейчас'
    isUrgent.value = true
    return
  }
  isUrgent.value = diff < 30 * 60 * 1000
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  countdown.value = h > 0 ? `${h}ч ${m}м` : m > 0 ? `${m}м ${s}с` : `${s}с`
}

onMounted(() => {
  updateCountdown()
  cdTimer = setInterval(updateCountdown, 1000)
  onUnmounted(() => {
    if (cdTimer) clearInterval(cdTimer)
  })
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const WEEKDAY_RU: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
}

const formatSchedule = (schedule: unknown): string => {
  if (!schedule || !Array.isArray(schedule) || !schedule.length) return '—'
  const first = schedule[0] as { weekday?: number, startTime?: string }
  const days = schedule.map((s: { weekday?: number }) => s.weekday ? (WEEKDAY_RU[s.weekday] ?? '') : '').join(', ')
  return first.startTime ? `${days} · ${first.startTime}` : days
}

const formatNextDate = (d: string) =>
  new Date(d).toLocaleString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const formatShort = (d: string) =>
  new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500', A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500', S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500', F1: 'from-red-400 to-rose-500',
    F2: 'from-rose-400 to-pink-500', F3: 'from-pink-400 to-fuchsia-500', F4: 'from-fuchsia-400 to-purple-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

const kpiCards = computed(() => [
  { label: 'Учеников', value: kpi.value?.totalStudents ?? 0, icon: 'i-lucide-users', color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Групп', value: kpi.value?.totalGroups ?? 0, icon: 'i-lucide-layers', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Уроков на неделе', value: kpi.value?.lessonsThisWeek ?? 0, icon: 'i-lucide-calendar', color: 'text-green-500', bg: 'bg-green-500/10' },
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
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs font-bold text-primary uppercase tracking-wider">
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

    <!-- Main grid -->
    <div class="grid lg:grid-cols-5 gap-4">
      <!-- Left: Next lesson + weekly stats -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Next lesson widget -->
        <UCard
          v-if="nextLesson"
          class="relative overflow-hidden border-primary/30"
          :ui="({ ring: 'ring-1 ring-primary/30' } as any)"
        >
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-primary/10 p-1.5">
                <UIcon
                  name="i-lucide-book-open"
                  class="size-4 text-primary"
                />
              </div>
              <span class="text-xs font-bold text-primary uppercase tracking-wide">Следующий урок</span>
            </div>

            <div>
              <p class="font-bold text-lg leading-tight">
                {{ nextLesson.topic }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                {{ nextLesson.groupName }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ formatNextDate(nextLesson.startsAt) }}
              </p>
            </div>

            <!-- Countdown -->
            <div
              class="flex items-center gap-2 rounded-xl px-3 py-2"
              :class="isUrgent ? 'bg-orange-500/10' : 'bg-muted/50'"
            >
              <UIcon
                name="i-lucide-timer"
                class="size-4 shrink-0"
                :class="isUrgent ? 'text-orange-500' : 'text-muted'"
              />
              <span
                class="font-black text-lg tabular-nums"
                :class="isUrgent ? 'text-orange-500' : ''"
              >
                {{ countdown || '—' }}
              </span>
              <span class="text-xs text-muted ml-auto">до урока</span>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2">
              <UButton
                v-if="nextLesson.meetingUrl"
                :to="nextLesson.meetingUrl"
                target="_blank"
                icon="i-lucide-video"
                size="sm"
                class="flex-1"
              >
                Подключиться
              </UButton>
              <UButton
                :to="`/teacher/groups/${nextLesson.groupId}`"
                icon="i-lucide-users"
                variant="outline"
                size="sm"
                :class="nextLesson.meetingUrl ? '' : 'flex-1'"
              >
                Группа
              </UButton>
            </div>
          </div>
        </UCard>

        <UCard
          v-else
          class="text-center py-8"
        >
          <UIcon
            name="i-lucide-calendar-check"
            class="size-8 mx-auto mb-2 text-muted"
          />
          <p class="text-sm text-muted">
            Нет запланированных уроков
          </p>
        </UCard>

        <!-- Weekly mini-stats -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold">
              <UIcon
                name="i-lucide-bar-chart-2"
                class="size-4 text-primary"
              />
              Статистика за неделю
            </div>
          </template>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-muted/40 p-3 text-center">
              <p class="text-2xl font-black text-green-500">
                {{ weeklyStats?.checkedCount ?? 0 }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                Проверено ДЗ
              </p>
            </div>
            <div class="rounded-xl bg-muted/40 p-3 text-center">
              <p class="text-2xl font-black text-blue-500">
                {{ weeklyStats?.attendancePercent ?? 0 }}%
              </p>
              <p class="text-xs text-muted mt-0.5">
                Посещаемость
              </p>
            </div>
            <div class="rounded-xl bg-muted/40 p-3 text-center col-span-2">
              <p class="text-2xl font-black text-orange-500">
                {{ kpi?.pendingSubmissions ?? 0 }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                Ожидают проверки
              </p>
            </div>
          </div>
        </UCard>

        <!-- Groups -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm font-semibold">
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
            class="text-center py-6 text-muted text-sm"
          >
            Групп пока нет
          </div>
          <div
            v-else
            class="space-y-1.5"
          >
            <NuxtLink
              v-for="g in (groups as TeacherGroup[]).slice(0, 5)"
              :key="g.id"
              :to="`/teacher/groups/${g.id}`"
              class="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 transition-colors group"
            >
              <div
                class="size-8 rounded-lg bg-linear-to-br text-white flex items-center justify-center font-black text-xs shrink-0"
                :class="levelGradient(g.level)"
              >
                {{ g.level }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">
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
      </div>

      <!-- Right: Pending submissions feed -->
      <UCard class="lg:col-span-3">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-semibold">
              <UIcon
                name="i-lucide-inbox"
                class="size-4 text-orange-500"
              />
              Ожидают проверки
              <UBadge
                v-if="(pendingFeed?.length ?? 0) > 0"
                color="warning"
                variant="subtle"
                size="xs"
              >
                {{ pendingFeed?.length }}
              </UBadge>
            </div>
            <UButton
              to="/teacher/submissions"
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-arrow-right"
              trailing
            >
              Проверить все
            </UButton>
          </div>
        </template>

        <div
          v-if="!pendingFeed?.length"
          class="text-center py-12 text-muted"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-10 mx-auto mb-3 text-green-500/60"
          />
          <p class="font-medium">
            Всё проверено!
          </p>
          <p class="text-xs mt-1">
            Новые работы появятся здесь автоматически
          </p>
        </div>

        <div
          v-else
          class="space-y-2 max-h-120 overflow-y-auto -mx-4 px-4"
        >
          <NuxtLink
            v-for="sub in pendingFeed"
            :key="sub.id"
            to="/teacher/submissions"
            class="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40 transition-colors group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
          >
            <UAvatar
              :src="sub.studentAvatarUrl ?? undefined"
              :alt="`${sub.studentName} ${sub.studentSurname}`"
              size="sm"
              class="shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">
                {{ sub.studentName }} {{ sub.studentSurname }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ sub.homeworkTitle }}
              </p>
              <p class="text-xs text-muted">
                {{ sub.groupName }} · {{ sub.submittedAt ? formatShort(sub.submittedAt) : '—' }}
              </p>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <UBadge
                color="warning"
                variant="subtle"
                size="xs"
              >
                Новая
              </UBadge>
              <UBadge
                color="neutral"
                variant="outline"
                size="xs"
              >
                {{ sub.homeworkFormat === 'TEST' ? 'Тест'
                  : sub.homeworkFormat === 'ORAL' ? 'Устный'
                    : sub.homeworkFormat === 'FILE' ? 'Файл'
                      : sub.homeworkFormat === 'TEXT' ? 'Текст'
                        : sub.homeworkFormat === 'INPUT' ? 'Ввод'
                          : sub.homeworkFormat }}
              </UBadge>
            </div>
          </NuxtLink>
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
            { to: '/teacher/grades', icon: 'i-lucide-table', label: 'Журнал', color: 'text-green-500' },
            { to: '/teacher/testing', icon: 'i-lucide-clipboard-list', label: 'Тестирование', color: 'text-purple-500' },
            { to: '/teacher/schedule', icon: 'i-lucide-calendar-days', label: 'Расписание', color: 'text-blue-500' }
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
