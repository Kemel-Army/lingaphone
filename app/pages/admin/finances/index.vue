<script setup lang="ts">
import {
  useFinance,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  PAYMENT_METHODS,
  PAYMENT_METHOD_MAP,
  type PaymentWithStudent,
  type SubscriptionWithStudent,
  type SubscriptionStatus,
  type PaymentMethod,
  type PaymentStatus
} from '~/entities/finance'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const {
  fetchPayments, fetchSubscriptions, fetchStudentsLite,
  createPayment, deletePayment, createSubscription, updateSubscription, deleteSubscription
} = useFinance()

const { data, pending, refresh } = await useAsyncData('admin-finances', async () => {
  const [payments, subscriptions, students] = await Promise.all([
    fetchPayments(), fetchSubscriptions(), fetchStudentsLite()
  ])
  return { payments, subscriptions, students }
})

const payments = computed<PaymentWithStudent[]>(() => data.value?.payments ?? [])
const subscriptions = computed<SubscriptionWithStudent[]>(() => data.value?.subscriptions ?? [])
const students = computed(() => data.value?.students ?? [])
const studentOptions = computed(() =>
  students.value.map(s => ({ label: `${s.surname} ${s.name}`.trim(), value: s.id })))

// ─── Period ─────────────────────────────────────────────────────────
const now = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const month = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)
const monthRange = computed(() => {
  const [y, m] = month.value.split('-').map(Number)
  return { from: new Date(y!, m! - 1, 1).getTime(), to: new Date(y!, m!, 1).getTime() }
})
const inMonth = (iso: string | null) => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= monthRange.value.from && t < monthRange.value.to
}
const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

// ─── Metrics (ТЗ 2.6) ───────────────────────────────────────────────
const income = computed(() =>
  payments.value.filter(p => p.status === 'COMPLETED' && inMonth(p.paidAt))
    .reduce((s, p) => s + Number(p.amount), 0))

const paidSubIds = computed(() => {
  const set = new Set<string>()
  for (const p of payments.value) if (p.status === 'COMPLETED' && p.subscriptionId) set.add(p.subscriptionId)
  return set
})

const debt = computed(() =>
  subscriptions.value
    .filter(s => s.status === 'ACTIVE' && s.nextPaymentAt && new Date(s.nextPaymentAt).getTime() < todayMs)
    .reduce((s, sub) => s + Number(sub.price), 0))

const unpaidSubs = computed(() =>
  subscriptions.value.filter(s => s.status === 'ACTIVE' && !paidSubIds.value.has(s.id)))

const monthPlan = computed(() =>
  subscriptions.value.filter(s => inMonth(s.nextPaymentAt)).reduce((s, sub) => s + Number(sub.price), 0))

// ─── Tabs ───────────────────────────────────────────────────────────
const tab = ref<'payments' | 'subscriptions'>('payments')

// ─── Create payment ─────────────────────────────────────────────────
const showPayment = ref(false)
const savingPayment = ref(false)
// Reka UI Select запрещает пустую строку как value предмета — сентинел.
const NONE = '__none__'
const payForm = reactive({
  studentId: '', subscriptionId: NONE, amount: undefined as number | undefined,
  method: 'CASH' as PaymentMethod, status: 'COMPLETED' as PaymentStatus,
  paidAt: '', comment: ''
})
const subOptionsForStudent = computed(() => [
  { label: 'Без абонемента', value: NONE },
  ...subscriptions.value
    .filter(s => !payForm.studentId || s.studentId === payForm.studentId)
    .map(s => ({ label: `${s.plan} · ${Number(s.price).toLocaleString('ru-RU')} ₸`, value: s.id }))
])
const openPayment = () => {
  Object.assign(payForm, {
    studentId: '', subscriptionId: NONE, amount: undefined,
    method: 'CASH', status: 'COMPLETED', paidAt: '', comment: ''
  })
  showPayment.value = true
}
const canPay = computed(() => !!payForm.studentId && !!payForm.amount)
const submitPayment = async () => {
  if (!canPay.value) return
  savingPayment.value = true
  try {
    await createPayment({
      studentId: payForm.studentId,
      subscriptionId: payForm.subscriptionId && payForm.subscriptionId !== NONE ? payForm.subscriptionId : null,
      amount: payForm.amount!,
      method: payForm.method,
      status: payForm.status,
      paidAt: payForm.paidAt ? new Date(payForm.paidAt).toISOString() : new Date().toISOString(),
      comment: payForm.comment.trim() || null
    })
    toast.add({ title: 'Платёж добавлен', color: 'success', icon: 'i-lucide-check' })
    showPayment.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    savingPayment.value = false
  }
}

// ─── Create subscription ────────────────────────────────────────────
const showSub = ref(false)
const savingSub = ref(false)
const subForm = reactive({
  studentId: '', plan: '', course: '', price: undefined as number | undefined,
  lessonsTotal: undefined as number | undefined,
  startAt: '', endAt: '', nextPaymentAt: '', status: 'ACTIVE' as SubscriptionStatus
})
const openSub = () => {
  Object.assign(subForm, {
    studentId: '', plan: '', course: '', price: undefined, lessonsTotal: undefined,
    startAt: '', endAt: '', nextPaymentAt: '', status: 'ACTIVE'
  })
  showSub.value = true
}
const canSub = computed(() => !!subForm.studentId && subForm.plan.trim().length > 0)
const submitSub = async () => {
  if (!canSub.value) return
  savingSub.value = true
  try {
    await createSubscription({
      studentId: subForm.studentId,
      plan: subForm.plan.trim(),
      course: subForm.course.trim() || null,
      price: subForm.price ?? 0,
      lessonsTotal: subForm.lessonsTotal ?? 0,
      startAt: subForm.startAt || null,
      endAt: subForm.endAt || null,
      nextPaymentAt: subForm.nextPaymentAt || null,
      status: subForm.status
    })
    toast.add({ title: 'Абонемент создан', color: 'success', icon: 'i-lucide-check' })
    showSub.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    savingSub.value = false
  }
}

const changeSubStatus = async (sub: SubscriptionWithStudent, status: SubscriptionStatus) => {
  try {
    await updateSubscription(sub.id, { status })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}
const removeSub = async (sub: SubscriptionWithStudent) => {
  if (!confirm(`Удалить абонемент «${sub.plan}»?`)) return
  try {
    await deleteSubscription(sub.id)
    toast.add({ title: 'Удалено', color: 'success', icon: 'i-lucide-trash' })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}
const removePayment = async (p: PaymentWithStudent) => {
  if (!confirm('Удалить платёж?')) return
  try {
    await deletePayment(p.id)
    toast.add({ title: 'Удалено', color: 'success', icon: 'i-lucide-trash' })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

// ─── Helpers ────────────────────────────────────────────────────────
const errMsg = (e: unknown) => (e as { message?: string })?.message ?? String(e)
const money = (n: number | string | null) => n != null ? `${Number(n).toLocaleString('ru-RU')} ₸` : '—'
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const sName = (r: PaymentWithStudent | SubscriptionWithStudent) =>
  r.student?.user ? `${r.student.user.surname} ${r.student.user.name}`.trim() : '—'
const statusOptions = SUBSCRIPTION_STATUSES.map(s => ({ label: s.label, value: s.value }))
const methodOptions = PAYMENT_METHODS.map(m => ({ label: m.label, value: m.value }))
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Финансы
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Поступления, задолженность, абонементы
        </p>
      </div>
      <UInput
        v-model="month"
        type="month"
        class="w-44"
      />
    </div>

    <!-- Loading -->
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
      <!-- Metrics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Поступления за месяц
          </p>
          <p class="text-2xl font-bold mt-1 text-primary">
            {{ money(income) }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Дебиторская задолженность
          </p>
          <p class="text-2xl font-bold mt-1 text-error">
            {{ money(debt) }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Неоплаченные абонементы
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ unpaidSubs.length }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            План на месяц
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ money(monthPlan) }}
          </p>
        </UCard>
      </div>

      <!-- Tabs -->
      <div class="flex items-center gap-1 flex-wrap">
        <UButton
          :variant="tab === 'payments' ? 'solid' : 'ghost'"
          :color="tab === 'payments' ? 'primary' : 'neutral'"
          size="sm"
          icon="i-lucide-banknote"
          @click="tab = 'payments'"
        >
          Платежи
        </UButton>
        <UButton
          :variant="tab === 'subscriptions' ? 'solid' : 'ghost'"
          :color="tab === 'subscriptions' ? 'primary' : 'neutral'"
          size="sm"
          icon="i-lucide-ticket"
          @click="tab = 'subscriptions'"
        >
          Абонементы
        </UButton>
        <div class="flex-1" />
        <UButton
          v-if="tab === 'payments'"
          icon="i-lucide-plus"
          size="sm"
          @click="openPayment"
        >
          Платёж
        </UButton>
        <UButton
          v-else
          icon="i-lucide-plus"
          size="sm"
          @click="openSub"
        >
          Абонемент
        </UButton>
      </div>

      <!-- Payments table -->
      <UCard
        v-if="tab === 'payments'"
        :ui="{ body: 'p-0' }"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-subtle bg-muted/20 text-left">
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Ученик
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Сумма
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Способ
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Статус
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Дата
                </th>
                <th class="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in payments"
                :key="p.id"
                class="border-b border-subtle last:border-0 hover:bg-muted/20"
              >
                <td class="px-4 py-3 font-medium">
                  {{ sName(p) }}
                </td>
                <td class="px-4 py-3 font-semibold">
                  {{ money(p.amount) }}
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ PAYMENT_METHOD_MAP[p.method].label }}
                </td>
                <td class="px-4 py-3">
                  <UBadge
                    :color="PAYMENT_STATUS_MAP[p.status].color"
                    variant="subtle"
                    size="sm"
                  >
                    {{ PAYMENT_STATUS_MAP[p.status].label }}
                  </UBadge>
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ fmtDate(p.paidAt) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    color="error"
                    size="sm"
                    @click="removePayment(p)"
                  />
                </td>
              </tr>
              <tr v-if="!payments.length">
                <td
                  colspan="6"
                  class="px-4 py-16 text-center text-muted"
                >
                  Платежей пока нет
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Subscriptions table -->
      <UCard
        v-else
        :ui="{ body: 'p-0' }"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-subtle bg-muted/20 text-left">
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Ученик
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Абонемент
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Цена
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Уроки
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  След. оплата
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Статус
                </th>
                <th class="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in subscriptions"
                :key="s.id"
                class="border-b border-subtle last:border-0 hover:bg-muted/20"
              >
                <td class="px-4 py-3 font-medium">
                  {{ sName(s) }}
                </td>
                <td class="px-4 py-3">
                  {{ s.plan }}<span
                    v-if="s.course"
                    class="text-muted"
                  > · {{ s.course }}</span>
                </td>
                <td class="px-4 py-3 font-semibold">
                  {{ money(s.price) }}
                </td>
                <td class="px-4 py-3 text-muted tabular-nums">
                  {{ s.lessonsUsed }}/{{ s.lessonsTotal }}
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ fmtDate(s.nextPaymentAt) }}
                </td>
                <td class="px-4 py-3">
                  <UBadge
                    :color="SUBSCRIPTION_STATUS_MAP[s.status].color"
                    variant="subtle"
                    size="sm"
                  >
                    {{ SUBSCRIPTION_STATUS_MAP[s.status].label }}
                  </UBadge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <USelect
                      :model-value="s.status"
                      :items="statusOptions"
                      size="sm"
                      class="w-36"
                      @update:model-value="(v: unknown) => changeSubStatus(s, v as SubscriptionStatus)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      variant="ghost"
                      color="error"
                      size="sm"
                      @click="removeSub(s)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="!subscriptions.length">
                <td
                  colspan="7"
                  class="px-4 py-16 text-center text-muted"
                >
                  Абонементов пока нет
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>

    <!-- ─── Payment modal ─────────────────────────────────────────── -->
    <UModal
      v-model:open="showPayment"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              Новый платёж
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showPayment = false"
            />
          </div>
          <UDivider />
          <UFormField
            label="Ученик"
            required
          >
            <USelect
              v-model="payForm.studentId"
              :items="studentOptions"
              placeholder="Выберите ученика"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Абонемент">
            <USelect
              v-model="payForm.subscriptionId"
              :items="subOptionsForStudent"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Сумма, ₸"
              required
            >
              <UInput
                v-model.number="payForm.amount"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Способ">
              <USelect
                v-model="payForm.method"
                :items="methodOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Дата">
              <UInput
                v-model="payForm.paidAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Комментарий">
            <UInput
              v-model="payForm.comment"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showPayment = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canPay || savingPayment"
              :loading="savingPayment"
              icon="i-lucide-plus"
              @click="submitPayment"
            >
              Добавить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ─── Subscription modal ────────────────────────────────────── -->
    <UModal
      v-model:open="showSub"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #content>
        <div class="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              Новый абонемент
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showSub = false"
            />
          </div>
          <UDivider />
          <UFormField
            label="Ученик"
            required
          >
            <USelect
              v-model="subForm.studentId"
              :items="studentOptions"
              placeholder="Выберите ученика"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Название"
              required
            >
              <UInput
                v-model="subForm.plan"
                placeholder="8 уроков / мес"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Курс">
              <UInput
                v-model="subForm.course"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Цена, ₸">
              <UInput
                v-model.number="subForm.price"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Всего уроков">
              <UInput
                v-model.number="subForm.lessonsTotal"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Начало">
              <UInput
                v-model="subForm.startAt"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Окончание">
              <UInput
                v-model="subForm.endAt"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="След. оплата">
              <UInput
                v-model="subForm.nextPaymentAt"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Статус">
              <USelect
                v-model="subForm.status"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showSub = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canSub || savingSub"
              :loading="savingSub"
              icon="i-lucide-plus"
              @click="submitSub"
            >
              Создать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
