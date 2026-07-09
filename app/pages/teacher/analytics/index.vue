<script setup lang="ts">
import { useTeacherAnalytics, type GroupAnalytics } from '~/features/teacher-analytics'

definePageMeta({ layout: 'dashboard' })

const { fetchGroupAnalytics } = useTeacherAnalytics()
const { data: groups, pending } = await useAsyncData('teacher-analytics', fetchGroupAnalytics)

const gradeColor = (v: number) => v >= 4.5 ? 'text-green-500' : v >= 3.5 ? 'text-amber-500' : 'text-red-500'
const attColor = (v: number) => v >= 85 ? 'text-green-500' : v >= 60 ? 'text-amber-500' : 'text-red-500'
const totals = computed(() => {
  const g = groups.value ?? []
  const students = g.reduce((s, x) => s + x.studentCount, 0)
  const lagging = g.reduce((s, x) => s + x.laggingCount, 0)
  return { groups: g.length, students, lagging }
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <UIcon
          name="i-lucide-bar-chart-3"
          class="size-6 text-primary"
        />
        Аналитика
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Средний балл, посещаемость и отстающие по группам
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

    <template v-else>
      <!-- Totals -->
      <div class="grid grid-cols-3 gap-3">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Групп
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ totals.groups }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Учеников
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ totals.students }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Отстающих
          </p>
          <p class="text-2xl font-bold mt-1 text-red-500">
            {{ totals.lagging }}
          </p>
        </UCard>
      </div>

      <!-- Per group -->
      <UCard
        v-for="g in (groups as GroupAnalytics[])"
        :key="g.groupId"
      >
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">
              {{ g.name }}
            </p>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ g.studentCount }} уч.
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-3 gap-3 mb-3">
          <div class="rounded-lg bg-muted/30 p-3 text-center">
            <p class="text-xs text-muted">
              Средний балл
            </p>
            <p
              class="text-xl font-bold mt-0.5"
              :class="gradeColor(g.avgGrade)"
            >
              {{ g.avgGrade ? g.avgGrade.toFixed(1) : '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-muted/30 p-3 text-center">
            <p class="text-xs text-muted">
              Посещаемость
            </p>
            <p
              class="text-xl font-bold mt-0.5"
              :class="attColor(g.attendancePct)"
            >
              {{ g.attendancePct ? `${g.attendancePct}%` : '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-muted/30 p-3 text-center">
            <p class="text-xs text-muted">
              Выполнение ДЗ
            </p>
            <p class="text-xl font-bold mt-0.5">
              {{ g.hwCompletionPct }}%
            </p>
          </div>
        </div>

        <div v-if="g.lagging.length">
          <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <UIcon
              name="i-lucide-trending-down"
              class="size-3.5 text-red-500"
            />
            Отстающие
          </p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="s in g.lagging"
              :key="s.studentId"
              class="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-xs"
            >
              <span class="font-medium">{{ s.name }}</span>
              <span
                v-if="s.avgGrade"
                :class="gradeColor(s.avgGrade)"
              >балл {{ s.avgGrade.toFixed(1) }}</span>
              <span
                v-if="s.attendancePct"
                :class="attColor(s.attendancePct)"
              >{{ s.attendancePct }}%</span>
            </div>
          </div>
        </div>
        <p
          v-else
          class="text-xs text-muted"
        >
          Отстающих нет 👍
        </p>
      </UCard>

      <p
        v-if="!groups?.length"
        class="text-center text-muted py-12"
      >
        Нет групп с данными
      </p>
    </template>
  </div>
</template>
