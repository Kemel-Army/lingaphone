<script setup lang="ts">
import { useAdminStats, type AdminGroup } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const {
  fetchGroups, fetchStudents, fetchTeachers,
  fetchOccupiedStudentIds, setGroupArchived, deleteGroup
} = useAdminStats()

const { data: groups, pending, refresh } = await useAsyncData('admin-groups', fetchGroups)
const { data: students } = await useAsyncData('admin-groups-students', fetchStudents)
const { data: teachers } = await useAsyncData('admin-groups-teachers', fetchTeachers)
const { data: occupiedIds, refresh: refreshOccupied } = await useAsyncData(
  'admin-groups-occupied',
  fetchOccupiedStudentIds,
  { default: () => new Set<string>() }
)

const search = ref('')
const showArchived = ref(false)

const filtered = computed((): AdminGroup[] => {
  if (!groups.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return groups.value
  return groups.value.filter(g =>
    `${g.name} ${g.teacherName} ${g.level}`.toLowerCase().includes(q)
  )
})

const activeGroups = computed(() => filtered.value.filter(g => !g.archivedAt))
const archivedGroups = computed(() => filtered.value.filter(g => g.archivedAt))
const visibleGroups = computed(() =>
  showArchived.value ? [...activeGroups.value, ...archivedGroups.value] : activeGroups.value
)

// ─── Archive / delete ───────────────────────────────────────────────────────

const busyGroupId = ref<string | null>(null)

const archiveGroup = async (g: AdminGroup) => {
  busyGroupId.value = g.id
  try {
    await setGroupArchived(g.id, true)
    toast.add({ title: `Группа «${g.name}» в архиве`, color: 'success', icon: 'i-lucide-archive' })
    await Promise.all([refresh(), refreshOccupied()])
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    busyGroupId.value = null
  }
}

const unarchiveGroup = async (g: AdminGroup) => {
  busyGroupId.value = g.id
  try {
    await setGroupArchived(g.id, false)
    toast.add({ title: `Группа «${g.name}» восстановлена`, color: 'success', icon: 'i-lucide-archive-restore' })
    await Promise.all([refresh(), refreshOccupied()])
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    busyGroupId.value = null
  }
}

const showDeleteModal = ref(false)
const groupToDelete = ref<AdminGroup | null>(null)
const deleting = ref(false)

const removeGroup = (g: AdminGroup) => {
  groupToDelete.value = g
  showDeleteModal.value = true
}

const confirmDeleteGroup = async () => {
  const g = groupToDelete.value
  if (!g) return
  deleting.value = true
  try {
    await deleteGroup(g.id)
    toast.add({ title: `Группа «${g.name}» удалена`, color: 'success', icon: 'i-lucide-trash-2' })
    showDeleteModal.value = false
    groupToDelete.value = null
    await Promise.all([refresh(), refreshOccupied()])
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Не удалось удалить', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    deleting.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BadgeColor = 'info' | 'warning' | 'success' | 'error' | 'neutral'
const levelColor = (level: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const occupancyColor = (count: number, max: number) => {
  if (max === 0) return 'bg-muted/30'
  const pct = count / max
  if (pct >= 1) return 'bg-red-500'
  if (pct >= 0.75) return 'bg-amber-500'
  return 'bg-green-500'
}

const WD_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const formatSchedule = (schedule: Record<string, unknown>): string => {
  if (!schedule) return 'Нет расписания'

  // Current shape: per-day slots.
  const slots = schedule.slots as { weekday: number, time: string }[] | undefined
  if (Array.isArray(slots) && slots.length) {
    const sorted = [...slots].sort((a, b) => a.weekday - b.weekday)
    const times = new Set(sorted.map(s => s.time))
    if (times.size === 1) {
      return `${sorted.map(s => WD_LABELS[s.weekday]).join(', ')} ${sorted[0]!.time}`.trim()
    }
    return sorted.map(s => `${WD_LABELS[s.weekday]} ${s.time}`).join(', ')
  }

  // Legacy shape: shared time across days.
  if (!schedule.days) return 'Нет расписания'
  const raw = schedule.days as (string | { label?: string, value?: string })[]
  const days = raw.map(d => (typeof d === 'object' ? (d.value ?? d.label ?? '') : d)).filter(Boolean)
  if (!days.length) return 'Нет расписания'
  const time = (schedule.time as string) ?? ''
  return `${days.join(', ')} ${time}`.trim()
}

// ─── Create modal ─────────────────────────────────────────────────────────────

const showCreate = ref(false)
const creating = ref(false)

const levelOptions = [
  { label: 'A1 — Начальный', value: 'A1' },
  { label: 'A2 — Элементарный', value: 'A2' },
  { label: 'S1', value: 'S1' },
  { label: 'S2', value: 'S2' },
  { label: 'B2 — Средний', value: 'B2' },
  { label: 'F1', value: 'F1' },
  { label: 'F2', value: 'F2' },
  { label: 'F3', value: 'F3' },
  { label: 'F4', value: 'F4' }
]

const dayOptions = [
  { label: 'Пн', value: 'Пн' }, { label: 'Вт', value: 'Вт' },
  { label: 'Ср', value: 'Ср' }, { label: 'Чт', value: 'Чт' },
  { label: 'Пт', value: 'Пт' }, { label: 'Сб', value: 'Сб' },
  { label: 'Вс', value: 'Вс' }
]

const form = reactive({
  name: '',
  level: 'A1',
  teacherId: '',
  maxStudents: 12,
  selectedStudentIds: [] as string[],
  scheduleMode: 'single' as 'single' | 'perday',
  scheduleDays: [] as string[],
  scheduleTime: '',
  scheduleDuration: 60,
  dayTimes: {} as Record<string, string>
})

const resetForm = () => {
  form.name = ''
  form.level = 'A1'
  form.teacherId = ''
  form.maxStudents = 12
  form.selectedStudentIds = []
  form.scheduleMode = 'single'
  form.scheduleDays = []
  form.scheduleTime = ''
  form.scheduleDuration = 60
  form.dayTimes = {}
}

const RU_WEEKDAY: Record<string, number> = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 }

// Days kept in calendar order regardless of pick order.
const orderedScheduleDays = computed(() =>
  [...form.scheduleDays].sort((a, b) => (RU_WEEKDAY[a] ?? 0) - (RU_WEEKDAY[b] ?? 0))
)

// Build the slot list sent to the API: one entry per day with its own time.
const buildScheduleSlots = () => {
  return orderedScheduleDays.value
    .map((d) => {
      const time = form.scheduleMode === 'perday'
        ? (form.dayTimes[d] || form.scheduleTime)
        : form.scheduleTime
      if (!time) return null
      return { weekday: RU_WEEKDAY[d] ?? 0, time, durationMin: form.scheduleDuration || 60 }
    })
    .filter((s): s is { weekday: number, time: string, durationMin: number } => !!s)
}

const schedulePreview = computed(() => {
  const slots = buildScheduleSlots()
  if (!slots.length) return ''
  const labelByNum = Object.fromEntries(Object.entries(RU_WEEKDAY).map(([k, v]) => [v, k]))
  return slots.map(s => `${labelByNum[s.weekday]} в ${s.time}`).join(', ')
})

const teacherOptions = computed(() =>
  (teachers.value ?? []).map(t => ({
    label: `${t.surname} ${t.name}`,
    value: t.id
  }))
)

const studentSearchQ = ref('')
const studentOptions = computed(() => {
  const q = studentSearchQ.value.toLowerCase()
  return (students.value ?? [])
    // Only students not already in an active group can be added.
    .filter(s => !occupiedIds.value.has(s.id))
    .filter(s => !q || `${s.surname} ${s.name} ${s.level}`.toLowerCase().includes(q))
    .map(s => ({
      label: `${s.surname} ${s.name} — ${s.level}`,
      value: s.id
    }))
})

const selectedStudentsDisplay = computed(() =>
  (students.value ?? [])
    .filter(s => form.selectedStudentIds.includes(s.id))
    .map(s => `${s.surname} ${s.name}`)
    .join(', ')
)

const canCreate = computed(() => form.name.trim() && form.teacherId)

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    await $fetch('/api/admin/groups', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        level: form.level,
        teacherId: form.teacherId,
        maxStudents: form.maxStudents,
        studentIds: form.selectedStudentIds,
        schedule: { slots: buildScheduleSlots() }
      }
    })
    toast.add({ title: 'Группа создана', color: 'success', icon: 'i-lucide-check' })
    showCreate.value = false
    resetForm()
    await Promise.all([refresh(), refreshOccupied()])
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Группы
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ activeGroups.length }} активных групп<span v-if="archivedGroups.length"> · {{ archivedGroups.length }} в архиве</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск по названию или учителю..."
          class="w-64"
        />
        <UButton
          v-if="archivedGroups.length"
          :icon="showArchived ? 'i-lucide-eye-off' : 'i-lucide-archive'"
          variant="ghost"
          color="neutral"
          @click="showArchived = !showArchived"
        >
          {{ showArchived ? 'Скрыть архив' : `Архив (${archivedGroups.length})` }}
        </UButton>
        <UButton
          icon="i-lucide-plus"
          @click="showCreate = true"
        >
          Создать группу
        </UButton>
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

    <!-- Card Grid -->
    <div
      v-else-if="visibleGroups.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="g in visibleGroups"
        :key="g.id"
        class="transition-all"
        :class="g.archivedAt ? 'opacity-60 ring-1 ring-amber-300/40' : 'hover:ring-1 hover:ring-primary/20'"
      >
        <!-- Card header -->
        <template #header>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="font-bold text-base truncate">
                {{ g.name }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <UBadge
                  :color="levelColor(g.level)"
                  variant="subtle"
                  size="xs"
                >
                  {{ g.level }}
                </UBadge>
                <UBadge
                  v-if="g.archivedAt"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-archive"
                >
                  В архиве
                </UBadge>
              </div>
            </div>
            <!-- Occupancy ring -->
            <div class="shrink-0 text-right">
              <p class="text-2xl font-black tabular-nums leading-none">
                {{ g.studentCount }}
                <span class="text-sm font-normal text-muted">/ {{ g.maxStudents }}</span>
              </p>
              <p class="text-xs text-muted mt-0.5">
                учеников
              </p>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="mt-3 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="occupancyColor(g.studentCount, g.maxStudents)"
              :style="{ width: `${g.maxStudents > 0 ? Math.min(100, Math.round(g.studentCount / g.maxStudents * 100)) : 0}%` }"
            />
          </div>
        </template>

        <!-- Card body -->
        <div class="space-y-2.5 text-sm">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-user"
              class="size-4 text-muted shrink-0"
            />
            <span class="text-muted">Учитель:</span>
            <span class="font-medium truncate">{{ g.teacherName }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-clock"
              class="size-4 text-muted shrink-0"
            />
            <span class="text-muted">Расписание:</span>
            <span class="truncate">{{ formatSchedule(g.schedule) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-calendar"
              class="size-4 text-muted shrink-0"
            />
            <span class="text-muted">Создана:</span>
            <span>{{ new Date(g.createdAt).toLocaleDateString('ru-RU') }}</span>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-0.5">
              <UButton
                v-if="!g.archivedAt"
                icon="i-lucide-archive"
                variant="ghost"
                size="sm"
                color="warning"
                title="В архив"
                :loading="busyGroupId === g.id"
                @click="archiveGroup(g)"
              />
              <UButton
                v-else
                icon="i-lucide-archive-restore"
                variant="ghost"
                size="sm"
                color="success"
                title="Восстановить"
                :loading="busyGroupId === g.id"
                @click="unarchiveGroup(g)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                size="sm"
                color="error"
                title="Удалить навсегда"
                :loading="busyGroupId === g.id"
                @click="removeGroup(g)"
              />
            </div>
            <UButton
              :to="`/admin/groups/${g.id}`"
              variant="ghost"
              size="sm"
              icon="i-lucide-arrow-right"
              trailing
            >
              Подробнее
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-muted"
    >
      <UIcon
        name="i-lucide-layout-grid"
        class="size-10 opacity-30 mb-3"
      />
      <p class="text-sm">
        {{ search ? 'Группы не найдены' : 'Групп пока нет' }}
      </p>
      <UButton
        v-if="!search"
        class="mt-3"
        size="sm"
        icon="i-lucide-plus"
        @click="showCreate = true"
      >
        Создать первую группу
      </UButton>
    </div>

    <!-- ─── Create Group Modal ──────────────────────────────────────────────── -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #content>
        <div class="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <!-- Modal header -->
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Новая группа
              </h2>
              <p class="text-sm text-muted mt-0.5">
                Заполните данные для создания учебной группы
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showCreate = false"
            />
          </div>

          <USeparator />

          <!-- Основные данные -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Основные данные
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Название группы"
                required
                class="col-span-2"
              >
                <UInput
                  v-model="form.name"
                  placeholder="A2-Elementary-Morning"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Уровень курса"
                required
              >
                <USelect
                  v-model="form.level"
                  :items="levelOptions"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Макс. учеников">
                <UInput
                  v-model.number="form.maxStudents"
                  type="number"
                  :min="1"
                  :max="30"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Учитель -->
          <UFormField
            label="Ответственный учитель"
            required
          >
            <USelect
              v-model="form.teacherId"
              :items="teacherOptions"
              placeholder="Выберите учителя..."
              class="w-full"
            />
          </UFormField>

          <!-- Расписание -->
          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Расписание (необязательно)
            </p>

            <UFormField label="Дни недели">
              <USelectMenu
                v-model="form.scheduleDays"
                :items="dayOptions"
                multiple
                value-key="value"
                placeholder="Выберите дни..."
                class="w-full"
              />
            </UFormField>

            <!-- Mode toggle -->
            <div
              v-if="form.scheduleDays.length"
              class="flex rounded-lg border border-subtle overflow-hidden w-fit"
            >
              <button
                type="button"
                class="px-3 py-1.5 text-sm font-medium transition-colors"
                :class="form.scheduleMode === 'single' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/20'"
                @click="form.scheduleMode = 'single'"
              >
                Единое время
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm font-medium transition-colors"
                :class="form.scheduleMode === 'perday' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/20'"
                @click="form.scheduleMode = 'perday'"
              >
                Разное время
              </button>
            </div>

            <!-- Single time -->
            <div
              v-if="form.scheduleMode === 'single'"
              class="grid grid-cols-2 gap-3"
            >
              <UFormField label="Время">
                <UInput
                  v-model="form.scheduleTime"
                  type="time"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Длительность (мин)">
                <UInput
                  v-model.number="form.scheduleDuration"
                  type="number"
                  :min="15"
                  :max="240"
                  :step="15"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Per-day times -->
            <div
              v-else
              class="space-y-2"
            >
              <div
                v-for="d in orderedScheduleDays"
                :key="d"
                class="flex items-center gap-3"
              >
                <span class="w-10 text-sm font-semibold shrink-0">{{ d }}</span>
                <UInput
                  v-model="form.dayTimes[d]"
                  type="time"
                  class="flex-1"
                />
              </div>
              <UFormField label="Длительность (мин)">
                <UInput
                  v-model.number="form.scheduleDuration"
                  type="number"
                  :min="15"
                  :max="240"
                  :step="15"
                  class="w-full"
                />
              </UFormField>
            </div>

            <p
              v-if="schedulePreview"
              class="text-xs text-muted flex items-start gap-1.5 pt-1"
            >
              <UIcon
                name="i-lucide-calendar-check"
                class="size-3.5 text-primary shrink-0 mt-0.5"
              />
              <span>Уроки на 12 недель вперёд создадутся автоматически: {{ schedulePreview }}</span>
            </p>
          </div>

          <!-- Ученики -->
          <div class="space-y-2">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Добавить учеников (необязательно)
            </p>
            <UInput
              v-model="studentSearchQ"
              icon="i-lucide-search"
              placeholder="Поиск ученика по ФИО или уровню..."
              class="w-full"
            />
            <div
              v-if="form.selectedStudentIds.length"
              class="text-xs text-muted px-1"
            >
              Выбрано: {{ form.selectedStudentIds.length }} — {{ selectedStudentsDisplay.slice(0, 80) }}{{ selectedStudentsDisplay.length > 80 ? '...' : '' }}
            </div>
            <div class="max-h-48 overflow-y-auto border border-subtle rounded-lg divide-y divide-subtle">
              <label
                v-for="opt in studentOptions"
                :key="opt.value"
                class="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer text-sm"
              >
                <input
                  v-model="form.selectedStudentIds"
                  type="checkbox"
                  :value="opt.value"
                  class="rounded"
                >
                <span>{{ opt.label }}</span>
              </label>
              <div
                v-if="!studentOptions.length"
                class="px-3 py-4 text-center text-muted text-sm"
              >
                Ученики не найдены
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showCreate = false; resetForm()"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canCreate || creating"
              :loading="creating"
              icon="i-lucide-plus"
              @click="submitCreate"
            >
              Создать группу
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ─── Delete Group Confirm ────────────────────────────────────────────── -->
    <UModal
      v-model:open="showDeleteModal"
      :ui="{ content: 'max-w-md' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="size-10 shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <UIcon
                name="i-lucide-trash-2"
                class="size-5 text-red-600 dark:text-red-400"
              />
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-bold leading-tight">
                Удалить группу?
              </h2>
              <p class="text-sm text-muted mt-0.5 truncate">
                «{{ groupToDelete?.name }}»
              </p>
            </div>
          </div>

          <div class="rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/50 p-3 text-sm space-y-2">
            <p class="font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
              <UIcon
                name="i-lucide-alert-triangle"
                class="size-4 shrink-0"
              />
              Все данные группы будут потеряны
            </p>
            <ul class="text-xs text-red-700/80 dark:text-red-300/80 space-y-0.5 pl-5 list-disc">
              <li>уроки, посещаемость, оценки</li>
              <li>домашние задания и расписание</li>
              <li>переписка группы</li>
            </ul>
          </div>

          <div class="rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50 p-3 text-sm flex items-start gap-2">
            <UIcon
              name="i-lucide-users"
              class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            />
            <p class="text-emerald-700 dark:text-emerald-300">
              <span class="font-semibold">Ученики не удаляются</span> — их просто исключат из группы, и они станут свободными для зачисления в другую.
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="deleting"
              @click="showDeleteModal = false"
            >
              Отмена
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              :loading="deleting"
              @click="confirmDeleteGroup"
            >
              Удалить навсегда
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
