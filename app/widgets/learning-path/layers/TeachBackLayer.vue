<script setup lang="ts">
/**
 * TeachBackLayer · S5 v2 · Voice-first + realtime concept-chips
 *
 * Поведение:
 *   - voiceFirst (default true) — большая mic-кнопка в центре, текстарея
 *     становится secondary (можно дописать руками поверх голоса).
 *   - realtimeConcepts (default true) — пока ребёнок говорит, чипы
 *     concepts'ов горят зелёным по мере их обнаружения в речи.
 *     Используется conceptKeywords (если задан) или подстрочное
 *     совпадение по имени concept.
 *   - На submit — отправляем итоговый текст в /api/ai/evaluate-teachback
 *     и показываем verdict с покрытием идей.
 */
import type { CapsuleLayer, LayerProgress, TeachBackContent } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as TeachBackContent)
const coverPrompts = computed(() => content.value.coverPrompts ?? [])
const requiredConcepts = computed(() => content.value.requiredConcepts ?? [])
const conceptKeywords = computed(() => content.value.conceptKeywords ?? {})
const minSentences = computed(() => content.value.minSentences ?? 3)
const voiceFirst = computed(() => content.value.voiceFirst !== false)
const realtimeConcepts = computed(() => content.value.realtimeConcepts !== false)
const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

// S14 — Феми приветствует ребёнка голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => greetLayer('TEACH_BACK'))

const { play } = useSound()

interface TeachBackVerdict {
  coverage: number
  coveredConcepts: string[]
  missingConcepts: string[]
  sentenceCount: number
  encouragement: string
  improvementTip: string
  passed: boolean
}

const text = ref('')
const interim = ref('')
const evaluating = ref(false)
const submitting = ref(false)
const verdict = ref<TeachBackVerdict | null>(null)

const charCount = computed(() => text.value.trim().length)
const canEvaluate = computed(() => charCount.value >= 40 && !evaluating.value)

// ── Realtime concept detection ───────────────────────────────────
/**
 * Чип «горит» если его concept-tag найден в текущей речи (text + interim).
 * Используем conceptKeywords если есть; иначе ищем по подстроке имени.
 */
const liveCoveredConcepts = computed<Set<string>>(() => {
  if (!realtimeConcepts.value) return new Set()
  const haystack = `${text.value} ${interim.value}`.toLowerCase()
  if (!haystack.trim()) return new Set()
  const found = new Set<string>()
  for (const concept of requiredConcepts.value) {
    const keys = conceptKeywords.value[concept] ?? [concept]
    for (const k of keys) {
      const needle = k.toLowerCase().trim()
      if (needle && haystack.includes(needle)) {
        found.add(concept)
        break
      }
    }
  }
  return found
})

const coveredCount = computed(() => liveCoveredConcepts.value.size)
const totalConcepts = computed(() => requiredConcepts.value.length || 1)

// SFX — звук при первом обнаружении нового concept
const lastCoveredCount = ref(0)
watch(coveredCount, (now, prev) => {
  if (now > prev) play('sparkle')
  lastCoveredCount.value = now
})

// ── Speech-to-text plumbing (через MicButton events) ─────────────
const handleTranscript = (val: string) => {
  text.value = val
}
const handleInterim = (val: string) => {
  interim.value = val
}

const reset = () => {
  verdict.value = null
}

const evaluate = async () => {
  if (!canEvaluate.value) return
  evaluating.value = true
  try {
    const res = await $fetch<TeachBackVerdict>('/api/ai/evaluate-teachback', {
      method: 'POST',
      body: {
        text: text.value,
        audiencePersona: content.value.audiencePersona,
        referenceAnswer: content.value.referenceAnswer,
        requiredConcepts: requiredConcepts.value,
        minSentences: minSentences.value
      }
    })
    verdict.value = res
    play(res.passed ? 'cheer' : 'pop')
  } catch {
    verdict.value = {
      coverage: 0.5,
      coveredConcepts: [],
      missingConcepts: requiredConcepts.value,
      sentenceCount: 0,
      encouragement: 'Хорошо, что попробовал!',
      improvementTip: 'Сейчас не получилось оценить — попробуй ещё раз.',
      passed: false
    }
  } finally {
    evaluating.value = false
  }
}

const finish = async () => {
  if (submitting.value || isCompleted.value) return
  submitting.value = true
  try {
    emit('complete', {
      interactionData: {
        text: text.value,
        verdict: verdict.value as unknown as Record<string, unknown>,
        liveCoveredConcepts: Array.from(liveCoveredConcepts.value)
      },
      score: 1,
      maxScore: 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="inline-flex items-center gap-1.5 rounded-full bg-pink-500/15 border border-pink-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300">
      <UIcon
        name="i-lucide-megaphone"
        class="size-3.5"
      />
      Объясни сам
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        state="teach"
        size="md"
      />
      <div class="flex-1 min-w-0">
        <h2 class="text-xl sm:text-2xl font-black text-highlighted">
          {{ layer.title }}
        </h2>
        <p class="mt-1 text-sm text-muted wrap-break-word">
          Представь, что ты объясняешь тему {{ content.audiencePersona }}. Расскажи своими словами — и проверь себя глубже.
        </p>
      </div>
    </div>

    <!-- ════════ Cover prompts: realtime подсветка ═══════ -->
    <div
      v-if="coverPrompts.length || requiredConcepts.length"
      class="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4"
    >
      <div class="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300">
        <span>Постарайся упомянуть</span>
        <span
          v-if="realtimeConcepts && requiredConcepts.length"
          class="font-black tabular-nums"
        >
          {{ coveredCount }} / {{ totalConcepts }}
        </span>
      </div>
      <ul
        v-if="coverPrompts.length"
        class="mt-2 space-y-1"
      >
        <li
          v-for="(p, i) in coverPrompts"
          :key="i"
          class="flex items-start gap-2 text-sm text-highlighted"
        >
          <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-[10px] font-bold text-pink-600 dark:text-pink-300 tabular-nums">
            {{ i + 1 }}
          </span>
          <span class="wrap-break-word">{{ p }}</span>
        </li>
      </ul>
      <!-- Live concept chips -->
      <div
        v-if="realtimeConcepts && requiredConcepts.length"
        class="mt-3 flex flex-wrap gap-1.5"
      >
        <span
          v-for="c in requiredConcepts"
          :key="c"
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-300"
          :class="liveCoveredConcepts.has(c)
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 scale-105 chip-glow'
            : 'bg-muted text-muted-foreground border border-default'"
        >
          <UIcon
            :name="liveCoveredConcepts.has(c) ? 'i-lucide-check' : 'i-lucide-circle'"
            class="size-3"
          />
          {{ c }}
        </span>
      </div>
    </div>

    <!-- ════════ MIC + textarea ═══════ -->
    <div class="rounded-2xl border border-default bg-default p-5 space-y-4">
      <!-- Voice-first: крупный mic в центре -->
      <MicButton
        v-if="voiceFirst"
        size="lg"
        :prompt="content.voicePrompt ?? coverPrompts[0]"
        hint="Расскажи как ты понимаешь тему. Слова появятся в окошке ниже."
        :disabled="isCompleted || evaluating"
        @transcript="handleTranscript"
        @interim="handleInterim"
      />

      <!-- Текстарея — secondary при voiceFirst -->
      <div>
        <label class="text-xs font-bold uppercase tracking-wider text-muted">
          {{ voiceFirst ? 'Что я расслышал' : 'Твоё объяснение' }}
        </label>
        <textarea
          v-model="text"
          :disabled="isCompleted || evaluating"
          rows="6"
          placeholder="Напиши простыми словами, будто рассказываешь другу…"
          class="mt-2 w-full rounded-xl border-2 border-default bg-elevated px-4 py-3 text-sm text-highlighted outline-none transition-colors focus:border-pink-500"
        />
        <div class="mt-1 flex items-center justify-between text-[11px] text-muted">
          <span>Минимум ~{{ minSentences }} предложений</span>
          <span class="tabular-nums">{{ charCount }} символов</span>
        </div>
      </div>
    </div>

    <!-- ════════ Controls ═══════ -->
    <div
      v-if="!verdict"
      class="flex justify-end"
    >
      <UButton
        color="primary"
        size="lg"
        :loading="evaluating"
        :disabled="!canEvaluate"
        @click="evaluate"
      >
        <UIcon
          name="i-lucide-sparkles"
          class="size-4"
        />
        Оценить объяснение
      </UButton>
    </div>

    <!-- ════════ Verdict ═══════ -->
    <div
      v-if="verdict"
      class="rounded-2xl border p-5"
      :class="verdict.passed
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-amber-500/30 bg-amber-500/5'"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          :state="verdict.passed ? 'celebrate' : 'think'"
          size="md"
        />
        <div class="flex-1 space-y-3 min-w-0">
          <p class="text-sm font-bold text-highlighted wrap-break-word">
            {{ verdict.encouragement }}
          </p>

          <!-- Coverage bar -->
          <div>
            <div class="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
              <span>Покрытие идей</span>
              <span class="tabular-nums">{{ Math.round(verdict.coverage * 100) }}%</span>
            </div>
            <div class="mt-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="verdict.passed ? 'bg-emerald-500' : 'bg-amber-500'"
                :style="{ width: `${Math.round(verdict.coverage * 100)}%` }"
              />
            </div>
          </div>

          <!-- Concept chips -->
          <div
            v-if="verdict.coveredConcepts.length || verdict.missingConcepts.length"
            class="space-y-2"
          >
            <div
              v-if="verdict.coveredConcepts.length"
              class="flex flex-wrap gap-1.5"
            >
              <span
                v-for="c in verdict.coveredConcepts"
                :key="`ok-${c}`"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300"
              >
                <UIcon
                  name="i-lucide-check"
                  class="size-3"
                />
                {{ c }}
              </span>
            </div>
            <div
              v-if="verdict.missingConcepts.length"
              class="flex flex-wrap gap-1.5"
            >
              <span
                v-for="c in verdict.missingConcepts"
                :key="`miss-${c}`"
                class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-300"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="size-3"
                />
                {{ c }}
              </span>
            </div>
          </div>

          <div class="rounded-lg bg-white/40 dark:bg-white/5 px-3 py-2 text-xs text-highlighted">
            <span class="font-bold text-amber-600 dark:text-amber-300">Совет: </span>
            {{ verdict.improvementTip }}
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            <UButton
              v-if="!verdict.passed"
              variant="ghost"
              size="sm"
              @click="reset"
            >
              <UIcon
                name="i-lucide-pencil"
                class="size-4"
              />
              Доработать
            </UButton>
            <UButton
              v-if="!isCompleted"
              color="primary"
              size="lg"
              :loading="submitting"
              @click="finish"
            >
              К финальной проверке
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isCompleted"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="size-4 text-emerald-500"
      />
      Слой пройден — нажми «Далее» слева.
    </div>
  </div>
</template>

<style scoped>
@keyframes chip-glow-anim {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
  100% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
.chip-glow {
  animation: chip-glow-anim 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
