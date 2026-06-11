<script setup lang="ts">
import type { GrammarExercise } from '~/entities/grammar'
import type { ExerciseResult } from '../composables/usePracticeGrammar'

const props = defineProps<{ exercises: GrammarExercise[] }>()
const emit = defineEmits<{ done: [results: ExerciseResult[]] }>()

const currentIndex = ref(0)
const phase = ref<'question' | 'feedback'>('question')
const userAnswer = ref('')
const selectedOption = ref<string | null>(null)
const hintVisible = ref(false)
const results = ref<ExerciseResult[]>([])

const current = computed(() => props.exercises[currentIndex.value])
const progressPercent = computed(() =>
  props.exercises.length ? Math.round((currentIndex.value / props.exercises.length) * 100) : 0
)

// Normalize answer for comparison (case-insensitive, trim, ignore contractions style)
const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')

const checkAnswer = (answer: string): boolean => {
  const acceptable = current.value.answer.split('|').map(normalize)
  return acceptable.includes(normalize(answer))
}

const isCorrect = ref(false)

const submitAnswer = (answer: string) => {
  if (phase.value === 'feedback') return
  const correct = checkAnswer(answer)
  isCorrect.value = correct
  selectedOption.value = answer
  userAnswer.value = answer
  phase.value = 'feedback'

  results.value.push({
    exerciseId: current.value.id,
    correct,
    hintUsed: hintVisible.value,
    userAnswer: answer,
    correctAnswer: current.value.answer.split('|')[0]!,
    prompt: current.value.prompt
  })
}

const next = () => {
  if (currentIndex.value + 1 >= props.exercises.length) {
    emit('done', results.value)
    return
  }
  currentIndex.value++
  phase.value = 'question'
  userAnswer.value = ''
  selectedOption.value = null
  hintVisible.value = false
  isCorrect.value = false
}

const fillInput = ref('')
const submitFill = () => {
  if (!fillInput.value.trim()) return
  submitAnswer(fillInput.value.trim())
}

const optionClass = (option: string) => {
  if (phase.value !== 'feedback') {
    return 'border-default bg-default hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
  }
  const correct = checkAnswer(option)
  const selected = option === selectedOption.value
  if (correct) return 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
  if (selected && !correct) return 'border-red-400 bg-red-50 dark:bg-red-900/20'
  return 'border-default bg-default opacity-50'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Progress bar -->
    <div class="space-y-1">
      <div class="flex items-center justify-between text-xs text-muted">
        <span>Вопрос {{ currentIndex + 1 }} из {{ exercises.length }}</span>
        <span class="tabular-nums">{{ progressPercent }}%</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full bg-primary transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Question card -->
    <UCard v-if="current">
      <div class="space-y-5">
        <!-- Prompt -->
        <p class="text-base font-semibold leading-relaxed">
          {{ current.prompt }}
        </p>

        <!-- MCQ options -->
        <div
          v-if="current.type === 'MCQ'"
          class="grid gap-2 sm:grid-cols-2"
        >
          <button
            v-for="option in current.options"
            :key="option"
            class="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all"
            :class="optionClass(option)"
            :disabled="phase === 'feedback'"
            @click="submitAnswer(option)"
          >
            <div class="flex items-center gap-2">
              <UIcon
                v-if="phase === 'feedback' && checkAnswer(option)"
                name="i-lucide-check"
                class="size-4 shrink-0 text-emerald-600"
              />
              <UIcon
                v-else-if="phase === 'feedback' && option === selectedOption && !checkAnswer(option)"
                name="i-lucide-x"
                class="size-4 shrink-0 text-red-500"
              />
              <span
                v-else
                class="w-4 shrink-0"
              />
              {{ option }}
            </div>
          </button>
        </div>

        <!-- FILL input -->
        <div
          v-else-if="current.type === 'FILL'"
          class="space-y-3"
        >
          <div class="flex gap-2">
            <UInput
              v-model="fillInput"
              placeholder="Введите ответ..."
              class="flex-1"
              :disabled="phase === 'feedback'"
              :color="phase === 'feedback' ? (isCorrect ? 'success' : 'error') : 'primary'"
              @keydown.enter="submitFill"
            />
            <UButton
              v-if="phase === 'question'"
              label="Проверить"
              color="primary"
              :disabled="!fillInput.trim()"
              @click="submitFill"
            />
          </div>

          <!-- Fill feedback -->
          <div
            v-if="phase === 'feedback'"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            :class="isCorrect
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'"
          >
            <UIcon
              :name="isCorrect ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              class="size-4 shrink-0"
            />
            <span v-if="isCorrect">Правильно!</span>
            <span v-else>
              Правильно: <strong>{{ current.answer.split('|')[0] }}</strong>
            </span>
          </div>
        </div>

        <!-- MCQ feedback overlay -->
        <div
          v-if="phase === 'feedback' && current.type === 'MCQ'"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          :class="isCorrect
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'"
        >
          <UIcon
            :name="isCorrect ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
            class="size-4 shrink-0"
          />
          <span v-if="isCorrect">Правильно! 🎉</span>
          <span v-else>
            Правильный ответ: <strong>{{ current.answer }}</strong>
          </span>
        </div>

        <!-- Hint -->
        <div
          v-if="current.hint"
          class="border-t border-default pt-3"
        >
          <button
            v-if="!hintVisible"
            class="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-default"
            @click="hintVisible = true"
          >
            <UIcon
              name="i-lucide-lightbulb"
              class="size-3.5"
            />
            Показать подсказку
          </button>
          <div
            v-else
            class="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
          >
            <UIcon
              name="i-lucide-lightbulb"
              class="mt-0.5 size-3.5 shrink-0"
            />
            {{ current.hint }}
          </div>
        </div>
      </div>
    </UCard>

    <!-- Next / Finish button -->
    <div
      v-if="phase === 'feedback'"
      class="flex justify-end"
    >
      <UButton
        :label="currentIndex + 1 >= exercises.length ? 'Завершить' : 'Следующий вопрос'"
        :icon="currentIndex + 1 >= exercises.length ? 'i-lucide-flag' : 'i-lucide-arrow-right'"
        trailing
        color="primary"
        size="lg"
        @click="next"
      />
    </div>
  </div>
</template>
