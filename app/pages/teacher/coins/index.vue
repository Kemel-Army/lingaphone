<script setup lang="ts">
import { useTeacher, type TeacherStudent } from '~/entities/teacher'
import { useLingaCoins, AWARD_REASONS, coinMedal, type LingaCoinReason } from '~/entities/linga-coin'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchMyStudents } = useTeacher()
const { award, fetchBalancesFor } = useLingaCoins()

const { data, pending, refresh } = await useAsyncData('teacher-coins', async () => {
  const students = await fetchMyStudents()
  const ids = [...new Set(students.map(s => s.studentId))]
  const balances = Object.fromEntries(await fetchBalancesFor(ids))
  return { students, balances }
})

const students = computed<TeacherStudent[]>(() => data.value?.students ?? [])
const balances = computed<Record<string, number>>(() => data.value?.balances ?? {})
const balanceOf = (id: string) => balances.value[id] ?? 0

const search = ref('')
const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  const list = students.value
  // Уникальные ученики (один может быть в нескольких группах).
  const seen = new Set<string>()
  const uniq = list.filter(s => !seen.has(s.studentId) && seen.add(s.studentId))
  if (!q) return uniq
  return uniq.filter(s => `${s.name} ${s.surname} ${s.groupName}`.toLowerCase().includes(q))
})

// ─── Award modal ────────────────────────────────────────────────────
const show = ref(false)
const saving = ref(false)
const target = ref<TeacherStudent | null>(null)
const form = reactive({ reason: 'BEHAVIOR' as LingaCoinReason, amount: 10, note: '' })
const reasonOptions = AWARD_REASONS.map(r => ({ label: r.label, value: r.value }))

const openAward = (s: TeacherStudent) => {
  target.value = s
  form.reason = 'BEHAVIOR'
  form.amount = 10
  form.note = ''
  show.value = true
}
const canAward = computed(() => !!target.value && Number.isFinite(form.amount) && form.amount !== 0)

const submit = async () => {
  if (!target.value || !canAward.value) return
  saving.value = true
  try {
    await award({
      studentId: target.value.studentId,
      delta: form.amount,
      reason: form.reason,
      note: form.note.trim() || null
    })
    toast.add({ title: `+${form.amount} Linga Coins`, color: 'success', icon: 'i-lucide-coins' })
    show.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: (e as { message?: string })?.message ?? String(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    saving.value = false
  }
}

const medalEmoji = (id: string) => coinMedal(balanceOf(id)).current?.emoji ?? ''
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-coins"
            class="size-6 text-yellow-500"
          />
          Linga Coins
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Начисление монет ученикам за поведение и активность
        </p>
      </div>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Поиск ученика..."
        class="w-56"
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
                Группа
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Баланс
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in filtered"
              :key="s.studentId"
              class="border-b border-subtle last:border-0 hover:bg-muted/20"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span
                    v-if="medalEmoji(s.studentId)"
                    class="text-base"
                  >{{ medalEmoji(s.studentId) }}</span>
                  <span class="font-medium">{{ s.surname }} {{ s.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ s.groupName }}
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 font-semibold">
                  <UIcon
                    name="i-lucide-coins"
                    class="size-3.5 text-yellow-500"
                  />
                  {{ balanceOf(s.studentId).toLocaleString('ru-RU') }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-plus"
                  size="sm"
                  variant="soft"
                  @click="openAward(s)"
                >
                  Начислить
                </UButton>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td
                colspan="4"
                class="px-4 py-16 text-center text-muted"
              >
                Учеников нет
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Award modal -->
    <UModal
      v-model:open="show"
      :ui="{ content: 'max-w-md' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Начислить монеты
              </h2>
              <p class="text-sm text-muted">
                {{ target?.surname }} {{ target?.name }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="show = false"
            />
          </div>
          <UDivider />
          <UFormField label="Причина">
            <USelect
              v-model="form.reason"
              :items="reasonOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Количество"
            hint="Можно отрицательное для списания"
          >
            <UInput
              v-model.number="form.amount"
              type="number"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Комментарий">
            <UInput
              v-model="form.note"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="show = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canAward || saving"
              :loading="saving"
              icon="i-lucide-coins"
              @click="submit"
            >
              Начислить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
