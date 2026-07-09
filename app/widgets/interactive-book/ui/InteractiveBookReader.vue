<script setup lang="ts">
/**
 * Student reader: the scanned book, page by page, with interactive fields
 * sitting exactly where the exercises are. Answers are checked on the server
 * (instant for closed items, AI for open ones). The page still looks like the
 * book — we only add the inputs.
 */
import { useBookPages } from '~/entities/book'
import type { BookPageWithExercises, PageExercise } from '~/entities/book'
import { useBookExercises } from '~/features/book-exercises'
import type { CheckResult } from '~/features/book-exercises'
import ExerciseField from './ExerciseField.vue'

// readOnly — режим просмотра (админ/учитель): без попыток ученика и проверки.
const props = defineProps<{ moduleId: string, readOnly?: boolean }>()

const { fetchModulePages, fetchAttemptsByExercises } = useBookPages()
const { checkAnswer } = useBookExercises()
const { burst } = useConfetti()

const pages = ref<BookPageWithExercises[]>([])
const loading = ref(true)

// Per-exercise state, keyed by exercise id.
const responses = reactive<Record<string, Record<string, unknown>>>({})
const results = reactive<Record<string, CheckResult>>({})
const pendingIds = reactive<Set<string>>(new Set())

const load = async () => {
  loading.value = true
  try {
    const p = await fetchModulePages(props.moduleId)
    pages.value = p
    if (props.readOnly) return
    const ids = p.flatMap(pg => pg.exercises.map(e => e.id))
    const attempts = await fetchAttemptsByExercises(ids)
    // Seed previously-checked answers so the reader restores ✓/✗ on return.
    for (const [exId, a] of Object.entries(attempts)) {
      if (a.response && typeof a.response === 'object') {
        responses[exId] = a.response as Record<string, unknown>
      }
      results[exId] = {
        isCorrect: a.isCorrect,
        score: a.score,
        feedback: a.aiFeedback?.feedback ?? '',
        correctAnswer: a.aiFeedback?.correctAnswer
      }
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => props.moduleId, load)

const onUpdate = (exId: string, response: Record<string, unknown>) => {
  responses[exId] = response
}

const pageOf = (exId: string): BookPageWithExercises | undefined =>
  pages.value.find(p => p.exercises.some(e => e.id === exId))

const allCorrectOnPage = (page: BookPageWithExercises) =>
  page.exercises.length > 0 && page.exercises.every(e => results[e.id]?.isCorrect === true)

const runCheck = async (exId: string) => {
  const response = responses[exId]
  if (!response || pendingIds.has(exId)) return
  pendingIds.add(exId)
  try {
    const res = await checkAnswer(exId, response)
    results[exId] = res
    // Celebrate a fully-correct page — subtle, book stays a book.
    const page = pageOf(exId)
    if (page && res.isCorrect && allCorrectOnPage(page)) burst()
  } catch {
    results[exId] = { isCorrect: null, score: null, feedback: 'Не удалось проверить, попробуй ещё раз.' }
  } finally {
    pendingIds.delete(exId)
  }
}

const checkPage = async (page: BookPageWithExercises) => {
  const targets = page.exercises.filter(e => responses[e.id] && !pendingIds.has(e.id))
  await Promise.all(targets.map(e => runCheck(e.id)))
}

const pageStats = (page: BookPageWithExercises) => {
  const total = page.exercises.length
  const correct = page.exercises.filter(e => results[e.id]?.isCorrect === true).length
  return { total, correct }
}

const responseFor = (ex: PageExercise) => responses[ex.id] ?? {}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl">
    <div
      v-if="loading"
      class="flex h-64 items-center justify-center"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-primary"
      />
    </div>

    <div
      v-else-if="!pages.length"
      class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-book-x"
        class="size-10"
      />
      <p class="text-sm">
        Эта книга ещё не готова. Загляни позже.
      </p>
    </div>

    <div
      v-else
      class="flex flex-col gap-8"
    >
      <div
        v-for="(page, idx) in pages"
        :key="page.id"
        class="ib-page-in flex flex-col gap-2"
        :style="{ animationDelay: Math.min(idx, 6) * 0.07 + 's' }"
      >
        <!-- page toolbar -->
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-semibold text-muted">Стр. {{ page.pageNumber }}</span>
          <div
            v-if="!readOnly"
            class="flex items-center gap-2"
          >
            <span
              v-if="page.exercises.length"
              class="text-xs font-medium text-muted"
            >
              {{ pageStats(page).correct }} / {{ pageStats(page).total }}
            </span>
            <UButton
              v-if="page.exercises.length"
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-check-check"
              label="Проверить"
              @click="checkPage(page)"
            />
          </div>
        </div>

        <!-- the page image + interactive overlay -->
        <div
          class="relative overflow-visible rounded-xl bg-white shadow-lg ring-1 ring-black/5"
          style="container-type: inline-size"
        >
          <img
            :src="page.imageUrl"
            :alt="`Страница ${page.pageNumber}`"
            class="block w-full select-none rounded-xl"
            loading="lazy"
            draggable="false"
          >
          <ExerciseField
            v-for="ex in page.exercises"
            :key="ex.id"
            :exercise="ex"
            :response="responseFor(ex)"
            :result="results[ex.id] ?? null"
            :pending="pendingIds.has(ex.id)"
            @update="(r) => onUpdate(ex.id, r)"
            @check="() => runCheck(ex.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
