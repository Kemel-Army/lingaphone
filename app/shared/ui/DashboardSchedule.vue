<script setup lang="ts">
/**
 * DashboardSchedule — Schedule widget for dashboards (day/week view).
 */
interface ScheduleLesson {
  id: string
  startTime: string
  endTime?: string
  subjectName: string
  personName: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  lessonId?: string
}

interface Props {
  lessons: ScheduleLesson[]
  view?: 'day' | 'week'
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  view: 'day',
  loading: false
})

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const statusConfig: Record<string, { label: string, color: string }> = {
  SCHEDULED: { label: 'Запланирован', color: 'info' },
  IN_PROGRESS: { label: 'Идёт', color: 'success' },
  COMPLETED: { label: 'Завершён', color: 'neutral' },
  CANCELLED: { label: 'Отменён', color: 'error' }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-title">
          {{ view === 'day' ? 'Расписание на сегодня' : 'Расписание на неделю' }}
        </h3>
        <UBadge
          v-if="lessons.length"
          :label="`${lessons.length}`"
          color="primary"
          variant="soft"
        />
      </div>
    </template>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="skeleton h-16 w-full"
      />
    </div>

    <!-- Lessons list -->
    <ul
      v-else-if="lessons.length"
      class="divide-y divide-(--color-border-muted)"
    >
      <li
        v-for="lesson in lessons"
        :key="lesson.id"
        class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
      >
        <!-- Time -->
        <div class="w-14 shrink-0 text-center">
          <p class="text-sm font-semibold text-(--color-text-primary)">
            {{ formatTime(lesson.startTime) }}
          </p>
          <p
            v-if="lesson.endTime"
            class="text-caption"
          >
            {{ formatTime(lesson.endTime) }}
          </p>
        </div>

        <!-- Divider dot -->
        <div class="flex flex-col items-center gap-1">
          <div class="size-2.5 rounded-full bg-primary" />
        </div>

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-(--color-text-primary)">
            {{ lesson.subjectName }}
          </p>
          <p class="truncate text-caption">
            {{ lesson.personName }}
          </p>
        </div>

        <!-- Status + action -->
        <div class="flex shrink-0 items-center gap-2">
          <UBadge
            :label="statusConfig[lesson.status]?.label ?? lesson.status"
            :color="(statusConfig[lesson.status]?.color ?? 'neutral') as any"
            variant="soft"
            size="xs"
          />
          <UButton
            v-if="lesson.status === 'SCHEDULED' || lesson.status === 'IN_PROGRESS'"
            :to="lesson.lessonId ? `/lesson/${lesson.lessonId}` : undefined"
            label="Войти"
            size="xs"
            variant="soft"
          />
        </div>
      </li>
    </ul>

    <!-- Empty -->
    <EmptyState
      v-else
      icon="i-lucide-calendar-off"
      title="Нет занятий"
      description="На сегодня уроков нет"
    />
  </UCard>
</template>
