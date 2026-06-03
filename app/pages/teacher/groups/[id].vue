<script setup lang="ts">
import { useTeacher, type TeacherStudent } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const groupId = route.params.id as string

const { fetchGroupById } = useTeacher()

const { data, pending, error } = await useAsyncData(
  `teacher-group-${groupId}`,
  () => fetchGroupById(groupId)
)

const group = computed(() => data.value?.group ?? null)
const members = computed(() => data.value?.members ?? [])
const lessons = computed(() => data.value?.lessons ?? [])

const levelColor = (level: string): 'info' | 'warning' | 'success' | 'error' | 'neutral' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'neutral' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'warning',
    SCHEDULED: 'info',
    CANCELLED: 'error'
  }
  return map[status] ?? 'neutral'
}

const statusLabel: Record<string, string> = {
  COMPLETED: 'Завершён',
  IN_PROGRESS: 'Идёт',
  SCHEDULED: 'Запланирован',
  CANCELLED: 'Отменён'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

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
    const dur = first.durationMin ? ` (${first.durationMin} мин)` : ''
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
</script>

<template>
  <div class="p-6 space-y-6 max-w-5xl mx-auto">
    <div class="flex items-center gap-2">
      <UButton
        to="/teacher/groups"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      />
      <h1 class="text-2xl font-bold">
        {{ group?.name ?? 'Группа' }}
      </h1>
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

    <UAlert
      v-else-if="error || !group"
      color="error"
      icon="i-lucide-alert-circle"
      title="Группа не найдена"
    />

    <template v-else>
      <!-- Group header -->
      <UCard>
        <div class="flex flex-wrap gap-6 items-center">
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">
              Уровень
            </p>
            <UBadge
              :color="levelColor(group.level)"
              variant="subtle"
              size="lg"
            >
              {{ group.level }}
            </UBadge>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">
              Учеников
            </p>
            <p class="font-semibold">
              {{ group.studentCount }} / {{ group.maxStudents }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">
              Расписание
            </p>
            <p class="font-semibold">
              {{ formatSchedule(group.schedule) }}
            </p>
          </div>
          <div class="ml-auto flex gap-2">
            <UButton
              :to="`/teacher/homework/create?groupId=${groupId}`"
              icon="i-lucide-plus"
              size="sm"
            >
              Создать ДЗ
            </UButton>
            <UButton
              :to="`/teacher/grades?groupId=${groupId}`"
              icon="i-lucide-table"
              variant="outline"
              size="sm"
            >
              Журнал
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Members -->
      <UCard :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center gap-2 font-semibold px-4 py-3">
            <UIcon
              name="i-lucide-users"
              class="size-4"
            />
            Ученики группы
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ members.length }}
            </UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="border-b border-subtle">
            <tr class="text-left text-xs text-muted uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">
                Ученик
              </th>
              <th class="px-4 py-3 font-medium">
                Уровень
              </th>
              <th class="px-4 py-3 font-medium">
                XP
              </th>
              <th class="px-4 py-3 font-medium">
                Стрик
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in (members as TeacherStudent[])"
              :key="s.studentId"
              class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <UAvatar
                    :src="s.avatarUrl ?? undefined"
                    :alt="`${s.name} ${s.surname}`"
                    size="sm"
                  />
                  <span class="font-medium">{{ s.name }} {{ s.surname }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="levelColor(s.level)"
                  variant="subtle"
                  size="sm"
                >
                  {{ s.level }}
                </UBadge>
              </td>
              <td class="px-4 py-3 font-mono">
                {{ s.totalXp.toLocaleString() }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-flame"
                    class="size-4 text-orange-400"
                  />
                  {{ s.dailyStreak }}
                </div>
              </td>
              <td class="px-4 py-3">
                <UButton
                  :to="`/teacher/students/${s.studentId}`"
                  icon="i-lucide-eye"
                  variant="ghost"
                  size="sm"
                />
              </td>
            </tr>
            <tr v-if="!members.length">
              <td
                colspan="5"
                class="px-4 py-10 text-center text-muted"
              >
                В группе нет учеников
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <!-- Lessons -->
      <UCard :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center gap-2 font-semibold px-4 py-3">
            <UIcon
              name="i-lucide-calendar"
              class="size-4"
            />
            Занятия
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ lessons.length }}
            </UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="border-b border-subtle">
            <tr class="text-left text-xs text-muted uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">
                Тема
              </th>
              <th class="px-4 py-3 font-medium">
                Дата
              </th>
              <th class="px-4 py-3 font-medium">
                Статус
              </th>
              <th class="px-4 py-3 font-medium">
                Длит.
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="l in lessons"
              :key="l.id"
              class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3 font-medium">
                {{ l.topic }}
              </td>
              <td class="px-4 py-3 text-muted">
                {{ formatDate(l.startsAt) }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="statusColor(l.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ statusLabel[l.status] ?? l.status }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ l.durationMin }} мин
              </td>
            </tr>
            <tr v-if="!lessons.length">
              <td
                colspan="4"
                class="px-4 py-10 text-center text-muted"
              >
                Занятий пока нет
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </template>
  </div>
</template>
