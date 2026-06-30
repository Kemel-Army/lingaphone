<script setup lang="ts">
import { useAdminStats } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const supabase = useTypedSupabaseClient()
const toast = useToast()
const { fetchGroups } = useAdminStats()

const TZ = 'Asia/Almaty'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleLesson {
  id: string
  date: string // KZ date YYYY-MM-DD
  time: string // KZ HH:MM
  startsAt: string
  durationMin: number
  topic: string | null
  status: string
  groupId: string
  groupName: string
  groupLevel: string
  teacherName: string
  teacherAvatar: string | null
  isOnline: boolean
  meetLink: string | null
}

// Render the KZ-local date/time for a stored UTC timestamp.
const kzDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
const kzTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

// ─── Date navigation ──────────────────────────────────────────────────────────

const today = new Date()
const weekOffset = ref(0)

const weekStart = computed(() => {
  const d = new Date(today)
  d.setDate(d.getDate() - d.getDay() + 1 + weekOffset.value * 7) // Mon
  d.setHours(0, 0, 0, 0)
  return d
})

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
)

const weekDayKeys = computed(() => weekDays.value.map(d => d.toLocaleDateString('en-CA', { timeZone: TZ })))

const weekLabel = computed(() => {
  const from = weekDays.value[0]!
  const to = weekDays.value[6]!
  return `${from.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${to.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`
})

// ─── Fetch lessons ────────────────────────────────────────────────────────────

const { data: lessons, pending, refresh } = await useAsyncData(
  () => `admin-schedule-${weekOffset.value}`,
  async () => {
    // Widen the range by ±1 day so KZ-evening lessons near the week edge are
    // not lost to the +5h UTC offset; bucketing by KZ date drops the extras.
    const from = new Date(weekStart.value)
    from.setDate(from.getDate() - 1)
    const to = new Date(weekStart.value)
    to.setDate(to.getDate() + 8)

    const { data, error } = await supabase
      .from('Lesson')
      .select(`
        id, startsAt, durationMin, topic, status, meetingUrl, groupId,
        Group!groupId ( name, level, archivedAt, Teacher!teacherId ( User!userId ( name, surname, avatarUrl ) ) )
      `)
      .gte('startsAt', from.toISOString())
      .lt('startsAt', to.toISOString())
      .order('startsAt') as unknown as {
      data: {
        id: string
        startsAt: string
        durationMin: number
        topic: string | null
        status: string
        meetingUrl: string | null
        groupId: string
        Group: {
          name: string
          level: string
          archivedAt: string | null
          Teacher: { User: { name: string, surname: string, avatarUrl: string | null } | null } | null
        } | null
      }[] | null
      error: unknown
    }

    if (error) return []

    return (data ?? [])
      .map((l) => {
        const group = Array.isArray(l.Group) ? l.Group[0] : l.Group
        const teacher = group ? (Array.isArray(group.Teacher) ? group.Teacher[0] : group.Teacher) : null
        const tUser = teacher ? (Array.isArray(teacher.User) ? teacher.User[0] : teacher.User) : null
        return {
          id: l.id,
          date: kzDate(l.startsAt),
          time: kzTime(l.startsAt),
          startsAt: l.startsAt,
          durationMin: l.durationMin ?? 60,
          topic: l.topic,
          status: l.status,
          groupId: l.groupId,
          groupName: group?.name ?? '—',
          groupLevel: group?.level ?? '',
          teacherName: tUser ? `${tUser.name} ${tUser.surname}`.trim() : '—',
          teacherAvatar: tUser?.avatarUrl ?? null,
          isOnline: !!l.meetingUrl,
          meetLink: l.meetingUrl,
          _archived: !!group?.archivedAt
        }
      })
      // Hide lessons of archived (closed) groups.
      .filter(l => !l._archived) as unknown as ScheduleLesson[]
  }
)

watch(weekOffset, () => refresh())

// ─── Filters ──────────────────────────────────────────────────────────────────

const filterValue = ref<string | null>(null)

const groupOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const l of lessons.value ?? []) seen.set(l.groupId, l.groupName)
  return [{ label: 'Все группы', value: null }, ...[...seen.entries()].map(([id, name]) => ({ label: name, value: id }))]
})

const filteredLessons = computed(() => {
  const list = lessons.value ?? []
  return filterValue.value ? list.filter(l => l.groupId === filterValue.value) : list
})

// ─── Time-grid (rows = start times, columns = days) ────────────────────────────

// Distinct start times present in the week, sorted ascending.
const timeRows = computed(() => {
  const set = new Set<string>()
  for (const l of filteredLessons.value) set.add(l.time)
  return [...set].sort((a, b) => a.localeCompare(b))
})

const lessonAt = (dayKey: string, time: string) =>
  filteredLessons.value.filter(l => l.date === dayKey && l.time === time)

// ─── Per-group colors ──────────────────────────────────────────────────────────

const GROUP_PALETTE = [
  { dot: 'bg-blue-500', cell: 'bg-blue-500/10 border-blue-400/60 hover:bg-blue-500/20 dark:bg-blue-500/15' },
  { dot: 'bg-emerald-500', cell: 'bg-emerald-500/10 border-emerald-400/60 hover:bg-emerald-500/20 dark:bg-emerald-500/15' },
  { dot: 'bg-amber-500', cell: 'bg-amber-500/10 border-amber-400/60 hover:bg-amber-500/20 dark:bg-amber-500/15' },
  { dot: 'bg-violet-500', cell: 'bg-violet-500/10 border-violet-400/60 hover:bg-violet-500/20 dark:bg-violet-500/15' },
  { dot: 'bg-rose-500', cell: 'bg-rose-500/10 border-rose-400/60 hover:bg-rose-500/20 dark:bg-rose-500/15' },
  { dot: 'bg-cyan-500', cell: 'bg-cyan-500/10 border-cyan-400/60 hover:bg-cyan-500/20 dark:bg-cyan-500/15' },
  { dot: 'bg-fuchsia-500', cell: 'bg-fuchsia-500/10 border-fuchsia-400/60 hover:bg-fuchsia-500/20 dark:bg-fuchsia-500/15' },
  { dot: 'bg-lime-500', cell: 'bg-lime-500/10 border-lime-400/60 hover:bg-lime-500/20 dark:bg-lime-500/15' }
]

// Stable palette index per group — keyed off the full group list (not the
// current week's lessons), so a group keeps its colour across every week.
const groupColorIndex = computed(() => {
  const map = new Map<string, number>()
  const ids = [...(allGroups.value ?? [])].map(g => g.id).sort()
  ids.forEach((id, i) => map.set(id, i % GROUP_PALETTE.length))
  return map
})

const groupPalette = (groupId: string) => GROUP_PALETTE[groupColorIndex.value.get(groupId) ?? 0]!

const lessonCellClass = (l: ScheduleLesson) => {
  if (l.status === 'CANCELLED') return 'bg-red-500/5 border-red-300/50 opacity-60 line-through'
  return groupPalette(l.groupId).cell
}

// ─── Add lesson modal ──────────────────────────────────────────────────────────

const showAdd = ref(false)
const adding = ref(false)
const addForm = reactive({
  groupId: '',
  date: '',
  time: '',
  durationMin: 60,
  topic: '',
  repeat: 'once' as 'once' | 'weekly'
})

const RECUR_WEEKS = 12

const { data: allGroups } = await useAsyncData('admin-schedule-groups', fetchGroups)
const activeGroupItems = computed(() =>
  (allGroups.value ?? [])
    .filter(g => !g.archivedAt)
    .map(g => ({ label: `${g.name} · ${g.level}`, value: g.id }))
)

const canAdd = computed(() => addForm.groupId && addForm.date && addForm.time)

const openAdd = () => {
  addForm.groupId = ''
  addForm.date = ''
  addForm.time = ''
  addForm.durationMin = 60
  addForm.topic = ''
  addForm.repeat = 'once'
  showAdd.value = true
}

// Add 7*i days to a YYYY-MM-DD string, returning YYYY-MM-DD.
const addDays = (dateStr: string, days: number) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y!, (m! - 1), d! + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const submitAdd = async () => {
  if (!canAdd.value) return
  adding.value = true
  try {
    const base = {
      groupId: addForm.groupId,
      durationMin: addForm.durationMin || 60,
      topic: addForm.topic.trim() || '',
      status: 'SCHEDULED' as const
    }
    const count = addForm.repeat === 'weekly' ? RECUR_WEEKS : 1
    const rows = Array.from({ length: count }, (_, i) => ({
      ...base,
      startsAt: `${addDays(addForm.date, i * 7)}T${addForm.time}:00+05:00`
    }))

    const { error } = await supabase.from('Lesson').insert(rows)
    if (error) throw error
    toast.add({
      title: addForm.repeat === 'weekly' ? `Добавлено ${count} уроков (еженедельно)` : 'Урок добавлен',
      color: 'success',
      icon: 'i-lucide-check'
    })
    showAdd.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: String((e as { message?: string })?.message ?? e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    adding.value = false
  }
}

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
    SCHEDULED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'error'
  }
  return map[status] ?? 'neutral'
}

const statusLabel: Record<string, string> = {
  SCHEDULED: 'Запланирован', IN_PROGRESS: 'Идёт', COMPLETED: 'Завершён', CANCELLED: 'Отменён'
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
          Уроки всех групп · время по Алматы
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Week nav -->
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="weekOffset--"
        />
        <span class="text-sm font-medium w-44 text-center">{{ weekLabel }}</span>
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
        <UButton
          icon="i-lucide-plus"
          @click="openAdd"
        >
          Добавить урок
        </UButton>
      </div>
    </div>

    <!-- Filter + hint -->
    <div class="flex items-center gap-3 flex-wrap">
      <USelect
        v-model="filterValue"
        :items="groupOptions"
        class="w-56"
        placeholder="Все группы"
      />
      <span class="text-sm text-muted ml-auto">
        {{ filteredLessons.length }} урок(ов) за неделю
      </span>
    </div>

    <p class="text-xs text-muted flex items-center gap-1.5">
      <UIcon
        name="i-lucide-info"
        class="size-3.5 text-primary shrink-0"
      />
      Уроки создаются автоматически при создании группы с расписанием. Здесь можно добавить разовый урок или отменить существующий.
    </p>

    <!-- Group legend -->
    <div
      v-if="!pending && groupOptions.length > 1"
      class="flex items-center gap-x-4 gap-y-1.5 flex-wrap"
    >
      <div
        v-for="opt in groupOptions.filter(o => o.value)"
        :key="opt.value!"
        class="flex items-center gap-1.5 text-xs"
      >
        <span
          class="size-2.5 rounded-full"
          :class="groupPalette(opt.value!).dot"
        />
        <span class="text-muted">{{ opt.label }}</span>
      </div>
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

    <!-- Time-grid table -->
    <div
      v-else
      class="overflow-x-auto rounded-2xl border border-default"
    >
      <div class="min-w-190">
        <!-- Header: corner + day columns -->
        <div class="grid grid-cols-[68px_repeat(7,minmax(96px,1fr))] border-b border-default bg-elevated/50">
          <div class="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted flex items-end">
            Время
          </div>
          <div
            v-for="(day, i) in weekDays"
            :key="day.toISOString()"
            class="px-2 py-2 text-center border-l border-default"
            :class="isToday(day) ? 'bg-primary/10' : ''"
          >
            <p
              class="text-[10px] font-semibold uppercase tracking-wide"
              :class="isToday(day) ? 'text-primary' : 'text-muted'"
            >
              {{ dayLabels[i] }}
            </p>
            <p
              class="text-base font-bold leading-tight"
              :class="isToday(day) ? 'text-primary' : ''"
            >
              {{ day.getDate() }}
            </p>
          </div>
        </div>

        <!-- Empty week -->
        <div
          v-if="!timeRows.length"
          class="py-16 text-center text-sm text-muted"
        >
          <UIcon
            name="i-lucide-calendar-x"
            class="size-8 mx-auto mb-2 opacity-30"
          />
          На этой неделе уроков нет
        </div>

        <!-- Time rows -->
        <div
          v-for="time in timeRows"
          :key="time"
          class="grid grid-cols-[68px_repeat(7,minmax(96px,1fr))] border-b border-default last:border-0"
        >
          <!-- Time label -->
          <div class="px-2 py-2 text-xs font-mono font-semibold text-muted flex items-start">
            {{ time }}
          </div>
          <!-- Day cells -->
          <div
            v-for="(day, i) in weekDays"
            :key="`${time}-${i}`"
            class="border-l border-default p-1 space-y-1 min-h-13"
            :class="isToday(day) ? 'bg-primary/5' : ''"
          >
            <button
              v-for="lesson in lessonAt(weekDayKeys[i]!, time)"
              :key="lesson.id"
              type="button"
              class="w-full text-left rounded-lg border px-2 py-1.5 transition-colors cursor-pointer"
              :class="lessonCellClass(lesson)"
              @click="openLesson(lesson)"
            >
              <p class="text-xs font-semibold leading-tight truncate">
                {{ lesson.groupName }}
              </p>
              <p class="text-[10px] text-muted truncate">
                {{ lesson.teacherName.split(' ')[0] }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Add Lesson Modal ──────────────────────────────────────────────────── -->
    <UModal
      v-model:open="showAdd"
      :ui="{ content: 'max-w-md' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              Добавить урок
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showAdd = false"
            />
          </div>

          <UFormField
            label="Группа"
            required
          >
            <USelect
              v-model="addForm.groupId"
              :items="activeGroupItems"
              placeholder="Выберите группу..."
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Дата"
              required
            >
              <UInput
                v-model="addForm.date"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Время"
              required
            >
              <UInput
                v-model="addForm.time"
                type="time"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Длительность (мин)">
              <UInput
                v-model.number="addForm.durationMin"
                type="number"
                :min="15"
                :max="240"
                :step="15"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Тема">
              <UInput
                v-model="addForm.topic"
                placeholder="Необязательно"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Repeat -->
          <UFormField label="Повторение">
            <div class="flex rounded-lg border border-subtle overflow-hidden w-full">
              <button
                type="button"
                class="flex-1 px-3 py-1.5 text-sm font-medium transition-colors"
                :class="addForm.repeat === 'once' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/20'"
                @click="addForm.repeat = 'once'"
              >
                Единоразово
              </button>
              <button
                type="button"
                class="flex-1 px-3 py-1.5 text-sm font-medium transition-colors"
                :class="addForm.repeat === 'weekly' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/20'"
                @click="addForm.repeat = 'weekly'"
              >
                Каждую неделю
              </button>
            </div>
          </UFormField>
          <p
            v-if="addForm.repeat === 'weekly'"
            class="text-xs text-muted flex items-center gap-1.5 -mt-1"
          >
            <UIcon
              name="i-lucide-repeat"
              class="size-3.5 text-primary shrink-0"
            />
            Урок создастся на {{ RECUR_WEEKS }} недель вперёд в этот же день и время
          </p>

          <div class="flex justify-end gap-3 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showAdd = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canAdd || adding"
              :loading="adding"
              icon="i-lucide-plus"
              @click="submitAdd"
            >
              Добавить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

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
                {{ new Date(selectedLesson.startsAt).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }) }}
                в {{ selectedLesson.time }} · {{ selectedLesson.durationMin }} мин
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
                  {{ selectedLesson.topic || 'Не указана' }}
                </p>
              </div>
            </div>

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
