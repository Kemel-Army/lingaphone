<script setup lang="ts">
/**
 * Дневник ученика.
 *
 * Раньше страница читала старую таблицу оценок — «одна оценка за урок» — и под
 * новой системой из пяти критериев осталась бы пустой. Теперь берёт те же
 * данные и тот же расчёт, что видят преподаватель и менеджер.
 *
 * Сам блок вынесен в виджет: тот же экран показывается родителю в карточке
 * ребёнка, и держать две копии разметки — верный способ их рассинхронизировать.
 */
import { useMotivation, currentMonthKey, formatMonth } from '~/entities/motivation'
import { StudentMotivationCard } from '~/widgets/motivation-summary'

definePageMeta({ layout: 'dashboard' })

const { fetchStudentMonth } = useMotivation()

const month = ref(currentMonthKey())

const { data, pending } = await useAsyncData(
  'student-motivation',
  () => fetchStudentMonth(month.value),
  { watch: [month] }
)

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
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          📊 Дневник
        </p>
        <h1 class="text-3xl font-black tracking-tight mt-1">
          Мои оценки
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Каждый урок оценивается по пяти пунктам — из них складывается медаль месяца
        </p>
      </div>
      <USelect
        v-model="month"
        :items="monthOptions"
        icon="i-lucide-calendar"
        class="min-w-44"
      />
    </header>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <StudentMotivationCard
      v-else
      :data="data"
      voice="self"
    />
  </div>
</template>
