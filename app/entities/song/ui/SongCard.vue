<script setup lang="ts">
import type { SongWithProgress } from '../model/types'
import { SONG_LEVEL_META, SONG_GENRE_LABELS } from '../model/types'

const props = defineProps<{ song: SongWithProgress }>()

const levelMeta = computed(() => SONG_LEVEL_META[props.song.level])
const gapCount = computed(() => props.song.lyrics.filter(l => l.hasGap).length)
const isCompleted = computed(() => !!props.song.progress?.completedAt)
const scorePercent = computed(() => {
  const p = props.song.progress
  if (!p || !p.maxScore) return 0
  return Math.round((p.score / p.maxScore) * 100)
})
</script>

<template>
  <NuxtLink
    :to="`/student/songs/${song.id}`"
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

    <!-- YouTube thumbnail placeholder -->
    <div
      class="mb-3 flex h-20 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br opacity-80"
      :class="levelMeta.gradient"
    >
      <UIcon
        name="i-lucide-music"
        class="size-8 text-white drop-shadow"
      />
    </div>

    <!-- Level + genre row -->
    <div class="mb-2 flex items-center gap-2">
      <span
        class="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black"
        :class="[levelMeta.bg, levelMeta.color]"
      >
        {{ song.level }}
      </span>
      <span
        v-if="song.genre"
        class="text-xs text-muted"
      >
        {{ SONG_GENRE_LABELS[song.genre] }}
      </span>
    </div>

    <!-- Title + artist -->
    <h3 class="line-clamp-1 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
      {{ song.title }}
    </h3>
    <p class="mt-0.5 text-xs text-muted truncate">{{ song.artist }}</p>

    <!-- Gap count -->
    <div class="mt-3 flex items-center gap-1 text-xs text-muted">
      <UIcon
        name="i-lucide-underline"
        class="size-3.5"
      />
      {{ gapCount }} пропусков
      <span
        v-if="song.vocabulary?.length"
        class="ml-auto flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-bookmark"
          class="size-3.5"
        />
        {{ song.vocabulary.length }}
      </span>
    </div>

    <!-- Score bar -->
    <div
      v-if="song.progress && !isCompleted"
      class="mt-3"
    >
      <div class="h-1 w-full overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full bg-linear-to-r transition-all"
          :class="levelMeta.gradient"
          :style="{ width: `${scorePercent}%` }"
        />
      </div>
    </div>
  </NuxtLink>
</template>
