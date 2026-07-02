<script setup lang="ts">
/**
 * Book-faithful lesson page (NO gamification): renders a unit like a real
 * textbook page — title, rule/explanation boxes, then the exercises stacked
 * with per-exercise check. Reuses the exercise widgets as content renderers.
 * Answers are checked on the server (deterministic); no mascot/confetti/XP.
 */
import { useLessons } from '~/entities/book'
import type { LessonUnitWithExercises, LessonExerciseType } from '~/entities/book'
import { useLessonPlayer } from '~/features/lesson-player'
import type { ExerciseCheckResult } from '~/features/lesson-player'

import FillBlank from './ex/FillBlank.vue'
import Choose from './ex/ChooseInline.vue'
import Mcq from './ex/McqCards.vue'
import WordImageMatch from './ex/WordImageMatch.vue'
import MatchPairs from './ex/MatchPairs.vue'
import Reorder from './ex/ReorderWords.vue'
import TrueFalse from './ex/TrueFalse.vue'
import SortColumns from './ex/SortColumns.vue'
import ShortText from './ex/ShortText.vue'

const props = defineProps<{ unitId: string }>()

const WIDGETS: Record<LessonExerciseType, unknown> = {
  FILL_BLANK: FillBlank, CHOOSE: Choose, MCQ: Mcq, WORD_IMAGE_MATCH: WordImageMatch,
  MATCH_PAIRS: MatchPairs, REORDER: Reorder, TRUE_FALSE: TrueFalse, SORT_COLUMNS: SortColumns, SHORT_TEXT: ShortText
}

// kid-friendly «what to do» hints per exercise type
const HINTS: Record<LessonExerciseType, { emoji: string, text: string }> = {
  FILL_BLANK: { emoji: '✍️', text: 'Нажми на пустое поле и впиши ответ' },
  CHOOSE: { emoji: '👆', text: 'Нажми на правильный вариант' },
  MCQ: { emoji: '👆', text: 'Выбери один правильный ответ' },
  WORD_IMAGE_MATCH: { emoji: '🖼️', text: 'Соедини слово с картинкой' },
  MATCH_PAIRS: { emoji: '🔗', text: 'Нажми слева, потом справа — соедини пару' },
  REORDER: { emoji: '🔀', text: 'Нажимай слова по порядку' },
  TRUE_FALSE: { emoji: '🤔', text: 'Реши: верно или неверно?' },
  SORT_COLUMNS: { emoji: '📥', text: 'Нажми слово, потом нужную колонку' },
  SHORT_TEXT: { emoji: '✍️', text: 'Напиши ответ в поле' }
}

const { fetchUnit } = useLessons()
const { checkExercise } = useLessonPlayer()

const unit = ref<LessonUnitWithExercises | null>(null)
const loading = ref(true)
const responses = reactive<Record<string, Record<string, unknown>>>({})
const ready = reactive<Record<string, boolean>>({})
const results = reactive<Record<string, ExerciseCheckResult>>({})
const checking = reactive<Set<string>>(new Set())
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)

const load = async () => {
  loading.value = true
  unit.value = await fetchUnit(props.unitId)
  loading.value = false
}
onMounted(load)
watch(() => props.unitId, load)

const statusOf = (id: string): 'idle' | 'correct' | 'wrong' => {
  const r = results[id]
  if (!r) return 'idle'
  return r.isCorrect ? 'correct' : r.isCorrect === false ? 'wrong' : 'idle'
}
const onChange = (id: string, v: { response: Record<string, unknown>, ready: boolean }) => {
  if (results[id]) return
  responses[id] = v.response
  ready[id] = v.ready
}
const check = async (id: string) => {
  if (!ready[id] || checking.has(id) || results[id]) return
  checking.add(id)
  try {
    results[id] = await checkExercise(id, responses[id] ?? {})
  } catch {
    results[id] = { isCorrect: false, score: 0, explanation: 'Не удалось проверить.', reveal: {} }
  } finally {
    checking.delete(id)
  }
}

// progress
const total = computed(() => unit.value?.exercises.length ?? 0)
const done = computed(() => unit.value?.exercises.filter(e => results[e.id]).length ?? 0)
const correctCount = computed(() => unit.value?.exercises.filter(e => results[e.id]?.isCorrect).length ?? 0)
const pct = computed(() => total.value ? Math.round((done.value / total.value) * 100) : 0)
const allDone = computed(() => total.value > 0 && done.value === total.value)
</script>

<template>
  <div
    v-if="loading"
    class="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-muted ring-1 ring-default shadow-(--shadow-soft)"
  >
    <div class="book-skeleton h-28 sm:h-32" />
    <div class="border-b border-default bg-default px-5 py-3 sm:px-8">
      <div class="book-skeleton h-2.5 w-full rounded-full" />
    </div>
    <div class="space-y-5 px-3 py-5 sm:px-7 sm:py-7">
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-card bg-default p-4 ring-1 ring-default sm:p-5"
      >
        <div class="mb-4 flex items-center gap-3">
          <div class="book-skeleton size-9 shrink-0 rounded-2xl" />
          <div class="book-skeleton h-4 w-2/3 rounded-full" />
        </div>
        <div class="space-y-2.5">
          <div class="book-skeleton h-10 w-full rounded-xl" />
          <div class="book-skeleton h-10 w-5/6 rounded-xl" />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="!unit"
    class="flex flex-col items-center gap-3 py-16 text-center text-muted"
  >
    <UIcon
      name="i-lucide-book-x"
      class="size-10"
    />
    <p class="text-sm">
      Юнит не найден.
    </p>
  </div>

  <article
    v-else
    class="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-muted ring-1 ring-default shadow-(--shadow-soft)"
  >
    <!-- title strip — soft, book-like -->
    <header class="relative overflow-hidden bg-primary-50 px-6 py-6 dark:bg-primary-950/40 sm:px-8 sm:py-7">
      <UIcon
        name="i-lucide-book-open-text"
        class="duo-wiggle pointer-events-none absolute -right-2 top-1/2 hidden size-20 -translate-y-1/2 text-primary/15 sm:block"
      />
      <span class="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-600 ring-1 ring-primary/10 dark:bg-white/10 dark:text-primary-300">
        <UIcon
          name="i-lucide-graduation-cap"
          class="size-3.5"
        />Учебник
      </span>
      <h1 class="relative mt-2.5 font-display text-2xl font-black tracking-tight text-primary-900 dark:text-primary-50 sm:text-3xl">
        {{ unit.title }}
      </h1>
      <p
        v-if="unit.subtitle"
        class="relative mt-1 text-sm font-medium text-primary-700/70 dark:text-primary-200/70"
      >
        {{ unit.subtitle }}
      </p>
    </header>

    <!-- progress -->
    <div class="flex items-center gap-3 border-b border-default bg-default px-5 py-3 sm:px-8">
      <div class="duo-progress h-3.5 flex-1">
        <div
          class="duo-progress-fill"
          :style="{ width: `${pct}%` }"
        />
      </div>
      <span
        v-if="allDone"
        class="inline-flex shrink-0 items-center gap-1 text-sm font-black text-primary"
      >
        <UIcon
          name="i-lucide-party-popper"
          class="size-4"
        />{{ correctCount }}/{{ total }}
      </span>
      <span
        v-else
        class="shrink-0 text-sm font-bold tabular-nums text-muted"
      >{{ done }} / {{ total }}</span>
    </div>

    <div class="duo-stagger space-y-5 px-3 py-5 sm:px-7 sm:py-7">
      <!-- rule / explanation blocks -->
      <section
        v-if="unit.intro?.length"
        class="space-y-3 rounded-card bg-default p-4 ring-1 ring-default shadow-(--shadow-soft) sm:p-5"
      >
        <template
          v-for="(b, i) in unit.intro"
          :key="i"
        >
          <p
            v-if="b.type === 'text'"
            class="leading-relaxed text-toned"
          >
            {{ b.text }}
          </p>
          <div
            v-else-if="b.type === 'rule'"
            class="flex gap-3 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/15"
          >
            <UIcon
              name="i-lucide-lightbulb"
              class="mt-0.5 size-5 shrink-0 text-primary"
            />
            <p class="leading-relaxed">
              {{ b.text }}
            </p>
          </div>
          <div
            v-else-if="b.type === 'examples'"
            class="flex flex-wrap gap-2"
          >
            <span
              v-for="(ex, j) in b.items"
              :key="j"
              class="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-bold italic text-primary ring-1 ring-primary/20"
            >{{ ex }}</span>
          </div>
          <div
            v-else-if="b.type === 'image'"
            class="flex justify-center"
          >
            <img
              v-if="isUrl(b.url)"
              :src="b.url"
              alt=""
              class="max-h-52 rounded-xl object-contain"
            >
            <span
              v-else
              class="text-6xl"
            >{{ b.url }}</span>
          </div>
        </template>
      </section>

      <!-- exercises -->
      <section
        v-for="(ex, i) in unit.exercises"
        :key="ex.id"
        class="duo-card bg-default p-4 sm:p-5"
        :class="statusOf(ex.id) === 'correct' ? 'animate-success-flash border-green-400!' : statusOf(ex.id) === 'wrong' ? 'animate-shake border-red-300!' : 'duo-card-hover'"
      >
        <div class="mb-3 flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-100 text-lg font-black text-primary-700 shadow-[0_3px_0_0_var(--color-primary-200,#bbf7d0)] dark:bg-primary-900/60 dark:text-primary-200 dark:shadow-[0_3px_0_0_rgba(0,0,0,0.3)]">{{ i + 1 }}</span>
          <p
            v-if="ex.instruction"
            class="pt-1 font-bold leading-snug"
          >
            {{ ex.instruction }}
          </p>
        </div>

        <!-- gentle guidance — soft, static -->
        <p
          v-if="!results[ex.id]"
          class="mb-4 ml-12 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-900/50"
        >
          <span class="text-sm leading-none">{{ HINTS[ex.type].emoji }}</span>
          {{ HINTS[ex.type].text }}
        </p>

        <component
          :is="WIDGETS[ex.type]"
          :exercise="ex"
          :status="statusOf(ex.id)"
          :reveal="results[ex.id]?.reveal ?? null"
          :disabled="!!results[ex.id]"
          @change="(v: { response: Record<string, unknown>, ready: boolean }) => onChange(ex.id, v)"
        />

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            v-if="!results[ex.id]"
            type="button"
            class="duo-btn text-sm uppercase tracking-wide"
            :class="ready[ex.id] ? 'duo-btn--green' : 'duo-btn--gray'"
            :disabled="!ready[ex.id] || checking.has(ex.id)"
            @click="check(ex.id)"
          >
            <UIcon
              :name="checking.has(ex.id) ? 'i-lucide-loader-circle' : 'i-lucide-check'"
              class="size-5"
              :class="checking.has(ex.id) && 'animate-spin'"
            />
            Проверить
          </button>
          <span
            v-else
            class="duo-slide-up inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-black shadow-[0_3px_0_0_rgba(0,0,0,0.06)]"
            :class="results[ex.id]?.isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
          >
            <UIcon
              :name="results[ex.id]?.isCorrect ? 'i-lucide-party-popper' : 'i-lucide-rotate-ccw'"
              class="duo-tada size-5"
            />
            {{ results[ex.id]?.isCorrect ? 'Верно!' : 'Не совсем' }}
          </span>
          <span
            v-if="results[ex.id]?.explanation"
            class="text-sm font-medium text-muted"
          >{{ results[ex.id]?.explanation }}</span>
        </div>
      </section>
    </div>

    <!-- completion -->
    <div
      v-if="allDone"
      class="px-3 pb-6 sm:px-7"
    >
      <div class="duo-pop flex flex-col items-center gap-1.5 rounded-3xl bg-linear-to-br from-primary-500 to-emerald-600 p-6 text-center text-white shadow-[0_6px_0_0_var(--color-primary-700,#15803d)]">
        <UIcon
          name="i-lucide-trophy"
          class="duo-tada size-10"
        />
        <p class="font-display text-xl font-black">
          Раздел пройден!
        </p>
        <p class="text-sm font-medium text-white/85">
          Правильно {{ correctCount }} из {{ total }}
        </p>
      </div>
    </div>
  </article>
</template>
