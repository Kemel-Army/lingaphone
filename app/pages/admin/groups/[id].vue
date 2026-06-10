<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const supabase = useTypedSupabaseClient()
const groupId = Array.isArray(route.params.id) ? route.params.id[0]! : route.params.id

// ─── Fetch group ──────────────────────────────────────────────────────────────

interface GroupDetail {
  id: string
  name: string
  level: string
  maxStudents: number
  schedule: Record<string, unknown>
  createdAt: string
  teacherName: string
  teacherAvatar: string | null
  teacherEmail: string
}

interface GroupStudent {
  id: string
  name: string
  surname: string
  email: string
  avatarUrl: string | null
  level: string
  totalXp: number
  dailyStreak: number
  joinedAt: string
}

interface GroupLesson {
  id: string
  date: string
  topic: string | null
  presentCount: number
  totalCount: number
}

const { data: group, error: groupError } = await useAsyncData(`group-${groupId}`, async () => {
  const { data, error } = await supabase
    .from('Group')
    .select('id, name, level, maxStudents, schedule, createdAt, Teacher!teacherId ( User!userId ( name, surname, email, avatarUrl ) )')
    .eq('id', groupId)
    .single() as unknown as {
    data: {
      id: string
      name: string
      level: string
      maxStudents: number
      schedule: Record<string, unknown>
      createdAt: string
      Teacher: { User: { name: string, surname: string, email: string, avatarUrl: string | null } | null } | null
    } | null
    error: unknown
  }
  if (error || !data) throw new Error('Group not found')

  const teacher = Array.isArray(data.Teacher) ? data.Teacher[0] : data.Teacher
  const tUser = teacher ? (Array.isArray(teacher.User) ? teacher.User[0] : teacher.User) : null

  return {
    id: data.id,
    name: data.name,
    level: data.level,
    maxStudents: data.maxStudents,
    schedule: data.schedule ?? {},
    createdAt: data.createdAt,
    teacherName: tUser ? `${tUser.name} ${tUser.surname}`.trim() : '—',
    teacherAvatar: tUser?.avatarUrl ?? null,
    teacherEmail: tUser?.email ?? ''
  } as GroupDetail
})

if (groupError.value) {
  throw createError({ statusCode: 404, message: 'Группа не найдена' })
}

// ─── Fetch members ────────────────────────────────────────────────────────────

const { data: members, refresh: refreshMembers } = await useAsyncData(`group-members-${groupId}`, async () => {
  const { data, error } = await supabase
    .from('GroupMember')
    .select('studentId, joinedAt, Student!studentId ( id, level, totalXp, dailyStreak, User!userId ( name, surname, email, avatarUrl ) )')
    .eq('groupId', groupId)
    .order('joinedAt', { ascending: true }) as unknown as {
    data: {
      studentId: string
      joinedAt: string
      Student: {
        id: string
        level: string
        totalXp: number
        dailyStreak: number
        User: { name: string, surname: string, email: string, avatarUrl: string | null } | null
      } | null
    }[] | null
    error: unknown
  }

  if (error) return []

  return (data ?? []).map((m) => {
    const student = Array.isArray(m.Student) ? m.Student[0] : m.Student
    const user = student ? (Array.isArray(student.User) ? student.User[0] : student.User) : null
    return {
      id: student?.id ?? m.studentId,
      name: user?.name ?? '',
      surname: user?.surname ?? '',
      email: user?.email ?? '',
      avatarUrl: user?.avatarUrl ?? null,
      level: student?.level ?? '',
      totalXp: student?.totalXp ?? 0,
      dailyStreak: student?.dailyStreak ?? 0,
      joinedAt: m.joinedAt
    } as GroupStudent
  })
})

// ─── Fetch lessons (last 10) ──────────────────────────────────────────────────

const { data: lessons } = await useAsyncData(`group-lessons-${groupId}`, async () => {
  const { data, error } = await supabase
    .from('Lesson')
    .select('id, date, topic, presentCount, totalCount')
    .eq('groupId', groupId)
    .order('date', { ascending: false })
    .limit(10) as unknown as {
    data: { id: string, date: string, topic: string | null, presentCount: number, totalCount: number }[] | null
    error: unknown
  }

  if (error) return []
  return (data ?? []) as GroupLesson[]
})

// ─── Add students to group ───────────────────────────────────────────────────

const showAddStudents = ref(false)
const addingStudents = ref(false)
const studentSearchQ = ref('')
const selectedStudentIds = ref<string[]>([])

const { data: allStudents } = await useAsyncData(`all-students-${groupId}`, async () => {
  const { data } = await supabase
    .from('Student')
    .select('id, level, User!userId ( name, surname )')
    .order('createdAt', { ascending: false }) as unknown as {
    data: { id: string, level: string, User: { name: string, surname: string } | null }[] | null
  }
  return data ?? []
})

const currentMemberIds = computed(() => new Set((members.value ?? []).map(m => m.id)))

const availableStudents = computed(() => {
  const q = studentSearchQ.value.toLowerCase().trim()
  return (allStudents.value ?? [])
    .filter(s => !currentMemberIds.value.has(s.id))
    .filter((s) => {
      if (!q) return true
      const user = Array.isArray(s.User) ? s.User[0] : s.User
      return `${user?.surname ?? ''} ${user?.name ?? ''} ${s.level}`.toLowerCase().includes(q)
    })
    .map((s) => {
      const user = Array.isArray(s.User) ? s.User[0] : s.User
      return { id: s.id, label: `${user?.surname ?? ''} ${user?.name ?? ''} — ${s.level}` }
    })
})

const openAddStudents = () => {
  selectedStudentIds.value = []
  studentSearchQ.value = ''
  showAddStudents.value = true
}

const submitAddStudents = async () => {
  if (!selectedStudentIds.value.length) return
  addingStudents.value = true
  try {
    const { error } = await supabase
      .from('GroupMember')
      .insert(selectedStudentIds.value.map(sid => ({ groupId, studentId: sid })))
    if (error) throw error
    toast.add({ title: `Добавлено ${selectedStudentIds.value.length} уч.`, color: 'success', icon: 'i-lucide-check' })
    showAddStudents.value = false
    await refreshMembers()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: String((e as { message?: string })?.message ?? e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    addingStudents.value = false
  }
}

// ─── Remove student from group ────────────────────────────────────────────────

const removingId = ref<string | null>(null)
const removeStudent = async (studentId: string) => {
  removingId.value = studentId
  try {
    const { error } = await supabase
      .from('GroupMember')
      .delete()
      .eq('groupId', groupId)
      .eq('studentId', studentId)
    if (error) throw error
    toast.add({ title: 'Ученик удалён из группы', color: 'success', icon: 'i-lucide-check' })
    await refreshMembers()
  } catch {
    toast.add({ title: 'Ошибка', color: 'error', icon: 'i-lucide-x' })
  } finally {
    removingId.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BadgeColor = 'info' | 'warning' | 'success' | 'error' | 'neutral'
const levelColor = (level: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const attendancePct = (present: number, total: number) =>
  total > 0 ? Math.round(present / total * 100) : 0

const attendanceColor = (pct: number) => {
  if (pct >= 85) return 'text-green-600 dark:text-green-400'
  if (pct >= 65) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const formatSchedule = (schedule: Record<string, unknown>): string => {
  if (!schedule?.days) return 'Не указано'
  const raw = schedule.days as (string | { label?: string, value?: string })[]
  const days = raw.map(d => (typeof d === 'object' ? (d.value ?? d.label ?? '') : d)).filter(Boolean)
  if (!days.length) return 'Не указано'
  const time = (schedule.time as string) ?? ''
  return `${days.join(', ')} ${time}`.trim()
}

const avgXp = computed(() => {
  if (!members.value?.length) return 0
  return Math.round(members.value.reduce((s, m) => s + m.totalXp, 0) / members.value.length)
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
    <!-- Back -->
    <NuxtLink
      to="/admin/groups"
      class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-4"
      />
      Все группы
    </NuxtLink>

    <!-- Header -->
    <div
      v-if="group"
      class="flex items-start justify-between gap-4 flex-wrap"
    >
      <div>
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-2xl font-bold">
            {{ group.name }}
          </h1>
          <UBadge
            :color="levelColor(group.level)"
            variant="subtle"
          >
            {{ group.level }}
          </UBadge>
        </div>
        <p class="text-sm text-muted mt-1">
          Создана {{ new Date(group.createdAt).toLocaleDateString('ru-RU') }}
          · Расписание: {{ formatSchedule(group.schedule) }}
        </p>
      </div>
    </div>

    <!-- Summary cards -->
    <div
      v-if="group"
      class="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums text-blue-500">
            {{ members?.length ?? 0 }}
          </p>
          <p class="text-xs text-muted mt-1">
            Учеников / {{ group.maxStudents }}
          </p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums text-green-500">
            {{ avgXp.toLocaleString() }}
          </p>
          <p class="text-xs text-muted mt-1">
            Средний XP
          </p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums text-purple-500">
            {{ lessons?.length ?? 0 }}
          </p>
          <p class="text-xs text-muted mt-1">
            Уроков проведено
          </p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="flex items-center justify-center gap-1.5">
            <UAvatar
              :src="group?.teacherAvatar ?? undefined"
              :alt="group?.teacherName"
              size="xs"
            />
            <p class="text-sm font-semibold truncate">
              {{ group?.teacherName }}
            </p>
          </div>
          <p class="text-xs text-muted mt-1">
            Учитель
          </p>
        </div>
      </UCard>
    </div>

    <!-- Two columns -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Students list -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold">
            Ученики ({{ members?.length ?? 0 }})
          </h2>
          <UButton
            icon="i-lucide-user-plus"
            size="sm"
            variant="soft"
            @click="openAddStudents"
          >
            Добавить
          </UButton>
        </div>
        <UCard :ui="{ body: 'p-0' }">
          <div
            v-if="!members?.length"
            class="py-12 text-center text-muted text-sm"
          >
            <UIcon
              name="i-lucide-users"
              class="size-8 mx-auto mb-2 opacity-30"
            />
            В группе нет учеников
          </div>
          <table
            v-else
            class="w-full text-sm"
          >
            <thead>
              <tr class="border-b border-subtle bg-muted/10">
                <th class="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  Ученик
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  XP
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  Стрик
                </th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in members"
                :key="s.id"
                class="border-b border-subtle last:border-0 hover:bg-muted/10 group"
              >
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-2">
                    <UAvatar
                      :src="s.avatarUrl ?? undefined"
                      :alt="`${s.name} ${s.surname}`"
                      size="xs"
                    />
                    <div>
                      <p class="font-medium leading-tight">
                        {{ s.surname }} {{ s.name }}
                      </p>
                      <p class="text-xs text-muted">
                        {{ s.email }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-2.5 font-mono font-semibold text-primary">
                  {{ s.totalXp.toLocaleString() }}
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-1">
                    <UIcon
                      name="i-lucide-flame"
                      class="size-3.5"
                      :class="s.dailyStreak > 0 ? 'text-orange-400' : 'text-muted'"
                    />
                    <span :class="s.dailyStreak > 0 ? 'font-semibold' : 'text-muted'">{{ s.dailyStreak }}</span>
                  </div>
                </td>
                <td class="px-4 py-2.5">
                  <UButton
                    icon="i-lucide-user-minus"
                    variant="ghost"
                    size="xs"
                    color="error"
                    :loading="removingId === s.id"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="removeStudent(s.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>
      </div>

      <!-- Lessons history -->
      <div>
        <h2 class="text-base font-semibold mb-3">
          Последние уроки
        </h2>
        <UCard :ui="{ body: 'p-0' }">
          <div
            v-if="!lessons?.length"
            class="py-12 text-center text-muted text-sm"
          >
            <UIcon
              name="i-lucide-calendar-x"
              class="size-8 mx-auto mb-2 opacity-30"
            />
            Уроки ещё не проводились
          </div>
          <table
            v-else
            class="w-full text-sm"
          >
            <thead>
              <tr class="border-b border-subtle bg-muted/10">
                <th class="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  Дата
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  Тема
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  Посещ.
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="l in lessons"
                :key="l.id"
                class="border-b border-subtle last:border-0 hover:bg-muted/10"
              >
                <td class="px-4 py-2.5 text-muted whitespace-nowrap">
                  {{ new Date(l.date).toLocaleDateString('ru-RU') }}
                </td>
                <td class="px-4 py-2.5">
                  <span
                    v-if="l.topic"
                    class="font-medium"
                  >{{ l.topic }}</span>
                  <span
                    v-else
                    class="text-muted"
                  >—</span>
                </td>
                <td class="px-4 py-2.5">
                  <span
                    class="font-semibold"
                    :class="attendanceColor(attendancePct(l.presentCount, l.totalCount))"
                  >
                    {{ l.presentCount }}/{{ l.totalCount }}
                    <span class="text-xs font-normal text-muted">({{ attendancePct(l.presentCount, l.totalCount) }}%)</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>
      </div>
    </div>
    <!-- ─── Add Students Modal ──────────────────────────────────────────────── -->
    <UModal
      v-model:open="showAddStudents"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">
                Добавить учеников
              </h2>
              <p class="text-sm text-muted mt-0.5">
                Выберите из незачисленных учеников
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showAddStudents = false"
            />
          </div>

          <UInput
            v-model="studentSearchQ"
            icon="i-lucide-search"
            placeholder="Поиск по ФИО или уровню..."
            class="w-full"
          />

          <div class="max-h-72 overflow-y-auto border border-subtle rounded-lg divide-y divide-subtle">
            <label
              v-for="s in availableStudents"
              :key="s.id"
              class="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 cursor-pointer text-sm"
            >
              <input
                v-model="selectedStudentIds"
                type="checkbox"
                :value="s.id"
                class="rounded"
              >
              <span>{{ s.label }}</span>
            </label>
            <div
              v-if="!availableStudents.length"
              class="px-3 py-6 text-center text-muted text-sm"
            >
              {{ studentSearchQ ? 'Ничего не найдено' : 'Все ученики уже в группе' }}
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-sm text-muted">
              Выбрано: {{ selectedStudentIds.length }}
            </span>
            <div class="flex gap-3">
              <UButton
                variant="ghost"
                color="neutral"
                @click="showAddStudents = false"
              >
                Отмена
              </UButton>
              <UButton
                :disabled="!selectedStudentIds.length || addingStudents"
                :loading="addingStudents"
                icon="i-lucide-user-plus"
                @click="submitAddStudents"
              >
                Добавить
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
