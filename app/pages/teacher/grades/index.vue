<script setup lang="ts">
/**
 * Электронный дневник: оценки по 5 критериям «мотивашки» за каждый урок.
 *
 * Заменяет ручную Google-таблицу: раньше учитель ставил один балл за урок,
 * теперь — пять (посещаемость, поведение, дом.зад, дневник, e-book), из
 * которых в конце месяца считается медаль и бонус.
 */
import { useTeacher } from '~/entities/teacher'
import {
  CRITERIA,
  useMotivation,
  currentMonthKey,
  formatMonth,
  type GradeCriterion
} from '~/entities/motivation'
import { CriteriaGradeModal } from '~/features/grade-criteria'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()

const { fetchMyGroups } = useTeacher()
const { fetchJournal } = useMotivation()

const { data: groups } = await useAsyncData('teacher-groups-grades', fetchMyGroups)

const selectedGroupId = ref<string | null>((route.query.groupId as string) || null)
const month = ref(currentMonthKey())

const { data: journal, pending, refresh } = await useAsyncData(
  'teacher-criteria-journal',
  () => selectedGroupId.value
    ? fetchJournal(selectedGroupId.value, month.value)
    : Promise.resolve(null),
  { watch: [selectedGroupId, month] }
)

watch(() => route.query.groupId, (g) => {
  const gid = (g as string) || null
  if (gid !== selectedGroupId.value) selectedGroupId.value = gid
})

const lessons = computed(() => journal.value?.lessons ?? [])
const students = computed(() => journal.value?.students ?? [])
const gradeMap = computed(() => journal.value?.gradeMap ?? {})

const groupOptions = computed(() => [
  { value: null, label: 'Выберите группу' },
  ...(groups.value ?? []).map(g => ({ value: g.id, label: g.name }))
])

/** Последние 12 месяцев — дальше в прошлое журнал листать незачем. */
const monthOptions = computed(() => {
  const out: { value: string, label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ value: key, label: formatMonth(key) })
  }
  return out
})

const cellValues = (studentId: string, lessonId: string): Partial<Record<GradeCriterion, number>> =>
  gradeMap.value[studentId]?.[lessonId] ?? {}

const cellAverage = (studentId: string, lessonId: string): number | null => {
  const vals = Object.values(cellValues(studentId, lessonId)).filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const cellFilled = (studentId: string, lessonId: string) =>
  Object.keys(cellValues(studentId, lessonId)).length

const cellClasses = (studentId: string, lessonId: string): string => {
  const avg = cellAverage(studentId, lessonId)
  if (avg === null) return 'border-dashed border-default text-muted hover:border-primary'
  if (avg >= 4.5) return 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300'
  if (avg >= 3.5) return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
  return 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
}

/** Средний балл ученика за месяц по всем оценкам — превью будущей медали. */
const studentAverage = (studentId: string): string => {
  const row = gradeMap.value[studentId]
  if (!row) return '—'
  const vals = Object.values(row).flatMap(c => Object.values(c)).filter((v): v is number => typeof v === 'number')
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
}

const avgColor = (avg: string): string => {
  if (avg === '—') return 'text-muted'
  const n = Number(avg)
  if (n >= 4.5) return 'text-green-600 dark:text-green-400'
  if (n >= 3.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const formatLessonDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

const initials = (name: string, surname: string) =>
  `${(surname[0] ?? '')}${(name[0] ?? '')}`.toUpperCase() || '—'

const totalGrades = computed(() =>
  Object.values(gradeMap.value)
    .flatMap(row => Object.values(row))
    .reduce((sum, c) => sum + Object.keys(c).length, 0)
)

/** Сколько клеток заполнено не полностью — в таблице это «должно быть 5». */
const incompleteCells = computed(() => {
  let n = 0
  for (const s of students.value) {
    for (const l of lessons.value) {
      const filled = cellFilled(s.studentId, l.id)
      if (filled > 0 && filled < CRITERIA.length) n++
    }
  }
  return n
})

// ─── Модалка выставления оценок ─────────────────────────────────────────────
const editorOpen = ref(false)
const editorTarget = ref<{
  lessonId: string
  studentId: string
  studentName: string
  lessonLabel: string
  initial: Partial<Record<GradeCriterion, number>>
} | null>(null)

const openEditor = (studentId: string, lessonId: string) => {
  const student = students.value.find(s => s.studentId === studentId)
  const lesson = lessons.value.find(l => l.id === lessonId)
  editorTarget.value = {
    lessonId,
    studentId,
    studentName: `${student?.surname ?? ''} ${student?.name ?? ''}`.trim(),
    lessonLabel: lesson ? `${formatLessonDate(lesson.startsAt)} · ${lesson.topic}` : '',
    initial: { ...cellValues(studentId, lessonId) }
  }
  editorOpen.value = true
}
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
          Электронный дневник
        </h1>
        <p class="text-sm text-muted mt-1">
          Пять оценок за урок: посещаемость, поведение, дом.зад, дневник, e-book
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <USelect
          v-model="month"
          :items="monthOptions"
          icon="i-lucide-calendar"
          class="min-w-44"
        />
        <USelect
          v-model="selectedGroupId"
          :items="groupOptions"
          icon="i-lucide-layers"
          class="min-w-56"
        />
      </div>
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
        Чтобы открыть дневник
      </p>
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
        {{ !students.length ? 'В группе нет учеников' : `В ${formatMonth(month)} нет уроков` }}
      </p>
    </div>

    <template v-else>
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
            name="i-lucide-check-check"
            class="size-3.5 text-muted"
          />
          {{ totalGrades }} оценок
        </span>
        <span
          v-if="incompleteCells"
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-3.5"
          />
          {{ incompleteCells }} уроков заполнено не полностью
        </span>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-default">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-elevated/50">
              <th class="sticky left-0 z-10 bg-elevated/95 backdrop-blur px-3 py-2 text-left font-semibold min-w-48">
                Ученик
              </th>
              <th
                v-for="l in lessons"
                :key="l.id"
                class="px-2 py-2 text-center font-medium whitespace-nowrap min-w-20"
                :title="l.topic"
              >
                {{ formatLessonDate(l.startsAt) }}
              </th>
              <th class="px-3 py-2 text-center font-semibold whitespace-nowrap">
                Средний
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in students"
              :key="s.studentId"
              class="border-t border-default"
            >
              <td class="sticky left-0 z-10 bg-default/95 backdrop-blur px-3 py-2">
                <div class="flex items-center gap-2">
                  <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {{ initials(s.name, s.surname) }}
                  </span>
                  <span class="truncate">{{ s.surname }} {{ s.name }}</span>
                </div>
              </td>

              <td
                v-for="l in lessons"
                :key="l.id"
                class="px-1.5 py-1.5 text-center"
              >
                <button
                  type="button"
                  class="w-full rounded-lg border px-1 py-1.5 text-xs font-semibold transition"
                  :class="cellClasses(s.studentId, l.id)"
                  :title="`${l.topic} — заполнено ${cellFilled(s.studentId, l.id)}/${CRITERIA.length}`"
                  @click="openEditor(s.studentId, l.id)"
                >
                  <template v-if="cellAverage(s.studentId, l.id) !== null">
                    {{ cellAverage(s.studentId, l.id)!.toFixed(1) }}
                    <span class="block text-[10px] font-normal opacity-70">
                      {{ cellFilled(s.studentId, l.id) }}/{{ CRITERIA.length }}
                    </span>
                  </template>
                  <template v-else>
                    +
                  </template>
                </button>
              </td>

              <td
                class="px-3 py-2 text-center font-bold"
                :class="avgColor(studentAverage(s.studentId))"
              >
                {{ studentAverage(s.studentId) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-muted">
        Нажмите на ячейку, чтобы выставить пять оценок за урок. Медаль и бонус
        за месяц считаются в разделе «Мотивация» — туда же менеджер вносит
        Instagram, оплату и книги.
      </p>
    </template>

    <CriteriaGradeModal
      v-if="editorTarget"
      v-model:open="editorOpen"
      :lesson-id="editorTarget.lessonId"
      :student-id="editorTarget.studentId"
      :student-name="editorTarget.studentName"
      :lesson-label="editorTarget.lessonLabel"
      :initial="editorTarget.initial"
      @saved="refresh"
    />
  </div>
</template>
