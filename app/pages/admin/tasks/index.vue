<script setup lang="ts">
import { useCurrentUser } from '~/entities/user'
import { useLeads } from '~/entities/lead'
import {
  useTasks,
  TASK_STATUSES,
  TASK_STATUS_MAP,
  TASK_RELATED_TYPES,
  computeEffectiveStatus,
  type TaskWithRelations,
  type TaskStatus,
  type TaskRelatedType
} from '~/entities/task'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { internalId } = useCurrentUser()
const { fetchTasks, createTask, setStatus, deleteTask } = useTasks()
const { fetchAdmins } = useLeads()

const { data, pending } = await useAsyncData('admin-tasks', async () => {
  const [tasks, admins] = await Promise.all([fetchTasks(), fetchAdmins()])
  return { tasks, admins }
})

const tasks = computed<TaskWithRelations[]>(() => data.value?.tasks ?? [])
const admins = computed(() => data.value?.admins ?? [])
// Reka UI Select запрещает пустую строку как value — сентинел + маппинг в null.
const NONE = '__none__'
const noneToNull = (v: string): string | null => (v && v !== NONE ? v : null)
const adminOptions = computed(() => [
  { label: 'Не назначен', value: NONE },
  ...admins.value.map(a => ({ label: `${a.surname} ${a.name}`.trim(), value: a.id }))
])
const statusOptions = TASK_STATUSES
  .filter(s => s.value !== 'OVERDUE')
  .map(s => ({ label: s.label, value: s.value }))
const relatedOptions = TASK_RELATED_TYPES.map(t => ({ label: t.label, value: t.value }))

// ─── Filter ─────────────────────────────────────────────────────────
type Filter = 'all' | TaskStatus
const filter = ref<Filter>('all')
const filters: { value: Filter, label: string, icon: string }[] = [
  { value: 'all', label: 'Все', icon: 'i-lucide-list' },
  ...TASK_STATUSES.map(s => ({ value: s.value as Filter, label: s.label, icon: s.icon }))
]
const countBy = (status: TaskStatus) => tasks.value.filter(t => t.effectiveStatus === status).length
const filtered = computed(() =>
  filter.value === 'all' ? tasks.value : tasks.value.filter(t => t.effectiveStatus === filter.value)
)

// ─── Create ─────────────────────────────────────────────────────────
const showCreate = ref(false)
const creating = ref(false)
const form = reactive({
  title: '', description: '', assigneeId: NONE,
  dueAt: '', relatedType: 'INTERNAL' as TaskRelatedType
})
const resetForm = () => Object.assign(form, {
  title: '', description: '', assigneeId: internalId.value ?? NONE,
  dueAt: '', relatedType: 'INTERNAL'
})
const openCreate = () => {
  resetForm()
  showCreate.value = true
}
const canCreate = computed(() => form.title.trim().length > 0)

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    const created = await createTask({
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigneeId: noneToNull(form.assigneeId),
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      relatedType: form.relatedType
    })
    if (data.value) data.value = { ...data.value, tasks: [created, ...data.value.tasks] }
    toast.add({ title: 'Задача создана', color: 'success', icon: 'i-lucide-check' })
    showCreate.value = false
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    creating.value = false
  }
}

// useAsyncData здесь — shallowRef (Nuxt 4 default deep:false): мутация
// вложенного data.value.tasks[i] ничего не триггерит, надо переприсвоить
// сам data.value целиком, чтобы Vue заметил изменение (см. тот же фикс
// в admin/leads).
const patchLocal = (id: string, patch: Partial<TaskWithRelations>) => {
  if (!data.value) return
  const i = data.value.tasks.findIndex(t => t.id === id)
  if (i === -1) return
  const nextTasks = [...data.value.tasks]
  nextTasks[i] = { ...nextTasks[i], ...patch } as TaskWithRelations
  data.value = { ...data.value, tasks: nextTasks }
}
const removeLocal = (id: string) => {
  if (!data.value) return
  data.value = { ...data.value, tasks: data.value.tasks.filter(t => t.id !== id) }
}

const changeStatus = async (task: TaskWithRelations, status: TaskStatus) => {
  const prevStatus = task.status
  // effectiveStatus зависит от status — оптимистичный патч должен пересчитать
  // и его, иначе бейдж/фильтр «Просрочена» ещё секунду показывают старое.
  patchLocal(task.id, { status, effectiveStatus: computeEffectiveStatus({ status, dueAt: task.dueAt }) })
  try {
    const updated = await setStatus(task.id, status)
    patchLocal(task.id, updated)
  } catch (e: unknown) {
    patchLocal(task.id, { status: prevStatus, effectiveStatus: computeEffectiveStatus({ status: prevStatus, dueAt: task.dueAt }) })
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

const remove = async (task: TaskWithRelations) => {
  if (!confirm(`Удалить задачу «${task.title}»?`)) return
  try {
    await deleteTask(task.id)
    removeLocal(task.id)
    toast.add({ title: 'Задача удалена', color: 'success', icon: 'i-lucide-trash' })
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: errMsg(e), color: 'error', icon: 'i-lucide-x' })
  }
}

// ─── Helpers ────────────────────────────────────────────────────────
const errMsg = (e: unknown) => (e as { message?: string })?.message ?? String(e)
const assigneeName = (t: TaskWithRelations) =>
  t.assignee ? `${t.assignee.surname} ${t.assignee.name}`.trim() : '—'
const fmtDue = (d: string | null) => d
  ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Задачи
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ tasks.length }} всего
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Новая задача
      </UButton>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-1 flex-wrap">
      <UButton
        v-for="f in filters"
        :key="f.value"
        :icon="f.icon"
        :variant="filter === f.value ? 'solid' : 'ghost'"
        :color="filter === f.value ? 'primary' : 'neutral'"
        size="sm"
        @click="filter = f.value"
      >
        {{ f.label }}
        <UBadge
          v-if="f.value !== 'all' && countBy(f.value as TaskStatus)"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ countBy(f.value as TaskStatus) }}
        </UBadge>
      </UButton>
    </div>

    <!-- Loading: только первая загрузка, чтобы смена статуса/фильтра/создание
         не подменяли всю таблицу спиннером. -->
    <div
      v-if="pending && !data"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Table. min-h держит карточку одной высоты между фильтрами — иначе
         переключение с «Все» на фильтр с 1 задачей резко схлопывает страницу
         и она «прыгает». -->
    <UCard
      v-else
      :ui="{ body: 'p-0' }"
    >
      <div class="overflow-x-auto min-h-[16rem]">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-subtle bg-muted/20 text-left">
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Задача
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Исполнитель
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Срок
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                Статус
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="task in filtered"
              :key="task.id"
              class="border-b border-subtle last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="font-semibold">
                  {{ task.title }}
                </p>
                <p
                  v-if="task.description"
                  class="text-xs text-muted mt-0.5 line-clamp-2"
                >
                  {{ task.description }}
                </p>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ assigneeName(task) }}
              </td>
              <td
                class="px-4 py-3"
                :class="task.effectiveStatus === 'OVERDUE' ? 'text-error font-medium' : 'text-muted'"
              >
                {{ fmtDue(task.dueAt) }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="TASK_STATUS_MAP[task.effectiveStatus].color"
                  variant="subtle"
                  size="sm"
                >
                  {{ TASK_STATUS_MAP[task.effectiveStatus].label }}
                </UBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <USelect
                    :model-value="task.status"
                    :items="statusOptions"
                    size="sm"
                    class="w-36"
                    @update:model-value="(v: unknown) => changeStatus(task, v as TaskStatus)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    color="error"
                    size="sm"
                    @click="remove(task)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td
                colspan="5"
                class="px-4 py-16 text-center text-muted"
              >
                Задач нет
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- ─── Create modal ──────────────────────────────────────────── -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              Новая задача
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
            label="Название"
            required
          >
            <UInput
              v-model="form.title"
              placeholder="Перезвонить клиенту"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Описание">
            <UTextarea
              v-model="form.description"
              :rows="3"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Исполнитель">
              <USelect
                v-model="form.assigneeId"
                :items="adminOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Тип">
              <USelect
                v-model="form.relatedType"
                :items="relatedOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Срок"
              class="col-span-2"
            >
              <UInput
                v-model="form.dueAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>

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
  </div>
</template>
