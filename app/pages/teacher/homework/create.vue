<script setup lang="ts">
import { useTeacher, type TeacherLesson } from '~/entities/teacher'
import { useGradeStudent } from '~/features/grade-student'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { fetchMyGroups, fetchMyLessons } = useTeacher()
const { createHomework } = useGradeStudent()

const { data: groups } = await useAsyncData('teacher-groups-create', fetchMyGroups)

const selectedGroupId = ref((route.query.groupId as string) ?? '')
const selectedLessonId = ref('')
const format = ref('TEXT')
const title = ref('')
const description = ref('')
const dueAt = ref('')
const maxScore = ref(10)
const prompt = ref('')

interface Question {
  question: string
  options: string[]
  answer: number
}
const questions = ref<Question[]>([{ question: '', options: ['', '', '', ''], answer: 0 }])

const lessons = ref<TeacherLesson[]>([])
const lessonsLoading = ref(false)

watch(selectedGroupId, async (gid) => {
  selectedLessonId.value = ''
  if (!gid) { lessons.value = []; return }
  lessonsLoading.value = true
  try {
    lessons.value = await fetchMyLessons(gid)
  } catch {
    lessons.value = []
  } finally {
    lessonsLoading.value = false
  }
}, { immediate: true })

const groupOptions = computed(() => (groups.value ?? []).map(g => ({ value: g.id, label: g.name })))
const lessonOptions = computed(() =>
  (lessons.value ?? []).map(l => ({
    value: l.id,
    label: `${new Date(l.startsAt).toLocaleDateString('ru-RU')} — ${l.topic}`
  }))
)

const formatOptions = [
  { value: 'TEXT', label: 'Текст', icon: 'i-lucide-file-text', desc: 'Развёрнутый письменный ответ' },
  { value: 'INPUT', label: 'Краткий', icon: 'i-lucide-pencil', desc: 'Короткий ответ или фраза' },
  { value: 'TEST', label: 'Тест', icon: 'i-lucide-list-checks', desc: 'Варианты ответов A/B/C/D' },
  { value: 'ORAL', label: 'Устный', icon: 'i-lucide-mic', desc: 'Аудио-ответ ученика' },
  { value: 'FILE', label: 'Файл', icon: 'i-lucide-upload', desc: 'Загрузка документа или фото' }
]

const addQuestion = () => {
  questions.value.push({ question: '', options: ['', '', '', ''], answer: 0 })
}

const removeQuestion = (i: number) => {
  questions.value.splice(i, 1)
}

const loading = ref(false)

const canSubmit = computed(() =>
  selectedLessonId.value && title.value.trim() && dueAt.value
)

const submit = async () => {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await createHomework({
      lessonId: selectedLessonId.value,
      format: format.value,
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      dueAt: new Date(dueAt.value).toISOString(),
      maxScore: maxScore.value,
      questions: format.value === 'TEST' ? questions.value : undefined,
      prompt: format.value !== 'TEST' ? prompt.value.trim() || undefined : undefined
    })
    toast.add({ title: 'Задание создано', color: 'success', icon: 'i-lucide-check' })
    router.push('/teacher/homework')
  } catch (e) {
    toast.add({ title: 'Ошибка', description: String(e), color: 'error', icon: 'i-lucide-x' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton
        to="/teacher/homework"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
        color="neutral"
      />
      <div>
        <h1 class="text-2xl font-bold">
          Создать задание
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Укажите урок, формат и содержание
        </p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 items-start">
      <!-- Left: main form -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Step 1: Group & Lesson -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="size-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                1
              </div>
              <span class="font-semibold">Группа и урок</span>
            </div>
          </template>
          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField
              label="Группа"
              required
            >
              <USelect
                v-model="selectedGroupId"
                :items="groupOptions"
                placeholder="Выберите группу"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Урок"
              required
            >
              <USelect
                v-model="selectedLessonId"
                :items="lessonOptions"
                placeholder="Выберите урок"
                :disabled="!selectedGroupId || lessonsLoading || !lessonOptions.length"
                class="w-full"
              />
              <p
                v-if="selectedGroupId && !lessonsLoading && !lessonOptions.length"
                class="text-xs text-muted mt-1"
              >
                В этой группе нет уроков
              </p>
            </UFormField>
          </div>
        </UCard>

        <!-- Step 2: Format -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="size-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                2
              </div>
              <span class="font-semibold">Формат задания</span>
            </div>
          </template>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              v-for="opt in formatOptions"
              :key="opt.value"
              type="button"
              class="group relative rounded-xl border-2 p-3 text-left transition-all"
              :class="format === opt.value
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-default hover:border-primary/40'"
              @click="format = opt.value"
            >
              <div class="flex items-center gap-2 mb-1.5">
                <UIcon
                  :name="opt.icon"
                  class="size-4"
                  :class="format === opt.value ? 'text-primary' : 'text-muted'"
                />
                <span
                  class="text-sm font-semibold"
                  :class="format === opt.value ? 'text-primary' : ''"
                >{{ opt.label }}</span>
                <UIcon
                  v-if="format === opt.value"
                  name="i-lucide-check-circle"
                  class="size-3.5 text-primary ml-auto"
                />
              </div>
              <p class="text-xs text-muted leading-tight">
                {{ opt.desc }}
              </p>
            </button>
          </div>
        </UCard>

        <!-- Step 3: Content -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="size-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                3
              </div>
              <span class="font-semibold">Содержание</span>
            </div>
          </template>
          <div class="space-y-4">
            <UFormField
              label="Название задания"
              required
            >
              <UInput
                v-model="title"
                placeholder="Например: ДЗ — Present Simple"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Описание / инструкция">
              <UTextarea
                v-model="description"
                placeholder="Дополнительные пояснения для ученика..."
                :rows="2"
                class="w-full"
              />
            </UFormField>

            <!-- Non-TEST prompt -->
            <UFormField
              v-if="format !== 'TEST'"
              label="Задание / вопрос"
            >
              <UTextarea
                v-model="prompt"
                :placeholder="format === 'ORAL' ? 'Опишите, о чём нужно рассказать...'
                  : format === 'FILE' ? 'Что нужно загрузить...'
                    : 'Сформулируйте задачу...'"
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <!-- TEST builder -->
            <div
              v-if="format === 'TEST'"
              class="space-y-4"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold">
                  Вопросы
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="ml-1"
                  >
                    {{ questions.length }}
                  </UBadge>
                </p>
                <UButton
                  size="sm"
                  variant="outline"
                  icon="i-lucide-plus"
                  @click="addQuestion"
                >
                  Добавить вопрос
                </UButton>
              </div>

              <div
                v-for="(q, i) in questions"
                :key="i"
                class="rounded-xl border border-default bg-muted/20 p-4 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wide text-muted">
                    Вопрос {{ i + 1 }}
                  </span>
                  <UButton
                    v-if="questions.length > 1"
                    size="xs"
                    variant="ghost"
                    color="error"
                    icon="i-lucide-trash-2"
                    @click="removeQuestion(i)"
                  />
                </div>
                <UInput
                  v-model="q.question"
                  placeholder="Текст вопроса..."
                  class="w-full"
                />
                <div class="space-y-2">
                  <div
                    v-for="(_, oi) in q.options"
                    :key="oi"
                    class="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      class="size-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
                      :class="q.answer === oi
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted hover:border-primary/60'"
                      :title="`Правильный ответ ${oi + 1}`"
                      @click="q.answer = oi"
                    >
                      <span class="text-[10px] font-bold">{{ ['A', 'B', 'C', 'D'][oi] }}</span>
                    </button>
                    <UInput
                      v-model="q.options[oi]"
                      :placeholder="`Вариант ${oi + 1}`"
                      size="sm"
                      class="flex-1"
                    />
                  </div>
                </div>
                <p class="text-xs text-muted">
                  Нажмите букву, чтобы отметить правильный ответ
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Right: sidebar settings + submit -->
      <div class="space-y-4">
        <!-- Settings card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-settings-2"
                class="size-4 text-muted"
              />
              <span class="font-semibold">Параметры</span>
            </div>
          </template>
          <div class="space-y-4">
            <UFormField
              label="Срок сдачи"
              required
            >
              <UInput
                v-model="dueAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Максимальный балл">
              <UInput
                v-model="maxScore"
                type="number"
                min="1"
                max="100"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Summary card -->
        <UCard class="bg-muted/30">
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted">Формат</span>
              <UBadge
                color="primary"
                variant="subtle"
                size="sm"
              >
                {{ formatOptions.find(f => f.value === format)?.label ?? format }}
              </UBadge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Урок выбран</span>
              <UIcon
                :name="selectedLessonId ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                :class="selectedLessonId ? 'text-success' : 'text-muted'"
                class="size-4"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Срок указан</span>
              <UIcon
                :name="dueAt ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                :class="dueAt ? 'text-success' : 'text-muted'"
                class="size-4"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Название</span>
              <UIcon
                :name="title.trim() ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                :class="title.trim() ? 'text-success' : 'text-muted'"
                class="size-4"
              />
            </div>
          </div>
        </UCard>

        <!-- Actions -->
        <div class="flex flex-col gap-2">
          <UButton
            block
            :disabled="!canSubmit || loading"
            :loading="loading"
            icon="i-lucide-send"
            size="lg"
            @click="submit"
          >
            Создать задание
          </UButton>
          <UButton
            block
            to="/teacher/homework"
            variant="ghost"
            color="neutral"
          >
            Отмена
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
