<script setup lang="ts">
import { useTeacher, type TeacherGroup } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const { fetchMyGroups } = useTeacher()
const { data: groups, pending } = await useAsyncData('teacher-groups-list', fetchMyGroups)

const WEEKDAY_RU: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
}

const formatSchedule = (schedule: unknown): string => {
  if (!schedule) return '—'
  if (Array.isArray(schedule) && schedule.length > 0) {
    const first = schedule[0] as { weekday?: number, startTime?: string, durationMin?: number }
    const days = schedule
      .map((s: { weekday?: number }) => s.weekday ? (WEEKDAY_RU[s.weekday] ?? `#${s.weekday}`) : '?')
      .join(', ')
    const time = first.startTime ?? ''
    const dur = first.durationMin ? ` · ${first.durationMin} мин` : ''
    return time ? `${days} · ${time}${dur}` : days
  }
  if (typeof schedule === 'object' && schedule !== null) {
    const s = schedule as Record<string, unknown>
    const days = Array.isArray(s.days) ? (s.days as string[]).join(', ') : ''
    const time = s.time as string ?? ''
    if (days && time) return `${days} · ${time}`
    if (days) return days
  }
  return '—'
}

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500',
    A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500',
    S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500',
    F2: 'from-rose-400 to-pink-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

const fillPct = (g: TeacherGroup) =>
  g.maxStudents > 0 ? Math.round(g.studentCount / g.maxStudents * 100) : 0
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Мои группы
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ groups?.length ?? 0 }} {{ groups?.length === 1 ? 'группа' : 'групп' }}
        </p>
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

    <!-- Empty -->
    <div
      v-else-if="!groups?.length"
      class="rounded-3xl border-2 border-dashed border-default p-16 text-center"
    >
      <UIcon
        name="i-lucide-layers"
        class="size-12 text-muted mx-auto"
      />
      <p class="mt-3 font-bold text-lg">
        Групп пока нет
      </p>
      <p class="text-sm text-muted mt-1">
        Обратитесь к администратору для создания группы
      </p>
    </div>

    <!-- Grid -->
    <div
      v-else
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="g in (groups as TeacherGroup[])"
        :key="g.id"
        :to="`/teacher/groups/${g.id}`"
        class="block group"
      >
        <div class="rounded-2xl border border-default bg-default overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full">
          <!-- Color header -->
          <div
            class="h-24 bg-linear-to-br p-4 text-white relative overflow-hidden"
            :class="levelGradient(g.level)"
          >
            <div class="absolute -bottom-4 -right-4 size-20 rounded-full bg-white/15" />
            <div class="absolute -top-2 -left-2 size-12 rounded-full bg-white/10" />
            <p class="text-xs font-bold uppercase tracking-wider opacity-80 relative z-10">
              Уровень
            </p>
            <p class="text-3xl font-black relative z-10">
              {{ g.level }}
            </p>
          </div>

          <!-- Body -->
          <div class="p-4 space-y-3">
            <h3 class="font-bold text-base leading-tight">
              {{ g.name }}
            </h3>

            <div class="space-y-2 text-sm text-muted">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-users"
                  class="size-3.5 shrink-0"
                />
                <span>{{ g.studentCount }} / {{ g.maxStudents }} учеников</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-clock"
                  class="size-3.5 shrink-0"
                />
                <span class="truncate">{{ formatSchedule(g.schedule) }}</span>
              </div>
            </div>

            <!-- Fill bar -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-muted">
                <span>Заполненность</span>
                <span class="font-medium">{{ fillPct(g) }}%</span>
              </div>
              <UProgress
                :model-value="fillPct(g)"
                size="xs"
                :color="fillPct(g) >= 90 ? 'error' : fillPct(g) >= 60 ? 'warning' : 'primary'"
              />
            </div>

            <div class="flex items-center justify-between pt-1">
              <UButton
                :to="`/teacher/homework/create?groupId=${g.id}`"
                size="xs"
                variant="outline"
                icon="i-lucide-plus"
                @click.prevent.stop="$router.push(`/teacher/homework/create?groupId=${g.id}`)"
              >
                ДЗ
              </UButton>
              <div class="flex items-center gap-1 text-xs text-muted">
                <span>Открыть</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5 group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
