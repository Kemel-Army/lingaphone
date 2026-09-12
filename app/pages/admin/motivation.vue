<script setup lang="ts">
/**
 * Мотивация — сводная за месяц (замена Google-таблицы «Сводные по мотивашке»).
 *
 * Учитель ставит 5 оценок за урок в дневнике, менеджер здесь отмечает три
 * своих параметра (Instagram / оплата вовремя / книги) и кол-во занятий по
 * абонементу. Средний балл, медаль и бонус считаются автоматически; кнопка
 * «Зафиксировать месяц» записывает результат в историю медалей.
 */
import {
  useMotivation,
  MEDAL_MAP,
  MEDALS,
  currentMonthKey,
  formatMonth,
  type MotivationRow
} from '~/entities/motivation'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchSummary, saveManagerInputs, recompute } = useMotivation()

const month = ref(currentMonthKey())
const search = ref('')

const { data: summary, pending, refresh } = await useAsyncData(
  'admin-motivation',
  () => fetchSummary(month.value),
  { watch: [month] }
)

const monthOptions = computed(() => {
  const out: { value: string, label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ value: key, label: formatMonth(key) })
  }
  return out
})

const rows = computed<MotivationRow[]>(() => {
  const all = summary.value?.rows ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return all
  return all.filter(r => `${r.fullName} ${r.groupName}`.toLowerCase().includes(q))
})

const totals = computed(() => summary.value?.totals ?? { bronze: 0, silver: 0, gold: 0, none: 0, payout: 0 })

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`

// ─── Правка менеджерских параметров ─────────────────────────────────────────
const savingId = ref<string | null>(null)

/**
 * Оптимистично двигаем локальную строку, чтобы галочка не «прыгала», но
 * средний балл берём с сервера — считает он, а не UI.
 */
const patchRow = async (row: MotivationRow, patch: Partial<MotivationRow>) => {
  savingId.value = row.studentId
  const next = { ...row, ...patch }
  try {
    await saveManagerInputs({
      month: month.value,
      studentId: row.studentId,
      instagram: next.instagram,
      paidOnTime: next.paidOnTime,
      books: next.books,
      subscriptionLessons: next.subscriptionLessons
    })
    await refresh()
    // Дальше показываем то, что реально лежит в базе, а не черновик поля.
    subscriptionDrafts.delete(row.studentId)
  } catch (e: unknown) {
    toast.add({
      title: 'Не удалось сохранить',
      description: (e as { data?: { message?: string } })?.data?.message ?? String(e),
      color: 'error',
      icon: 'i-lucide-x'
    })
  } finally {
    savingId.value = null
  }
}

/**
 * Кол-во занятий по абонементу правится прямо в таблице. Сохраняем по
 * `update:model-value` с задержкой, а не по blur: набор «12» иначе улетал бы
 * в сеть дважды, а на потерю фокуса полагаться нельзя — менеджер часто уходит
 * со строки кликом по чекбоксу соседней.
 */
const subscriptionDrafts = reactive(new Map<string, number>())
const subscriptionTimers: Record<string, ReturnType<typeof setTimeout>> = {}

const subscriptionValue = (row: MotivationRow) =>
  subscriptionDrafts.get(row.studentId) ?? row.subscriptionLessons

const onSubscriptionInput = (row: MotivationRow, value: unknown) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 100) return

  const next = Math.round(n)
  subscriptionDrafts.set(row.studentId, next)
  clearTimeout(subscriptionTimers[row.studentId])

  if (next === row.subscriptionLessons) return
  subscriptionTimers[row.studentId] = setTimeout(() => {
    patchRow(row, { subscriptionLessons: next })
  }, 600)
}

onBeforeUnmount(() => {
  for (const t of Object.values(subscriptionTimers)) clearTimeout(t)
})

// ─── Фиксация месяца ────────────────────────────────────────────────────────
const confirmOpen = ref(false)
const awardCoins = ref(true)
const confirming = ref(false)

const confirmMonth = async () => {
  confirming.value = true
  try {
    const res = await recompute(month.value, awardCoins.value)
    toast.add({
      title: `Месяц зафиксирован: ${res.saved} учеников`,
      description: res.coinsAwarded ? `Linga Coins начислены: ${res.coinsAwarded}` : undefined,
      color: 'success',
      icon: 'i-lucide-check'
    })
    confirmOpen.value = false
  } catch (e: unknown) {
    toast.add({
      title: 'Ошибка пересчёта',
      description: (e as { data?: { message?: string } })?.data?.message ?? String(e),
      color: 'error',
      icon: 'i-lucide-x'
    })
  } finally {
    confirming.value = false
  }
}
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
          Средний балл, медаль и бонус за {{ formatMonth(month) }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск ученика…"
          class="min-w-48"
        />
        <USelect
          v-model="month"
          :items="monthOptions"
          icon="i-lucide-calendar"
          class="min-w-44"
        />
        <UButton
          icon="i-lucide-lock"
          color="primary"
          @click="confirmOpen = true"
        >
          Зафиксировать месяц
        </UButton>
      </div>
    </div>

    <!-- Итоги -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div
        v-for="m in MEDALS.filter(x => x.value !== 'NONE')"
        :key="m.value"
        class="rounded-xl border border-default p-3"
      >
        <p class="text-xs text-muted">
          {{ m.emoji }} {{ m.label }}
        </p>
        <p class="text-2xl font-bold mt-0.5">
          {{ m.value === 'BRONZE' ? totals.bronze : m.value === 'SILVER' ? totals.silver : totals.gold }}
        </p>
        <p class="text-[11px] text-muted">
          {{ money(m.payout) }} каждому
        </p>
      </div>
      <div class="rounded-xl border border-default p-3">
        <p class="text-xs text-muted">
          Без медали
        </p>
        <p class="text-2xl font-bold mt-0.5">
          {{ totals.none }}
        </p>
      </div>
      <div class="rounded-xl border border-primary/40 bg-primary/5 p-3">
        <p class="text-xs text-muted">
          Итого бонусов
        </p>
        <p class="text-2xl font-bold mt-0.5 text-primary">
          {{ money(totals.payout) }}
        </p>
      </div>
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
      <p class="text-sm text-muted mt-1">
        Нужны уроки в этом месяце и ученики в группах
      </p>
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-2xl border border-default"
    >
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-elevated/50 text-xs">
            <th class="sticky left-0 z-10 bg-elevated/95 backdrop-blur px-3 py-2 text-left font-semibold min-w-52">
              ФИО
            </th>
            <th class="px-2 py-2 text-left font-medium">
              Группа
            </th>
            <th
              class="px-2 py-2 text-center font-medium"
              title="Сумма оценок учителя за месяц"
            >
              Σ оценок
            </th>
            <th
              class="px-2 py-2 text-center font-medium"
              title="Среднее кол-во оценок на посещённый урок — должно быть 5"
            >
              Оценок/урок
            </th>
            <th class="px-2 py-2 text-center font-medium">
              Посетил
            </th>
            <th
              class="px-2 py-2 text-center font-medium"
              title="Занятий по абонементу в месяц"
            >
              Абонемент
            </th>
            <th class="px-2 py-2 text-center font-medium">
              Instagram
            </th>
            <th class="px-2 py-2 text-center font-medium">
              Оплата
            </th>
            <th class="px-2 py-2 text-center font-medium">
              Книги
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
            <td class="sticky left-0 z-10 bg-default/95 backdrop-blur px-3 py-2 font-medium">
              {{ r.fullName }}
              <span
                v-if="!r.participates"
                class="ml-1 text-[10px] uppercase tracking-wide text-muted"
              >не участвует</span>
            </td>
            <td class="px-2 py-2 text-muted text-xs">
              {{ r.groupName }}
            </td>
            <td class="px-2 py-2 text-center tabular-nums">
              {{ r.gradeSum }}
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
            <td class="px-2 py-2 text-center">
              <UInput
                :model-value="subscriptionValue(r)"
                type="number"
                size="xs"
                :min="0"
                :max="100"
                class="w-16 mx-auto"
                @update:model-value="onSubscriptionInput(r, $event)"
              />
            </td>
            <td class="px-2 py-2 text-center">
              <UCheckbox
                :model-value="r.instagram"
                :disabled="savingId === r.studentId"
                @update:model-value="patchRow(r, { instagram: !r.instagram })"
              />
            </td>
            <td class="px-2 py-2 text-center">
              <UCheckbox
                :model-value="r.paidOnTime"
                :disabled="savingId === r.studentId"
                @update:model-value="patchRow(r, { paidOnTime: !r.paidOnTime })"
              />
            </td>
            <td class="px-2 py-2 text-center">
              <UCheckbox
                :model-value="r.books"
                :disabled="savingId === r.studentId"
                @update:model-value="patchRow(r, { books: !r.books })"
              />
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

    <div class="rounded-xl border border-default p-4 text-xs text-muted space-y-1">
      <p class="font-semibold text-default">
        Как считается
      </p>
      <p>
        (Σ оценок учителя ÷ кол-во занятий + Instagram + оплата + книги) ÷ 8.
        Кол-во занятий = максимум из «посетил» и «абонемент». Каждый
        менеджерский параметр даёт 5 баллов.
      </p>
      <p>
        🥉 Бронза 2.7–3.8 → 1 000 ₸ · 🥈 Серебро 3.8–4.6 → 3 000 ₸ ·
        🥇 Золото 4.6–5.0 → 5 000 ₸. Без отметки «оплата вовремя» ученик в
        мотивации не участвует.
      </p>
    </div>

    <UModal
      v-model:open="confirmOpen"
      title="Зафиксировать месяц"
      :description="formatMonth(month)"
    >
      <template #body>
        <div class="space-y-3 text-sm">
          <p>
            Итоги будут записаны в историю медалей учеников. Повторная фиксация
            перезапишет результат этого месяца.
          </p>
          <UCheckbox
            v-model="awardCoins"
            label="Начислить Linga Coins за медали (1 монета за 100 ₸)"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="confirmOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            :loading="confirming"
            icon="i-lucide-check"
            @click="confirmMonth"
          >
            Зафиксировать
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
