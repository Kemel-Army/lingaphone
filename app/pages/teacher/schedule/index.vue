<script setup lang="ts">
import { useTeacher, type TeacherLesson } from '~/entities/teacher'
import type { GridLesson } from '~/shared/ui/WeekScheduleGrid.vue'

definePageMeta({ layout: 'dashboard' })

const { fetchMyLessons } = useTeacher()
const { data: lessons, pending } = await useAsyncData('teacher-schedule', () => fetchMyLessons())

const today = new Date()
today.setHours(0, 0, 0, 0)
const router = useRouter()

// Lessons mapped to the grid shape.
const gridLessons = computed<GridLesson[]>(() =>
  (lessons.value ?? []).map(l => ({
    id: l.id,
    startsAt: l.startsAt,
    durationMin: l.durationMin,
    topic: l.topic,
    status: l.status,
    groupId: l.groupId,
    groupName: l.groupName
  }))
)

// ── Detail / navigation ───────────────────────────────────────
const detailLesson = ref<TeacherLesson | null>(null)

const onSelect = (g: GridLesson) => {
  const lesson = (lessons.value ?? []).find(l => l.id === g.id)
  if (!lesson) return
  // Past lessons → grade journal; upcoming → detail modal.
  if (new Date(lesson.startsAt) < today) {
    router.push(`/teacher/grades?lessonId=${lesson.id}`)
  } else {
    detailLesson.value = lesson
  }
}

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' })

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    COMPLETED: 'success', IN_PROGRESS: 'warning', SCHEDULED: 'info', CANCELLED: 'error'
  }
  return map[status] ?? 'neutral'
}
const statusLabel: Record<string, string> = {
  COMPLETED: 'Завершён', IN_PROGRESS: 'Идёт', SCHEDULED: 'Запланирован', CANCELLED: 'Отменён'
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <!-- Header -->
    <div>
      <p class="text-xs font-bold text-blue-500 uppercase tracking-wider">
        Личный календарь
      </p>
      <h1 class="text-2xl font-black tracking-tight mt-0.5">
        Расписание
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Уроки твоих групп · время по Алматы
      </p>
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

    <WeekScheduleGrid
      v-else
      :lessons="gridLessons"
      @select="onSelect"
    />

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
                {{ detailLesson.topic || 'Урок' }}
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
