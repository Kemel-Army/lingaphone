<script setup lang="ts">
import { useAdminStats, type AdminStudent } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchStudents, createStudent } = useAdminStats()
const { data: students, pending, refresh } = await useAsyncData('admin-students', fetchStudents)

const search = ref('')
const filtered = computed((): AdminStudent[] => {
  if (!students.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter(s =>
    `${s.name} ${s.surname} ${s.patronymic ?? ''} ${s.email} ${s.iin ?? ''}`.toLowerCase().includes(q)
  )
})

// ─── Create modal ────────────────────────────────────────────────────────────
const showCreate = ref(false)
const creating = ref(false)

const form = reactive({
  name: '',
  surname: '',
  patronymic: '',
  email: '',
  password: '',
  phone: '',
  birthdate: '',
  schoolGrade: null as number | null,
  iin: '',
  level: 'A1' as string
})

const resetForm = () => {
  form.name = ''
  form.surname = ''
  form.patronymic = ''
  form.email = ''
  form.password = ''
  form.phone = ''
  form.birthdate = ''
  form.schoolGrade = null
  form.iin = ''
  form.level = 'A1'
}

const canCreate = computed(() =>
  form.name.trim() && form.surname.trim() && form.email.trim() && form.password.length >= 6
)

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    await createStudent({
      name: form.name.trim(),
      surname: form.surname.trim(),
      patronymic: form.patronymic.trim() || undefined,
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      birthdate: form.birthdate || undefined,
      schoolGrade: form.schoolGrade ?? undefined,
      iin: form.iin.trim() || undefined,
      level: form.level || undefined
    })
    toast.add({ title: 'Ученик создан', color: 'success', icon: 'i-lucide-check' })
    showCreate.value = false
    resetForm()
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    creating.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const levelOptions = [
  { label: 'A1 — Начальный', value: 'A1' },
  { label: 'A2 — Элементарный', value: 'A2' },
  { label: 'S1', value: 'S1' },
  { label: 'S2', value: 'S2' },
  { label: 'B2 — Средний', value: 'B2' },
  { label: 'F1', value: 'F1' },
  { label: 'F2', value: 'F2' }
]

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500', A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500', S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500', F2: 'from-rose-400 to-pink-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

const levelColor = (level: string) => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1} класс`,
  value: i + 1
}))
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Ученики
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ students?.length ?? 0 }} зарегистрировано
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск по ФИО, email, ИИН..."
          class="w-64"
        />
        <UButton
          icon="i-lucide-user-plus"
          @click="showCreate = true"
        >
          Добавить ученика
        </UButton>
      </div>
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

    <!-- Table -->
    <UCard
      v-else
      :ui="{ body: 'p-0' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-subtle bg-muted/20">
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Ученик
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Уровень
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Класс
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              XP
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Стрик
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Заработано
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Групп
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Активен
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in filtered"
            :key="s.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/20 transition-colors group"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="relative shrink-0">
                  <UAvatar
                    :src="s.avatarUrl ?? undefined"
                    :alt="`${s.name} ${s.surname}`"
                    size="sm"
                  />
                  <div
                    class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-linear-to-br"
                    :class="levelGradient(s.level)"
                  />
                </div>
                <div>
                  <p class="font-semibold">
                    {{ s.surname }} {{ s.name }}<span
                      v-if="s.patronymic"
                      class="font-normal"
                    > {{ s.patronymic }}</span>
                  </p>
                  <p class="text-xs text-muted">
                    {{ s.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="levelColor(s.level)"
                variant="subtle"
                size="sm"
              >
                {{ s.level }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ s.schoolGrade ? `${s.schoolGrade} кл.` : '—' }}
            </td>
            <td class="px-4 py-3">
              <span class="font-mono font-semibold text-primary">{{ s.totalXp.toLocaleString() }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-flame"
                  class="size-4"
                  :class="s.dailyStreak > 0 ? 'text-orange-400' : 'text-muted'"
                />
                <span :class="s.dailyStreak > 0 ? 'font-semibold' : 'text-muted'">{{ s.dailyStreak }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="font-semibold"
                :class="s.totalEarnings > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted'"
              >
                {{ s.totalEarnings > 0 ? s.totalEarnings.toLocaleString() + ' ₸' : '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center font-semibold">
              {{ s.groupCount }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ formatDate(s.lastActiveDate) }}
            </td>
            <td class="px-4 py-3">
              <UButton
                :to="`/admin/students/${s.id}`"
                icon="i-lucide-eye"
                variant="ghost"
                size="sm"
                color="neutral"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td
              colspan="9"
              class="px-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-search-x"
                class="size-8 text-muted mx-auto mb-2"
              />
              <p class="text-muted">
                {{ search ? 'Ничего не найдено' : 'Учеников пока нет' }}
              </p>
              <UButton
                v-if="!search"
                class="mt-3"
                size="sm"
                icon="i-lucide-user-plus"
                @click="showCreate = true"
              >
                Добавить первого ученика
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <!-- ─── Create Student Modal ─────────────────────────────────────────── -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-5">
          <!-- Modal header -->
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Новый ученик
              </h2>
              <p class="text-sm text-muted mt-0.5">
                Заполните данные для создания аккаунта
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showCreate = false"
            />
          </div>

          <UDivider />

          <!-- ФИО -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              ФИО
            </p>
            <div class="grid grid-cols-1 gap-3">
              <div class="grid grid-cols-2 gap-3">
                <UFormField
                  label="Фамилия"
                  required
                >
                  <UInput
                    v-model="form.surname"
                    placeholder="Иванов"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Имя"
                  required
                >
                  <UInput
                    v-model="form.name"
                    placeholder="Иван"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <UFormField label="Отчество">
                <UInput
                  v-model="form.patronymic"
                  placeholder="Иванович"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Персональные данные -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Персональные данные
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Дата рождения">
                <UInput
                  v-model="form.birthdate"
                  type="date"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Класс">
                <USelect
                  v-model="form.schoolGrade"
                  :items="gradeOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="ИИН">
                <UInput
                  v-model="form.iin"
                  placeholder="123456789012"
                  maxlength="12"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Телефон">
                <UInput
                  v-model="form.phone"
                  placeholder="+7 777 000 00 00"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Уровень -->
          <UFormField label="Уровень английского">
            <USelect
              v-model="form.level"
              :items="levelOptions"
              class="w-full"
            />
          </UFormField>

          <!-- Учётная запись -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Учётная запись
            </p>
            <div class="grid grid-cols-1 gap-3">
              <UFormField
                label="Email для входа"
                required
              >
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="ivan@example.com"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Пароль"
                required
                hint="Минимум 6 символов"
              >
                <UInput
                  v-model="form.password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showCreate = false; resetForm()"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canCreate || creating"
              :loading="creating"
              icon="i-lucide-user-plus"
              @click="submitCreate"
            >
              Создать аккаунт
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
