<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useTypedSupabaseClient()
const toast = useToast()

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleLesson {
  id: string
  date: string
  time: string
  topic: string | null
  status: string
  groupId: string
  groupName: string
  groupLevel: string
  teacherId: string
  teacherName: string
  teacherAvatar: string | null
  presentCount: number
  totalCount: number
  isOnline: boolean
  meetLink: string | null
}

// ─── Date navigation ──────────────────────────────────────────────────────────

const today = new Date()
const weekOffset = ref(0)

const weekStart = computed(() => {
  const d = new Date(today)
  d.setDate(d.getDate() - d.getDay() + 1 + weekOffset.value * 7) // Mon
  d.setHours(0, 0, 0, 0)
  return d
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const weekLabel = computed(() => {
  const from = weekDays.value[0]!
  const to = weekDays.value[6]!
  return `${from.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${to.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`
})

// ─── Fetch lessons ────────────────────────────────────────────────────────────

const { data: lessons, pending, refresh } = await useAsyncData(
  () => `admin-schedule-${weekOffset.value}`,
  async () => {
    const from = weekStart.value.toISOString().slice(0, 10)
    const toDate = new Date(weekStart.value)
    toDate.setDate(toDate.getDate() + 6)
    const to = toDate.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('Lesson')
      .select(`
        id, date, time, topic, status, groupId, isOnline, meetLink,
        presentCount, totalCount,
        Group!groupId ( name, level, Teacher!teacherId ( id, User!userId ( name, surname, avatarUrl ) ) )
      `)
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('time') as unknown as {
      data: {
        id: string
        date: string
        time: string
        topic: string | null
        status: string
        groupId: string
        isOnline: boolean
        meetLink: string | null
        presentCount: number
        totalCount: number
        Group: {
          name: string
          level: string
          Teacher: {
            id: string
            User: { name: string, surname: string, avatarUrl: string | null } | null
          } | null
        } | null
      }[] | null
      error: unknown
    }

    if (error) return []

    return (data ?? []).map((l) => {
      const group = Array.isArray(l.Group) ? l.Group[0] : l.Group
      const teacher = group ? (Array.isArray(group.Teacher) ? group.Teacher[0] : group.Teacher) : null
      const tUser = teacher ? (Array.isArray(teacher.User) ? teacher.User[0] : teacher.User) : null

      return {
        id: l.id,
        date: l.date,
        time: l.time ?? '00:00',
        topic: l.topic,
        status: l.status,
        groupId: l.groupId,
        groupName: group?.name ?? '—',
        groupLevel: group?.level ?? '',
        teacherId: teacher?.id ?? '',
        teacherName: tUser ? `${tUser.name} ${tUser.surname}`.trim() : '—',
        teacherAvatar: tUser?.avatarUrl ?? null,
        presentCount: l.presentCount ?? 0,
        totalCount: l.totalCount ?? 0,
        isOnline: l.isOnline ?? false,
        meetLink: l.meetLink ?? null
      } as ScheduleLesson
    })
  }
)

watch(weekOffset, () => refresh())

// ─── Filters ──────────────────────────────────────────────────────────────────

const filterMode = ref<'teacher' | 'group'>('teacher')
const filterValue = ref<string | null>(null)

const teacherOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const l of lessons.value ?? []) {
    if (l.teacherId) seen.set(l.teacherId, l.teacherName)
  }
  return [{ label: 'Все учителя', value: null }, ...[...seen.entries()].map(([id, name]) => ({ label: name, value: id }))]
})

const groupOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const l of lessons.value ?? []) {
    seen.set(l.groupId, l.groupName)
  }
  return [{ label: 'Все группы', value: null }, ...[...seen.entries()].map(([id, name]) => ({ label: name, value: id }))]
})

const filteredLessons = computed(() => {
  let list = lessons.value ?? []
  if (filterValue.value) {
    if (filterMode.value === 'teacher') list = list.filter(l => l.teacherId === filterValue.value)
    else list = list.filter(l => l.groupId === filterValue.value)
  }
  return list
})

// Lessons grouped by day
const lessonsByDay = computed(() => {
  const map = new Map<string, ScheduleLesson[]>()
  for (const day of weekDays.value) {
    map.set(day.toISOString().slice(0, 10), [])
  }
  for (const l of filteredLessons.value) {
    const bucket = map.get(l.date)
    if (bucket) bucket.push(l)
  }
  return map
})

// ─── Lesson detail modal ──────────────────────────────────────────────────────

const selectedLesson = ref<ScheduleLesson | null>(null)
const showModal = ref(false)
const cancellingId = ref<string | null>(null)

const openLesson = (l: ScheduleLesson) => {
  selectedLesson.value = l
  showModal.value = true
}

const cancelLesson = async () => {
  if (!selectedLesson.value) return
  cancellingId.value = selectedLesson.value.id
  try {
    const { error } = await supabase
      .from('Lesson')
      .update({ status: 'CANCELLED' })
      .eq('id', selectedLesson.value.id)
    if (error) throw error
    toast.add({ title: 'Урок отменён', color: 'success', icon: 'i-lucide-check' })
    showModal.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Ошибка', color: 'error', icon: 'i-lucide-x' })
  } finally {
    cancellingId.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const isToday = (d: Date) => d.toDateString() === today.toDateString()

type BadgeColor = 'info' | 'warning' | 'success' | 'error' | 'neutral'
const levelColor = (level: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const statusColor = (status: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    SCHEDULED: 'info', IN_PROGRESS: 'warning',
    COMPLETED: 'success', CANCELLED: 'error'
  }
  return map[status] ?? 'neutral'
}

const statusLabel: Record<string, string> = {
  SCHEDULED: 'Запланирован', IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён'
}

const lessonColor = (status: string) => {
  if (status === 'CANCELLED') return 'border-red-300 bg-red-50 dark:bg-red-900/20 opacity-60'
  if (status === 'COMPLETED') return 'border-green-300 bg-green-50 dark:bg-green-900/20'
  if (status === 'IN_PROGRESS') return 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
  return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Расписание
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Глобальный таймлайн всех групп и учителей
        </p>
      </div>
      <!-- Week nav -->
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="weekOffset--"
        />
        <span class="text-sm font-medium w-52 text-center">{{ weekLabel }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="weekOffset++"
        />
        <UButton
          v-if="weekOffset !== 0"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="weekOffset = 0"
        >
          Сегодня
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex rounded-lg border border-subtle overflow-hidden">
        <button
          class="px-3 py-1.5 text-sm font-medium transition-colors"
          :class="filterMode === 'teacher' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/20'"
          @click="filterMode = 'teacher'; filterValue = ''"
        >
          По учителям
        </button>
        <button
          class="px-3 py-1.5 text-sm font-medium transition-colors"
          :class="filterMode === 'group' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/20'"
          @click="filterMode = 'group'; filterValue = ''"
        >
          По группам
        </button>
      </div>

      <USelect
        v-if="filterMode === 'teacher'"
        v-model="filterValue"
        :items="teacherOptions"
        class="w-56"
      />
      <USelect
        v-else
        v-model="filterValue"
        :items="groupOptions"
        class="w-56"
      />

      <span class="text-sm text-muted ml-auto">
        {{ filteredLessons.length }} урок{{ filteredLessons.length === 1 ? '' : filteredLessons.length < 5 ? 'а' : 'ов' }} за неделю
      </span>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="flex justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Calendar grid -->
    <div
      v-else
      class="grid grid-cols-7 gap-2"
    >
      <!-- Day headers -->
      <div
        v-for="(day, i) in weekDays"
        :key="day.toISOString()"
        class="text-center"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide mb-1"
          :class="isToday(day) ? 'text-primary' : 'text-muted'"
        >
          {{ dayLabels[i] }}
        </p>
        <p
          class="text-lg font-bold"
          :class="isToday(day) ? 'text-primary' : ''"
        >
          {{ day.getDate() }}
        </p>
      </div>

      <!-- Day columns -->
      <div
        v-for="day in weekDays"
        :key="`col-${day.toISOString()}`"
        class="min-h-48 space-y-1.5"
        :class="isToday(day) ? 'bg-primary/5 rounded-xl p-1' : ''"
      >
        <div
          v-for="lesson in lessonsByDay.get(day.toISOString().slice(0, 10)) ?? []"
          :key="lesson.id"
          class="rounded-lg border p-2 cursor-pointer transition-colors text-xs"
          :class="lessonColor(lesson.status)"
          @click="openLesson(lesson)"
        >
          <p class="font-bold leading-tight">
            {{ lesson.time.slice(0, 5) }}
          </p>
          <p class="font-semibold mt-0.5 truncate">
            {{ lesson.groupName }}
          </p>
          <p class="text-muted truncate mt-0.5">
            {{ lesson.teacherName.split(' ')[0] }}
          </p>
          <div class="flex items-center gap-1 mt-1">
            <UBadge
              :color="levelColor(lesson.groupLevel)"
              variant="subtle"
              size="xs"
            >
              {{ lesson.groupLevel }}
            </UBadge>
            <UIcon
              v-if="lesson.isOnline"
              name="i-lucide-video"
              class="size-3 text-muted"
            />
          </div>
        </div>

        <div
          v-if="!(lessonsByDay.get(day.toISOString().slice(0, 10)) ?? []).length"
          class="py-4 text-center"
        >
          <span class="text-xs text-muted/40">—</span>
        </div>
      </div>
    </div>

    <!-- ─── Lesson Detail Modal ──────────────────────────────────────────────── -->
    <UModal
      v-model:open="showModal"
      :ui="{ content: 'max-w-md' }"
    >
      <template
        v-if="selectedLesson"
        #content
      >
        <div class="p-5 space-y-4">
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h2 class="font-bold text-base">
                  {{ selectedLesson.groupName }}
                </h2>
                <UBadge
                  :color="levelColor(selectedLesson.groupLevel)"
                  variant="subtle"
                  size="xs"
                >
                  {{ selectedLesson.groupLevel }}
                </UBadge>
                <UBadge
                  :color="statusColor(selectedLesson.status)"
                  variant="subtle"
                  size="xs"
                >
                  {{ statusLabel[selectedLesson.status] ?? selectedLesson.status }}
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ new Date(selectedLesson.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) }}
                в {{ selectedLesson.time.slice(0, 5) }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showModal = false"
            />
          </div>

          <UDivider />

          <div class="space-y-3 text-sm">
            <!-- Teacher -->
            <div class="flex items-center gap-3">
              <UAvatar
                :src="selectedLesson.teacherAvatar ?? undefined"
                :alt="selectedLesson.teacherName"
                size="sm"
              />
              <div>
                <p class="font-semibold">
                  {{ selectedLesson.teacherName }}
                </p>
                <p class="text-xs text-muted">
                  Учитель
                </p>
              </div>
            </div>

            <!-- Topic -->
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-book-open"
                class="size-4 text-muted mt-0.5 shrink-0"
              />
              <div>
                <p class="text-xs text-muted">
                  Тема урока
                </p>
                <p class="font-medium">
                  {{ selectedLesson.topic ?? 'Не указана' }}
                </p>
              </div>
            </div>

            <!-- Attendance -->
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-users"
                class="size-4 text-muted shrink-0"
              />
              <div>
                <p class="text-xs text-muted">
                  Посещаемость
                </p>
                <p class="font-semibold">
                  {{ selectedLesson.presentCount }} / {{ selectedLesson.totalCount }}
                  <span
                    v-if="selectedLesson.totalCount > 0"
                    class="text-xs font-normal text-muted"
                  >
                    ({{ Math.round(selectedLesson.presentCount / selectedLesson.totalCount * 100) }}%)
                  </span>
                </p>
              </div>
            </div>

            <!-- Online link -->
            <div
              v-if="selectedLesson.isOnline && selectedLesson.meetLink"
              class="flex items-center gap-2"
            >
              <UIcon
                name="i-lucide-video"
                class="size-4 text-muted shrink-0"
              />
              <a
                :href="selectedLesson.meetLink"
                target="_blank"
                class="text-primary text-sm hover:underline truncate"
              >
                {{ selectedLesson.meetLink }}
              </a>
            </div>
          </div>

          <!-- Actions -->
          <div
            v-if="selectedLesson.status === 'SCHEDULED'"
            class="flex gap-2 pt-1"
          >
            <UButton
              color="error"
              variant="soft"
              size="sm"
              icon="i-lucide-x-circle"
              :loading="cancellingId === selectedLesson.id"
              @click="cancelLesson"
            >
              Отменить урок
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
