<script setup lang="ts">
import { useDirector, useDirectorBranch, branchToId, ALL_BRANCHES } from '~/features/director-stats'
import { LEAD_SOURCE_MAP } from '~/entities/lead'

definePageMeta({ layout: 'dashboard' })

const branch = useDirectorBranch()
const { fetchReports } = useDirector()
// server:false — см. комментарий в director/index.vue: SSR $fetch к
// /api/director/* не получает auth-cookie, requireRole падает молча.
const { data, pending } = await useAsyncData(
  () => `director-reports-${branch.value}`,
  () => fetchReports(branchToId(branch.value)),
  { watch: [branch], server: false }
)
const isFiltered = computed(() => branch.value !== ALL_BRANCHES)
const leads = computed(() => data.value?.leads ?? [])
const history = computed(() => data.value?.history ?? [])

type Mode = 'day' | 'month'
const mode = ref<Mode>('month')
const now = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const day = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
const month = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)
const range = computed(() => {
  if (mode.value === 'day') {
    const from = new Date(`${day.value}T00:00:00`).getTime()
    return { from, to: from + 86400000 }
  }
  const [y, m] = month.value.split('-').map(Number)
  return { from: new Date(y!, m! - 1, 1).getTime(), to: new Date(y!, m!, 1).getTime() }
})
const inRange = (iso: string | null) => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= range.value.from && t < range.value.to
}

const processedLeads = computed(() => {
  const ids = new Set<string>()
  for (const h of history.value) if (inRange(h.changedAt)) ids.add(h.leadId)
  for (const l of leads.value) if (inRange(l.createdAt)) ids.add(l.id)
  return ids.size
})
const salesLeads = computed(() => leads.value.filter(l => inRange(l.paidAt)))
const salesAmount = computed(() => salesLeads.value.reduce((s, l) => s + (l.amount ? Number(l.amount) : 0), 0))
const trialsDone = computed(() => salesLeads.value.filter(l => l.trialSuccess === true).length)

const rows = computed(() => salesLeads.value.map(l => ({
  fullName: l.fullName,
  source: LEAD_SOURCE_MAP[l.source].label,
  trialSuccess: l.trialSuccess === true ? 'Да' : l.trialSuccess === false ? 'Нет' : '—',
  trialTeacher: l.trialTeacher,
  tariff: l.tariff ?? '—',
  firstContactAt: fmtDate(l.firstContactAt),
  paidAt: fmtDate(l.paidAt),
  amount: l.amount != null ? Number(l.amount) : 0,
  notes: l.notes ?? ''
})))
const columns = [
  { key: 'fullName', label: 'ФИО клиента' },
  { key: 'source', label: 'Источник' },
  { key: 'trialSuccess', label: 'Успешный пробный' },
  { key: 'trialTeacher', label: 'Преподаватель пробного' },
  { key: 'tariff', label: 'Тариф' },
  { key: 'firstContactAt', label: 'Первое обращение' },
  { key: 'paidAt', label: 'Дата оплаты' },
  { key: 'amount', label: 'Сумма' },
  { key: 'notes', label: 'Комментарий' }
]
const exportFilename = computed(() => `director_report_${mode.value === 'day' ? day.value : month.value}`)

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('ru-RU') : '—'
}
const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`
</script>

<template>
  <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Отчёты
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ isFiltered ? 'По филиалу' : 'Сводно по сети' }} · переключить филиал — в шапке
        </p>
      </div>
      <ExportButton
        :data="rows"
        :columns="columns"
        :filename="exportFilename"
      />
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <UButton
        :variant="mode === 'day' ? 'solid' : 'ghost'"
        :color="mode === 'day' ? 'primary' : 'neutral'"
        size="sm"
        icon="i-lucide-calendar"
        @click="mode = 'day'"
      >
        День
      </UButton>
      <UButton
        :variant="mode === 'month' ? 'solid' : 'ghost'"
        :color="mode === 'month' ? 'primary' : 'neutral'"
        size="sm"
        icon="i-lucide-calendar-range"
        @click="mode = 'month'"
      >
        Месяц
      </UButton>
      <UInput
        v-if="mode === 'day'"
        v-model="day"
        type="date"
        class="w-44"
      />
      <UInput
        v-else
        v-model="month"
        type="month"
        class="w-44"
      />
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
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Обработано лидов
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ processedLeads }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Продаж
          </p>
          <p class="text-2xl font-bold mt-1 text-primary">
            {{ salesLeads.length }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Сумма продаж
          </p>
          <p class="text-2xl font-bold mt-1 text-primary">
            {{ money(salesAmount) }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Успешных пробных
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ trialsDone }}
          </p>
        </UCard>
      </div>

      <UCard :ui="{ body: 'p-0' }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-subtle bg-muted/20 text-left">
                <th
                  v-for="c in columns"
                  :key="c.key"
                  class="px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide whitespace-nowrap"
                >
                  {{ c.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in rows"
                :key="i"
                class="border-b border-subtle last:border-0 hover:bg-muted/20"
              >
                <td class="px-3 py-2.5 font-medium whitespace-nowrap">
                  {{ r.fullName }}
                </td>
                <td class="px-3 py-2.5 text-muted whitespace-nowrap">
                  {{ r.source }}
                </td>
                <td class="px-3 py-2.5">
                  {{ r.trialSuccess }}
                </td>
                <td class="px-3 py-2.5 text-muted whitespace-nowrap">
                  {{ r.trialTeacher }}
                </td>
                <td class="px-3 py-2.5 text-muted whitespace-nowrap">
                  {{ r.tariff }}
                </td>
                <td class="px-3 py-2.5 text-muted whitespace-nowrap">
                  {{ r.firstContactAt }}
                </td>
                <td class="px-3 py-2.5 text-muted whitespace-nowrap">
                  {{ r.paidAt }}
                </td>
                <td class="px-3 py-2.5 font-semibold whitespace-nowrap">
                  {{ money(r.amount) }}
                </td>
                <td class="px-3 py-2.5 text-muted max-w-48 truncate">
                  {{ r.notes }}
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td
                  :colspan="columns.length"
                  class="px-3 py-16 text-center text-muted"
                >
                  Продаж за период нет
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
