<script lang="ts">
/**
 * WeekScheduleGrid — read-only weekly timetable (time rows × day columns).
 *
 * Presentational only: it receives a flat list of lessons and renders the same
 * pretty grid the admin schedule uses, with one stable colour per group and a
 * legend. Week navigation is internal. Clicking a lesson emits `select`.
 * No editing — used by teacher and student schedules.
 */
export interface GridLesson {
  id: string
  startsAt: string
  durationMin?: number
  topic?: string | null
  status?: string
  groupId: string
  groupName: string
  groupLevel?: string
}
</script>

<script setup lang="ts">
const props = defineProps<{
  lessons: GridLesson[]
}>()

const emit = defineEmits<{ select: [lesson: GridLesson] }>()

const TZ = 'Asia/Almaty'
const kzDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
const kzTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// ── Week navigation ───────────────────────────────────────────
const today = new Date()
const weekOffset = ref(0)

const weekStart = computed(() => {
  const d = new Date(today)
  d.setDate(d.getDate() - d.getDay() + 1 + weekOffset.value * 7)
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

const isToday = (d: Date) => d.toDateString() === today.toDateString()

// ── Week's lessons (decorated with KZ date/time) ──────────────
type Decorated = GridLesson & { _date: string, _time: string }
const weekLessons = computed<Decorated[]>(() => {
  const keys = new Set(weekDayKeys.value)
  return props.lessons
    .map(l => ({ ...l, _date: kzDate(l.startsAt), _time: kzTime(l.startsAt) }))
    .filter(l => keys.has(l._date))
})

const totalWeek = computed(() => weekLessons.value.length)

// ── Time-grid ─────────────────────────────────────────────────
const timeRows = computed(() => {
  const set = new Set<string>()
  for (const l of weekLessons.value) set.add(l._time)
  return [...set].sort((a, b) => a.localeCompare(b))
})

const lessonAt = (dayKey: string, time: string) =>
  weekLessons.value.filter(l => l._date === dayKey && l._time === time)

// ── Per-group colours (stable across weeks) ───────────────────
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

const groupColorIndex = computed(() => {
  const map = new Map<string, number>()
  const ids = [...new Set(props.lessons.map(l => l.groupId))].sort()
  ids.forEach((id, i) => map.set(id, i % GROUP_PALETTE.length))
  return map
})
const groupPalette = (groupId: string) => GROUP_PALETTE[groupColorIndex.value.get(groupId) ?? 0]!

const lessonCellClass = (l: GridLesson) => {
  if (l.status === 'CANCELLED') return 'bg-red-500/5 border-red-300/50 opacity-60 line-through'
  return groupPalette(l.groupId).cell
}

// Legend — distinct groups across all lessons.
const legend = computed(() => {
  const seen = new Map<string, string>()
  for (const l of props.lessons) if (!seen.has(l.groupId)) seen.set(l.groupId, l.groupName)
  return [...seen.entries()].map(([id, name]) => ({ id, name }))
})
</script>

<template>
  <div class="space-y-4">
    <!-- Week nav -->
    <div class="flex items-center gap-2 flex-wrap">
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
      <span class="text-sm text-muted ml-auto">{{ totalWeek }} урок(ов) за неделю</span>
    </div>

    <!-- Legend -->
    <div
      v-if="legend.length > 1"
      class="flex items-center gap-x-4 gap-y-1.5 flex-wrap"
    >
      <div
        v-for="g in legend"
        :key="g.id"
        class="flex items-center gap-1.5 text-xs"
      >
        <span
          class="size-2.5 rounded-full"
          :class="groupPalette(g.id).dot"
        />
        <span class="text-muted">{{ g.name }}</span>
      </div>
    </div>

    <!-- Time-grid table -->
    <div class="overflow-x-auto rounded-2xl border border-default">
      <div class="min-w-190">
        <!-- Header -->
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

        <!-- Empty -->
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

        <!-- Rows -->
        <div
          v-for="time in timeRows"
          :key="time"
          class="grid grid-cols-[68px_repeat(7,minmax(96px,1fr))] border-b border-default last:border-0"
        >
          <div class="px-2 py-2 text-xs font-mono font-semibold text-muted flex items-start">
            {{ time }}
          </div>
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
              @click="emit('select', lesson)"
            >
              <p class="text-xs font-semibold leading-tight truncate">
                {{ lesson.groupName }}
              </p>
              <p
                v-if="lesson.topic"
                class="text-[10px] text-muted truncate"
              >
                {{ lesson.topic }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
