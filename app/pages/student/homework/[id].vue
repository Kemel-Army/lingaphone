<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import { speak, useRecognition, similarity } from '~/shared/composables/useSpeech'
import type { Database, Json } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type HomeworkFormat = Database['public']['Enums']['HomeworkFormat']
type HomeworkStatus = Database['public']['Enums']['HomeworkStatus']

interface TestQuestion { id: string, text: string, options: Array<{ id: string, text: string }>, correctOptionId: string }
interface InputQuestion { id: string, prompt: string, acceptableAnswers: string[] }
interface OralPrompt { id: string, target: string, ipa?: string, translation?: string }
interface TextPrompt { prompt: string, minWords: number }
interface OralAttempt { promptId: string, transcript: string, score: number }

const route = useRoute()
const { homeworkList, submitHomework, pending } = useLingafonStudent()

const homeworkId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})
const homework = computed(() => homeworkList.value.find((h: { id: string }) => h.id === homeworkId.value) ?? null)
/**
 * Type-safe alias for use inside `v-else` blocks where homework is guaranteed
 * non-null at runtime. Vue's template type-checker does not narrow through
 * `v-if="!homework" v-else`, so we lie to TS here — every consumer sits behind
 * a runtime null-guard in the template.
 */
const hw = computed(() => homework.value as NonNullable<typeof homework.value>)

/** Page is locked into review mode whenever the submission already exists */
const isReviewMode = computed(() => {
  const s = homework.value?.status
  return s === 'SUBMITTED' || s === 'CHECKED'
})

// ── Typed payload accessors ──────────────────────────────────────────────
const testQuestions = computed<TestQuestion[]>(() => {
  if (homework.value?.format !== 'TEST') return []
  return (homework.value.payload as { questions?: TestQuestion[] }).questions ?? []
})
const inputQuestions = computed<InputQuestion[]>(() => {
  if (homework.value?.format !== 'INPUT') return []
  return (homework.value.payload as { questions?: InputQuestion[] }).questions ?? []
})
const oralPrompts = computed<OralPrompt[]>(() => {
  if (homework.value?.format !== 'ORAL') return []
  return (homework.value.payload as { prompts?: OralPrompt[] }).prompts ?? []
})
const textPrompt = computed<TextPrompt | null>(() => {
  if (homework.value?.format !== 'TEXT') return null
  return homework.value.payload as unknown as TextPrompt
})

// ── Edit-mode state ──────────────────────────────────────────────────────
const testAnswers = ref<Record<string, string>>({})
const inputAnswers = ref<Record<string, string>>({})
const essayText = ref('')
const oralAttempts = ref<OralAttempt[]>([])

const { isSupported: speechSupported, isListening, error: recError, start: startRecognition } = useRecognition()
const oralActivePromptId = ref<string | null>(null)
const isSpeaking = ref(false)

// ── FILE format: upload to the private homework-submissions bucket ─────────
const supabaseClient = useSupabaseClient<Database>()
const currentUser = useSupabaseUser()
const fileAttachments = ref<{ path: string, name: string }[]>([])
const fileUploading = ref(false)
const fileError = ref('')

const onFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  const authId = currentUser.value?.sub
  if (!files.length || !homework.value || !authId) return
  fileUploading.value = true
  fileError.value = ''
  try {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { fileError.value = `«${file.name}» больше 10 МБ`; continue }
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${authId}/${homework.value.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await supabaseClient.storage.from('homework-submissions').upload(path, file, { upsert: false })
      if (error) { fileError.value = error.message; continue }
      fileAttachments.value.push({ path, name: file.name })
    }
  } finally {
    fileUploading.value = false
    if (input) input.value = ''
  }
}
const removeAttachment = async (path: string) => {
  await supabaseClient.storage.from('homework-submissions').remove([path])
  fileAttachments.value = fileAttachments.value.filter(f => f.path !== path)
}
const openAttachment = async (path: string) => {
  const { data } = await supabaseClient.storage.from('homework-submissions').createSignedUrl(path, 3600)
  if (data?.signedUrl && typeof window !== 'undefined') window.open(data.signedUrl, '_blank')
}

// ── Review-mode reads from saved answers ─────────────────────────────────
interface SavedAnswers {
  test?: Record<string, string>
  input?: Record<string, string>
  essay?: string
  oral?: OralAttempt[]
  files?: { path: string, name: string }[]
}
const savedAnswers = computed<SavedAnswers>(() => {
  if (!homework.value?.answers) return {}
  const raw = homework.value.answers as Json
  if (Array.isArray(raw)) return { oral: raw as unknown as OralAttempt[] }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.files)) return { files: obj.files as { path: string, name: string }[] }
    if (typeof obj.essay === 'string') return { essay: obj.essay }
    if (homework.value.format === 'TEST') return { test: obj as Record<string, string> }
    if (homework.value.format === 'INPUT') return { input: obj as Record<string, string> }
  }
  return {}
})

// ── Edit-mode computed ──────────────────────────────────────────────────
const testResult = computed(() => {
  const qs = testQuestions.value
  if (!qs.length) return null
  let correct = 0
  for (const q of qs) if (testAnswers.value[q.id] === q.correctOptionId) correct++
  return { correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) }
})

const inputResult = computed(() => {
  const qs = inputQuestions.value
  if (!qs.length) return null
  let correct = 0
  for (const q of qs) {
    const given = (inputAnswers.value[q.id] ?? '').trim().toLowerCase()
    if (q.acceptableAnswers.some(a => a.toLowerCase() === given)) correct++
  }
  return { correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) }
})

const essayWordCount = computed(() => essayText.value.trim().split(/\s+/).filter(Boolean).length)

const oralBestFor = (promptId: string) =>
  oralAttempts.value.filter(a => a.promptId === promptId).reduce((max, a) => Math.max(max, a.score), 0)

const handleSpeak = async (text: string) => {
  isSpeaking.value = true
  await speak(text, { rate: 0.85 })
  setTimeout(() => {
    isSpeaking.value = false
  }, text.length * 80 + 500)
}

const handleRecord = async (promptId: string, target: string) => {
  oralActivePromptId.value = promptId
  try {
    const result = await startRecognition()
    const score = similarity(result.transcript, target)
    oralAttempts.value.push({ promptId, transcript: result.transcript, score })
  } catch { /* error in recError */ } finally {
    oralActivePromptId.value = null
  }
}

const oralAvgScore = computed(() => {
  const prompts = oralPrompts.value
  if (!prompts.length || oralAttempts.value.length === 0) return 0
  const bestByPrompt: Record<string, number> = {}
  for (const a of oralAttempts.value) {
    bestByPrompt[a.promptId] = Math.max(bestByPrompt[a.promptId] ?? 0, a.score)
  }
  return Math.round(prompts.reduce((s, p) => s + (bestByPrompt[p.id] ?? 0), 0) / prompts.length)
})

const canSubmit = computed(() => {
  if (!homework.value || isReviewMode.value) return false
  const fmt: HomeworkFormat = homework.value.format
  if (fmt === 'TEST') return Object.keys(testAnswers.value).length === testQuestions.value.length && testQuestions.value.length > 0
  if (fmt === 'INPUT') return Object.values(inputAnswers.value).filter(v => v && v.trim()).length === inputQuestions.value.length && inputQuestions.value.length > 0
  if (fmt === 'TEXT') return essayWordCount.value >= (textPrompt.value?.minWords ?? 1)
  if (fmt === 'ORAL') return new Set(oralAttempts.value.map(a => a.promptId)).size === oralPrompts.value.length
  if (fmt === 'FILE') return fileAttachments.value.length > 0
  return false
})

const isSaving = ref(false)
const submit = async () => {
  if (!canSubmit.value || !homework.value) return
  isSaving.value = true
  try {
    const fmt = homework.value.format
    let answers: Json = {} as Json
    let aiScore: number | undefined
    if (fmt === 'TEST') {
      answers = testAnswers.value
      aiScore = testResult.value?.pct
    } else if (fmt === 'INPUT') {
      answers = inputAnswers.value
      aiScore = inputResult.value?.pct
    } else if (fmt === 'TEXT') {
      answers = { essay: essayText.value }
    } else if (fmt === 'ORAL') {
      answers = oralAttempts.value as unknown as Json
      aiScore = oralAvgScore.value
    } else if (fmt === 'FILE') {
      answers = { files: fileAttachments.value } as unknown as Json
    }
    await submitHomework(homework.value.id, answers, aiScore)
    // No local toggling — UI re-renders in review mode automatically once
    // composable refresh completes. Scroll to top so the score banner is visible.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSaving.value = false
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'long'
})
const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
})

const FORMAT_LABEL: Record<HomeworkFormat, string> = {
  TEST: 'Тест', INPUT: 'Впиши ответ', TEXT: 'Эссе',
  ORAL: 'Speaking', FILE: 'Файл', INTERACTIVE: 'Интерактив'
}

const STATUS_META: Record<HomeworkStatus, { label: string, color: string }> = {
  ASSIGNED: { label: 'Назначено', color: 'info' },
  IN_PROGRESS: { label: 'В процессе', color: 'warning' },
  SUBMITTED: { label: 'На проверке', color: 'primary' },
  CHECKED: { label: 'Проверено', color: 'success' },
  OVERDUE: { label: 'Просрочено', color: 'error' }
}

// ── Review helpers ──────────────────────────────────────────────────────
const optionState = (qId: string, optId: string) => {
  if (!isReviewMode.value) return 'idle'
  const q = testQuestions.value.find(x => x.id === qId)
  const chosen = savedAnswers.value.test?.[qId]
  if (!q) return 'idle'
  if (optId === q.correctOptionId) return 'correct'
  if (optId === chosen) return 'wrong'
  return 'idle'
}

const inputState = (q: InputQuestion) => {
  if (!isReviewMode.value) return null
  const given = (savedAnswers.value.input?.[q.id] ?? '').trim().toLowerCase()
  const ok = !!given && q.acceptableAnswers.some(a => a.toLowerCase() === given)
  return { given, ok, accepted: q.acceptableAnswers.join(' / ') }
}

const oralReviewFor = (promptId: string) => {
  if (!isReviewMode.value) return null
  const arr = savedAnswers.value.oral ?? []
  const attempts = arr.filter(a => a.promptId === promptId)
  if (!attempts.length) return null
  return attempts.reduce((m, a) => a.score > m.score ? a : m)
}
</script>

<template>
  <!-- Loading -->
  <div
    v-if="pending && !homework"
    class="p-8 max-w-3xl mx-auto"
  >
    <div class="animate-pulse space-y-4">
      <div class="h-6 w-1/4 rounded bg-elevated" />
      <div class="h-10 w-3/4 rounded-xl bg-elevated" />
      <div class="h-48 rounded-2xl bg-elevated" />
    </div>
  </div>

  <!-- Not found -->
  <div
    v-else-if="!homework"
    class="p-12 max-w-3xl mx-auto text-center"
  >
    <UIcon
      name="i-lucide-search-x"
      class="size-12 text-muted mx-auto"
    />
    <p class="mt-3 font-bold text-lg">
      Задание не найдено
    </p>
    <UButton
      to="/student/homework"
      label="К списку"
      color="primary"
      class="mt-4"
    />
  </div>

  <div
    v-else
    class="relative min-h-screen"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 left-1/3 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 pb-24 sm:pb-8 max-w-3xl mx-auto space-y-5 sm:space-y-6">
      <header class="space-y-3">
        <NuxtLink
          to="/student/homework"
          class="text-sm font-semibold text-muted hover:text-primary inline-flex items-center gap-1.5"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          Все задания
        </NuxtLink>

        <div class="flex items-center gap-2 flex-wrap">
          <UBadge
            :label="FORMAT_LABEL[hw.format]"
            color="primary"
            variant="subtle"
            size="sm"
          />
          <UBadge
            :label="STATUS_META[hw.status].label"
            :color="STATUS_META[hw.status].color as any"
            variant="solid"
            size="sm"
          />
          <UBadge
            v-if="!isReviewMode"
            :label="`Срок: ${formatDate(homework.dueAt)}`"
            icon="i-lucide-calendar-clock"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </div>

        <h1 class="text-2xl sm:text-3xl font-black tracking-tight">
          {{ homework.title }}
        </h1>
        <p
          v-if="homework.description"
          class="text-sm text-muted"
        >
          {{ homework.description }}
        </p>
      </header>

      <!-- ════════════════════════════════════════════════════════════════
           REVIEW MODE
           ════════════════════════════════════════════════════════════════ -->
      <template v-if="isReviewMode">
        <!-- Score banner -->
        <section
          class="rounded-3xl p-6 sm:p-8 text-white shadow-xl"
          :class="homework.status === 'CHECKED'
            ? 'bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700'
            : 'bg-linear-to-br from-primary-500 via-sky-600 to-violet-600'"
        >
          <div class="flex flex-wrap items-center gap-4 sm:gap-6">
            <UIcon
              :name="homework.status === 'CHECKED' ? 'i-lucide-check-circle-2' : 'i-lucide-clock'"
              class="size-16 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold uppercase tracking-widest opacity-80">
                {{ homework.status === 'CHECKED' ? 'Педагог проверил' : 'Отправлено на проверку' }}
              </p>
              <div class="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div v-if="homework.aiScore !== null && homework.aiScore !== undefined">
                  <p class="text-[10px] uppercase tracking-wider opacity-80 font-bold">
                    AI-оценка
                  </p>
                  <p class="text-3xl sm:text-5xl font-black tabular-nums">
                    {{ Math.round(homework.aiScore) }}%
                  </p>
                </div>
                <div v-if="homework.teacherGrade !== null && homework.teacherGrade !== undefined">
                  <p class="text-[10px] uppercase tracking-wider opacity-80 font-bold">
                    Оценка педагога
                  </p>
                  <p class="text-3xl sm:text-5xl font-black tabular-nums">
                    {{ homework.teacherGrade }}<span class="text-2xl opacity-70">/5</span>
                  </p>
                </div>
                <div v-if="homework.aiScore === null && homework.teacherGrade === null">
                  <p class="text-sm opacity-90">
                    Педагог ещё не проверил задание
                  </p>
                </div>
              </div>
              <p
                v-if="homework.submittedAt"
                class="text-xs opacity-90 mt-3"
              >
                Отправлено: {{ formatDateTime(homework.submittedAt) }}
                <template v-if="homework.checkedAt">
                  · Проверено: {{ formatDateTime(homework.checkedAt) }}
                </template>
              </p>
            </div>
          </div>

          <div
            v-if="homework.teacherComment"
            class="mt-5 rounded-2xl bg-white/15 backdrop-blur p-4"
          >
            <p class="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
              💬 Комментарий педагога
            </p>
            <p class="text-sm italic">
              «{{ homework.teacherComment }}»
            </p>
          </div>
        </section>

        <!-- TEST review -->
        <section
          v-if="homework.format === 'TEST'"
          class="space-y-4"
        >
          <h2 class="text-lg font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-list-checks"
              class="size-5 text-primary"
            />
            Разбор ответов
          </h2>
          <article
            v-for="(q, i) in testQuestions"
            :key="q.id"
            class="rounded-2xl border border-default bg-default p-5"
          >
            <p class="text-xs uppercase tracking-wider text-muted font-bold">
              Вопрос {{ i + 1 }}
              <span
                v-if="savedAnswers.test?.[q.id] === q.correctOptionId"
                class="ml-2 text-emerald-600 dark:text-emerald-400"
              >✓ Верно</span>
              <span
                v-else-if="savedAnswers.test?.[q.id]"
                class="ml-2 text-red-600 dark:text-red-400"
              >✗ Неверно</span>
            </p>
            <p class="mt-2 text-lg font-bold">
              {{ q.text }}
            </p>
            <div class="mt-4 space-y-2">
              <div
                v-for="opt in q.options"
                :key="opt.id"
                class="flex items-center gap-3 rounded-xl border-2 p-3"
                :class="{
                  'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30': optionState(q.id, opt.id) === 'correct',
                  'border-red-400 bg-red-50 dark:bg-red-900/30': optionState(q.id, opt.id) === 'wrong',
                  'border-default': optionState(q.id, opt.id) === 'idle'
                }"
              >
                <UIcon
                  v-if="optionState(q.id, opt.id) === 'correct'"
                  name="i-lucide-check-circle-2"
                  class="size-5 text-emerald-500 shrink-0"
                />
                <UIcon
                  v-else-if="optionState(q.id, opt.id) === 'wrong'"
                  name="i-lucide-x-circle"
                  class="size-5 text-red-500 shrink-0"
                />
                <span
                  v-else
                  class="size-5 shrink-0"
                />
                <span
                  class="font-medium"
                  :class="{
                    'text-emerald-700 dark:text-emerald-300 font-bold': optionState(q.id, opt.id) === 'correct',
                    'text-red-700 dark:text-red-300 line-through': optionState(q.id, opt.id) === 'wrong'
                  }"
                >{{ opt.text }}</span>
                <span
                  v-if="opt.id === q.correctOptionId && savedAnswers.test?.[q.id] !== q.correctOptionId"
                  class="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >правильный ответ</span>
                <span
                  v-else-if="opt.id === savedAnswers.test?.[q.id]"
                  class="ml-auto text-xs font-bold text-muted"
                >твой ответ</span>
              </div>
            </div>
          </article>
        </section>

        <!-- INPUT review -->
        <section
          v-else-if="homework.format === 'INPUT'"
          class="space-y-4"
        >
          <h2 class="text-lg font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-pen-line"
              class="size-5 text-primary"
            />
            Разбор ответов
          </h2>
          <article
            v-for="(q, i) in inputQuestions"
            :key="q.id"
            class="rounded-2xl border-2 p-5"
            :class="inputState(q)?.ok
              ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-red-300 bg-red-50 dark:bg-red-900/20'"
          >
            <p class="text-xs uppercase tracking-wider text-muted font-bold">
              Вопрос {{ i + 1 }}
              <span
                v-if="inputState(q)?.ok"
                class="ml-2 text-emerald-600 dark:text-emerald-400"
              >✓ Верно</span>
              <span
                v-else
                class="ml-2 text-red-600 dark:text-red-400"
              >✗ Неверно</span>
            </p>
            <p class="mt-2 text-base font-semibold">
              {{ q.prompt }}
            </p>
            <div class="mt-3 space-y-1.5">
              <p class="text-sm">
                <span class="text-muted">Твой ответ:</span>
                <span
                  class="ml-2 font-bold"
                  :class="inputState(q)?.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300 line-through'"
                >«{{ inputState(q)?.given || '—' }}»</span>
              </p>
              <p
                v-if="!inputState(q)?.ok"
                class="text-sm"
              >
                <span class="text-muted">Правильно:</span>
                <span class="ml-2 font-bold text-emerald-700 dark:text-emerald-300">«{{ inputState(q)?.accepted }}»</span>
              </p>
            </div>
          </article>
        </section>

        <!-- TEXT review -->
        <section
          v-else-if="homework.format === 'TEXT' && textPrompt"
          class="space-y-4"
        >
          <h2 class="text-lg font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-file-text"
              class="size-5 text-primary"
            />
            Твой ответ
          </h2>
          <div class="rounded-2xl border border-default bg-elevated p-5">
            <p class="text-xs uppercase tracking-wider text-muted font-bold">
              Задание
            </p>
            <p class="mt-1 font-semibold italic">
              «{{ textPrompt.prompt }}»
            </p>
          </div>
          <div class="rounded-2xl border border-default bg-default p-5 whitespace-pre-wrap">
            {{ savedAnswers.essay || '—' }}
          </div>
        </section>

        <!-- ORAL review -->
        <section
          v-else-if="homework.format === 'ORAL'"
          class="space-y-4"
        >
          <h2 class="text-lg font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-mic"
              class="size-5 text-primary"
            />
            Твои попытки
          </h2>
          <article
            v-for="(p, i) in oralPrompts"
            :key="p.id"
            class="rounded-2xl border border-default bg-default p-5"
          >
            <p class="text-xs uppercase tracking-wider text-muted font-bold mb-2">
              Фраза {{ i + 1 }}
            </p>
            <p class="text-lg sm:text-xl font-black wrap-break-word">
              {{ p.target }}
            </p>
            <p
              v-if="p.ipa"
              class="text-sm font-mono text-muted mt-1"
            >
              {{ p.ipa }}
            </p>

            <div
              v-if="oralReviewFor(p.id)"
              class="mt-3 rounded-xl p-3 ring-1"
              :class="oralReviewFor(p.id)!.score >= 85
                ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-emerald-300/50'
                : oralReviewFor(p.id)!.score >= 60
                  ? 'bg-amber-50 dark:bg-amber-900/30 ring-amber-300/50'
                  : 'bg-red-50 dark:bg-red-900/30 ring-red-300/50'"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted">
                    Услышал AI
                  </p>
                  <p class="font-medium mt-0.5">
                    «{{ oralReviewFor(p.id)!.transcript }}»
                  </p>
                </div>
                <p class="text-2xl font-black tabular-nums shrink-0">
                  {{ oralReviewFor(p.id)!.score }}%
                </p>
              </div>
            </div>
            <p
              v-else
              class="mt-3 text-sm text-muted"
            >
              Без попыток
            </p>
          </article>
        </section>

        <!-- FILE review -->
        <section
          v-else-if="homework.format === 'FILE'"
          class="space-y-3"
        >
          <h2 class="text-lg font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-paperclip"
              class="size-5 text-primary"
            />
            Загруженные файлы
          </h2>
          <ul
            v-if="savedAnswers.files?.length"
            class="space-y-2"
          >
            <li
              v-for="f in savedAnswers.files"
              :key="f.path"
              class="flex items-center justify-between rounded-md bg-elevated px-3 py-2"
            >
              <span class="flex items-center gap-2 min-w-0">
                <UIcon
                  name="i-lucide-file"
                  class="size-4 text-muted shrink-0"
                />
                <span class="text-sm truncate">{{ f.name }}</span>
              </span>
              <UButton
                label="Открыть"
                icon="i-lucide-external-link"
                size="xs"
                variant="ghost"
                @click="openAttachment(f.path)"
              />
            </li>
          </ul>
          <p
            v-else
            class="text-sm text-muted"
          >
            Файлы не приложены
          </p>
        </section>

        <div class="flex justify-end">
          <UButton
            to="/student/homework"
            label="К списку заданий"
            color="primary"
            icon="i-lucide-arrow-right"
            trailing
          />
        </div>
      </template>

      <!-- ════════════════════════════════════════════════════════════════
           EDIT MODE
           ════════════════════════════════════════════════════════════════ -->
      <template v-else>
        <!-- TEST -->
        <section
          v-if="homework.format === 'TEST'"
          class="space-y-4"
        >
          <article
            v-for="(q, i) in testQuestions"
            :key="q.id"
            class="rounded-2xl border border-default bg-default p-5"
          >
            <p class="text-xs uppercase tracking-wider text-muted font-bold">
              Вопрос {{ i + 1 }}
            </p>
            <p class="mt-2 text-lg font-bold">
              {{ q.text }}
            </p>
            <div class="mt-4 space-y-2">
              <label
                v-for="opt in q.options"
                :key="opt.id"
                class="flex items-center gap-3 rounded-xl border border-default p-3 cursor-pointer hover:border-primary-300 hover:bg-elevated transition"
                :class="testAnswers[q.id] === opt.id && 'border-primary bg-primary-50 dark:bg-primary-900/30'"
              >
                <input
                  v-model="testAnswers[q.id]"
                  type="radio"
                  :name="q.id"
                  :value="opt.id"
                  class="size-4 text-primary"
                >
                <span class="font-medium">{{ opt.text }}</span>
              </label>
            </div>
          </article>
        </section>

        <!-- INPUT -->
        <section
          v-else-if="homework.format === 'INPUT'"
          class="space-y-4"
        >
          <article
            v-for="(q, i) in inputQuestions"
            :key="q.id"
            class="rounded-2xl border border-default bg-default p-5"
          >
            <p class="text-xs uppercase tracking-wider text-muted font-bold">
              Вопрос {{ i + 1 }}
            </p>
            <p class="mt-2 text-base font-semibold">
              {{ q.prompt }}
            </p>
            <UInput
              v-model="inputAnswers[q.id]"
              placeholder="Твой ответ..."
              size="lg"
              class="mt-3 w-full"
            />
          </article>
        </section>

        <!-- TEXT -->
        <section
          v-else-if="homework.format === 'TEXT' && textPrompt"
          class="space-y-4"
        >
          <div class="rounded-2xl border border-default bg-elevated p-5">
            <p class="text-xs uppercase tracking-wider text-muted font-bold">
              Задание
            </p>
            <p class="mt-2 font-semibold italic">
              «{{ textPrompt.prompt }}»
            </p>
          </div>

          <div>
            <UTextarea
              v-model="essayText"
              placeholder="Write your answer here..."
              :rows="10"
              size="lg"
              class="w-full"
            />
            <div class="flex items-center justify-between mt-2 text-sm">
              <p class="text-muted">
                Минимум: <span class="font-bold">{{ textPrompt.minWords }}</span> слов
              </p>
              <p
                class="font-bold tabular-nums"
                :class="essayWordCount >= textPrompt.minWords ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'"
              >
                {{ essayWordCount }} слов
              </p>
            </div>
          </div>
        </section>

        <!-- ORAL -->
        <section
          v-else-if="homework.format === 'ORAL'"
          class="space-y-4"
        >
          <UAlert
            v-if="!speechSupported"
            icon="i-lucide-alert-triangle"
            color="warning"
            variant="subtle"
            title="Браузер не поддерживает распознавание речи"
            description="Открой в Chrome / Edge / Safari."
          />
          <UAlert
            v-if="recError"
            icon="i-lucide-alert-circle"
            color="error"
            variant="subtle"
            :description="recError"
          />

          <article
            v-for="(p, i) in oralPrompts"
            :key="p.id"
            class="rounded-2xl border border-default bg-default p-5"
          >
            <p class="text-xs uppercase tracking-wider text-muted font-bold mb-2">
              Фраза {{ i + 1 }}
            </p>
            <p class="text-lg sm:text-xl font-black wrap-break-word">
              {{ p.target }}
            </p>
            <p
              v-if="p.ipa"
              class="text-sm font-mono text-muted mt-1"
            >
              {{ p.ipa }}
            </p>
            <p
              v-if="p.translation"
              class="text-sm text-muted italic"
            >
              {{ p.translation }}
            </p>

            <div class="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                class="rounded-xl bg-linear-to-br from-primary-500 to-sky-700 p-3 text-white font-bold hover:shadow-lg transition disabled:opacity-60"
                :disabled="isSpeaking"
                @click="handleSpeak(p.target)"
              >
                <UIcon
                  name="i-lucide-volume-2"
                  class="size-5 mx-auto"
                />
                <p class="text-xs mt-1">
                  Listen
                </p>
              </button>
              <button
                type="button"
                :disabled="!speechSupported || (isListening && oralActivePromptId !== p.id)"
                class="rounded-xl p-3 text-white font-bold hover:shadow-lg transition disabled:opacity-60"
                :class="oralActivePromptId === p.id && isListening
                  ? 'bg-linear-to-br from-red-500 to-pink-600 animate-pulse'
                  : 'bg-linear-to-br from-emerald-500 to-teal-600'"
                @click="handleRecord(p.id, p.target)"
              >
                <UIcon
                  :name="oralActivePromptId === p.id && isListening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
                  class="size-5 mx-auto"
                />
                <p class="text-xs mt-1">
                  {{ oralActivePromptId === p.id && isListening ? 'Слушаю...' : 'Repeat' }}
                </p>
              </button>
            </div>

            <div
              v-if="oralBestFor(p.id) > 0"
              class="mt-3 rounded-xl p-3 ring-1"
              :class="oralBestFor(p.id) >= 85
                ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-emerald-300/50'
                : oralBestFor(p.id) >= 60
                  ? 'bg-amber-50 dark:bg-amber-900/30 ring-amber-300/50'
                  : 'bg-red-50 dark:bg-red-900/30 ring-red-300/50'"
            >
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold uppercase tracking-wider text-muted">
                  Лучшая попытка
                </p>
                <p class="font-black text-xl tabular-nums">
                  {{ oralBestFor(p.id) }}%
                </p>
              </div>
            </div>
          </article>
        </section>

        <!-- FILE upload -->
        <section
          v-else-if="hw.format === 'FILE'"
          class="space-y-3"
        >
          <label class="block rounded-2xl border-2 border-dashed border-default p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <UIcon
              :name="fileUploading ? 'i-lucide-loader-2' : 'i-lucide-upload-cloud'"
              :class="['size-9 text-dimmed mx-auto', fileUploading && 'animate-spin']"
            />
            <p class="mt-2 font-bold">
              Загрузите файл
            </p>
            <p class="text-xs text-muted mt-1">
              PDF, изображения, документы (макс. 10 МБ)
            </p>
            <input
              type="file"
              class="hidden"
              accept="image/*,application/pdf,.doc,.docx"
              multiple
              :disabled="fileUploading"
              @change="onFileSelect"
            >
          </label>
          <p
            v-if="fileError"
            class="text-sm text-error"
          >
            {{ fileError }}
          </p>
          <ul
            v-if="fileAttachments.length"
            class="space-y-2"
          >
            <li
              v-for="f in fileAttachments"
              :key="f.path"
              class="flex items-center justify-between rounded-md bg-elevated px-3 py-2"
            >
              <span class="flex items-center gap-2 min-w-0">
                <UIcon
                  name="i-lucide-file"
                  class="size-4 text-muted shrink-0"
                />
                <span class="text-sm truncate">{{ f.name }}</span>
              </span>
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="removeAttachment(f.path)"
              />
            </li>
          </ul>
        </section>

        <!-- INTERACTIVE — not built yet -->
        <section
          v-else
          class="rounded-2xl border-2 border-dashed border-default p-10 text-center"
        >
          <UIcon
            name="i-lucide-construction"
            class="size-10 text-muted mx-auto"
          />
          <p class="mt-3 font-bold">
            Формат «{{ FORMAT_LABEL[hw.format] }}» в разработке
          </p>
        </section>

        <!-- Submit -->
        <div class="sticky bottom-3 sm:bottom-4 z-10 flex justify-end">
          <UButton
            label="Отправить на проверку"
            color="primary"
            size="lg"
            icon="i-lucide-send"
            trailing
            :loading="isSaving"
            :disabled="!canSubmit || isSaving"
            class="shadow-xl w-full sm:w-auto justify-center"
            @click="submit"
          />
        </div>
      </template>
    </div>
  </div>
</template>
