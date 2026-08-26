<script setup lang="ts">
import { useTeacher } from '~/entities/teacher'
import { useBooks } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const studentId = String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id)

const { fetchStudentById, assignStudentBook } = useTeacher()

const { data, pending, error, refresh } = await useAsyncData(
  `teacher-student-${studentId}`,
  () => fetchStudentById(studentId)
)

const student = computed(() => data.value?.student ?? null)
const grades = computed(() => data.value?.grades ?? [])

// ── Book override ─────────────────────────────────────────────────────────────
const { fetchBooks } = useBooks()
const { data: publishedBooks } = await useAsyncData('teacher-published-books', () => fetchBooks())
const NO_BOOK = '__inherit__'
const bookOptions = computed(() => [
  { label: 'Наследовать от группы', value: NO_BOOK },
  ...(publishedBooks.value ?? []).map(b => ({ label: b.title, value: b.id }))
])
const selectedBookId = ref(NO_BOOK)
const bookSaving = ref(false)
watch(() => student.value?.assignedBookId, (id) => {
  selectedBookId.value = id ?? NO_BOOK
}, { immediate: true })

const saveStudentBook = async () => {
  bookSaving.value = true
  try {
    await assignStudentBook(studentId, selectedBookId.value === NO_BOOK ? null : selectedBookId.value)
    toast.add({ title: 'Учебник ученика обновлён', color: 'success', icon: 'i-lucide-check-circle' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка сохранения', description: String(e), color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    bookSaving.value = false
  }
}

const avgGrade = computed(() => {
  if (!grades.value.length) return null
  const sum = grades.value.reduce((acc, g) => acc + g.value, 0)
  return (sum / grades.value.length).toFixed(2)
})

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const gradeColor = (v: number) => {
  if (v === 5) return 'success'
  if (v >= 4) return 'warning'
  return 'error'
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-4xl mx-auto">
    <div class="flex items-center gap-2">
      <UButton
        to="/teacher/students"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      />
      <h1 class="text-2xl font-bold">
        Профиль ученика
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
      v-else-if="error || !student"
      color="error"
      icon="i-lucide-alert-circle"
      title="Ученик не найден"
    />

    <template v-else>
      <!-- Student header -->
      <UCard>
        <div class="flex items-center gap-4">
          <UAvatar
            :src="student.avatarUrl ?? undefined"
            :alt="`${student.name} ${student.surname}`"
            size="xl"
          />
          <div class="flex-1">
            <h2 class="text-xl font-bold">
              {{ student.name }} {{ student.surname }}
            </h2>
            <p class="text-muted text-sm">
              {{ student.email }}
            </p>
          </div>
          <div class="flex flex-wrap gap-3 text-center">
            <div>
              <p class="text-lg font-bold">
                {{ student.level }}
              </p>
              <p class="text-xs text-muted">
                Уровень
              </p>
            </div>
            <div>
              <p class="text-lg font-bold">
                {{ student.totalXp.toLocaleString() }}
              </p>
              <p class="text-xs text-muted">
                XP
              </p>
            </div>
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-1 text-lg font-bold">
                <UIcon
                  name="i-lucide-flame"
                  class="size-5 text-orange-400"
                />
                {{ student.dailyStreak }}
              </div>
              <p class="text-xs text-muted">
                Стрик
              </p>
            </div>
            <div>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">
                {{ student.totalEarnings.toLocaleString() }} ₸
              </p>
              <p class="text-xs text-muted">
                Заработано
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Book override -->
      <UCard>
        <div class="flex flex-wrap items-center gap-3">
          <UIcon
            name="i-lucide-book-open"
            class="size-5 text-primary shrink-0"
          />
          <div class="min-w-0">
            <p class="font-semibold text-sm">
              Учебник ученика
            </p>
            <p class="text-xs text-muted">
              Переопределяет книгу группы только для этого ученика
            </p>
          </div>
          <USelect
            v-model="selectedBookId"
            :items="bookOptions"
            class="ml-auto w-full sm:w-64"
          />
          <UButton
            icon="i-lucide-save"
            size="sm"
            :loading="bookSaving"
            :disabled="selectedBookId === (student.assignedBookId ?? NO_BOOK)"
            @click="saveStudentBook"
          >
            Сохранить
          </UButton>
        </div>
      </UCard>

      <!-- Grades section -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold">
              <UIcon
                name="i-lucide-star"
                class="size-4"
              />
              Оценки
            </div>
            <div
              v-if="avgGrade"
              class="text-sm text-muted"
            >
              Средний балл:
              <span class="font-bold text-primary">{{ avgGrade }} / 5</span>
            </div>
          </div>
        </template>

        <div
          v-if="!grades.length"
          class="text-center py-8 text-muted text-sm"
        >
          Оценок пока нет
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="g in grades"
            :key="`${g.lessonId}`"
            class="flex items-center justify-between py-2 border-b border-subtle last:border-0"
          >
            <div>
              <p class="text-sm font-medium">
                {{ g.lessonTopic }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDate(g.gradedAt) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="gradeColor(g.value)"
                variant="subtle"
              >
                {{ g.value }} / 5
              </UBadge>
              <p
                v-if="g.comment"
                class="text-xs text-muted max-w-48 truncate"
              >
                {{ g.comment }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
