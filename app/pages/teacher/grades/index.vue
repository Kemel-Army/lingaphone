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

const { data: journalData, pending, refresh } = useAsyncData(
  'teacher-grades-journal',
  () => selectedGroupId.value ? fetchGradesForGroup(selectedGroupId.value) : Promise.resolve(null),
  { watch: [selectedGroupId] }
)

const lessons = computed(() => journalData.value?.lessons ?? [])
const students = computed(() => journalData.value?.students ?? [])
const gradeMap = computed(() => journalData.value?.gradeMap ?? {})

const groupOptions = computed(() => [
  { value: null, label: 'Выберите группу' },
  ...(groups.value ?? []).map(g => ({ value: g.id, label: g.name }))
])

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

const gradeColor = (v: number | undefined) => {
  if (v === undefined) return 'neutral'
  if (v === 5) return 'success'
  if (v >= 4) return 'warning'
  return 'error'
}

const formatLessonDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

const isEditing = (studentId: string, lessonId: string) =>
  editing.value?.studentId === studentId && editing.value?.lessonId === lessonId
</script>

<template>
  <div class="p-6 space-y-4 max-w-full mx-auto">
    <div>
      <h1 class="text-2xl font-bold">
        Журнал оценок
      </h1>
      <p class="text-sm text-muted mt-1">
        Нажмите на ячейку для выставления оценки
      </p>
    </div>

    <USelect
      v-model="selectedGroupId"
      :items="groupOptions"
      class="max-w-xs"
    />

    <div
      v-if="!selectedGroupId"
      class="text-center py-16 text-muted"
    >
      Выберите группу для просмотра журнала
    </div>

    <div
      v-else-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="!lessons.length || !students.length"
      class="text-center py-12 text-muted"
    >
      Нет данных для выбранной группы
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <UCard :ui="{ body: 'p-0' }">
        <table class="text-sm min-w-max w-full">
          <thead class="border-b border-subtle bg-muted/20">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-muted sticky left-0 bg-muted/20 z-10 min-w-40">
                Ученик
              </th>
              <th
                v-for="l in lessons"
                :key="l.id"
                class="px-3 py-3 text-center font-medium text-muted min-w-20"
              >
                <p class="text-xs">
                  {{ formatLessonDate(l.startsAt) }}
                </p>
                <p
                  class="text-xs font-normal truncate max-w-20"
                  :title="l.topic"
                >
                  {{ l.topic }}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in students"
              :key="s.studentId"
              class="border-b border-subtle last:border-0"
            >
              <td class="px-4 py-2 sticky left-0 bg-background z-10 font-medium">
                {{ s.surname }} {{ s.name }}
              </td>
              <td
                v-for="l in lessons"
                :key="l.id"
                class="px-2 py-2 text-center"
              >
                <!-- Editing this cell -->
                <div
                  v-if="isEditing(s.studentId, l.id)"
                  class="space-y-1"
                >
                  <UInput
                    v-model="editValue"
                    type="number"
                    min="1"
                    max="5"
                    class="w-16 text-center"
                    size="xs"
                  />
                  <UInput
                    v-model="editComment"
                    placeholder="Коммент..."
                    class="w-32"
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
                      @click="cancelEdit"
                    />
                  </div>
                </div>

                <!-- Grade value or empty -->
                <button
                  v-else
                  class="w-full rounded py-1 hover:bg-muted/50 transition-colors cursor-pointer"
                  @click="startEdit(s.studentId, l.id)"
                >
                  <UBadge
                    v-if="gradeMap[s.studentId]?.[l.id]"
                    :color="gradeColor(gradeMap[s.studentId]?.[l.id]?.value)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ gradeMap[s.studentId]?.[l.id]?.value }}
                  </UBadge>
                  <span
                    v-else
                    class="text-xs text-muted/40"
                  >—</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </div>
  </div>
</template>
