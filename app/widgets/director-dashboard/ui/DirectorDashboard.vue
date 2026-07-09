<script setup lang="ts">
import type { DirectorStats } from '~/features/director-stats'

const props = defineProps<{
  stats: DirectorStats
}>()

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`

const tiles = computed(() => [
  { label: 'Всего учеников', value: String(props.stats.totalStudents), icon: 'i-lucide-graduation-cap', color: 'text-blue-500', bg: 'bg-blue-500/10', sub: `${props.stats.activeStudents} активных` },
  { label: 'Активных учеников', value: String(props.stats.activeStudents), icon: 'i-lucide-activity', color: 'text-green-500', bg: 'bg-green-500/10', sub: 'в группах' },
  { label: 'Новых лидов за месяц', value: String(props.stats.newLeadsMonth), icon: 'i-lucide-user-plus', color: 'text-cyan-500', bg: 'bg-cyan-500/10', sub: 'воронка' },
  { label: 'Оплат за месяц', value: String(props.stats.paymentsMonthCount), icon: 'i-lucide-receipt', color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: money(props.stats.revenueMonth) },
  { label: 'Конверсия пробный→продажа', value: `${props.stats.conversionPct}%`, icon: 'i-lucide-target', color: 'text-violet-500', bg: 'bg-violet-500/10', sub: `${props.stats.salesCount} из ${props.stats.trialsCount}` },
  { label: 'Выручка за месяц', value: money(props.stats.revenueMonth), icon: 'i-lucide-trending-up', color: 'text-primary', bg: 'bg-primary/10', sub: `всего ${money(props.stats.revenueTotal)}` },
  { label: 'Задолженность', value: money(props.stats.debt), icon: 'i-lucide-alert-triangle', color: 'text-red-500', bg: 'bg-red-500/10', sub: 'просроченные абонементы' },
  { label: 'Загрузка групп', value: `${props.stats.groupLoadPct}%`, icon: 'i-lucide-layout-grid', color: 'text-amber-500', bg: 'bg-amber-500/10', sub: `${props.stats.groupsFilled}/${props.stats.groupsCapacity} мест` }
])
</script>

<template>
  <div class="space-y-5">
    <!-- KPI tiles -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <UCard
        v-for="t in tiles"
        :key="t.label"
      >
        <div class="flex items-start gap-3">
          <div
            class="rounded-xl p-2.5 shrink-0"
            :class="t.bg"
          >
            <UIcon
              :name="t.icon"
              class="size-5"
              :class="t.color"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted uppercase tracking-wide leading-tight mb-1">
              {{ t.label }}
            </p>
            <p class="text-2xl font-black tabular-nums leading-none">
              {{ t.value }}
            </p>
            <p class="text-xs text-muted mt-1 truncate">
              {{ t.sub }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Top teachers -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-award"
            class="size-4 text-yellow-500"
          />
          <h2 class="font-semibold text-sm">
            Лучшие преподаватели
          </h2>
        </div>
      </template>
      <div
        v-if="stats.topTeachers.length"
        class="space-y-1"
      >
        <div
          v-for="(t, i) in stats.topTeachers"
          :key="t.id"
          class="flex items-center gap-3 py-2 border-b border-subtle last:border-0"
        >
          <span
            class="size-6 shrink-0 rounded-full grid place-items-center text-xs font-bold"
            :class="i === 0 ? 'bg-yellow-500/20 text-yellow-600' : i === 1 ? 'bg-gray-400/20 text-gray-500' : i === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-muted text-muted'"
          >{{ i + 1 }}</span>
          <span class="font-medium text-sm flex-1 truncate">{{ t.name }}</span>
          <span class="text-xs text-muted">{{ t.groupCount }} групп</span>
          <span class="flex items-center gap-1 text-sm font-semibold tabular-nums">
            <UIcon
              name="i-lucide-star"
              class="size-3.5 text-yellow-500"
            />
            {{ t.rating.toFixed(1) }}
          </span>
        </div>
      </div>
      <p
        v-else
        class="text-sm text-muted py-4 text-center"
      >
        Нет преподавателей
      </p>
    </UCard>
  </div>
</template>
