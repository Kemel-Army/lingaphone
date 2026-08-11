<script setup lang="ts">
import { LeadFunnelBoard } from '~/widgets/lead-funnel'
import { WazzupPanel } from '~/widgets/wazzup'
import { useCurrentUser } from '~/entities/user'
import {
  useLeads,
  LEAD_STAGES,
  LEAD_STAGE_MAP,
  LEAD_SOURCES,
  LEAD_SOURCE_MAP,
  type LeadWithRelations,
  type LeadStage,
  type LeadSource,
  type LeadStageHistoryRow
} from '~/entities/lead'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { internalId } = useCurrentUser()
const {
  fetchLeads, createLead, updateLead, moveStage,
  claimLead, deleteLead, fetchStageHistory, fetchAdmins, fetchBranches,
  convertToStudent: convertLeadToStudent
} = useLeads()

const { data, pending, refresh } = await useAsyncData('admin-leads', async () => {
  const [leads, admins, branches] = await Promise.all([fetchLeads(), fetchAdmins(), fetchBranches()])
  return { leads, admins, branches }
})

// Лиды со stage=ACTIVE («Активный ученик») уже сконвертированы — их место
// в разделе «Ученики», не здесь (см. changeStage/convert-modal ниже).
const leads = computed<LeadWithRelations[]>(() => (data.value?.leads ?? []).filter(l => l.stage !== 'ACTIVE'))
const admins = computed(() => data.value?.admins ?? [])
const branches = computed(() => data.value?.branches ?? [])

// Reka UI (Nuxt UI v4 Select) запрещает пустую строку как value предмета —
// используем сентинел и мапим его в null.
const NONE = '__none__'
const noneToNull = (v: string): string | null => (v && v !== NONE ? v : null)

const adminOptions = computed(() => [
  { label: 'Не назначен', value: NONE },
  ...admins.value.map(a => ({ label: `${a.surname} ${a.name}`.trim(), value: a.id }))
])
const branchOptions = computed(() => [
  { label: 'Без филиала', value: NONE },
  ...branches.value.map(b => ({ label: b.name, value: b.id }))
])
const sourceOptions = LEAD_SOURCES.map(s => ({ label: s.label, value: s.value }))
const stageOptions = LEAD_STAGES.map(s => ({ label: s.label, value: s.value }))

// ─── Tabs ───────────────────────────────────────────────────────────
// «Клиенты» убрана — сконвертированные (stage=ACTIVE) лиды теперь живут
// только в разделе «Ученики», see leads computed above.
type Tab = 'funnel' | 'list' | 'mine'
const tab = ref<Tab>('funnel')
const tabs: { value: Tab, label: string, icon: string }[] = [
  { value: 'funnel', label: 'Воронка', icon: 'i-lucide-columns-3' },
  { value: 'list', label: 'Список', icon: 'i-lucide-list' },
  { value: 'mine', label: 'Я ответственный', icon: 'i-lucide-user-check' }
]

const listLeads = computed(() => {
  if (tab.value === 'mine') return leads.value.filter(l => l.responsibleId === internalId.value)
  return leads.value
})

const mineCount = computed(() => leads.value.filter(l => l.responsibleId === internalId.value).length)

// ─── Create ─────────────────────────────────────────────────────────
const showCreate = ref(false)
const creating = ref(false)
const form = reactive({
  fullName: '', phone: '', email: '', source: 'OTHER' as LeadSource,
  stage: 'NEW' as LeadStage, responsibleId: NONE, branchId: NONE,
  tariff: '', amount: undefined as number | undefined,
  trialLessonAt: '', notes: ''
})
const resetForm = () => Object.assign(form, {
  fullName: '', phone: '', email: '', source: 'OTHER', stage: 'NEW',
  responsibleId: internalId.value ?? NONE, branchId: NONE, tariff: '',
  amount: undefined, trialLessonAt: '', notes: ''
})
const openCreate = () => {
  resetForm()
  showCreate.value = true
}
const canCreate = computed(() => form.fullName.trim().length > 0)

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    await createLead({
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      source: form.source,
      stage: form.stage,
      responsibleId: noneToNull(form.responsibleId),
      branchId: noneToNull(form.branchId),
      tariff: form.tariff.trim() || null,
      amount: form.amount ?? null,
      trialLessonAt: form.trialLessonAt ? new Date(form.trialLessonAt).toISOString() : null,
      notes: form.notes.trim() || null
    })
    toast.add({ title: 'Лид создан', color: 'success', icon: 'i-lucide-check' })
    showCreate.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    creating.value = false
  }
}

// ─── Detail slideover ───────────────────────────────────────────────
const selected = ref<LeadWithRelations | null>(null)
const history = ref<LeadStageHistoryRow[]>([])
const savingDetail = ref(false)
const edit = reactive({
  fullName: '', phone: '', email: '', source: 'OTHER' as LeadSource,
  responsibleId: '', branchId: '', tariff: '',
  amount: undefined as number | undefined, trialLessonAt: '', notes: ''
})

const openDetail = async (lead: LeadWithRelations) => {
  selected.value = lead
  Object.assign(edit, {
    fullName: lead.fullName,
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    source: lead.source,
    responsibleId: lead.responsibleId ?? NONE,
    branchId: lead.branchId ?? NONE,
    tariff: lead.tariff ?? '',
    amount: lead.amount != null ? Number(lead.amount) : undefined,
    trialLessonAt: lead.trialLessonAt ? lead.trialLessonAt.slice(0, 10) : '',
    notes: lead.notes ?? ''
  })
  history.value = []
  try {
    history.value = await fetchStageHistory(lead.id)
  } catch { /* ignore history load errors */ }
}
const closeDetail = () => {
  selected.value = null
}

// WhatsApp/мессенджер чат по телефону лида (Wazzup, path A).
const chatOpen = ref(false)
const chatPhone = computed(() => (selected.value?.phone ?? '').replace(/\D/g, ''))

const saveDetail = async () => {
  if (!selected.value) return
  savingDetail.value = true
  try {
    await updateLead(selected.value.id, {
      fullName: edit.fullName.trim(),
      phone: edit.phone.trim() || null,
      email: edit.email.trim() || null,
      source: edit.source,
      responsibleId: noneToNull(edit.responsibleId),
      branchId: noneToNull(edit.branchId),
      tariff: edit.tariff.trim() || null,
      amount: edit.amount ?? null,
      trialLessonAt: edit.trialLessonAt ? new Date(edit.trialLessonAt).toISOString() : null,
      notes: edit.notes.trim() || null
    })
    toast.add({ title: 'Сохранено', color: 'success', icon: 'i-lucide-check' })
    closeDetail()
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    savingDetail.value = false
  }
}

const changeStage = async (lead: LeadWithRelations, toStage: LeadStage) => {
  // Перевод в «Активный ученик» = реальная конвертация лида в аккаунт
  // ученика (иначе лид просто исчезнет из вида, а Student не появится).
  if (toStage === 'ACTIVE' && !lead.convertedStudentId) {
    openConvert(lead)
    return
  }
  try {
    await moveStage(lead, toStage)
    const label = LEAD_STAGE_MAP[toStage].label
    toast.add({ title: `Этап: ${label}`, color: 'success', icon: 'i-lucide-check' })
    if (selected.value?.id === lead.id) {
      selected.value = { ...selected.value, stage: toStage }
      history.value = await fetchStageHistory(lead.id)
    }
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

// ─── Convert to student ───────────────────────────────────────────────
// «Оплата → Активный ученик → автоматически во вкладку Клиенты» (ТЗ):
// клиент = реальный Student-аккаунт, а не просто смена stage.
const showConvert = ref(false)
const convertTarget = ref<LeadWithRelations | null>(null)
const converting = ref(false)
const convertShowPassword = ref(false)
const convertForm = reactive({ name: '', surname: '', email: '', password: '', phone: '' })

const openConvert = (lead: LeadWithRelations) => {
  const parts = lead.fullName.trim().split(/\s+/)
  convertTarget.value = lead
  convertForm.name = parts[0] ?? lead.fullName
  convertForm.surname = parts.slice(1).join(' ') || parts[0] || ''
  convertForm.email = lead.email ?? ''
  convertForm.phone = lead.phone ?? ''
  convertForm.password = Array.from({ length: 10 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'[Math.floor(Math.random() * 60)]
  ).join('')
  showConvert.value = true
}
const canConvert = computed(() =>
  convertForm.name.trim() && convertForm.surname.trim() && convertForm.email.trim() && convertForm.password.length >= 6
)

const submitConvert = async () => {
  if (!convertTarget.value || !canConvert.value) return
  converting.value = true
  try {
    // Один атомарный вызов вместо createStudent() + moveStage(): при падении
    // второго шага аккаунт уже существовал, лид оставался несконвертированным,
    // и повторная попытка плодила дубль ученика с занятым email.
    await convertLeadToStudent(convertTarget.value.id, {
      name: convertForm.name.trim(),
      surname: convertForm.surname.trim(),
      email: convertForm.email.trim(),
      password: convertForm.password,
      phone: convertForm.phone.trim() || undefined
    })
    toast.add({ title: 'Ученик создан, лид переведён в «Активный ученик»', color: 'success', icon: 'i-lucide-check' })
    showConvert.value = false
    if (selected.value?.id === convertTarget.value.id) closeDetail()
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    converting.value = false
  }
}

const claim = async (lead: LeadWithRelations) => {
  try {
    await claimLead(lead.id)
    toast.add({ title: 'Закреплено за вами', color: 'success', icon: 'i-lucide-user-check' })
    closeDetail()
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

const removeLead = async (lead: LeadWithRelations) => {
  if (!confirm(`Удалить лид «${lead.fullName}»?`)) return
  try {
    await deleteLead(lead.id)
    toast.add({ title: 'Лид удалён', color: 'success', icon: 'i-lucide-trash' })
    closeDetail()
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

// ─── Helpers ────────────────────────────────────────────────────────
const errMsg = (e: unknown) =>
  (e as { message?: string })?.message ?? String(e)
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const fmtDateTime = (d: string | null) => d
  ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '—'
const money = (n: number | string | null) => n != null ? `${Number(n).toLocaleString('ru-RU')} ₸` : '—'
const respName = (l: LeadWithRelations) => l.responsible ? `${l.responsible.surname} ${l.responsible.name}`.trim() : '—'
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-full mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Лиды
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ leads.length }} всего · воронка продаж
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Новый лид
      </UButton>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 flex-wrap">
      <UButton
        v-for="t in tabs"
        :key="t.value"
        :icon="t.icon"
        :variant="tab === t.value ? 'solid' : 'ghost'"
        :color="tab === t.value ? 'primary' : 'neutral'"
        size="sm"
        @click="tab = t.value"
      >
        {{ t.label }}
        <UBadge
          v-if="t.value === 'mine' && mineCount"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ mineCount }}
        </UBadge>
      </UButton>
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
      <!-- Funnel board -->
      <LeadFunnelBoard
        v-if="tab === 'funnel'"
        :leads="leads"
        @move="changeStage($event.lead, $event.toStage)"
        @open="openDetail"
      />

      <!-- List / Mine / Clients table -->
      <UCard
        v-else
        :ui="{ body: 'p-0' }"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-subtle bg-muted/20 text-left">
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Имя
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Телефон
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Источник
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Этап
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Ответственный
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Сумма
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Создан
                </th>
                <th class="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lead in listLeads"
                :key="lead.id"
                class="border-b border-subtle last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                @click="openDetail(lead)"
              >
                <td class="px-4 py-3 font-semibold">
                  {{ lead.fullName }}
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ lead.phone ?? '—' }}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 text-muted">
                    <UIcon
                      :name="LEAD_SOURCE_MAP[lead.source].icon"
                      class="size-4"
                    />
                    {{ LEAD_SOURCE_MAP[lead.source].label }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <UBadge
                    :color="LEAD_STAGE_MAP[lead.stage].color"
                    variant="subtle"
                    size="sm"
                  >
                    {{ LEAD_STAGE_MAP[lead.stage].label }}
                  </UBadge>
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ respName(lead) }}
                </td>
                <td class="px-4 py-3 font-medium">
                  {{ money(lead.amount) }}
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ fmtDate(lead.createdAt) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 text-muted"
                  />
                </td>
              </tr>
              <tr v-if="!listLeads.length">
                <td
                  colspan="8"
                  class="px-4 py-16 text-center text-muted"
                >
                  {{ tab === 'mine' ? 'Нет закреплённых за вами лидов' : 'Лидов пока нет' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>

    <!-- ─── Create modal ──────────────────────────────────────────── -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              Новый лид
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showCreate = false"
            />
          </div>
          <UDivider />

          <UFormField
            label="ФИО / Имя"
            required
          >
            <UInput
              v-model="form.fullName"
              placeholder="Айгерим Сатыбалды"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Телефон">
              <UInput
                v-model="form.phone"
                placeholder="+7 777 000 00 00"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Email">
              <UInput
                v-model="form.email"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Источник">
              <USelect
                v-model="form.source"
                :items="sourceOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Этап">
              <USelect
                v-model="form.stage"
                :items="stageOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Ответственный">
              <USelect
                v-model="form.responsibleId"
                :items="adminOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Филиал">
              <USelect
                v-model="form.branchId"
                :items="branchOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Тариф / курс">
              <UInput
                v-model="form.tariff"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Сумма, ₸">
              <UInput
                v-model.number="form.amount"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Дата пробного">
              <UInput
                v-model="form.trialLessonAt"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Комментарий">
            <UTextarea
              v-model="form.notes"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showCreate = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canCreate || creating"
              :loading="creating"
              icon="i-lucide-plus"
              @click="submitCreate"
            >
              Создать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ─── Detail slideover ──────────────────────────────────────── -->
    <USlideover
      :open="!!selected"
      side="right"
      :ui="{ content: 'max-w-xl' }"
      @update:open="(v: boolean) => { if (!v) closeDetail() }"
    >
      <template #content>
        <div
          v-if="selected"
          class="p-6 space-y-5 h-full overflow-y-auto"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold">
                {{ selected.fullName }}
              </h2>
              <p class="text-sm text-muted">
                Создан {{ fmtDate(selected.createdAt) }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="closeDetail"
            />
          </div>

          <!-- Stage picker -->
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge
              :color="LEAD_STAGE_MAP[selected.stage].color"
              variant="subtle"
            >
              {{ LEAD_STAGE_MAP[selected.stage].label }}
            </UBadge>
            <USelect
              :model-value="selected.stage"
              :items="stageOptions"
              size="sm"
              class="w-56"
              @update:model-value="(v: unknown) => selected && changeStage(selected, v as LeadStage)"
            />
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <UButton
              icon="i-lucide-user-check"
              size="sm"
              variant="soft"
              :disabled="selected.responsibleId === internalId"
              @click="selected && claim(selected)"
            >
              Закрепить за собой
            </UButton>
            <UButton
              v-if="selected.phone"
              icon="i-simple-icons-whatsapp"
              size="sm"
              variant="soft"
              color="success"
              @click="chatOpen = true"
            >
              Чат
            </UButton>
            <UButton
              icon="i-lucide-trash-2"
              size="sm"
              variant="soft"
              color="error"
              @click="selected && removeLead(selected)"
            >
              Удалить
            </UButton>
          </div>

          <UDivider />

          <!-- Editable fields -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="ФИО"
              class="col-span-2"
            >
              <UInput
                v-model="edit.fullName"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Телефон">
              <UInput
                v-model="edit.phone"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Email">
              <UInput
                v-model="edit.email"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Источник">
              <USelect
                v-model="edit.source"
                :items="sourceOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Ответственный">
              <USelect
                v-model="edit.responsibleId"
                :items="adminOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Филиал">
              <USelect
                v-model="edit.branchId"
                :items="branchOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Тариф / курс">
              <UInput
                v-model="edit.tariff"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Сумма, ₸">
              <UInput
                v-model.number="edit.amount"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Дата пробного">
              <UInput
                v-model="edit.trialLessonAt"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Комментарий">
            <UTextarea
              v-model="edit.notes"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end">
            <UButton
              :loading="savingDetail"
              icon="i-lucide-save"
              @click="saveDetail"
            >
              Сохранить
            </UButton>
          </div>

          <UDivider />

          <!-- Stage history -->
          <div>
            <p class="text-sm font-semibold mb-2 flex items-center gap-2">
              <UIcon
                name="i-lucide-history"
                class="size-4"
              />
              История этапов
            </p>
            <div
              v-if="history.length"
              class="space-y-2"
            >
              <div
                v-for="h in history"
                :key="h.id"
                class="flex items-center gap-2 text-xs text-muted"
              >
                <span class="tabular-nums">{{ fmtDateTime(h.changedAt) }}</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3"
                />
                <UBadge
                  :color="LEAD_STAGE_MAP[h.toStage].color"
                  variant="subtle"
                  size="sm"
                >
                  {{ LEAD_STAGE_MAP[h.toStage].label }}
                </UBadge>
              </div>
            </div>
            <p
              v-else
              class="text-xs text-muted"
            >
              Пока нет изменений
            </p>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- ─── WhatsApp / мессенджер (Wazzup) ────────────────────────── -->
    <UModal
      v-model:open="chatOpen"
      :ui="{ content: 'max-w-3xl' }"
    >
      <template #content>
        <div class="p-4 h-[70vh] flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold flex items-center gap-2">
              <UIcon
                name="i-simple-icons-whatsapp"
                class="size-5 text-green-500"
              />
              {{ selected?.fullName }}
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="chatOpen = false"
            />
          </div>
          <div class="flex-1 min-h-0">
            <WazzupPanel
              v-if="chatOpen"
              scope="card"
              chat-type="whatsapp"
              :chat-id="chatPhone"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- ─── Convert to student modal ──────────────────────────────── -->
    <UModal
      v-model:open="showConvert"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Конвертировать в ученика
              </h2>
              <p class="text-sm text-muted mt-0.5">
                Создаётся аккаунт ученика, лид переходит в «Активный ученик» и исчезает из «Лидов»
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showConvert = false"
            />
          </div>
          <UDivider />

          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Имя"
              required
            >
              <UInput
                v-model="convertForm.name"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Фамилия"
              required
            >
              <UInput
                v-model="convertForm.surname"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Телефон">
            <UInput
              v-model="convertForm.phone"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Email"
            required
            hint="Логин для входа в личный кабинет"
          >
            <UInput
              v-model="convertForm.email"
              type="email"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Пароль"
            required
            hint="Минимум 6 символов"
          >
            <div class="flex gap-2">
              <UInput
                v-model="convertForm.password"
                :type="convertShowPassword ? 'text' : 'password'"
                class="flex-1"
              />
              <UButton
                :icon="convertShowPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                variant="ghost"
                color="neutral"
                @click="convertShowPassword = !convertShowPassword"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showConvert = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canConvert || converting"
              :loading="converting"
              icon="i-lucide-user-check"
              @click="submitConvert"
            >
              Создать ученика
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
