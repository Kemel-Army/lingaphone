<script setup lang="ts">
import type { ReadingTextWithProgress } from '../model/types'
import { READING_LEVEL_META, READING_GENRE_META, EFL_READING_WPM } from '../model/types'

const props = defineProps<{ text: ReadingTextWithProgress }>()

const levelMeta = computed(() => READING_LEVEL_META[props.text.level])
const genreMeta = computed(() => READING_GENRE_META[props.text.genre])

const readingMinutes = computed(() => {
  if (!props.text.wordCount) return null
  return Math.max(1, Math.round(props.text.wordCount / EFL_READING_WPM))
})

const isCompleted = computed(() => !!props.text.progress?.completedAt)
const scorePercent = computed(() => {
  const p = props.text.progress
  if (!p || !p.maxScore) return 0
  return Math.round((p.score / p.maxScore) * 100)
})
</script>

<template>
  <NuxtLink
    :to="`/student/reading/${text.id}`"
    class="group relative flex flex-col rounded-2xl border border-default bg-default p-4 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
    :class="isCompleted ? 'ring-1 ring-emerald-400/30' : ''"
  >
    <!-- Completed badge -->
    <div
      v-if="isCompleted"
      class="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
    >
      <UIcon
        name="i-lucide-check"
        class="size-3.5"
      />
    </div>

    <!-- Level + genre row -->
    <div class="mb-3 flex items-center gap-2">
      <span
        class="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black"
        :class="[levelMeta.bg, levelMeta.color]"
      >
        {{ text.level }}
      </span>
      <span class="flex items-center gap-1 text-xs text-muted">
        <UIcon
          :name="genreMeta.icon"
          class="size-3.5"
        />
        {{ genreMeta.label }}
      </span>
    </div>

    <!-- Title -->
    <h3 class="mb-2 line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
      {{ text.title }}
    </h3>

    <!-- Topic chip -->
    <p
      v-if="text.topic"
      class="mb-3 text-xs text-muted truncate"
    >
      {{ text.topic }}
    </p>

    <div class="mt-auto flex items-center gap-3 text-xs text-muted">
      <!-- Word count -->
      <span
        v-if="text.wordCount"
        class="flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-type"
          class="size-3.5"
        />
        {{ text.wordCount }} слов
      </span>

      <!-- Reading time -->
      <span
        v-if="readingMinutes"
        class="flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-clock"
          class="size-3.5"
        />
        ~{{ readingMinutes }} мин
      </span>

      <!-- Vocab count -->
      <span
        v-if="text.vocabulary?.length"
        class="flex items-center gap-1 ml-auto"
      >
        <UIcon
          name="i-lucide-bookmark"
          class="size-3.5"
        />
        {{ text.vocabulary.length }}
      </span>
    </div>

    <!-- Score bar (if attempted) -->
    <div
      v-if="text.progress && !isCompleted"
      class="mt-3"
    >
      <div class="h-1 w-full overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full bg-linear-to-r"
          :class="`${levelMeta.gradient}`"
          :style="{ width: `${scorePercent}%` }"
        />
      </div>
    </div>
  </NuxtLink>
</template>
