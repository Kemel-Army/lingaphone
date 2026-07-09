<script setup lang="ts">
import { useDirector, type BranchWithCounts } from '~/features/director-stats'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchBranches, createBranch, updateBranch } = useDirector()
const { data: branches, pending, refresh } = await useAsyncData('director-branches', fetchBranches)

const kindOptions = [
  { label: 'Офлайн', value: 'OFFLINE' },
  { label: 'Онлайн', value: 'ONLINE' }
]

const show = ref(false)
const saving = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', kind: 'OFFLINE' as 'OFFLINE' | 'ONLINE', address: '', city: '' })

const openCreate = () => {
  editId.value = null
  Object.assign(form, { name: '', kind: 'OFFLINE', address: '', city: '' })
  show.value = true
}
const openEdit = (b: BranchWithCounts) => {
  editId.value = b.id
  Object.assign(form, { name: b.name, kind: b.kind, address: b.address ?? '', city: b.city ?? '' })
  show.value = true
}

const submit = async () => {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const payload = { name: form.name.trim(), kind: form.kind, address: form.address.trim() || null, city: form.city.trim() || null }
    if (editId.value) await updateBranch(editId.value, payload)
    else await createBranch(payload)
    toast.add({ title: editId.value ? 'Филиал обновлён' : 'Филиал создан', color: 'success', icon: 'i-lucide-check' })
    show.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: (e as { data?: { message?: string } })?.data?.message ?? '', color: 'error', icon: 'i-lucide-x' })
  } finally {
    saving.value = false
  }
}

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`
</script>

<template>
  <div class="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-building-2"
            class="size-6 text-primary"
          />
          Филиалы
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ branches?.length ?? 0 }} филиалов · сводные показатели
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Новый филиал
      </UButton>
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
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <UCard
        v-for="b in (branches as BranchWithCounts[])"
        :key="b.id"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-bold text-lg">
              {{ b.name }}
            </p>
            <p class="text-xs text-muted">
              {{ b.city || '—' }} · {{ b.kind === 'ONLINE' ? 'Онлайн' : 'Офлайн' }}
            </p>
            <p
              v-if="b.address"
              class="text-xs text-muted mt-0.5"
            >
              {{ b.address }}
            </p>
          </div>
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="openEdit(b)"
          />
        </div>
        <div class="grid grid-cols-3 gap-2 mt-3 text-center">
          <div class="rounded-lg bg-muted/30 p-2">
            <p class="text-lg font-bold">
              {{ b.studentsCount }}
            </p>
            <p class="text-xs text-muted">
              учеников
            </p>
          </div>
          <div class="rounded-lg bg-muted/30 p-2">
            <p class="text-lg font-bold">
              {{ b.groupsCount }}
            </p>
            <p class="text-xs text-muted">
              групп
            </p>
          </div>
          <div class="rounded-lg bg-muted/30 p-2">
            <p class="text-lg font-bold">
              {{ b.leadsCount }}
            </p>
            <p class="text-xs text-muted">
              лидов
            </p>
          </div>
        </div>
        <p class="text-sm text-muted mt-3">
          Выручка: <span class="font-semibold text-primary">{{ money(b.revenue) }}</span>
        </p>
      </UCard>

      <p
        v-if="!branches?.length"
        class="text-center text-muted py-12 md:col-span-2"
      >
        Филиалов пока нет
      </p>
    </div>

    <!-- Create/edit modal -->
    <UModal
      v-model:open="show"
      :ui="{ content: 'max-w-md' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              {{ editId ? 'Редактировать филиал' : 'Новый филиал' }}
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="show = false"
            />
          </div>
          <UDivider />
          <UFormField
            label="Название"
            required
          >
            <UInput
              v-model="form.name"
              placeholder="Алматы — Центр"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Тип">
              <USelect
                v-model="form.kind"
                :items="kindOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Город">
              <UInput
                v-model="form.city"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Адрес">
            <UInput
              v-model="form.address"
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
              :disabled="!form.name.trim() || saving"
              :loading="saving"
              icon="i-lucide-save"
              @click="submit"
            >
              Сохранить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
