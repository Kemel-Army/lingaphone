<script setup lang="ts">
import { useAdminStats } from '~/entities/admin-stats'
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const { fullName } = useCurrentUser()
const { fetchKpi, fetchXpChart } = useAdminStats()

const { data: kpi } = await useAsyncData('admin-kpi', fetchKpi)
const { data: xpChart } = await useAsyncData('admin-xp-chart', fetchXpChart)

const kpiCards = computed(() => [
  {
    label: 'Учеников всего',
    value: kpi.value?.totalStudents ?? 0,
    icon: 'i-lucide-graduation-cap',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    sub: `+${kpi.value?.newStudents30d ?? 0} за 30 дней`
  },
  {
    label: 'Активны за 7 дней',
    value: kpi.value?.activeStudents7d ?? 0,
    icon: 'i-lucide-activity',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    sub: 'открывали платформу'
  },
  {
    label: 'Учителей',
    value: kpi.value?.totalTeachers ?? 0,
    icon: 'i-lucide-users',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    sub: `${kpi.value?.totalGroups ?? 0} групп`
  },
  {
    label: 'Выплат ожидает',
    value: kpi.value?.pendingPayouts ?? 0,
    icon: 'i-lucide-banknote',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    sub: `${(kpi.value?.pendingPayoutsAmount ?? 0).toLocaleString()} ₸`
  }
])

const currentMonth = computed(() => {
  const now = new Date()
  return now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
})

const chartData = computed(() => {
  if (!xpChart.value?.length) return null
  return {
    labels: xpChart.value.map(p => p.date.slice(5)),
    datasets: [{
      label: 'XP за день',
      data: xpChart.value.map(p => p.xp),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22,163,74,0.1)',
      tension: 0.4,
      fill: true
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true }
  }
}

const navLinks = [
  { to: '/admin/students', icon: 'i-lucide-graduation-cap', label: 'Ученики', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { to: '/admin/teachers', icon: 'i-lucide-users', label: 'Учителя', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { to: '/admin/groups', icon: 'i-lucide-layout-grid', label: 'Группы', color: 'text-green-500', bg: 'bg-green-500/10' }
]
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div>
      <p class="text-sm font-bold text-primary uppercase tracking-wider">
        Администрирование
      </p>
      <h1 class="text-2xl font-black tracking-tight mt-0.5">
        Привет, {{ fullName }}!
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Вот что происходит на платформе прямо сейчас
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <UCard
        v-for="card in kpiCards"
        :key="card.label"
      >
        <div class="flex items-start gap-3">
          <div
            class="rounded-xl p-2.5 shrink-0"
            :class="card.bg"
          >
            <UIcon
              :name="card.icon"
              class="size-5"
              :class="card.color"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted uppercase tracking-wide leading-tight mb-1">
              {{ card.label }}
            </p>
            <p class="text-3xl font-black tabular-nums leading-none">
              {{ card.value }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ card.sub }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts + Medals -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Medals block -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-medal"
              class="size-4 text-yellow-500"
            />
            <h2 class="font-semibold text-sm">
              Медали — {{ currentMonth }}
            </h2>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="medal in [
              { label: '🥇 Золото', count: kpi?.currentMonthMedals?.gold ?? 0, color: 'text-yellow-600 dark:text-yellow-400' },
              { label: '🥈 Серебро', count: kpi?.currentMonthMedals?.silver ?? 0, color: 'text-gray-500 dark:text-gray-300' },
              { label: '🥉 Бронза', count: kpi?.currentMonthMedals?.bronze ?? 0, color: 'text-amber-700 dark:text-amber-400' }
            ]"
            :key="medal.label"
            class="flex items-center justify-between"
          >
            <span
              class="text-sm font-medium"
              :class="medal.color"
            >{{ medal.label }}</span>
            <span class="text-sm font-bold tabular-nums">{{ medal.count }} уч.</span>
          </div>
        </div>
      </UCard>

      <!-- XP chart -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-trending-up"
              class="size-4 text-green-500"
            />
            <h2 class="font-semibold text-sm">
              Активность XP — последние 30 дней
            </h2>
          </div>
        </template>
        <LazyLineChart
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
          :height="150"
        />
        <div
          v-else
          class="flex flex-col items-center justify-center py-10 text-muted text-sm gap-2"
        >
          <UIcon
            name="i-lucide-bar-chart-2"
            class="size-8 opacity-40"
          />
          <span>Нет данных за последние 30 дней</span>
        </div>
      </UCard>
    </div>

    <!-- Quick Nav -->
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
        Разделы
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="block"
        >
          <UCard class="hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer group">
            <div class="flex items-center gap-3">
              <div
                class="rounded-xl p-2 shrink-0"
                :class="link.bg"
              >
                <UIcon
                  :name="link.icon"
                  class="size-4"
                  :class="link.color"
                />
              </div>
              <span class="font-semibold text-sm">{{ link.label }}</span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-3.5 text-muted ml-auto group-hover:text-primary transition-colors"
              />
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
