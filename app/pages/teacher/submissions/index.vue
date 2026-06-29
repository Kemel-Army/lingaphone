<script setup lang="ts">
import { useTeacher, type TeacherSubmission } from '~/entities/teacher'
import { useGradeStudent } from '~/features/grade-student'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchSubmissions } = useTeacher()
const { gradeSubmission } = useGradeStudent()

const statusFilter = ref<'SUBMITTED' | 'CHECKED'>('SUBMITTED')

const { data: submissions, pending, refresh } = await useAsyncData(
  'teacher-submissions',
  () => fetchSubmissions({ status: statusFilter.value }),
  { watch: [statusFilter] }
)

// Grade panel state
const expanded = ref<string | null>(null)
const gradeValues = ref<Record<string, number>>({})
const gradeComments = ref<Record<string, string>>({})
const saving = ref<string | null>(null)

const toggleExpand = (id: string) => {
  expanded.value = expanded.value === id ? null : id
}

const initGrade = (s: TeacherSubmission) => {
  if (!(s.id in gradeValues.value)) {
    gradeValues.value[s.id] = s.teacherGrade ?? s.aiScore ?? 1
    gradeComments.value[s.id] = s.teacherComment ?? ''
  }
}

const submitGrade = async (s: TeacherSubmission) => {
  const grade = gradeValues.value[s.id]
  if (!grade) return
  saving.value = s.id
  try {
    await gradeSubmission(s.id, grade, gradeComments.value[s.id] ?? '')
    toast.add({ title: 'Оценка выставлена', color: 'success', icon: 'i-lucide-check' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка', description: String(e), color: 'error' })
  } finally {
    saving.value = null
  }
}

const formatLabel: Record<string, string> = {
  TEST: 'Тест', INPUT: 'Ввод', TEXT: 'Текст', ORAL: 'Устный', FILE: 'Файл', INTERACTIVE: 'Интерактив'
}

const statusLabel: Record<string, string> = {
  ASSIGNED: 'Назначено', IN_PROGRESS: 'В процессе', SUBMITTED: 'Сдано',
  CHECKED: 'Проверено', OVERDUE: 'Просрочено'
}

const statusColor = (s: string): 'warning' | 'success' | 'error' | 'neutral' | 'info' => {
  const map: Record<string, 'warning' | 'success' | 'error' | 'neutral' | 'info'> = {
    SUBMITTED: 'warning', CHECKED: 'success', OVERDUE: 'error',
    ASSIGNED: 'neutral', IN_PROGRESS: 'info'
  }
  return map[s] ?? 'neutral'
}

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const answerText = (submission: TeacherSubmission): string => {
  if (!submission.answers) return ''
  if (typeof submission.answers === 'string') return submission.answers
  return JSON.stringify(submission.answers, null, 2)
}
</script>

<template>
  <div class="p-6 space-y-4 max-w-5xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold">
        Проверка работ
      </h1>
      <p class="text-sm text-muted mt-1">
        {{ submissions?.length ?? 0 }} работ
      </p>
    </div>

    <!-- Status tabs -->
    <div class="flex gap-2">
      <UButton
        :variant="statusFilter === 'SUBMITTED' ? 'solid' : 'outline'"
        color="warning"
        size="sm"
        icon="i-lucide-inbox"
        @click="statusFilter = 'SUBMITTED'"
      >
        Ожидают проверки
      </UButton>
      <UButton
        :variant="statusFilter === 'CHECKED' ? 'solid' : 'outline'"
        color="success"
        size="sm"
        icon="i-lucide-check-circle"
        @click="statusFilter = 'CHECKED'"
      >
        Проверенные
      </UButton>
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

    <div
      v-else-if="!submissions?.length"
      class="flex flex-col items-center py-16 text-muted gap-2"
    >
      <UIcon
        name="i-lucide-check-circle"
        class="size-10"
      />
      <p>{{ statusFilter === 'SUBMITTED' ? 'Всё проверено!' : 'Проверенных работ нет' }}</p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <UCard
        v-for="s in (submissions as TeacherSubmission[])"
        :key="s.id"
        class="overflow-hidden"
      >
        <!-- Header row -->
        <div
          class="flex items-center gap-3 cursor-pointer"
          @click="toggleExpand(s.id); initGrade(s)"
        >
          <UAvatar
            :src="s.studentAvatarUrl ?? undefined"
            :alt="`${s.studentName} ${s.studentSurname}`"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-medium">
                {{ s.studentName }} {{ s.studentSurname }}
              </p>
              <UBadge
                color="neutral"
                variant="subtle"
                size="xs"
              >
                {{ s.groupName }}
              </UBadge>
            </div>
            <p class="text-sm text-muted truncate">
              {{ s.homeworkTitle }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <UBadge
              :color="statusColor(s.status)"
              variant="subtle"
              size="sm"
            >
              {{ statusLabel[s.status] ?? s.status }}
            </UBadge>
            <UBadge
              color="neutral"
              variant="outline"
              size="sm"
            >
              {{ formatLabel[s.homeworkFormat] ?? s.homeworkFormat }}
            </UBadge>
            <p class="text-xs text-muted hidden sm:block">
              {{ formatDate(s.submittedAt) }}
            </p>
            <UIcon
              :name="expanded === s.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-4 text-muted"
            />
          </div>
        </div>

        <!-- Expanded panel -->
        <div
          v-if="expanded === s.id"
          class="mt-4 pt-4 border-t border-subtle space-y-4"
        >
          <!-- AI score -->
          <div
            v-if="s.aiScore !== null"
            class="flex items-center gap-2 text-sm"
          >
            <UIcon
              name="i-lucide-bot"
              class="size-4 text-primary"
            />
            <span class="text-muted">AI-оценка:</span>
            <span class="font-bold">{{ s.aiScore }} / {{ s.homeworkMaxScore }}</span>
          </div>

          <!-- AI feedback -->
          <div
            v-if="s.aiFeedback"
            class="bg-muted/20 rounded-lg p-3 text-sm"
          >
            <p class="text-xs text-muted font-medium mb-1">
              AI-анализ
            </p>
            <p class="whitespace-pre-wrap">
              {{ typeof s.aiFeedback === 'string' ? s.aiFeedback : JSON.stringify(s.aiFeedback, null, 2) }}
            </p>
          </div>

          <!-- Audio player (ORAL) -->
          <div
            v-if="s.audioUrl"
            class="space-y-2"
          >
            <p class="text-xs text-muted font-medium">
              Аудио-ответ
            </p>
            <audio
              controls
              :src="s.audioUrl"
              class="w-full"
              preload="metadata"
            />
          </div>

          <!-- File link (FILE) -->
          <div
            v-if="s.fileUrl"
            class="flex items-center gap-2"
          >
            <UIcon
              name="i-lucide-paperclip"
              class="size-4 text-muted"
            />
            <UButton
              :to="s.fileUrl"
              target="_blank"
              variant="ghost"
              size="sm"
              icon="i-lucide-download"
            >
              Скачать файл
            </UButton>
          </div>

          <!-- Text answer -->
          <div
            v-if="answerText(s)"
            class="space-y-1"
          >
            <p class="text-xs text-muted font-medium">
              Ответ ученика
            </p>
            <div class="bg-muted/20 rounded-lg p-3 text-sm whitespace-pre-wrap font-mono">
              {{ answerText(s) }}
            </div>
          </div>

          <!-- Grade form -->
          <div
            v-if="s.status === 'SUBMITTED'"
            class="border border-subtle rounded-lg p-4 space-y-3"
          >
            <p class="text-sm font-semibold">
              Выставить оценку
            </p>
            <div class="flex items-center gap-3 flex-wrap">
              <div class="flex items-center gap-2">
                <label class="text-sm text-muted">Балл (1–{{ s.homeworkMaxScore }}):</label>
                <UInput
                  v-model="gradeValues[s.id]"
                  type="number"
                  :min="1"
                  :max="s.homeworkMaxScore"
                  class="w-20"
                  size="sm"
                />
              </div>
            </div>
            <UTextarea
              v-model="gradeComments[s.id]"
              placeholder="Комментарий учителя (необязательно)..."
              :rows="2"
            />
            <UButton
              :loading="saving === s.id"
              icon="i-lucide-check"
              color="success"
              @click="submitGrade(s)"
            >
              Принять и поставить оценку
            </UButton>
          </div>

          <!-- Already graded info -->
          <div
            v-else-if="s.teacherGrade !== null"
            class="flex items-center gap-2 text-sm"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="size-4 text-green-500"
            />
            <span class="text-muted">Оценка учителя:</span>
            <span class="font-bold">{{ s.teacherGrade }} / {{ s.homeworkMaxScore }}</span>
            <span
              v-if="s.teacherComment"
              class="text-muted"
            >— {{ s.teacherComment }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
