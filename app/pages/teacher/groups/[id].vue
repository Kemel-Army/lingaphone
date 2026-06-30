<script setup lang="ts">
import { useTeacher, type TeacherStudent, type TeacherLesson } from '~/entities/teacher'
import { useGradeStudent } from '~/features/grade-student'
import { useLessonMaterials, type LessonMaterial } from '~/features/lesson-materials'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const groupId = String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id)

const { fetchGroupById, fetchAttendanceForLesson, createLesson } = useTeacher()
const { markAttendance, awardXp } = useGradeStudent()
const { list: listMaterials, upload: uploadMaterial, remove: removeMaterial, downloadUrl, uploading: materialUploading } = useLessonMaterials()

// ── Lesson creation modal ────────────────────────────────────────────────────
const showCreateLesson = ref(false)
const lessonForm = ref({ topic: '', startsAt: '', durationMin: 60, meetingUrl: '' })
const lessonCreating = ref(false)

const canCreateLesson = computed(
  () => lessonForm.value.topic.trim() && lessonForm.value.startsAt
)

const submitCreateLesson = async () => {
  if (!canCreateLesson.value) return
  lessonCreating.value = true
  try {
    await createLesson({
      groupId,
      topic: lessonForm.value.topic.trim(),
      startsAt: new Date(lessonForm.value.startsAt).toISOString(),
      durationMin: lessonForm.value.durationMin || 60,
      meetingUrl: lessonForm.value.meetingUrl.trim() || undefined
    })
    toast.add({ title: 'Урок создан', color: 'success', icon: 'i-lucide-check-circle' })
    showCreateLesson.value = false
    lessonForm.value = { topic: '', startsAt: '', durationMin: 60, meetingUrl: '' }
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка', description: String(e), color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    lessonCreating.value = false
  }
}

const { data, pending, error, refresh } = await useAsyncData(
  `teacher-group-${groupId}`,
  () => fetchGroupById(groupId)
)

const group = computed(() => data.value?.group ?? null)
const members = computed(() => data.value?.members ?? [])
const lessons = computed(() => data.value?.lessons ?? [])

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('members')

// ── Journal ─────────────────────────────────────────────────────────────────
const selectedLessonId = ref('')
const attendance = ref<Record<string, string>>({})
const attendanceSaving = ref<Record<string, boolean>>({})
const lessonTopic = ref('')
const topicSaving = ref(false)

const ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Был', icon: 'i-lucide-check', color: 'text-green-500', bg: 'bg-green-500/10 hover:bg-green-500/20', activeBg: 'bg-green-500 text-white' },
  { value: 'LATE', label: 'Опоздал', icon: 'i-lucide-clock', color: 'text-amber-500', bg: 'bg-amber-500/10 hover:bg-amber-500/20', activeBg: 'bg-amber-500 text-white' },
  { value: 'EXCUSED', label: 'Уважит.', icon: 'i-lucide-file-check', color: 'text-blue-500', bg: 'bg-blue-500/10 hover:bg-blue-500/20', activeBg: 'bg-blue-500 text-white' },
  { value: 'ABSENT', label: 'Прогул', icon: 'i-lucide-x', color: 'text-red-500', bg: 'bg-red-500/10 hover:bg-red-500/20', activeBg: 'bg-red-500 text-white' }
]

const lessonOptions = computed(() =>
  lessons.value.map(l => ({
    value: l.id,
    label: l.topic?.trim() ? `${formatDate(l.startsAt)} · ${l.topic}` : `${formatDate(l.startsAt)} · Без темы`
  }))
)

// Nearest lesson = first upcoming (lessons come sorted ascending); else the latest past one.
const nearestLessonId = computed(() => {
  const ls = lessons.value
  if (!ls.length) return ''
  const now = Date.now()
  const upcoming = ls.find(l => new Date(l.startsAt).getTime() >= now)
  return (upcoming ?? ls[ls.length - 1]!).id
})

// Preselect the nearest lesson once data is loaded so the teacher lands on the
// current lesson, not whatever the list happens to start with.
watch(lessons, () => {
  if (!selectedLessonId.value && nearestLessonId.value) {
    selectedLessonId.value = nearestLessonId.value
  }
}, { immediate: true })

watch(selectedLessonId, async (id) => {
  if (!id) return
  attendance.value = await fetchAttendanceForLesson(id)
  const lesson = lessons.value.find(l => l.id === id)
  lessonTopic.value = lesson?.topic ?? ''
  loadMaterials(id)
})

// ── Lesson materials ──────────────────────────────────────────────────────────
const materials = ref<LessonMaterial[]>([])
const materialsLoading = ref(false)
const materialInput = ref<HTMLInputElement | null>(null)

const loadMaterials = async (lessonId: string) => {
  materialsLoading.value = true
  try {
    materials.value = await listMaterials(lessonId)
  } catch {
    materials.value = []
  } finally {
    materialsLoading.value = false
  }
}

const onPickMaterials = () => materialInput.value?.click()

const onMaterialsSelected = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length || !selectedLessonId.value) return
  let ok = 0
  for (const file of Array.from(files)) {
    if (file.size > 10 * 1024 * 1024) {
      toast.add({ title: `«${file.name}» больше 10 МБ`, color: 'error', icon: 'i-lucide-x-circle' })
      continue
    }
    try {
      await uploadMaterial(selectedLessonId.value, file)
      ok++
    } catch (err) {
      toast.add({ title: `Не удалось загрузить «${file.name}»`, description: String(err), color: 'error', icon: 'i-lucide-x-circle' })
    }
  }
  if (materialInput.value) materialInput.value.value = ''
  if (ok) {
    toast.add({ title: ok === 1 ? 'Файл загружен' : `Загружено файлов: ${ok}`, color: 'success', icon: 'i-lucide-check-circle' })
    await loadMaterials(selectedLessonId.value)
  }
}

const openMaterial = async (m: LessonMaterial) => {
  const url = await downloadUrl(m.path)
  if (url) window.open(url, '_blank')
  else toast.add({ title: 'Не удалось открыть файл', color: 'error', icon: 'i-lucide-x-circle' })
}

const deleteMaterial = async (m: LessonMaterial) => {
  try {
    await removeMaterial(m.path)
    materials.value = materials.value.filter(x => x.path !== m.path)
    toast.add({ title: 'Материал удалён', color: 'success', icon: 'i-lucide-trash-2' })
  } catch {
    toast.add({ title: 'Не удалось удалить', description: 'Примените миграцию documents_delete_policy', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

const formatBytes = (b: number): string => {
  if (!b) return '—'
  if (b < 1024) return `${b} Б`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} КБ`
  return `${(b / 1024 / 1024).toFixed(1)} МБ`
}

const materialIcon = (mime: string): string => {
  if (mime.includes('pdf')) return 'i-lucide-file-text'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'i-lucide-presentation'
  if (mime.includes('sheet') || mime.includes('excel')) return 'i-lucide-table-2'
  if (mime.includes('word') || mime.includes('document')) return 'i-lucide-file-type'
  if (mime.startsWith('image/')) return 'i-lucide-image'
  return 'i-lucide-file'
}

const setAttendance = async (studentId: string, status: string) => {
  if (!selectedLessonId.value) return
  attendanceSaving.value[studentId] = true
  try {
    await markAttendance(selectedLessonId.value, studentId, status as 'PRESENT' | 'ABSENT' | 'LATE')
    attendance.value[studentId] = status
  } catch {
    toast.add({ title: 'Ошибка сохранения', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    attendanceSaving.value[studentId] = false
  }
}

const saveTopic = async () => {
  if (!selectedLessonId.value || !lessonTopic.value.trim()) return
  topicSaving.value = true
  try {
    const supabase = useTypedSupabaseClient()
    await supabase.from('Lesson').update({ topic: lessonTopic.value.trim() }).eq('id', selectedLessonId.value)
    toast.add({ title: 'Тема сохранена', color: 'success', icon: 'i-lucide-check-circle' })
    await refresh()
  } catch {
    toast.add({ title: 'Ошибка сохранения темы', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    topicSaving.value = false
  }
}

// ── XP Awarding ──────────────────────────────────────────────────────────────
const XP_PRESETS = [
  { label: 'Крутой ответ', amount: 10, icon: 'i-lucide-zap' },
  { label: 'Спикинг', amount: 15, icon: 'i-lucide-mic' },
  { label: 'Помощь другу', amount: 5, icon: 'i-lucide-heart' }
]

const xpLoading = ref<Record<string, boolean>>({})
const xpFlash = ref<Record<string, number | null>>({})

const giveXp = async (studentId: string, amount: number, reason: string) => {
  const key = `${studentId}-${amount}`
  xpLoading.value[key] = true
  try {
    await awardXp(studentId, amount, reason)
    xpFlash.value[studentId] = amount
    setTimeout(() => {
      xpFlash.value[studentId] = null
    }, 2000)
    toast.add({ title: `+${amount} XP`, description: `${reason}`, color: 'success', icon: 'i-lucide-zap' })
    await refresh()
  } catch {
    toast.add({ title: 'Ошибка начисления XP', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    xpLoading.value[key] = false
  }
}

// ── Display helpers ──────────────────────────────────────────────────────────
const levelColor = (level: string): 'info' | 'warning' | 'success' | 'error' | 'neutral' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'neutral' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    COMPLETED: 'success', IN_PROGRESS: 'warning', SCHEDULED: 'info', CANCELLED: 'error'
  }
  return map[status] ?? 'neutral'
}

const statusLabel: Record<string, string> = {
  COMPLETED: 'Завершён', IN_PROGRESS: 'Идёт', SCHEDULED: 'Запланирован', CANCELLED: 'Отменён'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const WEEKDAY_RU: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
}

const formatSchedule = (schedule: unknown): string => {
  if (!schedule || !Array.isArray(schedule) || !schedule.length) return '—'
  const first = schedule[0] as { weekday?: number, startTime?: string, durationMin?: number }
  const days = schedule.map((s: { weekday?: number }) => s.weekday ? (WEEKDAY_RU[s.weekday] ?? `#${s.weekday}`) : '?').join(', ')
  const time = first.startTime ?? ''
  const dur = first.durationMin ? ` (${first.durationMin} мин)` : ''
  return time ? `${days} · ${time}${dur}` : days
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
    <!-- Back nav -->
    <UButton
      to="/teacher/groups"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
      size="sm"
      class="-ml-2"
    >
      Все группы
    </UButton>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UAlert
      v-else-if="error || !group"
      color="error"
      icon="i-lucide-alert-circle"
      title="Группа не найдена"
    />

    <template v-else>
      <!-- Group hero -->
      <div class="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-500 to-primary-700 text-white p-6 sm:p-7">
        <div class="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
        <div class="absolute -right-16 bottom-0 size-32 rounded-full bg-white/5" />
        <div class="relative flex flex-wrap items-start gap-6">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-layers"
                class="size-5 opacity-80"
              />
              <span class="text-xs font-semibold uppercase tracking-wider opacity-80">Группа</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black leading-tight">
              {{ group.name }}
            </h1>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-sm font-semibold">
                <UIcon
                  name="i-lucide-bar-chart-3"
                  class="size-3.5"
                />
                {{ group.level }}
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-sm font-semibold">
                <UIcon
                  name="i-lucide-users"
                  class="size-3.5"
                />
                {{ group.studentCount }} / {{ group.maxStudents }}
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-sm font-semibold">
                <UIcon
                  name="i-lucide-calendar-clock"
                  class="size-3.5"
                />
                {{ formatSchedule(group.schedule) }}
              </span>
            </div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <UButton
              :to="`/teacher/homework/create?groupId=${groupId}`"
              icon="i-lucide-plus"
              size="sm"
              color="neutral"
              variant="solid"
              class="bg-white text-primary-700 hover:bg-white/90"
            >
              Создать ДЗ
            </UButton>
            <UButton
              :to="`/teacher/grades?groupId=${groupId}`"
              icon="i-lucide-table"
              size="sm"
              color="neutral"
              variant="solid"
              class="bg-white/20 text-white ring-1 ring-inset ring-white/50 hover:bg-white/30"
            >
              Журнал оценок
            </UButton>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <UTabs
        v-model="activeTab"
        :items="[
          { label: 'Ученики', value: 'members', icon: 'i-lucide-users' },
          { label: 'Журнал урока', value: 'journal', icon: 'i-lucide-clipboard-check' },
          { label: 'Занятия', value: 'lessons', icon: 'i-lucide-calendar' }
        ]"
      />

      <!-- Tab: Members -->
      <UCard
        v-if="activeTab === 'members'"
        :ui="{ body: 'p-0' }"
      >
        <template #header>
          <div class="flex items-center gap-2 font-semibold px-4 py-3">
            <UIcon
              name="i-lucide-users"
              class="size-4"
            />
            Ученики группы
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ members.length }}
            </UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="border-b border-subtle">
            <tr class="text-left text-xs text-muted uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">
                Ученик
              </th>
              <th class="px-4 py-3 font-medium">
                Уровень
              </th>
              <th class="px-4 py-3 font-medium">
                XP
              </th>
              <th class="px-4 py-3 font-medium">
                Стрик
              </th>
              <th class="px-4 py-3 font-medium">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in (members as TeacherStudent[])"
              :key="s.studentId"
              class="border-b border-subtle last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <UAvatar
                      :src="s.avatarUrl ?? undefined"
                      :alt="`${s.name} ${s.surname}`"
                      size="sm"
                    />
                    <!-- XP flash animation -->
                    <Transition
                      enter-active-class="transition-all duration-300"
                      enter-from-class="opacity-0 -translate-y-2"
                      leave-active-class="transition-all duration-500"
                      leave-to-class="opacity-0 -translate-y-4"
                    >
                      <span
                        v-if="xpFlash[s.studentId]"
                        class="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black text-green-500 whitespace-nowrap pointer-events-none"
                      >
                        +{{ xpFlash[s.studentId] }} XP
                      </span>
                    </Transition>
                  </div>
                  <span class="font-medium">{{ s.name }} {{ s.surname }}</span>
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
              <td class="px-4 py-3 font-mono text-sm">
                {{ s.totalXp.toLocaleString() }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-flame"
                    class="size-4 text-orange-400"
                  />
                  {{ s.dailyStreak }}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1 flex-wrap">
                  <!-- XP presets -->
                  <UTooltip
                    v-for="preset in XP_PRESETS"
                    :key="preset.label"
                    :text="`${preset.label} (+${preset.amount} XP)`"
                  >
                    <UButton
                      :icon="preset.icon"
                      variant="ghost"
                      size="xs"
                      color="success"
                      :loading="xpLoading[`${s.studentId}-${preset.amount}`]"
                      @click="giveXp(s.studentId, preset.amount, preset.label)"
                    />
                  </UTooltip>
                  <!-- Medal — disabled: monthly-medal flow not wired yet -->
                  <UTooltip text="Медали — в разработке">
                    <UButton
                      icon="i-lucide-medal"
                      variant="ghost"
                      size="xs"
                      color="warning"
                      disabled
                    />
                  </UTooltip>
                  <!-- View profile -->
                  <UButton
                    :to="`/teacher/students/${s.studentId}`"
                    icon="i-lucide-eye"
                    variant="ghost"
                    size="xs"
                    color="neutral"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!members.length">
              <td
                colspan="5"
                class="px-4 py-10 text-center text-muted"
              >
                В группе нет учеников
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <!-- Tab: Journal -->
      <div
        v-if="activeTab === 'journal'"
        class="space-y-4"
      >
        <!-- Lesson selector + topic editor -->
        <UCard>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-clipboard-check"
                class="size-5 text-primary"
              />
              <h3 class="font-semibold">
                Журнал урока
              </h3>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <UFormField label="Урок">
                <USelect
                  v-model="selectedLessonId"
                  :items="lessonOptions"
                  placeholder="Выберите урок…"
                />
              </UFormField>

              <UFormField
                v-if="selectedLessonId"
                label="Тема занятия"
              >
                <div class="flex gap-2">
                  <UInput
                    v-model="lessonTopic"
                    placeholder="Введите тему…"
                    class="flex-1"
                  />
                  <UButton
                    icon="i-lucide-save"
                    size="sm"
                    variant="outline"
                    :loading="topicSaving"
                    @click="saveTopic"
                  />
                </div>
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Attendance grid -->
        <UCard
          v-if="selectedLessonId && members.length"
          :ui="{ body: 'p-0' }"
        >
          <template #header>
            <div class="flex items-center gap-2 font-semibold px-4 py-3">
              <UIcon
                name="i-lucide-user-check"
                class="size-4 text-green-500"
              />
              Посещаемость
              <span class="text-xs text-muted font-normal ml-1">— изменения сохраняются автоматически</span>
            </div>
          </template>

          <div class="divide-y divide-subtle">
            <div
              v-for="s in (members as TeacherStudent[])"
              :key="s.studentId"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
            >
              <UAvatar
                :src="s.avatarUrl ?? undefined"
                :alt="`${s.name} ${s.surname}`"
                size="sm"
                class="shrink-0"
              />
              <p class="font-medium text-sm flex-1 min-w-0 truncate">
                {{ s.name }} {{ s.surname }}
              </p>

              <!-- Attendance buttons -->
              <div class="flex gap-1">
                <button
                  v-for="opt in ATTENDANCE_OPTIONS"
                  :key="opt.value"
                  :disabled="attendanceSaving[s.studentId]"
                  class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all"
                  :class="attendance[s.studentId] === opt.value ? opt.activeBg : `${opt.bg} ${opt.color}`"
                  @click="setAttendance(s.studentId, opt.value)"
                >
                  <UIcon
                    :name="opt.icon"
                    class="size-3"
                  />
                  <span class="hidden sm:inline">{{ opt.label }}</span>
                </button>
              </div>

              <!-- Live XP award row -->
              <div class="flex gap-1 ml-2 border-l border-subtle pl-2">
                <UTooltip
                  v-for="preset in XP_PRESETS"
                  :key="preset.label"
                  :text="`+${preset.amount} XP · ${preset.label}`"
                >
                  <UButton
                    :icon="preset.icon"
                    variant="ghost"
                    size="xs"
                    color="success"
                    :loading="xpLoading[`${s.studentId}-${preset.amount}`]"
                    @click="giveXp(s.studentId, preset.amount, preset.label)"
                  />
                </UTooltip>
                <UTooltip text="Медали — в разработке">
                  <UButton
                    icon="i-lucide-medal"
                    variant="ghost"
                    size="xs"
                    color="warning"
                    disabled
                  />
                </UTooltip>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Lesson materials -->
        <UCard
          v-if="selectedLessonId"
          :ui="{ body: 'p-0' }"
        >
          <template #header>
            <div class="flex items-center gap-2 px-4 py-3">
              <UIcon
                name="i-lucide-folder-open"
                class="size-4 text-primary"
              />
              <span class="font-semibold">Материалы урока</span>
              <UBadge
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ materials.length }}
              </UBadge>
              <UButton
                class="ml-auto"
                icon="i-lucide-upload"
                size="xs"
                :loading="materialUploading"
                @click="onPickMaterials"
              >
                Загрузить
              </UButton>
              <input
                ref="materialInput"
                type="file"
                multiple
                class="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*"
                @change="onMaterialsSelected"
              >
            </div>
          </template>

          <!-- Loading -->
          <div
            v-if="materialsLoading"
            class="flex justify-center py-8"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-5 animate-spin text-muted"
            />
          </div>

          <!-- Dropzone / empty -->
          <button
            v-else-if="!materials.length"
            type="button"
            class="w-full m-4 mt-0 rounded-xl border-2 border-dashed border-default px-4 py-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
            style="width: calc(100% - 2rem)"
            @click="onPickMaterials"
          >
            <UIcon
              name="i-lucide-cloud-upload"
              class="size-8 text-muted mx-auto"
            />
            <p class="mt-2 text-sm font-medium">
              Загрузите лекции, презентации, файлы
            </p>
            <p class="text-xs text-muted mt-0.5">
              PDF, Word, PowerPoint, Excel, изображения · до 10 МБ
            </p>
          </button>

          <!-- List -->
          <div
            v-else
            class="divide-y divide-subtle"
          >
            <div
              v-for="m in materials"
              :key="m.path"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
            >
              <div class="size-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <UIcon
                  :name="materialIcon(m.mimeType)"
                  class="size-4.5 text-primary"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">
                  {{ m.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ formatBytes(m.size) }}
                </p>
              </div>
              <UButton
                icon="i-lucide-download"
                variant="ghost"
                size="xs"
                color="neutral"
                @click="openMaterial(m)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                size="xs"
                color="error"
                @click="deleteMaterial(m)"
              />
            </div>
          </div>
        </UCard>

        <UAlert
          v-if="!selectedLessonId"
          icon="i-lucide-info"
          color="neutral"
          title="Выберите урок выше"
          description="После выбора урока откроется журнал посещаемости с возможностью начисления XP"
        />
      </div>

      <!-- Tab: Lessons -->
      <UCard
        v-if="activeTab === 'lessons'"
        :ui="{ body: 'p-0' }"
      >
        <template #header>
          <div class="flex items-center gap-2 font-semibold px-4 py-3">
            <UIcon
              name="i-lucide-calendar"
              class="size-4"
            />
            Занятия
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ lessons.length }}
            </UBadge>
            <UButton
              class="ml-auto"
              icon="i-lucide-plus"
              size="xs"
              @click="showCreateLesson = true"
            >
              Создать урок
            </UButton>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="border-b border-subtle">
            <tr class="text-left text-xs text-muted uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">
                Тема
              </th>
              <th class="px-4 py-3 font-medium">
                Дата
              </th>
              <th class="px-4 py-3 font-medium">
                Статус
              </th>
              <th class="px-4 py-3 font-medium">
                Длит.
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="l in (lessons as TeacherLesson[])"
              :key="l.id"
              class="border-b border-subtle last:border-0 hover:bg-muted/20 transition-colors"
              :class="l.id === nearestLessonId ? 'bg-primary/5' : ''"
            >
              <td class="px-4 py-3 font-medium">
                <div class="flex items-center gap-2">
                  <span :class="l.topic?.trim() ? '' : 'text-muted italic font-normal'">
                    {{ l.topic?.trim() ? l.topic : 'Без темы' }}
                  </span>
                  <UBadge
                    v-if="l.id === nearestLessonId"
                    color="primary"
                    variant="subtle"
                    size="xs"
                  >
                    Ближайший
                  </UBadge>
                </div>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ formatDate(l.startsAt) }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="statusColor(l.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ statusLabel[l.status] ?? l.status }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ l.durationMin }} мин
              </td>
              <td class="px-4 py-3">
                <UButton
                  icon="i-lucide-clipboard-check"
                  variant="ghost"
                  size="xs"
                  color="neutral"
                  @click="selectedLessonId = l.id; activeTab = 'journal'"
                />
              </td>
            </tr>
            <tr v-if="!lessons.length">
              <td
                colspan="5"
                class="px-4 py-10 text-center text-muted"
              >
                Занятий пока нет
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </template>

    <!-- Modal: Create Lesson -->
    <UModal v-model:open="showCreateLesson">
      <template #content>
        <div class="p-6 space-y-5">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-calendar-plus"
              class="size-5 text-primary"
            />
            <h2 class="text-lg font-bold">
              Новый урок
            </h2>
          </div>

          <UFormField
            label="Тема урока"
            required
          >
            <UInput
              v-model="lessonForm.topic"
              placeholder="Например: Present Simple — вопросы"
              class="w-full"
            />
          </UFormField>

          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField
              label="Дата и время"
              required
            >
              <UInput
                v-model="lessonForm.startsAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Длительность (мин)">
              <UInput
                v-model="lessonForm.durationMin"
                type="number"
                min="15"
                max="240"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Ссылка на конференцию (необязательно)">
            <UInput
              v-model="lessonForm.meetingUrl"
              placeholder="https://zoom.us/j/..."
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showCreateLesson = false"
            >
              Отмена
            </UButton>
            <UButton
              icon="i-lucide-check"
              :disabled="!canCreateLesson || lessonCreating"
              :loading="lessonCreating"
              @click="submitCreateLesson"
            >
              Создать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
