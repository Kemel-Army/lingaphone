<script setup lang="ts">
import { getStory } from '~/shared/mock'
import { speak, useRecognition, similarity } from '~/shared/composables/useSpeech'
import { useStoryAttempts, type StoryAttemptSummary } from '~/shared/composables/useStoryAttempts'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const storyId = computed(() => String(route.params.id))
const story = computed(() => getStory(storyId.value))

if (!story.value) {
  throw createError({ statusCode: 404, message: 'Рассказ не найден' })
}

const { recordAttempt, summarizeStory } = useStoryAttempts()
const storySummary = ref<StoryAttemptSummary>({ attempts: 0, bestScore: 0, averageScore: 0, lastAttemptedAt: null })
const isPersisting = ref(false)
const xpEarned = ref(0)

onMounted(async () => {
  storySummary.value = await summarizeStory(storyId.value)
})

type Phase = 'listen' | 'retell' | 'feedback'
const phase = ref<Phase>('listen')

const showTranscript = ref(false)
const isSpeaking = ref(false)
const playCount = ref(0)

const handleListen = async () => {
  if (!story.value || isSpeaking.value) return
  isSpeaking.value = true
  playCount.value++
  await speak(story.value.text, { rate: 0.85 })
  // Rough timing estimate so the button shows "Speaking..." for the right duration
  const estMs = story.value.text.length * 60 + 1000
  setTimeout(() => {
    isSpeaking.value = false
  }, estMs)
}

const handleStopListen = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
}

const { isSupported, isListening, error: recError, start: startRecognition, stop: stopRecognition } = useRecognition()

const retellingTranscript = ref('')

const handleRecord = async () => {
  if (isListening.value) {
    stopRecognition()
    return
  }
  try {
    const result = await startRecognition()
    retellingTranscript.value = result.transcript
    phase.value = 'feedback'
    await persistAttempt()
  } catch {
    // error already in recError
  }
}

const persistAttempt = async () => {
  if (!story.value || !retellingTranscript.value) return
  isPersisting.value = true
  xpEarned.value = 0
  try {
    const res = await recordAttempt({
      storyId: story.value.id,
      storyTitle: story.value.title,
      storyLevel: story.value.level,
      transcript: retellingTranscript.value,
      keyPointsTotal: totalKeyPoints.value,
      keyPointsCovered: coveredCount.value,
      comprehensionScore: comprehensionScore.value
    })
    if (res.ok) {
      xpEarned.value = res.xpAwarded
      storySummary.value = await summarizeStory(storyId.value)
    }
  } finally {
    isPersisting.value = false
  }
}

// ─── AI-style comprehension analysis ─────────────────────────────────────
const normalizeText = (s: string) =>
  s.toLowerCase()
    .replace(/[.,!?;:'"()‘’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

interface KeyPointResult {
  label: string
  matched: boolean
  matchedSynonym: string | null
}

const keyPointResults = computed<KeyPointResult[]>(() => {
  if (!story.value) return []
  const normalized = normalizeText(retellingTranscript.value)
  return story.value.keyPoints.map((kp) => {
    let matchedSynonym: string | null = null
    for (const syn of kp.synonyms) {
      if (normalized.includes(syn.toLowerCase())) {
        matchedSynonym = syn
        break
      }
    }
    return { label: kp.label, matched: !!matchedSynonym, matchedSynonym }
  })
})

const coveredCount = computed(() => keyPointResults.value.filter(k => k.matched).length)
const totalKeyPoints = computed(() => keyPointResults.value.length)

/** 0-100 comprehension score = key-point coverage × 0.85 + textual similarity × 0.15 */
const comprehensionScore = computed(() => {
  if (!story.value || !retellingTranscript.value) return 0
  const coverage = totalKeyPoints.value === 0
    ? 0
    : (coveredCount.value / totalKeyPoints.value) * 100
  const textSim = similarity(retellingTranscript.value, story.value.text)
  return Math.round(coverage * 0.85 + textSim * 0.15)
})

const retellingWordCount = computed(() =>
  retellingTranscript.value.trim().split(/\s+/).filter(Boolean).length
)

const verdict = computed(() => {
  const score = comprehensionScore.value
  if (score >= 80) {
    return {
      label: '🎉 Отлично понял!',
      message: 'Ты передал почти все ключевые моменты рассказа',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      ring: 'ring-emerald-300',
      text: 'text-emerald-700 dark:text-emerald-300',
      accent: 'bg-emerald-500'
    }
  }
  if (score >= 55) {
    return {
      label: '🟡 Хорошо, но не всё',
      message: 'Ты передал основу, но упустил несколько важных деталей',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      ring: 'ring-amber-300',
      text: 'text-amber-700 dark:text-amber-300',
      accent: 'bg-amber-500'
    }
  }
  return {
    label: '🔴 Послушай ещё раз',
    message: 'Похоже, ты пропустил много деталей. Послушай рассказ снова и попробуй ещё',
    bg: 'bg-red-50 dark:bg-red-900/30',
    ring: 'ring-red-300',
    text: 'text-red-700 dark:text-red-300',
    accent: 'bg-red-500'
  }
})

const retryRetell = () => {
  retellingTranscript.value = ''
  phase.value = 'retell'
}

const restartListen = () => {
  retellingTranscript.value = ''
  showTranscript.value = false
  phase.value = 'listen'
}

const LEVEL_COLOR: Record<string, string> = {
  A1: 'primary', A2: 'info', S1: 'warning', S2: 'error', B2: 'neutral'
}
</script>

<template>
  <div
    v-if="story"
    class="relative min-h-screen"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 rounded-full bg-primary-400/20 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 pb-8 max-w-3xl mx-auto">
      <!-- Header -->
      <header class="space-y-3 mb-6">
        <NuxtLink
          to="/student/materials"
          class="text-sm font-semibold text-muted hover:text-primary inline-flex items-center gap-1.5"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          К материалам
        </NuxtLink>

        <div class="flex items-start gap-3">
          <div class="text-4xl shrink-0">
            {{ story.emoji }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <UBadge
                :label="story.level"
                :color="LEVEL_COLOR[story.level] as any"
                variant="subtle"
                size="xs"
              />
              <UBadge
                :label="story.topic"
                color="neutral"
                variant="subtle"
                size="xs"
              />
            </div>
            <h1 class="text-2xl font-black tracking-tight">
              {{ story.title }}
            </h1>
            <p class="text-sm text-muted">
              {{ story.description }}
            </p>
          </div>
        </div>

        <!-- Phase indicator -->
        <div class="flex items-center gap-2 pt-2">
          <div
            class="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5"
            :class="phase === 'listen'
              ? 'bg-primary text-inverted'
              : 'bg-elevated text-muted'"
          >
            <UIcon
              name="i-lucide-headphones"
              class="size-3.5"
            /> 1. Слушай
          </div>
          <div class="h-px flex-1 bg-default" />
          <div
            class="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5"
            :class="phase === 'retell'
              ? 'bg-primary text-inverted'
              : 'bg-elevated text-muted'"
          >
            <UIcon
              name="i-lucide-mic"
              class="size-3.5"
            /> 2. Пересказывай
          </div>
          <div class="h-px flex-1 bg-default" />
          <div
            class="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5"
            :class="phase === 'feedback'
              ? 'bg-primary text-inverted'
              : 'bg-elevated text-muted'"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-3.5"
            /> 3. AI-разбор
          </div>
        </div>
      </header>

      <!-- Past attempts banner -->
      <div
        v-if="storySummary.attempts > 0"
        class="mb-6 rounded-2xl border border-default bg-default p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="size-10 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <UIcon
              name="i-lucide-history"
              class="size-5 text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-muted">
              История по этому рассказу
            </p>
            <p class="text-sm">
              <span class="font-black tabular-nums">{{ storySummary.attempts }}</span> {{ storySummary.attempts === 1 ? 'попытка' : storySummary.attempts < 5 ? 'попытки' : 'попыток' }}
              · лучший: <span class="font-black tabular-nums text-emerald-600 dark:text-emerald-400">{{ storySummary.bestScore }}%</span>
            </p>
          </div>
        </div>
      </div>

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

      <!-- ════════════════════════════════════════════════════════════════ -->
      <!-- PHASE 1: LISTEN -->
      <!-- ════════════════════════════════════════════════════════════════ -->
      <section
        v-if="phase === 'listen'"
        class="space-y-6"
      >
        <article class="rounded-3xl border border-default bg-default p-8 text-center shadow-lg">
          <div class="mx-auto size-24 rounded-full bg-linear-to-br from-primary-500 to-sky-700 flex items-center justify-center text-white shadow-md mb-4">
            <UIcon
              :name="isSpeaking ? 'i-lucide-volume-2' : 'i-lucide-headphones'"
              class="size-12"
              :class="isSpeaking && 'animate-pulse'"
            />
          </div>
          <p class="text-sm font-bold uppercase tracking-widest text-muted mb-2">
            🎧 Шаг 1 — внимательно послушай
          </p>
          <p class="text-base text-default mb-6 max-w-md mx-auto">
            Закрой глаза или смотри на потолок — не подсматривай в текст. После прослушивания тебе нужно будет пересказать историю своими словами.
          </p>

          <div class="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              :disabled="isSpeaking"
              class="rounded-2xl bg-linear-to-br from-primary-500 to-sky-700 px-8 py-4 text-white font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              @click="handleListen"
            >
              <UIcon
                :name="isSpeaking ? 'i-lucide-volume-2' : 'i-lucide-play'"
                class="size-5 inline-block -mt-0.5 mr-2"
                :class="isSpeaking && 'animate-pulse'"
              />
              {{ isSpeaking ? 'Играю...' : playCount === 0 ? 'Начать прослушивание' : 'Послушать ещё раз' }}
            </button>
            <button
              v-if="isSpeaking"
              type="button"
              class="rounded-2xl bg-elevated px-6 py-4 font-bold hover:bg-default transition"
              @click="handleStopListen"
            >
              <UIcon
                name="i-lucide-square"
                class="size-4 inline-block -mt-0.5 mr-1.5"
              />
              Стоп
            </button>
          </div>

          <p
            v-if="playCount > 0"
            class="mt-4 text-xs text-muted"
          >
            Прослушано раз: <span class="font-bold tabular-nums">{{ playCount }}</span>
          </p>
        </article>

        <!-- Optional: reveal transcript -->
        <article class="rounded-2xl border border-default bg-default overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between p-4 hover:bg-elevated transition"
            @click="showTranscript = !showTranscript"
          >
            <span class="font-bold inline-flex items-center gap-2">
              <UIcon
                name="i-lucide-file-text"
                class="size-4"
              />
              {{ showTranscript ? 'Скрыть текст' : 'Показать текст (если совсем не разобрал)' }}
            </span>
            <UIcon
              :name="showTranscript ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-4"
            />
          </button>
          <div
            v-if="showTranscript"
            class="px-5 pb-5 space-y-3 border-t border-default"
          >
            <p class="text-base leading-relaxed mt-3">
              {{ story.text }}
            </p>
            <div class="rounded-xl bg-elevated p-3">
              <p class="text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                Перевод
              </p>
              <p class="text-sm text-muted leading-relaxed">
                {{ story.translation }}
              </p>
            </div>
          </div>
        </article>

        <!-- Next step -->
        <UButton
          label="Готов пересказать →"
          color="primary"
          size="xl"
          block
          :disabled="playCount === 0"
          @click="phase = 'retell'"
        />
        <p
          v-if="playCount === 0"
          class="text-xs text-muted text-center"
        >
          Сначала послушай рассказ
        </p>
      </section>

      <!-- ════════════════════════════════════════════════════════════════ -->
      <!-- PHASE 2: RETELL -->
      <!-- ════════════════════════════════════════════════════════════════ -->
      <section
        v-else-if="phase === 'retell'"
        class="space-y-6"
      >
        <article class="rounded-3xl border border-default bg-default p-8 text-center shadow-lg">
          <div
            class="mx-auto size-24 rounded-full flex items-center justify-center text-white shadow-md mb-4 transition-all"
            :class="isListening
              ? 'bg-linear-to-br from-red-500 to-pink-600 animate-pulse'
              : 'bg-linear-to-br from-emerald-500 to-teal-600'"
          >
            <UIcon
              :name="isListening ? 'i-lucide-mic' : 'i-lucide-mic'"
              class="size-12"
            />
          </div>
          <p class="text-sm font-bold uppercase tracking-widest text-muted mb-2">
            🎤 Шаг 2 — перескажи своими словами
          </p>
          <p class="text-base text-default mb-6 max-w-md mx-auto">
            Расскажи рассказ по-английски. Не нужно повторять слово в слово — AI оценит, насколько правильно ты понял суть и ключевые детали.
          </p>

          <button
            type="button"
            :disabled="!isSupported"
            class="rounded-2xl px-8 py-4 text-white font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            :class="isListening
              ? 'bg-linear-to-br from-red-500 to-pink-600 animate-pulse'
              : 'bg-linear-to-br from-emerald-500 to-teal-600'"
            @click="handleRecord"
          >
            <UIcon
              :name="isListening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
              class="size-5 inline-block -mt-0.5 mr-2"
            />
            {{ isListening ? 'Слушаю... (нажми, чтобы остановить)' : 'Начать запись' }}
          </button>

          <UAlert
            v-if="recError"
            icon="i-lucide-alert-circle"
            color="error"
            variant="subtle"
            :description="recError"
            class="mt-4 text-left"
          />
        </article>

        <UButton
          label="← Назад послушать"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="phase = 'listen'"
        />
      </section>

      <!-- ════════════════════════════════════════════════════════════════ -->
      <!-- PHASE 3: FEEDBACK -->
      <!-- ════════════════════════════════════════════════════════════════ -->
      <section
        v-else
        class="space-y-6"
      >
        <!-- Big score -->
        <div
          class="rounded-3xl p-8 text-center shadow-xl ring-2"
          :class="[verdict.bg, verdict.ring]"
        >
          <p
            class="text-sm font-bold uppercase tracking-widest mb-1"
            :class="verdict.text"
          >
            {{ verdict.label }}
          </p>
          <p
            class="text-6xl sm:text-7xl font-black tabular-nums"
            :class="verdict.text"
          >
            {{ comprehensionScore }}%
          </p>
          <p
            class="mt-2 text-base"
            :class="verdict.text"
          >
            понимания темы
          </p>
          <p
            class="mt-3 text-sm opacity-90"
            :class="verdict.text"
          >
            {{ verdict.message }}
          </p>

          <!-- Score bar -->
          <div class="mt-5 h-2.5 rounded-full bg-white/40 dark:bg-black/30 overflow-hidden max-w-md mx-auto">
            <div
              class="h-full transition-all duration-700"
              :class="verdict.accent"
              :style="{ width: `${comprehensionScore}%` }"
            />
          </div>

          <div class="mt-5 inline-flex items-center gap-4 text-sm font-bold">
            <span :class="verdict.text">
              ✓ {{ coveredCount }} / {{ totalKeyPoints }} ключевых моментов
            </span>
            <span class="opacity-50">•</span>
            <span :class="verdict.text">
              {{ retellingWordCount }} слов
            </span>
          </div>

          <!-- XP earned -->
          <div
            v-if="xpEarned > 0"
            class="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur font-black"
            :class="verdict.text"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-4"
            />
            +{{ xpEarned }} XP заработано
          </div>
          <p
            v-else-if="isPersisting"
            class="mt-4 text-xs opacity-70"
            :class="verdict.text"
          >
            Сохраняю результат...
          </p>
        </div>

        <!-- Your transcript -->
        <article class="rounded-2xl border border-default p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-muted mb-2">
            🎤 Что услышал AI от тебя
          </p>
          <p class="text-base italic leading-relaxed">
            «{{ retellingTranscript || '...тишина' }}»
          </p>
        </article>

        <!-- Key points breakdown -->
        <article class="rounded-2xl border border-default p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
            🎯 Ключевые моменты рассказа
          </p>
          <ul class="space-y-2">
            <li
              v-for="(kp, i) in keyPointResults"
              :key="i"
              class="flex items-start gap-3 rounded-xl p-3 transition"
              :class="kp.matched
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : 'bg-red-50/40 dark:bg-red-900/10'"
            >
              <div
                class="size-6 shrink-0 rounded-full flex items-center justify-center mt-0.5"
                :class="kp.matched
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-400/40 dark:bg-red-500/30 text-red-700 dark:text-red-300'"
              >
                <UIcon
                  :name="kp.matched ? 'i-lucide-check' : 'i-lucide-x'"
                  class="size-4"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="font-bold text-sm"
                  :class="kp.matched
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-default'"
                >
                  {{ kp.label }}
                </p>
                <p
                  v-if="kp.matched && kp.matchedSynonym"
                  class="text-xs text-muted mt-0.5"
                >
                  Услышал: <span class="font-mono font-bold">«{{ kp.matchedSynonym }}»</span>
                </p>
                <p
                  v-else
                  class="text-xs text-red-500 dark:text-red-400 mt-0.5"
                >
                  Не упомянул
                </p>
              </div>
            </li>
          </ul>
        </article>

        <!-- Comprehension questions -->
        <article
          v-if="story.questions && story.questions.length > 0"
          class="rounded-2xl border border-default p-5"
        >
          <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
            💡 Проверь себя
          </p>
          <ul class="space-y-3">
            <li
              v-for="(q, i) in story.questions"
              :key="i"
              class="border-l-2 border-primary-300 pl-3"
            >
              <p class="font-bold text-sm">
                {{ q.q }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                {{ q.a }}
              </p>
            </li>
          </ul>
        </article>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          <UButton
            label="Пересказать ещё раз"
            color="primary"
            icon="i-lucide-rotate-ccw"
            @click="retryRetell"
          />
          <UButton
            label="Послушать сначала"
            color="neutral"
            variant="outline"
            icon="i-lucide-headphones"
            @click="restartListen"
          />
          <UButton
            to="/student/materials"
            label="К материалам"
            color="neutral"
            variant="ghost"
          />
        </div>
      </section>
    </div>
  </div>
</template>
