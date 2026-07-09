<script setup lang="ts">
import { useParents, type ParentListItem } from '~/entities/parent'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchParents, createParent, linkChild, unlinkChild, fetchStudents } = useParents()

const { data, pending, refresh } = await useAsyncData('admin-parents', async () => {
  const [parents, students] = await Promise.all([fetchParents(), fetchStudents()])
  return { parents, students }
})
const parents = computed<ParentListItem[]>(() => data.value?.parents ?? [])
const students = computed(() => data.value?.students ?? [])
const studentOptions = computed(() => students.value.map(s => ({ label: `${s.surname} ${s.name}`.trim(), value: s.id })))

// ─── Create ─────────────────────────────────────────────────────────
const showCreate = ref(false)
const creating = ref(false)
const showPassword = ref(false)
const form = reactive({
  name: '', surname: '', patronymic: '', email: '', password: '',
  phone: '', iin: '', studentIds: [] as string[]
})
const resetForm = () => Object.assign(form, {
  name: '', surname: '', patronymic: '', email: '', password: '',
  phone: '', iin: '', studentIds: []
})
const openCreate = () => {
  resetForm()
  showCreate.value = true
}
const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  form.password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
const toggleChild = (id: string) => {
  const i = form.studentIds.indexOf(id)
  if (i === -1) form.studentIds.push(id)
  else form.studentIds.splice(i, 1)
}
const canCreate = computed(() =>
  form.name.trim() && form.surname.trim() && form.email.trim() && form.password.length >= 6)

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    await createParent({
      name: form.name.trim(),
      surname: form.surname.trim(),
      patronymic: form.patronymic.trim() || undefined,
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      iin: form.iin.trim() || undefined,
      studentIds: form.studentIds
    })
    toast.add({ title: 'Родитель создан', color: 'success', icon: 'i-lucide-check' })
    showCreate.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    creating.value = false
  }
}

// ─── Manage links slideover ─────────────────────────────────────────
const selected = ref<ParentListItem | null>(null)
const addChildId = ref('')
const openManage = (p: ParentListItem) => {
  selected.value = p
  addChildId.value = ''
}
const availableToAdd = computed(() => {
  if (!selected.value) return []
  const linked = new Set(selected.value.children.map(c => c.studentId))
  return studentOptions.value.filter(o => !linked.has(o.value))
})
const doLink = async () => {
  if (!selected.value || !addChildId.value) return
  try {
    await linkChild(selected.value.parentId, addChildId.value)
    toast.add({ title: 'Ребёнок привязан', color: 'success', icon: 'i-lucide-check' })
    addChildId.value = ''
    await refresh()
    selected.value = parents.value.find(p => p.parentId === selected.value?.parentId) ?? null
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}
const doUnlink = async (studentId: string) => {
  if (!selected.value) return
  try {
    await unlinkChild(selected.value.parentId, studentId)
    await refresh()
    selected.value = parents.value.find(p => p.parentId === selected.value?.parentId) ?? null
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

const errMsg = (e: unknown) => (e as { data?: { message?: string }, message?: string })?.data?.message ?? (e as { message?: string })?.message ?? String(e)
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Родители
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ parents.length }} · привязка к детям
        </p>
      </div>
      <UButton
        icon="i-lucide-user-plus"
        @click="openCreate"
      >
        Добавить родителя
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

    <UCard
      v-else
      :ui="{ body: 'p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-subtle bg-muted/20 text-left">
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Родитель
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Контакты
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Дети
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in parents"
              :key="p.parentId"
              class="border-b border-subtle last:border-0 hover:bg-muted/20"
            >
              <td class="px-4 py-3 font-medium">
                {{ p.surname }} {{ p.name }}
              </td>
              <td class="px-4 py-3 text-muted">
                <p>{{ p.email }}</p>
                <p
                  v-if="p.phone"
                  class="text-xs"
                >
                  {{ p.phone }}
                </p>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="c in p.children"
                    :key="c.studentId"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                  >
                    {{ c.surname }} {{ c.name }}
                  </UBadge>
                  <span
                    v-if="!p.children.length"
                    class="text-xs text-muted"
                  >нет детей</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-link"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click="openManage(p)"
                >
                  Связи
                </UButton>
              </td>
            </tr>
            <tr v-if="!parents.length">
              <td
                colspan="4"
                class="px-4 py-16 text-center text-muted"
              >
                Родителей пока нет
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create modal -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              Новый родитель
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
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Фамилия"
              required
            >
              <UInput
                v-model="form.surname"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Имя"
              required
            >
              <UInput
                v-model="form.name"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Отчество">
              <UInput
                v-model="form.patronymic"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Телефон">
              <UInput
                v-model="form.phone"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Email"
              required
            >
              <UInput
                v-model="form.email"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Пароль"
              required
            >
              <div class="flex gap-2">
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="flex-1"
                />
                <UButton
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  variant="ghost"
                  color="neutral"
                  @click="showPassword = !showPassword"
                />
                <UButton
                  icon="i-lucide-shuffle"
                  variant="ghost"
                  color="neutral"
                  @click="genPassword"
                />
              </div>
            </UFormField>
          </div>

          <UFormField label="Дети">
            <div class="border border-subtle rounded-lg max-h-52 overflow-y-auto divide-y divide-subtle">
              <button
                v-for="s in studentOptions"
                :key="s.value"
                type="button"
                class="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-muted/30"
                @click="toggleChild(s.value)"
              >
                <UIcon
                  :name="form.studentIds.includes(s.value) ? 'i-lucide-check-square' : 'i-lucide-square'"
                  class="size-4"
                  :class="form.studentIds.includes(s.value) ? 'text-primary' : 'text-muted'"
                />
                {{ s.label }}
              </button>
              <p
                v-if="!studentOptions.length"
                class="px-3 py-4 text-sm text-muted"
              >
                Нет учеников
              </p>
            </div>
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
              icon="i-lucide-user-plus"
              @click="submitCreate"
            >
              Создать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Manage links slideover -->
    <USlideover
      :open="!!selected"
      side="right"
      :ui="{ content: 'max-w-md' }"
      @update:open="(v: boolean) => { if (!v) selected = null }"
    >
      <template #content>
        <div
          v-if="selected"
          class="p-6 space-y-5 h-full overflow-y-auto"
        >
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold">
                {{ selected.surname }} {{ selected.name }}
              </h2>
              <p class="text-sm text-muted">
                {{ selected.email }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="selected = null"
            />
          </div>
          <UDivider />
          <div>
            <p class="text-sm font-semibold mb-2">
              Привязанные дети
            </p>
            <div class="space-y-2">
              <div
                v-for="c in selected.children"
                :key="c.studentId"
                class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-subtle"
              >
                <span class="text-sm">{{ c.surname }} {{ c.name }}</span>
                <UButton
                  icon="i-lucide-unlink"
                  variant="ghost"
                  color="error"
                  size="xs"
                  @click="doUnlink(c.studentId)"
                />
              </div>
              <p
                v-if="!selected.children.length"
                class="text-xs text-muted"
              >
                Нет привязанных детей
              </p>
            </div>
          </div>
          <UDivider />
          <div>
            <p class="text-sm font-semibold mb-2">
              Добавить ребёнка
            </p>
            <div class="flex gap-2">
              <USelect
                v-model="addChildId"
                :items="availableToAdd"
                placeholder="Выберите ученика"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-plus"
                :disabled="!addChildId"
                @click="doLink"
              >
                Привязать
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
