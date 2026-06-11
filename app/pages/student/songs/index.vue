<script setup lang="ts">
import { SongCard, useSongs, useSongProgress, SONG_LEVEL_META, SONG_GENRE_LABELS } from '~/entities/song'
import type { SongLevel, SongGenre, SongWithProgress } from '~/entities/song'

definePageMeta({ layout: 'dashboard' })

const { fetchSongs } = useSongs()
const { fetchMyProgress } = useSongProgress()

const { data, pending } = useAsyncData('songs-index', async () => {
  const [songs, progress] = await Promise.all([fetchSongs(), fetchMyProgress()])
  return { songs, progress }
})

const LEVELS: SongLevel[] = ['A2', 'B1', 'B2']
const GENRES = Object.keys(SONG_GENRE_LABELS) as SongGenre[]

const activeLevel = ref<SongLevel | 'all'>('all')
const activeGenre = ref<SongGenre | 'all'>('all')

const songsWithProgress = computed((): SongWithProgress[] => {
  const progressMap = new Map((data.value?.progress ?? []).map(p => [p.songId, p]))
  return (data.value?.songs ?? []).map(s => ({
    ...s,
    progress: progressMap.get(s.id) ?? null
  }))
})

const filtered = computed(() =>
  songsWithProgress.value.filter((s) => {
    if (activeLevel.value !== 'all' && s.level !== activeLevel.value) return false
    if (activeGenre.value !== 'all' && s.genre !== activeGenre.value) return false
    return true
  })
)

const totalCompleted = computed(() =>
  songsWithProgress.value.filter(s => !!s.progress?.completedAt).length
)
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Blobs -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 -translate-x-1/2 rounded-full bg-violet-400/15 blur-3xl" />
      <div class="absolute top-20 right-10 size-64 rounded-full bg-pink-400/10 blur-3xl" />
    </div>

    <div class="mx-auto max-w-5xl p-4 pb-16 sm:p-6 lg:p-8">
      <!-- Header -->
      <header class="mb-8 text-center">
        <p class="text-sm font-bold uppercase tracking-widest text-primary">
          🎵 Songs Practice
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Учим английский через песни
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-muted">
          Слушай, заполняй пропуски, учи сленг и идиомы из реальных песен.
        </p>

        <div
          v-if="!pending && songsWithProgress.length > 0"
          class="mt-5 inline-flex items-center gap-3 rounded-full border border-default bg-default px-5 py-2 shadow-sm"
        >
          <UIcon
            name="i-lucide-music"
            class="size-5 text-primary"
          />
          <div class="text-sm">
            <span class="font-bold">{{ totalCompleted }}</span>
            <span class="text-muted"> / {{ songsWithProgress.length }} песен разучено</span>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <!-- Level -->
        <div class="flex items-center gap-1.5 rounded-xl border border-default bg-default p-1">
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            :class="activeLevel === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="activeLevel = 'all'"
          >
            Все
          </button>
          <button
            v-for="lvl in LEVELS"
            :key="lvl"
            class="rounded-lg px-3 py-1.5 text-xs font-black transition-all"
            :class="activeLevel === lvl
              ? [SONG_LEVEL_META[lvl].bg, SONG_LEVEL_META[lvl].color]
              : 'text-muted hover:text-default'"
            @click="activeLevel = lvl"
          >
            {{ lvl }}
          </button>
        </div>

        <!-- Genre -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            class="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
            :class="activeGenre === 'all'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-default text-muted hover:border-primary/40'"
            @click="activeGenre = 'all'"
          >
            Все жанры
          </button>
          <button
            v-for="g in GENRES"
            :key="g"
            class="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
            :class="activeGenre === g
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-default text-muted hover:border-primary/40'"
            @click="activeGenre = g"
          >
            {{ SONG_GENRE_LABELS[g] }}
          </button>
        </div>

        <p
          v-if="!pending"
          class="ml-auto text-sm text-muted"
        >
          {{ filtered.length }} {{ filtered.length === 1 ? 'песня' : 'песен' }}
        </p>
      </div>

      <!-- Skeleton -->
      <div
        v-if="pending"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="skeleton h-52 rounded-2xl"
        />
      </div>

      <!-- Grid -->
      <div
        v-else-if="filtered.length"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        <SongCard
          v-for="song in filtered"
          :key="song.id"
          :song="song"
        />
      </div>

      <EmptyState
        v-else
        icon="i-lucide-music"
        title="Песни не найдены"
        description="Попробуй изменить фильтры — новые песни добавляются регулярно"
      />
    </div>
  </div>
</template>
