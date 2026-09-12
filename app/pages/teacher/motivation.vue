<script setup lang="ts">
/**
 * Мотивация глазами преподавателя — только просмотр.
 *
 * Учитель видит, к какой медали идёт каждый его ученик, но менеджерские
 * параметры (Instagram / оплата / книги) не правит: их ставит менеджер в
 * админке. Поэтому здесь нет ни чекбоксов, ни фиксации месяца.
 */
import { useTeacher } from '~/entities/teacher'
import {
  useMotivation,
  MEDAL_MAP,
  currentMonthKey,
  formatMonth,
  type MotivationRow
} from '~/entities/motivation'

definePageMeta({ layout: 'dashboard' })

const { fetchMyGroups } = useTeacher()
const { fetchSummary } = useMotivation()

const { data: groups } = await useAsyncData('teacher-groups-motivation', fetchMyGroups)

const month = ref(currentMonthKey())
const groupId = ref<string | null>(null)

const { data: summary, pending } = await useAsyncData(
  'teacher-motivation',
  () => fetchSummary(month.value, groupId.value),
  { watch: [month, groupId] }
)

const groupOptions = computed(() => [
  { value: null, label: 'Все мои группы' },
  ...(groups.value ?? []).map(g => ({ value: g.id, label: g.name }))
])

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

const rows = computed<MotivationRow[]>(() => summary.value?.rows ?? [])
const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`

/** Клетки, где выставлено меньше 5 оценок за урок, — то, что чинит учитель. */
const needsAttention = computed(() =>
  rows.value.filter(r => r.attendedLessons > 0 && r.avgGradesPerLesson < 5)
)
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-medal"
            class="size-6 text-primary"
          />
          Мотивация
        </h1>
        <p class="text-sm text-muted mt-1">
          К какой медали идут ученики в {{ formatMonth(month) }}
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
          v-model="groupId"
          :items="groupOptions"
          icon="i-lucide-layers"
          class="min-w-48"
        />
      </div>
    </div>

    <UAlert
      v-if="needsAttention.length"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Есть незаполненные оценки"
      :description="`У ${needsAttention.length} учеников в среднем меньше 5 оценок на урок. Заполните дневник — иначе средний балл занижен.`"
    >
      <template #actions>
        <UButton
          to="/teacher/grades"
          size="xs"
          color="warning"
          variant="solid"
        >
          Открыть дневник
        </UButton>
      </template>
    </UAlert>

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
      v-else-if="!rows.length"
      class="rounded-2xl border-2 border-dashed border-default py-14 text-center"
    >
      <UIcon
        name="i-lucide-inbox"
        class="size-10 text-muted mx-auto"
      />
      <p class="mt-3 font-semibold">
        Нет данных за {{ formatMonth(month) }}
      </p>
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-2xl border border-default"
    >
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-elevated/50 text-xs">
            <th class="px-3 py-2 text-left font-semibold">
              ФИО
            </th>
            <th class="px-2 py-2 text-left font-medium">
              Группа
            </th>
            <th class="px-2 py-2 text-center font-medium">
              Оценок/урок
            </th>
            <th class="px-2 py-2 text-center font-medium">
              Посетил
            </th>
            <th class="px-2 py-2 text-center font-semibold">
              Средний
            </th>
            <th class="px-2 py-2 text-center font-semibold">
              Медаль
            </th>
            <th class="px-3 py-2 text-right font-semibold">
              Бонус
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.studentId"
            class="border-t border-default"
            :class="{ 'opacity-60': !r.participates }"
          >
            <td class="px-3 py-2 font-medium">
              {{ r.fullName }}
            </td>
            <td class="px-2 py-2 text-muted text-xs">
              {{ r.groupName }}
            </td>
            <td
              class="px-2 py-2 text-center tabular-nums"
              :class="r.avgGradesPerLesson && r.avgGradesPerLesson < 5 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''"
            >
              {{ r.avgGradesPerLesson || '—' }}
            </td>
            <td class="px-2 py-2 text-center tabular-nums">
              {{ r.attendedLessons }}
            </td>
            <td class="px-2 py-2 text-center font-bold tabular-nums">
              {{ r.participates ? r.average.toFixed(2) : '—' }}
            </td>
            <td class="px-2 py-2 text-center">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="MEDAL_MAP[r.medal].classes"
              >
                {{ MEDAL_MAP[r.medal].emoji }} {{ MEDAL_MAP[r.medal].label }}
              </span>
            </td>
            <td class="px-3 py-2 text-right font-semibold tabular-nums">
              {{ r.payout ? money(r.payout) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-muted">
      Instagram, оплату и книги отмечает менеджер — без них балл ниже, и это
      не ошибка дневника.
    </p>
  </div>
</template>
