<script setup lang="ts">
import { useAdminStats } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const { fetchStudentById, updateStudent } = useAdminStats()

const { data, pending, refresh } = await useAsyncData(
  `admin-student-${route.params.id}`,
  () => fetchStudentById(String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id))
)

const student = computed(() => data.value?.student)
const medals = computed(() => data.value?.medals ?? [])

// ─── Edit modal ──────────────────────────────────────────────────────────────
const showEdit = ref(false)
const saving = ref(false)

const editForm = reactive({
  name: '',
  surname: '',
  patronymic: '',
  phone: '',
  iin: '',
  birthdate: '',
  schoolGrade: undefined as number | undefined,
  level: 'A1'
})

const openEdit = () => {
  if (!student.value) return
  editForm.name = student.value.name
  editForm.surname = student.value.surname
  editForm.patronymic = student.value.patronymic ?? ''
  editForm.phone = student.value.phone ?? ''
  editForm.iin = student.value.iin ?? ''
  editForm.birthdate = student.value.birthdate ?? ''
  editForm.schoolGrade = student.value.schoolGrade ?? undefined
  editForm.level = student.value.level
  showEdit.value = true
}

const submitEdit = async () => {
  if (!student.value) return
  saving.value = true
  try {
    await updateStudent(student.value.id, {
      name: editForm.name.trim() || undefined,
      surname: editForm.surname.trim() || undefined,
      patronymic: editForm.patronymic.trim() || null,
      phone: editForm.phone.trim() || null,
      iin: editForm.iin.trim() || null,
      birthdate: editForm.birthdate || null,
      schoolGrade: editForm.schoolGrade,
      level: editForm.level as never
    })
    toast.add({ title: 'Данные обновлены', color: 'success', icon: 'i-lucide-check' })
    showEdit.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error' })
  } finally {
    saving.value = false
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

const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1} класс`,
  value: i + 1
}))

const levelColor = (level: string) => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500', A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500', S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500', F2: 'from-rose-400 to-pink-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

const medalIcon: Record<string, string> = {
  GOLD: 'i-lucide-medal', SILVER: 'i-lucide-medal', BRONZE: 'i-lucide-medal', NONE: 'i-lucide-circle-dashed'
}
const medalColor: Record<string, string> = {
  GOLD: 'text-yellow-500', SILVER: 'text-gray-400', BRONZE: 'text-amber-700', NONE: 'text-muted'
}
const medalLabel: Record<string, string> = {
  GOLD: 'Золото', SILVER: 'Серебро', BRONZE: 'Бронза', NONE: 'Нет медали'
}

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const formatMonth = (m: string) => {
  const [year, month] = m.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
}

const computedAge = (birthdate: string | null) => {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
    <!-- Back -->
    <div class="flex items-center gap-2">
      <UButton
        to="/admin/students"
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
      />
      <span class="text-sm text-muted">Все ученики</span>
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

    <template v-else-if="student">
      <!-- Profile header card -->
      <UCard>
        <div class="flex items-start gap-5 flex-wrap">
          <!-- Avatar with level indicator -->
          <div class="relative">
            <UAvatar
              :src="student.avatarUrl ?? undefined"
              :alt="`${student.name} ${student.surname}`"
              size="2xl"
            />
            <div
              class="absolute -bottom-1 -right-1 size-8 rounded-xl bg-linear-to-br text-white flex items-center justify-center font-black text-[10px] ring-2 ring-background"
              :class="levelGradient(student.level)"
            >
              {{ student.level }}
            </div>
          </div>

          <!-- Main info -->
          <div class="flex-1 min-w-0">
            <h2 class="text-2xl font-black tracking-tight">
              {{ student.surname }} {{ student.name }}<span
                v-if="student.patronymic"
                class="font-normal"
              >&nbsp;{{ student.patronymic }}</span>
            </h2>
            <p class="text-muted text-sm mt-0.5">
              {{ student.email }}
            </p>

            <!-- Badges row -->
            <div class="flex flex-wrap gap-2 mt-3">
              <UBadge
                :color="levelColor(student.level)"
                variant="subtle"
              >
                Уровень {{ student.level }}
              </UBadge>
              <UBadge
                v-if="student.schoolGrade"
                color="neutral"
                variant="subtle"
              >
                {{ student.schoolGrade }} класс
              </UBadge>
              <UBadge
                v-if="student.birthdate"
                color="neutral"
                variant="subtle"
                icon="i-lucide-cake"
              >
                {{ formatDate(student.birthdate) }}
                <span
                  v-if="computedAge(student.birthdate) !== null"
                  class="ml-1 text-muted"
                >({{ computedAge(student.birthdate) }} лет)</span>
              </UBadge>
              <UBadge
                v-if="student.iin"
                color="neutral"
                variant="outline"
              >
                ИИН: {{ student.iin }}
              </UBadge>
            </div>

            <!-- Contact -->
            <div
              v-if="student.phone"
              class="flex items-center gap-1.5 mt-2 text-sm text-muted"
            >
              <UIcon
                name="i-lucide-phone"
                class="size-3.5"
              />
              {{ student.phone }}
            </div>
          </div>

          <!-- Edit button -->
          <UButton
            icon="i-lucide-edit"
            variant="outline"
            color="neutral"
            @click="openEdit"
          >
            Редактировать
          </UButton>
        </div>
      </UCard>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UCard
          v-for="stat in [
            { label: 'XP', value: student.totalXp.toLocaleString(), icon: 'i-lucide-zap', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Стрик', value: student.dailyStreak + ' дней', icon: 'i-lucide-flame', color: 'text-orange-400', bg: 'bg-orange-400/10' },
            { label: 'Золотых мес.', value: student.goldStreak + ' мес.', icon: 'i-lucide-medal', color: 'text-yellow-600', bg: 'bg-yellow-600/10' },
            { label: 'Заработано', value: student.totalEarnings.toLocaleString() + ' ₸', icon: 'i-lucide-banknote', color: 'text-green-500', bg: 'bg-green-500/10' }
          ]"
          :key="stat.label"
        >
          <div class="flex items-center gap-3">
            <div
              class="rounded-xl p-2 shrink-0"
              :class="stat.bg"
            >
              <UIcon
                :name="stat.icon"
                class="size-4"
                :class="stat.color"
              />
            </div>
            <div>
              <p class="text-xs text-muted">
                {{ stat.label }}
              </p>
              <p class="font-bold text-sm">
                {{ stat.value }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Medal history -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-trophy"
              class="size-4 text-yellow-500"
            />
            <h3 class="font-semibold">
              История медалей
            </h3>
          </div>
        </template>

        <div
          v-if="medals.length"
          class="divide-y divide-subtle"
        >
          <div
            v-for="m in medals"
            :key="m.id"
            class="flex items-center justify-between py-3"
          >
            <div class="flex items-center gap-3">
              <UIcon
                :name="medalIcon[m.medal]"
                class="size-5"
                :class="medalColor[m.medal]"
              />
              <div>
                <p class="text-sm font-semibold">
                  {{ formatMonth(m.month) }}
                </p>
                <p class="text-xs text-muted">
                  Средний балл: {{ m.averageGrade?.toFixed(2) }} / 5
                </p>
              </div>
            </div>
            <div class="text-right">
              <UBadge
                :color="m.medal === 'GOLD' ? 'warning' : m.medal === 'BRONZE' ? 'warning' : 'neutral'"
                :variant="m.medal === 'BRONZE' ? 'soft' : 'subtle'"
                size="sm"
              >
                {{ medalLabel[m.medal] }}
              </UBadge>
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                {{ m.payout ? m.payout.toLocaleString() + ' ₸' : '—' }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-else
          class="py-8 text-center text-muted text-sm"
        >
          <UIcon
            name="i-lucide-trophy"
            class="size-8 mx-auto mb-2 opacity-30"
          />
          <p>Медалей ещё нет</p>
        </div>
      </UCard>
    </template>

    <!-- Not found -->
    <UAlert
      v-else-if="!pending"
      color="error"
      icon="i-lucide-alert-circle"
      title="Ученик не найден"
    />

    <!-- ─── Edit Modal ──────────────────────────────────────────────────────── -->
    <UModal
      v-model:open="showEdit"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Редактировать профиль
              </h2>
              <p class="text-sm text-muted mt-0.5">
                {{ student?.surname }} {{ student?.name }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showEdit = false"
            />
          </div>

          <UDivider />

          <!-- ФИО -->
          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              ФИО
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Фамилия">
                <UInput
                  v-model="editForm.surname"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Имя">
                <UInput
                  v-model="editForm.name"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Отчество">
              <UInput
                v-model="editForm.patronymic"
                placeholder="Не указано"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Персональные данные -->
          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Персональные данные
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Дата рождения">
                <UInput
                  v-model="editForm.birthdate"
                  type="date"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Класс">
                <USelect
                  v-model="editForm.schoolGrade"
                  :items="gradeOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="ИИН">
                <UInput
                  v-model="editForm.iin"
                  placeholder="123456789012"
                  maxlength="12"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Телефон">
                <UInput
                  v-model="editForm.phone"
                  placeholder="+7 777 000 00 00"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Уровень -->
          <UFormField label="Уровень английского">
            <USelect
              v-model="editForm.level"
              :items="levelOptions"
              class="w-full"
            />
          </UFormField>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showEdit = false"
            >
              Отмена
            </UButton>
            <UButton
              :loading="saving"
              icon="i-lucide-save"
              @click="submitEdit"
            >
              Сохранить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
