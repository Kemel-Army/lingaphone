<script setup lang="ts">
/**
 * Заполнение пропусков в тексте песни.
 *
 * В строке может быть несколько пропусков — в методических материалах такие
 * строки есть («Clap ___ if you feel like a room without a ___»), поэтому ответ
 * хранится не на строку, а на каждый пропуск: ключ `lineIndex:gapIndex`.
 *
 * Аудио остаётся над текстом на липкой панели: ребёнок слушает и вписывает
 * слова параллельно, а не переключается между экранами.
 */
import { type LyricLine, gapCount } from '~/entities/song'
import { usePracticeSong } from '../composables/usePracticeSong'
import type { GapResult } from '../composables/usePracticeSong'

const props = defineProps<{ lyrics: LyricLine[], audioUrl?: string | null }>()
const emit = defineEmits<{ done: [results: GapResult[]] }>()

const { checkGap } = usePracticeSong()

/** Один элемент на пропуск: строка + позиция внутри строки. */
interface GapRef { lineIndex: number, gapIndex: number, key: string, answers: string[] }

const gapKey = (lineIndex: number, gapIndex: number) => `${lineIndex}:${gapIndex}`

const gaps = computed<GapRef[]>(() =>
  props.lyrics.flatMap(line =>
    Array.from({ length: gapCount(line) }, (_, gapIndex) => ({
      lineIndex: line.lineIndex,
      gapIndex,
      key: gapKey(line.lineIndex, gapIndex),
      answers: line.gapAnswer?.[gapIndex] ? [line.gapAnswer[gapIndex]!] : []
    }))
  )
)

const userAnswers = ref<Record<string, string>>({})
const checked = ref(false)
const results = ref<GapResult[]>([])

const allFilled = computed(() =>
  gaps.value.every(g => (userAnswers.value[g.key] ?? '').trim().length > 0)
)

const checkAnswers = () => {
  results.value = gaps.value.map((g) => {
    const ua = userAnswers.value[g.key] ?? ''
    return {
      lineIndex: g.lineIndex,
      gapIndex: g.gapIndex,
      userAnswer: ua,
      correctAnswer: g.answers[0] ?? '',
      correct: checkGap(ua, g.answers)
    }
  })
  checked.value = true
}

const finish = () => emit('done', results.value)

const resultMap = computed(() =>
  Object.fromEntries(results.value.map(r => [gapKey(r.lineIndex, r.gapIndex ?? 0), r]))
)

const correctCount = computed(() => results.value.filter(r => r.correct).length)
const totalCount = computed(() => gaps.value.length)

/** Неверные ответы строки — показываем ключ рядом, как и раньше. */
const wrongAnswersFor = (lineIndex: number) =>
  results.value.filter(r => r.lineIndex === lineIndex && !r.correct).map(r => r.correctAnswer)
</script>

<template>
  <div class="space-y-1">
    <!-- Аудио едет вместе с текстом: слушаем и вписываем одновременно -->
    <div
      v-if="audioUrl"
      class="sticky top-2 z-10 mb-3 rounded-2xl border border-default bg-default/95 p-3 shadow-sm backdrop-blur"
    >
      <p class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <UIcon
          name="i-lucide-headphones"
          class="size-3.5 text-primary"
        />
        Слушай и вставляй пропущенные слова
      </p>
      <audio
        :src="audioUrl"
        controls
        preload="metadata"
        class="w-full"
      />
    </div>

    <!-- Lyrics -->
    <div class="rounded-2xl border border-default bg-elevated p-5 space-y-2">
      <template
        v-for="line in lyrics"
        :key="line.lineIndex"
      >
        <!-- Non-gap line -->
        <p
          v-if="!line.hasGap"
          class="text-sm leading-relaxed text-default"
        >
          {{ line.text }}
        </p>

        <!-- Gap line -->
        <div
          v-else
          class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-relaxed"
        >
          <template
            v-for="(part, pi) in line.text.split('___')"
            :key="pi"
          >
            <span>{{ part }}</span>
            <input
              v-if="pi < line.text.split('___').length - 1"
              v-model="userAnswers[gapKey(line.lineIndex, pi)]"
              :disabled="checked"
              :placeholder="checked ? '' : '...'"
              type="text"
              autocomplete="off"
              spellcheck="false"
              class="inline-block w-28 rounded-lg border px-2 py-0.5 text-sm outline-none transition-all focus:ring-1"
              :class="checked
                ? resultMap[gapKey(line.lineIndex, pi)]?.correct
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'border-default bg-default focus:border-primary focus:ring-primary/30'"
            >
          </template>

          <!-- Correct answer hint after check -->
          <span
            v-if="checked && wrongAnswersFor(line.lineIndex).length"
            class="text-xs text-emerald-600 dark:text-emerald-400"
          >
            → {{ wrongAnswersFor(line.lineIndex).join(', ') }}
          </span>

          <!-- Translation -->
          <span
            v-if="line.translation"
            class="w-full text-xs italic text-muted"
          >
            {{ line.translation }}
          </span>
        </div>
      </template>
    </div>

    <!-- Score after check -->
    <transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        v-if="checked"
        class="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold"
        :class="correctCount === totalCount
          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
          : correctCount >= totalCount * 0.7
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'"
      >
        <span class="flex items-center gap-2">
          <UIcon
            :name="correctCount === totalCount ? 'i-lucide-trophy' : 'i-lucide-check-circle'"
            class="size-4"
          />
          {{ correctCount }} / {{ totalCount }} правильных
        </span>
        <UButton
          label="Завершить"
          icon="i-lucide-flag"
          trailing
          size="sm"
          color="primary"
          @click="finish"
        />
      </div>
    </transition>

    <!-- Action button -->
    <div
      v-if="!checked"
      class="flex justify-end pt-1"
    >
      <UButton
        label="Проверить пропуски"
        icon="i-lucide-check"
        color="primary"
        size="lg"
        :disabled="!allFilled"
        @click="checkAnswers"
      />
    </div>
  </div>
</template>
