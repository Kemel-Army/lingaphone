<script setup lang="ts">
import { getDeck, type PronunciationCard } from '~/shared/mock'
import { speak, useRecognition, similarity } from '~/shared/composables/useSpeech'
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const deckId = computed(() => String(route.params.deckId))
const deck = computed(() => getDeck(deckId.value))

const { recordPracticeAttempt, recordDeckCompletion, addToVocabulary, vocabulary } = useLingafonStudent()

const savedWords = computed(() => new Set(vocabulary.value.map(v => v.word.toLowerCase())))

const isSaving = ref(false)
const handleSaveToVocab = async () => {
  if (!currentCard.value || isSaving.value) return
  isSaving.value = true
  try {
    await addToVocabulary(
      currentCard.value.target,
      currentCard.value.ipa,
      currentCard.value.translation,
      currentCard.value.example ?? null
    )
  } finally {
    isSaving.value = false
  }
}

const isInVocab = computed(() =>
  !!currentCard.value && savedWords.value.has(currentCard.value.target.toLowerCase())
)

if (!deck.value) {
  throw createError({ statusCode: 404, message: 'Колода не найдена' })
}

const { isSupported, isListening, error: recError, start: startRecognition, stop: stopRecognition } = useRecognition()

const currentIndex = ref(0)
const totalCards = computed(() => deck.value!.cards.length)
const currentCard = computed<PronunciationCard | undefined>(() => deck.value!.cards[currentIndex.value])
const progressPct = computed(() => Math.round((currentIndex.value / totalCards.value) * 100))

interface Attempt {
  cardId: string
  transcript: string
  score: number
}
const attempts = ref<Attempt[]>([])
const lastAttempt = ref<Attempt | null>(null)
const isFinished = ref(false)

const isSpeaking = ref(false)
const handleListen = async () => {
  if (!currentCard.value) return
  isSpeaking.value = true
  await speak(currentCard.value.target, { rate: 0.85 })
  // SpeechSynthesisUtterance.onend would be more accurate, but rough timing is fine for UI
  setTimeout(() => {
    isSpeaking.value = false
  }, currentCard.value.target.length * 80 + 500)
}

const handleRecord = async () => {
  if (!currentCard.value) return
  if (isListening.value) {
    stopRecognition()
    return
  }
  try {
    const result = await startRecognition()
    const score = similarity(result.transcript, currentCard.value.target)
    const attempt: Attempt = {
      cardId: currentCard.value.id,
      transcript: result.transcript,
      score
    }
    attempts.value.push(attempt)
    lastAttempt.value = attempt
    // Persist to Supabase (PracticeAttempt + XP if score >= 85)
    void recordPracticeAttempt(
      deckId.value,
      currentCard.value.id,
      currentCard.value.target,
      result.transcript,
      score
    )
  } catch {
    // error already in recError
  }
}

const next = () => {
  if (currentIndex.value < totalCards.value - 1) {
    currentIndex.value++
    lastAttempt.value = null
  } else {
    isFinished.value = true
    // Award deck-completion XP if we hit at least 60% average
    void recordDeckCompletion(deckId.value, avgScore.value)
  }
}

const retry = () => {
  lastAttempt.value = null
}

const restart = () => {
  currentIndex.value = 0
  attempts.value = []
  lastAttempt.value = null
  isFinished.value = false
}

// Results
const avgScore = computed(() => {
  if (attempts.value.length === 0) return 0
  // Take the BEST attempt per card
  const bestByCard: Record<string, number> = {}
  for (const a of attempts.value) {
    bestByCard[a.cardId] = Math.max(bestByCard[a.cardId] ?? 0, a.score)
  }
  const values = Object.values(bestByCard)
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
})

const xpEarned = computed(() => Math.round(avgScore.value / 10) * 5)

const scoreColor = (score: number) => {
  if (score >= 85) return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-300', text: 'text-emerald-700 dark:text-emerald-300', label: '🎉 Отлично!', accent: 'bg-emerald-500' }
  if (score >= 60) return { bg: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-300', text: 'text-amber-700 dark:text-amber-300', label: '🟡 Близко', accent: 'bg-amber-500' }
  return { bg: 'bg-red-50 dark:bg-red-900/30', ring: 'ring-red-300', text: 'text-red-700 dark:text-red-300', label: '🔴 Попробуй ещё раз', accent: 'bg-red-500' }
}

const lastFeedback = computed(() => lastAttempt.value ? scoreColor(lastAttempt.value.score) : null)
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Decorative gradient -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 rounded-full bg-primary-400/20 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 pb-8 max-w-3xl mx-auto">
      <!-- Header with progress -->
      <header class="space-y-3 mb-6 sm:mb-8">
        <div class="flex items-center justify-between gap-2">
          <NuxtLink
            to="/student/practice"
            class="text-sm font-semibold text-muted hover:text-primary inline-flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-4"
            />
            К колодам
          </NuxtLink>
          <p class="text-sm font-bold tabular-nums">
            <span class="text-primary">{{ currentIndex + 1 }}</span> / {{ totalCards }}
          </p>
        </div>

        <div>
          <h1 class="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>{{ deck!.emoji }}</span>
            {{ deck!.title }}
          </h1>
          <p class="text-sm text-muted">
            {{ deck!.description }}
          </p>
        </div>

        <!-- Progress bar -->
        <div class="h-2 rounded-full bg-elevated overflow-hidden">
          <div
            class="h-full bg-linear-to-r from-primary-500 to-violet-600 transition-all duration-500"
            :style="{ width: `${progressPct}%` }"
          />
        </div>
      </header>

      <!-- Browser not supported -->
      <UAlert
        v-if="!isSupported"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="subtle"
        title="Браузер не поддерживает распознавание речи"
        description="Открой в Chrome, Edge или Safari (последняя версия). Микрофон работает только на localhost или HTTPS."
        class="mb-6"
      />

      <!-- Results screen -->
      <section
        v-if="isFinished"
        class="space-y-6"
      >
        <div class="rounded-3xl bg-linear-to-br from-primary-500 via-sky-600 to-violet-600 p-8 text-white text-center shadow-xl">
          <UIcon
            name="i-lucide-party-popper"
            class="size-16 mx-auto"
          />
          <p class="mt-4 text-sm font-bold uppercase tracking-widest opacity-80">
            Колода завершена!
          </p>
          <p class="mt-2 text-6xl sm:text-7xl font-black tabular-nums">
            {{ avgScore }}%
          </p>
          <p class="mt-2 text-lg opacity-90">
            средняя точность произношения
          </p>
          <div class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur font-bold">
            <UIcon
              name="i-lucide-sparkles"
              class="size-4"
            />
            +{{ xpEarned }} XP
          </div>
        </div>

        <!-- Per-card breakdown -->
        <div class="space-y-2">
          <h2 class="font-bold mb-3">
            Карточка за карточкой
          </h2>
          <div
            v-for="card in deck!.cards"
            :key="card.id"
            class="flex items-center justify-between rounded-xl border border-default px-4 py-3"
          >
            <div class="min-w-0">
              <p class="font-bold truncate">
                {{ card.target }}
              </p>
              <p class="text-xs font-mono text-muted">
                {{ card.ipa }}
              </p>
            </div>
            <div
              v-if="attempts.find(a => a.cardId === card.id)"
              class="text-right shrink-0 ml-3"
            >
              <p
                class="text-lg font-black tabular-nums"
                :class="scoreColor(Math.max(...attempts.filter(a => a.cardId === card.id).map(a => a.score))).text"
              >
                {{ Math.max(...attempts.filter(a => a.cardId === card.id).map(a => a.score)) }}%
              </p>
            </div>
            <UBadge
              v-else
              label="Пропущено"
              color="neutral"
              variant="subtle"
              size="xs"
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton
            label="Пройти ещё раз"
            color="primary"
            icon="i-lucide-rotate-ccw"
            @click="restart"
          />
          <UButton
            to="/student/practice"
            label="Выбрать другую колоду"
            color="neutral"
            variant="outline"
          />
        </div>
      </section>

      <!-- Active card -->
      <section
        v-else-if="currentCard"
        class="space-y-6"
      >
        <!-- The card itself -->
        <article
          class="relative rounded-3xl border border-default bg-default p-8 sm:p-10 shadow-lg text-center transition-all"
          :class="lastFeedback && [lastFeedback.bg, 'ring-2', lastFeedback.ring]"
        >
          <UBadge
            v-if="currentCard.kind === 'MIN_PAIR'"
            label="🎯 Минимальная пара"
            color="warning"
            variant="subtle"
            size="xs"
            class="mb-4"
          />
          <UBadge
            v-else-if="currentCard.kind === 'PHRASE'"
            label="💬 Фраза"
            color="info"
            variant="subtle"
            size="xs"
            class="mb-4"
          />
          <UBadge
            v-else
            label="📝 Слово"
            color="primary"
            variant="subtle"
            size="xs"
            class="mb-4"
          />

          <p class="text-2xl sm:text-5xl font-black tracking-tight wrap-break-word">
            {{ currentCard.target }}
          </p>
          <p class="mt-3 text-base sm:text-lg font-mono text-muted">
            {{ currentCard.ipa }}
          </p>
          <p class="mt-3 text-sm sm:text-base text-muted italic">
            {{ currentCard.translation }}
          </p>
          <p
            v-if="currentCard.example"
            class="mt-4 text-sm text-muted"
          >
            <span class="font-bold not-italic">Пример:</span> «{{ currentCard.example }}»
          </p>

          <!-- Save to vocabulary -->
          <button
            type="button"
            :disabled="isSaving || isInVocab"
            class="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-default"
            :class="isInVocab
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-elevated hover:bg-primary-50 dark:hover:bg-primary-900/30 text-default'"
            @click="handleSaveToVocab"
          >
            <UIcon
              :name="isInVocab ? 'i-lucide-check' : 'i-lucide-book-marked'"
              class="size-3.5"
            />
            {{ isInVocab ? 'В словаре' : isSaving ? 'Сохраняю...' : 'В словарь' }}
          </button>
        </article>

        <!-- Recognition error -->
        <UAlert
          v-if="recError"
          icon="i-lucide-alert-circle"
          color="error"
          variant="subtle"
          :description="recError"
        />

        <!-- Feedback after attempt -->
        <article
          v-if="lastAttempt && lastFeedback"
          class="rounded-2xl ring-1 p-5 space-y-3 transition-all"
          :class="[lastFeedback.bg, lastFeedback.ring]"
        >
          <div class="flex items-center justify-between gap-3">
            <p
              class="font-black"
              :class="lastFeedback.text"
            >
              {{ lastFeedback.label }}
            </p>
            <p
              class="text-3xl font-black tabular-nums"
              :class="lastFeedback.text"
            >
              {{ lastAttempt.score }}%
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              Что услышал AI:
            </p>
            <p
              class="text-base font-medium"
              :class="lastFeedback.text"
            >
              «{{ lastAttempt.transcript }}»
            </p>
          </div>

          <!-- Mini progress bar -->
          <div class="h-2 rounded-full bg-white/40 dark:bg-black/30 overflow-hidden">
            <div
              class="h-full transition-all duration-700"
              :class="lastFeedback.accent"
              :style="{ width: `${lastAttempt.score}%` }"
            />
          </div>
        </article>

        <!-- Action buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            :disabled="isSpeaking"
            class="group relative rounded-2xl bg-linear-to-br from-primary-500 to-sky-700 p-5 text-white font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            @click="handleListen"
          >
            <UIcon
              :name="isSpeaking ? 'i-lucide-volume-2' : 'i-lucide-volume-2'"
              class="size-7 mx-auto"
              :class="isSpeaking && 'animate-pulse'"
            />
            <p class="mt-2 text-sm">
              {{ isSpeaking ? 'Произношу...' : 'Listen' }}
            </p>
          </button>

          <button
            type="button"
            :disabled="!isSupported"
            class="group relative rounded-2xl p-5 text-white font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            :class="isListening
              ? 'bg-linear-to-br from-red-500 to-pink-600 animate-pulse'
              : 'bg-linear-to-br from-emerald-500 to-teal-600'"
            @click="handleRecord"
          >
            <UIcon
              :name="isListening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
              class="size-7 mx-auto"
            />
            <p class="mt-2 text-sm">
              {{ isListening ? 'Слушаю...' : 'Repeat' }}
            </p>
          </button>
        </div>

        <!-- Next / retry / skip -->
        <div class="flex flex-wrap gap-2 justify-between">
          <UButton
            v-if="lastAttempt && lastAttempt.score < 85"
            label="Попробовать ещё"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            @click="retry"
          />
          <span v-else />

          <div class="flex gap-2">
            <UButton
              label="Пропустить"
              color="neutral"
              variant="ghost"
              @click="next"
            />
            <UButton
              :label="currentIndex === totalCards - 1 ? 'Завершить' : 'Дальше'"
              color="primary"
              :icon="currentIndex === totalCards - 1 ? 'i-lucide-flag' : 'i-lucide-arrow-right'"
              trailing
              :disabled="!lastAttempt"
              @click="next"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
