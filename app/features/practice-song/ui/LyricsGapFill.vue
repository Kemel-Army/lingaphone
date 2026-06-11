<script setup lang="ts">
import type { LyricLine } from '~/entities/song'
import { usePracticeSong } from '../composables/usePracticeSong'
import type { GapResult } from '../composables/usePracticeSong'

const props = defineProps<{ lyrics: LyricLine[] }>()
const emit = defineEmits<{ done: [results: GapResult[]] }>()

const { checkGap } = usePracticeSong()

// Only lines with gaps need answers
const gapLines = computed(() => props.lyrics.filter(l => l.hasGap))
const userAnswers = ref<Record<number, string>>({})

// Track which gaps were checked
const checked = ref(false)
const results = ref<GapResult[]>([])

const allFilled = computed(() =>
  gapLines.value.every(l => (userAnswers.value[l.lineIndex] ?? '').trim().length > 0)
)

const checkAnswers = () => {
  results.value = gapLines.value.map((line) => {
    const ua = userAnswers.value[line.lineIndex] ?? ''
    const correct = checkGap(ua, line.gapAnswer ?? [])
    return {
      lineIndex: line.lineIndex,
      userAnswer: ua,
      correctAnswer: (line.gapAnswer ?? [])[0] ?? '',
      correct
    }
  })
  checked.value = true
}

const finish = () => emit('done', results.value)

// Map lineIndex → result for quick lookup in template
const resultMap = computed(() =>
  Object.fromEntries(results.value.map(r => [r.lineIndex, r]))
)

const correctCount = computed(() => results.value.filter(r => r.correct).length)
</script>

<template>
  <div class="space-y-1">
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
              v-model="userAnswers[line.lineIndex]"
              :disabled="checked"
              :placeholder="checked ? '' : '...'"
              class="inline-block w-28 rounded-lg border px-2 py-0.5 text-sm outline-none transition-all focus:ring-1"
              :class="checked
                ? resultMap[line.lineIndex]?.correct
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'border-default bg-default focus:border-primary focus:ring-primary/30'"
            >
          </template>

          <!-- Correct answer hint after check -->
          <span
            v-if="checked && !resultMap[line.lineIndex]?.correct"
            class="text-xs text-emerald-600 dark:text-emerald-400"
          >
            → {{ resultMap[line.lineIndex]?.correctAnswer }}
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
        :class="correctCount === gapLines.length
          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
          : correctCount >= gapLines.length * 0.7
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'"
      >
        <span class="flex items-center gap-2">
          <UIcon
            :name="correctCount === gapLines.length ? 'i-lucide-trophy' : 'i-lucide-check-circle'"
            class="size-4"
          />
          {{ correctCount }} / {{ gapLines.length }} правильных
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
