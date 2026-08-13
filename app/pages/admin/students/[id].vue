<script setup lang="ts">
import { useAdminStats } from '~/entities/admin-stats'
import { useLevelTracks } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const { fetchStudentById, updateStudent } = useAdminStats()
const { fetchLevelTracks } = useLevelTracks()

// Level → course-book matrix (ТЗ §2), drives the curator dropdown + bound book.
const { data: tracks } = await useAsyncData('level-tracks', fetchLevelTracks)

const { data, pending, refresh } = await useAsyncData(
  `admin-student-${route.params.id}`,
  () => fetchStudentById(String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id))
)

const student = computed(() => data.value?.student)
const medals = computed(() => data.value?.medals ?? [])
const group = computed(() => data.value?.group ?? null)
const subscription = computed(() => data.value?.subscription ?? null)
const attendance = computed(() => data.value?.attendance ?? [])
const upcomingLessons = computed(() => data.value?.upcomingLessons ?? [])
const parents = computed(() => data.value?.parents ?? [])

/**
 * "чт, 14.08 · 20:00" — KZ-local.
 *
 * Built from `en-CA`/`en-GB` parts and hard-coded Russian weekday names rather
 * than a `ru-RU` locale format: Node's ICU and the browser disagree on the
 * abbreviated Russian weekday/month, which shows up as a hydration mismatch.
 */
const MONTH_DAY_FMT = { timeZone: 'Asia/Almaty', day: '2-digit', month: '2-digit' } as const
const TIME_FMT = { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false } as const
const formatLessonDate = (iso: string) => {
  const d = new Date(iso)
  // en-CA gives YYYY-MM-DD, so the weekday index is read in the Almaty zone too.
  const kzIso = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' })
  const weekday = WEEKDAY_LABEL[new Date(`${kzIso}T12:00:00Z`).getUTCDay()]
  const date = d.toLocaleDateString('en-GB', MONTH_DAY_FMT).replace('/', '.')
  return `${weekday}, ${date} · ${d.toLocaleTimeString('en-GB', TIME_FMT)}`
}

const WEEKDAY_LABEL = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const SUBSCRIPTION_STATUS_META: Record<'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED', { label: string, color: 'success' | 'warning' | 'error' | 'neutral' }> = {
  ACTIVE: { label: 'Активен', color: 'success' },
  PAUSED: { label: 'Приостановлен', color: 'warning' },
  CANCELLED: { label: 'Отменён', color: 'error' },
  EXPIRED: { label: 'Истёк', color: 'neutral' }
}
const ATTENDANCE_META: Record<'PRESENT' | 'ABSENT' | 'LATE', { label: string, color: 'success' | 'error' | 'warning', icon: string }> = {
  PRESENT: { label: 'Был(а)', color: 'success', icon: 'i-lucide-check' },
  ABSENT: { label: 'Отсутствовал(а)', color: 'error', icon: 'i-lucide-x' },
  LATE: { label: 'Опоздал(а)', color: 'warning', icon: 'i-lucide-clock' }
}

// ─── Status ──────────────────────────────────────────────────────────────────
type StudentStatus = 'ACTIVE' | 'PAUSED' | 'DROPPED'
const STATUS_META: Record<StudentStatus, { label: string, color: 'success' | 'warning' | 'error' }> = {
  ACTIVE: { label: 'Активный', color: 'success' },
  PAUSED: { label: 'Приостановил обучение', color: 'warning' },
  DROPPED: { label: 'Бросил обучение', color: 'error' }
}
const statusOptions = (Object.keys(STATUS_META) as StudentStatus[]).map(value => ({
  label: STATUS_META[value].label,
  value
}))
const changingStatus = ref(false)
const changeStatus = async (status: StudentStatus) => {
  if (!student.value || status === student.value.status) return
  changingStatus.value = true
  try {
    await updateStudent(student.value.id, { status })
    toast.add({ title: `Статус изменён: ${STATUS_META[status].label}`, color: 'success', icon: 'i-lucide-check' })
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? String(e)
    toast.add({ title: 'Ошибка', description: msg, color: 'error' })
  } finally {
    changingStatus.value = false
  }
}

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
// Dropdown driven by the ТЗ matrix: level → book · tier · age. Curator picks a
// level; saving it binds the matching course book (Book.trackKey == level).
const levelOptions = computed(() =>
  (tracks.value ?? []).map(t => ({
    label: t.isActive
      ? `${t.level} · ${t.bookTitle} · ${t.tier} (${t.ageRange} лет)`
      : `${t.level} · ${t.bookTitle}`,
    value: t.level
  }))
)

/** The course book a given level binds to (from the matrix). */
const trackFor = (level: string) => (tracks.value ?? []).find(t => t.level === level) ?? null
const boundTrack = computed(() => student.value ? trackFor(student.value.level) : null)

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
                :color="STATUS_META[student.status].color"
                variant="subtle"
              >
                {{ STATUS_META[student.status].label }}
              </UBadge>
              <UBadge
                :color="levelColor(student.level)"
                variant="subtle"
              >
                Уровень {{ student.level }}
              </UBadge>
              <UBadge
                v-if="boundTrack"
                color="primary"
                variant="subtle"
                icon="i-lucide-book-open"
              >
                {{ boundTrack.bookTitle }}
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

          <!-- Status + Edit -->
          <div class="flex flex-col items-end gap-2 shrink-0">
            <USelect
              :model-value="student.status"
              :items="statusOptions"
              :loading="changingStatus"
              class="w-56"
              @update:model-value="changeStatus($event as StudentStatus)"
            />
            <UButton
              icon="i-lucide-edit"
              variant="outline"
              color="neutral"
              @click="openEdit"
            >
              Редактировать
            </UButton>
          </div>
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

      <!-- Group + Subscription -->
      <div class="grid sm:grid-cols-2 gap-3">
        <!-- Group / regular schedule -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-users"
                class="size-4 text-primary"
              />
              <h3 class="font-semibold">
                Группа
              </h3>
            </div>
          </template>

          <div v-if="group">
            <div class="flex items-center gap-3 mb-3">
              <UAvatar
                :src="group.teacherAvatarUrl ?? undefined"
                :alt="group.teacherName"
                size="sm"
              />
              <div class="min-w-0">
                <NuxtLink
                  :to="`/admin/groups/${group.id}`"
                  class="font-semibold hover:underline truncate block"
                >
                  {{ group.name }}
                </NuxtLink>
                <p class="text-xs text-muted truncate">
                  {{ group.teacherName }} · {{ group.level }}
                </p>
              </div>
            </div>
            <div
              v-if="group.schedule.length"
              class="flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="(slot, i) in group.schedule"
                :key="i"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ WEEKDAY_LABEL[slot.weekday] }} {{ slot.startTime }}
              </UBadge>
            </div>
            <p
              v-else
              class="text-xs text-muted"
            >
              Расписание не задано
            </p>
          </div>
          <div
            v-else
            class="py-6 text-center text-sm text-muted"
          >
            <UIcon
              name="i-lucide-users"
              class="size-6 mx-auto mb-2 opacity-30"
            />
            <p class="mb-3">
              Не состоит в группе
            </p>
            <UButton
              to="/admin/groups"
              size="sm"
              variant="soft"
              icon="i-lucide-plus"
            >
              Добавить в группу
            </UButton>
          </div>
        </UCard>

        <!-- Subscription -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-credit-card"
                class="size-4 text-primary"
              />
              <h3 class="font-semibold">
                Абонемент
              </h3>
            </div>
          </template>

          <div v-if="subscription">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-semibold">
                  {{ subscription.plan }}
                </p>
                <p
                  v-if="subscription.course"
                  class="text-xs text-muted"
                >
                  {{ subscription.course }}
                </p>
              </div>
              <UBadge
                :color="SUBSCRIPTION_STATUS_META[subscription.status].color"
                variant="subtle"
                size="sm"
              >
                {{ SUBSCRIPTION_STATUS_META[subscription.status].label }}
              </UBadge>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-lg bg-muted/40 p-2">
                <p class="text-xs text-muted">
                  Осталось занятий
                </p>
                <p class="font-bold">
                  {{ Math.max(subscription.lessonsTotal - subscription.lessonsUsed, 0) }} / {{ subscription.lessonsTotal }}
                </p>
              </div>
              <div class="rounded-lg bg-muted/40 p-2">
                <p class="text-xs text-muted">
                  Действует до
                </p>
                <p class="font-bold">
                  {{ formatDate(subscription.endAt) }}
                </p>
              </div>
            </div>
          </div>
          <div
            v-else
            class="py-6 text-center text-sm text-muted"
          >
            <UIcon
              name="i-lucide-credit-card"
              class="size-6 mx-auto mb-2 opacity-30"
            />
            Нет активного абонемента
          </div>
        </UCard>
      </div>

      <!-- Upcoming lessons + parent contacts -->
      <div class="grid sm:grid-cols-2 gap-3">
        <!-- Расписание занятий: конкретные ближайшие уроки, не шаблон недели -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-calendar-days"
                class="size-4 text-primary"
              />
              <h3 class="font-semibold">
                Ближайшие занятия
              </h3>
            </div>
          </template>

          <div
            v-if="upcomingLessons.length"
            class="divide-y divide-subtle"
          >
            <div
              v-for="l in upcomingLessons"
              :key="l.id"
              class="flex items-center justify-between gap-3 py-2.5"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium truncate flex items-center gap-1.5">
                  <UIcon
                    :name="LESSON_TYPE_MAP[l.type].icon"
                    class="size-3.5 shrink-0 text-muted"
                    :title="LESSON_TYPE_MAP[l.type].label"
                  />
                  {{ formatLessonDate(l.startsAt) }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ l.groupName }} · {{ l.teacherName }}
                </p>
              </div>
              <UBadge
                :color="LESSON_TYPE_MAP[l.type].color"
                variant="subtle"
                size="sm"
                class="shrink-0"
              >
                {{ LESSON_TYPE_MAP[l.type].shortLabel }}
              </UBadge>
            </div>
          </div>
          <div
            v-else
            class="py-6 text-center text-sm text-muted"
          >
            <UIcon
              name="i-lucide-calendar-x"
              class="size-6 mx-auto mb-2 opacity-30"
            />
            <p>Запланированных занятий нет</p>
          </div>
        </UCard>

        <!-- Контакты: привязанные родители -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-contact"
                class="size-4 text-primary"
              />
              <h3 class="font-semibold">
                Контакты
              </h3>
            </div>
          </template>

          <div
            v-if="parents.length"
            class="divide-y divide-subtle"
          >
            <div
              v-for="p in parents"
              :key="p.id"
              class="py-2.5"
            >
              <p class="text-sm font-medium truncate">
                {{ p.surname }} {{ p.name }}
              </p>
              <p class="text-xs text-muted truncate">
                <a
                  v-if="p.phone"
                  :href="`tel:${p.phone}`"
                  class="hover:underline"
                >{{ p.phone }}</a>
                <span v-if="p.phone && p.email"> · </span>
                <a
                  :href="`mailto:${p.email}`"
                  class="hover:underline"
                >{{ p.email }}</a>
              </p>
            </div>
          </div>
          <div
            v-else
            class="py-6 text-center text-sm text-muted"
          >
            <UIcon
              name="i-lucide-user-x"
              class="size-6 mx-auto mb-2 opacity-30"
            />
            <p>Родитель не привязан</p>
          </div>
        </UCard>
      </div>

      <!-- Attendance history -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-calendar-check"
              class="size-4 text-primary"
            />
            <h3 class="font-semibold">
              История посещений
            </h3>
          </div>
        </template>

        <div
          v-if="attendance.length"
          class="divide-y divide-subtle"
        >
          <div
            v-for="a in attendance"
            :key="a.lessonId"
            class="flex items-center justify-between py-2.5"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">
                {{ a.lessonTopic || a.groupName }}
              </p>
              <p class="text-xs text-muted">
                {{ a.groupName }} · {{ formatDate(a.lessonStartsAt) }}
              </p>
            </div>
            <UBadge
              :color="ATTENDANCE_META[a.status].color"
              variant="subtle"
              size="sm"
              :icon="ATTENDANCE_META[a.status].icon"
            >
              {{ ATTENDANCE_META[a.status].label }}
            </UBadge>
          </div>
        </div>
        <div
          v-else
          class="py-8 text-center text-muted text-sm"
        >
          <UIcon
            name="i-lucide-calendar-check"
            class="size-8 mx-auto mb-2 opacity-30"
          />
          <p>Посещений ещё нет</p>
        </div>
      </UCard>

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
          <UFormField
            label="Уровень английского"
            help="При сохранении к ученику автоматически привяжется учебник этого уровня и откроется в «Мой путь»."
          >
            <USelect
              v-model="editForm.level"
              :items="levelOptions"
              class="w-full"
            />
            <p
              v-if="trackFor(editForm.level)"
              class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <UIcon
                name="i-lucide-book-open"
                class="size-3.5"
              />
              Учебник: {{ trackFor(editForm.level)?.bookTitle }}
              <span
                v-if="!trackFor(editForm.level)?.isActive"
                class="text-error"
              >— исключён из программы</span>
            </p>
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
