<script setup lang="ts">
import { useTeacher } from '~/entities/teacher'
import { useGradeStudent } from '~/features/grade-student'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()

const { fetchMyGroups, fetchGradesForGroup } = useTeacher()
const { saveGrade } = useGradeStudent()

const { data: groups } = await useAsyncData('teacher-groups-grades', fetchMyGroups)

const selectedGroupId = ref<string | null>((route.query.groupId as string) || null)

const { data: journalData, pending, refresh } = await useAsyncData(
  'teacher-grades-journal',
  () => selectedGroupId.value ? fetchGradesForGroup(selectedGroupId.value) : Promise.resolve(null),
  { watch: [selectedGroupId] }
)

// Keep the selection in sync with the URL query for in-app navigation that
// changes ?groupId= while the page component is reused.
watch(() => route.query.groupId, (g) => {
  const gid = (g as string) || null
  if (gid !== selectedGroupId.value) selectedGroupId.value = gid
})

const lessons = computed(() => journalData.value?.lessons ?? [])
const students = computed(() => journalData.value?.students ?? [])
const gradeMap = computed(() => journalData.value?.gradeMap ?? {})

const groupOptions = computed(() => [
  { value: null, label: 'Выберите группу' },
  ...(groups.value ?? []).map(g => ({ value: g.id, label: g.name }))
])

const selectedGroupName = computed(() =>
  (groups.value ?? []).find(g => g.id === selectedGroupId.value)?.name ?? ''
)

// Editing state
const editing = ref<{ studentId: string, lessonId: string } | null>(null)
const editValue = ref<number | null>(null)
const editComment = ref('')
const saving = ref(false)

const startEdit = (studentId: string, lessonId: string) => {
  const existing = gradeMap.value[studentId]?.[lessonId]
  editing.value = { studentId, lessonId }
  editValue.value = existing?.value ?? null
  editComment.value = existing?.comment ?? ''
}

const cancelEdit = () => {
  editing.value = null
  editValue.value = null
  editComment.value = ''
}

const saveEdit = async () => {
  if (!editing.value || editValue.value === null) return
  saving.value = true
  try {
    await saveGrade(editing.value.lessonId, editing.value.studentId, editValue.value, editComment.value)
    toast.add({ title: 'Оценка сохранена', color: 'success', icon: 'i-lucide-check' })
    cancelEdit()
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка', description: String(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

const gradeColor = (v: number | undefined): 'success' | 'warning' | 'error' | 'neutral' => {
  if (v === undefined) return 'neutral'
  if (v === 5) return 'success'
  if (v >= 4) return 'warning'
  return 'error'
}

const formatLessonDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

const isEditing = (studentId: string, lessonId: string) =>
  editing.value?.studentId === studentId && editing.value?.lessonId === lessonId

const initials = (name: string, surname: string) =>
  `${(surname[0] ?? '')}${(name[0] ?? '')}`.toUpperCase() || '—'

// Per-student average across all graded lessons.
const studentAverage = (studentId: string): string => {
  const row = gradeMap.value[studentId]
  if (!row) return '—'
  const vals = Object.values(row).map(g => g.value)
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

const avgColor = (avg: string): string => {
  if (avg === '—') return 'text-muted'
  const n = Number(avg)
  if (n >= 4.5) return 'text-green-600 dark:text-green-400'
  if (n >= 3.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const totalGrades = computed(() =>
  Object.values(gradeMap.value).reduce((sum, row) => sum + Object.keys(row).length, 0)
)
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-table-2"
            class="size-6 text-primary"
          />
          Журнал оценок
        </h1>
        <p class="text-sm text-muted mt-1">
          Нажмите на ячейку, чтобы выставить или изменить оценку
        </p>
      </div>

      <USelect
        v-model="selectedGroupId"
        :items="groupOptions"
        icon="i-lucide-layers"
        class="min-w-56"
      />
    </div>

    <!-- No group -->
    <div
      v-if="!selectedGroupId"
      class="rounded-2xl border-2 border-dashed border-default py-16 text-center"
    >
      <UIcon
        name="i-lucide-mouse-pointer-click"
        class="size-10 text-muted mx-auto"
      />
      <p class="mt-3 font-semibold">
        Выберите группу
      </p>
      <p class="text-sm text-muted mt-1">
        Чтобы открыть журнал оценок
      </p>
    </div>

    <!-- Loading -->
    <div
      v-else-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!lessons.length || !students.length"
      class="rounded-2xl border-2 border-dashed border-default py-14 text-center"
    >
      <UIcon
        name="i-lucide-inbox"
        class="size-10 text-muted mx-auto"
      />
      <p class="mt-3 font-semibold">
        Нет данных
      </p>
      <p class="text-sm text-muted mt-1">
        {{ !students.length ? 'В группе нет учеников' : 'В группе нет уроков' }}
      </p>
    </div>

    <template v-else>
      <!-- Summary chips + legend -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-xs font-medium">
          <UIcon
            name="i-lucide-users"
            class="size-3.5 text-muted"
          />
          {{ students.length }} учеников
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-xs font-medium">
          <UIcon
            name="i-lucide-calendar"
            class="size-3.5 text-muted"
          />
          {{ lessons.length }} уроков
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-xs font-medium">
          <UIcon
            name="i-lucide-pencil"
            class="size-3.5 text-muted"
          />
          {{ totalGrades }} оценок
        </span>
        <div class="ml-auto flex items-center gap-3 text-xs text-muted">
          <span class="flex items-center gap-1"><span class="size-2.5 rounded-full bg-green-500" /> 5</span>
          <span class="flex items-center gap-1"><span class="size-2.5 rounded-full bg-amber-500" /> 4</span>
          <span class="flex items-center gap-1"><span class="size-2.5 rounded-full bg-red-500" /> ≤3</span>
        </div>
      </div>

      <!-- Journal -->
      <div class="rounded-2xl border border-default bg-default overflow-hidden">
        <div class="overflow-x-auto">
          <table class="text-sm min-w-max w-full border-separate border-spacing-0">
            <thead>
              <tr class="bg-muted/30">
                <th class="sticky left-0 z-20 bg-muted/30 backdrop-blur px-4 py-3 text-left font-semibold min-w-52 border-b border-default">
                  Ученик
                </th>
                <th class="px-3 py-3 text-center font-semibold text-muted min-w-16 border-b border-l border-default">
                  Средний
                </th>
                <th
                  v-for="l in lessons"
                  :key="l.id"
                  class="px-3 py-2 text-center font-medium text-muted min-w-20 border-b border-l border-default"
                >
                  <p class="text-xs font-semibold text-default">
                    {{ formatLessonDate(l.startsAt) }}
                  </p>
                  <p
                    class="text-[11px] font-normal truncate max-w-24 mx-auto"
                    :class="l.topic?.trim() ? '' : 'text-muted/40 italic'"
                    :title="l.topic || 'Без темы'"
                  >
                    {{ l.topic?.trim() ? l.topic : '—' }}
                  </p>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in students"
                :key="s.studentId"
                class="hover:bg-muted/10 transition-colors"
              >
                <!-- Student name (sticky) -->
                <td class="sticky left-0 z-10 bg-default px-4 py-2.5 border-b border-default">
                  <div class="flex items-center gap-2.5">
                    <span class="size-8 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {{ initials(s.name, s.surname) }}
                    </span>
                    <span class="font-medium truncate">{{ s.surname }} {{ s.name }}</span>
                  </div>
                </td>

                <!-- Average -->
                <td class="px-3 py-2.5 text-center border-b border-l border-default">
                  <span
                    class="font-black tabular-nums"
                    :class="avgColor(studentAverage(s.studentId))"
                  >
                    {{ studentAverage(s.studentId) }}
                  </span>
                </td>

                <!-- Grade cells -->
                <td
                  v-for="l in lessons"
                  :key="l.id"
                  class="px-2 py-2 text-center border-b border-l border-default align-middle"
                >
                  <!-- Editing -->
                  <div
                    v-if="isEditing(s.studentId, l.id)"
                    class="space-y-1.5 min-w-32"
                  >
                    <UInput
                      v-model="editValue"
                      type="number"
                      min="1"
                      max="5"
                      placeholder="1–5"
                      class="w-full"
                      size="xs"
                      autofocus
                    />
                    <UInput
                      v-model="editComment"
                      placeholder="Комментарий…"
                      class="w-full"
                      size="xs"
                    />
                    <div class="flex gap-1 justify-center">
                      <UButton
                        size="xs"
                        icon="i-lucide-check"
                        color="success"
                        :loading="saving"
                        @click="saveEdit"
                      />
                      <UButton
                        size="xs"
                        icon="i-lucide-x"
                        variant="ghost"
                        color="neutral"
                        @click="cancelEdit"
                      />
                    </div>
                  </div>

                  <!-- Value / empty -->
                  <button
                    v-else
                    class="group/cell mx-auto flex items-center justify-center size-9 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                    :title="gradeMap[s.studentId]?.[l.id]?.comment || 'Выставить оценку'"
                    @click="startEdit(s.studentId, l.id)"
                  >
                    <UBadge
                      v-if="gradeMap[s.studentId]?.[l.id]"
                      :color="gradeColor(gradeMap[s.studentId]?.[l.id]?.value)"
                      variant="subtle"
                      class="font-bold"
                    >
                      {{ gradeMap[s.studentId]?.[l.id]?.value }}
                    </UBadge>
                    <span
                      v-else
                      class="text-muted/30 group-hover/cell:text-primary text-lg leading-none"
                    >+</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-muted">
        Группа: <span class="font-medium text-default">{{ selectedGroupName }}</span>
      </p>
    </template>
  </div>
</template>
