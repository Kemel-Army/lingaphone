<script setup lang="ts">
import { useAdminStats } from '~/entities/admin-stats'
import { useLeads } from '~/entities/lead'

definePageMeta({ layout: 'dashboard' })

const supabase = useTypedSupabaseClient()
const toast = useToast()
const { fetchGroups, fetchTeachers } = useAdminStats()

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
  type: LessonKind
  groupId: string
  groupName: string
  groupLevel: string
  teacherId: string
  teacherName: string
  teacherAvatar: string | null
  isOnline: boolean
  meetLink: string | null
  isServiceGroup: boolean
  /** Имя ребёнка на пробном (из LessonGuestInvite) — только для TRIAL. */
  guestName: string | null
}

// Render the KZ-local date/time for a stored UTC timestamp.
const kzDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
const kzTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

// ─── View mode + date navigation ──────────────────────────────────────────────

/**
 * Two views over the same week of data (AlfaCRM-style):
 *   'week' — rows = start times, columns = weekdays
 *   'day'  — rows = start times, columns = TEACHERS working that day
 * Both read from one fetch keyed by the Monday of `anchor`'s week, so
 * switching modes or stepping a day inside the week costs no extra request.
 */
type ViewMode = 'week' | 'day'
const viewMode = ref<ViewMode>('week')

const startOfDay = (d: Date) => {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

const today = new Date()
const anchor = ref<Date>(startOfDay(today))

const weekStart = computed(() => {
  const d = new Date(anchor.value)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // back to Monday
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
const anchorKey = computed(() => anchor.value.toLocaleDateString('en-CA', { timeZone: TZ }))

const weekLabel = computed(() => {
  const from = weekDays.value[0]!
  const to = weekDays.value[6]!
  return `${from.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${to.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`
})

const dayLabel = computed(() =>
  anchor.value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
)

const periodLabel = computed(() => viewMode.value === 'week' ? weekLabel.value : dayLabel.value)

/** Step by a week or a day depending on the active view. */
const shift = (dir: -1 | 1) => {
  const d = new Date(anchor.value)
  d.setDate(d.getDate() + dir * (viewMode.value === 'week' ? 7 : 1))
  anchor.value = startOfDay(d)
}
const goToday = () => {
  anchor.value = startOfDay(new Date())
}
const isAnchorToday = computed(() => anchor.value.toDateString() === today.toDateString())

// ─── Fetch lessons ────────────────────────────────────────────────────────────

const { data: lessons, pending, refresh } = await useAsyncData(
  () => `admin-schedule-${weekDayKeys.value[0]}`,
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
        id, startsAt, durationMin, topic, status, type, meetingUrl, groupId,
        Group!groupId ( name, level, archivedAt, isService, Teacher!teacherId ( id, User!userId ( name, surname, avatarUrl ) ) ),
        LessonGuestInvite ( guestName )
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
        type: LessonKind
        meetingUrl: string | null
        groupId: string
        Group: {
          name: string
          level: string
          archivedAt: string | null
          isService: boolean
          Teacher: { id: string, User: { name: string, surname: string, avatarUrl: string | null } | null } | null
        } | null
        LessonGuestInvite: { guestName: string | null }[] | { guestName: string | null } | null
      }[] | null
      error: unknown
    }

    if (error) return []

    return (data ?? [])
      .map((l) => {
        const group = Array.isArray(l.Group) ? l.Group[0] : l.Group
        const teacher = group ? (Array.isArray(group.Teacher) ? group.Teacher[0] : group.Teacher) : null
        const tUser = teacher ? (Array.isArray(teacher.User) ? teacher.User[0] : teacher.User) : null
        const isServiceGroup = !!group?.isService
        // Несколько детей могут быть закреплены за одним слотом (пробный/отработка) —
        // собираем имена всех гостевых приглашений урока.
        const invites = Array.isArray(l.LessonGuestInvite) ? l.LessonGuestInvite : (l.LessonGuestInvite ? [l.LessonGuestInvite] : [])
        const guestName = invites.map(i => i.guestName).filter((n): n is string => !!n).join(', ') || null
        return {
          id: l.id,
          date: kzDate(l.startsAt),
          time: kzTime(l.startsAt),
          startsAt: l.startsAt,
          durationMin: l.durationMin ?? 60,
          topic: l.topic,
          status: l.status,
          type: l.type,
          groupId: l.groupId,
          // Служебная группа — не настоящая группа: для пробного показываем имя
          // ребёнка (если привязан), иначе — тип занятия.
          groupName: isServiceGroup ? (guestName ?? LESSON_TYPE_MAP[l.type].label) : (group?.name ?? '—'),
          groupLevel: isServiceGroup ? '' : (group?.level ?? ''),
          teacherId: teacher?.id ?? '',
          teacherName: tUser ? `${tUser.name} ${tUser.surname}`.trim() : '—',
          teacherAvatar: tUser?.avatarUrl ?? null,
          isOnline: !!l.meetingUrl,
          meetLink: l.meetingUrl,
          isServiceGroup,
          guestName,
          _archived: !!group?.archivedAt
        }
      })
      // Hide lessons of archived (closed) groups.
      .filter(l => !l._archived) as unknown as ScheduleLesson[]
  }
)

// Only a change of week needs new rows — day-stepping inside the week reuses them.
watch(() => weekDayKeys.value[0], () => refresh())

// ─── Filters ──────────────────────────────────────────────────────────────────

const filterValue = ref<string | null>(null)

const groupOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const l of lessons.value ?? []) {
    if (l.isServiceGroup) continue
    seen.set(l.groupId, l.groupName)
  }
  return [{ label: 'Все группы', value: null }, ...[...seen.entries()].map(([id, name]) => ({ label: name, value: id }))]
})

const filteredLessons = computed(() => {
  const list = lessons.value ?? []
  return filterValue.value ? list.filter(l => l.groupId === filterValue.value) : list
})

// ─── Time-grid ─────────────────────────────────────────────────────────────────
// Week view: rows = start times, columns = weekdays.
// Day view:  rows = start times, columns = teachers working that day.

/** Lessons of the anchored day only — the source for the day view. */
const dayLessons = computed(() => filteredLessons.value.filter(l => l.date === anchorKey.value))

/** Rows are the distinct start times of whichever set the active view shows. */
const timeRows = computed(() => {
  const src = viewMode.value === 'week' ? filteredLessons.value : dayLessons.value
  const set = new Set<string>()
  for (const l of src) set.add(l.time)
  return [...set].sort((a, b) => a.localeCompare(b))
})

const lessonAt = (dayKey: string, time: string) =>
  filteredLessons.value.filter(l => l.date === dayKey && l.time === time)

/**
 * Teacher columns for the day view — only teachers who actually teach that
 * day, sorted by name, so the grid stays as narrow as the day requires.
 */
const dayTeachers = computed(() => {
  const seen = new Map<string, { id: string, name: string, avatar: string | null }>()
  for (const l of dayLessons.value) {
    if (!seen.has(l.teacherId)) seen.set(l.teacherId, { id: l.teacherId, name: l.teacherName, avatar: l.teacherAvatar })
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

const lessonAtTeacher = (teacherId: string, time: string) =>
  dayLessons.value.filter(l => l.teacherId === teacherId && l.time === time)

/** "9:00" + 90 min → "10:30" — shown on the day-view cards like AlfaCRM. */
const endTime = (l: ScheduleLesson) => {
  const [h, m] = l.time.split(':').map(Number)
  const total = (h! * 60 + m!) + (l.durationMin || 60)
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

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

// Служебная группа не входит в GROUP_PALETTE (не настоящая группа) — цвет ячейки
// берём по типу занятия, чтобы TRIAL/INDIVIDUAL/MAKEUP/SPEAKING_CLUB визуально не путались.
const SERVICE_TYPE_CELL_CLASS: Record<LessonKind, string> = {
  GROUP: '',
  TRIAL: 'bg-emerald-500/10 border-emerald-400/60 hover:bg-emerald-500/20 dark:bg-emerald-500/15',
  INDIVIDUAL: 'bg-sky-500/10 border-sky-400/60 hover:bg-sky-500/20 dark:bg-sky-500/15',
  MAKEUP: 'bg-amber-500/10 border-amber-400/60 hover:bg-amber-500/20 dark:bg-amber-500/15',
  SPEAKING_CLUB: 'bg-fuchsia-500/10 border-fuchsia-400/60 hover:bg-fuchsia-500/20 dark:bg-fuchsia-500/15'
}

const lessonCellClass = (l: ScheduleLesson) => {
  if (l.status === 'CANCELLED') return 'bg-red-500/5 border-red-300/50 opacity-60 line-through'
  if (l.isServiceGroup) return SERVICE_TYPE_CELL_CLASS[l.type]
  return groupPalette(l.groupId).cell
}

// ─── Per-teacher colors (day view) ─────────────────────────────────────────────

// In the day view columns are teachers, so the colour has to identify the
// teacher — the way AlfaCRM tints each teacher's column and legend chip.
const TEACHER_PALETTE = [
  { dot: 'bg-emerald-600', bar: 'bg-emerald-600', tint: 'bg-emerald-500/5' },
  { dot: 'bg-blue-600', bar: 'bg-blue-600', tint: 'bg-blue-500/5' },
  { dot: 'bg-violet-600', bar: 'bg-violet-600', tint: 'bg-violet-500/5' },
  { dot: 'bg-amber-500', bar: 'bg-amber-500', tint: 'bg-amber-500/5' },
  { dot: 'bg-rose-600', bar: 'bg-rose-600', tint: 'bg-rose-500/5' },
  { dot: 'bg-cyan-600', bar: 'bg-cyan-600', tint: 'bg-cyan-500/5' },
  { dot: 'bg-fuchsia-600', bar: 'bg-fuchsia-600', tint: 'bg-fuchsia-500/5' },
  { dot: 'bg-lime-600', bar: 'bg-lime-600', tint: 'bg-lime-500/5' },
  { dot: 'bg-orange-600', bar: 'bg-orange-600', tint: 'bg-orange-500/5' },
  { dot: 'bg-teal-600', bar: 'bg-teal-600', tint: 'bg-teal-500/5' }
]

// Keyed off every teacher who owns a group, not just the ones teaching today,
// so a teacher keeps the same colour on every day you open.
const teacherColorIndex = computed(() => {
  const map = new Map<string, number>()
  const ids = [...new Set((allGroups.value ?? []).map(g => g.teacherId))].sort()
  ids.forEach((id, i) => map.set(id, i % TEACHER_PALETTE.length))
  return map
})

const teacherPalette = (teacherId: string) => TEACHER_PALETTE[teacherColorIndex.value.get(teacherId) ?? 0]!

/** Group roster size for the "(занято/мест)" badge on day-view cards. */
const groupSize = computed(() => {
  const map = new Map<string, { count: number, max: number }>()
  for (const g of allGroups.value ?? []) map.set(g.id, { count: g.studentCount, max: g.maxStudents })
  return map
})

// ─── Add lesson modal ──────────────────────────────────────────────────────────

const showAdd = ref(false)
const adding = ref(false)
const NEW_LEAD_VALUE = '__new__'

interface ChildRow {
  uid: number
  leadId: string
  newLeadName: string
  newLeadPhone: string
}
let childUidSeq = 0
const makeChildRow = (): ChildRow => ({ uid: childUidSeq++, leadId: '', newLeadName: '', newLeadPhone: '' })

const addForm = reactive({
  groupId: '',
  teacherId: '',
  date: '',
  time: '',
  durationMin: 60,
  topic: '',
  type: 'GROUP' as LessonKind,
  repeat: 'once' as 'once' | 'weekly',
  children: [] as ChildRow[]
})

// Группу выбираем только для типа GROUP — для остальных (пробный/индивидуальный/
// отработка/speaking club) она физически всё равно нужна (Lesson.groupId NOT NULL),
// но выбирать её вручную нелогично: резолвим служебную группу учителя автоматом.
const isGroupType = computed(() => addForm.type === 'GROUP')
// Несколько детей можно закрепить за одним слотом пробного/отработки — например,
// групповой пробный или два ученика на одну отработку (запрос заказчика).
const allowsChildren = computed(() => addForm.type === 'TRIAL' || addForm.type === 'MAKEUP')

watch(() => addForm.type, (t) => {
  if ((t === 'TRIAL' || t === 'MAKEUP') && addForm.children.length === 0) {
    addForm.children.push(makeChildRow())
  }
})

const addChildRow = () => {
  addForm.children.push(makeChildRow())
}
const removeChildRow = (uid: number) => {
  addForm.children = addForm.children.filter(c => c.uid !== uid)
}

// ─── Ребёнок на пробный/отработку (CRM-лид) ────────────────────────────────────

const { fetchLeads } = useLeads()
const { data: allLeads, refresh: refreshLeads } = await useAsyncData('admin-schedule-leads', fetchLeads)

const leadOptions = computed(() => [
  ...(allLeads.value ?? []).map(l => ({
    label: l.phone ? `${l.fullName} · ${l.phone}` : l.fullName,
    value: l.id
  })),
  { label: '+ Новый ребёнок...', value: NEW_LEAD_VALUE }
])

const RECUR_WEEKS = 12

const { data: allGroups } = await useAsyncData('admin-schedule-groups', fetchGroups)
const { data: allTeachers } = await useAsyncData('admin-schedule-teachers', fetchTeachers)
const activeGroupItems = computed(() =>
  (allGroups.value ?? [])
    .filter(g => !g.archivedAt)
    .map(g => ({ label: `${g.name} · ${g.level}`, value: g.id }))
)
const teacherItems = computed(() =>
  (allTeachers.value ?? []).map(t => ({ label: `${t.surname} ${t.name}`.trim(), value: t.id }))
)

const canAdd = computed(() =>
  (isGroupType.value ? !!addForm.groupId : !!addForm.teacherId) && addForm.date && addForm.time
  && addForm.children.every(c => c.leadId !== NEW_LEAD_VALUE || c.newLeadName.trim().length > 0)
)

const openAdd = () => {
  addForm.groupId = ''
  addForm.teacherId = ''
  addForm.date = ''
  addForm.time = ''
  addForm.durationMin = 60
  addForm.topic = ''
  addForm.type = 'GROUP'
  addForm.repeat = 'once'
  addForm.children = []
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
    let groupId = addForm.groupId
    if (!isGroupType.value) {
      const { data: serviceGroupId, error: rpcError } = await supabase
        .rpc('get_or_create_service_group', { p_teacher_id: addForm.teacherId })
      if (rpcError || !serviceGroupId) throw rpcError ?? new Error('Не удалось получить служебную группу учителя')
      groupId = serviceGroupId
    }

    const base = {
      groupId,
      durationMin: addForm.durationMin || 60,
      topic: addForm.topic.trim() || '',
      type: addForm.type,
      status: 'SCHEDULED' as const
    }
    const count = addForm.repeat === 'weekly' ? RECUR_WEEKS : 1
    const rows = Array.from({ length: count }, (_, i) => ({
      ...base,
      startsAt: `${addDays(addForm.date, i * 7)}T${addForm.time}:00+05:00`
    }))

    const { data: inserted, error } = await supabase.from('Lesson').insert(rows).select('id')
    if (error) throw error

    // Пробный/отработка — привязываем одного или нескольких детей к первому уроку
    // через гостевые приглашения (LessonGuestInvite, по одному на ребёнка): так
    // же помечает «для кого этот слот» и синхронизирует Lead.trialLessonAt/
    // trialTeacherId в CRM, заводя новых лидов там, где выбрано «+ Новый».
    const firstLessonId = inserted?.[0]?.id as string | undefined
    const childrenToLink = addForm.children.filter(c => c.leadId === NEW_LEAD_VALUE ? c.newLeadName.trim() : c.leadId)
    if (allowsChildren.value && firstLessonId && childrenToLink.length) {
      let anyFailed = false
      for (const c of childrenToLink) {
        try {
          await $fetch('/api/teacher/lesson-invite', {
            method: 'POST',
            body: {
              lessonId: firstLessonId,
              guestName: c.leadId === NEW_LEAD_VALUE
                ? c.newLeadName.trim()
                : (allLeads.value ?? []).find(l => l.id === c.leadId)?.fullName,
              leadId: c.leadId !== NEW_LEAD_VALUE ? c.leadId : undefined,
              newLead: c.leadId === NEW_LEAD_VALUE
                ? { fullName: c.newLeadName.trim(), phone: c.newLeadPhone.trim() || undefined }
                : undefined
            }
          })
        } catch {
          anyFailed = true
        }
      }
      await refreshLeads()
      if (anyFailed) {
        toast.add({
          title: 'Урок добавлен, но не всех детей удалось привязать',
          color: 'warning',
          icon: 'i-lucide-triangle-alert'
        })
      }
    }

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
        <!-- Period nav — steps a week or a day depending on the view -->
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          :aria-label="viewMode === 'week' ? 'Предыдущая неделя' : 'Предыдущий день'"
          @click="shift(-1)"
        />
        <span class="text-sm font-medium w-48 text-center">{{ periodLabel }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          size="sm"
          :aria-label="viewMode === 'week' ? 'Следующая неделя' : 'Следующий день'"
          @click="shift(1)"
        />
        <UButton
          v-if="!isAnchorToday"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="goToday"
        >
          Сегодня
        </UButton>

        <!-- View toggle -->
        <div class="inline-flex rounded-lg border border-default overflow-hidden">
          <button
            v-for="m in ([{ v: 'week', l: 'Неделя' }, { v: 'day', l: 'День' }] as const)"
            :key="m.v"
            type="button"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="viewMode === m.v ? 'bg-primary text-inverted' : 'text-muted hover:bg-elevated'"
            @click="viewMode = m.v"
          >
            {{ m.l }}
          </button>
        </div>

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
        {{ viewMode === 'week'
          ? `${filteredLessons.length} урок(ов) за неделю`
          : `${dayLessons.length} урок(ов) · ${dayTeachers.length} преподавател(ей)` }}
      </span>
    </div>

    <p class="text-xs text-muted flex items-center gap-1.5">
      <UIcon
        name="i-lucide-info"
        class="size-3.5 text-primary shrink-0"
      />
      Уроки создаются автоматически при создании группы с расписанием. Здесь можно добавить разовый урок или отменить существующий.
    </p>

    <!-- Legend: groups in the week view, teachers in the day view -->
    <div
      v-if="!pending && viewMode === 'week' && groupOptions.length > 1"
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
    <div
      v-else-if="!pending && viewMode === 'day' && dayTeachers.length"
      class="flex items-center justify-center gap-x-4 gap-y-1.5 flex-wrap"
    >
      <div
        v-for="t in dayTeachers"
        :key="t.id"
        class="flex items-center gap-1.5 text-xs"
      >
        <span
          class="size-2.5 rounded-sm"
          :class="teacherPalette(t.id).dot"
        />
        <span class="text-muted">{{ t.name }}</span>
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

    <!-- ── Week view: rows = times, columns = weekdays ───────────────────────── -->
    <div
      v-else-if="viewMode === 'week'"
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
              <p class="text-xs font-semibold leading-tight truncate flex items-center gap-1">
                <UIcon
                  v-if="lesson.type !== 'GROUP'"
                  :name="LESSON_TYPE_MAP[lesson.type].icon"
                  class="size-3 shrink-0"
                  :title="LESSON_TYPE_MAP[lesson.type].label"
                />
                <span class="truncate">{{ lesson.groupName }}</span>
              </p>
              <p class="text-[10px] text-muted truncate">
                {{ lesson.teacherName.split(' ')[0] }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Day view: rows = times, columns = teachers (AlfaCRM layout) ───────── -->
    <div
      v-else
      class="overflow-x-auto rounded-2xl border border-default"
    >
      <!-- Nobody teaches on this day -->
      <div
        v-if="!dayTeachers.length"
        class="py-16 text-center text-sm text-muted"
      >
        <UIcon
          name="i-lucide-calendar-x"
          class="size-8 mx-auto mb-2 opacity-30"
        />
        В этот день уроков нет
      </div>

      <div
        v-else
        :style="{ minWidth: `${68 + dayTeachers.length * 150}px` }"
      >
        <!-- Header: corner + one column per teacher -->
        <div
          class="grid border-b border-default bg-elevated/50"
          :style="{ gridTemplateColumns: `68px repeat(${dayTeachers.length}, minmax(150px, 1fr))` }"
        >
          <div class="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted flex items-end">
            Время
          </div>
          <div
            v-for="t in dayTeachers"
            :key="t.id"
            class="border-l border-default px-2 py-2"
          >
            <div class="flex items-center gap-2">
              <span
                class="h-6 w-1 shrink-0 rounded-full"
                :class="teacherPalette(t.id).bar"
              />
              <UAvatar
                :src="t.avatar ?? undefined"
                :alt="t.name"
                size="2xs"
              />
              <span class="truncate text-xs font-semibold">{{ t.name }}</span>
            </div>
          </div>
        </div>

        <!-- Time rows -->
        <div
          v-for="time in timeRows"
          :key="time"
          class="grid border-b border-default last:border-0"
          :style="{ gridTemplateColumns: `68px repeat(${dayTeachers.length}, minmax(150px, 1fr))` }"
        >
          <div class="px-2 py-2 text-xs font-mono font-semibold text-muted flex items-start">
            {{ time }}
          </div>
          <div
            v-for="t in dayTeachers"
            :key="`${time}-${t.id}`"
            class="border-l border-default p-1 space-y-1 min-h-16"
            :class="teacherPalette(t.id).tint"
          >
            <button
              v-for="lesson in lessonAtTeacher(t.id, time)"
              :key="lesson.id"
              type="button"
              class="w-full text-left rounded-lg border bg-default px-2 py-1.5 transition-colors cursor-pointer"
              :class="lesson.status === 'CANCELLED'
                ? 'border-red-300/50 opacity-60 line-through'
                : 'border-default hover:border-primary/60'"
              @click="openLesson(lesson)"
            >
              <p class="text-[11px] font-mono text-muted leading-tight">
                {{ lesson.time }} – {{ endTime(lesson) }}
              </p>
              <p class="text-xs font-semibold leading-tight truncate flex items-center gap-1">
                <UIcon
                  :name="LESSON_TYPE_MAP[lesson.type].icon"
                  class="size-3 shrink-0"
                  :title="LESSON_TYPE_MAP[lesson.type].label"
                />
                <span class="truncate">{{ lesson.groupName }}</span>
              </p>
              <p
                v-if="groupSize.get(lesson.groupId)"
                class="text-[10px] text-muted"
              >
                {{ groupSize.get(lesson.groupId)!.count }} / {{ groupSize.get(lesson.groupId)!.max }}
                <span
                  v-if="lesson.groupLevel"
                  class="ml-1"
                >· {{ lesson.groupLevel }}</span>
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

          <UFormField label="Тип занятия">
            <USelect
              v-model="addForm.type"
              :items="LESSON_TYPE_OPTIONS"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="isGroupType"
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
          <UFormField
            v-else
            label="Учитель"
            required
          >
            <USelect
              v-model="addForm.teacherId"
              :items="teacherItems"
              placeholder="Выберите учителя..."
              class="w-full"
            />
          </UFormField>

          <template v-if="allowsChildren">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">Дети на этот слот</label>
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-plus"
                  @click="addChildRow"
                >
                  Ещё ребёнок
                </UButton>
              </div>
              <p class="text-xs text-muted -mt-2">
                Можно закрепить нескольких детей за одним слотом (групповой пробный, совместная отработка) — свяжем каждого с CRM
              </p>

              <div
                v-for="(child, i) in addForm.children"
                :key="child.uid"
                class="rounded-lg border border-subtle p-3 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted">Ребёнок {{ i + 1 }}</span>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-lucide-x"
                    @click="removeChildRow(child.uid)"
                  />
                </div>
                <USelect
                  v-model="child.leadId"
                  :items="leadOptions"
                  placeholder="Выберите или заведите нового..."
                  class="w-full"
                />
                <div
                  v-if="child.leadId === NEW_LEAD_VALUE"
                  class="grid grid-cols-2 gap-3"
                >
                  <UFormField
                    label="Имя ребёнка"
                    required
                  >
                    <UInput
                      v-model="child.newLeadName"
                      placeholder="Например: Айгерим"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Телефон родителя">
                    <UInput
                      v-model="child.newLeadPhone"
                      placeholder="Необязательно"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>
            </div>
          </template>

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
                  v-if="selectedLesson.groupLevel"
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
                <UBadge
                  :color="LESSON_TYPE_MAP[selectedLesson.type].color"
                  variant="subtle"
                  size="xs"
                  :icon="LESSON_TYPE_MAP[selectedLesson.type].icon"
                >
                  {{ LESSON_TYPE_MAP[selectedLesson.type].label }}
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
