<script setup lang="ts">
import { useAdminStats, type AdminTeacher } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchTeachers } = useAdminStats()
const { data: teachers, pending, refresh } = await useAsyncData('admin-teachers', fetchTeachers)

const search = ref('')
const filtered = computed((): AdminTeacher[] => {
  if (!teachers.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return teachers.value
  return teachers.value.filter(t =>
    `${t.name} ${t.surname} ${t.email}`.toLowerCase().includes(q)
  )
})

// ─── Create modal ─────────────────────────────────────────────────────────────

const showCreate = ref(false)
const creating = ref(false)

const specializationOptions = [
  { label: 'Выпускные классы', value: 'Выпускные классы' },
  { label: 'Малыши (4-7 лет)', value: 'Малыши' },
  { label: 'Подготовка к IELTS', value: 'IELTS' },
  { label: 'Подготовка к TOEFL', value: 'TOEFL' },
  { label: 'Разговорный клуб', value: 'Разговорный клуб' },
  { label: 'Бизнес-английский', value: 'Бизнес-английский' },
  { label: 'Общий курс', value: 'Общий курс' }
]

const categoryOptions = [
  { label: 'Стажёр', value: 'INTERN' },
  { label: 'Младший', value: 'JUNIOR' },
  { label: 'Средний', value: 'MIDDLE' },
  { label: 'Старший', value: 'SENIOR' },
  { label: 'Ведущий', value: 'LEAD' }
]

const createForm = reactive({
  name: '',
  surname: '',
  patronymic: '',
  email: '',
  password: '',
  phone: '',
  yearsOfExperience: null as number | null,
  specialization: '',
  category: 'MIDDLE',
  bio: ''
})

const resetCreateForm = () => {
  createForm.name = ''
  createForm.surname = ''
  createForm.patronymic = ''
  createForm.email = ''
  createForm.password = ''
  createForm.phone = ''
  createForm.yearsOfExperience = null
  createForm.specialization = ''
  createForm.category = 'MIDDLE'
  createForm.bio = ''
}

const canCreate = computed(() =>
  createForm.name.trim() && createForm.surname.trim()
  && createForm.email.trim() && createForm.password.length >= 6
)

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    await $fetch('/api/admin/teachers', {
      method: 'POST',
      body: {
        name: createForm.name.trim(),
        surname: createForm.surname.trim(),
        patronymic: createForm.patronymic.trim() || undefined,
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim() || undefined,
        yearsOfExperience: createForm.yearsOfExperience ?? undefined,
        specialization: createForm.specialization || undefined,
        category: createForm.category || undefined,
        bio: createForm.bio.trim() || undefined
      }
    })
    toast.add({ title: 'Учитель добавлен', color: 'success', icon: 'i-lucide-check' })
    showCreate.value = false
    resetCreateForm()
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    creating.value = false
  }
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

const showEdit = ref(false)
const editing = ref(false)
const editTarget = ref<AdminTeacher | null>(null)

const editForm = reactive({
  name: '',
  surname: '',
  patronymic: '',
  phone: '',
  yearsOfExperience: null as number | null,
  specialization: '',
  category: '',
  bio: '',
  rating: 0
})

const openEdit = (t: AdminTeacher) => {
  editTarget.value = t
  editForm.name = t.name
  editForm.surname = t.surname
  editForm.patronymic = ''
  editForm.phone = t.phone ?? ''
  editForm.yearsOfExperience = t.yearsOfExperience
  editForm.specialization = t.specialization ?? ''
  editForm.category = t.category ?? ''
  editForm.bio = t.bio ?? ''
  editForm.rating = t.rating
  showEdit.value = true
}

const submitEdit = async () => {
  if (!editTarget.value) return
  editing.value = true
  try {
    await $fetch(`/api/admin/teachers/${editTarget.value.id}`, {
      method: 'PATCH',
      body: {
        name: editForm.name.trim(),
        surname: editForm.surname.trim(),
        phone: editForm.phone.trim() || undefined,
        yearsOfExperience: editForm.yearsOfExperience ?? undefined,
        specialization: editForm.specialization || undefined,
        category: editForm.category || undefined,
        bio: editForm.bio.trim() || undefined,
        rating: editForm.rating > 0 ? editForm.rating : undefined
      }
    })
    toast.add({ title: 'Данные обновлены', color: 'success', icon: 'i-lucide-check' })
    showEdit.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    editing.value = false
  }
}

// ─── Password visibility ──────────────────────────────────────────────────────

const showPassword = ref(false)

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  createForm.password = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">
          Учителя
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ teachers?.length ?? 0 }} зарегистрировано
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск по имени или email..."
          class="w-64"
        />
        <UButton
          icon="i-lucide-user-plus"
          @click="showCreate = true"
        >
          Добавить учителя
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
              Учитель
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Групп
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Учеников
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Рейтинг
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Опыт
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              На платформе
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in filtered"
            :key="t.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/20 transition-colors group"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="t.avatarUrl ?? undefined"
                  :alt="`${t.name} ${t.surname}`"
                  size="sm"
                />
                <div>
                  <p class="font-semibold">
                    {{ t.surname }} {{ t.name }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ t.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <UBadge
                color="info"
                variant="subtle"
                size="sm"
              >
                {{ t.groupCount }}
              </UBadge>
            </td>
            <td class="px-4 py-3 font-semibold">
              {{ t.studentCount }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-star"
                  class="size-4 text-yellow-500"
                />
                <span>{{ t.rating > 0 ? t.rating.toFixed(1) : '—' }}</span>
                <span
                  v-if="t.reviewCount > 0"
                  class="text-xs text-muted"
                >({{ t.reviewCount }})</span>
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ t.yearsOfExperience != null ? `${t.yearsOfExperience} лет` : '—' }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(t.createdAt).toLocaleDateString('ru-RU') }}
            </td>
            <td class="px-4 py-3">
              <UButton
                icon="i-lucide-pencil"
                variant="ghost"
                size="sm"
                color="neutral"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click="openEdit(t)"
              />
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td
              colspan="7"
              class="px-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-users"
                class="size-8 text-muted mx-auto mb-2 opacity-40"
              />
              <p class="text-muted">
                {{ search ? 'Ничего не найдено' : 'Учителей пока нет' }}
              </p>
              <UButton
                v-if="!search"
                class="mt-3"
                size="sm"
                icon="i-lucide-user-plus"
                @click="showCreate = true"
              >
                Добавить первого учителя
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <!-- ─── Create Teacher Modal ────────────────────────────────────────────── -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Новый учитель
              </h2>
              <p class="text-sm text-muted mt-0.5">
                Создание аккаунта преподавателя
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

          <USeparator />

          <!-- ФИО -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              ФИО
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Фамилия"
                required
              >
                <UInput
                  v-model="createForm.surname"
                  placeholder="Иванов"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Имя"
                required
              >
                <UInput
                  v-model="createForm.name"
                  placeholder="Иван"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Отчество">
              <UInput
                v-model="createForm.patronymic"
                placeholder="Иванович"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Контакты -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Учётная запись
            </p>
            <div class="grid grid-cols-1 gap-3">
              <UFormField
                label="Email"
                required
              >
                <UInput
                  v-model="createForm.email"
                  type="email"
                  placeholder="teacher@example.com"
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
                    v-model="createForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
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
                    title="Сгенерировать"
                    @click="generatePassword"
                  />
                </div>
              </UFormField>
              <UFormField label="Телефон">
                <UInput
                  v-model="createForm.phone"
                  placeholder="+7 777 000 00 00"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Профессиональные данные -->
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Профессиональные данные
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Опыт работы (лет)">
                <UInput
                  v-model.number="createForm.yearsOfExperience"
                  type="number"
                  :min="0"
                  :max="50"
                  placeholder="3"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Категория">
                <USelect
                  v-model="createForm.category"
                  :items="categoryOptions"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Специализация"
                class="col-span-2"
              >
                <USelect
                  v-model="createForm.specialization"
                  :items="specializationOptions"
                  placeholder="Выберите специализацию..."
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="О себе (bio)">
              <UTextarea
                v-model="createForm.bio"
                placeholder="Опыт работы, достижения, подход к обучению..."
                :rows="3"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showCreate = false; resetCreateForm()"
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

    <!-- ─── Edit Teacher Modal ──────────────────────────────────────────────── -->
    <UModal
      v-model:open="showEdit"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Редактирование
              </h2>
              <p class="text-sm text-muted mt-0.5">
                {{ editTarget?.surname }} {{ editTarget?.name }}
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

          <USeparator />

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

          <UFormField label="Телефон">
            <UInput
              v-model="editForm.phone"
              placeholder="+7 777 000 00 00"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Опыт (лет)">
              <UInput
                v-model.number="editForm.yearsOfExperience"
                type="number"
                :min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Рейтинг (ручная коррекция)">
              <UInput
                v-model.number="editForm.rating"
                type="number"
                :min="0"
                :max="5"
                :step="0.1"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Специализация"
              class="col-span-2"
            >
              <USelect
                v-model="editForm.specialization"
                :items="specializationOptions"
                placeholder="Выберите..."
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Категория"
              class="col-span-2"
            >
              <USelect
                v-model="editForm.category"
                :items="categoryOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Bio">
            <UTextarea
              v-model="editForm.bio"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showEdit = false"
            >
              Отмена
            </UButton>
            <UButton
              :loading="editing"
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
