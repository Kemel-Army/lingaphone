<script setup lang="ts">
import { useTeacher, type TeacherGroup } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const { fetchMyGroups } = useTeacher()
const { data: groups, pending } = await useAsyncData('teacher-groups-list', fetchMyGroups)

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEEKDAY_RU: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
}

const parseDays = (schedule: unknown): string[] => {
  if (!schedule) return []
  if (Array.isArray(schedule)) {
    return schedule
      .map((s: { weekday?: number }) => s.weekday ? (WEEKDAY_RU[s.weekday] ?? '') : '')
      .filter(Boolean)
  }
  if (typeof schedule === 'object' && schedule !== null) {
    const s = schedule as Record<string, unknown>
    const raw = Array.isArray(s.days) ? s.days as (string | { label?: string, value?: string })[] : []
    return raw.map(d => typeof d === 'object' ? (d.value ?? d.label ?? '') : d).filter(Boolean) as string[]
  }
  return []
}

const parseTime = (schedule: unknown): string => {
  if (!schedule) return ''
  if (Array.isArray(schedule) && schedule.length > 0) {
    const first = schedule[0] as { startTime?: string }
    return first.startTime ?? ''
  }
  if (typeof schedule === 'object' && schedule !== null) {
    return ((schedule as Record<string, unknown>).time as string) ?? ''
  }
  return ''
}

const parseDuration = (schedule: unknown): number => {
  if (!schedule || !Array.isArray(schedule) || !schedule.length) return 0
  const first = schedule[0] as { durationMin?: number }
  return first.durationMin ?? 0
}

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500',
    A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500',
    S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500',
    F2: 'from-rose-400 to-pink-500',
    F3: 'from-fuchsia-400 to-purple-500',
    F4: 'from-violet-500 to-purple-700'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

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
  return 'bg-primary'
}

const fillPct = (g: TeacherGroup) =>
  g.maxStudents > 0 ? Math.min(100, Math.round(g.studentCount / g.maxStudents * 100)) : 0

const formatCreated = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

// ── KPI ───────────────────────────────────────────────────────────────────────

const kpi = computed(() => {
  const list = groups.value ?? []
  const totalStudents = list.reduce((a, g) => a + g.studentCount, 0)
  const avgFill = list.length
    ? Math.round(list.reduce((a, g) => a + fillPct(g), 0) / list.length)
    : 0
  const fullGroups = list.filter(g => fillPct(g) >= 100).length
  return { total: list.length, totalStudents, avgFill, fullGroups }
})

// ── Search ────────────────────────────────────────────────────────────────────

const search = ref('')

const filtered = computed((): TeacherGroup[] => {
  if (!groups.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return groups.value
  return groups.value.filter(g =>
    `${g.name} ${g.level}`.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Мои группы
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ groups?.length ?? 0 }} {{ groups?.length === 1 ? 'группа' : 'групп' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск по группе..."
          class="w-56"
        />
        <UButton
          to="/teacher/homework/create"
          icon="i-lucide-plus"
          variant="outline"
        >
          Создать ДЗ
        </UButton>
      </div>
    </div>

    <!-- ── Loading skeleton ───────────────────────────────────────────────── -->
    <div
      v-if="pending"
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-xl border border-default overflow-hidden animate-pulse"
      >
        <div class="h-2 bg-muted/40" />
        <div class="p-4 space-y-3">
          <div class="flex justify-between">
            <div class="h-4 bg-muted/40 rounded w-2/3" />
            <div class="h-8 w-12 bg-muted/30 rounded" />
          </div>
          <div class="h-2 bg-muted/30 rounded" />
          <div class="flex gap-1">
            <div
              v-for="j in 3"
              :key="j"
              class="h-5 w-8 bg-muted/20 rounded-full"
            />
          </div>
          <div class="h-3 bg-muted/20 rounded w-1/2" />
        </div>
      </div>
    </div>

    <template v-else>
      <!-- ── KPI strip ──────────────────────────────────────────────────────── -->
      <div
        v-if="(groups?.length ?? 0) > 0"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <UCard
          v-for="stat in [
            { label: 'Всего групп', value: kpi.total, icon: 'i-lucide-layers', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Учеников', value: kpi.totalStudents, icon: 'i-lucide-users', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Ср. заполнение', value: `${kpi.avgFill}%`, icon: 'i-lucide-bar-chart-2', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Заполнены', value: kpi.fullGroups, icon: 'i-lucide-check-circle', color: 'text-green-500', bg: 'bg-green-500/10' }
          ]"
          :key="stat.label"
        >
          <div class="flex items-center gap-3">
            <div
              class="rounded-xl p-2 shrink-0"
              :class="stat.bg"
            >
              <UIcon
                :name="stat.icon"
                class="size-4"
                :class="stat.color"
              />
            </div>
            <div>
              <p
                class="text-xl font-black tabular-nums leading-none"
                :class="stat.color"
              >
                {{ stat.value }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- ── Empty ──────────────────────────────────────────────────────────── -->
      <div
        v-if="!filtered.length"
        class="flex flex-col items-center justify-center py-20 text-muted"
      >
        <UIcon
          name="i-lucide-layers"
          class="size-10 opacity-30 mb-3"
        />
        <p class="text-sm font-medium">
          {{ search ? 'Группы не найдены' : 'Групп пока нет' }}
        </p>
        <p
          v-if="!search"
          class="text-xs mt-1"
        >
          Обратитесь к администратору для назначения группы
        </p>
      </div>

      <!-- ── Card grid ──────────────────────────────────────────────────────── -->
      <div
        v-else
        class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard
          v-for="g in filtered"
          :key="g.id"
          class="hover:ring-1 hover:ring-primary/20 transition-all group"
        >
          <!-- ── Card header ── -->
          <template #header>
            <!-- Thin gradient band -->
            <div
              class="-mx-4 -mt-4 h-1.5 rounded-t-xl bg-linear-to-r mb-4"
              :class="levelGradient(g.level)"
            />

            <div class="flex items-start justify-between gap-3">
              <!-- Name + level -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge
                    :color="levelColor(g.level)"
                    variant="subtle"
                    size="xs"
                    class="font-bold"
                  >
                    {{ g.level }}
                  </UBadge>
                </div>
                <p class="font-bold text-base leading-tight line-clamp-1">
                  {{ g.name }}
                </p>
              </div>

              <!-- Occupancy number (big) -->
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

            <!-- Occupancy bar -->
            <div class="mt-3 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="occupancyColor(g.studentCount, g.maxStudents)"
                :style="{ width: `${fillPct(g)}%` }"
              />
            </div>
          </template>

          <!-- ── Card body ── -->
          <div class="space-y-3 text-sm">
            <!-- Schedule days as chips -->
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                Расписание
              </p>
              <div
                v-if="parseDays(g.schedule).length"
                class="flex items-center gap-1.5 flex-wrap"
              >
                <span
                  v-for="day in parseDays(g.schedule)"
                  :key="day"
                  class="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 text-xs font-semibold"
                >
                  {{ day }}
                </span>
                <span
                  v-if="parseTime(g.schedule)"
                  class="text-xs text-muted ml-1 font-medium"
                >
                  · {{ parseTime(g.schedule) }}
                  <span
                    v-if="parseDuration(g.schedule)"
                    class="text-muted/70"
                  >
                    ({{ parseDuration(g.schedule) }} мин)
                  </span>
                </span>
              </div>
              <p
                v-else
                class="text-xs text-muted"
              >
                Не указано
              </p>
            </div>

            <!-- Created -->
            <div class="flex items-center gap-2 text-muted">
              <UIcon
                name="i-lucide-calendar-plus"
                class="size-3.5 shrink-0"
              />
              <span class="text-xs">Создана {{ formatCreated(g.createdAt) }}</span>
            </div>
          </div>

          <!-- ── Card footer ── -->
          <template #footer>
            <div class="flex items-center justify-between gap-2">
              <div class="flex gap-1.5">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-plus"
                  @click="$router.push(`/teacher/homework/create?groupId=${g.id}`)"
                >
                  Задание
                </UButton>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-table"
                  @click="$router.push(`/teacher/grades?groupId=${g.id}`)"
                >
                  Журнал
                </UButton>
              </div>
              <UButton
                :to="`/teacher/groups/${g.id}`"
                variant="ghost"
                size="xs"
                icon="i-lucide-arrow-right"
                trailing
              >
                Открыть
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </div>
</template>
