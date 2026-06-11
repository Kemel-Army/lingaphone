<script setup lang="ts">
import { useTeacher, type TeacherLesson } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const { fetchMyLessons } = useTeacher()

const { data: lessons, pending } = await useAsyncData('teacher-schedule', () => fetchMyLessons())

// ── Week navigation ──────────────────────────────────────────────────────────
const today = new Date()
today.setHours(0, 0, 0, 0)

const weekOffset = ref(0)

const weekStart = computed(() => {
  const d = new Date(today)
  d.setDate(today.getDate() - today.getDay() + 1 + weekOffset.value * 7)
  return d
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(weekStart.value.getDate() + i)
    return d
  })
})

const weekLabel = computed(() => {
  const start = weekDays.value[0]!
  const end = weekDays.value[6]!
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('ru-RU', opts)} — ${end.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' })}`
})

// ── Day view toggle ──────────────────────────────────────────────────────────
const viewMode = ref<'week' | 'day'>('week')
const selectedDay = ref(new Date(today))

// ── Lesson helpers ──────────────────────────────────────────────────────────
const lessonsForDay = (day: Date): TeacherLesson[] => {
  if (!lessons.value) return []
  const iso = day.toISOString().slice(0, 10)
  return lessons.value
    .filter(l => l.startsAt.slice(0, 10) === iso)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

const isToday = (day: Date) => day.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
const isPast = (day: Date) => day < today

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const WEEKDAY_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const dayIndex = (day: Date) => (day.getDay() + 6) % 7 // Mon=0…Sun=6

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const formatDayFull = (d: Date) =>
  d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    COMPLETED: 'success', IN_PROGRESS: 'warning', SCHEDULED: 'info', CANCELLED: 'error'
  }
  return map[status] ?? 'neutral'
}

const statusLabel: Record<string, string> = {
  COMPLETED: 'Завершён', IN_PROGRESS: 'Идёт', SCHEDULED: 'Запланирован', CANCELLED: 'Отменён'
}

const levelGradient = (level: string) => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500', A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500', S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500', F1: 'from-red-400 to-rose-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

// ── Lesson detail modal ──────────────────────────────────────────────────────
const detailLesson = ref<TeacherLesson | null>(null)
const router = useRouter()

const openLesson = (lesson: TeacherLesson) => {
  const lessonDate = new Date(lesson.startsAt)
  if (lessonDate < today) {
    router.push(`/teacher/grades?lessonId=${lesson.id}`)
  } else {
    detailLesson.value = lesson
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs font-bold text-blue-500 uppercase tracking-wider">
          Личный календарь
        </p>
        <h1 class="text-2xl font-black tracking-tight mt-0.5">
          Расписание
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <UButtonGroup>
          <UButton
            :variant="viewMode === 'week' ? 'solid' : 'outline'"
            size="sm"
            @click="viewMode = 'week'"
          >
            Неделя
          </UButton>
          <UButton
            :variant="viewMode === 'day' ? 'solid' : 'outline'"
            size="sm"
            @click="viewMode = 'day'"
          >
            День
          </UButton>
        </UButtonGroup>
      </div>
    </div>

    <!-- Week navigation -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-lucide-chevron-left"
        variant="outline"
        size="sm"
        @click="weekOffset--"
      />
      <p class="text-sm font-semibold flex-1 text-center">
        {{ weekLabel }}
      </p>
      <UButton
        icon="i-lucide-chevron-right"
        variant="outline"
        size="sm"
        @click="weekOffset++"
      />
      <UButton
        v-if="weekOffset !== 0"
        variant="ghost"
        size="sm"
        @click="weekOffset = 0"
      >
        Сегодня
      </UButton>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Week view -->
    <template v-else-if="viewMode === 'week'">
      <div class="grid grid-cols-7 gap-2">
        <!-- Day headers -->
        <div
          v-for="(day, i) in weekDays"
          :key="i"
          class="text-center pb-2 border-b border-subtle cursor-pointer hover:text-primary transition-colors"
          :class="isToday(day) ? 'text-primary font-bold' : isPast(day) ? 'text-muted' : ''"
          @click="selectedDay = day; viewMode = 'day'"
        >
          <p class="text-xs uppercase tracking-wider">
            {{ WEEKDAY_SHORT[i] }}
          </p>
          <p
            class="text-lg font-bold mt-0.5 size-8 rounded-full mx-auto flex items-center justify-center"
            :class="isToday(day) ? 'bg-primary text-white' : ''"
          >
            {{ day.getDate() }}
          </p>
        </div>

        <!-- Day lesson columns -->
        <div
          v-for="(day, i) in weekDays"
          :key="`col-${i}`"
          class="min-h-32 space-y-1.5"
          :class="isToday(day) ? 'rounded-xl bg-primary/5 p-1' : isPast(day) ? 'opacity-60' : ''"
        >
          <div
            v-if="!lessonsForDay(day).length"
            class="h-full flex items-center justify-center"
          >
            <span class="text-xs text-muted/50">—</span>
          </div>
          <div
            v-for="lesson in lessonsForDay(day)"
            :key="lesson.id"
            class="rounded-lg p-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm"
            :class="lesson.status === 'CANCELLED' ? 'bg-red-500/10 opacity-60' : 'bg-blue-500/10 hover:bg-blue-500/20'"
            @click="openLesson(lesson)"
          >
            <p class="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
              {{ formatTime(lesson.startsAt) }}
            </p>
            <p class="text-xs font-medium truncate mt-0.5">
              {{ lesson.topic }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ lesson.groupName }}
            </p>
          </div>
        </div>
      </div>

      <!-- Total lessons in week -->
      <p class="text-xs text-muted text-center">
        {{ weekDays.reduce((acc, d) => acc + lessonsForDay(d).length, 0) }} уроков на этой неделе
      </p>
    </template>

    <!-- Day view -->
    <template v-else>
      <!-- Day selector chips -->
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="(day, i) in weekDays"
          :key="i"
          class="shrink-0 flex flex-col items-center rounded-xl px-3 py-2 transition-all border"
          :class="day.toISOString().slice(0, 10) === selectedDay.toISOString().slice(0, 10)
            ? 'bg-primary text-white border-primary'
            : isToday(day)
              ? 'border-primary/50 text-primary'
              : isPast(day)
                ? 'border-subtle text-muted'
                : 'border-subtle hover:border-primary/40'"
          @click="selectedDay = new Date(day)"
        >
          <span class="text-xs uppercase font-medium">{{ WEEKDAY_SHORT[i] }}</span>
          <span class="text-lg font-bold leading-tight">{{ day.getDate() }}</span>
          <span
            v-if="lessonsForDay(day).length"
            class="size-1.5 rounded-full mt-1"
            :class="day.toISOString().slice(0, 10) === selectedDay.toISOString().slice(0, 10) ? 'bg-white' : 'bg-primary'"
          />
        </button>
      </div>

      <!-- Selected day lessons -->
      <div>
        <p class="text-sm font-semibold mb-3 capitalize">
          {{ formatDayFull(selectedDay) }}
        </p>

        <div
          v-if="!lessonsForDay(selectedDay).length"
          class="text-center py-16 text-muted"
        >
          <UIcon
            name="i-lucide-calendar-check"
            class="size-10 mx-auto mb-3"
          />
          <p>Уроков нет</p>
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <UCard
            v-for="lesson in lessonsForDay(selectedDay)"
            :key="lesson.id"
            class="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
            @click="openLesson(lesson)"
          >
            <div class="flex items-center gap-4 flex-wrap">
              <!-- Time block -->
              <div class="shrink-0 text-center min-w-12">
                <p class="text-lg font-black tabular-nums text-primary">
                  {{ formatTime(lesson.startsAt) }}
                </p>
                <p class="text-xs text-muted">
                  {{ lesson.durationMin }} мин
                </p>
              </div>

              <!-- Divider -->
              <div class="w-px h-10 bg-subtle shrink-0" />

              <!-- Group pill -->
              <div
                class="size-10 rounded-xl bg-linear-to-br text-white flex items-center justify-center font-black text-xs shrink-0"
                :class="levelGradient('')"
              >
                <UIcon
                  name="i-lucide-users"
                  class="size-4"
                />
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-semibold truncate">
                  {{ lesson.topic }}
                </p>
                <p class="text-sm text-muted">
                  {{ lesson.groupName }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <UBadge
                  :color="statusColor(lesson.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ statusLabel[lesson.status] ?? lesson.status }}
                </UBadge>
                <UButton
                  v-if="lesson.meetingUrl"
                  :to="lesson.meetingUrl"
                  target="_blank"
                  icon="i-lucide-video"
                  size="xs"
                  @click.stop
                >
                  Zoom
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>

    <!-- Lesson detail modal -->
    <UModal
      :open="!!detailLesson"
      @update:open="detailLesson = null"
    >
      <template #content>
        <div
          v-if="detailLesson"
          class="p-6 space-y-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold text-blue-500 uppercase tracking-wide">
                Предстоящий урок
              </p>
              <h2 class="text-xl font-bold mt-0.5">
                {{ detailLesson.topic }}
              </h2>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="detailLesson = null"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-muted/40 p-3">
              <p class="text-xs text-muted mb-1">
                Группа
              </p>
              <p class="font-semibold">
                {{ detailLesson.groupName }}
              </p>
            </div>
            <div class="rounded-xl bg-muted/40 p-3">
              <p class="text-xs text-muted mb-1">
                Время
              </p>
              <p class="font-semibold">
                {{ formatTime(detailLesson.startsAt) }} · {{ detailLesson.durationMin }} мин
              </p>
            </div>
            <div class="rounded-xl bg-muted/40 p-3">
              <p class="text-xs text-muted mb-1">
                Статус
              </p>
              <UBadge
                :color="statusColor(detailLesson.status)"
                variant="subtle"
                size="sm"
              >
                {{ statusLabel[detailLesson.status] ?? detailLesson.status }}
              </UBadge>
            </div>
            <div
              v-if="detailLesson.meetingUrl"
              class="rounded-xl bg-muted/40 p-3"
            >
              <p class="text-xs text-muted mb-1">
                Ссылка
              </p>
              <UButton
                :to="detailLesson.meetingUrl"
                target="_blank"
                icon="i-lucide-video"
                size="xs"
                variant="outline"
              >
                Подключиться
              </UButton>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <UButton
              :to="`/teacher/groups/${detailLesson.groupId}`"
              icon="i-lucide-users"
              variant="outline"
              size="sm"
            >
              Список группы
            </UButton>
            <UButton
              :to="`/teacher/homework/create?groupId=${detailLesson.groupId}`"
              icon="i-lucide-plus"
              variant="outline"
              size="sm"
            >
              Задать ДЗ
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
