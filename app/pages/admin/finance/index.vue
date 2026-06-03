<script setup lang="ts">
import { useAdminStats, type AdminMedal, type AdminPayout } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const { fetchMedals, fetchPayouts } = useAdminStats()

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const selectedMonth = ref(currentMonth)

const { data: medals, pending: medalsPending, refresh: refreshMedals } = await useAsyncData(
  'admin-medals',
  () => fetchMedals(selectedMonth.value)
)
const { data: payouts, pending: payoutsPending } = await useAsyncData('admin-payouts', fetchPayouts)

watch(selectedMonth, () => refreshMedals())

type BadgeColor = 'warning' | 'neutral' | 'success' | 'error' | 'primary'

const medalBadgeColor = (medal: string): BadgeColor => {
  if (medal === 'GOLD') return 'warning'
  if (medal === 'SILVER') return 'neutral'
  if (medal === 'BRONZE') return 'warning'
  return 'neutral'
}
const medalLabel: Record<string, string> = {
  GOLD: '🥇 Золото', SILVER: '🥈 Серебро', BRONZE: '🥉 Бронза', NONE: 'Нет медали'
}
const payoutBadgeColor = (status: string): BadgeColor => {
  if (status === 'PAID') return 'success'
  if (status === 'CANCELLED') return 'error'
  return 'warning'
}

const medalSummary = computed(() => {
  const counts = { GOLD: 0, SILVER: 0, BRONZE: 0 }
  let total = 0
  for (const m of (medals.value ?? []) as AdminMedal[]) {
    if (m.medal in counts) counts[m.medal as keyof typeof counts]++
    total += m.payout ?? 0
  }
  return { counts, total }
})

const pendingPayoutsList = computed(() =>
  ((payouts.value ?? []) as AdminPayout[]).filter(p => p.status === 'PENDING')
)
const totalPending = computed(() =>
  pendingPayoutsList.value.reduce((s, p) => s + p.amount, 0)
)

const monthOptions = computed(() => {
  const opts = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({
      value: val,
      label: d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
    })
  }
  return opts
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold">
      Финансы и медали
    </h1>

    <!-- Month selector + summary -->
    <div class="flex flex-wrap items-center gap-4">
      <USelect
        v-model="selectedMonth"
        :items="monthOptions"
        class="w-52"
      />
      <div class="flex flex-wrap gap-3 items-center">
        <UBadge
          color="warning"
          variant="subtle"
        >
          🥇 {{ medalSummary.counts.GOLD }} Золото
        </UBadge>
        <UBadge
          color="neutral"
          variant="subtle"
        >
          🥈 {{ medalSummary.counts.SILVER }} Серебро
        </UBadge>
        <UBadge
          color="warning"
          variant="soft"
        >
          🥉 {{ medalSummary.counts.BRONZE }} Бронза
        </UBadge>
        <span class="text-sm font-bold text-green-600 dark:text-green-400">
          Итого: {{ medalSummary.total.toLocaleString() }} ₸
        </span>
      </div>
    </div>

    <!-- Medals table -->
    <UCard :ui="{ body: 'p-0' }">
      <div class="px-4 py-3 border-b border-subtle flex items-center gap-2">
        <UIcon
          name="i-lucide-trophy"
          class="size-4 text-yellow-500"
        />
        <span class="font-semibold text-sm">Медали за месяц</span>
        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ medals?.length ?? 0 }}
        </UBadge>
      </div>

      <div
        v-if="medalsPending"
        class="flex justify-center py-10"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <table
        v-else
        class="w-full text-sm"
      >
        <thead class="border-b border-subtle">
          <tr class="text-left text-xs text-muted uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">
              Ученик
            </th>
            <th class="px-4 py-3 font-medium">
              Ср. балл
            </th>
            <th class="px-4 py-3 font-medium">
              Медаль
            </th>
            <th class="px-4 py-3 font-medium">
              Выплата
            </th>
            <th class="px-4 py-3 font-medium">
              Статус выплаты
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in (medals ?? []) as AdminMedal[]"
            :key="m.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3 font-medium">
              {{ m.studentName }} {{ m.studentSurname }}
            </td>
            <td class="px-4 py-3 font-mono">
              {{ m.averageGrade?.toFixed(2) }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="medalBadgeColor(m.medal)"
                variant="subtle"
                size="sm"
              >
                {{ medalLabel[m.medal] ?? m.medal }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
              {{ m.payout ? m.payout.toLocaleString() + ' ₸' : '—' }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                v-if="m.payoutStatus"
                :color="payoutBadgeColor(m.payoutStatus)"
                variant="subtle"
                size="sm"
              >
                {{ m.payoutStatus }}
              </UBadge>
              <span
                v-else
                class="text-xs text-muted"
              >не создана</span>
            </td>
          </tr>
          <tr v-if="!medals?.length">
            <td
              colspan="5"
              class="px-4 py-10 text-center text-muted"
            >
              Медалей за этот месяц нет
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <!-- Pending payouts -->
    <UCard :ui="{ body: 'p-0' }">
      <div class="px-4 py-3 border-b border-subtle flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-banknote"
            class="size-4 text-orange-500"
          />
          <span class="font-semibold text-sm">Ожидают выплаты</span>
          <UBadge
            color="warning"
            variant="subtle"
            size="sm"
          >
            {{ pendingPayoutsList.length }}
          </UBadge>
        </div>
        <span class="text-sm font-bold text-orange-600 dark:text-orange-400">
          {{ totalPending.toLocaleString() }} ₸
        </span>
      </div>

      <div
        v-if="payoutsPending"
        class="flex justify-center py-10"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <table
        v-else
        class="w-full text-sm"
      >
        <thead class="border-b border-subtle">
          <tr class="text-left text-xs text-muted uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">
              Ученик
            </th>
            <th class="px-4 py-3 font-medium">
              Сумма
            </th>
            <th class="px-4 py-3 font-medium">
              Вид
            </th>
            <th class="px-4 py-3 font-medium">
              Статус
            </th>
            <th class="px-4 py-3 font-medium">
              Создано
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in pendingPayoutsList"
            :key="p.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3 font-medium">
              {{ p.studentName }} {{ p.studentSurname }}
            </td>
            <td class="px-4 py-3 text-green-600 dark:text-green-400 font-bold">
              {{ p.amount.toLocaleString() }} ₸
            </td>
            <td class="px-4 py-3 text-muted">
              {{ p.kind ?? '—' }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="payoutBadgeColor(p.status)"
                variant="subtle"
                size="sm"
              >
                {{ p.status }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(p.createdAt).toLocaleDateString('ru-RU') }}
            </td>
          </tr>
          <tr v-if="!pendingPayoutsList.length">
            <td
              colspan="5"
              class="px-4 py-10 text-center text-muted"
            >
              Нет ожидающих выплат
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
