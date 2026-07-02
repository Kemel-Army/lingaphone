<script setup lang="ts">
/**
 * Native lesson player — one exercise at a time (Duolingo-style): intro → N
 * exercises → result. Reuses FemiMascot, useSound, useConfetti and the XP flow.
 * Answers are checked on the server (deterministic, no AI); the widget shows
 * the correct answer from the returned `reveal`.
 */
import { useLessons } from '~/entities/book'
import type { LessonUnitWithExercises, LessonExerciseType } from '~/entities/book'
import { useLessonPlayer } from '~/features/lesson-player'
import type { ExerciseCheckResult } from '~/features/lesson-player'

import IntroCard from './IntroCard.vue'
import ResultScreen from './ResultScreen.vue'
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
const emit = defineEmits<{ (e: 'exit'): void }>()

const WIDGETS: Record<LessonExerciseType, unknown> = {
  FILL_BLANK: FillBlank, CHOOSE: Choose, MCQ: Mcq, WORD_IMAGE_MATCH: WordImageMatch,
  MATCH_PAIRS: MatchPairs, REORDER: Reorder, TRUE_FALSE: TrueFalse, SORT_COLUMNS: SortColumns, SHORT_TEXT: ShortText
}

const { fetchUnit } = useLessons()
const { checkExercise, awardUnitXp } = useLessonPlayer()
const { play } = useSound()
const { burst } = useConfetti()

const unit = ref<LessonUnitWithExercises | null>(null)
const loading = ref(true)
const phase = ref<'intro' | 'exercise' | 'result'>('intro')

const exercises = computed(() => unit.value?.exercises ?? [])
const stepIdx = ref(0)
const current = computed(() => exercises.value[stepIdx.value])

const response = ref<Record<string, unknown>>({})
const ready = ref(false)
const checked = ref(false)
const result = ref<ExerciseCheckResult | null>(null)
const submitting = ref(false)
const status = computed<'idle' | 'correct' | 'wrong'>(() =>
  checked.value && result.value ? (result.value.isCorrect ? 'correct' : 'wrong') : 'idle')

const correctCount = ref(0)
const mascotState = ref<'greet' | 'celebrate' | 'confused' | 'proud'>('greet')
const xpEarned = ref(0)
const leveledUp = ref(false)

const progress = computed(() => {
  const total = exercises.value.length || 1
  return Math.round(((stepIdx.value + (checked.value ? 1 : 0)) / total) * 100)
})

const load = async () => {
  loading.value = true
  unit.value = await fetchUnit(props.unitId)
  loading.value = false
  phase.value = unit.value?.intro?.length ? 'intro' : 'exercise'
}
onMounted(load)

const onChange = (v: { response: Record<string, unknown>, ready: boolean }) => {
  if (checked.value) return
  response.value = v.response
  ready.value = v.ready
}

const resetStep = () => {
  response.value = {}
  ready.value = false
  checked.value = false
  result.value = null
  mascotState.value = 'greet'
}

const submit = async () => {
  if (!ready.value || checked.value || !current.value || submitting.value) return
  submitting.value = true
  try {
    const r = await checkExercise(current.value.id, response.value)
    result.value = r
    checked.value = true
    if (r.isCorrect) {
      correctCount.value++
      play('correct')
      burst()
      mascotState.value = 'celebrate'
    } else {
      play('wrong')
      mascotState.value = 'confused'
    }
  } catch {
    result.value = { isCorrect: false, score: 0, explanation: 'Не удалось проверить, попробуй ещё раз.', reveal: {} }
    checked.value = true
    mascotState.value = 'confused'
  } finally {
    submitting.value = false
  }
}

const next = async () => {
  if (stepIdx.value < exercises.value.length - 1) {
    stepIdx.value++
    resetStep()
  } else {
    xpEarned.value = correctCount.value === exercises.value.length ? 90 : 40
    try {
      const res = await awardUnitXp(props.unitId, correctCount.value, exercises.value.length)
      leveledUp.value = !!(res as { levelUp?: boolean })?.levelUp
    } catch { /* XP is best-effort */ }
    play('levelup')
    phase.value = 'result'
  }
}

const retry = () => {
  stepIdx.value = 0
  correctCount.value = 0
  leveledUp.value = false
  xpEarned.value = 0
  resetStep()
  phase.value = unit.value?.intro?.length ? 'intro' : 'exercise'
}
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col">
    <div
      v-if="loading"
      class="flex flex-1 items-center justify-center"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-primary"
      />
    </div>

    <div
      v-else-if="!unit"
      class="flex flex-1 flex-col items-center justify-center gap-3 text-muted"
    >
      <UIcon
        name="i-lucide-book-x"
        class="size-10"
      />
      <p class="text-sm">
        Юнит не найден.
      </p>
    </div>

    <template v-else>
      <!-- top bar: exit + progress -->
      <div class="mb-6 flex items-center gap-3">
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="emit('exit')"
        />
        <div class="h-3 flex-1 overflow-hidden rounded-full bg-elevated">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: progress + '%' }"
          />
        </div>
        <span
          v-if="phase === 'exercise'"
          class="text-xs font-bold tabular-nums text-muted"
        >{{ stepIdx + 1 }}/{{ exercises.length }}</span>
      </div>

      <!-- INTRO -->
      <div
        v-if="phase === 'intro'"
        class="flex flex-1 flex-col"
      >
        <div class="flex-1">
          <IntroCard
            :title="unit.title"
            :subtitle="unit.subtitle"
            :intro="unit.intro"
          />
        </div>
        <UButton
          block
          size="lg"
          color="primary"
          label="Начать"
          trailing-icon="i-lucide-arrow-right"
          class="mt-6"
          @click="phase = 'exercise'"
        />
      </div>

      <!-- RESULT -->
      <div
        v-else-if="phase === 'result'"
        class="flex flex-1 items-center justify-center"
      >
        <ResultScreen
          :correct="correctCount"
          :total="exercises.length"
          :xp="xpEarned"
          :level-up="leveledUp"
          @exit="emit('exit')"
          @retry="retry"
        />
      </div>

      <!-- EXERCISE -->
      <div
        v-else-if="current"
        class="flex flex-1 flex-col"
      >
        <div class="mb-4 flex items-center gap-3">
          <FemiMascot
            :state="mascotState"
            size="sm"
          />
          <p class="text-base font-bold">
            {{ current.instruction }}
          </p>
        </div>

        <div class="flex-1 rounded-3xl border border-default bg-default p-5 shadow-sm sm:p-8">
          <component
            :is="WIDGETS[current.type]"
            :key="current.id"
            :exercise="current"
            :status="status"
            :reveal="result?.reveal ?? null"
            :disabled="checked"
            @change="onChange"
          />
        </div>

        <!-- feedback -->
        <div
          v-if="checked && result"
          class="mt-4 flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold"
          :class="result.isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'"
        >
          <UIcon
            :name="result.isCorrect ? 'i-lucide-party-popper' : 'i-lucide-info'"
            class="mt-0.5 size-5 shrink-0"
          />
          <span>{{ result.isCorrect ? 'Верно!' : 'Не совсем.' }} {{ result.explanation }}</span>
        </div>

        <!-- action -->
        <UButton
          v-if="!checked"
          block
          size="lg"
          color="primary"
          label="Проверить"
          :disabled="!ready"
          :loading="submitting"
          class="mt-4"
          @click="submit"
        />
        <UButton
          v-else
          block
          size="lg"
          :color="result?.isCorrect ? 'success' : 'primary'"
          :label="stepIdx < exercises.length - 1 ? 'Дальше' : 'Завершить'"
          trailing-icon="i-lucide-arrow-right"
          class="mt-4"
          @click="next"
        />
      </div>
    </template>
  </div>
</template>
