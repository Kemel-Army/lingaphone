<script setup lang="ts">
import type { ReadingQuestion } from '~/entities/reading'
import { useCompleteReading } from '../composables/useCompleteReading'
import type { QuestionAnswer } from '../composables/useCompleteReading'

const props = defineProps<{ questions: ReadingQuestion[] }>()
const emit = defineEmits<{ done: [answers: QuestionAnswer[]] }>()

const { checkAnswer } = useCompleteReading()

const currentIndex = ref(0)
const userInput = ref('')
const selectedOption = ref('')
const answers = ref<QuestionAnswer[]>([])
const showFeedback = ref(false)
const lastCorrect = ref(false)

const q = computed(() => props.questions[currentIndex.value])
const isLast = computed(() => currentIndex.value === props.questions.length - 1)
const progress = computed(() =>
  Math.round(((currentIndex.value) / props.questions.length) * 100)
)

const activeAnswer = computed(() =>
  (q.value?.type === 'MCQ' || q.value?.type === 'TRUE_FALSE') ? selectedOption.value : userInput.value
)

const canSubmit = computed(() => activeAnswer.value.trim().length > 0)

const submit = () => {
  if (!q.value || !canSubmit.value) return
  const correct = checkAnswer(q.value, activeAnswer.value)
  lastCorrect.value = correct
  showFeedback.value = true
  answers.value.push({
    questionId: q.value.id,
    userAnswer: activeAnswer.value,
    correct,
    points: q.value.points,
    prompt: q.value.question,
    correctAnswer: q.value.answer
  })
}

const next = () => {
  showFeedback.value = false
  userInput.value = ''
  selectedOption.value = ''
  if (isLast.value) {
    emit('done', answers.value)
  } else {
    currentIndex.value++
  }
}

const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !showFeedback.value && canSubmit.value) submit()
  else if (e.key === 'Enter' && showFeedback.value) next()
}
</script>

<template>
  <div class="space-y-5">
    <!-- Progress bar -->
    <div>
      <div class="mb-1.5 flex items-center justify-between text-xs text-muted">
        <span>Вопрос {{ currentIndex + 1 }} из {{ questions.length }}</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full bg-primary transition-all"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <UCard v-if="q">
      <div class="space-y-4">
        <!-- Question type badge -->
        <div class="flex items-center gap-2">
          <UBadge
            :label="q.type === 'MCQ' ? 'Выбор ответа' : q.type === 'TRUE_FALSE' ? 'Верно/Неверно' : q.type === 'FILL' ? 'Заполни пропуск' : 'Открытый ответ'"
            color="neutral"
            variant="subtle"
            size="xs"
          />
          <span class="text-xs text-muted">{{ q.points }} XP</span>
        </div>

        <!-- Question text -->
        <p class="text-base font-semibold leading-snug">
          {{ q.question }}
        </p>

        <!-- MCQ options -->
        <div
          v-if="q.type === 'MCQ'"
          class="space-y-2"
        >
          <button
            v-for="opt in q.options"
            :key="opt"
            class="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all"
            :class="showFeedback
              ? opt === q.answer
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : opt === selectedOption && !lastCorrect
                  ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'border-subtle opacity-50'
              : selectedOption === opt
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-default hover:border-primary/40'"
            :disabled="showFeedback"
            @click="selectedOption = opt"
          >
            {{ opt }}
          </button>
        </div>

        <!-- TRUE_FALSE -->
        <div
          v-else-if="q.type === 'TRUE_FALSE'"
          class="grid grid-cols-2 gap-3"
        >
          <button
            v-for="opt in ['True', 'False']"
            :key="opt"
            class="rounded-xl border py-4 text-center text-sm font-bold transition-all"
            :class="showFeedback
              ? opt.toLowerCase() === q.answer.toLowerCase()
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : selectedOption.toLowerCase() === opt.toLowerCase() && !lastCorrect
                  ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'border-subtle opacity-50'
              : selectedOption === opt
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-default hover:border-primary/40'"
            :disabled="showFeedback"
            @click="selectedOption = opt"
          >
            {{ opt === 'True' ? '✓ Верно' : '✗ Неверно' }}
          </button>
        </div>

        <!-- FILL / OPEN -->
        <div v-else>
          <textarea
            v-if="q.type === 'OPEN'"
            v-model="userInput"
            placeholder="Напишите свой ответ..."
            :rows="4"
            class="w-full rounded-xl border border-default bg-elevated px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            :class="showFeedback ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : ''"
            :disabled="showFeedback"
            @keydown="handleKey"
          />
          <input
            v-else
            v-model="userInput"
            placeholder="Введите ответ..."
            class="w-full rounded-xl border border-default bg-elevated px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            :class="showFeedback
              ? lastCorrect
                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                : 'border-red-400 bg-red-50/50 dark:bg-red-900/10'
              : ''"
            :disabled="showFeedback"
            @keydown="handleKey"
          >
          <!-- Correct answer hint on wrong FILL -->
          <p
            v-if="showFeedback && !lastCorrect && q.type === 'FILL'"
            class="mt-2 text-sm text-emerald-600 dark:text-emerald-400"
          >
            Правильно: <strong>{{ q.answer }}</strong>
          </p>
        </div>

        <!-- Feedback banner -->
        <transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="showFeedback"
            class="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            :class="lastCorrect || q.type === 'OPEN'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'"
          >
            <UIcon
              :name="lastCorrect || q.type === 'OPEN' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              class="size-4 shrink-0"
            />
            {{ lastCorrect || q.type === 'OPEN' ? 'Правильно!' : 'Неверно' }}
            <span
              v-if="lastCorrect && q.type !== 'OPEN'"
              class="ml-auto text-xs"
            >+{{ q.points }} XP</span>
          </div>
        </transition>
      </div>
    </UCard>

    <!-- Action button -->
    <div class="flex justify-end">
      <UButton
        v-if="!showFeedback"
        label="Проверить"
        icon="i-lucide-check"
        color="primary"
        size="lg"
        :disabled="!canSubmit"
        @click="submit"
      />
      <UButton
        v-else
        :label="isLast ? 'Завершить' : 'Дальше'"
        :icon="isLast ? 'i-lucide-flag' : 'i-lucide-arrow-right'"
        trailing
        color="primary"
        size="lg"
        @click="next"
      />
    </div>
  </div>
</template>
