<script setup lang="ts">
import { useAdminStats, type AdminStudent } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchStudentsPaged, fetchStudents, createStudent, updateStudent } = useAdminStats()

// ─── Pagination & Search ──────────────────────────────────────────────────────

const PAGE_SIZE = 20
const page = ref(0)
const search = ref('')
const searchDebounced = ref('')

let debounceTimer: ReturnType<typeof setTimeout>
watch(search, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchDebounced.value = val
    page.value = 0
  }, 300)
})

const { data: pagedResult, pending, refresh } = await useAsyncData(
  () => `admin-students-p${page.value}-q${searchDebounced.value}`,
  () => fetchStudentsPaged(page.value, PAGE_SIZE, searchDebounced.value)
)

watch([page, searchDebounced], () => refresh())

const students = computed((): AdminStudent[] => pagedResult.value?.students ?? [])
const total = computed(() => pagedResult.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE))

// ─── Create modal ─────────────────────────────────────────────────────────────

const showCreate = ref(false)
const creating = ref(false)
const showPassword = ref(false)

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
  label: `${i + 1} класс`, value: i + 1
}))

const form = reactive({
  name: '', surname: '', patronymic: '', email: '', password: '',
  phone: '', birthdate: '', schoolGrade: undefined as number | undefined,
  iin: '', level: 'A1' as string
})

const resetForm = () => Object.assign(form, {
  name: '', surname: '', patronymic: '', email: '', password: '',
  phone: '', birthdate: '', schoolGrade: undefined as number | undefined, iin: '', level: 'A1'
})

const canCreate = computed(() =>
  form.name.trim() && form.surname.trim() && form.email.trim() && form.password.length >= 6
)

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  form.password = Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    await createStudent({
      name: form.name.trim(), surname: form.surname.trim(),
      patronymic: form.patronymic.trim() || undefined,
      email: form.email.trim(), password: form.password,
      phone: form.phone.trim() || undefined,
      birthdate: form.birthdate || undefined,
      schoolGrade: form.schoolGrade ?? undefined,
      iin: form.iin.trim() || undefined,
      level: form.level || undefined
    })
    lastCreated.value = {
      surname: form.surname, name: form.name,
      email: form.email, password: form.password
    }
    toast.add({ title: 'Ученик создан. Пароль доступен в экспорте', color: 'success', icon: 'i-lucide-check' })
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

// ─── Edit modal ───────────────────────────────────────────────────────────────

const showEdit = ref(false)
const editTarget = ref<AdminStudent | null>(null)
const editSaving = ref(false)
const editForm = reactive({
  name: '', surname: '', patronymic: '', phone: '',
  iin: '', birthdate: '', schoolGrade: undefined as number | undefined, level: 'A1'
})

const openEdit = (s: AdminStudent) => {
  editTarget.value = s
  editForm.name = s.name
  editForm.surname = s.surname
  editForm.patronymic = s.patronymic ?? ''
  editForm.phone = s.phone ?? ''
  editForm.iin = s.iin ?? ''
  editForm.birthdate = s.birthdate ?? ''
  editForm.schoolGrade = s.schoolGrade ?? undefined
  editForm.level = s.level
  showEdit.value = true
}

const submitEdit = async () => {
  if (!editTarget.value) return
  editSaving.value = true
  try {
    await updateStudent(editTarget.value.id, {
      name: editForm.name.trim(),
      surname: editForm.surname.trim(),
      patronymic: editForm.patronymic.trim() || null,
      phone: editForm.phone.trim() || null,
      iin: editForm.iin.trim() || null,
      birthdate: editForm.birthdate || null,
      schoolGrade: editForm.schoolGrade,
      level: editForm.level
    })
    toast.add({ title: 'Данные обновлены', color: 'success', icon: 'i-lucide-check' })
    showEdit.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    editSaving.value = false
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

const exporting = ref(false)

const exportCSV = async () => {
  exporting.value = true
  try {
    const all = await fetchStudents()
    const headers = ['Фамилия', 'Имя', 'Отчество', 'Email', 'Пароль', 'Телефон', 'ИИН', 'Уровень', 'Класс', 'XP', 'Стрик', 'Зарегистрирован']
    const rows = all.map(s => [
      s.surname, s.name, s.patronymic ?? '',
      s.email, s.initialPassword ?? '—', s.phone ?? '', s.iin ?? '',
      s.level, s.schoolGrade ?? '',
      s.totalXp, s.dailyStreak,
      new Date(s.createdAt).toLocaleDateString('ru-RU')
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: 'CSV экспортирован', color: 'success', icon: 'i-lucide-download' })
  } catch {
    toast.add({ title: 'Ошибка экспорта', color: 'error', icon: 'i-lucide-x' })
  } finally {
    exporting.value = false
  }
}

// ─── PDF Export (full student list) ─────────────────────────────────────────────

const exportingPdf = ref(false)

const exportPDF = async () => {
  exportingPdf.value = true
  try {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const all = await fetchStudents()

    // Landscape — full info needs many columns. Roboto font supports Cyrillic
    // (jsPDF's built-in helvetica renders Cyrillic as blank glyphs).
    const doc = new jsPDF({ orientation: 'landscape' })
    await registerPdfFonts(doc)

    doc.setFont(PDF_FONT, 'bold')
    doc.setFontSize(16)
    doc.text('Lingaphone — Ученики', 14, 18)
    doc.setFont(PDF_FONT, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`Сформировано: ${new Date().toLocaleDateString('ru-RU')} · Всего: ${all.length}`, 14, 25)
    doc.setTextColor(0)

    const head = [[
      'Фамилия', 'Имя', 'Отчество', 'Email', 'Пароль', 'Телефон', 'ИИН',
      'Дата рожд.', 'Уровень', 'Класс', 'XP', 'Стрик', 'Голд-стрик',
      'Заработок', 'Групп', 'Активен', 'Зарегистрирован'
    ]]
    const body = all.map(s => [
      s.surname, s.name, s.patronymic ?? '—',
      s.email, s.initialPassword ?? '—', s.phone ?? '—', s.iin ?? '—',
      s.birthdate ? new Date(s.birthdate).toLocaleDateString('ru-RU') : '—',
      s.level, s.schoolGrade != null ? String(s.schoolGrade) : '—',
      String(s.totalXp), String(s.dailyStreak), String(s.goldStreak),
      `${s.totalEarnings.toLocaleString('ru-RU')} ₸`,
      String(s.groupCount),
      s.lastActiveDate ? new Date(s.lastActiveDate).toLocaleDateString('ru-RU') : '—',
      new Date(s.createdAt).toLocaleDateString('ru-RU')
    ])

    autoTable(doc, {
      startY: 30,
      head,
      body: body.length ? body : [Array(head[0]!.length).fill('—')],
      theme: 'grid',
      styles: { font: PDF_FONT, fontStyle: 'normal', fontSize: 7, cellPadding: 1.5 },
      headStyles: { font: PDF_FONT, fontStyle: 'bold', fillColor: [22, 163, 74], fontSize: 7 }
    })

    doc.save(`students_${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.add({ title: 'PDF экспортирован', color: 'success', icon: 'i-lucide-file-text' })
  } catch {
    toast.add({ title: 'Ошибка PDF', color: 'error', icon: 'i-lucide-x' })
  } finally {
    exportingPdf.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const levelGradient = (level: string) => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500', A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500', S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500', F2: 'from-rose-400 to-pink-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

type BadgeColor = 'info' | 'warning' | 'success' | 'error' | 'neutral'
const levelColor = (level: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
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
          {{ total }} зарегистрировано
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="ФИО, email, ИИН (Қ/К работает)..."
          class="w-64"
        />
        <UButton
          icon="i-lucide-download"
          variant="ghost"
          color="neutral"
          :loading="exporting"
          title="Экспорт CSV"
          @click="exportCSV"
        >
          CSV
        </UButton>
        <UButton
          icon="i-lucide-file-text"
          variant="ghost"
          color="neutral"
          :loading="exportingPdf"
          title="Экспорт всех учеников в PDF"
          @click="exportPDF"
        >
          PDF
        </UButton>
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
            v-for="s in students"
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
            <td class="px-4 py-3 text-center font-semibold">
              {{ s.groupCount }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ formatDate(s.lastActiveDate) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  size="sm"
                  color="neutral"
                  @click="openEdit(s)"
                />
                <UButton
                  :to="`/admin/students/${s.id}`"
                  icon="i-lucide-eye"
                  variant="ghost"
                  size="sm"
                  color="neutral"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!students.length">
            <td
              colspan="8"
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

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-subtle"
      >
        <p class="text-sm text-muted">
          Страница {{ page + 1 }} из {{ totalPages }} · {{ total }} записей
        </p>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            size="sm"
            color="neutral"
            :disabled="page === 0"
            @click="page--"
          />
          <span class="text-sm font-medium px-2">{{ page + 1 }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            size="sm"
            color="neutral"
            :disabled="page >= totalPages - 1"
            @click="page++"
          />
        </div>
      </div>
    </UCard>

    <!-- ─── Create Student Modal ──────────────────────────────────────────── -->
    <UModal
      v-model:open="showCreate"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Новый ученик
              </h2>
              <p class="text-sm text-muted mt-0.5">
                Создание учётной записи
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

          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              ФИО
            </p>
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

          <UFormField label="Уровень">
            <USelect
              v-model="form.level"
              :items="levelOptions"
              class="w-full"
            />
          </UFormField>

          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Учётная запись
            </p>
            <UFormField
              label="Email"
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
              <div class="flex gap-2">
                <UInput
                  v-model="form.password"
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
          </div>

          <div class="flex justify-end gap-3">
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

    <!-- ─── Edit Student Modal ────────────────────────────────────────────── -->
    <UModal
      v-model:open="showEdit"
      :ui="{ content: 'max-w-xl' }"
    >
      <template #content>
        <div class="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Редактирование
              </h2>
              <p class="text-sm text-muted">
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

          <UDivider />

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
            <UFormField label="Отчество">
              <UInput
                v-model="editForm.patronymic"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Телефон">
              <UInput
                v-model="editForm.phone"
                class="w-full"
              />
            </UFormField>
            <UFormField label="ИИН">
              <UInput
                v-model="editForm.iin"
                maxlength="12"
                class="w-full"
              />
            </UFormField>
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
            <UFormField label="Уровень">
              <USelect
                v-model="editForm.level"
                :items="levelOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showEdit = false"
            >
              Отмена
            </UButton>
            <UButton
              :loading="editSaving"
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
